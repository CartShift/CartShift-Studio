#Requires -Version 7.3
[CmdletBinding()]
param(
 [Parameter(Mandatory)][string]$WorkerSource,
 [Parameter(Mandatory)][string]$GuardianSource,
 [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$WorkerSha256,
 [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$GuardianSha256,
 [Parameter(Mandatory)][string]$DpapiTokenFile,
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
 
 [string]$Container='ai-dev-workspace',
 [string]$WorkspaceVolume='ai-dev-sandbox-workspace',
 [string]$ShadowVolume='ai-dev-sandbox-empty-auth',
 [string]$HomeVolume='ai-dev-sandbox-build-home',
 [string]$DeviceAuthVolume='ai-dev-sandbox-build-device-auth',
 [switch]$Once
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$WorkerSource=[IO.Path]::GetFullPath($WorkerSource)
$GuardianSource=[IO.Path]::GetFullPath($GuardianSource)
$DpapiTokenFile=[IO.Path]::GetFullPath($DpapiTokenFile)
foreach ($path in @($WorkerSource,$GuardianSource,$DpapiTokenFile)) {
 if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw 'Missing required reviewed owner file.' }
}
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$mutex=[Threading.Mutex]::new($false,"Local\CartShiftSandboxBuild-$sid")
try { $ownsMutex=$mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex=$true }
if (-not $ownsMutex) { $mutex.Dispose(); throw 'An owner build supervisor is already running.' }
$python = @'
import sys,base64,hashlib,json,types
b=json.loads(base64.b64decode(sys.stdin.buffer.readline(262145).strip(),validate=True))
assert set(b)=={'worker','pty'}
w=base64.b64decode(b['worker'],validate=True)
p=base64.b64decode(b['pty'],validate=True)
assert hashlib.sha256(w).hexdigest()==sys.argv[1]
assert hashlib.sha256(p).hexdigest()==sys.argv[2]
m=types.ModuleType('sandbox_pty')
m.__file__='<hash-verified-pty>'
sys.modules['sandbox_pty']=m
exec(compile(p,m.__file__,'exec'),m.__dict__)
exec(compile(w,'<hash-verified-auth-worker>','exec'),{'__name__':'__main__'})
'@
try {
 $restartNeeded=$true
 while ($true) {
  # Fail closed on changed owner sources before touching credentials or Docker.
  $worker=[IO.File]::ReadAllBytes($WorkerSource); $guardian=[IO.File]::ReadAllBytes($GuardianSource)
  $hashW=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($worker)).ToLowerInvariant()
  $hashP=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($guardian)).ToLowerInvariant()
  if ($hashW -ne $WorkerSha256.ToLowerInvariant() -or $hashP -ne $GuardianSha256.ToLowerInvariant()) { throw 'Reviewed source hash changed; refusing startup.' }
  $exit=1
  try {
   . (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
   $spec=Get-SandboxSpec $Container
   Assert-SandboxRestrictions $spec
   if ($spec.paused) { throw 'Container is paused for owner maintenance; wait before restarting.' }
   if ($spec.image -ne $ImageId -or $spec.labels.'io.cartshift.sandbox.build' -ne 'credential-isolated-v1' -or $spec.hostname -ne 'ai-docker-sandbox') { throw 'Only dedicated isolated build containers are supported.' }
   Assert-SandboxMount $spec '/workspace' $WorkspaceVolume $true
   Assert-SandboxMount $spec '/workspace/.auth' $ShadowVolume $false
   Assert-SandboxMount $spec '/home/node' $HomeVolume $true
   Assert-SandboxMount $spec '/home/node/.desktop-commander-device' $DeviceAuthVolume $true
   if (@($spec.mounts | Where-Object { $_.Type -eq 'volume' }).Count -ne 4) { throw 'Unexpected build mount.' }
   foreach ($v in @($WorkspaceVolume,$ShadowVolume,$HomeVolume,$DeviceAuthVolume)) { Assert-SandboxVolumeOwner $v }
   # Restart only the already-verified dedicated sidecar, including first start,
   # so a previous transport failure cannot leave command grandchildren alive.
   if ($restartNeeded) {
    Invoke-SandboxDocker restart --time 10 $Container | Out-Null
    $spec=Get-SandboxSpec $Container
   Assert-SandboxRestrictions $spec
   if ($spec.paused) { throw 'Container is paused for owner maintenance; wait before restarting.' }
   if ($spec.image -ne $ImageId -or $spec.labels.'io.cartshift.sandbox.build' -ne 'credential-isolated-v1' -or $spec.hostname -ne 'ai-docker-sandbox') { throw 'Only dedicated isolated build containers are supported.' }
   Assert-SandboxMount $spec '/workspace' $WorkspaceVolume $true
   Assert-SandboxMount $spec '/workspace/.auth' $ShadowVolume $false
   Assert-SandboxMount $spec '/home/node' $HomeVolume $true
   Assert-SandboxMount $spec '/home/node/.desktop-commander-device' $DeviceAuthVolume $true
   if (@($spec.mounts | Where-Object { $_.Type -eq 'volume' }).Count -ne 4) { throw 'Unexpected build mount.' }
   Invoke-SandboxDocker exec $Container python3 -I -c 'import os,pathlib; p=pathlib.Path("/workspace/.auth"); assert os.geteuid()==1000 and os.path.ismount(p) and os.statvfs(p).f_flag & os.ST_RDONLY and not any(p.iterdir())' | Out-Null
   }
   $credential=(Get-Content -LiteralPath $DpapiTokenFile -Raw).Trim() | ConvertTo-SecureString
   $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential)
   try {
    $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ($token -cnotmatch '^[A-Za-z0-9_-]{48,}$') { throw 'Invalid worker token.' }
    $payload=@{worker=[Convert]::ToBase64String($worker);pty=[Convert]::ToBase64String($guardian)} | ConvertTo-Json -Compress
    $encoded=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload))
    & { Write-Output $encoded; Write-Output $token } | Invoke-HostDocker exec -i -e SANDBOX_WORKER_ROLE=build $Container python3 -I -c $python $hashW $hashP --token-stdin
    $exit=$LASTEXITCODE
   } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $token=$null
    $credential.Dispose()
   }
  } catch {
   Write-Warning 'Build runtime unavailable or boundary verification failed. No new unverified worker will be started.'
  }
  if ($Once) { exit $exit }
  $restartNeeded=$true
  Write-Warning "Build transport exited (code $exit); retrying verified dedicated runtime in 10 seconds."
  Start-Sleep -Seconds 10
 }
} finally {
 $mutex.ReleaseMutex(); $mutex.Dispose()
}
