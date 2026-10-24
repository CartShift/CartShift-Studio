#Requires -Version 7.3
[CmdletBinding(SupportsShouldProcess)]
param(
 [Parameter(Mandatory)][string]$SupervisorScript,
 [Parameter(Mandatory)][string]$WorkerSource,
 [Parameter(Mandatory)][string]$DpapiTokenFile,
 [Parameter(Mandatory)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$WorkerSha256,
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
 [ValidateRange(1,8)][int]$Slots=2,
 [string]$Prefix='ai-dev-pool'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Prefix -cnotmatch '^[a-z][a-z0-9-]{2,40}$') { throw 'Invalid pool prefix.' }
$paths=@($SupervisorScript,$WorkerSource,$DpapiTokenFile) | ForEach-Object { [IO.Path]::GetFullPath($_) }
foreach ($path in $paths) {
 if (-not (Test-Path -LiteralPath $path -PathType Leaf) -or $path.IndexOfAny([char[]]@(34,10,13)) -ge 0) { throw 'Missing file or unsafe path.' }
}
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$pwsh=(Get-Command pwsh.exe -ErrorAction Stop).Source
foreach ($i in 1..$Slots) {
 $name="CartShiftSandboxPool-$i"
 if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) { throw 'Task already exists; refusing to overwrite owner configuration.' }
 $arguments='-NoProfile -NonInteractive -WindowStyle Hidden -File "{0}" -Slot {1} -WorkerSource "{2}" -DpapiTokenFile "{3}" -WorkerSha256 {4} -ImageId {5} -Prefix {6}' -f $paths[0],$i,$paths[1],$paths[2],$WorkerSha256,$ImageId,$Prefix
 $action=New-ScheduledTaskAction -Execute $pwsh -Argument $arguments
 $trigger=New-ScheduledTaskTrigger -AtLogOn -User $owner
 $settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
 $principal=New-ScheduledTaskPrincipal -UserId $owner -LogonType Interactive -RunLevel Limited
 if ($PSCmdlet.ShouldProcess($name,'Register independent owner-logon pool supervisor')) {
  Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null
 }
}
