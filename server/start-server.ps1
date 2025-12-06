# Script pour démarrer le serveur backend Stripe
Write-Host "🚀 Démarrage du serveur backend Stripe..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis le dossier server/" -ForegroundColor Red
    exit 1
}

# Vérifier le fichier .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Fichier .env non trouvé. Création depuis env.template..." -ForegroundColor Yellow
    if (Test-Path "env.template") {
        Copy-Item "env.template" ".env"
        Write-Host "✅ Fichier .env créé. Veuillez le configurer avec vos clés Stripe." -ForegroundColor Yellow
    } else {
        Write-Host "❌ env.template non trouvé!" -ForegroundColor Red
        exit 1
    }
}

# Vérifier les dépendances
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Configuration vérifiée" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Le serveur va démarrer sur http://localhost:3000" -ForegroundColor Cyan
Write-Host "📡 API disponible sur http://localhost:3000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Gray
Write-Host ""

# Démarrer le serveur
npm run dev


