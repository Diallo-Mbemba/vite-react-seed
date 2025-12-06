import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, ArrowRight, Home } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les détails du paiement depuis l'URL ou le localStorage
    const paymentIntentId = searchParams.get('payment_intent');
    const sessionId = searchParams.get('session_id');

    if (paymentIntentId) {
      // En production, récupérer les détails depuis l'API
      const storedPayments = localStorage.getItem('stripePayments');
      if (storedPayments) {
        const payments = JSON.parse(storedPayments);
        const payment = payments.find((p: any) => p.paymentIntentId === paymentIntentId);
        setPaymentDetails(payment);
      }
    }

    setLoading(false);
  }, [searchParams]);

  const formatCurrency = (amount: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount / 100); // Convertir de centimes
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* En-tête de succès */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement réussi !
          </h1>
          <p className="text-gray-600">
            Votre paiement a été traité avec succès. Vous pouvez maintenant accéder à vos simulations.
          </p>
        </div>

        {/* Détails du paiement */}
        {paymentDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Détails du paiement
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ID de transaction:</span>
                <span className="font-mono text-sm text-gray-900">
                  {paymentDetails.paymentIntentId}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Montant:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {paymentDetails.status === 'succeeded' ? 'Réussi' : paymentDetails.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">
                  {formatDate(paymentDetails.createdAt)}
                </span>
              </div>

              {paymentDetails.receiptUrl && (
                <div className="pt-3 border-t">
                  <a
                    href={paymentDetails.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cote-ivoire-primary hover:text-cote-ivoire-dark text-sm font-medium"
                  >
                    Télécharger le reçu →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informations sur les crédits */}
        <div className="bg-cote-ivoire-lighter rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vos crédits ont été ajoutés
          </h3>
          <p className="text-gray-600 mb-4">
            Vous pouvez maintenant effectuer des simulations avec vos nouveaux crédits.
          </p>
          <div className="flex items-center text-cote-ivoire-primary">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Accès immédiat aux simulations</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/simulator')}
            className="flex-1 bg-cote-ivoire-primary text-white py-3 px-6 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center justify-center"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Commencer les simulations
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </button>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Des questions ? Contactez notre support à{' '}
            <a href="mailto:support@example.com" className="text-cote-ivoire-primary hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

