#Requires -Version 7.3
[CmdletBinding(SupportsShouldProcess)]
param(
 [Parameter(Mandatory)][string]$SupervisorScript,
 [Parameter(Mandatory)][string]$BridgeSource,
 [Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{64}$')][string]$BridgeSha256,
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. "$PSScriptRoot/Common-SandboxTask.ps1"
$name='CartShiftSandboxDesktopCommanderLocal'
if(Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue){throw 'Bridge task exists; preserve and inspect its owner configuration before updating.'}
$paths=@($SupervisorScript,$BridgeSource)|ForEach-Object{[IO.Path]::GetFullPath($_)}
foreach($file in $paths){if(!(Test-Path -LiteralPath $file -PathType Leaf)){throw 'Reviewed bridge source and supervisor files are required.'}}
if((Get-FileHash -LiteralPath $paths[1] -Algorithm SHA256).Hash.ToLowerInvariant() -ne $BridgeSha256){throw 'Bridge source hash mismatch.'}
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$action=New-SandboxScheduledAction @('-NoProfile','-NonInteractive','-WindowStyle','Hidden','-File',$paths[0],'-BridgeSource',$paths[1],'-BridgeSha256',$BridgeSha256,'-ImageId',$ImageId)
$trigger=@((New-ScheduledTaskTrigger -AtLogOn -User $owner),
 (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)))
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal=New-ScheduledTaskPrincipal -UserId $owner -LogonType Interactive -RunLevel Limited
if($PSCmdlet.ShouldProcess($name,'Register local-only Desktop Commander engine supervisor')){
 Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null
}
