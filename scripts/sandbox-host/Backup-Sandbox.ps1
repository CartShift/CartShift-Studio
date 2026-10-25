#Requires -Version 7.3
<# Stream named-volume snapshots directly through age; no plaintext archive or host bind mount. #>
[CmdletBinding()]
param(
 [Parameter(Mandatory)][ValidateSet('Backup','Verify','Restore-Staging')][string]$Action,
 [Parameter(Mandatory)][string]$BackupDir,
 [string]$Recipient, [string]$IdentityFile, [string]$Archive,
 [string[]]$Volumes=@('ai-dev-sandbox-workspace','ai-dev-sandbox-home','ai-dev-sandbox-device-auth','ai-dev-sandbox-provider-auth','ai-dev-sandbox-auth-tools','ai-dev-sandbox-build-home','ai-dev-sandbox-build-device-auth','ai-dev-sandbox-empty-auth','ai-dev-pool-home-1','ai-dev-pool-home-2','ai-dev-pool-empty-auth','ai-dev-sandbox-dc-remote-home'),
 [string]$Container='ai-dev-workspace',
 [string[]]$LocalMcpContainers=@(),
 [string]$AgeExecutable='age.exe',
 [ValidateRange(60,3600)][int]$MaxPauseSeconds=1200
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. "$PSScriptRoot/Common-SandboxHost.ps1"
. "$PSScriptRoot/Common-SandboxBackupBarrier.ps1"
. "$PSScriptRoot/Common-SandboxTask.ps1"
$age=(Get-Command $AgeExecutable -ErrorAction Stop).Source
$BackupDir=[IO.Path]::GetFullPath($BackupDir)
if (!(Test-Path -LiteralPath $BackupDir -PathType Container)) { throw 'Backup directory must already exist.' }
function Process([string]$exe,[string[]]$argv) {
 $si=[Diagnostics.ProcessStartInfo]::new($exe)
 $si.UseShellExecute=$false; $si.CreateNoWindow=$true
 $si.RedirectStandardInput=$true; $si.RedirectStandardOutput=$true; $si.RedirectStandardError=$true
 foreach($argument in $argv){[void]$si.ArgumentList.Add($argument)}
 $p=[Diagnostics.Process]::new();$p.StartInfo=$si;return $p
}
function Pipe([Diagnostics.Process]$producer,[Diagnostics.Process]$consumer,[string]$identity='') {
 try {
  [void]$consumer.Start();$ce=$consumer.StandardError.ReadToEndAsync();$co=$consumer.StandardOutput.BaseStream.CopyToAsync([IO.Stream]::Null)
  [void]$producer.Start();$pe=$producer.StandardError.ReadToEndAsync()
  if($identity){$producer.StandardInput.WriteLine($identity)}
  $producer.StandardInput.Close()
  [void]$producer.StandardOutput.BaseStream.CopyToAsync($consumer.StandardInput.BaseStream).GetAwaiter().GetResult()
  $consumer.StandardInput.Close()
  $producer.WaitForExit();$consumer.WaitForExit()
  $consumerError=$ce.GetAwaiter().GetResult();$producerError=$pe.GetAwaiter().GetResult();[void]$co.GetAwaiter().GetResult()
  if($producer.ExitCode -ne 0 -or $consumer.ExitCode -ne 0){throw ('Snapshot pipeline failed; producer exit '+$producer.ExitCode+', consumer exit '+$consumer.ExitCode+'; no archive certified.')}
 } finally {
  foreach($p in @($producer,$consumer)){try{if(!$p.HasExited){$p.Kill($true)}}catch [InvalidOperationException]{}finally{$p.Dispose()}}
 }
}
$info=(Invoke-SandboxDocker @('inspect',$Container) | ConvertFrom-Json)[0]
$image=$info.Image
if($image -notmatch '^sha256:[0-9a-f]{64}$'){throw 'Pinned local sandbox image required.'}
$endpoint=$script:SandboxDockerEndpoint
Assert-SandboxBackupLocalEndpoint $endpoint
$docker=$script:SandboxDockerExe
$base=@('--host',$endpoint,'run','--rm','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--pids-limit','64','--memory','1g','--cpus','2','--log-driver','none','--label','sandbox.owner=ai-dev-sandbox','--label','io.cartshift.sandbox.backup=stream-v2')
$paused=[Collections.Generic.List[string]]::new()
$partial=$null
$leaseFile=$null
$barriers=@()
$watchdogProcess=$null
$leaseMutex=$null
try {
 if($Action -eq 'Backup'){
  if($Recipient -cnotmatch '^age1[a-z0-9]{58}$'){throw 'Valid age public recipient required.'}
  $available=@(Invoke-SandboxDocker @('volume','ls','--format','{{.Name}}'))
  $selected=@($Volumes|Where-Object {$_ -in $available})
  foreach($required in @('ai-dev-sandbox-workspace','ai-dev-sandbox-home','ai-dev-sandbox-device-auth')){if($required -notin $selected){throw 'Required baseline volume absent.'}}
  foreach($v in $selected){
   if($v -cnotmatch '^ai-dev-(?:sandbox|pool)-[a-z0-9-]+$'){throw 'Unexpected volume name.'}
   $owner=Invoke-SandboxDocker @('volume','inspect','--format','{{index .Labels "sandbox.owner"}}',$v)
   if(($owner -join '').Trim() -ne 'ai-dev-sandbox'){throw 'Unexpected volume ownership.'}
  }
  # Request cooperative barriers before pausing writers. A V3 worker cannot
  # acknowledge this protocol: its backup skips safely without freezing it.
  $running=@(Invoke-SandboxDocker @('ps','-q'))
  $writers=@();$writerStarted=@{}
  function Label($labels,[string]$key) {
   $property=$labels.PSObject.Properties[$key]
   if($property){return [string]$property.Value}
   return ''
  }
  foreach($id in $running){
   $c=(Invoke-SandboxDocker @('inspect',$id)|ConvertFrom-Json)[0]
   if(@($c.Mounts|Where-Object {$_.Type -eq 'volume' -and $_.Name -in $selected -and $_.RW}).Count){
    if((Label $c.Config.Labels 'sandbox.owner') -ne 'ai-dev-sandbox'){throw 'Unexpected writer shares sandbox volumes.'}
    if($c.State.Paused){throw 'A source writer was already paused; backup will not take over another maintenance operation.'}
    $writers+=$id
    $writerStarted[$id]=$c.State.StartedAt
    if((Label $c.Config.Labels 'io.cartshift.sandbox.managed') -eq 'dev-service-v1'){continue}
    # The owner-approved remote agent cannot acknowledge MCP maintenance nonces.
    # Pause it like an external managed server to capture a crash-consistent
    # filesystem snapshot. Do not claim it was transactionally quiescent.
    if((Label $c.Config.Labels 'io.cartshift.sandbox.dc-role') -eq 'remote'){
     if($c.Name.TrimStart('/') -ne 'ai-dev-sandbox-dc-remote' -or
        $c.Image -ne $image -or $c.Config.Hostname -ne 'ai-docker-sandbox' -or
        @($c.Mounts|Where-Object {$_.Destination -eq '/workspace/.auth' -and $_.RW}).Count){
      throw 'Unexpected remote MCP sidecar. Refusing to pause unverified writer.'
     }
     continue
    }
    if($c.Name.TrimStart('/') -in $LocalMcpContainers){
     if((Label $c.Config.Labels 'io.cartshift.sandbox.build') -ne 'credential-isolated-v1'){throw 'Local MCP pause exemption requires an isolated build container.'}
     continue # Owner-listed local-only runtime is frozen with all writers below.
    }
    if((Label $c.Config.Labels 'io.cartshift.sandbox.auth') -eq 'isolated-v1'){$roles=@('auth')}
    elseif((Label $c.Config.Labels 'io.cartshift.sandbox.build') -eq 'credential-isolated-v1'){$roles=@('build')}
    elseif((Label $c.Config.Labels 'io.cartshift.sandbox.pool-slot') -match '^[1-8]$'){$roles=@('build')}
    elseif($c.Config.Hostname -eq 'ai-docker-sandbox'){$roles=@('build','auth')}
    else{throw 'Unknown sandbox volume writer; no safe maintenance protocol.'}
    $barriers+=@{id=$id;nonce=[Guid]::NewGuid().ToString('N');roles=$roles}
   }
  }
  $leaseDirectory=Get-SandboxBackupLeaseDirectory -Create
  $leaseFile=Join-Path $leaseDirectory ('backup-pause-'+[Guid]::NewGuid().ToString('N')+'.json')
  $leaseMutex=Get-SandboxBackupLeaseMutex $leaseFile
  [IO.File]::WriteAllText($leaseFile,(@{endpoint=$endpoint;docker=$docker;ids=$writers;barriers=$barriers;expires=[DateTime]::UtcNow.AddSeconds($MaxPauseSeconds).ToString('o')}|ConvertTo-Json -Depth 8))
  Assert-SandboxBackupLeasePath $leaseFile
  $watchdog=Join-Path $PSScriptRoot 'Watch-SandboxBackupPause.ps1'
  $pwsh=Resolve-SandboxPowerShell
  $watchdogProcess=Start-Process -FilePath $pwsh -WindowStyle Hidden -PassThru -ArgumentList @('-NoProfile','-NonInteractive','-WindowStyle','Hidden','-File',('"'+$watchdog+'"'),'-LeaseFile',('"'+$leaseFile+'"'))
  $started=[Diagnostics.Stopwatch]::StartNew()
  while(!(Test-Path -LiteralPath ($leaseFile+'.watching'))){
   if($watchdogProcess.HasExited -or $started.Elapsed.TotalSeconds -ge 10){throw 'Backup pause watchdog did not initialize; no requests sent.'}
   Start-Sleep -Milliseconds 100
  }
  foreach($barrier in $barriers){
   [void](Invoke-SandboxBackupMarker $barrier.id request $barrier.nonce $barrier.roles)
  }
  $wait=[Diagnostics.Stopwatch]::StartNew()
  do {
   $allReady=$true
   foreach($barrier in $barriers){
    $remaining=60000-[int]$wait.Elapsed.TotalMilliseconds
    if($remaining -lt 100){throw 'Backup skipped: maintenance acknowledgement deadline reached.'}
    $callTimeout=[Math]::Min(10000,$remaining)
    if((Invoke-SandboxBackupMarker $barrier.id check $barrier.nonce $barrier.roles -TimeoutMilliseconds $callTimeout) -ne 'ready'){$allReady=$false}
   }
   if($allReady){break}
   if($wait.Elapsed.TotalSeconds -ge 60){throw 'Backup skipped: worker busy, unavailable, or too old to acknowledge maintenance within 60 seconds.'}
   if($watchdogProcess.HasExited -or (Test-Path -LiteralPath ($leaseFile+'.abort'))){throw 'Backup maintenance watchdog expired or exited.'}
   Start-Sleep -Milliseconds 500
  } while($true)
  foreach($id in $writers){
   # An expiry cannot clear the nonce between the final readiness check and
   # pause. A killed parent abandons the mutex and watchdog recovers all IDs.
   Enter-SandboxBackupLeaseMutex $leaseMutex
   try {
    $currentLease=Get-Content -LiteralPath $leaseFile -Raw|ConvertFrom-Json
    if($watchdogProcess.HasExited -or (Test-Path -LiteralPath ($leaseFile+'.abort')) -or [DateTime]::UtcNow -ge (Get-SandboxBackupExpiry $currentLease)){throw 'Backup maintenance lease no longer valid.'}
    $barrier=@($barriers|Where-Object {$_.id -eq $id})
    if($barrier.Count -and (Invoke-SandboxBackupMarker $id check $barrier[0].nonce $barrier[0].roles) -ne 'ready'){throw 'Maintenance nonce/readiness changed before pause.'}
    Invoke-SandboxBackupTimedDocker -Arguments @('pause',$id)|Out-Null
    $paused.Add($id)
   } finally {$leaseMutex.ReleaseMutex()}
  }
  # A service started during the readiness wait must not silently write into
  # this snapshot. Abort and retry rather than add a writer after the barrier.
  foreach($id in @(Invoke-SandboxDocker @('ps','-q'))){
   if($id -in $writers){continue}
   $other=(Invoke-SandboxDocker @('inspect',$id)|ConvertFrom-Json)[0]
   if(@($other.Mounts|Where-Object {$_.Type -eq 'volume' -and $_.Name -in $selected -and $_.RW}).Count){throw 'Writer set changed during maintenance preparation; snapshot skipped.'}
  }
  $mounts=@();foreach($v in $selected){$mounts+=@('--mount',"type=volume,source=$v,target=/snapshot/$v,readonly,volume-nocopy")}
  $stamp=(Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')+'-'+[Guid]::NewGuid().ToString('N').Substring(0,8)
  $sealed=Join-Path $BackupDir "sandbox-$stamp.tar.gz.age";$partial="$sealed.partial"
  $producer=Process $docker ($base+@('--user','1000:1000')+$mounts+@('--entrypoint','/bin/tar',$image,'-czf','-','-C','/snapshot','.'))
  $consumer=Process $age @('-r',$Recipient,'-o',$partial)
  Pipe $producer $consumer
  # Serialize completion against expiry: after the successful stream, release
  # writers and matching barriers before publishing any certified archive.
  Enter-SandboxBackupLeaseMutex $leaseMutex
  try {
   $lease=Get-Content -LiteralPath $leaseFile -Raw|ConvertFrom-Json
   if($watchdogProcess.HasExited -or (Test-Path -LiteralPath ($leaseFile+'.abort')) -or [DateTime]::UtcNow -ge (Get-SandboxBackupExpiry $lease)){throw 'Backup exceeded quiescence deadline; archive not certified.'}
   Assert-SandboxBackupWritersPaused -Ids @($paused) -Started $writerStarted
   foreach($id in $paused){Invoke-SandboxBackupTimedDocker -Arguments @('unpause',$id)|Out-Null}
   $paused.Clear()
   foreach($barrier in $barriers){[void](Invoke-SandboxBackupMarker $barrier.id cleanup $barrier.nonce $barrier.roles)}
   $barriers=@()
   if([DateTime]::UtcNow -ge (Get-SandboxBackupExpiry $lease)){throw 'Backup cleanup crossed the maintenance deadline; archive not certified.'}
   # A watchdog holding this mutex cannot issue a late abort after lease removal.
   Remove-Item -LiteralPath $leaseFile -Force
  } finally {$leaseMutex.ReleaseMutex()}
  Move-Item -LiteralPath $partial -Destination $sealed
  $digest=(Get-FileHash -LiteralPath $sealed -Algorithm SHA256).Hash.ToLowerInvariant()
  [IO.File]::WriteAllText("$sealed.sha256",$digest)
  [IO.File]::WriteAllText("$sealed.manifest.json",(@{version=2;volumes=$selected;image=$image;created_utc=[DateTime]::UtcNow.ToString('o');recipient=$Recipient;sha256=$digest}|ConvertTo-Json))
  Write-Output $sealed
  return
 }
 if(!$Archive -or !(Test-Path -LiteralPath $Archive -PathType Leaf)){throw 'Existing encrypted archive required.'}
 if(!$IdentityFile -or !(Test-Path -LiteralPath $IdentityFile -PathType Leaf)){throw 'Owner DPAPI-protected age identity required.'}
 if(!(Test-Path -LiteralPath "$Archive.sha256")){throw 'Archive checksum sidecar required.'}
 $expected=([IO.File]::ReadAllText("$Archive.sha256")).Trim()
 if($expected -cnotmatch '^[0-9a-f]{64}$' -or (Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw 'Encrypted archive checksum mismatch.'}
 $secure=([IO.File]::ReadAllText($IdentityFile)).Trim() | ConvertTo-SecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try {
  $identity=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $producer=Process $age @('-d','-i','-',$Archive)
  if($Action -eq 'Verify'){
   $consumer=Process $docker ($base+@('--user','1000:1000','-i','--entrypoint','/bin/tar',$image,'-tzf','-'))
   Pipe $producer $consumer $identity
   Write-Output 'Authenticated decryption and archive verification passed without plaintext staging.'
  } else {
   $stage='ai-dev-sandbox-restore-'+[Guid]::NewGuid().ToString('N')
   Invoke-SandboxDocker @('volume','create','--label','sandbox.owner=ai-dev-sandbox','--label','io.cartshift.sandbox.restore=staging-v2',$stage)|Out-Null
   # One fixed owner-side volume initialization; never gives worker code privileges.
   Invoke-SandboxDocker @('run','--rm','--network','none','--read-only','--user','0:0','--cap-drop','ALL','--cap-add','CHOWN','--security-opt','no-new-privileges:true','--mount',"type=volume,source=$stage,target=/restore,volume-nocopy",'--entrypoint','/bin/chown',$image,'1000:1000','/restore')|Out-Null
   $consumer=Process $docker ($base+@('--user','1000:1000','-i','--mount',"type=volume,source=$stage,target=/restore,volume-nocopy",'--entrypoint','/bin/tar',$image,'--no-same-owner','-xzf','-','-C','/restore'))
   Pipe $producer $consumer $identity
   Invoke-SandboxDocker @('run','--rm','--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--mount',"type=volume,source=$stage,target=/restore,readonly,volume-nocopy",'--entrypoint','/usr/bin/test',$image,'-f','/restore/ai-dev-sandbox-workspace/README.md')|Out-Null
   Write-Output "Staging-only restore verified: $stage"
  }
 } finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr);$identity=$null;$secure.Dispose()}
} finally {
 $unpauseFailed=$false
 foreach($id in $paused){
  try{
   $isPaused=((Invoke-SandboxDocker @('inspect','--format','{{.State.Paused}}',$id)) -join '').Trim()
   if($isPaused -eq 'true'){Invoke-SandboxBackupTimedDocker -Arguments @('unpause',$id)|Out-Null}
  }catch{$unpauseFailed=$true}
 }
 foreach($barrier in $barriers){
  try{
   $isPaused=((Invoke-SandboxDocker @('inspect','--format','{{.State.Paused}}',$barrier.id)) -join '').Trim()
   if($isPaused -eq 'true'){throw 'Do not exec marker cleanup in a still-paused container.'}
   [void](Invoke-SandboxBackupMarker $barrier.id cleanup $barrier.nonce $barrier.roles)
  }catch{$unpauseFailed=$true}
 }
 if(!$unpauseFailed -and $leaseFile -and (Test-Path -LiteralPath $leaseFile)){
  Enter-SandboxBackupLeaseMutex $leaseMutex
  try{if(Test-Path -LiteralPath $leaseFile){Remove-Item -LiteralPath $leaseFile -Force}}finally{$leaseMutex.ReleaseMutex()}
 }
 if($leaseMutex){$leaseMutex.Dispose()}
 if($watchdogProcess){$watchdogProcess.Dispose()}
 if($partial -and (Test-Path -LiteralPath $partial)){Remove-Item -LiteralPath $partial -Force}
 if($unpauseFailed){throw 'Backup cleanup incomplete. Watchdog will retry; inspect dedicated container maintenance state.'}
}
