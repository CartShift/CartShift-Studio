#Requires -Version 7.3
<#
.SYNOPSIS
  Stage a credential-isolated Remote Desktop Commander device beside the V5 pool.
.DESCRIPTION
  Creates a separate, capped Docker container. It NEVER installs an MCP agent on
  Windows and NEVER mounts the Windows host, provider credential volume, or Docker
  socket. Remote device pairing is an explicit owner action.
  Use Prepare, Verify, Start, Logs, Stop. No action deletes existing data.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
 [ValidateSet('Prepare','Verify','Start','Stop','Logs')][string]$Action='Verify',
 [ValidatePattern('^[a-z][a-z0-9-]{2,40}$')][string]$Name='ai-dev-sandbox-dc-remote',
 [ValidatePattern('^[a-z][a-z0-9-]{2,60}$')][string]$SourceContainer='ai-dev-pool-1',
 [ValidatePattern('^[a-z][a-z0-9-]{2,60}$')][string]$WorkspaceVolume='ai-dev-sandbox-workspace',
 [ValidatePattern('^[a-z][a-z0-9-]{2,60}$')][string]$CredentialShadow='ai-dev-pool-empty-auth',
 [switch]$AcknowledgeThirdPartyRelay
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')

$source=Get-SandboxSpec $SourceContainer
Assert-SandboxRestrictions $source
Assert-SandboxMount $source '/workspace' $WorkspaceVolume $true
Assert-SandboxMount $source '/workspace/.auth' $CredentialShadow $false
Assert-SandboxImage $source.image
Assert-SandboxVolumeOwner $WorkspaceVolume
Assert-SandboxVolumeOwner $CredentialShadow
if ($source.host.NetworkMode -in @('host','none','') -or $source.host.NetworkMode -like 'container:*') {
 throw 'Remote sidecar requires the existing restricted outbound Docker network.'
}
$homeVolume="$Name-home"
$remoteEntry='/opt/dc/node_modules/@wonderwhy-er/desktop-commander/dist/index.js'
$expectedCmd=@('node',$remoteEntry,'remote','--disable-no-sleep')

if ($Action -eq 'Prepare') {
 if (!$AcknowledgeThirdPartyRelay) {
  throw 'Opt-in required: this agent relays commands, paths and results through the external Desktop Commander Remote MCP service.'
 }
 # Fail closed on existing destinations. Do not overwrite a paired device or home.
 Invoke-HostDocker container inspect $Name *> $null
 if ($LASTEXITCODE -eq 0) { throw 'Container exists. Use Verify; never replace it through Prepare.' }
 Invoke-HostDocker volume inspect $homeVolume *> $null
 if ($LASTEXITCODE -eq 0) { throw 'Home exists. Refusing to replace or reuse pairing state.' }
 $limits=Invoke-SandboxDocker info --format '{{json .}}' | ConvertFrom-Json
 $allocated=[long]0
 $cpus=0.0
 foreach ($runningName in @(Invoke-SandboxDocker ps --format '{{.Names}}')) {
  $hc=Invoke-SandboxDocker inspect --format '{{json .HostConfig}}' $runningName | ConvertFrom-Json
  if ($hc.Memory -le 0) { throw 'Unbounded running container: refuse additional allocation.' }
  $allocated += [long]$hc.Memory
  $cpus += [double]$hc.NanoCpus / 1e9
 }
 if ($allocated + 512MB -gt [long]$limits.MemTotal - 2GB -or $cpus + 1 -gt [double]$limits.NCPU) {
  throw 'Insufficient Docker resource budget.'
 }
 # The pinned image must already contain the audited Desktop Commander package.
 # Never download or execute an unpinned third-party package during Prepare.
 Invoke-SandboxDocker run --rm --network none --read-only --user 1000:1000 --cap-drop ALL --security-opt no-new-privileges --pids-limit 32 --memory 128m $source.image python3 -I -c 'import os; assert os.path.isfile("/opt/dc/node_modules/@wonderwhy-er/desktop-commander/dist/index.js")' | Out-Null
 if ($PSCmdlet.ShouldProcess($Name,'Create isolated remote agent container and dedicated home')) {
  New-SandboxVolume $homeVolume
  # Initialize ONLY this new empty labelled volume. Never change workspace ownership.
  Invoke-SandboxDocker run --rm --network none --user 0:0 --read-only --cap-drop ALL --cap-add CHOWN --security-opt no-new-privileges --pids-limit 32 --memory 128m --mount "type=volume,source=$homeVolume,target=/home/node" $source.image python3 -I -c 'import os; p="/home/node"; assert os.listdir(p)==[]; os.chown(p,1000,1000)' | Out-Null
  Invoke-SandboxDocker create --name $Name --workdir /workspace --hostname ai-docker-sandbox --network $source.host.NetworkMode --user 1000:1000 --read-only --restart unless-stopped --cap-drop ALL --security-opt no-new-privileges --pids-limit 128 --memory 512m --memory-swap 512m --cpus 1 --tmpfs '/tmp:rw,nosuid,nodev,size=128m,mode=1777' --tmpfs '/run:rw,nosuid,nodev,noexec,size=16m,mode=755' --log-opt max-size=5m --log-opt max-file=3 --add-host host.docker.internal:127.0.0.1 --add-host gateway.docker.internal:127.0.0.1 --mount "type=volume,source=$WorkspaceVolume,target=/workspace" --mount "type=volume,source=$CredentialShadow,target=/workspace/.auth,readonly,volume-nocopy" --mount "type=volume,source=$homeVolume,target=/home/node" --label sandbox.owner=ai-dev-sandbox --label io.cartshift.sandbox.dc-role=remote --env HOME=/home/node --env XDG_CONFIG_HOME=/home/node/.config $source.image @expectedCmd | Out-Null
 }
 if ($WhatIfPreference) { return }
}
$spec=Get-SandboxSpec $Name
Assert-SandboxRestrictions $spec
if ($spec.image -ne $source.image -or $spec.hostname -ne 'ai-docker-sandbox' -or
    $spec.labels.'io.cartshift.sandbox.dc-role' -ne 'remote' -or
    $spec.host.NetworkMode -ne $source.host.NetworkMode -or
    $spec.host.Memory -ne 512MB -or $spec.host.MemorySwap -ne 512MB -or
    $spec.host.NanoCpus -ne 1e9 -or $spec.host.PidsLimit -ne 128 -or
    @($spec.mounts).Count -ne 3) {
 throw 'Remote agent image, topology, privileges or resources changed unexpectedly.'
}
Assert-SandboxMount $spec '/workspace' $WorkspaceVolume $true
Assert-SandboxMount $spec '/workspace/.auth' $CredentialShadow $false
Assert-SandboxMount $spec '/home/node' $homeVolume $true
$actualCmd=@((Invoke-SandboxDocker inspect --format '{{json .Config.Cmd}}' $Name | ConvertFrom-Json))
if (($actualCmd -join [char]0) -cne ($expectedCmd -join [char]0)) { throw 'Remote agent command changed unexpectedly.' }
if ($Action -eq 'Start') {
 if (!$AcknowledgeThirdPartyRelay) { throw 'Explicit consent required before starting the external remote relay.' }
 if ($PSCmdlet.ShouldProcess($Name,'Start outbound Remote Desktop Commander agent')) {
  Invoke-SandboxDocker start $Name | Out-Null
 }
} elseif ($Action -eq 'Stop') {
 if ($PSCmdlet.ShouldProcess($Name,'Stop remote agent; keep authorization and workspace volumes')) {
  Invoke-SandboxDocker stop --time 10 $Name | Out-Null
 }
} elseif ($Action -eq 'Logs') {
 # Owner console only. Pairing codes and URLs must NOT be pasted into tickets or chat.
 Invoke-SandboxDocker logs --tail 40 $Name
} else {
 Write-Output ("Remote Desktop Commander {0}: topology verified; running={1}. No claim about OAuth pairing." -f $Action,$spec.running)
}
