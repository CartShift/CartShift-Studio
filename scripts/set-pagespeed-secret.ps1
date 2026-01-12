# Set PageSpeed API Key as Firebase Function Secret
# Usage: .\scripts\set-pagespeed-secret.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiKey
)

if (-not $ApiKey) {
    Write-Host "Reading PAGESPEED_API_KEY from .env.local..." -ForegroundColor Yellow

    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        if ($envContent -match "PAGESPEED_API_KEY=(.+)") {
            $ApiKey = $matches[1].Trim()
            Write-Host "Found API key in .env.local" -ForegroundColor Green
        } else {
            Write-Host "PAGESPEED_API_KEY not found in .env.local" -ForegroundColor Red
            Write-Host "Please provide the API key as a parameter: -ApiKey 'your-key-here'" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host ".env.local file not found" -ForegroundColor Red
        Write-Host "Please provide the API key as a parameter: -ApiKey 'your-key-here'" -ForegroundColor Yellow
        exit 1
    }
}

if (-not $ApiKey) {
    Write-Host "Error: API key is required" -ForegroundColor Red
    exit 1
}

Write-Host "Setting PAGESPEED_API_KEY secret in Firebase..." -ForegroundColor Cyan

try {
    # Set the secret using PowerShell pipe
    $ApiKey | firebase functions:secrets:set PAGESPEED_API_KEY --data-file=-

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Secret set successfully!" -ForegroundColor Green
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Deploy your functions: firebase deploy --only functions" -ForegroundColor White
        Write-Host "2. The secret will be available to your functions after deployment" -ForegroundColor White
    } else {
        Write-Host "Failed to set secret. Make sure you're logged in to Firebase CLI." -ForegroundColor Red
        Write-Host "Run: firebase login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Error setting secret: $_" -ForegroundColor Red
    exit 1
}
