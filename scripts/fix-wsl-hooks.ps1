# Fix WSL and Git Hooks Configuration
# This script helps resolve WSL-related Git hook issues

Write-Host "Attempting to fix WSL Git hooks issue..." -ForegroundColor Yellow

# Option 1: Restart WSL
Write-Host "`n1. Restarting WSL..." -ForegroundColor Cyan
wsl --shutdown
Start-Sleep -Seconds 2
Write-Host "WSL shutdown complete. Please restart WSL manually if needed." -ForegroundColor Green

Write-Host "`nDone! Try committing again." -ForegroundColor Green
