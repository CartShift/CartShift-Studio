# Explicit recovery command for corrupted Next.js or Turbopack caches.

$ErrorActionPreference = "Stop"
$ports = @(3000, 4000, 5001, 4400, 4500, 8080, 9099)
$workspace = (Resolve-Path -LiteralPath (Get-Location)).Path
$nextPath = Join-Path $workspace ".next"

function Get-PortProcessIds([int]$Port) {
    Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 }
}

Write-Host "CartShift Studio - Turbopack cache recovery" -ForegroundColor Magenta
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

if (Test-Path -LiteralPath $nextPath) {
    $resolvedNext = (Resolve-Path -LiteralPath $nextPath).Path
    if (-not $resolvedNext.StartsWith("$workspace\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to clear cache outside workspace: $resolvedNext"
    }

    Remove-Item -LiteralPath $resolvedNext -Recurse -Force
    Write-Host "Cleared $resolvedNext" -ForegroundColor Green
} else {
    Write-Host "No .next cache found." -ForegroundColor Gray
}

Write-Host "Cache recovery complete. Run pnpm dev." -ForegroundColor Green
