import React, { useState } from 'react';
import { Plan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { X, CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import StripePaymentModal from './StripePaymentModal';
import { createOrder, updateOrderStatus } from '../../utils/orderUtils';
// updateUserCreditsAfterPayment n'est plus nécessaire - updateOrderStatus crée automatiquement le pool de crédits

interface PaymentModalProps {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'lygos' | 'caisse_oic'>('stripe');
  const [lygosRef, setLygosRef] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const { updateUser, user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Ouvrir automatiquement le modal Stripe quand Stripe est sélectionné
  const handlePaymentMethodChange = (method: 'stripe' | 'lygos' | 'caisse_oic') => {
    setPaymentMethod(method);
    if (method === 'stripe') {
      setShowStripeModal(true);
    }
  };

  // NOUVEAU: Fonction pour créer une commande automatiquement autorisée
  const createAutoAuthorizedOrder = async (paymentMethod: 'stripe' | 'lygos') => {
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
      paymentMethod: paymentMethod as any,
    });

    // Simuler le processus de validation automatique
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Valider automatiquement la commande
    await updateOrderStatus(order.id, 'validated', 'system_auto', 'Validation automatique pour paiement électronique');
    
    // Autoriser automatiquement la commande (cela créera automatiquement le pool de crédits)
    await updateOrderStatus(order.id, 'authorized', 'system_auto', 'Autorisation automatique pour paiement électronique');

    return order;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Stripe est géré directement par le modal StripePaymentModal
    if (paymentMethod === 'stripe') {
      setShowStripeModal(true);
      setLoading(false);
      return;
    }

    if (paymentMethod === 'lygos') {
      // Validation: une référence est requise
      if (!lygosRef.trim()) {
        alert('Veuillez saisir votre référence Lygos');
        setLoading(false);
        return;
      }
      
      try {
        // Créer une commande automatiquement autorisée
        const order = await createAutoAuthorizedOrder('lygos');
        console.log('✅ Commande Lygos créée et autorisée automatiquement:', order.orderNumber);
        setLoading(false);
        onSuccess();
      } catch (error) {
        console.error('❌ Erreur lors du paiement Lygos:', error);
        alert('Erreur lors du traitement du paiement. Veuillez réessayer.');
        setLoading(false);
      }
      return;
    }

    if (paymentMethod === 'caisse_oic') {
      // Créer une commande OIC
      if (!user) {
        setLoading(false);
        return;
      }

      try {
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
          paymentMethod: 'caisse_oic',
        });

        setOrderNumber(order.orderNumber);
        setShowOrderSuccess(true);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Erreur lors de la création de la commande OIC:', error);
        alert('Erreur lors de la création de la commande. Veuillez réessayer.');
        setLoading(false);
        return;
      }
    }
  };

  const handleStripeSuccess = () => {
    setShowStripeModal(false);
    onSuccess();
  };

  const handleStripeClose = () => {
    setShowStripeModal(false);
  };

  const handleOrderSuccessClose = () => {
    setShowOrderSuccess(false);
    onSuccess();
  };

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

        <div className="mb-6 p-4 bg-cote-ivoire-lighter rounded-lg border border-cote-ivoire-light">
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

        {/* Sélecteur de mode de paiement */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('stripe')}
            className={`text-sm px-3 py-2 rounded-md border ${paymentMethod === 'stripe' ? 'border-cote-ivoire-primary text-cote-ivoire-primary bg-cote-ivoire-primary/5' : 'border-cote-ivoire-medium text-gray-700 bg-white'}`}
            disabled={loading}
          >
            Stripe
          </button>
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('lygos')}
            className={`text-sm px-3 py-2 rounded-md border ${paymentMethod === 'lygos' ? 'border-cote-ivoire-primary text-cote-ivoire-primary bg-cote-ivoire-primary/5' : 'border-cote-ivoire-medium text-gray-700 bg-white'}`}
            disabled={loading}
          >
            Lygos
          </button>
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('caisse_oic')}
            className={`text-sm px-3 py-2 rounded-md border ${paymentMethod === 'caisse_oic' ? 'border-cote-ivoire-primary text-cote-ivoire-primary bg-cote-ivoire-primary/5' : 'border-cote-ivoire-medium text-gray-700 bg-white'}`}
            disabled={loading}
          >
            Caisse OIC
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {paymentMethod === 'stripe' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800 mb-2">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Paiement sécurisé par Stripe</span>
              </div>
              <p className="text-sm text-blue-700">
                Cliquez sur "Payer" pour ouvrir le formulaire de paiement sécurisé Stripe.
              </p>
            </div>
          )}

          {paymentMethod === 'lygos' && (
            <>
              <div className="p-3 rounded-md bg-cote-ivoire-lighter border border-cote-ivoire-light text-sm text-gray-700">
                Saisissez la référence de paiement Lygos reçue par SMS/app.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence Lygos
                </label>
                <input
                  type="text"
                  value={lygosRef}
                  onChange={(e) => setLygosRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary text-gray-800 placeholder-gray-500"
                  placeholder="EX: LYG-123-456"
                  required
                />
              </div>
            </>
          )}

          {paymentMethod === 'caisse_oic' && (
            <div className="space-y-2">
              <div className="p-3 rounded-md bg-cote-ivoire-lighter border border-cote-ivoire-light text-sm text-gray-700">
                Vous pouvez régler en espèce/CB à la Caisse OIC. Un reçu sera émis. La validation sera effectuée sous 24h (simulation instantanée ici).
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-cote-ivoire-success/10 rounded-lg border border-cote-ivoire-success/20">
            <Lock className="h-4 w-4 text-cote-ivoire-success" />
            <span className="text-sm text-cote-ivoire-success">
              Paiement sécurisé par cryptage SSL
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cote-ivoire-primary text-white py-3 px-4 rounded-md hover:bg-cote-ivoire-primary/90 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>{loading ? 'Traitement...' : `${paymentMethod === 'caisse_oic' ? 'Valider' : 'Payer'} ${formatPrice(plan.price)}`}</span>
          </button>
        </form>
      </div>

      {/* Modal Stripe */}
      {showStripeModal && (
        <StripePaymentModal
          plan={plan}
          onClose={handleStripeClose}
          onSuccess={handleStripeSuccess}
        />
      )}

      {/* Modal Succès Commande OIC */}
      {showOrderSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-gray-300 shadow-cote-ivoire-xl">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Commande créée avec succès !
              </h2>
              
              <p className="text-gray-600 mb-4">
                Votre commande a été enregistrée et est en attente de validation par la caisse OIC.
              </p>
              
              <div className="bg-cote-ivoire-lighter rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Numéro de commande :</span>
                  <span className="font-bold text-cote-ivoire-primary">{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Plan :</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Montant :</span>
                  <span className="font-bold">{formatPrice(plan.price)}</span>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-yellow-800">
                      Prochaines étapes :
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      <li>• Présentez ce numéro à la caisse OIC</li>
                      <li>• Effectuez le paiement</li>
                      <li>• Attendez la validation par l'administrateur</li>
                      <li>• Vos crédits seront débloqués</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleOrderSuccessClose}
                className="w-full bg-cote-ivoire-primary text-white py-3 px-4 rounded-md hover:bg-cote-ivoire-dark transition-colors"
              >
                Compris, fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;
