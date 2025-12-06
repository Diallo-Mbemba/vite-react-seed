import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Plan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { X, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { getStripe, DEFAULT_PAYMENT_OPTIONS, validateStripeConfig } from '../../config/stripe';
import { stripeService, PaymentIntentData } from '../../services/stripeService';
import { createOrder, updateOrderStatus } from '../../utils/orderUtils';
// updateUserCreditsAfterPayment n'est plus nécessaire - updateOrderStatus crée automatiquement le pool de crédits

interface StripePaymentModalProps {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentForm: React.FC<{
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
}> = ({ plan, onClose, onSuccess, clientSecret }) => {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // NOUVEAU: Fonction pour créer une commande automatiquement autorisée
  const createAutoAuthorizedOrder = async () => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Créer la commande
    const order = await createOrder({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      planId: plan.id,
      planName: plan.name,
      planCredits: plan.credits,
      amount: plan.price,
      currency: 'XAF',
      status: 'pending_validation',
      paymentMethod: 'stripe' as any,
    });

    // Valider automatiquement la commande
    await updateOrderStatus(order.id, 'validated', 'system_auto', 'Validation automatique pour paiement Stripe');
    
    // Autoriser automatiquement la commande (cela créera automatiquement le pool de crédits)
    await updateOrderStatus(order.id, 'authorized', 'system_auto', 'Autorisation automatique pour paiement Stripe');

    return order;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      setError('Stripe non initialisé ou utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirmer le paiement
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Erreur lors du paiement');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Créer la commande automatiquement autorisée
        const order = await createAutoAuthorizedOrder();
        console.log('✅ Commande Stripe créée et autorisée automatiquement:', order.orderNumber);
        onSuccess();
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations du plan */}
      <div className="p-4 bg-cote-ivoire-lighter rounded-lg border border-cote-ivoire-light">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-800">Plan {plan.name}</span>
          <span className="text-xl font-bold text-gray-800">
            {formatPrice(plan.price)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {plan.credits} simulation{plan.credits > 1 ? 's' : ''}
        </p>
      </div>

      {/* Élément de paiement Stripe */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Lock className="h-4 w-4" />
          <span>Paiement sécurisé par Stripe</span>
        </div>
        
        <div className="border border-gray-300 rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="flex-1 bg-cote-ivoire-primary text-white py-3 px-4 rounded-md hover:bg-cote-ivoire-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Traitement...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Payer {formatPrice(plan.price)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({ plan, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Vérifier la configuration Stripe
        if (!validateStripeConfig()) {
          throw new Error('Configuration Stripe manquante. Vérifiez que VITE_STRIPE_PUBLISHABLE_KEY est définie dans le fichier .env');
        }

        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        // Initialiser Stripe
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Impossible d\'initialiser Stripe. Vérifiez votre clé publique Stripe.');
        }
        setStripePromise(Promise.resolve(stripe));

        // Créer le PaymentIntent
        const paymentData: PaymentIntentData = {
          amount: plan.price * 100, // Convertir en centimes
          currency: 'xaf',
          metadata: {
            planId: plan.id,
            userId: user.id,
            planName: plan.name,
          },
        };

        console.log('🔄 Création du PaymentIntent...', { apiUrl: import.meta.env.VITE_API_URL });
        const result = await stripeService.createPaymentIntent(paymentData);
        
        if (!result.success || !result.paymentIntent?.client_secret) {
          const errorMessage = result.error || 'Erreur lors de la création du paiement';
          
          // Messages d'erreur plus détaillés
          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            throw new Error('Impossible de contacter le serveur. Assurez-vous que le backend est démarré sur http://localhost:3000');
          }
          
          if (errorMessage.includes('404')) {
            throw new Error('Endpoint API introuvable. Vérifiez que VITE_API_URL est correct dans le fichier .env');
          }
          
          throw new Error(errorMessage);
        }

        setClientSecret(result.paymentIntent.client_secret);
        console.log('✅ PaymentIntent créé avec succès');
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation:', err);
        setInitError(err instanceof Error ? err.message : 'Erreur inconnue lors de l\'initialisation');
      } finally {
        setIsInitializing(false);
      }
    };

    initializePayment();
  }, [user, plan]);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Initialisation du paiement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (initError || !stripePromise || !clientSecret) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur d'initialisation</h3>
            <p className="text-gray-600 mb-4 text-left">{initError || 'Impossible d\'initialiser le paiement'}</p>
            
            {/* Aide pour résoudre le problème */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-medium text-yellow-800 mb-2">💡 Solutions possibles :</p>
              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                <li>Vérifiez que le backend est démarré : <code className="bg-yellow-100 px-1 rounded">cd server && npm run dev</code></li>
                <li>Vérifiez que VITE_API_URL dans .env pointe vers <code className="bg-yellow-100 px-1 rounded">http://localhost:3000/api</code></li>
                <li>Vérifiez que VITE_STRIPE_PUBLISHABLE_KEY est définie dans .env</li>
                <li>Ouvrez la console du navigateur (F12) pour plus de détails</li>
              </ul>
            </div>
            
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 border border-gray-300 shadow-cote-ivoire-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Paiement sécurisé</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Elements 
          stripe={stripePromise} 
          options={{
            ...DEFAULT_PAYMENT_OPTIONS,
            clientSecret,
          }}
        >
          <PaymentForm plan={plan} onClose={onClose} onSuccess={onSuccess} clientSecret={clientSecret} />
        </Elements>
      </div>
    </div>
  );
};

export default StripePaymentModal;

