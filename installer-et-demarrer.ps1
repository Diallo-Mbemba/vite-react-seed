# Script PowerShell pour installer et démarrer automatiquement tous les services Stripe
# Usage: .\installer-et-demarrer.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Installation et démarrage automatique de Stripe" -ForegroundColor Cyan
Write-Host ""

# Clés Stripe
$PUBLIC_KEY = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
$SECRET_KEY = "sk_test_YOUR_SECRET_KEY_HERE"

# Chemins
$rootPath = $PSScriptRoot
$serverPath = Join-Path $rootPath "server"
$frontendEnvPath = Join-Path $rootPath ".env"
$backendEnvPath = Join-Path $serverPath ".env"

# Fonction pour créer le fichier .env frontend
function Create-FrontendEnv {
    Write-Host "📝 Création du fichier .env frontend..." -ForegroundColor Yellow
    
    $content = @"
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
        $content | Out-File -FilePath $frontendEnvPath -Encoding UTF8 -NoNewline -Force
        Write-Host "✅ Fichier .env frontend créé" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Impossible de créer le fichier .env frontend: $_" -ForegroundColor Yellow
    }
}

# Fonction pour créer le fichier .env backend
function Create-BackendEnv {
    Write-Host "📝 Création du fichier .env backend..." -ForegroundColor Yellow
    
    # Vérifier si le fichier existe déjà et lire le webhook secret s'il existe
    $webhookSecret = "whsec_your_webhook_secret_here"
    if (Test-Path $backendEnvPath) {
        $existingContent = Get-Content $backendEnvPath -Raw
        if ($existingContent -match "STRIPE_WEBHOOK_SECRET=(whsec_[^\r\n]+)") {
            $webhookSecret = $matches[1]
            Write-Host "   Webhook secret existant préservé" -ForegroundColor Gray
        }
    }
    
    $content = @"
# Port du serveur
PORT=3000

# Stripe Secret Key (CÔTÉ SERVEUR UNIQUEMENT - NE JAMAIS EXPOSER)
STRIPE_SECRET_KEY=$SECRET_KEY

# Webhook Secret (obtenu après configuration du webhook avec Stripe CLI)
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
        $content | Out-File -FilePath $backendEnvPath -Encoding UTF8 -NoNewline -Force
        Write-Host "✅ Fichier .env backend créé" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Impossible de créer le fichier .env backend: $_" -ForegroundColor Yellow
    }
}

# Étape 1 : Créer les fichiers .env
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "ÉTAPE 1 : Configuration des fichiers .env" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Create-FrontendEnv
Create-BackendEnv
Write-Host ""

# Étape 2 : Installer les dépendances du backend
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "ÉTAPE 2 : Installation des dépendances backend" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

if (-not (Test-Path $serverPath)) {
    Write-Host "❌ Le dossier 'server' n'existe pas !" -ForegroundColor Red
    exit 1
}

Push-Location $serverPath

try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dépendances installées" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "✅ Dépendances déjà installées" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""

# Étape 3 : Vérifier Node.js et npm
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "ÉTAPE 3 : Vérification de l'environnement" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js n'est pas installé !" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm n'est pas installé !" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 4 : Démarrer le backend
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "ÉTAPE 4 : Démarrage du serveur backend" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Démarrage du serveur sur http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT :" -ForegroundColor Yellow
Write-Host "   - Gardez ce terminal ouvert" -ForegroundColor White
Write-Host "   - Ouvrez 2 nouveaux terminaux pour les webhooks et le frontend" -ForegroundColor White
Write-Host "   - Voir les instructions ci-dessous" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur backend
Push-Location $serverPath
npm run dev


