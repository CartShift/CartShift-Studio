#Requires -Version 7.3
[CmdletBinding()]
param(
 [Parameter(Mandatory)][string]$WorkerSource,
 [Parameter(Mandatory)][string]$GuardianSource,
 [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$WorkerSha256,
 [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$GuardianSha256,
 [Parameter(Mandatory)][string]$DpapiTokenFile,
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
 [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ToolsManifestSha256,
 [string]$AuthContainer='ai-auth-sandbox',
 [string]$BuildContainer='ai-dev-workspace',
 [string]$AuthVolume='ai-dev-sandbox-provider-auth',
 [string]$ToolsVolume='ai-dev-sandbox-auth-tools',
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
$mutex=[Threading.Mutex]::new($false,"Local\CartShiftSandboxAuth-$sid")
try { $ownsMutex=$mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex=$true }
if (-not $ownsMutex) { $mutex.Dispose(); throw 'An owner auth supervisor is already running.' }
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
   $spec=Get-SandboxSpec $AuthContainer
   $base=Get-SandboxSpec $BuildContainer
   Assert-SandboxRestrictions $spec
   Assert-SandboxRestrictions $base
   if ($spec.image -ne $ImageId -or $base.image -ne $ImageId -or $spec.hostname -ne 'ai-auth-sandbox' -or $spec.host.NetworkMode -ne $base.host.NetworkMode -or $spec.labels.'io.cartshift.sandbox.auth' -ne 'isolated-v1' -or $spec.labels.'io.cartshift.sandbox.tools-manifest' -ne $ToolsManifestSha256) { throw 'Dedicated auth image or runtime identity mismatch.' }
   Assert-SandboxMount $spec '/workspace/.auth' $AuthVolume $true
   Assert-SandboxMount $spec '/workspace/scripts' $ToolsVolume $false
   Assert-SandboxMount $spec '/workspace/toolchain' $ToolsVolume $false
   Assert-SandboxVolumeOwner $AuthVolume
   Assert-SandboxVolumeOwner $ToolsVolume
   if (@($spec.mounts | Where-Object { $_.Type -eq 'volume' }).Count -ne 3) { throw 'Unexpected auth mount.' }
   # Restart only the already-verified dedicated sidecar, including first start,
   # so a previous transport failure cannot leave OAuth grandchildren alive.
   if ($restartNeeded) {
    Invoke-SandboxDocker restart --time 10 $AuthContainer | Out-Null
    & (Join-Path $PSScriptRoot 'Prepare-SandboxAuthIsolation.ps1') -Action Verify -BuildContainer $BuildContainer -AuthContainer $AuthContainer -AuthVolume $AuthVolume -ToolsVolume $ToolsVolume -ToolsManifestSha256 $ToolsManifestSha256 | Out-Null
   }
   $credential=(Get-Content -LiteralPath $DpapiTokenFile -Raw).Trim() | ConvertTo-SecureString
   $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential)
   try {
    $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ($token -cnotmatch '^[A-Za-z0-9_-]{48,}$') { throw 'Invalid worker token.' }
    $payload=@{worker=[Convert]::ToBase64String($worker);pty=[Convert]::ToBase64String($guardian)} | ConvertTo-Json -Compress
    $encoded=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload))
    & { Write-Output $encoded; Write-Output $token } | Invoke-HostDocker exec -i -e SANDBOX_WORKER_ROLE=auth $AuthContainer python3 -I -c $python $hashW $hashP --token-stdin
    $exit=$LASTEXITCODE
   } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $token=$null
    $credential.Dispose()
   }
  } catch {
   Write-Warning 'Auth runtime unavailable or boundary verification failed. No new unverified worker will be started.'
  }
  if ($Once) { exit $exit }
  $restartNeeded=$true
  Write-Warning "Auth transport exited (code $exit); retrying verified dedicated runtime in 10 seconds."
  Start-Sleep -Seconds 10
 }
} finally {
 $mutex.ReleaseMutex(); $mutex.Dispose()
}
