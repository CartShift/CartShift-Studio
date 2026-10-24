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

function Docker {
  $Arguments=@($args | ForEach-Object { $_ })
  $result = @(Invoke-HostDocker @Arguments 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "Docker operation failed (exit $LASTEXITCODE)." }
  return $result
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
      $running = ((Docker @('inspect','--format','{{.State.Running}}',$name)) -join '').Trim()
      if ($running -eq 'true') { Write-Output "$name already running."; return }
      if ($PSCmdlet.ShouldProcess($name,'Restart managed dev container')) {
        Docker @('start',$name) | Out-Null
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
    # Validate project existence through an ephemeral process with NO network,
    # only the target subtree mounted. Docker itself rejects a missing volume-subpath.
    $subpath = "projects/$Project"
    $mount = "type=volume,source=$WorkspaceVolume,target=/app,volume-subpath=$subpath"
    $command = if ($Framework -eq 'Next') {
      "exec $PackageManager run dev -- --hostname 0.0.0.0 --port $ContainerPort"
    } else {
      "exec $PackageManager run dev -- --host 0.0.0.0 --port $ContainerPort"
    }
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
      '--label',$label,'--entrypoint','/bin/sh',$imageId,
      '-c',$command)
    if ($PSCmdlet.ShouldProcess($name,"Create managed dev container with loopback-only preview port $HostPort")) {
      Docker $args | Out-Null
      Write-Output "$name started. Host-only URL: http://127.0.0.1:$HostPort"
      Write-Output 'No provider authentication volume or Docker socket was mounted.'
    }
  }
}
