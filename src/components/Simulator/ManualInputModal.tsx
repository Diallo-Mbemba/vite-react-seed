import React, { useState, useEffect } from 'react';
import { X, Calculator, AlertTriangle, Save, Info, CheckCircle, DollarSign, TrendingUp, Shield, Package, Users, Settings, FileText, CreditCard } from 'lucide-react';

interface ManualInputModalProps {
  missingCalculations: Array<{
    key: string;
    label: string;
    description: string;
    unit: string;
  }>;
  onClose: () => void;
  onSave: (values: Record<string, number>) => void;
}

const ManualInputModal: React.FC<ManualInputModalProps> = ({ 
  missingCalculations, 
  onClose, 
  onSave 
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const getIconForCalculation = (key: string) => {
    switch (key) {
      case 'fret': return Package;
      case 'assurance': return Shield;
      case 'droitDouane': return CreditCard;
      case 'fraisFinanciers': return TrendingUp;
      case 'prestationTransitaire': return Users;
      case 'rpi': case 'rrr': case 'rcp': return Settings;
      case 'coc': case 'bsc': return FileText;
      default: return Calculator;
    }
  };

  const getColorForCalculation = (key: string) => {
    switch (key) {
      case 'fret': return 'text-cote-ivoire-success bg-cote-ivoire-success/50 border-cote-ivoire-success';
      case 'assurance': return 'text-cote-ivoire-primary bg-cote-ivoire-primary/50 border-cote-ivoire-primary';
      case 'droitDouane': return 'text-cote-ivoire-primary bg-cote-ivoire-primary/50 border-cote-ivoire-primary';
      case 'fraisFinanciers': return 'text-cote-ivoire-secondary bg-cote-ivoire-secondary/50 border-cote-ivoire-secondary';
      case 'prestationTransitaire': return 'text-cyan-400 bg-cyan-900/50 border-cyan-700';
      case 'rpi': case 'rrr': case 'rcp': return 'text-indigo-400 bg-indigo-900/50 border-indigo-700';
      case 'coc': case 'bsc': return 'text-orange-400 bg-orange-900/50 border-orange-700';
      default: return 'text-cote-ivoire-primary bg-cote-ivoire-primary/50 border-cote-ivoire-primary';
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Marquer le champ comme complété si valide
    if (value && !isNaN(Number(value)) && Number(value) >= 0) {
      setCompletedFields(prev => new Set([...prev, key]));
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
    
    // Effacer l'erreur si elle existe
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    missingCalculations.forEach(calc => {
      const value = values[calc.key];
      if (!value || value.trim() === '') {
        newErrors[calc.key] = 'Cette valeur est obligatoire pour continuer';
      } else if (isNaN(Number(value))) {
        newErrors[calc.key] = 'Veuillez entrer un nombre valide';
      } else if (Number(value) < 0) {
        newErrors[calc.key] = 'La valeur ne peut pas être négative';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateInputs()) {
      const numericValues: Record<string, number> = {};
      Object.entries(values).forEach(([key, value]) => {
        numericValues[key] = Number(value) || 0;
      });
      onSave(numericValues);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTotalEstimated = () => {
    return Object.entries(values).reduce((sum, [, value]) => {
      const numValue = Number(value) || 0;
      return sum + numValue;
    }, 0);
  };

  const progressPercentage = (completedFields.size / missingCalculations.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-cote-ivoire-light shadow-2xl transform transition-all duration-300 ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        
        {/* En-tête clair */}
        <div className="sticky top-0 bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-success/10 p-6 flex items-center justify-between rounded-t-xl border-b border-cote-ivoire-light">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-cote-ivoire-primary/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-cote-ivoire-primary" /> libelle semb
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Saisie manuelle requise</h2>
              <p className="text-gray-600">
                Complétez les valeurs manquantes pour continuer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Barre de progression */}
          <div className="bg-white rounded-xl p-4 border border-cote-ivoire-light">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900 font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-cote-ivoire-primary" />
                Progression de la saisie
              </h3>
              <span className="text-sm text-gray-600">
                {completedFields.size}/{missingCalculations.length} complétés
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-success h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {progressPercentage === 100 ? 'Tous les champs sont complétés !' : 'Complétez tous les champs pour continuer'}
            </p>
          </div>

          {/* Message d'information */}
          <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-cote-ivoire-primary/30 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-cote-ivoire-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-cote-ivoire-primary" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">
                  Pourquoi cette saisie est-elle nécessaire ?
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Vous avez désactivé certains calculs automatiques dans vos paramètres. 
                  Pour obtenir une simulation précise, nous avons besoin que vous saisissiez 
                  manuellement les valeurs correspondantes.
                </p>
                <div className="mt-3 flex items-center space-x-2 text-xs text-gray-700">
                  <Settings className="h-4 w-4 text-cote-ivoire-primary" />
                  <span>Vous pouvez réactiver les calculs automatiques dans l'onglet "Calculs automatiques"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grille des champs de saisie */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="h-6 w-6 mr-3 text-cote-ivoire-primary" />
              Valeurs à compléter
              <span className="ml-3 text-sm bg-cote-ivoire-primary/10 text-cote-ivoire-primary px-3 py-1 rounded-full border border-cote-ivoire-primary/30">
                {missingCalculations.length} champ{missingCalculations.length > 1 ? 's' : ''}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {missingCalculations.map((calc, index) => {
                const Icon = getIconForCalculation(calc.key);
                const colorClass = getColorForCalculation(calc.key);
                const isCompleted = completedFields.has(calc.key);
                const hasError = errors[calc.key];

                return (
                  <div 
                    key={calc.key} 
                    className={`bg-white rounded-xl p-3 border transition-all duration-300 hover:shadow-md ${
                      hasError 
                        ? 'border-cote-ivoire-primary bg-cote-ivoire-primary/5' 
                        : isCompleted 
                          ? 'border-cote-ivoire-success bg-cote-ivoire-success/5' 
                          : 'border-cote-ivoire-light hover:border-gray-400'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-900">
                            {calc.label}
                          </label>
                          {isCompleted && (
                            <CheckCircle className="h-4 w-4 text-cote-ivoire-success" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 leading-snug max-h-10 overflow-hidden">
                          {calc.description}
                        </p>
                        
                        <div className="relative">
                          <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="number"
                            value={values[calc.key] || ''}
                            onChange={(e) => handleInputChange(calc.key, e.target.value)}
                            className={`w-full pl-8 pr-16 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-900 placeholder-gray-500 transition-all ${
                              hasError 
                                ? 'border-cote-ivoire-primary' 
                                : isCompleted 
                                  ? 'border-cote-ivoire-success' 
                                  : 'border-cote-ivoire-light'
                            }`}
                            placeholder="Saisissez le montant"
                            step="0.01"
                            min="0"
                          />
                          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                            <span className="text-gray-700 text-xs font-medium bg-white px-1.5 py-0.5 rounded border border-cote-ivoire-light">
                              {calc.unit}
                            </span>
                          </div>
                        </div>
                        
                        {hasError && (
                          <div className="mt-1 flex items-center space-x-1.5 text-cote-ivoire-primary">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <p className="text-xs">{errors[calc.key]}</p>
                          </div>
                        )}
                        
                        {isCompleted && !hasError && (
                          <div className="mt-1 flex items-center space-x-1.5 text-cote-ivoire-success">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <p className="text-xs">Valeur validée</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Résumé financier */}
          <div className="bg-white rounded-xl p-5 border border-cote-ivoire-light">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-cote-ivoire-primary" />
              Résumé financier
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Détail par poste :</h5>
                {missingCalculations.map((calc) => {
                  const value = values[calc.key];
                  const numValue = Number(value) || 0;
                  const isValid = value && !errors[calc.key] && numValue >= 0;
                  
                  return (
                    <div key={calc.key} className="flex justify-between items-center text-sm py-2 px-3 bg-white rounded-lg border border-cote-ivoire-light">
                      <span className="text-gray-700">{calc.label}:</span>
                      <span className={`font-medium ${isValid ? 'text-gray-900' : 'text-gray-500'}`}>
                        {isValid ? formatCurrency(numValue) : 'Non saisi'}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-cote-ivoire-light">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total estimé des saisies</p>
                  <p className="text-2xl font-bold text-cote-ivoire-primary">
                    {formatCurrency(getTotalEstimated())}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {completedFields.size > 0 ? 'Basé sur les valeurs saisies' : 'Aucune valeur saisie'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-cote-ivoire-light">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-cote-ivoire-light hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Annuler la simulation</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={completedFields.size !== missingCalculations.length}
              className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-success text-white border border-transparent hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>
                {completedFields.size === missingCalculations.length 
                  ? 'Lancer la simulation' 
                  : `Compléter ${missingCalculations.length - completedFields.size} champ${missingCalculations.length - completedFields.size > 1 ? 's' : ''}`
                }
              </span>
            </button>
          </div>

          {/* Note de bas de page */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-cote-ivoire-light">
            <p>💡 Astuce : Vous pouvez réactiver les calculs automatiques dans l'onglet "Calculs automatiques" pour éviter cette étape à l'avenir</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInputModal;
