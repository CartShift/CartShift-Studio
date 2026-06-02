# Stop CartShift development services on known ports and restart the fast stack.

$ErrorActionPreference = "Stop"
$ports = @(3000, 4000, 5001, 4400, 4500, 8080, 9099)

function Get-PortProcessIds([int]$Port) {
    Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 }
}

Write-Host "Stopping CartShift development ports..." -ForegroundColor Cyan

$processIds = @(
    foreach ($port in $ports) {
        Get-PortProcessIds $port
    }
) | Sort-Object -Unique

foreach ($processId in $processIds) {
    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Host "  Stopped PID $processId" -ForegroundColor Yellow
    } catch {
        Write-Host "  Could not stop PID $processId`: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Start-Sleep -Milliseconds 500

$lockPath = Join-Path (Get-Location) ".next\dev\lock"
if (Test-Path -LiteralPath $lockPath) {
    Remove-Item -LiteralPath $lockPath -Force
    Write-Host "Removed stale Next.js lock file." -ForegroundColor Yellow
}

Write-Host "Starting CartShift web development..." -ForegroundColor Green
& pnpm run dev
