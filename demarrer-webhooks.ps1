# Script pour démarrer le tunnel webhooks Stripe
# Prérequis : Stripe CLI doit être installé

Write-Host "🔔 Démarrage du tunnel webhooks Stripe..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si Stripe CLI est installé
try {
    $stripeVersion = stripe --version 2>&1
    Write-Host "✅ Stripe CLI détecté" -ForegroundColor Green
}
catch {
    Write-Host "❌ Stripe CLI n'est pas installé !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation rapide :" -ForegroundColor Yellow
    Write-Host "  scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git" -ForegroundColor White
    Write-Host "  scoop install stripe" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou téléchargez depuis : https://github.com/stripe/stripe-cli/releases" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "⚠️  IMPORTANT :" -ForegroundColor Yellow
Write-Host "   1. Si c'est votre première fois, exécutez d'abord : stripe login" -ForegroundColor White
Write-Host "   2. Copiez le secret 'whsec_...' qui s'affichera" -ForegroundColor White
Write-Host "   3. Ajoutez-le dans server/.env comme STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "Démarrage du tunnel..." -ForegroundColor Yellow
Write-Host ""

stripe listen --forward-to localhost:3000/api/webhooks/stripe


