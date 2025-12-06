import { useState, useCallback } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { stripeService, PaymentIntentData } from '../services/stripeService';

export interface UseStripePaymentOptions {
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

export const useStripePayment = (options: UseStripePaymentOptions = {}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onSuccess, onError, onLoading } = options;

  const processPayment = useCallback(async (paymentData: PaymentIntentData) => {
    if (!stripe || !elements) {
      const errorMsg = 'Stripe non initialisé';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    setError(null);
    onLoading?.(true);

    try {
      // 1. Créer le PaymentIntent
      const intentResult = await stripeService.createPaymentIntent(paymentData);
      
      if (!intentResult.success || !intentResult.paymentIntent) {
        const errorMsg = intentResult.error || 'Erreur lors de la création du paiement';
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 2. Confirmer le paiement
      const confirmResult = await stripeService.confirmPayment(
        elements,
        intentResult.paymentIntent.client_secret
      );

      if (!confirmResult.success) {
        const errorMsg = confirmResult.error || 'Erreur lors de la confirmation du paiement';
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 3. Succès
      onSuccess?.(confirmResult.paymentIntent);
      return { success: true, paymentIntent: confirmResult.paymentIntent };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }, [stripe, elements, onSuccess, onError, onLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    processPayment,
    loading,
    error,
    clearError,
    isReady: !!stripe && !!elements,
  };
};

