# Script automatique Stripe - Version corrigee
# Execution: powershell -ExecutionPolicy Bypass -File .\SETUP_STRIPE.ps1

param(
    [switch]$SkipInstall = $false
)

$ErrorActionPreference = "Continue"

# Clés Stripe
$PUBLIC_KEY = "pk_test_YOUR_PUBLISHABLE_KEY_HERE"
$SECRET_KEY = "sk_test_YOUR_SECRET_KEY_HERE"

# Chemins
$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $rootPath) {
    $rootPath = $PWD
}
$serverPath = Join-Path $rootPath "server"
$frontendEnvPath = Join-Path $rootPath ".env"
$backendEnvPath = Join-Path $serverPath ".env"

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  Configuration Automatique Stripe" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# ETAPE 1: Creer fichiers .env
Write-Host "[1/4] Creation des fichiers .env..." -ForegroundColor Yellow

# Frontend .env
$frontendContent = @"
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
    [System.IO.File]::WriteAllText($frontendEnvPath, $frontendContent, [System.Text.Encoding]::UTF8)
    Write-Host "  OK - .env frontend cree" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR - Impossible de creer .env frontend: $_" -ForegroundColor Red
}

# Backend .env - Preserver webhook secret
$webhookSecret = "whsec_your_webhook_secret_here"
if (Test-Path $backendEnvPath) {
    try {
        $existing = Get-Content $backendEnvPath -Raw
        if ($existing -match 'STRIPE_WEBHOOK_SECRET=(whsec_[^\r\n]+)') {
            $webhookSecret = $matches[1]
        }
    } catch {
        # Ignorer si on ne peut pas lire
    }
}

$backendContent = @"
# Port du serveur
PORT=3000

# Stripe Secret Key (COTE SERVEUR UNIQUEMENT)
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
        New-Item -ItemType Directory -Path $serverPath -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($backendEnvPath, $backendContent, [System.Text.Encoding]::UTF8)
    Write-Host "  OK - .env backend cree" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR - Impossible de creer .env backend: $_" -ForegroundColor Red
}

Write-Host ""

# ETAPE 2: Verifier Node.js
Write-Host "[2/4] Verification de Node.js..." -ForegroundColor Yellow

$nodeOk = $false
$npmOk = $false

try {
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0 -and $nodeVersion) {
        Write-Host "  OK - Node.js: $nodeVersion" -ForegroundColor Green
        $nodeOk = $true
    }
} catch {
    Write-Host "  ERREUR - Node.js non installe" -ForegroundColor Red
    Write-Host "  Telechargez depuis: https://nodejs.org/" -ForegroundColor Yellow
}

try {
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -eq 0 -and $npmVersion) {
        Write-Host "  OK - npm: $npmVersion" -ForegroundColor Green
        $npmOk = $true
    }
} catch {
    Write-Host "  ERREUR - npm non installe" -ForegroundColor Red
}

Write-Host ""

# ETAPE 3: Installer dependances backend
if ($nodeOk -and $npmOk -and -not $SkipInstall) {
    Write-Host "[3/4] Installation des dependances backend..." -ForegroundColor Yellow
    
    if (-not (Test-Path $serverPath)) {
        Write-Host "  ERREUR - Dossier 'server' introuvable" -ForegroundColor Red
    } else {
        Push-Location $serverPath
        try {
            if (-not (Test-Path "node_modules")) {
                Write-Host "  Installation en cours..." -ForegroundColor Gray
                $null = & npm install 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  OK - Dependances installees" -ForegroundColor Green
                } else {
                    Write-Host "  ERREUR lors de l'installation" -ForegroundColor Red
                }
            } else {
                Write-Host "  OK - Dependances deja installees" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ERREUR: $_" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Host "[3/4] Installation des dependances backend..." -ForegroundColor Yellow
    Write-Host "  SKIP - Installez manuellement: cd server && npm install" -ForegroundColor Gray
}

Write-Host ""

# ETAPE 4: Verification finale
Write-Host "[4/4] Verification de la configuration..." -ForegroundColor Yellow

$allOk = $true

if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "  ERREUR - .env frontend manquant" -ForegroundColor Red
    $allOk = $false
} else {
    Write-Host "  OK - .env frontend existe" -ForegroundColor Green
}

if (-not (Test-Path $backendEnvPath)) {
    Write-Host "  ERREUR - .env backend manquant" -ForegroundColor Red
    $allOk = $false
} else {
    Write-Host "  OK - .env backend existe" -ForegroundColor Green
}

if (Test-Path (Join-Path $serverPath "src\index.ts")) {
    Write-Host "  OK - Serveur backend configure" -ForegroundColor Green
} else {
    Write-Host "  ERREUR - Fichiers backend manquants" -ForegroundColor Red
    $allOk = $false
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "  Configuration terminee avec succes!" -ForegroundColor Green
} else {
    Write-Host "  Configuration terminee avec des erreurs" -ForegroundColor Yellow
}
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. cd server" -ForegroundColor White
Write-Host "  2. npm install (si pas encore fait)" -ForegroundColor White
Write-Host "  3. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Puis dans un autre terminal:" -ForegroundColor Yellow
Write-Host "  .\demarrer-frontend.ps1" -ForegroundColor White
Write-Host ""


