# Smart dev server manager for CartShift Studio
# Handles Next.js dev server conflicts gracefully

Write-Host "🚀 CartShift Studio - Smart Dev Server Manager" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Gray

# Check for existing Next.js processes
Write-Host "🔍 Checking for existing Next.js dev processes..." -ForegroundColor Cyan

# Kill any existing next dev processes
$existingProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*next dev*"
}

if ($existingProcesses) {
    Write-Host "📋 Found $($existingProcesses.Count) existing Next.js process(es)" -ForegroundColor Yellow
    foreach ($proc in $existingProcesses) {
        Write-Host "  🛑 Terminating PID: $($proc.Id)" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "⏳ Waiting for processes to terminate..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
} else {
    Write-Host "✅ No existing Next.js processes found." -ForegroundColor Green
}

# Clear Next.js cache
Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Cyan
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force ".next" -ErrorAction Stop
        Write-Host "  ✅ Cache cleared successfully." -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Failed to clear cache: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️  No cache directory found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Green
Write-Host "Command: next dev --turbo" -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Gray

# Start the dev server
try {
    & next dev --turbo
} catch {
    Write-Host "❌ Failed to start dev server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}