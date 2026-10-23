#Requires -Version 7.3
<#
Logon startup for the reviewed auth-only supervisor. No bearer token is passed
through Task Scheduler arguments; the supervisor decrypts a local DPAPI file.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$SupervisorScript,
  [Parameter(Mandatory)][string]$WorkerSource,
  [Parameter(Mandatory)][string]$GuardianSource,
  [Parameter(Mandatory)][string]$DpapiTokenFile,
  [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
  [Parameter(Mandatory)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$WorkerSha256,
  [Parameter(Mandatory)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$GuardianSha256,
  [string]$TaskName='CartShiftSandboxBuildWorker'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$paths=@($SupervisorScript,$WorkerSource,$GuardianSource,$DpapiTokenFile) |
  ForEach-Object { [IO.Path]::GetFullPath($_) }
foreach ($p in $paths) {
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Missing required path: $p" }
  if ($p.IndexOfAny([char[]]@(34,10,13)) -ge 0) { throw 'Path contains unsafe control/quote characters.' }
}
$pwsh=(Get-Command pwsh -ErrorAction Stop).Source
$windowsOwner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$arguments="-NoProfile -NonInteractive -WindowStyle Hidden -File `"$($paths[0])`" -WorkerSource `"$($paths[1])`" -GuardianSource `"$($paths[2])`" -DpapiTokenFile `"$($paths[3])`" -WorkerSha256 $WorkerSha256 -GuardianSha256 $GuardianSha256 -ImageId $ImageId"
$action=New-ScheduledTaskAction -Execute $pwsh -Argument $arguments
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $windowsOwner
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal=New-ScheduledTaskPrincipal -UserId $windowsOwner -LogonType Interactive -RunLevel Limited
if ($PSCmdlet.ShouldProcess($TaskName,'Install isolated build-worker supervisor after owner login')) {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force | Out-Null
  Write-Output "Registered $TaskName. It runs only after $windowsOwner logs in."
}
