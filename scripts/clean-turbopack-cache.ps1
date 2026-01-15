# Comprehensive Turbopack Cache Cleanup Script
# Fixes corrupted Turbopack cache database errors
# Usage: powershell -ExecutionPolicy Bypass -File scripts/clean-turbopack-cache.ps1

Write-Host "CartShift Studio - Turbopack Cache Cleanup" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Gray
Write-Host ""

# Step 1: Kill all Node.js processes
Write-Host "Step 1: Terminating all Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "    [OK] Terminated PID: $($proc.Id)" -ForegroundColor Green
        } catch {
            Write-Host "    [FAIL] Failed to terminate PID: $($proc.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host "  Waiting for processes to fully terminate..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
} else {
    Write-Host "  [OK] No Node.js processes found." -ForegroundColor Green
}

Write-Host ""

# Step 2: Clear .next directory
Write-Host "Step 2: Clearing .next directory..." -ForegroundColor Cyan
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force ".next" -ErrorAction Stop
        Write-Host "  [OK] .next directory cleared successfully." -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Failed to clear .next: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "  Tip: Try closing any file explorers or IDEs that might have .next open." -ForegroundColor Gray
    }
} else {
    Write-Host "  [INFO] No .next directory found." -ForegroundColor Gray
}

Write-Host ""

# Step 3: Clear Turbopack cache from system temp directories
Write-Host "Step 3: Clearing Turbopack system cache..." -ForegroundColor Cyan

$cacheLocations = @(
    "$env:LOCALAPPDATA\nextjs",
    "$env:TEMP\nextjs",
    "$env:APPDATA\nextjs",
    ".next\cache\turbo",
    "node_modules\.cache"
)

$clearedCount = 0
foreach ($location in $cacheLocations) {
    if (Test-Path $location) {
        try {
            Write-Host "  Clearing: $location" -ForegroundColor Gray
            Remove-Item -Recurse -Force $location -ErrorAction Stop
            Write-Host "    [OK] Cleared successfully" -ForegroundColor Green
            $clearedCount++
        } catch {
            Write-Host "    [WARN] Failed to clear: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

if ($clearedCount -eq 0) {
    Write-Host "  [INFO] No Turbopack cache directories found in standard locations." -ForegroundColor Gray
} else {
    Write-Host "  [OK] Cleared $clearedCount cache location(s)." -ForegroundColor Green
}

Write-Host ""

# Step 4: Clear Next.js panic logs (optional)
Write-Host "Step 4: Clearing Next.js panic logs..." -ForegroundColor Cyan
$panicLogs = Get-ChildItem "$env:LOCALAPPDATA\Temp" -Filter "next-panic-*.log" -ErrorAction SilentlyContinue
if ($panicLogs) {
    foreach ($log in $panicLogs) {
        try {
            Remove-Item $log.FullName -Force -ErrorAction Stop
            Write-Host "  [OK] Removed: $($log.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  [WARN] Failed to remove: $($log.Name)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  [INFO] No panic logs found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "[OK] Cache cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: pnpm run dev" -ForegroundColor White
Write-Host "  2. If issues persist, try: pnpm run dev:force" -ForegroundColor White
Write-Host ""
