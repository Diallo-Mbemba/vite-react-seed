import React from 'react';
import { CreditCard, Smartphone, Building2, Zap, CheckCircle } from 'lucide-react';

const PaymentMethodInfo: React.FC = () => {
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCard,
      description: 'Paiement par carte bancaire',
      features: [
        'Autorisation automatique',
        'Crédits disponibles immédiatement',
        'Sécurisé et rapide'
      ],
      color: 'border-blue-200 bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 'lygos',
      name: 'Lygos',
      icon: Smartphone,
      description: 'Paiement mobile',
      features: [
        'Autorisation automatique',
        'Crédits disponibles immédiatement',
        'Simple et pratique'
      ],
      color: 'border-green-200 bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      id: 'caisse_oic',
      name: 'Caisse OIC',
      icon: Building2,
      description: 'Paiement en caisse',
      features: [
        'Validation manuelle requise',
        'Crédits disponibles après autorisation',
        'Processus traditionnel'
      ],
      color: 'border-orange-200 bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Modes de Paiement Disponibles
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className={`rounded-lg border-2 p-4 ${method.color}`}>
            <div className="flex items-center gap-3 mb-3">
              <method.icon className={`w-5 h-5 ${method.iconColor}`} />
              <div>
                <h4 className="font-semibold text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            </div>
            
            <ul className="space-y-1">
              {method.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Système FIFO Unifié</h5>
            <p className="text-sm text-blue-700">
              Tous les modes de paiement utilisent le même système FIFO. 
              Les crédits sont consommés dans l'ordre chronologique d'achat, 
              peu importe le mode de paiement utilisé.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-green-900 mb-1">Autorisation Automatique</h5>
            <p className="text-sm text-green-700">
              Les paiements par <strong>Stripe</strong> et <strong>Lygos</strong> sont automatiquement 
              validés et autorisés. Vos crédits sont disponibles immédiatement après le paiement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodInfo;
