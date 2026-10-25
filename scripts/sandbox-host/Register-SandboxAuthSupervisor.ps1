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
  [Parameter(Mandatory)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$ToolsManifestSha256,
  [string]$TaskName='CartShiftSandboxAuthWorker'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. "$PSScriptRoot/Common-SandboxTask.ps1"
$paths=@($SupervisorScript,$WorkerSource,$GuardianSource,$DpapiTokenFile) |
  ForEach-Object { [IO.Path]::GetFullPath($_) }
foreach ($p in $paths) {
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Missing required path: $p" }
  if ($p.IndexOfAny([char[]]@(34,10,13)) -ge 0) { throw 'Path contains unsafe control/quote characters.' }
}

$windowsOwner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$action=New-SandboxScheduledAction @('-NoProfile','-NonInteractive','-WindowStyle','Hidden','-File',$paths[0],'-WorkerSource',$paths[1],'-GuardianSource',$paths[2],'-DpapiTokenFile',$paths[3],'-WorkerSha256',$WorkerSha256,'-GuardianSha256',$GuardianSha256,'-ImageId',$ImageId,'-ToolsManifestSha256',$ToolsManifestSha256)
# Periodic retries also recover externally terminated native supervisors.
$trigger=@((New-ScheduledTaskTrigger -AtLogOn -User $windowsOwner),
 (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)))
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal=New-ScheduledTaskPrincipal -UserId $windowsOwner -LogonType Interactive -RunLevel Limited
if ($PSCmdlet.ShouldProcess($TaskName,'Install isolated auth-sidecar supervisor after owner login')) {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force | Out-Null
  Write-Output "Registered $TaskName. It runs only after $windowsOwner logs in."
}
