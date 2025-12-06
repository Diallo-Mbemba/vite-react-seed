import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '../config/stripe';

export interface PaymentIntentData {
  amount: number;
  currency: string;
  metadata: {
    planId: string;
    userId: string;
    planName: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: any;
  error?: string;
}

export class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    const { loadStripe } = await import('@stripe/stripe-js');
    this.stripe = await loadStripe(STRIPE_CONFIG.publishableKey);
  }

  /**
   * Créer un PaymentIntent côté serveur
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<PaymentResult> {
    try {
      const apiUrl = `${STRIPE_CONFIG.apiUrl}/create-payment-intent`;
      console.log('📡 Appel API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        
        if (response.status === 404) {
          return {
            success: false,
            error: `Endpoint non trouvé (404). Vérifiez que le backend est démarré et que l'URL ${apiUrl} est correcte.`,
          };
        }
        
        if (response.status === 500) {
          return {
            success: false,
            error: `Erreur serveur (500). Vérifiez les logs du backend.`,
          };
        }
        
        return {
          success: false,
          error: `Erreur HTTP ${response.status}: ${errorText || 'Erreur inconnue'}`,
        };
      }

      const result = await response.json();
      return {
        success: true,
        paymentIntent: result.paymentIntent,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création du PaymentIntent:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Impossible de contacter le serveur à ${STRIPE_CONFIG.apiUrl}. Assurez-vous que le backend est démarré sur le port 3000.`,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de la création du PaymentIntent',
      };
    }
  }

  /**
   * Confirmer un paiement
   */
  async confirmPayment(
    elements: StripeElements,
    clientSecret: string
  ): Promise<PaymentResult> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe non initialisé',
      };
    }

    try {
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${STRIPE_CONFIG.appUrl}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Erreur lors du paiement',
        };
      }

      return {
        success: true,
        paymentIntent,
      };
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupérer les méthodes de paiement sauvegardées
   */
  async getPaymentMethods(customerId: string) {
    if (!this.stripe) {
      throw new Error('Stripe non initialisé');
    }

    try {
      const response = await fetch(`${STRIPE_CONFIG.apiUrl}/payment-methods/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des méthodes de paiement:', error);
      throw error;
    }
  }

  /**
   * Créer un client Stripe
   */
  async createCustomer(email: string, name: string) {
    try {
      const response = await fetch(`${STRIPE_CONFIG.apiUrl}/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  }

  /**
   * Rembourser un paiement
   */
  async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      const response = await fetch(`${STRIPE_CONFIG.apiUrl}/refund-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentIntentId, 
          amount 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async getPaymentStatus(paymentIntentId: string) {
    try {
      const response = await fetch(`${STRIPE_CONFIG.apiUrl}/payment-status/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      throw error;
    }
  }
}

// Instance singleton
export const stripeService = new StripeService();

