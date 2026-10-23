#Requires -Version 7.3
[CmdletBinding()]
param([Parameter(Mandatory)][string]$ConfigurationFile)
$ErrorActionPreference='Stop'
$config=Get-Content -LiteralPath $ConfigurationFile -Raw | ConvertFrom-Json
$status=[ordered]@{at=[DateTime]::UtcNow.ToString('o');ok=$false;archive=$null}
try{
 $archive=& "$PSScriptRoot/Backup-Sandbox.ps1" -Action Backup -BackupDir $config.backup_dir -Recipient $config.recipient -Container $config.container -AgeExecutable $config.age_executable
 if(@($archive).Count -ne 1){throw 'Expected exactly one encrypted archive.'}
 & "$PSScriptRoot/Backup-Sandbox.ps1" -Action Verify -BackupDir $config.backup_dir -Archive $archive -IdentityFile $config.identity_file -Container $config.container -AgeExecutable $config.age_executable | Out-Null
 $status.ok=$true;$status.archive=$archive
}finally{[IO.File]::WriteAllText($config.status_file,($status|ConvertTo-Json))}
