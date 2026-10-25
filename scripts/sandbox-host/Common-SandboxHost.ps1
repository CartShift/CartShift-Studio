#Requires -Version 7.3
# Owner-only local Docker Desktop boundary. Never inherit a remote context.
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
function Initialize-SandboxHost {
  if ($env:DOCKER_HOST -or $env:DOCKER_CONTEXT -or $env:BUILDX_BUILDER) { throw 'Unset Docker endpoint overrides before using the local sandbox.' }
  $found=Get-Command docker.exe -ErrorAction SilentlyContinue
  if ($found) { $script:SandboxDockerExe=$found.Source }
  else {
    $candidates=@(
      (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'),
      (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker.exe')
    )
    $script:SandboxDockerExe=$candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
  }
  if (-not $script:SandboxDockerExe -or -not [IO.Path]::IsPathFullyQualified($script:SandboxDockerExe)) { throw 'An absolute local Docker Desktop executable is required.' }
  $contextRaw=& $script:SandboxDockerExe context inspect
  if ($LASTEXITCODE -ne 0) { throw 'Docker context unavailable.' }
  $context=@($contextRaw | ConvertFrom-Json)
  if ($context.Count -ne 1 -or $context[0].Endpoints.docker.Host -cnotmatch '^npipe:/{4}[.]/pipe/[A-Za-z0-9_.-]+$') { throw 'Only local Docker Desktop named pipes are allowed.' }
  $script:SandboxDockerEndpoint=$context[0].Endpoints.docker.Host
  $info=Invoke-HostDocker info --format '{{json .}}' | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) { throw [IO.IOException]::new('Local Docker Desktop is unavailable.') }
  if ($info.OSType -ne 'linux' -or $info.Architecture -notin @('aarch64','arm64')) { throw 'Local Linux ARM64 Docker Desktop required.' }
}
function Invoke-HostDocker {
  $output=$input | & $script:SandboxDockerExe --host $script:SandboxDockerEndpoint @args
  $global:LASTEXITCODE=$LASTEXITCODE
  return $output
}
function Get-SandboxSpec([string]$Name) {
  # Do not return Config.Env or full inspect output: those may contain secrets.
  $format='{"image":{{json .Image}},"user":{{json .Config.User}},"hostname":{{json .Config.Hostname}},"labels":{{json .Config.Labels}},"host":{{json .HostConfig}},"mounts":{{json .Mounts}},"running":{{json .State.Running}},"paused":{{json .State.Paused}}}'
  $raw=Invoke-HostDocker inspect --format $format $Name
  if ($LASTEXITCODE -ne 0) { throw 'Expected sandbox container absent.' }
  $spec=$raw | ConvertFrom-Json
  if ($spec.labels.'sandbox.owner' -ne 'ai-dev-sandbox' -or $spec.image -notmatch '^sha256:[a-f0-9]{64}$') { throw 'Sandbox owner or image identity mismatch.' }
  return $spec
}
function Assert-SandboxRestrictions($Spec,[switch]$AllowLoopbackPorts) {
  if (!$AllowLoopbackPorts -and $Spec.host.PortBindings -and @($Spec.host.PortBindings.PSObject.Properties).Count) { throw 'Worker containers must not publish ports.' }
  if ($Spec.user -notin @('1000:1000','1000','node') -or -not $Spec.host.ReadonlyRootfs -or $Spec.host.Privileged -or
      @($Spec.host.CapDrop | Where-Object { $_ -eq 'ALL' }).Count -ne 1 -or @($Spec.host.CapAdd | Where-Object { $_ }).Count -gt 0 -or
      ($Spec.host.PidMode -or $Spec.host.UTSMode -or $Spec.host.UsernsMode -or $Spec.host.IpcMode -ne 'private') -or
      ($Spec.host.NetworkMode -eq 'host' -or $Spec.host.NetworkMode -like 'container:*') -or
      -not @($Spec.host.SecurityOpt | Where-Object { $_ -match '^no-new-privileges(:true)?$' }).Count) { throw 'Sandbox privilege configuration mismatch.' }
  if (@($Spec.mounts | Where-Object { $_.Type -notin @('volume','tmpfs') -or $_.Destination -match 'docker.sock' }).Count) { throw 'Unexpected host or non-volume mount.' }
}
function Assert-SandboxMount($Spec,[string]$Destination,[string]$Volume,[bool]$Writable) {
  $found=@($Spec.mounts | Where-Object { $_.Destination -eq $Destination -and $_.Type -eq 'volume' -and $_.Name -eq $Volume -and $_.RW -eq $Writable })
  if ($found.Count -ne 1) { throw "Unexpected mount identity: $Destination" }
}
function Assert-SandboxImage([string]$Image) {
  $raw=Invoke-HostDocker image inspect --format '{{json .Config.Volumes}}' $Image
  if ($LASTEXITCODE -ne 0) { throw 'Sandbox image is unavailable.' }
  if ($raw.Trim() -ne 'null' -and $raw.Trim() -ne '{}') { throw 'Image declares implicit volumes; review an explicit complete mount plan first.' }
}
function New-SandboxVolume([string]$Name) {
  Invoke-HostDocker volume inspect $Name *> $null
  if ($LASTEXITCODE -eq 0) { throw "Refusing to reuse an existing destination volume: $Name" }
  Invoke-HostDocker volume create --label sandbox.owner=ai-dev-sandbox $Name | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Volume creation failed.' }
}
Initialize-SandboxHost

function Invoke-SandboxDocker {
 $v=Invoke-HostDocker @args
 if ($LASTEXITCODE -ne 0) { throw 'Local Docker operation failed.' }
 return $v
}
function Assert-SandboxVolumeQuiescent([string]$Name) {
 $writers=@(Invoke-HostDocker ps --filter "volume=$Name" --format '{{.Names}}')
 if ($LASTEXITCODE -ne 0 -or @($writers | Where-Object { $_ }).Count) { throw 'Stop all source-volume users and their supervisors before snapshotting.' }
}

function Assert-SandboxVolumeOwner([string]$Name) {
 $raw=Invoke-SandboxDocker volume inspect --format '{{json .Labels}}' $Name
 $labels=$raw | ConvertFrom-Json
 if (-not $labels -or $labels.'sandbox.owner' -ne 'ai-dev-sandbox') { throw 'Volume owner identity mismatch.' }
}