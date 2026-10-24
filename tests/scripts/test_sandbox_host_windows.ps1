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
