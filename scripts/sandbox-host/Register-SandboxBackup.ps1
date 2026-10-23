#Requires -Version 7.3
[CmdletBinding(SupportsShouldProcess)]
param(
 [Parameter(Mandatory)][string]$BackupScript,
 [Parameter(Mandatory)][string]$BackupDir,
 [Parameter(Mandatory)][string]$Recipient,
 [Parameter(Mandatory)][string]$IdentityFile,
 [Parameter(Mandatory)][string]$AgeExecutable,
 [string]$Container='ai-dev-workspace',
 [ValidateSet('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')][string]$Day='Sunday',
 [ValidatePattern('^([01][0-9]|2[0-3]):[0-5][0-9]$')][string]$Time='03:00',
 [string]$TaskName='CartShiftSandboxEncryptedBackup'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$script=[IO.Path]::GetFullPath($BackupScript);$folder=[IO.Path]::GetFullPath($BackupDir)
$identity=[IO.Path]::GetFullPath($IdentityFile);$age=(Get-Command $AgeExecutable -ErrorAction Stop).Source
$wrapper=Join-Path (Split-Path $script) 'Invoke-SandboxScheduledBackup.ps1'
foreach($p in @($script,$folder,$identity,$age,$wrapper)){
 if(!(Test-Path -LiteralPath $p) -or $p.IndexOfAny([char[]]@(34,10,13)) -ge 0){throw 'Existing safe backup configuration paths required.'}
}
if($Recipient -cnotmatch '^age1[a-z0-9]{58}$'){throw 'Invalid public recipient.'}
$configDir=Split-Path $identity
$configFile=Join-Path $configDir 'scheduled-backup.json'
$configuration=@{backup_dir=$folder;recipient=$Recipient;identity_file=$identity;age_executable=$age;container=$Container;status_file=(Join-Path $configDir 'last-backup-status.json')}
$pwsh=(Get-Command pwsh -ErrorAction Stop).Source
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$parts=$Time.Split(':');$at=(Get-Date).Date.AddHours([int]$parts[0]).AddMinutes([int]$parts[1])
$trigger=New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $at
$argument='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+$wrapper+'" -ConfigurationFile "'+$configFile+'"'
$action=New-ScheduledTaskAction -Execute $pwsh -Argument $argument
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 6) -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 10)
$principal=New-ScheduledTaskPrincipal -UserId $owner -LogonType Interactive -RunLevel Limited
if($PSCmdlet.ShouldProcess($TaskName,'Register weekly encrypted backup with automatic authenticated verification')){
 [IO.File]::WriteAllText($configFile,($configuration|ConvertTo-Json))
 Register-ScheduledTask -TaskName $TaskName -Trigger $trigger -Action $action -Settings $settings -Principal $principal -Force|Out-Null
 Write-Output "Registered encrypted/verified weekly backup: $Day $Time, after owner logon. Status file records failures; no automatic archive deletion."
}
