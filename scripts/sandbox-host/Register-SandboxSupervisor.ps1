#Requires -Version 7.3
<# Explicit owner-only enrollment. Does not copy tokens or install a new worker. #>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$OwnerSupervisorScript,
  [string]$TaskName = 'CartShiftSandboxWorker',
  [switch]$StartNow
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script = [IO.Path]::GetFullPath($OwnerSupervisorScript)
if (-not (Test-Path -LiteralPath $script -PathType Leaf) -or
    [IO.Path]::GetExtension($script) -ne '.ps1') {
  throw 'Point to the existing reviewed owner-side supervisor PowerShell script.'
}
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$pwsh = (Get-Command pwsh -ErrorAction Stop).Source
# InteractiveToken uses the currently signed-in DPAPI identity; no password is
# stored in Task Scheduler. This task will not run without owner logon.
$action = New-ScheduledTaskAction -Execute $pwsh -Argument ('-NoProfile -NonInteractive -File "' + $script.Replace('"','') + '"')
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$settings = New-ScheduledTaskSettingsSet -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
if ($PSCmdlet.ShouldProcess($TaskName, 'Register owner-scoped supervisor logon task')) {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force | Out-Null
  Write-Output "Registered $TaskName for $currentUser (after logon only)."
  if ($StartNow) { Start-ScheduledTask -TaskName $TaskName }
}
