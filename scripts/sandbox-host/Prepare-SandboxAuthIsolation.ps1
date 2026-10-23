#Requires -Version 7.3
<#
Staged credential isolation. Prepare makes copies without changing the live
sandbox. The destructive finalize stage is deliberately gated by explicit
owner verification and never reads or prints a provider credential.
#>
[CmdletBinding(SupportsShouldProcess,ConfirmImpact='High')]
param(
  [Parameter(Mandatory)][ValidateSet('Prepare','CreateSidecar','Verify','Finalize')]
  [string]$Action,
  [string]$WorkspaceVolume='ai-dev-sandbox-workspace',
  [string]$AuthVolume='ai-dev-sandbox-provider-auth',
  [string]$ToolsVolume='ai-dev-sandbox-auth-tools',
  [string]$BuildContainer='ai-docker-sandbox',
  [string]$AuthContainer='ai-auth-sandbox',
  [switch]$RestoreVerified,
  [switch]$AuthWorkerVerified,
  [switch]$AuthTokenEnforced
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$image='busybox:1.36.1'
function Docker([string[]]$argv) {
  $output=@(& docker @argv 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "Docker command failed (exit $LASTEXITCODE)." }
  return $output
}
function ExistingVolume([string]$name) {
  & docker volume inspect $name *> $null
  return $LASTEXITCODE -eq 0
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI required.' }
if (-not (ExistingVolume $WorkspaceVolume)) { throw 'Existing workspace volume not found.' }
$imageId=((Docker @('inspect','--format','{{.Image}}',$BuildContainer)) -join '').Trim()
if ($imageId -notmatch '^sha256:[0-9a-f]{64}$') { throw 'Cannot identify the pinned sandbox image.' }

switch ($Action) {
  'Prepare' {
    if ((ExistingVolume $AuthVolume) -or (ExistingVolume $ToolsVolume)) {
      throw 'Destination volumes already exist; do not overwrite an existing credential snapshot.'
    }
    if ($PSCmdlet.ShouldProcess("$AuthVolume + $ToolsVolume",'Create isolated copies of current credential and CLI homes')) {
      Docker @('image','inspect',$image) | Out-Null
      Docker @('volume','create',$AuthVolume) | Out-Null
      Docker @('volume','create',$ToolsVolume) | Out-Null
      $auth="type=volume,source=$AuthVolume,target=/auth"
      $tools="type=volume,source=$ToolsVolume,target=/tools"
      # Init root-owned volume directory once, with only CHOWN permission.
      Docker @('run','--rm','--network','none','--cap-drop','ALL','--cap-add','CHOWN',
        '--security-opt','no-new-privileges','--mount',$auth,'--mount',$tools,
        $image,'sh','-ec','chown 1000:1000 /auth /tools') | Out-Null
      # All secret copying happens inside a short-lived, networkless UID1000
      # helper. Nothing is written to the Windows filesystem or output logs.
      $src="type=volume,source=$WorkspaceVolume,target=/source,readonly"
      $copy=@('set -eu','test -d /source/.auth','test -x /source/scripts/devctl',
        'test -d /source/toolchain',
        'mkdir -p /tools/toolchain /tools/scripts',
        'cd /source/.auth && tar -cf - . | tar -xf - -C /auth',
        'cd /source/toolchain && tar -cf - . | tar -xf - -C /tools/toolchain',
        'cp /source/scripts/devctl /tools/scripts/devctl',
        'chmod 700 /tools/scripts/devctl',
        'test -d /auth/github && test -x /tools/scripts/devctl') -join '; '
      Docker @('run','--rm','--user','1000:1000','--network','none','--read-only',
        '--cap-drop','ALL','--security-opt','no-new-privileges',
        '--mount',$src,'--mount',$auth,'--mount',$tools,$image,'sh','-ec',$copy) | Out-Null
      Write-Output 'Prepared isolated credential and toolchain volumes; live container unchanged.'
      Write-Output 'Review CLI binary hashes before enabling the isolated auth worker.'
    }
  }
  'CreateSidecar' {
    if (-not (ExistingVolume $AuthVolume) -or -not (ExistingVolume $ToolsVolume)) {
      throw 'Run Prepare first.'
    }
    & docker container inspect $AuthContainer *> $null
    if ($LASTEXITCODE -eq 0) { throw 'Auth sidecar already exists; refusing to overwrite.' }
    if ($PSCmdlet.ShouldProcess($AuthContainer,'Create isolated OAuth sidecar with private credential volume')) {
      $args=@('run','--detach','--name',$AuthContainer,'--hostname',$AuthContainer,
        '--user','1000:1000','--read-only','--restart','unless-stopped',
        '--cap-drop','ALL','--security-opt','no-new-privileges',
        '--pids-limit','120','--memory','1g','--cpus','1',
        '--tmpfs','/tmp:rw,nosuid,nodev,size=128m',
        '--mount',"type=volume,source=$AuthVolume,target=/workspace/.auth",
        '--mount',"type=volume,source=$ToolsVolume,target=/workspace/scripts,volume-subpath=scripts,readonly",
        '--mount',"type=volume,source=$ToolsVolume,target=/workspace/toolchain,volume-subpath=toolchain,readonly",
        '--label','io.cartshift.sandbox.auth=isolated-v1',
        '--entrypoint','/bin/sh',$imageId,'-c','sleep infinity')
      Docker $args | Out-Null
      Write-Output 'Isolated auth sidecar created without a projects mount or Docker socket.'
      Write-Output 'Install a separately authenticated, hash-verified auth-only worker before enforcing token separation.'
    }
  }
  'Verify' {
    $labels=((Docker @('inspect','--format','{{index .Config.Labels "io.cartshift.sandbox.auth"}}',$AuthContainer)) -join '').Trim()
    if ($labels -ne 'isolated-v1') { throw 'Container identity mismatch.' }
    $mounts=((Docker @('inspect','--format','{{json .Mounts}}',$AuthContainer)) -join '') | ConvertFrom-Json
    $paths=@($mounts | ForEach-Object Destination)
    if ('/workspace/.auth' -notin $paths -or '/workspace/scripts' -notin $paths -or '/workspace/toolchain' -notin $paths) {
      throw 'Required isolated mounts absent.'
    }
    if (@($paths | Where-Object { $_ -match '/projects|docker.sock' }).Count) {
      throw 'Auth worker has forbidden project/Docker mounts.'
    }
    Docker @('exec',$AuthContainer,'sh','-ec',
      'test "$(id -u)" = 1000 && test -d /workspace/.auth/github && test -x /workspace/scripts/devctl && test ! -e /workspace/projects') | Out-Null
    Write-Output 'Auth sidecar identity, mount isolation and UID validated (credential content not printed).'
  }
  'Finalize' {
    if (-not ($RestoreVerified -and $AuthWorkerVerified -and $AuthTokenEnforced)) {
      throw 'Require off-host verified restore, working auth worker and enforced separate session token.'
    }
    $running=((Docker @('inspect','--format','{{.State.Running}}',$BuildContainer)) -join '').Trim()
    if ($running -ne 'false') { throw 'STOP the main sandbox and old supervisor before finalizing.' }
    if ($PSCmdlet.ShouldProcess("$WorkspaceVolume/.auth",
        'IRREVERSIBLY erase OLD live credential copies from the development volume')) {
      $mnt="type=volume,source=$WorkspaceVolume,target=/data"
      # This deletion is opt-in only AFTER backups, isolated auth login, and
      # backend token enforcement have been verified by the owner.
      Docker @('run','--rm','--user','1000:1000','--network','none',
        '--cap-drop','ALL','--security-opt','no-new-privileges',
        '--mount',$mnt,$image,'sh','-ec',
        'test -d /data/.auth; rm -rf /data/.auth; test ! -e /data/.auth') | Out-Null
      Write-Output 'Old credential files erased from live workspace (not from historical backups).'
      Write-Output 'Restart the main worker in role=build and rotate any formerly shared tokens.'
    }
  }
}
