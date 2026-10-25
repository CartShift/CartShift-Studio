#Requires -Version 7.3
# Pure owner-side regression fixtures; no task registration or container changes.
param([string]$HostScriptDirectory=(Join-Path $PSScriptRoot '../../scripts/sandbox-host'))
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
. (Join-Path $HostScriptDirectory Common-SandboxBackupBarrier.ps1)
. (Join-Path $HostScriptDirectory Common-SandboxTask.ps1)
function Assert-Refused([scriptblock]$Action){$refused=$false;try{& $Action}catch{$refused=$true};if(!$refused){throw 'Unsafe fixture was accepted.'}}
$now=[DateTime]::UtcNow
foreach($value in @($now.AddMinutes(20),$now.AddMinutes(20).ToString('o'))){
 $lease=@{expires=$value}|ConvertTo-Json|ConvertFrom-Json
 if([Math]::Abs(((Get-SandboxBackupExpiry $lease)-$now).TotalMinutes-20) -gt 0.01){throw 'JSON round trip shifted UTC lease.'}
}
$id='a'*12;$baseline=$now.AddHours(-1).ToString('o')
$script:fixturePaused=$true;$script:fixtureStarted=$baseline
function Invoke-SandboxBackupTimedDocker([string[]]$Arguments){
 if($Arguments[0] -ne 'inspect'){throw 'Paused checkpoint attempted exec.'}
 return (@{paused=$script:fixturePaused;started=$script:fixtureStarted}|ConvertTo-Json -Compress)
}
Assert-SandboxBackupWritersPaused -Ids @($id) -Started @{$id=$baseline}
$script:fixturePaused=$false
Assert-Refused {Assert-SandboxBackupWritersPaused -Ids @($id) -Started @{$id=$baseline}}
$script:fixturePaused=$true;$script:fixtureStarted=$now.ToString('o')
Assert-Refused {Assert-SandboxBackupWritersPaused -Ids @($id) -Started @{$id=$baseline}}
$action=New-SandboxScheduledAction @('-NoProfile','-NonInteractive','-File','C:\fixture with spaces\owner.ps1','-ImageId','sha256:abc')
if($action.Execute -match 'codex-runtimes' -or $action.Arguments -match 'ExecutionPolicy|EncodedCommand' -or $action.Arguments -notmatch '"C:\\fixture with spaces\\owner.ps1"'){throw 'Persistent task arguments changed.'}
Assert-Refused {New-SandboxScheduledAction @('bad"argument')}
Write-Output 'PASS: UTC lease round trips; paused inspection-only certification; resumed/restarted refusal; persistent native task argv.'

$script:availabilityCalls=0;$script:startupCalls=0
Wait-SandboxDockerForBackup -MaxWaitSeconds 5 -RetrySeconds 1 -Probe {
 $script:availabilityCalls++;if($script:availabilityCalls -lt 3){throw [IO.IOException]::new('synthetic unavailable')}
} -StartDocker {$script:startupCalls++}
if($script:availabilityCalls -ne 3 -or $script:startupCalls -ne 1){throw 'Startup retry count incorrect.'}
$script:startupCalls=0
Assert-Refused {Wait-SandboxDockerForBackup -MaxWaitSeconds 0 -Probe {throw 'Synthetic wrong architecture or remote endpoint.'} -StartDocker {$script:startupCalls++}}
if($script:startupCalls){throw 'Security mismatch incorrectly triggered startup.'}
Assert-Refused {Wait-SandboxDockerForBackup -MaxWaitSeconds 0 -Probe {throw [IO.IOException]::new('synthetic unavailable')} -StartDocker {}}
Write-Output 'PASS: Docker unavailable retries/start-once, timeout bound and fail-closed security mismatches.'
# Execute the receipt publication block from the actual scheduled-backup script.
$source=Get-Content (Join-Path $HostScriptDirectory Invoke-SandboxScheduledBackup.ps1) -Raw
$publication=[regex]::Match($source,'(?ms)^ \$pending=.+?(?=^\}catch)').Value
if(!$publication){throw 'Receipt publication fixture could not find production block.'}
$receiptDirectory=Join-Path ([IO.Path]::GetTempPath()) ('sandbox-receipt-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $receiptDirectory | Out-Null
$successFile=Join-Path $receiptDirectory 'last-success.json'
try {
 foreach($generation in @(1,2)){
  $status=@{ok=$true;generation=$generation}
  & ([scriptblock]::Create($publication))
  $stored=Get-Content $successFile -Raw | ConvertFrom-Json
  if(!$stored.ok -or $stored.generation -ne $generation){throw 'Receipt generation was not atomically published.'}
 }
 if(@(Get-ChildItem $receiptDirectory -Filter '*.pending').Count){throw 'Published receipt left a pending file.'}
} finally {
 Get-ChildItem -LiteralPath $receiptDirectory -File | Remove-Item
 Remove-Item -LiteralPath $receiptDirectory
}
Write-Output 'PASS: Initial and replacement success receipts publish atomically without pending files.'
