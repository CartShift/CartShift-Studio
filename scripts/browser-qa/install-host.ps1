# Owner-host setup for native Chromium in the existing CartShift Docker sandbox.
# Run from Windows PowerShell/Codex on the machine that owns Docker Desktop.
# The privileged command is fixed host-side text. Never execute a UID-1000-writable
# script from /workspace as root.
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

$identity = @(& docker exec --user 1000 $Container sh -lc 'id -u; uname -m; hostname')
if ($LASTEXITCODE -ne 0 -or $identity.Count -lt 3) {
    throw "Could not verify worker identity."
}
if ($identity[0].Trim() -ne "1000" -or $identity[1].Trim() -ne "aarch64" -or
    $identity[2].Trim() -ne "ai-docker-sandbox") {
    throw "Unexpected worker identity: $($identity -join ', '). Do not install in another container."
}

$root = "/workspace/projects/cart-shift-studio"
Invoke-Docker -Arguments @("exec", "--user", "1000", $Container, "test", "-f",
    "$root/scripts/browser-qa/verify.mjs")

# This text comes from the owner-controlled HOST script. It does not load,
# source or execute any container-writable /workspace file as root.
$install = @'
set -eu
[ "$(id -u)" = "0" ] || { echo "Expected root" >&2; exit 1; }
[ -e /etc/debian_version ] || { echo "Expected Debian container" >&2; exit 1; }
[ "$(dpkg --print-architecture)" = "arm64" ] || { echo "Expected ARM64" >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends chromium fonts-noto-core fonts-noto-color-emoji ca-certificates
apt-get clean
rm -rf /var/lib/apt/lists/*
/usr/bin/chromium --version
'@

Write-Host "Installing Debian ARM64 Chromium inside $Container..."
Invoke-Docker -Arguments @("exec", "--user", "root", $Container, "sh", "-lc", $install)
Write-Host "Running screenshot, RTL and viewport acceptance as UID 1000..."
Invoke-Docker -Arguments @("exec", "--user", "1000", $Container, "sh", "-lc",
    "cd $root && node scripts/browser-qa/verify.mjs")
Write-Host "Browser QA passed. Screenshots and report: /workspace/artifacts/browser-qa"
