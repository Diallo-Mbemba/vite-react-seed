import React, { useRef, useState } from 'react';
import { X, Download, Printer, TrendingUp, Package, Calculator, AlertCircle, CheckCircle, Shield, CreditCard, ArrowRight, ArrowLeft, Target, Clock, ChevronRight, AlertTriangle, BarChart3, FileText, Users, Settings, DollarSign, Lightbulb, Filter, Gavel, Info } from 'lucide-react';
import { generatePDFReport } from '../../utils/pdfGenerator';
import { downloadReport } from '../../utils/reportGenerator';
import { getActorById } from '../../data/actors';
import { findTECArticleByCode } from '../../data/tec';
import { generateAdminDecisions } from '../../utils/adminDecisions';

interface CostResultModalProps {
  result: any;
  onClose: () => void;
  autoCalculations?: {
    fobConversion: boolean;
    fret: boolean;
    assurance: boolean;
    droitDouane: boolean;
    coc: boolean;
    rpi: boolean;
    fraisFinanciers: boolean;
    transitaire: boolean;
    bsc: boolean;
    fraisImprevus: boolean;
    rrr: boolean;
    rcp: boolean;
    creditEnlevement: boolean;
    avanceFonds: boolean;
  };
}

const CostResultModal: React.FC<CostResultModalProps> = ({ result, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'products', label: 'Détails Produits', icon: Package },
    { id: 'analysis', label: 'Analyse Prix', icon: BarChart3 },
    { id: 'decisions', label: 'Conseils Admin', icon: Lightbulb },
    { id: 'admin-decisions', label: 'Décisions Admin Ivoiriennes', icon: Gavel }
  ];

  const renderAdminDecisionsTab = () => {
    console.log('🚀 RENDER ADMIN DECISIONS TAB CALLED');
    
    // Préparer les données pour les décisions administratives
    const coefficientRevient = result.fob && result.totalCost ? result.totalCost / result.fob : undefined;
    const fobVoc = result.fob && result.fret ? result.fob + result.fret : result.fob;
    const paysFournisseur = result.selectedActors?.fournisseur ? 
      result.actors?.find(actor => actor?.id === result.selectedActors.fournisseur)?.country : undefined;

    const simulationData = {
      licence: result.rpi, // RPI correspond à la licence
      fob: result.fob,
      fobVoc: fobVoc,
      assurance: result.assurance,
      caf: result.totalCost, // CAF = coût total
      coefficientRevient: coefficientRevient,
      rcp: result.rcp,
      rrr: result.rrr,
      modePaiement: result.modePaiement,
      incoterm: result.incoterm,
      route: result.transport?.route,
      paysFournisseur: paysFournisseur
    };

    console.log('=== DIAGNOSTIC DÉCISIONS ADMINISTRATIVES ===');
    console.log('Result object complet:', result);
    console.log('Simulation data mappée:', simulationData);
    console.log('Vérification des valeurs clés:');
    console.log('- licence (rpi):', result.rpi);
    console.log('- fob:', result.fob);
    console.log('- fret:', result.fret);
    console.log('- assurance:', result.assurance);
    console.log('- totalCost (CAF):', result.totalCost);
    console.log('- modePaiement:', result.modePaiement);
    console.log('- incoterm:', result.incoterm);
    console.log('- route:', result.transport?.route);
    console.log('- selectedActors:', result.selectedActors);
    console.log('- actors:', result.actors);
    
    const adminDecisionsResult = generateAdminDecisions(simulationData);
    const adminDecisions = Array.isArray(adminDecisionsResult) ? adminDecisionsResult : [];
    console.log('Admin decisions result:', adminDecisionsResult);
    console.log('Admin decisions array:', adminDecisions);
    console.log('Admin decisions length:', adminDecisions.length);
    console.log('=== FIN DIAGNOSTIC ===');

    // Grouper les décisions par catégorie
    const decisionsByCategory = adminDecisions.reduce((acc, decision) => {
      if (!acc[decision.category]) {
        acc[decision.category] = [];
      }
      acc[decision.category].push(decision);
      return acc;
    }, {} as { [key: string]: typeof adminDecisions });

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'success': return 'text-green-600 bg-green-50 border-green-200';
        case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'error': return 'text-red-600 bg-red-50 border-red-200';
        case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
        case 'info': return <Info className="h-5 w-5 text-blue-600" />;
        default: return <Info className="h-5 w-5 text-gray-600" />;
      }
    };

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <Gavel className="h-8 w-8" />
            <h3 className="text-2xl font-bold">Décisions Administratives Ivoiriennes</h3>
          </div>
          <p className="text-cote-ivoire-lighter">
            Décisions automatiques basées sur les critères réglementaires ivoiriens
          </p>
        </div>

        {/* Message de test */}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>TEST :</strong> L'onglet Décisions Admin Ivoiriennes fonctionne ! Vérifiez la console pour les logs.
        </div>

        {/* Résumé des décisions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Favorables</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {adminDecisions.filter(d => d.type === 'success').length}
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Avertissements</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {adminDecisions.filter(d => d.type === 'warning').length}
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Erreurs</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {adminDecisions.filter(d => d.type === 'error').length}
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Informations</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {adminDecisions.filter(d => d.type === 'info').length}
            </p>
          </div>
        </div>

        {/* Décisions par catégorie */}
        <div className="space-y-6">
          {adminDecisions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune décision générée</h4>
              <p className="text-gray-600">
                Les données de simulation ne correspondent à aucun critère de décision administrative configuré.
              </p>
            </div>
          ) : (
            Object.entries(decisionsByCategory).map(([category, decisions]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">{category}</h4>
                <p className="text-sm text-gray-600">{decisions.length} décision{decisions.length > 1 ? 's' : ''}</p>
              </div>
              
              <div className="p-6 space-y-4">
                {decisions.map((decision, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getTypeColor(decision.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(decision.type)}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {decision.icon} {decision.title}
                        </h5>
                        <p className="text-sm text-gray-700">
                          {decision.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
          )}
        </div>

        {/* Note importante */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Note importante</p>
              <p>
                Ces décisions sont générées automatiquement basées sur les critères réglementaires ivoiriens. 
                Consultez toujours les textes officiels et les autorités compétentes pour les décisions finales.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-gray-300 shadow-2xl">
        
        {/* En-tête simplifié */}
        <div className="sticky top-0 bg-white p-6 flex items-center justify-between rounded-t-xl border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-cote-ivoire-primary p-3 rounded-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Résultats du Calcul de Coût de Revient Prévisionnel</h2>
              <p className="text-gray-600">Document: {result.dossier || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={() => downloadReport(result)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors rounded-lg"
            >
              <Download className="h-4 w-4" />
              <span>Rapport Complet</span>
            </button>
            <button
              onClick={() => generatePDFReport(result)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors rounded-lg"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Coût total en en-tête */}
        <div className="bg-white p-6 text-center border-b border-gray-200">
          <div className="text-4xl font-bold text-cote-ivoire-primary mb-2">
            {formatCurrency(result.totalCost)}
          </div>
          <p className="text-gray-800">(Coût de revient prévisionnel total selon formules douanières)</p>
        </div>

        {/* Navigation par onglets */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex space-x-0" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-cote-ivoire-primary text-cote-ivoire-primary bg-orange-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6 bg-white">
          {activeTab === 'admin-decisions' && renderAdminDecisionsTab()}
        </div>

        {/* Pied de page */}
        <div className="bg-white p-4 text-center border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Rapport généré par Kprague - Sysanev</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostResultModal;
