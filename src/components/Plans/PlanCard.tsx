import React from 'react';
import { Plan } from '../../types';
import { Check, Star } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  isPopular?: boolean;
  canBuyCredits?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isPopular, canBuyCredits = true }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-cote-ivoire-light hover:shadow-cote-ivoire-medium transition-shadow duration-300 border ${
              isPopular ? 'ring-2 ring-cote-ivoire-primary border-cote-ivoire-primary' : 'border-gray-300'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-cote-ivoire-primary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>Populaire</span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${plan.color}`}>
          <span className="text-lg font-bold">
            {plan.name.charAt(0)}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-800">
              {plan.price === 0 ? 'Gratuit' : formatPrice(plan.price)}
            </span>
            {plan.price > 0 && (
              <span className="text-gray-500 ml-2">
                / {plan.credits} simulation{plan.credits > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {plan.price > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {formatPrice(plan.price / plan.credits)} par simulation
            </p>
          )}
        </div>
        
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-cote-ivoire-success mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        <button
          onClick={() => onSelect(plan)}
          disabled={plan.id !== 'free' && !canBuyCredits}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            plan.id === 'free'
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : !canBuyCredits
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-cote-ivoire-primary text-white hover:bg-cote-ivoire-primary/90'
          }`}
        >
          {plan.id === 'free' 
            ? 'Commencer gratuitement' 
            : !canBuyCredits 
            ? 'Crédits disponibles' 
            : 'Choisir ce plan'
          }
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
