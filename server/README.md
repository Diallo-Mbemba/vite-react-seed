# Serveur Backend Stripe

Serveur Node.js/Express pour gérer les paiements Stripe de manière sécurisée.

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Copier le fichier d'environnement :
```bash
cp .env.example .env
```

3. Configurer les variables d'environnement dans `.env` :
   - `STRIPE_SECRET_KEY` : Votre clé secrète Stripe
   - `STRIPE_WEBHOOK_SECRET` : Le secret du webhook (obtenu après configuration)
   - `FRONTEND_URL` : URL de votre application frontend (par défaut: http://localhost:5173)
   - `PORT` : Port du serveur (par défaut: 3000)

## 🏃 Démarrage

### Mode développement :
```bash
npm run dev
```

Le serveur démarre avec nodemon (rechargement automatique).

### Mode production :
```bash
npm run build
npm start
```

## 📡 Endpoints

### GET /health
Vérifier que le serveur fonctionne.

### POST /api/create-payment-intent
Créer un PaymentIntent Stripe.

**Body:**
```json
{
  "amount": 100000,
  "currency": "xaf",
  "metadata": {
    "planId": "silver",
    "userId": "user_123",
    "planName": "Silver"
  }
}
```

### POST /api/webhooks/stripe
Endpoint pour recevoir les webhooks Stripe.

## 🔧 Configuration Webhooks

### En développement local :

1. Installer Stripe CLI :
```bash
# Voir GUIDE_INTEGRATION_STRIPE.md pour les instructions
```

2. Tunneler les webhooks :
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Copier le webhook secret dans `.env`

### En production :

1. Dashboard Stripe → Developers → Webhooks
2. Ajouter un endpoint : `https://votre-domaine.com/api/webhooks/stripe`
3. Sélectionner les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copier le Signing secret dans `.env`

## 📝 Notes

- Ne jamais commiter le fichier `.env`
- La clé secrète Stripe doit rester sur le serveur uniquement
- Toujours valider les webhooks avec la signature

