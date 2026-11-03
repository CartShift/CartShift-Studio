#Requires -Version 7.3
<# Additive staging only. Never renames/removes the legacy container or any volume. #>
[CmdletBinding(SupportsShouldProcess)]
param(
 [ValidateSet('Prepare','Verify','Stop')][string]$Action='Verify',
 [ValidateRange(1,8)][int]$Slots=2,
 [ValidateRange(1,8)][int]$MemoryGiB=2,
 [ValidateRange(1,4)][int]$Cpus=2,
 [string]$SourceContainer='ai-dev-workspace',
 [string]$Prefix='ai-dev-pool',
 [string]$WorkspaceVolume='ai-dev-sandbox-workspace'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Prefix -cnotmatch '^[a-z][a-z0-9-]{2,40}$') { throw 'Invalid pool prefix.' }
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
$source=Get-SandboxSpec $SourceContainer
Assert-SandboxRestrictions $source
Assert-SandboxMount $source '/workspace' $WorkspaceVolume $true
Assert-SandboxVolumeOwner $WorkspaceVolume
Assert-SandboxImage $source.image
$info=Invoke-SandboxDocker info --format '{{json .}}' | ConvertFrom-Json
$shadow="$Prefix-empty-auth"
if ($Action -eq 'Prepare') {
 # Account for existing running workloads, including rollback runtime. Reserve
 # 2 GiB for Docker/host services; reject unbounded pre-existing containers.
 $allocated=0L; $cpuAllocated=0.0
 foreach ($name in @(Invoke-SandboxDocker ps --format '{{.Names}}')) {
  $limits=Invoke-SandboxDocker inspect --format '{{json .HostConfig}}' $name | ConvertFrom-Json
  if ($limits.Memory -le 0) { throw "Unbounded running container $name; set limits before provisioning." }
  $allocated += $limits.Memory
  $cpuAllocated += $limits.NanoCpus / 1e9
 }
 if ($allocated + $Slots * $MemoryGiB * 1GB -gt $info.MemTotal - 2GB -or $cpuAllocated + $Slots * $Cpus -gt $info.NCPU) { throw 'Insufficient capped Docker CPU/RAM budget; stop unrelated workloads or reduce pool limits.' }
 # Preflight every destination before creating anything. Never reuse homes.
 foreach ($i in 1..$Slots) {
  Invoke-HostDocker container inspect "$Prefix-$i" *> $null
  if ($LASTEXITCODE -eq 0) { throw 'Pool destination exists; use Verify. No replacement allowed.' }
  Invoke-HostDocker volume inspect "$Prefix-home-$i" *> $null
  if ($LASTEXITCODE -eq 0) { throw 'Pool home exists; refusing replacement.' }
 }
 Invoke-HostDocker volume inspect $shadow *> $null
 if ($LASTEXITCODE -eq 0) { throw 'Shadow exists; review existing staged pool rather than reusing it.' }
 if ($PSCmdlet.ShouldProcess($Prefix,'Create independent capped workers with fresh homes and shared credential shadow')) {
  New-SandboxVolume $shadow
  foreach ($i in 1..$Slots) {
   $homeVolume="$Prefix-home-$i"; New-SandboxVolume $homeVolume
   Invoke-SandboxDocker run --detach --name "$Prefix-$i" --hostname ai-docker-sandbox --network $source.host.NetworkMode --user 1000:1000 --read-only --restart unless-stopped --cap-drop ALL --security-opt no-new-privileges --pids-limit 192 --memory "${MemoryGiB}g" --memory-swap "${MemoryGiB}g" --cpus $Cpus --tmpfs '/tmp:rw,nosuid,nodev,size=256m,mode=1777' --tmpfs '/run:rw,nosuid,nodev,noexec,size=16m,mode=755' --log-opt max-size=5m --log-opt max-file=3 --add-host host.docker.internal:127.0.0.1 --add-host gateway.docker.internal:127.0.0.1 --mount "type=volume,source=$WorkspaceVolume,target=/workspace" --mount "type=volume,source=$shadow,target=/workspace/.auth,readonly,volume-nocopy" --mount "type=volume,source=$homeVolume,target=/home/node" --label sandbox.owner=ai-dev-sandbox --label io.cartshift.sandbox.pool-slot=$i $source.image sleep infinity | Out-Null
  }
 }
 if ($WhatIfPreference) { return }
}
foreach ($i in 1..$Slots) {
 $name="$Prefix-$i"
 $spec=Get-SandboxSpec $name
 Assert-SandboxRestrictions $spec
 Assert-SandboxMount $spec '/workspace' $WorkspaceVolume $true
 Assert-SandboxMount $spec '/workspace/.auth' $shadow $false
 Assert-SandboxMount $spec '/home/node' "$Prefix-home-$i" $true
 if ($spec.image -ne $source.image -or $spec.hostname -ne 'ai-docker-sandbox' -or $spec.labels.'io.cartshift.sandbox.pool-slot' -ne "$i" -or @($spec.mounts).Count -ne 3 -or ($spec.host.PortBindings -and @($spec.host.PortBindings.PSObject.Properties).Count -gt 0) -or $spec.host.Memory -ne $MemoryGiB*1GB -or $spec.host.MemorySwap -ne $spec.host.Memory -or $spec.host.NanoCpus -ne $Cpus*1e9 -or $spec.host.PidsLimit -ne 192) { throw 'Pool topology or resource limit mismatch.' }
 if ($Action -eq 'Stop') {
  if ($PSCmdlet.ShouldProcess($name,'Stop staged pool worker; retain container, homes and all data')) { Invoke-SandboxDocker stop --time 10 $name | Out-Null }
 } else {
  Invoke-SandboxDocker exec $name python3 -I -c 'import os,pathlib; p=pathlib.Path("/workspace/.auth"); assert os.geteuid()==1000 and any(line.split()[4]==str(p) for line in pathlib.Path("/proc/self/mountinfo").read_text().splitlines()) and os.statvfs(p).f_flag & os.ST_RDONLY and not any(p.iterdir()); assert not pathlib.Path("/var/run/docker.sock").exists(); assert os.access("/home/node",os.W_OK)' | Out-Null
 }
}
Write-Output "Pool $Action verified: $Slots slots, $MemoryGiB GiB and $Cpus CPU each. Legacy runtime and all volumes retained."
