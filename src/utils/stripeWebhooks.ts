import { STRIPE_CONFIG } from '../config/stripe';

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface PaymentIntentSucceededEvent {
  id: string;
  object: 'event';
  type: 'payment_intent.succeeded';
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      metadata: {
        planId: string;
        userId: string;
        planName: string;
      };
      charges: {
        data: Array<{
          id: string;
          receipt_url: string;
        }>;
      };
    };
  };
}

export interface PaymentIntentFailedEvent {
  id: string;
  object: 'event';
  type: 'payment_intent.payment_failed';
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      last_payment_error: {
        message: string;
        code: string;
      };
    };
  };
}

/**
 * Vérifier la signature du webhook Stripe
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  // En production, utiliser la bibliothèque stripe pour vérifier la signature
  // Pour le développement, on simule la vérification
  return secret === STRIPE_CONFIG.webhookSecret;
};

/**
 * Traiter un événement de webhook Stripe
 */
export const processWebhookEvent = async (event: WebhookEvent): Promise<boolean> => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event as PaymentIntentSucceededEvent);
      
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event as PaymentIntentFailedEvent);
      
      case 'payment_intent.canceled':
        return await handlePaymentIntentCanceled(event);
      
      case 'charge.dispute.created':
        return await handleChargeDisputeCreated(event);
      
      default:
        console.log(`Événement webhook non géré: ${event.type}`);
        return true;
    }
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return false;
  }
};

/**
 * Gérer un paiement réussi
 */
const handlePaymentIntentSucceeded = async (event: PaymentIntentSucceededEvent): Promise<boolean> => {
  try {
    const { data } = event;
    const paymentIntent = data.object;
    
    console.log('Paiement réussi:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      planId: paymentIntent.metadata.planId,
      userId: paymentIntent.metadata.userId,
    });

    // Mettre à jour l'utilisateur avec les crédits
    await updateUserCredits(
      paymentIntent.metadata.userId,
      paymentIntent.metadata.planId,
      paymentIntent.metadata.planName
    );

    // Enregistrer le paiement dans la base de données
    await recordPayment({
      paymentIntentId: paymentIntent.id,
      userId: paymentIntent.metadata.userId,
      planId: paymentIntent.metadata.planId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du traitement du paiement réussi:', error);
    return false;
  }
};

/**
 * Gérer un échec de paiement
 */
const handlePaymentIntentFailed = async (event: PaymentIntentFailedEvent): Promise<boolean> => {
  try {
    const { data } = event;
    const paymentIntent = data.object;
    
    console.log('Paiement échoué:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      error: paymentIntent.last_payment_error,
    });

    // Enregistrer l'échec
    await recordPayment({
      paymentIntentId: paymentIntent.id,
      userId: paymentIntent.metadata?.userId || 'unknown',
      planId: paymentIntent.metadata?.planId || 'unknown',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      error: paymentIntent.last_payment_error.message,
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du traitement de l\'échec de paiement:', error);
    return false;
  }
};

/**
 * Gérer un paiement annulé
 */
const handlePaymentIntentCanceled = async (event: WebhookEvent): Promise<boolean> => {
  try {
    const { data } = event;
    const paymentIntent = data.object;
    
    console.log('Paiement annulé:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    // Enregistrer l'annulation
    await recordPayment({
      paymentIntentId: paymentIntent.id,
      userId: paymentIntent.metadata?.userId || 'unknown',
      planId: paymentIntent.metadata?.planId || 'unknown',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'canceled',
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du traitement de l\'annulation:', error);
    return false;
  }
};

/**
 * Gérer une contestation de charge
 */
const handleChargeDisputeCreated = async (event: WebhookEvent): Promise<boolean> => {
  try {
    const { data } = event;
    const dispute = data.object;
    
    console.log('Contestation créée:', {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
    });

    // Notifier l'équipe de support
    await notifySupportTeam({
      type: 'dispute_created',
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du traitement de la contestation:', error);
    return false;
  }
};

/**
 * Mettre à jour les crédits de l'utilisateur
 */
const updateUserCredits = async (userId: string, planId: string, planName: string): Promise<void> => {
  // En production, ceci devrait mettre à jour la base de données
  console.log('Mise à jour des crédits:', { userId, planId, planName });
  
  // Simulation de la mise à jour
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    // Logique de mise à jour des crédits selon le plan
    console.log('Crédits mis à jour pour l\'utilisateur:', user.id);
  }
};

/**
 * Enregistrer un paiement
 */
const recordPayment = async (paymentData: {
  paymentIntentId: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: string;
  receiptUrl?: string;
  error?: string;
}): Promise<void> => {
  // En production, ceci devrait enregistrer dans la base de données
  console.log('Enregistrement du paiement:', paymentData);
  
  // Simulation de l'enregistrement
  const paymentRecord = {
    id: `payment_${Date.now()}`,
    paymentIntentId: paymentData.paymentIntentId,
    userId: paymentData.userId,
    planId: paymentData.planId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status,
    receiptUrl: paymentData.receiptUrl,
    error: paymentData.error,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const existingPayments = localStorage.getItem('stripePayments') || '[]';
  const payments = JSON.parse(existingPayments);
  payments.push(paymentRecord);
  localStorage.setItem('stripePayments', JSON.stringify(payments));
};

/**
 * Notifier l'équipe de support
 */
const notifySupportTeam = async (data: any): Promise<void> => {
  // En production, ceci devrait envoyer une notification (email, Slack, etc.)
  console.log('Notification à l\'équipe de support:', data);
};

