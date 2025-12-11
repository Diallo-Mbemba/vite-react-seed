import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight
} from 'lucide-react';

interface PaymentGuardProps {
  children: React.ReactNode;
  requiredCredits?: number;
}

const PaymentGuard: React.FC<PaymentGuardProps> = ({ 
  children, 
  requiredCredits = 1 
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connexion requise
          </h1>
          
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder au simulateur de facturation.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-cote-ivoire-primary text-white py-3 px-6 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center justify-center"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Se connecter
            </button>
            
            <button
              onClick={() => navigate('/plans')}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors"
            >
              Voir les plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a suffisamment de crédits
  if (user.remainingCredits < requiredCredits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Crédits insuffisants
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Crédits disponibles:</span>
              <span className="font-bold text-gray-900">{user.remainingCredits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Crédits requis:</span>
              <span className="font-bold text-red-600">{requiredCredits}</span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Vous n'avez pas assez de crédits pour effectuer cette simulation. 
            Veuillez acheter un plan pour obtenir plus de crédits.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/plans')}
              className="w-full bg-cote-ivoire-primary text-white py-3 px-6 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center justify-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Acheter des crédits
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a un plan valide
  if (user.plan === 'free' && user.remainingCredits === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Plan gratuit épuisé
          </h1>
          
          <p className="text-gray-600 mb-6">
            Vous avez utilisé tous vos crédits gratuits. 
            Choisissez un plan payant pour continuer à utiliser le simulateur.
          </p>
          
          <div className="bg-cote-ivoire-lighter rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-cote-ivoire-primary mb-2">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-semibold">Plans disponibles</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Plan Basic : 10 simulations</li>
              <li>• Plan Pro : 50 simulations</li>
              <li>• Plan Premium : 200 simulations</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/plans')}
              className="w-full bg-cote-ivoire-primary text-white py-3 px-6 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center justify-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Voir les plans
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si toutes les vérifications passent, afficher le contenu protégé
  return <>{children}</>;
};

export default PaymentGuard;

