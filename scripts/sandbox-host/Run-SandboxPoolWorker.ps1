#Requires -Version 7.3
[CmdletBinding()]
param(
 [Parameter(Mandatory)][ValidateRange(1,8)][int]$Slot,
 [Parameter(Mandatory)][string]$WorkerSource,
 [Parameter(Mandatory)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$WorkerSha256,
 [Parameter(Mandatory)][string]$DpapiTokenFile,
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
 [string]$Prefix='ai-dev-pool',
 [string]$WorkspaceVolume='ai-dev-sandbox-workspace',
 [switch]$Once
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Prefix -cnotmatch '^[a-z][a-z0-9-]{2,40}$') { throw 'Invalid pool prefix.' }
$WorkerSource=[IO.Path]::GetFullPath($WorkerSource)
$DpapiTokenFile=[IO.Path]::GetFullPath($DpapiTokenFile)
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$mutex=[Threading.Mutex]::new($false,"Local\CartShiftSandboxPool-$sid-$Slot")
try { $owns=$mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $owns=$true }
if (-not $owns) { $mutex.Dispose(); throw 'This slot already has an owner supervisor.' }
$python=@'
import sys,base64,hashlib
source=base64.b64decode(sys.stdin.buffer.readline(262145).strip(),validate=True)
assert hashlib.sha256(source).hexdigest()==sys.argv[1]
exec(compile(source,'<verified-pool-worker>','exec'),{'__name__':'__main__'})
'@
try {
 while ($true) {
  $worker=[IO.File]::ReadAllBytes($WorkerSource)
  $hash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($worker)).ToLowerInvariant()
  if ($hash -ne $WorkerSha256.ToLowerInvariant()) { throw 'Reviewed worker source changed.' }
  $exit=1
  try {
   . (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
   $container="$Prefix-$Slot"; $spec=Get-SandboxSpec $container
   Assert-SandboxRestrictions $spec
   Assert-SandboxMount $spec '/workspace' $WorkspaceVolume $true
   Assert-SandboxMount $spec '/workspace/.auth' "$Prefix-empty-auth" $false
   Assert-SandboxMount $spec '/home/node' "$Prefix-home-$Slot" $true
   if ($spec.image -ne $ImageId -or $spec.hostname -ne 'ai-docker-sandbox' -or $spec.labels.'io.cartshift.sandbox.pool-slot' -ne "$Slot" -or @($spec.mounts).Count -ne 3 -or $spec.host.Memory -le 0 -or $spec.host.Memory -gt 8GB -or $spec.host.NanoCpus -le 0 -or $spec.host.NanoCpus -gt 4e9 -or $spec.host.PidsLimit -le 0 -or $spec.host.PidsLimit -gt 192 -or $spec.host.MemorySwap -ne $spec.host.Memory -or ($spec.host.PortBindings -and @($spec.host.PortBindings.PSObject.Properties).Count -gt 0)) { throw 'Slot identity or resource boundary mismatch.' }
   # Fence descendants from this slot only, before every worker incarnation.
   # A paused container is an owner backup barrier: never unpause/restart it.
   $paused=Invoke-SandboxDocker inspect --format '{{.State.Paused}}' $container
   if ($paused -eq 'true') { throw 'Slot paused for maintenance.' }
   Invoke-SandboxDocker restart --time 10 $container | Out-Null
   $credential=(Get-Content -LiteralPath $DpapiTokenFile -Raw).Trim() | ConvertTo-SecureString
   $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential)
   try {
    $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ($token -cnotmatch '^[A-Za-z0-9_-]{48,}$') { throw 'Invalid worker token.' }
    $encoded=[Convert]::ToBase64String($worker)
    & { Write-Output $encoded; Write-Output $token } | Invoke-HostDocker exec -i -e SANDBOX_WORKER_ROLE=build -e "SANDBOX_WORKER_SLOT=$Slot" $container python3 -I -c $python $hash --token-stdin
    $exit=$LASTEXITCODE
   } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr); $token=$null; $credential.Dispose()
   }
  } catch { Write-Warning "Slot $Slot unavailable; retrying only its verified container." }
  if ($Once) { exit $exit }
  Start-Sleep -Seconds 10
 }
} finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
