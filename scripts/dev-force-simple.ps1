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

$nextPath = Join-Path (Get-Location) ".next"
if (Test-Path -LiteralPath $nextPath) {
    Remove-Item -LiteralPath $nextPath -Recurse -Force
    Write-Host "Cleared Turbopack cache (.next)." -ForegroundColor Yellow
}

Write-Host "Starting CartShift web development..." -ForegroundColor Green
& pnpm run dev
