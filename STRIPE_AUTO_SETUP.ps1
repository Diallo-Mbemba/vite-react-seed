# ⚡ Script Automatique Complet - Configuration Stripe
# Fait TOUT automatiquement : .env, installation, démarrage
# Usage: .\STRIPE_AUTO_SETUP.ps1

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ⚡ CONFIGURATION AUTOMATIQUE STRIPE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vos clés Stripe
$PUBLIC_KEY = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
$SECRET_KEY = "sk_test_YOUR_SECRET_KEY_HERE"

$rootPath = $PSScriptRoot
$serverPath = Join-Path $rootPath "server"
$frontendEnvPath = Join-Path $rootPath ".env"
$backendEnvPath = Join-Path $serverPath ".env"

# ============================================
# ÉTAPE 1 : Créer les fichiers .env
# ============================================
Write-Host "📝 [1/5] Création des fichiers .env..." -ForegroundColor Yellow

# Frontend .env
$frontendEnvContent = @"
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=$PUBLIC_KEY
VITE_STRIPE_SECRET_KEY=$SECRET_KEY
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api

# Currency Configuration
VITE_DEFAULT_CURRENCY=XAF

# OpenAI Configuration (Optionnel)
VITE_OPENAI_API_KEY=sk-proj_YOUR_OPENAI_API_KEY_HERE
"@

try {
    $frontendEnvContent | Out-File -FilePath $frontendEnvPath -Encoding UTF8 -NoNewline -Force
    Write-Host "   ✅ .env frontend créé" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Impossible de créer .env frontend: $_" -ForegroundColor Yellow
}

# Backend .env - Préserver le webhook secret s'il existe
$webhookSecret = "whsec_your_webhook_secret_here"
if (Test-Path $backendEnvPath) {
    $existingContent = Get-Content $backendEnvPath -Raw -ErrorAction SilentlyContinue
    if ($existingContent -match "STRIPE_WEBHOOK_SECRET=(whsec_[^\r\n]+)") {
        $webhookSecret = $matches[1]
    }
}

$backendEnvContent = @"
# Port du serveur
PORT=3000

# Stripe Secret Key (CÔTÉ SERVEUR UNIQUEMENT)
STRIPE_SECRET_KEY=$SECRET_KEY

# Webhook Secret
STRIPE_WEBHOOK_SECRET=$webhookSecret

# URL de l'application frontend
FRONTEND_URL=http://localhost:5173

# Mode
NODE_ENV=development
"@

try {
    if (-not (Test-Path $serverPath)) {
        New-Item -ItemType Directory -Path $serverPath | Out-Null
    }
    $backendEnvContent | Out-File -FilePath $backendEnvPath -Encoding UTF8 -NoNewline -Force
    Write-Host "   ✅ .env backend créé" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Impossible de créer .env backend: $_" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# ÉTAPE 2 : Vérifier Node.js
# ============================================
Write-Host "🔍 [2/5] Vérification de Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>&1
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Node.js n'est pas installé !" -ForegroundColor Red
    Write-Host "   Téléchargez depuis: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

try {
    $npmVersion = npm --version 2>&1
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ npm n'est pas installé !" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# ÉTAPE 3 : Installer les dépendances backend
# ============================================
Write-Host "📦 [3/5] Installation des dépendances backend..." -ForegroundColor Yellow

if (-not (Test-Path $serverPath)) {
    Write-Host "   ❌ Le dossier 'server' n'existe pas !" -ForegroundColor Red
    exit 1
}

Push-Location $serverPath
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📥 Installation en cours..." -ForegroundColor Gray
        $output = npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Dépendances installées" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ Erreur lors de l'installation" -ForegroundColor Red
            Write-Host "   $output" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    else {
        Write-Host "   ✅ Dépendances déjà installées" -ForegroundColor Green
    }
}
catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""

# ============================================
# ÉTAPE 4 : Vérifier le backend
# ============================================
Write-Host "✅ [4/5] Vérification de la configuration..." -ForegroundColor Yellow

if (Test-Path (Join-Path $serverPath "src/index.ts")) {
    Write-Host "   ✅ Serveur backend configuré" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Fichiers backend manquants" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# ÉTAPE 5 : Résumé et instructions
# ============================================
Write-Host "🎉 [5/5] Configuration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ PRÊT À DÉMARRER" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Pour démarrer tous les services automatiquement :" -ForegroundColor Yellow
Write-Host "   .\TOUT_DEMARRER.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📋 Ou démarrez manuellement dans 3 terminaux :" -ForegroundColor Yellow
Write-Host "   Terminal 1: .\demarrer-backend.ps1" -ForegroundColor White
Write-Host "   Terminal 2: .\demarrer-webhooks.ps1" -ForegroundColor White
Write-Host "   Terminal 3: .\demarrer-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🔔 IMPORTANT - Webhooks Stripe :" -ForegroundColor Yellow
Write-Host "   1. Installez Stripe CLI si nécessaire" -ForegroundColor White
Write-Host "   2. Exécutez: stripe login (première fois)" -ForegroundColor White
Write-Host "   3. Le secret 'whsec_...' s'affichera dans le terminal" -ForegroundColor White
Write-Host "   4. Ajoutez-le dans server/.env comme STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test : http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Carte de test: 4242 4242 4242 4242" -ForegroundColor Gray
Write-Host ""


