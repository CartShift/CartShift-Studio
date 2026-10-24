#Requires -Version 7.3
# Independent owner watchdog; no Python timer dependency.
function Invoke-PoolControl([string]$Action,[string]$WorkerId,[string]$Token,[int]$Slot,[AllowNull()][string]$ExpectedWorkerId) {
 $payload=@{action=$Action;worker_version=5;slot=$Slot;worker_id=$WorkerId}
 if ($Action -eq 'fenced') { $payload.expected_worker_id=if($ExpectedWorkerId){$ExpectedWorkerId}else{$null} }
 $body=$payload|ConvertTo-Json -Compress
 $result=Invoke-RestMethod -Uri 'https://portal.cart-shift.com/api/cartshift-mcp/sandbox/worker' -Method Post -Headers @{Authorization="Bearer $Token"} -ContentType 'application/json' -Body $body -MaximumRedirection 0 -TimeoutSec 10
 if ($result.acknowledged -ne $true) { throw 'Pool control not acknowledged.' }
 return $result
}

function Wait-SandboxPoolWorker($Process,[int]$Slot,[string]$WorkerId,[string]$Token,[string]$Container) {
    $stdout=$process.StandardOutput.ReadLineAsync();$stderr=$process.StandardError.ReadLineAsync()
    $clock=[Diagnostics.Stopwatch]::StartNew();$lastControl=0L;$hardDeadline=[double]::PositiveInfinity
    while (!$process.WaitForExit(1000)) {
     foreach ($stream in @('stdout','stderr')) {
      $pending=Get-Variable -Name $stream -ValueOnly
      if ($pending -and $pending.IsCompleted) {
       # Worker diagnostics contain bounded metadata only; never relay arbitrary
       # exception messages or HTTP responses from the credential transport.
       if ($null -ne $pending.Result) {
        if ($pending.Result -match '^(Sandbox worker started|A sandbox worker is already running|Worker poll error: [A-Za-z]+ ?[0-9]*$|Result not acknowledged|Sandbox worker refused to start: [A-Za-z]+$)') { Write-Output "Slot ${Slot}: $($pending.Result)" }
        $next=if ($stream -eq 'stdout') {$process.StandardOutput.ReadLineAsync()}else{$process.StandardError.ReadLineAsync()}
        Set-Variable -Name $stream -Value $next
       } else { Set-Variable -Name $stream -Value $null }
      }
     }
     if ($clock.ElapsedMilliseconds - $lastControl -ge 5000) {
      try {
       $state=Invoke-PoolControl 'supervise' $workerId $token $Slot
       $lastControl=$clock.ElapsedMilliseconds
       if ($state.job_id) { $hardDeadline=$clock.ElapsedMilliseconds+[Math]::Max(0,([double]$state.lease_expires_at-[double]$state.now)) }
       else { $hardDeadline=[double]::PositiveInfinity }
       if ([double]$state.now-[double]$state.last_seen_at -ge 90000) { $hardDeadline=$clock.ElapsedMilliseconds }
      } catch {
       if ($clock.ElapsedMilliseconds-$lastControl -lt 90000 -and $clock.ElapsedMilliseconds -lt $hardDeadline) { continue }
      }
     }
     if ($clock.ElapsedMilliseconds -ge $hardDeadline -or $clock.ElapsedMilliseconds-$lastControl -ge 90000) {
      # Independent of Python timers/signals. Respect an owner backup pause.
      $paused=Invoke-SandboxDocker inspect --format '{{.State.Paused}}' $container
      if ($paused -ne 'true') { Invoke-SandboxDocker restart --time 1 $container | Out-Null; break }
     }
    }
    return $(if($process.HasExited){$process.ExitCode}else{1})
}
