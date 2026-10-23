#Requires -Version 7.3
# Marker operations are fixed, no-follow and contain only an unpredictable nonce.
$script:SandboxBackupMarkerPython=@'
import ctypes,errno,os,re,stat,sys,time
action,nonce,roles=sys.argv[1:]
if action not in ('request','check','cleanup') or re.fullmatch('[a-f0-9]{32}',nonce) is None: raise RuntimeError('Invalid maintenance operation')
channels=roles.split(',') if roles else []
if not channels or len(channels)!=len(set(channels)) or any(x not in ('build','auth') for x in channels): raise RuntimeError('Invalid maintenance channel')
if os.geteuid()!=1000: raise RuntimeError('Maintenance requires UID1000')
payload=(nonce+'\n').encode('ascii')
root=os.open('/tmp',os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW|os.O_CLOEXEC)
request='cartshift-backup-request'
ready=['cartshift-backup-'+role+'-ready' for role in channels]
temporary='.cartshift-backup-request-'+nonce+'.pending'
def read(name):
 try: fd=os.open(name,os.O_RDONLY|os.O_NOFOLLOW|os.O_CLOEXEC|os.O_NONBLOCK,dir_fd=root)
 except FileNotFoundError: return None
 try:
  info=os.fstat(fd)
  if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1 or info.st_uid!=1000 or stat.S_IMODE(info.st_mode)!=0o600: raise RuntimeError('Unsafe maintenance marker')
  data=os.read(fd,65)
  if os.read(fd,1): raise RuntimeError('Oversized maintenance marker')
  return info,data
 finally: os.close(fd)
def remove_matching(name):
 item=read(name)
 if item is None or item[1]!=payload: return
 try: current=os.stat(name,dir_fd=root,follow_symlinks=False)
 except FileNotFoundError: return
 if (current.st_dev,current.st_ino)!=(item[0].st_dev,item[0].st_ino): return
 os.unlink(name,dir_fd=root)
try:
 if action=='request':
  # Publish a completely written regular file atomically. renameat2 with
  # RENAME_NOREPLACE refuses every existing destination, including symlinks.
  fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW|os.O_CLOEXEC,0o600,dir_fd=root)
  try:
   os.fchmod(fd,0o600)
   view=memoryview(payload)
   while view:
    count=os.write(fd,view)
    if count<=0: raise RuntimeError('Incomplete maintenance request')
    view=view[count:]
   os.fsync(fd)
  finally: os.close(fd)
  try:
   libc=ctypes.CDLL(None,use_errno=True)
   if libc.renameat2(root,temporary.encode(),root,request.encode(),1)!=0:
    code=ctypes.get_errno(); raise OSError(code,os.strerror(code))
  finally: remove_matching(temporary)
  print('requested')
 elif action=='cleanup':
  # Removing this request first lets the worker resume and clear its own
  # ready markers. Compare inode/content before each unlink; never follow links.
  remove_matching(request)
  remove_matching(temporary)
  for name in ready: remove_matching(name)
  print('cleared')
 else:
  item=read(request)
  if item is None or item[1]!=payload: raise RuntimeError('Maintenance request changed')
  age=time.time()-item[0].st_mtime
  if not -60<=age<3600: raise RuntimeError('Maintenance request expired')
  pending=False
  for name in ready:
   marker=read(name)
   # The worker publishes with O_EXCL then writes: an empty/partial fresh
   # regular ready file is pending, never an acknowledgement.
   if marker is None or marker[1]!=payload: pending=True
  # Request must remain the same after every readiness read.
  again=read(request)
  if again is None or again[1]!=payload or (again[0].st_dev,again[0].st_ino)!=(item[0].st_dev,item[0].st_ino): raise RuntimeError('Maintenance request raced')
  print('waiting' if pending else 'ready')
finally: os.close(root)
'@
function Invoke-SandboxBackupTimedDocker([string[]]$Arguments,[ValidateRange(100,10000)][int]$TimeoutMilliseconds=10000) {
 $si=[Diagnostics.ProcessStartInfo]::new($script:SandboxDockerExe)
 $si.UseShellExecute=$false;$si.CreateNoWindow=$true
 $si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 foreach($arg in (@('--host',$script:SandboxDockerEndpoint)+$Arguments)){[void]$si.ArgumentList.Add($arg)}
 $process=[Diagnostics.Process]::new();$process.StartInfo=$si
 try {
  [void]$process.Start()
  $stdout=$process.StandardOutput.ReadToEndAsync();$stderr=$process.StandardError.ReadToEndAsync()
  if(!$process.WaitForExit($TimeoutMilliseconds)){try{$process.Kill($true)}catch{};throw 'Backup Docker control operation timed out.'}
  $result=$stdout.GetAwaiter().GetResult();[void]$stderr.GetAwaiter().GetResult()
  if($process.ExitCode -ne 0){throw 'Backup Docker control operation failed.'}
  return $result
 } finally {$process.Dispose()}
}
function Invoke-SandboxBackupMarker([string]$ContainerId,[string]$Operation,[string]$Nonce,[string[]]$Roles,[ValidateRange(100,10000)][int]$TimeoutMilliseconds=10000) {
 if ($ContainerId -cnotmatch '^[a-f0-9]{12,64}$' -or $Nonce -cnotmatch '^[a-f0-9]{32}$') { throw 'Invalid backup maintenance identity.' }
 $roleArgument=$Roles -join ','
 $reply=Invoke-SandboxBackupTimedDocker -Arguments @('exec','--user','1000:1000',$ContainerId,'python3','-I','-c',$script:SandboxBackupMarkerPython,$Operation,$Nonce,$roleArgument) -TimeoutMilliseconds $TimeoutMilliseconds
 return (($reply -join '').Trim())
}
function Get-SandboxBackupLeaseMutex([string]$Path) {
 $bytes=[Text.Encoding]::UTF8.GetBytes([IO.Path]::GetFullPath($Path))
 $hash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes))
 return [Threading.Mutex]::new($false,('Local\CartShiftBackupLease-'+$hash))
}
function Enter-SandboxBackupLeaseMutex($Mutex) {
 try { [void]$Mutex.WaitOne() } catch [Threading.AbandonedMutexException] { }
}

function Assert-SandboxBackupLocalEndpoint([string]$Endpoint) {
 if($Endpoint -cnotmatch '^npipe:/{2,4}\./pipe/[A-Za-z0-9_.-]+$'){throw 'Backup requires a local Windows Docker named pipe.'}
}
function Assert-SandboxBackupPrivatePath([string]$Path) {
 $item=Get-Item -LiteralPath $Path -Force -ErrorAction Stop
 if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Private backup state cannot use reparse points.'}
 $acl=Get-Acl -LiteralPath $Path -ErrorAction Stop
 $owner=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
 if($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $owner){throw 'Backup state must be owned by the current Windows owner.'}
 $ownerAllowed=$false;$systemAllowed=$false
 foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
  if($rule.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow){continue}
  $sid=$rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
  if($sid -notin @($owner,'S-1-5-18')){throw 'Backup state permits access beyond the owner and SYSTEM.'}
  if($sid -eq $owner){$ownerAllowed=$true}
  if($sid -eq 'S-1-5-18'){$systemAllowed=$true}
 }
 if(!$ownerAllowed -or !$systemAllowed){throw 'Backup state needs explicit owner and SYSTEM access.'}
}
function Get-SandboxBackupLeaseDirectory([switch]$Create) {
 $local=[Environment]::GetFolderPath([Environment+SpecialFolder]::LocalApplicationData)
 if(!$local -or ![IO.Path]::IsPathFullyQualified($local)){throw 'LocalAppData is unavailable.'}
 $root=Join-Path $local 'CartShiftSandbox'
 Assert-SandboxBackupPrivatePath $root
 $directory=Join-Path $root 'backup-leases'
 if(!(Test-Path -LiteralPath $directory -PathType Container)){
  if(!$Create){throw 'Private backup lease directory is absent.'}
  New-Item -ItemType Directory -Path $directory -ErrorAction Stop | Out-Null
  $ownerSid=[Security.Principal.WindowsIdentity]::GetCurrent().User
  $acl=[Security.AccessControl.DirectorySecurity]::new()
  $acl.SetOwner($ownerSid)
  $acl.SetAccessRuleProtection($true,$false)
  $inherit=[Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
  foreach($sid in @($ownerSid,[Security.Principal.SecurityIdentifier]::new('S-1-5-18'))){
   $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,[Security.AccessControl.FileSystemRights]::FullControl,$inherit,[Security.AccessControl.PropagationFlags]::None,[Security.AccessControl.AccessControlType]::Allow))
  }
  Set-Acl -LiteralPath $directory -AclObject $acl -ErrorAction Stop
 }
 Assert-SandboxBackupPrivatePath $directory
 return [IO.Path]::GetFullPath($directory)
}
function Assert-SandboxBackupLeasePath([string]$Path) {
 $directory=Get-SandboxBackupLeaseDirectory
 $full=[IO.Path]::GetFullPath($Path)
 if(![string]::Equals([IO.Path]::GetDirectoryName($full),$directory,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($full) -cnotmatch '^backup-pause-[a-f0-9]{32}\.json$'){throw 'Backup lease must be in the private local lease directory.'}
 Assert-SandboxBackupPrivatePath $full
}
