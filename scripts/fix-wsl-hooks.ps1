# Fix WSL and Git Hooks Configuration
# This script helps resolve WSL-related Git hook issues

Write-Host "Attempting to fix WSL Git hooks issue..." -ForegroundColor Yellow

# Option 1: Restart WSL
Write-Host "`n1. Restarting WSL..." -ForegroundColor Cyan
wsl --shutdown
Start-Sleep -Seconds 2
Write-Host "WSL shutdown complete. Please restart WSL manually if needed." -ForegroundColor Green

# Option 2: Configure Git to skip hooks temporarily
Write-Host "`n2. To skip hooks for a single commit, use:" -ForegroundColor Cyan
Write-Host "   git commit --no-verify" -ForegroundColor White

# Option 3: Disable husky temporarily
Write-Host "`n3. To disable husky temporarily, set environment variable:" -ForegroundColor Cyan
Write-Host "   `$env:HUSKY = '0'" -ForegroundColor White

Write-Host "`nDone! Try committing again." -ForegroundColor Green
