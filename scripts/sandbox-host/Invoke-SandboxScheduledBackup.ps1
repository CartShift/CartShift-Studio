#Requires -Version 7.3
[CmdletBinding()]
param([Parameter(Mandatory)][string]$ConfigurationFile)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/Common-SandboxTask.ps1"
$config=Get-Content -LiteralPath $ConfigurationFile -Raw | ConvertFrom-Json
$status=[ordered]@{at=[DateTime]::UtcNow.ToString('o');ok=$false;archive=$null}
try{
 $wait=300;$retry=5
 if($config.PSObject.Properties['docker_wait_seconds']){$wait=[int]$config.docker_wait_seconds}
 if($config.PSObject.Properties['docker_retry_seconds']){$retry=[int]$config.docker_retry_seconds}
 Wait-SandboxDockerForBackup -MaxWaitSeconds $wait -RetrySeconds $retry -Probe {
  . "$PSScriptRoot/Common-SandboxHost.ps1"
 } -StartDocker {
  & $script:SandboxDockerExe desktop start --detach --timeout 30 *> $null
  if($LASTEXITCODE -ne 0){throw [IO.IOException]::new('Docker Desktop startup request did not complete.')}
 } -Waiting {
  $status.phase='waiting_for_docker'
  [IO.File]::WriteAllText($config.status_file,($status|ConvertTo-Json))
 }
 $status.phase='snapshot'
 $localMcp=@();if($config.PSObject.Properties['local_mcp_containers']){$localMcp=@($config.local_mcp_containers)}
 $archive=& "$PSScriptRoot/Backup-Sandbox.ps1" -LocalMcpContainers $localMcp -Action Backup -BackupDir $config.backup_dir -Recipient $config.recipient -Container $config.container -AgeExecutable $config.age_executable
 if(@($archive).Count -ne 1){throw 'Expected exactly one encrypted archive.'}
 & "$PSScriptRoot/Backup-Sandbox.ps1" -Action Verify -BackupDir $config.backup_dir -Archive $archive -IdentityFile $config.identity_file -Container $config.container -AgeExecutable $config.age_executable | Out-Null
 $status.ok=$true;$status.phase='verified';$status.archive=$archive
 $status.verified_at=[DateTime]::UtcNow.ToString('o')
 $status.sha256=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
 $successFile=Join-Path (Split-Path $config.status_file) 'last-backup-success.json'
 $pending=$successFile+'.'+[Guid]::NewGuid().ToString('N')+'.pending'
 [IO.File]::WriteAllText($pending,($status|ConvertTo-Json))
 if(Test-Path -LiteralPath $successFile){[IO.File]::Replace($pending,$successFile,$null)}else{[IO.File]::Move($pending,$successFile)}
}catch{
 $status.ok=$false
 $status.error_type=$_.Exception.GetType().Name
 $message=$_.Exception.Message
 if($message -match '^[A-Za-z0-9 ,;:.()/-]{1,240}$'){$status.error=$message}
 throw
}finally{[IO.File]::WriteAllText($config.status_file,($status|ConvertTo-Json))}