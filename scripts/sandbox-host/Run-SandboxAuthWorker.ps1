#Requires -Version 7.3
<#
Supervise an isolated authentication-only worker. The token is protected
with Windows CurrentUser DPAPI and is transmitted only via docker exec stdin.
The owner supplies reviewed source files and exact SHA-256 allowlist values.
Never run this with arbitrary sources or under another Windows identity.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$WorkerSource,
  [Parameter(Mandatory)][string]$GuardianSource,
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$WorkerSha256,
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$GuardianSha256,
  [Parameter(Mandatory)][string]$DpapiTokenFile,
  [string]$AuthContainer='ai-auth-sandbox',
  [switch]$Once
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$WorkerSource=[IO.Path]::GetFullPath($WorkerSource)
$GuardianSource=[IO.Path]::GetFullPath($GuardianSource)
$DpapiTokenFile=[IO.Path]::GetFullPath($DpapiTokenFile)
foreach ($path in @($WorkerSource,$GuardianSource,$DpapiTokenFile)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing required owner file: $path" }
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker unavailable.' }
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
# All secret material is passed over stdin; not as command arguments.
while ($true) {
  $worker=[IO.File]::ReadAllBytes($WorkerSource)
  $guardian=[IO.File]::ReadAllBytes($GuardianSource)
  $hashW=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($worker)).ToLowerInvariant()
  $hashP=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($guardian)).ToLowerInvariant()
  if ($hashW -ne $WorkerSha256.ToLowerInvariant() -or $hashP -ne $GuardianSha256.ToLowerInvariant()) {
    throw 'Reviewed source SHA-256 changed. Refusing worker startup.'
  }
  $credential=(Get-Content -LiteralPath $DpapiTokenFile -Raw).Trim() | ConvertTo-SecureString
  $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential)
  $token=''
  try {
    $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ($token -notmatch '^[A-Za-z0-9_-]{32,}$') { throw 'Invalid auth worker token.' }
    $payload=@{
      worker=[Convert]::ToBase64String($worker)
      pty=[Convert]::ToBase64String($guardian)
    } | ConvertTo-Json -Compress
    $encoded=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload))
    $inspect = & docker inspect --format '{{index .Config.Labels "io.cartshift.sandbox.auth"}}' $AuthContainer 2>$null
    if ($LASTEXITCODE -ne 0 -or $inspect.Trim() -ne 'isolated-v1') {
      throw 'Auth container identity was not verified.'
    }
    # Pipeline writes two lines; do not use Start-Process -ArgumentList
    # or place either credential in command-line switches or environment.
    & {
      Write-Output $encoded
      Write-Output $token
    } | & docker exec -i -e SANDBOX_WORKER_ROLE=auth $AuthContainer python3 -I -c $python $hashW $hashP --token-stdin
    $exit=$LASTEXITCODE
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $token=$null
    $credential.Dispose()
  }
  if ($Once) { exit $exit }
  Write-Warning "Auth worker exited (code $exit); checking verified inputs before restart."
  Start-Sleep -Seconds 10
}
