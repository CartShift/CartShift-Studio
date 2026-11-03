#Requires -Version 7.3
<#
Create a CurrentUser-DPAPI protected token file from a secure prompt.
The token must separately be installed as SANDBOX_AUTH_WORKER_TOKEN in the
CartShift backend. Do not paste the token into chat, repo files or shell args.
#>
[CmdletBinding(SupportsShouldProcess)]
param([Parameter(Mandatory)][string]$OutputFile)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$path=[IO.Path]::GetFullPath($OutputFile)
if (Test-Path -LiteralPath $path) { throw 'Refusing to overwrite existing credentials.' }
$parent=Split-Path -Parent $path
if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw 'Create a private owner directory first.' }
$secret=Read-Host 'Dedicated authentication worker secret (48+ URL-safe characters)' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $text=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  if ($text -cnotmatch '^[A-Za-z0-9_-]{48,}$') { throw 'Invalid secret format.' }
  if ($PSCmdlet.ShouldProcess($path,'Store CurrentUser-DPAPI encrypted secret')) {
    $encrypted=ConvertFrom-SecureString -SecureString $secret
    Set-Content -LiteralPath $path -Value $encrypted -NoNewline -Encoding ascii
    # Restrict NTFS ACL to the current owner and system. The file already
    # contains encrypted DPAPI text, never plaintext.
    $acl=Get-Acl -LiteralPath $path
    $acl.SetAccessRuleProtection($true,$false)
    foreach ($rule in @($acl.Access)) { $acl.RemoveAccessRuleAll($rule) | Out-Null }
    $owner=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $system=New-Object Security.Principal.SecurityIdentifier 'S-1-5-18'
    foreach ($sid in @($owner,$system)) {
      $rights=[Security.AccessControl.FileSystemRights]::FullControl
      $allow=[Security.AccessControl.AccessControlType]::Allow
      $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,$rights,$allow))
    }
    Set-Acl -LiteralPath $path -AclObject $acl
    Write-Output 'Owner-only encrypted token stored. Its plaintext was not displayed.'
  }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  $text=$null
  $secret.Dispose()
}
