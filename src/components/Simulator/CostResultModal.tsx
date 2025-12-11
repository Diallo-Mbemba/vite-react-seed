import React, { useState, useEffect } from 'react';
import { X, Download, Printer, TrendingUp, Package, Calculator, AlertCircle, CheckCircle, Shield, CreditCard, ArrowRight, Target, Clock, AlertTriangle, BarChart3, FileText, Users, Settings, DollarSign, Lightbulb, Gavel, Info, Calendar, Globe, Zap, Search, Bot } from 'lucide-react';
import { generatePDFReport } from '../../utils/pdfGenerator';
import { downloadReport } from '../../utils/reportGenerator';
import { generateAdminDecisions } from '../../utils/adminDecisions';
import AIAdvisorService from '../../utils/aiAdvisorService';
import { generateAdminDecisions } from '../../utils/adminDecisions';
import AIAdvisorService from '../../utils/aiAdvisorService';
import ChatbotInterface from './ChatbotInterface';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCoeff, setEditingCoeff] = useState<{[key: string]: number}>({});
  const [desiredMargin, setDesiredMargin] = useState(30);
  const [companyCoefficient, setCompanyCoefficient] = useState(1.0);
  const [isChatbotExpanded, setIsChatbotExpanded] = useState(false);
  
  // États pour les décisions administratives
  const [adminDecisions, setAdminDecisions] = useState<any[]>([]);
  const [loadingAdminDecisions, setLoadingAdminDecisions] = useState(false);
  
  // États pour les conseils admin avec OpenAI
  const [aiAdvice, setAiAdvice] = useState<{
    recommendations: any[];
    summary: string;
    riskLevel: 'faible' | 'moyen' | 'eleve';
    confidence: number;
  } | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Charger les décisions administratives
  useEffect(() => {
    const loadAdminDecisions = async () => {
      if (!result) return;
      
      setLoadingAdminDecisions(true);
      try {
        const coefficientRevient = result.fob && result.totalCost ? result.totalCost / result.fob : undefined;
        const fobVoc = result.fob && result.fret ? result.fob + result.fret : result.fob;
        const paysFournisseur = result.selectedActors?.fournisseur ? 
          result.actors?.find((actor: any) => actor?.id === result.selectedActors.fournisseur)?.country : undefined;

        const simulationData = {
          licence: result.rpi,
          fob: result.fob,
          fobVoc: fobVoc,
          assurance: result.assurance,
          caf: result.totalCost,
          coefficientRevient: coefficientRevient,
          rcp: result.rcp,
          rrr: result.rrr,
          modePaiement: result.modePaiement,
          incoterm: result.incoterm,
          route: result.transport?.route,
          paysFournisseur: paysFournisseur
        };

        const decisions = await generateAdminDecisions(simulationData, user?.id);
        setAdminDecisions(Array.isArray(decisions) ? decisions : []);
      } catch (error) {
        console.error('Erreur lors du chargement des décisions:', error);
        setAdminDecisions([]);
      } finally {
        setLoadingAdminDecisions(false);
      }
    };

    loadAdminDecisions();
  }, [result, user]);

  const handleCoeffChange = (articleId: string, newCoeff: number) => {
    setEditingCoeff(prev => ({
      ...prev,
      [articleId]: newCoeff
    }));
  };

  const handleMarginChange = (newMargin: number) => {
    setDesiredMargin(newMargin);
  };

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
    { id: 'pricing', label: 'Analyse Prix', icon: BarChart3 },
    { id: 'admin-advice', label: 'Conseils Admin', icon: Lightbulb },
    { id: 'admin-decisions', label: 'Décisions Admin Ivoiriennes', icon: Gavel },
  ];

  const renderOverviewTab = () => {
    if (!result) return <div>Aucune donnée disponible</div>;

    // Calculs pour les métriques
    const totalCost = result.totalCost || 0;
    const fob = result.fob || 0;
    const fret = result.fret || 0;
    const assurance = result.assurance || 0;
    const rpi = result.rpi || 0;
    const bsc = result.bsc || 0;
    const droitDouane = result.droitDouane || 0;
    const tva = result.tva || 0;
    const fraisFinanciers = result.fraisFinanciers || 0;
    const transitaire = result.transitaire || 0;
    const tsDouane = result.tsDouane || 0;
    const fraisImprevus = result.fraisImprevus || 0;

    // Calcul des frais annexes totaux (sans droitDouane et transitaire qui sont des secteurs séparés)
    const totalFraisAnnexes = rpi + fraisFinanciers + bsc + tsDouane + fraisImprevus + (result.rrr || 0) + (result.rcp || 0) + (result.coc || 0) + (result.creditEnlevement || 0) + (result.avanceFonds || 0);

    // Données pour le graphique en secteurs (selon l'image)
    const costData = [
      { name: 'Marchandises (HT)', value: fob, percentage: totalCost > 0 ? ((fob / totalCost) * 100).toFixed(1) : '0.0', color: 'bg-blue-500', svgColor: '#3B82F6' },
      { name: 'Fret', value: fret, percentage: totalCost > 0 ? ((fret / totalCost) * 100).toFixed(1) : '0.0', color: 'bg-green-500', svgColor: '#10B981' },
      { name: 'Assurance', value: assurance, percentage: totalCost > 0 ? ((assurance / totalCost) * 100).toFixed(1) : '0.0', color: 'bg-orange-500', svgColor: '#F97316' },
      { name: 'Droits et Taxes', value: droitDouane, percentage: totalCost > 0 ? ((droitDouane / totalCost) * 100).toFixed(1) : '0.0', color: 'bg-red-500', svgColor: '#EF4444' },
      { name: 'Prestation Transitaire', value: transitaire, percentage: totalCost > 0 ? ((transitaire / totalCost) * 100).toFixed(1) : '0.0', color: 'bg-purple-500', svgColor: '#8B5CF6' },
      { name: 'Frais Annexes', value: totalFraisAnnexes, percentage: totalCost > 0 ? ((totalFraisAnnexes / totalCost) * 100).toFixed(1) : '0.0', color: 'bg-gray-500', svgColor: '#6B7280' },
    ].filter(item => item.value > 0); // Filtrer les éléments à 0 pour éviter les secteurs vides

    return (
      <div className="space-y-6">
        {/* En-tête avec montant total */}
        <div className="text-center">
          <div className="text-5xl font-bold text-red-600 mb-2">
            {formatCurrency(totalCost)}
          </div>
          <p className="text-gray-700 text-lg">
            (Coût de revient prévisionnel total selon formules douanières)
          </p>
        </div>

        {/* Première ligne : Informations Générales et Acteurs Commerciaux côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Informations Générales (Étape 2) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Informations Générales (Étape 2)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dossier:</span>
                  <span className="font-medium">{result.dossier || 'Import de riz Thaïlandais'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">N° Facture:</span>
                  <span className="font-medium">{result.numeroFacture || 'F-0012-205'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Facture:</span>
                  <span className="font-medium">{result.dateFacture || '2025-09-11'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Transaction:</span>
                  <span className="font-medium">{result.dateTransaction || '2025-08-12'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant Facture:</span>
                  <span className="font-medium">{result.montantFacture || '4000'} {result.devise || 'EUR'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de Change:</span>
                  <span className="font-medium">{result.tauxChange || '655.957'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Incoterms:</span>
                  <span className="font-medium">{result.incoterm || 'DDU'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Régime Douanier:</span>
                  <span className="font-medium">{result.regimeDouanier || 'IM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode de Paiement:</span>
                  <span className="font-medium">{result.modePaiement || 'Virement'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Acteurs Commerciaux (Étape 3) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                <Users className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Acteurs Commerciaux (Étape 3)</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Importateur:</span>
                <span className="font-medium">{result.importateur || 'SARL IMPORT PLUS'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fournisseur:</span>
                <span className="font-medium">{result.fournisseur || 'EUROPEAN SUPPLIERS LTD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transitaire:</span>
                <span className="font-medium">{result.transitaire || 'MAERSK CAMEROON'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Transport et Logistique (Étape 4) - Pleine largeur */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Transport et Logistique (Étape 4)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Mode de Transport:</span>
                <span className="font-medium">{result.modeTransport || 'maritime'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium">{result.route || 'A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type de Conteneur:</span>
                <span className="font-medium">{result.typeConteneur || '20 pieds'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de Conteneurs:</span>
                <span className="font-medium">{result.nombreConteneurs || '1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Poids Total:</span>
                <span className="font-medium">{result.poidsTotal || 'Non spécifié'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Inclure Transitaire:</span>
                <span className="font-medium">{result.inclureTransitaire ? 'Oui' : 'Non'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inclure TVA:</span>
                <span className="font-medium">{result.inclureTVA ? 'Oui' : 'Non'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marchandises Dangereuses:</span>
                <span className="font-medium">{result.marchandisesDangereuses ? 'Oui' : 'Non'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deuxième ligne : Détail des Coûts et Coût total côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 4: Détail des Coûts de Revient Prévisionnels Estimés Globaux */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail des Coûts de Revient Prévisionnels Estimés Globaux</h3>
            
            <div className="space-y-4">
              {/* Coûts de base */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valeur FOB (marchandises en devise locale):</span>
                  <span className="font-medium">{formatCurrency(fob)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de transport:</span>
                  <span className="font-medium">{formatCurrency(fret)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assurance:</span>
                  <span className="font-medium">{formatCurrency(assurance)}</span>
                </div>
              </div>

              {/* Taxes Douanières */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Taxes Douanières:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">DD:</span>
                    <span className="font-medium">{formatCurrency(droitDouane)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">+ TVA:</span>
                    <span className="font-medium">{formatCurrency(tva)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Taxes:</span>
                    <span>{formatCurrency(droitDouane + tva)}</span>
                  </div>
                </div>
              </div>

              {/* Frais Annexes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Frais Annexes:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AR:</span>
                    <span className="font-medium">{formatCurrency(result.ar || 100000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">COC:</span>
                    <span className="font-medium">{formatCurrency(result.coc || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais Financiers:</span>
                    <span className="font-medium">{formatCurrency(fraisFinanciers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais de Transitaire:</span>
                    <span className="font-medium">{formatCurrency(transitaire)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">RPI:</span>
                    <span className="font-medium">{formatCurrency(rpi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BSC (Sécurité Conteneur):</span>
                    <span className="font-medium">{formatCurrency(bsc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crédit d'enlèvement:</span>
                    <span className="font-medium">{formatCurrency(result.creditEnlevement || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avance de fonds:</span>
                    <span className="font-medium">{formatCurrency(result.avanceFonds || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Redevance de Régularisation (RRR):</span>
                    <span className="font-medium">{formatCurrency(result.rrr || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Redevance Contrôle des Prix (RCP):</span>
                    <span className="font-medium">{formatCurrency(result.rcp || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TS Douane:</span>
                    <span className="font-medium">{formatCurrency(tsDouane)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais imprévus (CAF):</span>
                    <span className="font-medium">{formatCurrency(fraisImprevus)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Frais Annexes:</span>
                    <span>{formatCurrency(totalFraisAnnexes + (result.ar || 100000))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Coût de revient prévisionnel total */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coût de revient prévisionnel total:</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-4">
                {formatCurrency(totalCost)}
              </div>
              <div className="text-gray-700">
                <div className="mb-2">Coût de revient prévisionnel unitaire moyen (pour {result.nombreUnites || '15'} unités):</div>
                <div className="text-2xl font-semibold text-green-600">
                  {formatCurrency(totalCost / (result.nombreUnites || 15))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Répartition des Coûts de Revient Prévisionnels - Pleine largeur */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Coûts de Revient Prévisionnels</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Légende */}
            <div className="space-y-3">
              {costData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${item.color}`}></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900 ml-auto">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>

            {/* Graphique en secteurs (camembert) - Exactement comme l'image */}
            <div className="flex items-center justify-center">
              <div className="relative w-80 h-80">
                {/* Graphique en secteurs SVG */}
                <svg width="320" height="320" className="transform -rotate-90">
                  {/* Cercle de fond pour remplacer le blanc */}
                  <circle
                    cx="160"
                    cy="160"
                    r="120"
                    fill="#E5E7EB"
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  {/* Calcul des angles pour chaque secteur */}
                  {(() => {
                    let currentAngle = 0;
                    const radius = 120;
                    const centerX = 160;
                    const centerY = 160;
                    const strokeWidth = 2;
                    
                    // Calculer le total des pourcentages pour détecter s'il y a un espace restant
                    const totalPercentage = costData.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
                    const remainingPercentage = 100 - totalPercentage;
                    
                    const sectors = costData.map((item, index) => {
                      const percentage = parseFloat(item.percentage);
                      const angle = (percentage / 100) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      
                      // Calcul des coordonnées pour l'arc SVG
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;
                      
                      const x1 = centerX + radius * Math.cos(startAngleRad);
                      const y1 = centerY + radius * Math.sin(startAngleRad);
                      const x2 = centerX + radius * Math.cos(endAngleRad);
                      const y2 = centerY + radius * Math.sin(endAngleRad);
                      
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');
                      
                      // Calcul de la position pour le texte (centre du secteur)
                      const midAngle = (startAngle + endAngle) / 2;
                      const midAngleRad = (midAngle * Math.PI) / 180;
                      const textRadius = radius * 0.8; // Position du texte à 80% du rayon
                      const textX = centerX + textRadius * Math.cos(midAngleRad);
                      const textY = centerY + textRadius * Math.sin(midAngleRad);
                      
                      currentAngle += angle;
                      
                      return (
                        <g key={index}>
                          <path
                            d={pathData}
                            fill={item.svgColor}
                            stroke="#FFFFFF"
                            strokeWidth={strokeWidth}
                            className="hover:opacity-90 transition-opacity"
                          />
                          {/* Texte du pourcentage - exactement comme l'image */}
                          {percentage > 1 && (
                            <text
                              x={textX}
                              y={textY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="14"
                              fontWeight="bold"
                              className="transform rotate-90"
                              style={{ 
                                transformOrigin: `${textX}px ${textY}px`,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                              }}
                            >
                              {percentage}%
                            </text>
                          )}
                        </g>
                      );
                    });
                    
                    // Ajouter un secteur pour l'espace restant s'il y en a un (en gris clair)
                    if (remainingPercentage > 0.1) {
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + (remainingPercentage / 100) * 360;
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;
                      const x1 = centerX + radius * Math.cos(startAngleRad);
                      const y1 = centerY + radius * Math.sin(startAngleRad);
                      const x2 = centerX + radius * Math.cos(endAngleRad);
                      const y2 = centerY + radius * Math.sin(endAngleRad);
                      const largeArcFlag = (remainingPercentage / 100) * 360 > 180 ? 1 : 0;
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');
                      sectors.push(
                        <g key="remaining">
                          <path
                            d={pathData}
                            fill="#F3F4F6"
                            stroke="#FFFFFF"
                            strokeWidth={strokeWidth}
                            className="hover:opacity-90 transition-opacity"
                          />
                        </g>
                      );
                    }
                    
                    return sectors;
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductsTab = () => {
    // Utiliser les articles du résultat (result.items) qui contiennent les codes SH corrigés
    const rawArticles = result?.items || [];
    
    // Calculer la valeur FOB totale pour tous les articles
    const valeurFOBTotale = rawArticles.reduce((sum: number, item: any) => {
      return sum + ((item.prixUnitaire || 0) * (item.quantite || 1));
    }, 0) || 1;
    
    // Transformer les articles en format d'affichage avec calculs unitaires
    const articles = rawArticles.map((article: any) => {
      const quantite = article.quantite || 1;
      const poids = article.poids || 0;
      const prixUnitaireFOB = article.prixUnitaire || 0;
      const valeurFOBArticle = (article.prixTotal || (prixUnitaireFOB * quantite));
      
      // Calculer la proportion de cet article par rapport au total FOB
      const proportionFOB = valeurFOBTotale > 0 ? valeurFOBArticle / valeurFOBTotale : 0;
      
      // Répartir les coûts proportionnellement à la valeur FOB
      const fretUnitaire = (result.fret * proportionFOB) / quantite;
      const assuranceUnitaire = (result.assurance * proportionFOB) / quantite;
      
      // Utiliser le code HS corrigé de l'article
      const codeHS = article.codeHS;
      
      // Calculer les droits et taxes unitaires basés sur les colonnes TEC de l'article
      // Les colonnes TEC sont déjà mises à jour dans l'article après correction
      const cafArticle = valeurFOBArticle + (result.fret * proportionFOB) + (result.assurance * proportionFOB);
      
      // Utiliser les taux TEC directement depuis l'article (déjà corrigés)
      const dd = article.dd || 0;
      const rsta = article.rsta || 0;
      const pcs = article.pcs || 0;
      const pua = article.pua || 0;
      const pcc = article.pcc || 0;
      const rrr = article.rrr || 0;
      const rcp = article.rcp || 0;
      const tva = article.tva || 0;
      
      // Calculer les montants unitaires des droits et taxes
      // DD : Utiliser le taux cumulé TEC sur CAF (comme dans SimulatorForm.tsx)
      const tauxCumule = article.cumulAvecTVA || article.cumulSansTVA || dd;
      const droitDouaneUnitaire = (cafArticle * (tauxCumule / 100)) / quantite;
      
      // RSTA, PCS, PUA, PCC : Calculés sur FOB (correct)
      const rstaUnitaire = (valeurFOBArticle * (rsta / 100)) / quantite;
      const pcsUnitaire = (valeurFOBArticle * (pcs / 100)) / quantite;
      const puaUnitaire = (valeurFOBArticle * (pua / 100)) / quantite;
      const pccUnitaire = (valeurFOBArticle * (pcc / 100)) / quantite;
      
      // RRR, RCP, TVA : Calculés sur CAF (correct)
      const rrrUnitaire = (cafArticle * (rrr / 100)) / quantite;
      const rcpUnitaire = (cafArticle * (rcp / 100)) / quantite;
      const tvaUnitaire = (cafArticle * (tva / 100)) / quantite;
      
      // TSB et TAB (non disponibles dans TEC, mettre à 0)
      const tsbUnitaire = 0;
      const tabUnitaire = 0;
      
      return {
        id: article.id,
        codeHS: codeHS, // Code SH corrigé
        designation: article.designation,
        quantite: quantite,
        poidsUnitaire: poids,
        prixUnitaire: prixUnitaireFOB,
        fretUnitaire: fretUnitaire,
        assuranceUnitaire: assuranceUnitaire,
        droitDouaneUnitaire: droitDouaneUnitaire,
        rstaUnitaire: rstaUnitaire,
        pcsUnitaire: pcsUnitaire,
        puaUnitaire: puaUnitaire,
        pccUnitaire: pccUnitaire,
        rrrUnitaire: rrrUnitaire,
        rcpUnitaire: rcpUnitaire,
        tvaUnitaire: tvaUnitaire,
        tsbUnitaire: tsbUnitaire,
        tabUnitaire: tabUnitaire
      };
    });

    // Filtrer les articles selon la recherche
    const filteredArticles = articles.filter((article: any) =>
      article.designation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculer le poids total
    const totalWeight = articles.reduce((sum: number, article: any) => {
      const weight = parseFloat(article.poidsUnitaire || 0) * (article.quantite || 0);
      return sum + weight;
    }, 0);


    return (
      <div className="space-y-6">
        {/* En-tête avec titre et filtre */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Analyse Détaillée par Produit - Coût de Revient Prévisionnel et Prix de Vente (en FCFA)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter par désignation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tableau détaillé des produits */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code SH</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qté</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PU (XOF)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fret/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assur./U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DD/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSTA/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCS/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PUA/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCC/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RRR/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCP/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TSB/U</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAB/U</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PRU (XOF)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Coeff.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-orange-600 uppercase tracking-wider">PV (XOF)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marge %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article: any, index: number) => {
                  const coeff = editingCoeff[article.id] || 1.3;
                  const prixRevient = (article.prixUnitaire || 0) + (article.fretUnitaire || 0) + (article.assuranceUnitaire || 0) + 
                                    (article.droitDouaneUnitaire || 0) + (article.rstaUnitaire || 0) + (article.pcsUnitaire || 0) + 
                                    (article.puaUnitaire || 0) + (article.pccUnitaire || 0) + (article.rrrUnitaire || 0) + 
                                    (article.rcpUnitaire || 0) + (article.tvaUnitaire || 0) + (article.tsbUnitaire || 0) + 
                                    (article.tabUnitaire || 0);
                  const prixVente = prixRevient * coeff;
                  const marge = prixVente > 0 ? ((prixVente - prixRevient) / prixVente) * 100 : 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{article.codeHS}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.quantite}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.poidsUnitaire} kg</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.prixUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.fretUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.assuranceUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.droitDouaneUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.rstaUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.pcsUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.puaUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.pccUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.rrrUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.rcpUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.tvaUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.tsbUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(article.tabUnitaire)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(prixRevient)}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="3"
                          value={coeff}
                          onChange={(e) => handleCoeffChange(article.id, parseFloat(e.target.value) || 1.3)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">{formatCurrency(prixVente)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          marge >= 23 ? 'bg-green-100 text-green-800' :
                          marge >= 16 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {marge.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sections d'information en bas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formules Utilisées */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Formules Utilisées</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">PRU</span> - Prix de Revient Unitaire (Unit Cost Price)
              </div>
              <div>
                <span className="font-medium">PV</span> - Prix de Vente (Selling Price)
              </div>
              <div>
                <span className="font-medium">Coeff</span> - Coefficient multiplicateur (Multiplication Coefficient)
              </div>
              <div>
                <span className="font-medium">Marge %</span> - (PV - PRU) / PV x 100. Modifiez le coefficient directement dans le tableau pour ajuster la marge.
              </div>
              <div>
                <span className="font-medium">Code SH</span> - Code du Système Harmonisé pour la classification des marchandises.
              </div>
            </div>
          </div>

          {/* Guide des Marges Commerciales */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Guide des Marges Commerciales</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span><span className="font-medium">Coefficient 1.3</span> (Marge 23.1%) - Excellent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span><span className="font-medium">Coefficient 1.2</span> (Marge 16.7%) - Acceptable</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span><span className="font-medium">Coefficient 1.15</span> (Marge 13.0%) - Critique</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Astuce:</span> Cliquez sur le coefficient dans le tableau pour le modifier et ajuster la marge en temps réel.
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="flex items-center justify-end text-sm text-gray-500 py-4 border-t border-gray-200">
          <div>Poids Total des Marchandises: {totalWeight.toFixed(2)} kg</div>
        </div>
      </div>
    );
  };

  const renderPricingTab = () => {
    if (!result) return <div>Aucune donnée de prix disponible</div>;

    // Calculs pour l'analyse des prix - utiliser les vraies données du résultat
    const totalCost = result.totalCost || 0;
    const fobValue = result.fob || 0;
    
    // Calculer le nombre total d'unités à partir des articles (somme des quantités)
    const totalUnits = result.items?.reduce((sum: number, item: any) => {
      return sum + (item.quantite || 1);
    }, 0) || 1; // Au moins 1 pour éviter la division par zéro
    
    // Si pas d'articles, utiliser le nombre d'articles comme fallback
    const fallbackUnits = result.items?.length || result.articles?.length || 1;
    const finalTotalUnits = totalUnits > 0 ? totalUnits : fallbackUnits;
    
    const avgUnitCost = totalCost > 0 && finalTotalUnits > 0 ? totalCost / finalTotalUnits : 0;
    
    // Coefficient multiplicateur réel basé sur le ratio Coût de revient / FOB
    const coefficientDouanier = fobValue > 0 ? totalCost / fobValue : 0; // y
    const coefficientHT = coefficientDouanier > 0 ? coefficientDouanier / 1.18 : 0;
    
    const fobUnit = fobValue > 0 && finalTotalUnits > 0 ? fobValue / finalTotalUnits : 0;
    const costHTUnit = fobUnit * coefficientHT;
    
    const marginFactor = 1 + desiredMargin / 100;
    const companyFactor = companyCoefficient > 0 ? companyCoefficient : 1;
    const tvaRate = result.tva ? result.tva / 100 : 0.18;
    const tvaFactor = 1 + tvaRate;
    
    const optimalUnitPrice = costHTUnit * marginFactor * companyFactor * tvaFactor;
    const totalRevenue = optimalUnitPrice * finalTotalUnits;
    const totalProfit = totalRevenue - totalCost;

    // Simulations pour différentes marges
    const marginSimulations = [
      { margin: 15, coeff: 1.18, price: avgUnitCost * 1.18 },
      { margin: 20, coeff: 1.25, price: avgUnitCost * 1.25 },
      { margin: 25, coeff: 1.33, price: avgUnitCost * 1.33 },
      { margin: 30, coeff: 1.43, price: avgUnitCost * 1.43 },
      { margin: 35, coeff: 1.54, price: avgUnitCost * 1.54 },
      { margin: 40, coeff: 1.67, price: avgUnitCost * 1.67 },
      { margin: 45, coeff: 1.82, price: avgUnitCost * 1.82 },
      { margin: 50, coeff: 2.00, price: avgUnitCost * 2.00 }
    ];

    return (
      <div className="space-y-6">
        {/* Section Analyse du Coefficient Multiplicateur & Prix de Vente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauche - Analyse du Coefficient Multiplicateur & Prix de Vente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Analyse du Coefficient Multiplicateur & Prix de Vente
            </h3>
            
            {/* Curseur de marge souhaitée */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marge Multiplicateur souhaité (%)
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={desiredMargin}
                  onChange={(e) => handleMarginChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${(desiredMargin - 10) / 40 * 100}%, #e5e7eb ${(desiredMargin - 10) / 40 * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span className="text-orange-600 font-medium">{desiredMargin}%</span>
                  <span>50%</span>
          </div>
              </div>
        </div>

            {/* Encadré Coefficient & Prix Unitaire */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Ratio Coût de revient / FOB (y):</span>
                  <span className="text-gray-900 font-semibold">{coefficientDouanier.toFixed(4)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">y = Coût de revient prévisionnel total / FOB</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Coefficient multiplicateur HT:</span>
                  <span className="text-orange-600 font-semibold text-lg">{coefficientHT.toFixed(4)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Coefficient HT = y / 1,18</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">FOB unitaire:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(fobUnit)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">FOB unitaire = FOB / Quantité totale</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Coût de revient HT unitaire:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(costHTUnit)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Coût HT = FOB unitaire × Coefficient HT</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coefficient d'entreprise (charges fixes)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.05"
                  value={companyCoefficient}
                  onChange={(e) => setCompanyCoefficient(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Défini par la comptabilité ; représente les charges fixes propres à l'entreprise.
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Prix de vente unitaire (PV):</span>
                <span className="text-orange-600 font-semibold text-lg">{formatCurrency(optimalUnitPrice)}</span>
              </div>
              <p className="text-xs text-gray-500">
                PV = FOB unitaire × Coeff. HT × Coeff. d'entreprise × Marge × TVA
              </p>
              <div className="text-sm text-gray-600 text-center pt-2 border-t border-gray-200">
                Marge {desiredMargin}% | Coeff. entreprise {companyCoefficient.toFixed(2)} | TVA {(tvaRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Droite - Valeurs Totales */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Valeurs Totales</h3>
            
            <div className="space-y-4">
              {/* Coût de Revient Prévisionnel Total */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalCost)}</div>
                  <div className="text-sm text-gray-600 mt-1">Coût de Revient Prévisionnel Total</div>
              </div>
              </div>

              {/* Prix de Vente Total */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalRevenue)}</div>
                  <div className="text-sm text-gray-600 mt-1">Prix de Vente Total</div>
                  <div className="text-sm text-green-600 font-medium mt-2">
                    Bénéfice: {formatCurrency(totalProfit)}
              </div>
            </div>
          </div>

              {/* Recommandations Commerciales */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Recommandations Commerciales</h4>
                <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-blue-800">Position favorable pour la négociation commerciale</span>
              </div>
              <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-blue-800">Volume satisfaisant pour optimiser les coûts de revient prévisionnels</span>
              </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-blue-800">Possibilité d'investir dans le marketing et la promotion</span>
            </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Simulation Rapide - Autres Marges */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Rapide - Autres Marges</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marginSimulations.map((sim, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  sim.margin === desiredMargin 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200 bg-gray-50'
                } hover:border-gray-300 transition-colors cursor-pointer`}
                onClick={() => handleMarginChange(sim.margin)}
              >
                <div className="text-center">
                  <div className={`text-lg font-semibold mb-1 ${
                    sim.margin === desiredMargin ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                    {sim.margin}%
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Coefficient: {sim.coeff}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(sim.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Réinitialiser les conseils quand on change de résultat
  useEffect(() => {
    setAiAdvice(null);
    setIsLoadingAdvice(false);
  }, [result?.dossier, result?.numeroFacture, result?.totalCost]);

  // Génération des conseils IA avec OpenAI - useEffect au niveau du composant
  useEffect(() => {
    if (activeTab === 'admin-advice' && result && !aiAdvice && !isLoadingAdvice) {
      const generateAdvice = async () => {
        setIsLoadingAdvice(true);
        try {
          // Préparer les données de simulation
          const simulationData = {
            dossier: result.dossier,
            numeroFacture: result.numeroFacture,
            dateFacture: result.dateFacture,
            dateTransaction: result.dateTransaction,
            montantFacture: result.montantFacture,
            devise: result.devise,
            tauxChange: result.tauxChange,
            incoterm: result.incoterm,
            regimeDouanier: result.regimeDouanier,
            modePaiement: result.modePaiement,
            importateur: result.selectedActors?.importateur,
            fournisseur: result.selectedActors?.fournisseur,
            transitaire: result.selectedActors?.transitaire,
            paysFournisseur: result.actors?.find(a => a?.id === result.selectedActors?.fournisseur)?.country,
            modeTransport: result.transport?.mode,
            route: result.transport?.route,
            typeConteneur: result.transport?.typeConteneur,
            nombreConteneurs: result.transport?.nombreConteneurs,
            poidsTotal: parseFloat(result.transport?.poidsTotalTonnes || '0') * 1000,
            articles: result.items?.map(item => ({
              codeHS: item.codeHS,
              designation: item.designation,
              quantite: item.quantite,
              poidsUnitaire: item.poids,
              prixUnitaire: item.prixUnitaire,
              fretUnitaire: 0,
              assuranceUnitaire: 0,
              droitDouaneUnitaire: 0,
              rstaUnitaire: 0,
              pcsUnitaire: 0,
              puaUnitaire: 0,
              pccUnitaire: 0,
              rrrUnitaire: 0,
              rcpUnitaire: 0,
              tvaUnitaire: 0,
              tsbUnitaire: 0,
              tabUnitaire: 0,
            })) || [],
            fob: result.fob,
            fret: result.fret,
            assurance: result.assurance,
            droitDouane: result.droitDouane,
            tva: result.tva,
            totalCost: result.totalCost,
            rpi: result.rpi,
            coc: result.coc,
            fraisFinanciers: result.fraisFinanciers,
            transitaire: result.prestationTransitaire,
            bsc: result.bsc,
            tsDouane: result.tsDouane,
            fraisImprevus: result.fraisImprevus,
            creditEnlevement: result.creditEnlevement,
            avanceFonds: result.avanceFonds,
            rrr: result.rrr,
            rcp: result.rcp,
          };

          const advice = await AIAdvisorService.generateAdviceWithOpenAI(simulationData);
          setAiAdvice(advice);
        } catch (error) {
          console.error('Erreur lors de la génération des conseils:', error);
          // Fallback vers la méthode classique
          const fallbackAdvice = AIAdvisorService.generateAdvice(result);
          setAiAdvice(fallbackAdvice);
        } finally {
          setIsLoadingAdvice(false);
        }
      };

      generateAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, result?.dossier, result?.numeroFacture, result?.totalCost]);

  const renderAdminAdviceTab = () => {
    if (!result) return <div>Aucune donnée disponible</div>;

    if (isLoadingAdvice) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Génération des conseils administratifs avec IA...</p>
          </div>
        </div>
      );
    }

    if (!aiAdvice) {
      // Utiliser la méthode classique en fallback immédiat
      const fallbackAdvice = AIAdvisorService.generateAdvice(result);
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">Chargement des conseils IA...</p>
          </div>
        </div>
      );
    }
    
    // Séparation des recommandations par catégorie
    const operationalRecs = aiAdvice.recommendations.filter(r => r.category === 'operationnel');
    const financialRecs = aiAdvice.recommendations.filter(r => r.category === 'financier');
    const immediateActions = aiAdvice.recommendations.filter(r => r.category === 'action_immediate');

    // Fonction pour obtenir l'icône appropriée
    const getIcon = (icon: string) => {
      const iconMap: { [key: string]: React.ReactNode } = {
        '⚙️': <Settings className="h-6 w-6 text-orange-600" />,
        '💰': <DollarSign className="h-6 w-6 text-green-600" />,
        '🚛': <Package className="h-6 w-6 text-blue-600" />,
        '📋': <FileText className="h-6 w-6 text-purple-600" />,
        '✅': <CheckCircle className="h-6 w-6 text-green-600" />,
        '📦': <Package className="h-6 w-6 text-orange-600" />,
        '📊': <BarChart3 className="h-6 w-6 text-blue-600" />,
        '💳': <CreditCard className="h-6 w-6 text-purple-600" />,
        '🏦': <Shield className="h-6 w-6 text-blue-600" />,
        '📈': <TrendingUp className="h-6 w-6 text-green-600" />,
        '⚠️': <AlertTriangle className="h-6 w-6 text-red-600" />,
        '🎯': <Target className="h-6 w-6 text-orange-600" />,
        '⏰': <Clock className="h-6 w-6 text-blue-600" />,
        '📅': <Calendar className="h-6 w-6 text-purple-600" />,
        '🌏': <Globe className="h-6 w-6 text-blue-600" />,
        '🌍': <Globe className="h-6 w-6 text-green-600" />,
        '🌎': <Globe className="h-6 w-6 text-orange-600" />,
        '⚡': <Zap className="h-6 w-6 text-yellow-600" />,
        '🛡️': <Shield className="h-6 w-6 text-blue-600" />,
        '🔍': <Search className="h-6 w-6 text-purple-600" />
      };
      return iconMap[icon] || <Lightbulb className="h-6 w-6 text-orange-600" />;
    };

    // Fonction pour obtenir la couleur de priorité
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'haute': return 'border-red-200 bg-red-50';
        case 'moyenne': return 'border-orange-200 bg-orange-50';
        case 'basse': return 'border-green-200 bg-green-50';
        default: return 'border-gray-200 bg-gray-50';
      }
    };

    return (
      <div className="space-y-6">
        {/* En-tête avec résumé IA */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <Lightbulb className="h-8 w-8" />
            <h3 className="text-2xl font-bold">Conseils Administratifs IA</h3>
          </div>
          <p className="text-orange-100 mb-3">
            Analyse intelligente basée sur vos données de simulation
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                aiAdvice.riskLevel === 'faible' ? 'bg-green-400' :
                aiAdvice.riskLevel === 'moyen' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <span>Risque: {aiAdvice.riskLevel}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Confiance: {aiAdvice.confidence}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{aiAdvice.recommendations.length} recommandations</span>
            </div>
          </div>
        </div>

        {/* Résumé de l'IA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Analyse IA</h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                {aiAdvice.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Décisions Administratives Suggérées */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            <span>Décisions Administratives Suggérées:</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommandations Opérationnelles */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-6 w-6 text-orange-600" />
                <h4 className="text-lg font-semibold text-gray-900">Recommandations Opérationnelles</h4>
            </div>
              <div className="space-y-3">
                {operationalRecs.length > 0 ? operationalRecs.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start space-x-3">
                      {getIcon(rec.icon)}
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{rec.title}</h5>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'haute' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'moyenne' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.impact === 'positif' ? 'bg-green-100 text-green-800' :
                            rec.impact === 'negatif' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rec.impact}
                          </span>
          </div>
            </div>
          </div>
            </div>
                )) : (
                  <p className="text-gray-500 text-sm">Aucune recommandation opérationnelle spécifique.</p>
                )}
          </div>
        </div>

        {/* Recommandations Financières */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="h-6 w-6 text-green-600" />
                <h4 className="text-lg font-semibold text-gray-900">Recommandations Financières</h4>
              </div>
              <div className="space-y-3">
                {financialRecs.length > 0 ? financialRecs.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start space-x-3">
                      {getIcon(rec.icon)}
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{rec.title}</h5>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'haute' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'moyenne' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.impact === 'positif' ? 'bg-green-100 text-green-800' :
                            rec.impact === 'negatif' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rec.impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">Aucune recommandation financière spécifique.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Immédiates Recommandées */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-orange-600" />
            <span>Actions Immédiates Recommandées</span>
          </h4>
          <div className="text-orange-600 text-sm font-medium mb-3">
            Court terme (1-3 mois):
          </div>
          <div className="space-y-2">
            {immediateActions.length > 0 ? immediateActions.map((action, index) => (
              <div key={index} className="flex items-start space-x-3">
                <ArrowRight className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-700 font-medium">{action.title}</span>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
              </div>
            )) : (
              <>
            <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Renégocier les tarifs fournisseur</span>
            </div>
            <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Optimiser la logistique transport</span>
            </div>
            <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-700">Réviser la stratégie de prix</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Analyser la concurrence pour le positionnement</span>
            </div>
              </>
            )}
          </div>
        </div>

        {/* Section Chatbot IA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900">Assistant IA Conversationnel</h4>
                <p className="text-sm text-blue-700">Discutez avec l'IA sur votre simulation</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatbotExpanded(!isChatbotExpanded)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Bot className="h-4 w-4" />
              <span>{isChatbotExpanded ? 'Réduire' : 'Ouvrir'} le Chat</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">💬 Posez vos questions :</h5>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• "Comment réduire mes coûts ?"</div>
                <div>• "Mon incoterm est-il optimal ?"</div>
                <div>• "Quels sont les risques ?"</div>
                <div>• "Comment optimiser le transport ?"</div>
              </div>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">🎯 L'IA peut analyser :</h5>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Coûts de revient prévisionnels</div>
                <div>• Stratégies d'incoterms</div>
                <div>• Optimisation logistique</div>
                <div>• Gestion des risques</div>
              </div>
            </div>
          </div>
          
          {!isChatbotExpanded && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  Cliquez sur "Ouvrir le Chat" pour commencer une conversation avec l'IA basée sur vos données de simulation.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdminDecisionsTab = () => {
    if (loadingAdminDecisions) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des décisions administratives...</p>
          </div>
        </div>
      );
    }

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
              onClick={() => generatePDFReport(result, null)}
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
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'pricing' && renderPricingTab()}
          {activeTab === 'admin-advice' && renderAdminAdviceTab()}
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

      {/* Chatbot Interface - Affiché seulement sur l'onglet Conseils Admin */}
      {activeTab === 'admin-advice' && (
        <ChatbotInterface
          simulationData={result}
          isExpanded={isChatbotExpanded}
          onToggle={() => setIsChatbotExpanded(!isChatbotExpanded)}
        />
      )}
    </div>
  );
};

export default CostResultModal;
