#Requires -Version 7.3
<#
Owner-only managed development-server lane. Docker is controlled from Windows,
never from the command-worker container or ChatGPT. Project subpath isolation
prevents mounting /workspace/.auth and sibling repositories into dev services.
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact='Medium')]
param(
  [Parameter(Mandatory)]
  [ValidateSet('Start','Stop','Status','Logs','Remove')]
  [string]$Action,
  [Parameter(Mandatory)]
  [ValidatePattern('^[a-z][a-z0-9-]{1,48}$')]
  [string]$Project,
  [ValidateRange(3000,9000)][int]$ContainerPort = 3000,
  [ValidateRange(10000,19999)][int]$HostPort = 13000,
  [ValidateSet('Next','Vite')][string]$Framework = 'Next',
  [ValidateSet('npm','pnpm')][string]$PackageManager = 'npm',
  [string]$WorkspaceVolume = 'ai-dev-sandbox-workspace',
  [string]$MainContainer = 'ai-dev-workspace',
  [ValidateRange(1,200)][int]$LogLines = 50
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
$name = "ai-dev-$Project"
$label = 'io.cartshift.sandbox.managed=dev-service-v1'
$guardLabel = 'io.cartshift.sandbox.project-guard=mountinfo-v1'

function Docker {
  $Arguments=@($args | ForEach-Object { $_ })
  $result = @(Invoke-HostDocker @Arguments 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "Docker operation failed (exit $LASTEXITCODE)." }
  return $result
}
function Wait-ProjectMountGuard {
  for($attempt=0;$attempt -lt 30;$attempt++){
    $state=((Docker @('inspect','--format','{{json .State}}',$name)) -join '')|ConvertFrom-Json
    if($state.Paused){throw 'Managed service paused for owner maintenance; verification deferred.'}
    if($state.Running){
      Invoke-HostDocker exec --user 1000:1000 $name /usr/bin/test -f /tmp/cartshift-project-mount-verified *> $null
      if($LASTEXITCODE -eq 0){return}
    }
    Start-Sleep -Milliseconds 250
  }
  Docker @('stop','--time','5',$name)|Out-Null
  throw 'Project mount guard or application startup failed; container retained stopped.'
}
function Existing() {
  $id = @(Invoke-HostDocker container ls -aq --filter "name=^/$name$" 2>$null)
  if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop is unavailable.' }
  if (-not $id) { return $false }
  $owner = ((Docker @('inspect','--format','{{index .Config.Labels "io.cartshift.sandbox.managed"}}',$name)) -join '').Trim()
  if ($owner -ne 'dev-service-v1') { throw 'Refusing to manage an unrecognized container.' }
  $spec=Get-SandboxSpec $name
  Assert-SandboxRestrictions $spec -AllowLoopbackPorts
  Assert-SandboxMount $spec '/app' $WorkspaceVolume $true
  if (@($spec.mounts | Where-Object { $_.Type -eq 'volume' }).Count -ne 1) { throw 'Unexpected dev-service mount.' }
  $raw=Invoke-SandboxDocker inspect --format '{{json .HostConfig.Mounts}}' $name
  $declared=$raw | ConvertFrom-Json
  $projectMount=@($declared | Where-Object { $_.Target -eq '/app' -and $_.VolumeOptions.Subpath -eq "projects/$Project" })
  if ($projectMount.Count -ne 1) { throw 'Dev-service project subpath mismatch.' }
  if (-not $spec.host.PortBindings) { throw 'Missing dev-service loopback listener.' }
  $ports=@($spec.host.PortBindings.PSObject.Properties)
  if ($ports.Count -ne 1 -or @($ports[0].Value).Count -ne 1 -or $ports[0].Value[0].HostIp -ne '127.0.0.1') { throw 'Dev-service listener is not owner loopback-only.' }

  return $true
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI missing.' }

switch ($Action) {
  'Status' {
    if (-not (Existing)) { Write-Output '{"state":"absent"}'; return }
    $info = (Docker @('inspect','--format','{{json .State}}',$name)) -join ''
    $state = $info | ConvertFrom-Json
    [pscustomobject]@{ name=$name; running=$state.Running; status=$state.Status;
      restart_count=[int]((Docker @('inspect','--format','{{.RestartCount}}',$name)) -join ''); exit_code=$state.ExitCode } | ConvertTo-Json
  }
  'Logs' {
    if (-not (Existing)) { throw 'Service not found.' }
    Write-Warning 'Logs may include application secrets; view locally and never paste tokens into chat.'
    Invoke-HostDocker logs --tail $LogLines $name
    if ($LASTEXITCODE -ne 0) { throw 'Log read failed.' }
  }
  'Stop' {
    if (-not (Existing)) { throw 'Service not found.' }
    if ($PSCmdlet.ShouldProcess($name,'Stop managed development server')) { Docker @('stop','--time','10',$name) | Out-Null }
  }
  'Remove' {
    if (-not (Existing)) { throw 'Service not found.' }
    if ($PSCmdlet.ShouldProcess($name,'Remove managed dev container (project volume preserved)')) {
      Docker @('rm','--force',$name) | Out-Null
      Write-Output 'Managed container removed; source project volume was preserved.'
    }
  }
  'Start' {
    if (Existing) {
      $guard=((Docker @('inspect','--format','{{index .Config.Labels "io.cartshift.sandbox.project-guard"}}',$name)) -join '').Trim()
      if($guard -ne 'mountinfo-v1'){throw 'Existing service predates project mount guard; preserve it and create a guarded replacement.'}
      $running = ((Docker @('inspect','--format','{{.State.Running}}',$name)) -join '').Trim()
      if ($running -eq 'true') { Write-Output "$name already running."; return }
      if ($PSCmdlet.ShouldProcess($name,'Restart managed dev container')) {
        Docker @('start',$name) | Out-Null
        Wait-ProjectMountGuard
      }
      return
    }
    $present = ((Docker @('volume','inspect','--format','{{.Name}}',$WorkspaceVolume)) -join '').Trim()
    if ($present -ne $WorkspaceVolume) { throw 'Expected workspace volume not found.' }
    $source=Get-SandboxSpec $MainContainer
    Assert-SandboxRestrictions $source
    Assert-SandboxMount $source '/workspace' $WorkspaceVolume $true
    $imageId=$source.image
    Assert-SandboxImage $imageId
    if ($imageId -notmatch '^sha256:[0-9a-f]{64}$') { throw 'Main sandbox image cannot be pinned.' }
    # Read the canonical kernel volume root from the verified primary runtime.
    # Docker follows volume-subpath symlinks: only the actual pinned mount seen
    # inside the new service can authorize execution, avoiding a preflight race.
    $kernelRoot=((Docker @('exec','--user','1000:1000',$MainContainer,'/usr/bin/python3','-I','-c','from pathlib import Path; r=[x.split() for x in Path("/proc/self/mountinfo").read_text().splitlines() if x.split()[4]=="/workspace"]; assert len(r)==1; print(r[0][3])')) -join '').Trim()
    if($kernelRoot -cnotmatch '^/[A-Za-z0-9_./-]+$'){throw 'Unsupported canonical workspace mount root.'}
    $subpath = "projects/$Project"
    $mount = "type=volume,source=$WorkspaceVolume,target=/app,volume-subpath=$subpath"
    $command = if ($Framework -eq 'Next') {
      "exec $PackageManager run dev -- --hostname 0.0.0.0 --port $ContainerPort"
    } else {
      "exec $PackageManager run dev -- --host 0.0.0.0 --port $ContainerPort"
    }
    $expectedRoot=$kernelRoot.TrimEnd('/')+'/'+$subpath
    $mountGuard = 'import os,pathlib,sys; r=[x.split() for x in pathlib.Path("/proc/self/mountinfo").read_text().splitlines() if len(x.split())>5 and x.split()[4]=="/app"]; assert len(r)==1 and r[0][3]==sys.argv[1], "Project mount mismatch"; fd=os.open("/tmp/cartshift-project-mount-verified",os.O_CREAT|os.O_WRONLY|os.O_TRUNC|os.O_NOFOLLOW,0o600); os.write(fd,b"v1"); os.close(fd)'
    $command="/usr/bin/python3 -I -c '$mountGuard' '$expectedRoot' && $command"
    $args = @('run','--detach','--init','--name',$name,
      '--restart','unless-stopped','--user','1000:1000',
      '--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',
      '--pids-limit','200','--memory','2g','--cpus','2',
      '--tmpfs','/tmp:rw,nosuid,nodev,size=256m',
      '--env','HOME=/tmp','--env','npm_config_cache=/tmp/.npm',
      '--env','COREPACK_HOME=/tmp/.cache/corepack',
      '--mount',$mount,'--workdir','/app',
      '--publish',"127.0.0.1:${HostPort}:${ContainerPort}",
      '--label','sandbox.owner=ai-dev-sandbox','--log-opt','max-size=5m','--log-opt','max-file=3',
      '--add-host','host.docker.internal:127.0.0.1','--add-host','gateway.docker.internal:127.0.0.1',
      '--label',$label,'--label',$guardLabel,'--entrypoint','/bin/sh',$imageId,
      '-c',$command)
    if ($PSCmdlet.ShouldProcess($name,"Create managed dev container with loopback-only preview port $HostPort")) {
      Docker $args | Out-Null
      Wait-ProjectMountGuard
      Write-Output "$name started. Host-only URL: http://127.0.0.1:$HostPort"
      Write-Output 'No provider authentication volume or Docker socket was mounted.'
    }
  }
}