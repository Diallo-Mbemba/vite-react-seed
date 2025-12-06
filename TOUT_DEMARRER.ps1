# Script pour démarrer TOUS les services en une fois
# Crée automatiquement 3 fenêtres PowerShell séparées

Write-Host "🚀 Démarrage automatique de tous les services Stripe" -ForegroundColor Cyan
Write-Host ""

# Chemins
$rootPath = $PSScriptRoot
$serverPath = Join-Path $rootPath "server"

# Vérifier que les fichiers .env existent
$frontendEnv = Join-Path $rootPath ".env"
$backendEnv = Join-Path $serverPath ".env"

if (-not (Test-Path $frontendEnv)) {
    Write-Host "⚠️  Le fichier .env frontend n'existe pas. Exécutez d'abord installer-et-demarrer.ps1" -ForegroundColor Yellow
}

if (-not (Test-Path $backendEnv)) {
    Write-Host "⚠️  Le fichier .env backend n'existe pas. Exécutez d'abord installer-et-demarrer.ps1" -ForegroundColor Yellow
}

Write-Host "📋 Démarrage des services dans des fenêtres séparées..." -ForegroundColor Yellow
Write-Host ""

# Fonction pour démarrer un service dans une nouvelle fenêtre
function Start-ServiceInNewWindow {
    param(
        [string]$Title,
        [string]$ScriptPath,
        [string]$WorkingDirectory
    )
    
    $scriptFullPath = Join-Path $PSScriptRoot $ScriptPath
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$WorkingDirectory'; Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '$Title' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; & '$scriptFullPath'"
    )
    Start-Sleep -Seconds 1
}

# Démarrer le backend
Write-Host "🔵 Démarrage du backend..." -ForegroundColor Blue
Start-ServiceInNewWindow -Title "🚀 BACKEND SERVER - http://localhost:3000" -ScriptPath "demarrer-backend.ps1" -WorkingDirectory $rootPath

# Attendre un peu pour que le backend démarre
Start-Sleep -Seconds 3

# Démarrer les webhooks
Write-Host "🟢 Démarrage du tunnel webhooks..." -ForegroundColor Green
Start-ServiceInNewWindow -Title "🔔 STRIPE WEBHOOKS TUNNEL" -ScriptPath "demarrer-webhooks.ps1" -WorkingDirectory $rootPath

# Attendre un peu
Start-Sleep -Seconds 2

# Démarrer le frontend
Write-Host "🟡 Démarrage du frontend..." -ForegroundColor Yellow
Start-ServiceInNewWindow -Title "🌐 FRONTEND - http://localhost:5173" -ScriptPath "demarrer-frontend.ps1" -WorkingDirectory $rootPath

Write-Host ""
Write-Host "✅ Tous les services ont été démarrés dans des fenêtres séparées !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Fenêtres ouvertes :" -ForegroundColor Cyan
Write-Host "   1. 🔵 Backend Server (http://localhost:3000)" -ForegroundColor White
Write-Host "   2. 🟢 Stripe Webhooks Tunnel" -ForegroundColor White
Write-Host "   3. 🟡 Frontend (http://localhost:5173)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT pour les webhooks :" -ForegroundColor Yellow
Write-Host "   - Si c'est votre première fois, exécutez : stripe login" -ForegroundColor White
Write-Host "   - Copiez le secret 'whsec_...' affiché dans la fenêtre webhooks" -ForegroundColor White
Write-Host "   - Ajoutez-le dans server/.env comme STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host "   - Redémarrez le backend" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testez maintenant : http://localhost:5173" -ForegroundColor Cyan
Write-Host ""


