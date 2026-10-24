#Requires -Version 7.3
function Resolve-SandboxPowerShell {
 $candidates=@((Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\pwsh.exe'),(Join-Path $env:ProgramFiles 'PowerShell\7\pwsh.exe'))
 $candidates+=@(Get-Command pwsh -All -ErrorAction SilentlyContinue|ForEach-Object Source|Where-Object {$_ -notmatch '[\\/]codex-runtimes[\\/]'})
 foreach($candidate in $candidates){if($candidate -match '^[A-Za-z]:\\' -and (Test-Path -LiteralPath $candidate -PathType Leaf)){return $candidate}}
 throw 'Install persistent native ARM64 PowerShell 7.3 or later; Codex bundled runtimes are not unattended task dependencies.'
}
function New-SandboxScheduledAction([string[]]$TaskArguments) {
 $pwsh=Resolve-SandboxPowerShell
 foreach($argument in $TaskArguments){if($argument.IndexOfAny([char[]]@(34,10,13)) -ge 0 -or $argument.EndsWith('\')){throw 'Unsupported task argument quoting.'}}
 $arguments=(@($TaskArguments|ForEach-Object {'"'+$_+'"'}) -join ' ')
 New-ScheduledTaskAction -Execute $pwsh -Argument $arguments -WorkingDirectory $PSScriptRoot
}
