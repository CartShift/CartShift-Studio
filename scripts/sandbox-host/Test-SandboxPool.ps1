#Requires -Version 7.3
<# Real Docker command isolation acceptance. No backend credential is used.
Run only against the staged pool, never the legacy or auth container. #>
[CmdletBinding()]
param([string]$Prefix='ai-dev-pool',[Parameter(Mandatory)][string]$WorkerSource)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Prefix -cnotmatch '^[a-z][a-z0-9-]{2,40}$') { throw 'Invalid prefix.' }
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
$worker=[Convert]::ToBase64String([IO.File]::ReadAllBytes([IO.Path]::GetFullPath($WorkerSource)))
$fixture=@'
import base64,hashlib,json,os,pathlib,sys,threading,time,types
source=base64.b64decode(sys.stdin.buffer.readline())
w=types.ModuleType('fixture');exec(compile(source,'<pool-acceptance>','exec'),w.__dict__)
w.TOKEN='fixture-not-a-real-credential-0000000000000000000000000000'
w.protect_credential();w.verify_identity()
mode=sys.argv[1]
root=pathlib.Path('/workspace/experiments/parallel-host-acceptance');root.mkdir(exist_ok=True)
if mode=='survivor': command='sleep 4; printf survived'
elif mode=='cancel': command='sleep 20'
elif mode=='crash': command='sleep 20'
elif mode=='stalled': command='kill -STOP "$PPID"; sleep 20; printf stale'
else: command='sleep 10; printf parallel'
cancel=threading.Event()
if mode=='cancel': threading.Timer(.5,cancel.set).start()
result=w.execute({'job_id':'host-acceptance-'+mode,'lease_token':'fixture','command':command,'cwd':str(root),'timeout_seconds':25},cancel)
marker=root/('slot-'+str(w.PARALLEL_SLOT));marker.write_text('persistent-pool-proof')
print(json.dumps(result),flush=True)
'@
function Start-Proof([int]$Slot,[string]$Mode) {
 $spec=Get-SandboxSpec "$Prefix-$Slot"; Assert-SandboxRestrictions $spec
 if ($spec.labels.'io.cartshift.sandbox.pool-slot' -ne "$Slot") { throw 'Refusing non-pool container.' }
 $si=[Diagnostics.ProcessStartInfo]::new($script:SandboxDockerExe)
 $si.UseShellExecute=$false;$si.CreateNoWindow=$true;$si.RedirectStandardInput=$true;$si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 foreach ($arg in @('--host',$script:SandboxDockerEndpoint,'exec','-i','-e','SANDBOX_WORKER_ROLE=build','-e',"SANDBOX_WORKER_SLOT=$Slot","$Prefix-$Slot",'python3','-I','-c',$fixture,$Mode)) { [void]$si.ArgumentList.Add($arg) }
 $process=[Diagnostics.Process]::Start($si)
 $process.StandardInput.WriteLine($worker);$process.StandardInput.Close()
 return $process
}
function Finish-Proof($Process) {
 if (!$Process.WaitForExit(35000)) { $Process.Kill($true); throw 'Proof exceeded bounded deadline.' }
 $text=$Process.StandardOutput.ReadToEnd();$errorText=$Process.StandardError.ReadToEnd()
 if ($Process.ExitCode -ne 0) { throw "Proof failed: $errorText" }
 $Process.Dispose(); return $text | ConvertFrom-Json
}
$elapsed=[Diagnostics.Stopwatch]::StartNew()
$a=Start-Proof 1 'parallel'; $b=Start-Proof 2 'parallel'
$ra=Finish-Proof $a; $rb=Finish-Proof $b; $elapsed.Stop()
if ($ra.exit_code -ne 0 -or $rb.exit_code -ne 0 -or $ra.stdout -ne 'parallel' -or $rb.stdout -ne 'parallel' -or $elapsed.Elapsed.TotalSeconds -ge 14) { throw 'Parallel acceptance failed.' }
Write-Output ('Two Docker 10-second commands: {0:N3}s' -f $elapsed.Elapsed.TotalSeconds)
$a=Start-Proof 1 'cancel';$b=Start-Proof 2 'survivor'
$ra=Finish-Proof $a;$rb=Finish-Proof $b
if ($ra.exit_code -ne 130 -or $rb.exit_code -ne 0 -or $rb.stdout -ne 'survived') { throw 'Cancellation isolation failed.' }
Write-Output 'Cancellation isolation: pass'
$a=Start-Proof 1 'crash';$b=Start-Proof 2 'survivor'
Start-Sleep -Milliseconds 700
Invoke-SandboxDocker restart --time 1 "$Prefix-1" | Out-Null
if (!$a.WaitForExit(5000)) { $a.Kill($true); throw 'Crashed slot transport did not exit.' }
$a.Dispose();$rb=Finish-Proof $b
if ($rb.exit_code -ne 0 -or $rb.stdout -ne 'survived') { throw 'Restart isolation failed.' }
foreach ($i in 1..2) {
 Invoke-SandboxDocker exec "$Prefix-$i" python3 -I -c 'from pathlib import Path; assert Path("/workspace/experiments/parallel-host-acceptance/slot-"+__import__("sys").argv[1]).read_text()=="persistent-pool-proof"' $i | Out-Null
}
Write-Output 'Independent container restart and persistent workspace: pass'
$a=Start-Proof 1 'cancel';$ra=Finish-Proof $a
if ($ra.exit_code -ne 130) { throw 'Restarted slot did not recover.' }
Write-Output 'Restarted slot accepts and cleans new work: pass'

# Exercise real parent SIGSTOP against host watchdog; synthetic lease metadata
# avoids passing any backend credential to this host acceptance fixture.
. (Join-Path $PSScriptRoot 'Common-SandboxPool.ps1')
function Invoke-PoolControl([string]$Action,[string]$WorkerId,[string]$Token,[int]$Slot) {
 return @{acknowledged=$true;job_id='stopped-parent-fixture';lease_expires_at=1;now=2;last_seen_at=2}
}
$a=Start-Proof 1 'stalled';$b=Start-Proof 2 'survivor'
$watch=[Diagnostics.Stopwatch]::StartNew()
$code=Wait-SandboxPoolWorker -Process $a -Slot 1 -WorkerId ('a'*32) -Token 'fixture' -Container "$Prefix-1"
if (!$a.WaitForExit(5000)) { $a.Kill($true);throw 'Watchdog did not fence stopped worker.' }
$a.Dispose();$rb=Finish-Proof $b
if ($watch.Elapsed.TotalSeconds -gt 15 -or $rb.exit_code -ne 0 -or $rb.stdout -ne 'survived') { throw 'Independent watchdog isolation failed.' }
Write-Output 'Stopped Python parent: host watchdog fenced its container; other slot survived'
