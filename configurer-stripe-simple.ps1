# Script simple pour configurer Stripe
# Usage: powershell -ExecutionPolicy Bypass -File .\configurer-stripe-simple.ps1

$PUBLIC_KEY = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
$SECRET_KEY = "sk_test_YOUR_SECRET_KEY_HERE"

$root = Get-Location
$serverPath = Join-Path $root "server"

Write-Host ""
Write-Host "Configuration Stripe..." -ForegroundColor Cyan
Write-Host ""

# Creer .env frontend
$frontendEnv = @"
VITE_STRIPE_PUBLISHABLE_KEY=$PUBLIC_KEY
VITE_STRIPE_SECRET_KEY=$SECRET_KEY
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
VITE_DEFAULT_CURRENCY=XAF
"@

$frontendEnv | Out-File -FilePath ".env" -Encoding utf8 -Force
Write-Host "OK - .env frontend cree" -ForegroundColor Green

# Creer server/.env
if (-not (Test-Path $serverPath)) {
    New-Item -ItemType Directory -Path $serverPath | Out-Null
}

$backendEnv = @"
PORT=3000
STRIPE_SECRET_KEY=$SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
"@

$backendEnv | Out-File -FilePath "server\.env" -Encoding utf8 -Force
Write-Host "OK - .env backend cree" -ForegroundColor Green

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""


