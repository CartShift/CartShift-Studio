#Requires -Version 7.3
<# Owner-operated weekly encrypted Docker-volume backup task. #>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$BackupScript,
  [Parameter(Mandatory)][string]$BackupDir,
  [Parameter(Mandatory)][string]$Recipient,
  [ValidateSet('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')][string]$Day = 'Sunday',
  [ValidatePattern('^([01][0-9]|2[0-3]):[0-5][0-9]$')][string]$Time = '03:00',
  [string]$TaskName = 'CartShiftSandboxEncryptedBackup'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script = [IO.Path]::GetFullPath($BackupScript)
$folder = [IO.Path]::GetFullPath($BackupDir)
if (-not (Test-Path -LiteralPath $script -PathType Leaf) -or
    -not (Test-Path -LiteralPath $folder -PathType Container)) {
  throw 'Use an existing reviewed backup script and encrypted directory.'
}
if ($Recipient -notmatch '^age1[a-z0-9]{58}$') { throw 'Invalid age public recipient.' }
if ($script.Contains('"') -or $folder.Contains('"')) { throw 'Unexpected quote in path.' }
$pwsh = (Get-Command pwsh -ErrorAction Stop).Source
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$parts = $Time.Split(':')
$at = (Get-Date).Date.AddHours([int]$parts[0]).AddMinutes([int]$parts[1])
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $at
$argument = "-NoProfile -NonInteractive -File `"$script`" -Action Backup -BackupDir `"$folder`" -Recipient $Recipient"
$action = New-ScheduledTaskAction -Execute $pwsh -Argument $argument
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 6) `
  -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 10)
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
if ($PSCmdlet.ShouldProcess($TaskName, 'Register weekly encrypted staging backup')) {
  Register-ScheduledTask -TaskName $TaskName -Trigger $trigger -Action $action `
    -Settings $settings -Principal $principal -Force | Out-Null
  Write-Output "Registered $TaskName ($Day $Time; user-logon required)."
}
