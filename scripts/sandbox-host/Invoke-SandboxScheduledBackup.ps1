#Requires -Version 7.3
[CmdletBinding()]
param([Parameter(Mandatory)][string]$ConfigurationFile)
$ErrorActionPreference='Stop'
$config=Get-Content -LiteralPath $ConfigurationFile -Raw | ConvertFrom-Json
$status=[ordered]@{at=[DateTime]::UtcNow.ToString('o');ok=$false;archive=$null}
try{
 $localMcp=@();if($config.PSObject.Properties['local_mcp_containers']){$localMcp=@($config.local_mcp_containers)}
 $archive=& "$PSScriptRoot/Backup-Sandbox.ps1" -LocalMcpContainers $localMcp -Action Backup -BackupDir $config.backup_dir -Recipient $config.recipient -Container $config.container -AgeExecutable $config.age_executable
 if(@($archive).Count -ne 1){throw 'Expected exactly one encrypted archive.'}
 & "$PSScriptRoot/Backup-Sandbox.ps1" -Action Verify -BackupDir $config.backup_dir -Archive $archive -IdentityFile $config.identity_file -Container $config.container -AgeExecutable $config.age_executable | Out-Null
 $status.ok=$true;$status.archive=$archive
}catch{
 $status.error_type=$_.Exception.GetType().Name
 $message=$_.Exception.Message
 if($message -match '^[A-Za-z0-9 ,;:.()/-]{1,240}$'){$status.error=$message}
 throw
}finally{[IO.File]::WriteAllText($config.status_file,($status|ConvertTo-Json))}
