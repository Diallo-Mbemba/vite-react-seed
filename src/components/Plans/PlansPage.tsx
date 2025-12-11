import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { plans } from '../../data/plans';
import { Plan } from '../../types';
import PlanCard from './PlanCard';
import PaymentModal from './PaymentModal';
import CreditInfo from './CreditInfo';
import PaymentMethodInfo from './PaymentMethodInfo';
import { canUserBuyCredits } from '../../utils/paymentUtils';

const PlansPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { user } = useAuth();

  const handlePlanSelect = (plan: Plan) => {
    if (plan.id === 'free') {
      // Free plan logic would go here
      return;
    }
    
    // NOUVEAU: L'utilisateur peut toujours acheter des crédits (système FIFO)
    // Plus de restriction sur l'achat de crédits
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Sélectionnez le plan qui correspond le mieux à vos besoins de simulation 
          de coût de revient pour vos opérations d'import-export.
        </p>
      </div>

      {showSuccessMessage && (
        <div className="bg-cote-ivoire-success/10 border border-cote-ivoire-success/20 rounded-md p-4 text-center">
          <p className="text-cote-ivoire-success">
            🎉 Félicitations ! Votre plan a été activé avec succès. 
            Vous pouvez maintenant utiliser vos crédits pour vos simulations.
          </p>
        </div>
      )}

      {/* Informations sur les modes de paiement */}
      <PaymentMethodInfo />

      {/* Informations détaillées sur les crédits */}
      <CreditInfo />

      {user && (
        <div className="bg-cote-ivoire-primary/10 border border-cote-ivoire-primary/20 rounded-md p-4 text-center">
          <p className="text-cote-ivoire-primary">
            <strong>Plan actuel :</strong> {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} - 
            <strong> {user.remainingCredits} crédits restants</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={handlePlanSelect}
            isPopular={index === 2} // Silver plan is popular
            canBuyCredits={canUserBuyCredits(user)}
          />
        ))}
      </div>

              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-cote-ivoire-light">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Pourquoi choisir Kprague ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-cote-ivoire-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-cote-ivoire-primary/20">
              <span className="text-cote-ivoire-primary font-bold">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Calculs rapides</h3>
            <p className="text-sm text-gray-600">
              Obtenez vos résultats en quelques secondes seulement
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-cote-ivoire-success/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-cote-ivoire-success/20">
              <span className="text-cote-ivoire-success font-bold">✓</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Précision garantie</h3>
            <p className="text-sm text-gray-600">
              Calculs basés sur les réglementations en vigueur
            </p>
          </div>
                      <div className="text-center">
              <div className="w-12 h-12 bg-cote-ivoire-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-cote-ivoire-secondary/20">
                <span className="text-cote-ivoire-secondary font-bold">📊</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Rapports détaillés</h3>
              <p className="text-sm text-gray-600">
                Exportez vos simulations au format PDF
              </p>
            </div>
        </div>
      </div>

      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PlansPage;
