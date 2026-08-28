$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repoRoot 'data/social/linkedin-publisher.log'

Set-Location $repoRoot
$env:LINKEDIN_VERSION = if ($env:LINKEDIN_VERSION) { $env:LINKEDIN_VERSION } else { '202604' }

$timestamp = Get-Date -Format o
Add-Content -Path $logFile -Value "[$timestamp] Starting LinkedIn queue publisher"

try {
  $tempOut = New-TemporaryFile
  $tempErr = New-TemporaryFile
  $process = Start-Process -FilePath "node" `
    -ArgumentList @("scripts/publish-linkedin-queue.mjs") `
    -WorkingDirectory $repoRoot `
    -NoNewWindow `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $tempOut.FullName `
    -RedirectStandardError $tempErr.FullName
  $output = Get-Content -Path $tempOut.FullName -Raw
  $errorOutput = Get-Content -Path $tempErr.FullName -Raw
  Remove-Item -LiteralPath $tempOut.FullName, $tempErr.FullName -Force
  $exitCode = $LASTEXITCODE

  if ($output) {
    Add-Content -Path $logFile -Value $output
  }

  if ($errorOutput) {
    Add-Content -Path $logFile -Value $errorOutput
  }

  $exitCode = $process.ExitCode

  if ($exitCode -ne 0) {
    Add-Content -Path $logFile -Value "[$timestamp] Publisher exited with code $exitCode"
    exit $exitCode
  }
} catch {
  Add-Content -Path $logFile -Value "[$timestamp] Publisher failed: $($_.Exception.Message)"
  throw
}
