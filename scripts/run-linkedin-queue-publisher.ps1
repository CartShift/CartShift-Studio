$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repoRoot 'data/social/linkedin-publisher.log'

Set-Location $repoRoot
$env:LINKEDIN_VERSION = if ($env:LINKEDIN_VERSION) { $env:LINKEDIN_VERSION } else { '202604' }

$timestamp = Get-Date -Format o
Add-Content -Path $logFile -Value "[$timestamp] Starting LinkedIn queue publisher"

try {
  $output = & node scripts/publish-linkedin-queue.mjs 2>&1 | Out-String
  $exitCode = $LASTEXITCODE

  if ($output) {
    Add-Content -Path $logFile -Value $output
  }

  if ($exitCode -ne 0) {
    Add-Content -Path $logFile -Value "[$timestamp] Publisher exited with code $exitCode"
    exit $exitCode
  }
} catch {
  Add-Content -Path $logFile -Value "[$timestamp] Publisher failed: $($_.Exception.Message)"
  throw
}
