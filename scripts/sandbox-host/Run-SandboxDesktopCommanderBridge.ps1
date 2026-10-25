#Requires -Version 7.3
[CmdletBinding()]
param(
 [Parameter(Mandatory)][string]$BridgeSource,
 [Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{64}$')][string]$BridgeSha256,
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
 [ValidateSet('ai-dev-workspace')][string]$Container='ai-dev-workspace',
 [switch]$Once
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$BridgeSource=[IO.Path]::GetFullPath($BridgeSource)
. "$PSScriptRoot/Common-SandboxTask.ps1"
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$mutex=[Threading.Mutex]::new($false,"Local\CartShiftDesktopCommanderBridge-$sid")
try{$owns=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$owns=$true}
if(!$owns){$mutex.Dispose();throw 'Local Desktop Commander bridge already has an owner supervisor.'}
try{
 while($true){
  $source=[IO.File]::ReadAllText($BridgeSource)
  if((Get-FileHash -LiteralPath $BridgeSource -Algorithm SHA256).Hash.ToLowerInvariant() -ne $BridgeSha256){throw 'Reviewed local bridge source changed; refusing startup.'}
  $process=$null;$exit=1
  try{
   Wait-SandboxDockerForBackup -MaxWaitSeconds 300 -Probe {
    . "$PSScriptRoot/Common-SandboxHost.ps1"
   } -StartDocker {
    & $script:SandboxDockerExe desktop start --detach --timeout 30 *> $null
    if($LASTEXITCODE -ne 0){throw [IO.IOException]::new('Docker startup request failed.')}
   }
   # Probe runs in a child scope; load the verified helpers in this scope too.
   . "$PSScriptRoot/Common-SandboxHost.ps1"
   $spec=Get-SandboxSpec $Container
   Assert-SandboxRestrictions $spec
   if($spec.image -ne $ImageId -or $spec.hostname -ne 'ai-docker-sandbox' -or $spec.labels.'io.cartshift.sandbox.build' -ne 'credential-isolated-v1'){throw 'Local MCP runtime identity mismatch.'}
   Assert-SandboxMount $spec '/workspace' 'ai-dev-sandbox-workspace' $true
   Assert-SandboxMount $spec '/workspace/.auth' 'ai-dev-sandbox-empty-auth' $false
   Assert-SandboxMount $spec '/home/node' 'ai-dev-sandbox-build-home' $true
   Assert-SandboxMount $spec '/home/node/.desktop-commander-device' 'ai-dev-sandbox-build-device-auth' $true
   if(@($spec.mounts).Count -ne 4 -or !$spec.running -or $spec.paused){throw 'Local MCP runtime unavailable or paused for owner maintenance.'}
   $si=[Diagnostics.ProcessStartInfo]::new($script:SandboxDockerExe)
   $si.UseShellExecute=$false;$si.CreateNoWindow=$true
   $si.RedirectStandardInput=$true;$si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
   foreach($argument in @('--host',$script:SandboxDockerEndpoint,'exec','-i','--user','1000:1000','--workdir','/workspace','--env','DESKTOP_COMMANDER_DISABLE_TELEMETRY=1',$Container,'node','--input-type=module','-','serve')){[void]$si.ArgumentList.Add($argument)}
   $process=[Diagnostics.Process]::Start($si)
   $stdout=$process.StandardOutput.ReadToEndAsync();$stderr=$process.StandardError.ReadToEndAsync()
   $process.StandardInput.Write($source);$process.StandardInput.Close()
   $process.WaitForExit();$exit=$process.ExitCode
   [void]$stdout.GetAwaiter().GetResult();[void]$stderr.GetAwaiter().GetResult()
  }catch{if($Once){throw};Write-Warning 'Local Desktop Commander unavailable; retrying only the verified Docker runtime.'}
  finally{if($process){if(!$process.HasExited){$process.Kill($true)};$process.Dispose()}}
  if($Once){exit $exit}
  Start-Sleep -Seconds 10
 }
}finally{$mutex.ReleaseMutex();$mutex.Dispose()}
