# Owner-host setup for native Chromium in the existing CartShift Docker sandbox.
# Run from Windows PowerShell/Codex on the machine that owns Docker Desktop.
# No Docker socket, credentials or admin privileges are exposed to the MCP worker.
param([string]$Container = "ai-dev-workspace")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Docker([string[]]$Arguments) {
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed (exit $LASTEXITCODE): docker $($Arguments -join ' ')"
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI not found. Run on the owner host with Docker Desktop running."
}
$running = (& docker inspect --format '{{.State.Running}}' $Container 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $running -ne "true") {
    throw "Container '$Container' is not running. Confirm with docker ps."
}

$identity = & docker exec --user 1000 $Container sh -lc 'id -u; uname -m; hostname'
if ($LASTEXITCODE -ne 0 -or $identity.Count -lt 3) {
    throw "Could not verify worker identity."
}
if ($identity[0].Trim() -ne "1000" -or $identity[1].Trim() -ne "aarch64" -or
    $identity[2].Trim() -ne "ai-docker-sandbox") {
    throw "Unexpected worker identity: $($identity -join ', '). Do not install in another container."
}

$root = "/workspace/projects/cart-shift-studio"
Invoke-Docker @("exec", "--user", "1000", $Container, "test", "-f",
    "$root/scripts/browser-qa/install-debian.sh")
Write-Host "Installing Debian ARM64 Chromium inside $Container..."
Invoke-Docker @("exec", "--user", "root", $Container, "sh",
    "$root/scripts/browser-qa/install-debian.sh")
Write-Host "Running the actual screenshot, RTL and viewport acceptance test as UID 1000..."
Invoke-Docker @("exec", "--user", "1000", $Container, "sh", "-lc",
    "cd $root && node scripts/browser-qa/verify.mjs")
Write-Host "Browser QA passed. Screenshots and report: /workspace/artifacts/browser-qa"
