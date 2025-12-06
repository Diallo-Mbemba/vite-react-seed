import { Request, Response } from 'express';
import Stripe from 'stripe';

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  metadata: {
    planId: string;
    userId: string;
    planName: string;
  };
}

/**
 * Créer un PaymentIntent Stripe
 * POST /api/create-payment-intent
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    // Vérifier que Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY non configuré');
      return res.status(500).json({
        error: 'Configuration Stripe manquante. Veuillez configurer STRIPE_SECRET_KEY.',
      });
    }

    const { amount, currency, metadata }: CreatePaymentIntentRequest = req.body;

    // Validation du montant
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Montant invalide. Le montant doit être supérieur à 0.',
      });
    }

    // Validation de la devise
    if (!currency) {
      return res.status(400).json({
        error: 'Devise requise.',
      });
    }

    // Validation des métadonnées
    if (!metadata || !metadata.planId || !metadata.userId) {
      return res.status(400).json({
        error: 'Métadonnées manquantes. planId et userId sont requis.',
      });
    }

    console.log(`📦 Création PaymentIntent: ${amount} ${currency} - Plan: ${metadata.planName}`);

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Montant en centimes (ex: 1000 = 10.00 pour la plupart des devises)
      currency: currency.toLowerCase(),
      metadata: {
        planId: metadata.planId,
        userId: metadata.userId,
        planName: metadata.planName || 'Plan inconnu',
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Paiement plan ${metadata.planName}`,
    });

    console.log(`✅ PaymentIntent créé: ${paymentIntent.id}`);

    // Retourner le client_secret au frontend
    res.json({
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error: any) {
    console.error('❌ Erreur lors de la création du PaymentIntent:', error);

    // Gérer les erreurs spécifiques de Stripe
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: error.message || 'Erreur de carte',
      });
    }

    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: error.message || 'Requête invalide',
      });
    }

    // Erreur générique
    res.status(500).json({
      error: error.message || 'Erreur lors de la création du paiement',
    });
  }
};

