import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

/**
 * POST /api/webhooks/stripe
 * Gère les webhooks Stripe pour les événements de paiement
 * IMPORTANT: Cette route doit parser le body en raw (pas JSON)
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: express.Request, res: express.Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Vérifier que le webhook secret est configuré
    if (!webhookSecret) {
      console.error('⚠️ STRIPE_WEBHOOK_SECRET non configuré');
      return res.status(500).json({
        error: 'Configuration webhook manquante. Veuillez configurer STRIPE_WEBHOOK_SECRET.',
      });
    }

    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook pour sécurité
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`🔔 Webhook reçu: ${event.type} (ID: ${event.id})`);
    } catch (err: any) {
      console.error('❌ Erreur de signature webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Traiter les différents types d'événements
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.requires_action':
          console.log('⚠️ PaymentIntent nécessite une action supplémentaire');
          break;

        default:
          console.log(`🔔 Événement non géré: ${event.type}`);
      }

      // Répondre rapidement à Stripe (dans les 5 secondes)
      res.json({ received: true });
    } catch (error: any) {
      console.error('❌ Erreur lors du traitement du webhook:', error);
      // Répondre quand même à Stripe pour éviter les retentatives inutiles
      res.status(500).json({ error: 'Erreur de traitement' });
    }
  }
);

/**
 * Gérer un paiement réussi
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('✅ Paiement réussi:', paymentIntent.id);
  console.log('   Montant:', paymentIntent.amount, paymentIntent.currency);
  console.log('   Métadonnées:', paymentIntent.metadata);

  // TODO: Implémenter la mise à jour des crédits utilisateur
  // Exemple:
  // const userId = paymentIntent.metadata.userId;
  // const planId = paymentIntent.metadata.planId;
  // await updateUserCredits(userId, planId);

  // Note: Dans votre cas, la commande est déjà créée côté frontend
  // Le webhook peut servir à:
  // 1. Vérifier que le paiement est bien reçu par Stripe
  // 2. Envoyer un email de confirmation
  // 3. Mettre à jour le statut de la commande en base de données
  // 4. Générer une facture
}

/**
 * Gérer un paiement échoué
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Paiement échoué:', paymentIntent.id);
  console.log('   Raison:', paymentIntent.last_payment_error?.message);

  // TODO: Notifier l'utilisateur de l'échec
  // Exemple:
  // await notifyUserOfPaymentFailure(paymentIntent.metadata.userId, paymentIntent.last_payment_error);
}

/**
 * Gérer un paiement annulé
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('⚠️ Paiement annulé:', paymentIntent.id);
  console.log('   Métadonnées:', paymentIntent.metadata);

  // TODO: Gérer l'annulation (ex: supprimer la commande en attente)
}

export default router;

