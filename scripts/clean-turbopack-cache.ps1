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
    $stopped = $false
    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        $stopped = $true
    } catch {
        $taskkill = Start-Process -FilePath "taskkill.exe" -ArgumentList "/PID", $processId, "/F" -Wait -PassThru -NoNewWindow
        if ($taskkill.ExitCode -eq 0) {
            $stopped = $true
        }
    }

    if ($stopped) {
        Write-Host "  Stopped PID $processId" -ForegroundColor Yellow
    } else {
        Write-Host "  Could not stop PID $processId (try Task Manager or an elevated terminal)" -ForegroundColor Yellow
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
