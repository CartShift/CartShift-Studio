#Requires -Version 7.3
# Fixed owner watchdog. Recover paused containers and matching maintenance
# requests even when the streaming backup process is killed.
[CmdletBinding()]
param([Parameter(Mandatory)][string]$LeaseFile)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. "$PSScriptRoot/Common-SandboxHost.ps1"
. "$PSScriptRoot/Common-SandboxBackupBarrier.ps1"
Assert-SandboxBackupLeasePath $LeaseFile
$trustedDocker=[IO.Path]::GetFullPath($script:SandboxDockerExe)
$trustedEndpoint=$script:SandboxDockerEndpoint
Assert-SandboxBackupLocalEndpoint $trustedEndpoint
$failureLogged=$false
$mutex=Get-SandboxBackupLeaseMutex $LeaseFile
function Invoke-SandboxDocker {
 return (Invoke-SandboxBackupTimedDocker -Arguments @args)
}

try {
 while(Test-Path -LiteralPath $LeaseFile){
  $lease=Get-Content -LiteralPath $LeaseFile -Raw|ConvertFrom-Json
  Assert-SandboxBackupLeasePath $LeaseFile
  Assert-SandboxBackupLocalEndpoint $lease.endpoint
  if(![string]::Equals([IO.Path]::GetFullPath($lease.docker),$trustedDocker,[StringComparison]::OrdinalIgnoreCase) -or ![string]::Equals($lease.endpoint,$trustedEndpoint,[StringComparison]::OrdinalIgnoreCase)){throw 'Lease executable or endpoint differs from verified local Docker Desktop.'}
  foreach($id in $lease.ids){if($id -cnotmatch '^[a-f0-9]{12,64}$'){throw 'Invalid lease container identity.'}}
  foreach($barrier in $lease.barriers){if($barrier.id -notin $lease.ids -or $barrier.nonce -cnotmatch '^[a-f0-9]{32}$' -or @($barrier.roles|Where-Object {$_ -notin @('build','auth')}).Count){throw 'Invalid maintenance lease.'}}
  # Docker is resolved and pinned by Common-SandboxHost; JSON never selects an executable.
  [IO.File]::WriteAllText(($LeaseFile+'.watching'),'watching')
  if([DateTime]::UtcNow -ge (Get-SandboxBackupExpiry $lease)){
   Enter-SandboxBackupLeaseMutex $mutex
   try {
    if(!(Test-Path -LiteralPath $LeaseFile)){break}
    [IO.File]::WriteAllText(($LeaseFile+'.abort'),'expired')
    $failed=$false
    foreach($id in $lease.ids){
     try{
      # Only immutable container IDs and the sandbox ownership label are
      # accepted; no arbitrary host path or credential content is inspected.
      $raw=Invoke-SandboxDocker @('inspect','--format','{"owner":{{json (index .Config.Labels "sandbox.owner")}},"paused":{{json .State.Paused}}}',$id)
      $spec=$raw|ConvertFrom-Json
      if($spec.owner -ne 'ai-dev-sandbox'){throw 'Lease container owner changed.'}
      if($spec.paused){Invoke-SandboxDocker @('unpause',$id)|Out-Null}
      foreach($barrier in @($lease.barriers|Where-Object {$_.id -eq $id})){
       [void](Invoke-SandboxBackupMarker $id cleanup $barrier.nonce $barrier.roles)
      }
     } catch {
      $failed=$true
      if(!$failureLogged){
       [IO.File]::WriteAllText(($LeaseFile+'.watchdog-error.log'),([DateTime]::UtcNow.ToString('o')+' Watchdog recovery failed; retrying verified local Docker.'))
       $failureLogged=$true
      }
     }
    }
    if(!$failed){Remove-Item -LiteralPath $LeaseFile -Force;exit 1}
   } finally {$mutex.ReleaseMutex()}
  }
  Start-Sleep -Seconds 3
 }
} finally {$mutex.Dispose()}
