import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, FileText, Calculator, ArrowRight, ArrowLeft, Scale } from 'lucide-react';

interface InvoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onGoBack: () => void; // Nouvelle prop pour revenir à l'étape précédente
  userData: {
    montantFacture: number;
    numeroFacture: string;
    devise: string;
    tauxChange: number;
    poidsTotalTonnes?: number; // Ajout du poids saisi par l'utilisateur
  };
  calculatedData: {
    montantTotal: number;
    montantFCFA: number;
    nombreArticles: number;
    poidsTotal: number;
    devise: string; // Devise de la facture calculée
  };
  discrepancies: {
    montantFacture: {
      user: number;
      calculated: number;
      difference: number;
      percentage: number;
    };
    devise: {
      user: string;
      calculated: string;
      match: boolean;
    };
    // Nouvelle propriété pour la vérification du montant en FCFA
    montantFCFA?: {
      user: number; // Montant saisi converti en FCFA
      calculated: number; // Montant calculé en FCFA
      difference: number;
      percentage: number;
    };
    // Nouvelle propriété pour la vérification du poids
    poids?: {
      user: number; // Poids saisi par l'utilisateur (en tonnes)
      calculated: number; // Poids calculé (en kg)
      userInKg: number; // Poids saisi converti en kg
      difference: number;
      percentage: number;
    };
  };
}

const InvoiceVerificationModal: React.FC<InvoiceVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onGoBack,
  userData,
  calculatedData,
  discrepancies
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string = 'FCFA') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'FCFA' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('fr-FR').format(number);
  };

  const formatWeight = (weight: number, unit: 'kg' | 'tonnes' = 'kg') => {
    if (unit === 'tonnes') {
      return `${formatNumber(weight)} tonnes (${formatNumber(weight * 1000)} kg)`;
    }
    return `${formatNumber(weight)} kg`;
  };

  const getDiscrepancyLevel = (percentage: number) => {
    if (percentage <= 1) return 'low';
    if (percentage <= 5) return 'medium';
    return 'high';
  };

  const getDiscrepancyColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-cote-ivoire-success';
      case 'medium': return 'text-cote-ivoire-secondary';
      case 'high': return 'text-cote-ivoire-primary';
      default: return 'text-gray-600';
    }
  };

  const getDiscrepancyIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4 text-cote-ivoire-success" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-cote-ivoire-secondary" />;
      case 'high': return <XCircle className="h-4 w-4 text-cote-ivoire-primary" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const discrepancyLevel = getDiscrepancyLevel(discrepancies.montantFacture.percentage);
  
  // Fonction helper pour déterminer le niveau de différence à utiliser
  const getEffectiveDiscrepancyLevel = () => {
    if (discrepancies.montantFCFA) {
      return getDiscrepancyLevel(discrepancies.montantFCFA.percentage);
    }
    return discrepancyLevel;
  };

  // Vérifier s'il y a des incohérences importantes
  const hasSignificantDiscrepancies = () => {
    const montantLevel = getEffectiveDiscrepancyLevel();
    const poidsLevel = discrepancies.poids ? getDiscrepancyLevel(discrepancies.poids.percentage) : 'low';
    
    return montantLevel === 'high' || poidsLevel === 'high' || montantLevel === 'medium' || poidsLevel === 'medium';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-4xl w-full border border-cote-ivoire-primary shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-cote-ivoire-primary rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Vérification des données de facture</h3>
                <p className="text-gray-600 text-sm">Comparaison entre données saisies et calculées</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Résumé des données */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Données saisies par l'utilisateur */}
            <div className="bg-cote-ivoire-lighter rounded-lg p-4 border border-gray-300">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-5 w-5 text-cote-ivoire-primary" />
                <h4 className="text-gray-800 font-semibold">Données saisies (Étape 2)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant facture:</span>
                  <span className="text-gray-800 font-medium">
                    {formatCurrency(userData.montantFacture, userData.devise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro facture:</span>
                  <span className="text-gray-800 font-medium">{userData.numeroFacture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Devise:</span>
                  <span className="text-gray-800 font-medium">{userData.devise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de change:</span>
                  <span className="text-gray-800 font-medium">{formatNumber(userData.tauxChange)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant en FCFA:</span>
                  <span className="text-gray-800 font-medium">
                    {formatCurrency(userData.montantFacture * userData.tauxChange, 'FCFA')}
                  </span>
                </div>
                {userData.poidsTotalTonnes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Poids total:</span>
                    <span className="text-gray-800 font-medium">
                      {formatWeight(userData.poidsTotalTonnes, 'tonnes')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Données calculées par le système */}
            <div className="bg-cote-ivoire-lighter rounded-lg p-4 border border-cote-ivoire-primary">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="h-5 w-5 text-cote-ivoire-success" />
                <h4 className="text-gray-800 font-semibold">Données calculées (Import Excel)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant total:</span>
                  <span className="text-gray-800 font-medium">
                    {formatCurrency(calculatedData.montantTotal, calculatedData.devise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Devise:</span>
                  <span className="text-gray-800 font-medium">{calculatedData.devise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant en FCFA:</span>
                  <span className="text-gray-800 font-medium">
                    {formatCurrency(calculatedData.montantFCFA, 'FCFA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre d'articles:</span>
                  <span className="text-gray-800 font-medium">{calculatedData.nombreArticles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Poids total:</span>
                  <span className="text-gray-800 font-medium">{formatWeight(calculatedData.poidsTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analyse des incohérences */}
          <div className="bg-cote-ivoire-lighter rounded-lg p-4 border border-cote-ivoire-primary mb-6">
            <h4 className="text-gray-800 font-semibold mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-cote-ivoire-secondary" />
              <span>Analyse des incohérences</span>
            </h4>
            
            <div className="space-y-4">
              {/* Incohérence du montant - Comparaison directe */}
              <div className="bg-white rounded-lg p-4 border border-gray-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getDiscrepancyIcon(discrepancyLevel)}
                    <span className="text-gray-800 font-medium">Comparaison du montant (même devise)</span>
                  </div>
                  <span className={`text-sm font-medium ${getDiscrepancyColor(discrepancyLevel)}`}>
                    {discrepancies.montantFacture.percentage.toFixed(2)}% de différence
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600 mb-1">Saisi ({userData.devise})</div>
                    <div className="text-gray-800 font-medium">
                      {formatCurrency(discrepancies.montantFacture.user, userData.devise)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 mb-1">Calculé ({calculatedData.devise})</div>
                    <div className="text-gray-800 font-medium">
                      {formatCurrency(discrepancies.montantFacture.calculated, calculatedData.devise)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 mb-1">Différence</div>
                    <div className={`font-medium ${
                      discrepancies.montantFacture.difference > 0 ? 'text-cote-ivoire-primary' : 'text-cote-ivoire-success'
                    }`}>
                      {discrepancies.montantFacture.difference > 0 ? '+' : ''}
                      {formatCurrency(discrepancies.montantFacture.difference, calculatedData.devise)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Incohérence du poids */}
              {discrepancies.poids && (
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Scale className="h-4 w-4 text-cote-ivoire-primary" />
                      {getDiscrepancyIcon(getDiscrepancyLevel(discrepancies.poids.percentage))}
                      <span className="text-gray-800 font-medium">Comparaison du poids</span>
                    </div>
                    <span className={`text-sm font-medium ${getDiscrepancyColor(getDiscrepancyLevel(discrepancies.poids.percentage))}`}>
                      {discrepancies.poids.percentage.toFixed(2)}% de différence
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Saisi</div>
                      <div className="text-gray-800 font-medium">
                        {formatWeight(discrepancies.poids.user, 'tonnes')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Calculé</div>
                      <div className="text-gray-800 font-medium">
                        {formatWeight(discrepancies.poids.calculated)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Différence</div>
                      <div className={`font-medium ${
                        discrepancies.poids.difference > 0 ? 'text-cote-ivoire-primary' : 'text-cote-ivoire-success'
                      }`}>
                        {discrepancies.poids.difference > 0 ? '+' : ''}
                        {formatWeight(Math.abs(discrepancies.poids.difference))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Incohérence du montant - Comparaison en FCFA */}
              {discrepancies.montantFCFA && (
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getDiscrepancyIcon(getDiscrepancyLevel(discrepancies.montantFCFA.percentage))}
                      <span className="text-gray-800 font-medium">Comparaison en FCFA</span>
                    </div>
                    <span className={`text-sm font-medium ${getDiscrepancyColor(getDiscrepancyLevel(discrepancies.montantFCFA.percentage))}`}>
                      {discrepancies.montantFCFA.percentage.toFixed(2)}% de différence
                    </span>
                  </div>
                  
                  <div className="mb-3 p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                      <span>{formatCurrency(userData.montantFacture, userData.devise)}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>Conversion en FCFA</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{formatCurrency(discrepancies.montantFCFA.user, 'FCFA')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Saisi en FCFA</div>
                      <div className="text-gray-800 font-medium">
                        {formatCurrency(discrepancies.montantFCFA.user, 'FCFA')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Calculé en FCFA</div>
                      <div className="text-gray-800 font-medium">
                        {formatCurrency(discrepancies.montantFCFA.calculated, 'FCFA')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Différence</div>
                      <div className={`font-medium ${
                        discrepancies.montantFCFA.difference > 0 ? 'text-cote-ivoire-primary' : 'text-cote-ivoire-success'
                      }`}>
                        {discrepancies.montantFCFA.difference > 0 ? '+' : ''}
                        {formatCurrency(discrepancies.montantFCFA.difference, 'FCFA')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statut de la devise */}
              <div className="bg-white rounded-lg p-4 border border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {discrepancies.devise.match ? 
                      <CheckCircle className="h-4 w-4 text-cote-ivoire-success" /> : 
                      <XCircle className="h-4 w-4 text-cote-ivoire-primary" />
                    }
                    <span className="text-gray-800 font-medium">Devise</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Saisie: </span>
                    <span className="text-gray-800 font-medium">{discrepancies.devise.user}</span>
                    <span className="text-gray-600 mx-2">|</span>
                    <span className="text-gray-600">Calculée: </span>
                    <span className="text-gray-800 font-medium">{discrepancies.devise.calculated}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommandations */}
          <div className="bg-cote-ivoire-secondary/10 border border-cote-ivoire-secondary/50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-cote-ivoire-secondary mt-0.5" />
              <div className="text-sm text-cote-ivoire-secondary">
                <p className="font-medium mb-2">Recommandations :</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Comparaison en unités standardisées</strong> - Montant en FCFA et poids en kg</li>
                  {getEffectiveDiscrepancyLevel() === 'high' && (
                    <li>• <strong>Différence importante détectée sur le montant en FCFA</strong> - Vérifiez les données de votre facture Excel et les taux de change</li>
                  )}
                  {discrepancies.poids && getDiscrepancyLevel(discrepancies.poids.percentage) === 'high' && (
                    <li>• <strong>Différence importante détectée sur le poids en kg</strong> - Vérifiez le poids total saisi dans l'étape 3</li>
                  )}
                  {getEffectiveDiscrepancyLevel() === 'medium' && (
                    <li>• <strong>Différence modérée</strong> - Vérifiez les arrondis, les taxes et les taux de change</li>
                  )}
                  {getEffectiveDiscrepancyLevel() === 'low' && (
                    <li>• <strong>Différence minime</strong> - Probablement due aux arrondis ou aux variations de taux</li>
                  )}
                  <li>• Les données calculées remplaceront celles saisies manuellement</li>
                  {hasSignificantDiscrepancies() && (
                    <li>• <strong>Vous pouvez revenir à l'étape précédente</strong> pour corriger vos saisies</li>
                  )}
                  <li>• <strong>Vérifiez le taux de change</strong> utilisé pour la conversion en FCFA</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
            >
              <span>Annuler</span>
            </button>
            {hasSignificantDiscrepancies() && (
              <button
                onClick={onGoBack}
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-secondary/20 text-cote-ivoire-secondary border border-cote-ivoire-secondary hover:bg-cote-ivoire-secondary/30 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Revenir à l'étape précédente</span>
              </button>
            )}
            <button
              onClick={onConfirm}
              className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-secondary transition-colors"
            >
              <span>Confirmer et continuer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceVerificationModal; 
