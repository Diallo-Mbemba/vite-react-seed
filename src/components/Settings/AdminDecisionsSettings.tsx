import React, { useState, useEffect } from 'react';
import { Save, Settings, AlertCircle, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminDecisionService } from '../../services/supabase/adminDecisionService';

interface AdminDecisionCriteria {
  // Critères de licence
  licenceControlArrival: number;
  licenceAdmissionFDI: number;
  
  // Critères FOB
  fobDispenseRFCV: number;
  fobSoumisRFCV: number;
  
  // Critères FOB_VOC
  fobVocNonAdmis: number;
  fobVocAdmis: number;
  
  // Critères assurance
  assuranceNonRecevable: number;
  assuranceRecevable: number;
  
  // Critères coefficient de revient
  coefficientSatisfaisant: number;
  
  // Critères RCP/RRR
  rcpDifferentZero: boolean;
}

const AdminDecisionsSettings: React.FC = () => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<AdminDecisionCriteria>({
    licenceControlArrival: 70000,
    licenceAdmissionFDI: 100000,
    fobDispenseRFCV: 1000000,
    fobSoumisRFCV: 1000000,
    fobVocNonAdmis: 1000000,
    fobVocAdmis: 1000000,
    assuranceNonRecevable: 8025,
    assuranceRecevable: 8025,
    coefficientSatisfaisant: 1.40,
    rcpDifferentZero: true
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Charger les critères sauvegardés depuis Supabase
  useEffect(() => {
    const loadCriteria = async () => {
      if (!user) {
        return;
      }

      try {
        const savedCriteria = await adminDecisionService.getCriteria(user.id);
        if (savedCriteria && savedCriteria.criteriaData) {
          setCriteria(savedCriteria.criteriaData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des critères:', error);
      }
    };

    loadCriteria();
  }, [user]);

  const handleChange = (field: keyof AdminDecisionCriteria, value: number | boolean) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    try {
      // Sauvegarder dans Supabase
      await adminDecisionService.saveUserCriteria(user.id, criteria);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCriteria({
      licenceControlArrival: 70000,
      licenceAdmissionFDI: 100000,
      fobDispenseRFCV: 1000000,
      fobSoumisRFCV: 1000000,
      fobVocNonAdmis: 1000000,
      fobVocAdmis: 1000000,
      assuranceNonRecevable: 8025,
      assuranceRecevable: 8025,
      coefficientSatisfaisant: 1.40,
      rcpDifferentZero: true
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-cote-ivoire-primary rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Paramètres des Décisions Administratives</h2>
            <p className="text-gray-600">Configurez les critères pour les décisions administratives ivoiriennes</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">À propos des critères</p>
              <p>Ces paramètres déterminent les seuils utilisés pour générer automatiquement les décisions administratives dans les rapports de simulation. Modifiez-les selon les réglementations en vigueur.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critères de licence */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-cote-ivoire-primary" />
          <span>Critères de Licence</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "CONTROLE D'ARRIVEE" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.licenceControlArrival}
              onChange={(e) => handleChange('licenceControlArrival', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="70000"
            />
            <p className="text-xs text-gray-500 mt-1">Si licence = {criteria.licenceControlArrival} alors "CONTROLE D'ARRIVEE"</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "ADMIS A LA LEVEE DE LA FDI" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.licenceAdmissionFDI}
              onChange={(e) => handleChange('licenceAdmissionFDI', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="100000"
            />
            <p className="text-xs text-gray-500 mt-1">Si licence ≥ {criteria.licenceAdmissionFDI} alors "ADMIS A LA LEVEE DE LA FDI"</p>
          </div>
        </div>
      </div>

      {/* Critères FOB */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-cote-ivoire-primary" />
          <span>Critères FOB</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "DISPENSE RFCV" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.fobDispenseRFCV}
              onChange={(e) => handleChange('fobDispenseRFCV', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="1000000"
            />
            <p className="text-xs text-gray-500 mt-1">Si FOB &lt; {criteria.fobDispenseRFCV} alors &quot;DISPENSE RFCV&quot;</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "SOUMIS AU RFCV" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.fobSoumisRFCV}
              onChange={(e) => handleChange('fobSoumisRFCV', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="1000000"
            />
            <p className="text-xs text-gray-500 mt-1">Si FOB ≥ {criteria.fobSoumisRFCV} alors &quot;SOUMIS AU RFCV&quot;</p>
          </div>
        </div>
      </div>

      {/* Critères FOB_VOC */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-cote-ivoire-primary" />
          <span>Critères FOB_VOC</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "NON ADMIS A LA LEVEE DU VOC" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.fobVocNonAdmis}
              onChange={(e) => handleChange('fobVocNonAdmis', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="1000000"
            />
            <p className="text-xs text-gray-500 mt-1">Si FOB_VOC &lt; {criteria.fobVocNonAdmis} alors &quot;NON ADMIS A LA LEVEE DU VOC&quot;</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "ADMIS A LA LEVEE DU VOC" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.fobVocAdmis}
              onChange={(e) => handleChange('fobVocAdmis', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="1000000"
            />
            <p className="text-xs text-gray-500 mt-1">Si FOB_VOC ≥ {criteria.fobVocAdmis} alors &quot;ADMIS A LA LEVEE DU VOC&quot;</p>
          </div>
        </div>
      </div>

      {/* Critères Assurance */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-cote-ivoire-primary" />
          <span>Critères Assurance</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "PRIME NON RECEVABLE" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.assuranceNonRecevable}
              onChange={(e) => handleChange('assuranceNonRecevable', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="8025"
            />
            <p className="text-xs text-gray-500 mt-1">Si ASSURANCE &lt; {criteria.assuranceNonRecevable} alors &quot;PRIME NON RECEVABLE&quot;</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil "PRIME RECEVABLE" (FCFA)
            </label>
            <input
              type="number"
              value={criteria.assuranceRecevable}
              onChange={(e) => handleChange('assuranceRecevable', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              placeholder="8025"
            />
            <p className="text-xs text-gray-500 mt-1">Si ASSURANCE ≥ {criteria.assuranceRecevable} alors &quot;PRIME RECEVABLE&quot;</p>
          </div>
        </div>
      </div>

      {/* Critères Coefficient de Revient */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-cote-ivoire-primary" />
          <span>Critères Coefficient de Revient</span>
        </h3>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seuil "COEFFICIENT MULTIPLICATEUR SATISFAISANT"
          </label>
          <input
            type="number"
            step="0.01"
            value={criteria.coefficientSatisfaisant}
            onChange={(e) => handleChange('coefficientSatisfaisant', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
            placeholder="1.40"
          />
          <p className="text-xs text-gray-500 mt-1">Si coefficient ≤ {criteria.coefficientSatisfaisant} alors &quot;SATISFAISANT&quot;</p>
        </div>
      </div>

      {/* Critères RCP/RRR */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-cote-ivoire-primary" />
          <span>Critères RCP/RRR</span>
        </h3>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="rcpDifferentZero"
            checked={criteria.rcpDifferentZero}
            onChange={(e) => handleChange('rcpDifferentZero', e.target.checked)}
            className="h-4 w-4 text-cote-ivoire-primary focus:ring-cote-ivoire-primary border-gray-300 rounded"
          />
          <label htmlFor="rcpDifferentZero" className="text-sm font-medium text-gray-700">
            Si RCP est différent de 0 alors &quot;SOUMIS A LA REDEVANCE RCP/RRR&quot;
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </button>
          
          <div className="flex items-center space-x-3">
            {saved && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Sauvegardé !</span>
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-cote-ivoire-primary text-white rounded-md hover:bg-cote-ivoire-primary/90 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionsSettings;
