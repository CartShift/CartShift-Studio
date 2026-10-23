#Requires -Version 7.3
<# Run only in an owner-visible interactive console. Never prints the private age identity. #>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$IdentityFile,[Parameter(Mandatory)][string]$OutputFile,[Parameter(Mandatory)][string]$AgeExecutable,[Parameter(Mandatory)][string]$RecipientFile)
$ErrorActionPreference='Stop'
if(Test-Path -LiteralPath $OutputFile){throw 'Recovery export already exists; refusing overwrite.'}
$age=(Get-Command $AgeExecutable -ErrorAction Stop).Source
$recipient=([IO.File]::ReadAllText($RecipientFile)).Trim()
$secure=([IO.File]::ReadAllText($IdentityFile)).Trim()|ConvertTo-SecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$probe=$OutputFile+'.verification.age'
try{
 $key=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 Write-Host 'Choose a strong recovery passphrase. Keep it separately from the encrypted backups. Never send it in chat.'
 & {Write-Output $key} | & $age -p -o $OutputFile
 if($LASTEXITCODE -ne 0){throw 'Encrypted recovery export failed.'}
 & {'cartshift-backup-recovery-verified'} | & $age -r $recipient -o $probe
 if($LASTEXITCODE -ne 0){throw 'Recovery probe creation failed.'}
 Write-Host 'Re-enter the recovery passphrase to prove this key works independently of Windows DPAPI.'
 $check= & $age -d -i $OutputFile $probe
 if($LASTEXITCODE -ne 0 -or ($check -join '').Trim() -ne 'cartshift-backup-recovery-verified'){throw 'Independent recovery verification failed.'}
 $record=@{at=[DateTime]::UtcNow.ToString('o');path=[IO.Path]::GetFullPath($OutputFile);sha256=(Get-FileHash -LiteralPath $OutputFile -Algorithm SHA256).Hash.ToLowerInvariant();recipient=$recipient}
 [IO.File]::WriteAllText((Join-Path (Split-Path $IdentityFile) 'recovery-key-export-verified.json'),($record|ConvertTo-Json))
 Write-Host 'Encrypted recovery key independently verified. Copy it off this laptop and retain its passphrase separately.'
}finally{
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr);$key=$null;$secure.Dispose()
 if(Test-Path -LiteralPath $probe){Remove-Item -LiteralPath $probe -Force}
}
