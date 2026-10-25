#Requires -Version 7.3
[CmdletBinding(SupportsShouldProcess,ConfirmImpact='High')]
param(
 [Parameter(Mandatory)][ValidateSet('Prepare','Verify','Activate')][string]$Action,
 [string]$LegacyName='ai-dev-workspace',
 [string]$CandidateName='ai-dev-workspace-v4-candidate',
 [string]$WorkspaceVolume='ai-dev-sandbox-workspace',
 [string]$ShadowVolume='ai-dev-sandbox-empty-auth',
 [string]$HomeVolume='ai-dev-sandbox-build-home',
 [string]$DeviceAuthVolume='ai-dev-sandbox-build-device-auth',
 [switch]$AuthWorkerVerified,[switch]$AuthTokenEnforced,[switch]$OffHostBackupVerified
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
$source=Get-SandboxSpec $LegacyName
Assert-SandboxRestrictions $source
Assert-SandboxMount $source '/workspace' $WorkspaceVolume $true
$image=$source.image
Assert-SandboxImage $image
Assert-SandboxVolumeOwner $WorkspaceVolume
function ConfirmCandidate {
 foreach ($v in @($ShadowVolume,$HomeVolume,$DeviceAuthVolume)) { Assert-SandboxVolumeOwner $v }
 $spec=Get-SandboxSpec $CandidateName
 Assert-SandboxRestrictions $spec
 if ($spec.labels.'io.cartshift.sandbox.build' -ne 'credential-isolated-v1' -or $spec.image -ne $image -or $spec.hostname -ne 'ai-docker-sandbox' -or $spec.host.NetworkMode -ne $source.host.NetworkMode) { throw 'Candidate identity mismatch.' }
 Assert-SandboxMount $spec '/workspace' $WorkspaceVolume $true
 Assert-SandboxMount $spec '/workspace/.auth' $ShadowVolume $false
 Assert-SandboxMount $spec '/home/node' $HomeVolume $true
 Assert-SandboxMount $spec '/home/node/.desktop-commander-device' $DeviceAuthVolume $true
 if (@($spec.mounts | Where-Object { $_.Type -eq 'volume' }).Count -ne 4 -or ($spec.host.PortBindings -and @($spec.host.PortBindings.PSObject.Properties).Count)) { throw 'Unexpected candidate volume or published port.' }
 Invoke-SandboxDocker exec $CandidateName python3 -I -c 'import os,pathlib; p=pathlib.Path("/workspace/.auth"); assert os.geteuid()==1000 and any(len(f:=line.split())>5 and f[4]==str(p) for line in pathlib.Path("/proc/self/mountinfo").read_text().splitlines()) and os.statvfs(p).f_flag & os.ST_RDONLY and not any(p.iterdir()); assert os.access("/home/node",os.W_OK); assert not pathlib.Path("/var/run/docker.sock").exists()' | Out-Null
 Write-Output 'Candidate exact source mounts, clean writable home and empty read-only credential shadow verified.'
}
switch ($Action) {
 'Prepare' {
  Invoke-HostDocker container inspect $CandidateName *> $null
  if ($LASTEXITCODE -eq 0) { throw 'Candidate exists; refusing replacement.' }
  # Reject old credential volumes even when supplied via parameter overrides.
  $originalHomes=@($source.mounts | Where-Object { $_.Destination -like '/home/*' } | ForEach-Object Name)
  if ($HomeVolume -in $originalHomes -or $DeviceAuthVolume -in $originalHomes -or @(@($ShadowVolume,$HomeVolume,$DeviceAuthVolume) | Select-Object -Unique).Count -ne 3) { throw 'Candidate destinations must be distinct fresh volumes.' }
  if ($PSCmdlet.ShouldProcess($CandidateName,'Create preserved-data candidate with fresh credential-free home and device identity')) {
   New-SandboxVolume $ShadowVolume; New-SandboxVolume $HomeVolume; New-SandboxVolume $DeviceAuthVolume
   # Docker copies only the immutable image home into fresh empty home/device
   # volumes. The old home and device-auth volumes are never mounted or copied.
   Invoke-SandboxDocker run --detach --name $CandidateName --hostname ai-docker-sandbox --network $source.host.NetworkMode --user 1000:1000 --read-only --restart unless-stopped --cap-drop ALL --security-opt no-new-privileges --pids-limit 512 --memory 8g --memory-swap 8g --cpus 4 --tmpfs '/tmp:rw,nosuid,nodev,size=1g,mode=1777' --tmpfs '/run:rw,nosuid,nodev,noexec,size=16m,mode=755' --log-opt max-size=5m --log-opt max-file=3 --add-host host.docker.internal:127.0.0.1 --add-host gateway.docker.internal:127.0.0.1 --mount "type=volume,source=$WorkspaceVolume,target=/workspace" --mount "type=volume,source=$ShadowVolume,target=/workspace/.auth,readonly,volume-nocopy" --mount "type=volume,source=$HomeVolume,target=/home/node" --mount "type=volume,source=$DeviceAuthVolume,target=/home/node/.desktop-commander-device" --label sandbox.owner=ai-dev-sandbox --label io.cartshift.sandbox.build=credential-isolated-v1 $image sleep infinity | Out-Null
   Write-Output 'Candidate created; all legacy volumes and container preserved. Enroll the fresh local MCP identity separately.'
  }
 }
 'Verify' { ConfirmCandidate }
 'Activate' {
  if ($WhatIfPreference) {
   [void]$PSCmdlet.ShouldProcess($LegacyName,'Verify attested recovery and auth isolation, then reversibly rename the stopped legacy container and candidate')
   return
  }
  if (-not ($AuthWorkerVerified -and $AuthTokenEnforced -and $OffHostBackupVerified)) { throw 'Verify auth worker, enforced token separation and an off-host restore first.' }
  ConfirmCandidate
  if ($source.running) { throw 'Stop the legacy supervisor and container before activation.' }
  Invoke-HostDocker container inspect "$LegacyName-retained" *> $null
  if ($LASTEXITCODE -eq 0) { throw 'Retained name already exists; never replace it.' }
  if ($PSCmdlet.ShouldProcess($LegacyName,'Activate candidate by reversible rename; retain every original volume')) {
   Invoke-SandboxDocker rename $LegacyName "$LegacyName-retained" | Out-Null
   try { Invoke-SandboxDocker rename $CandidateName $LegacyName | Out-Null }
   catch { Invoke-SandboxDocker rename "$LegacyName-retained" $LegacyName | Out-Null; throw }
   Write-Output 'Activated isolated candidate. Original container and credentials retained.'
  }
 }
}
