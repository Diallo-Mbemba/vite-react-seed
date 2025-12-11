import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSimulation } from '../../contexts/SimulationContext';
import { hasValidCredits } from '../../utils/paymentUtils';
import { Calculator, Upload, Settings, Users, FileText, Package, AlertCircle, CheckCircle, X, Shield, CreditCard, ArrowRight, ArrowLeft, Clock, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { getActorsByType, ActorData, addActor } from '../../data/actors';
import { CURRENCIES, getCurrencyByCode } from '../../data/currencies';
import { INCOTERMS } from '../../data/incoterms';
import { findTECArticleByCode, searchTECArticlesByCode, searchTECArticlesByDesignation } from '../../data/tec';
import { findVOCProductByCode } from '../../data/voc';
import { getAllTarifPORTArticles } from '../../data/tarifport';
import { TarifPORTProduct } from '../../types/tarifport';
import AddActorModal from './AddActorModal';
import CostResultModal from './CostResultModal';
import ManualInputModal from './ManualInputModal';
import InvoiceVerificationModal from './InvoiceVerificationModal';
import MissingCodesModal from './MissingCodesModal';

import * as XLSX from 'xlsx';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

import { invoiceHistoryService } from '../../services/supabase/invoiceHistoryService';

// Composant modal Détaillé pour les formules de calcul
const DetailedCalculationModal: React.FC<{ 
  title: string; 
  formula: string; 
  explanation: string; 
  details?: Array<{ label: string; value: string; description?: string }>;
  children: React.ReactNode;
}> = ({ title, formula, explanation, details, children }) => (
  <span className="group relative inline-flex items-center cursor-help ml-2 align-middle">
    <span
      tabIndex={0}
      aria-label="Formule Détaillée"
                      className="p-1.5 rounded-full bg-cote-ivoire-primary border-2 border-cote-ivoire-secondary text-white group-hover:text-white group-hover:border-cote-ivoire-secondary focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary transition-colors shadow-lg"
    >
      <Calculator className="h-4 w-4" />
    </span>
    <div className="pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[32rem] max-w-[32rem] bg-white text-gray-800 text-sm leading-relaxed p-6 rounded-xl border border-gray-200 shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-cote-ivoire-primary" />
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-cote-ivoire-primary font-mono text-sm mb-2">Formule :</p>
          <p className="text-gray-900 font-medium">{formula}</p>
        </div>
        
        <div>
          <p className="text-gray-600 mb-3">{explanation}</p>
        </div>
        
        {details && details.length > 0 && (
          <div className="space-y-2">
            <p className="text-cote-ivoire-primary font-medium">Détails du calcul :</p>
            <div className="space-y-1">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-start text-xs">
                  <span className="text-gray-600">{detail.label}:</span>
                  <div className="text-right">
                    <span className="text-gray-900 font-medium">{detail.value}</span>
                    {detail.description && (
                      <p className="text-gray-500 text-xs">{detail.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {children}
      </div>
      <span className="absolute top-full left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-l border-b border-gray-200 rotate-45"></span>
    </div>
  </span>
);

interface Article {
  id: string;
  codeHS: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  poids: number;
  tauxDroit: number;
  montantDroit: number;
  prixTotalImporte?: number; // Prix total importé du fichier Excel pour comparaison
  // Colonnes TEC individuelles
  dd?: number;
  rsta?: number;
  pcs?: number;
  pua?: number;
  pcc?: number;
  rrr?: number;
  rcp?: number;
  tva?: number;
  cumulSansTVA?: number;
  cumulAvecTVA?: number;
}

interface AutoCalculationSettings {
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
}

// Utiliser l'instance Supabase unique depuis supabaseClient.ts

interface SimulatorFormProps {
  simulationId?: string;
}

const SimulatorForm: React.FC<SimulatorFormProps> = ({ simulationId: propSimulationId }) => {
  const { user, deductCredit } = useAuth();
  const { addSimulation, updateSimulation, simulations } = useSimulation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  


  // Vérification immédiate des crédits pour nouvelle simulation
  React.useEffect(() => {
    if (user && !propSimulationId && !id) {
      // C'est une nouvelle simulation
      if (!hasValidCredits(user)) {
        // Afficher une alerte Windows simple
        alert('Vous n\'avez pas de crédits valides disponibles. Veuillez acheter un plan et attendre l\'autorisation par l\'administrateur pour démarrer une nouvelle simulation.');
        navigate('/dashboard');
        return;
      }
    }
  }, [user, propSimulationId, id, navigate]);





  // Si pas d'utilisateur, ne pas afficher le contenu
  if (!user) {
    return null;
  }
  
  const [activeTab, setActiveTab] = useState('auto-calculations');
  const [maxStepReached, setMaxStepReached] = useState(0); // Ajouté
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAddActorModal, setShowAddActorModal] = useState(false);
  const [addActorType, setAddActorType] = useState<'importateur' | 'fournisseur' | 'transitaire'>('importateur');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualInputModal, setShowManualInputModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showInvoiceVerificationModal, setShowInvoiceVerificationModal] = useState(false);
  const [invoiceVerificationData, setInvoiceVerificationData] = useState<any>(null);
  const [showMissingCodesModal, setShowMissingCodesModal] = useState(false);
  const [missingCodesData, setMissingCodesData] = useState<Array<{
    codeHS: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
  }>>([]);
  const [correctionHistory, setCorrectionHistory] = useState<Array<{
    originalCode: string;
    newCode: string;
    designation: string;
    date: Date;
    tariffs?: any;
  }>>([]);
  const [showIncotermWarningModal, setShowIncotermWarningModal] = useState(false);

  // Modal dernier crédit
  const [showLastCreditModal, setShowLastCreditModal] = useState<boolean>(false);
  const [hasShownLastCreditNotice, setHasShownLastCreditNotice] = useState<boolean>(() => {
    return localStorage.getItem('hasShownLastCreditNotice') === 'true';
  });

  const [incotermWarningData, setIncotermWarningData] = useState<{
    incoterm: string;
    willDisableFret: boolean;
    willDisableAssurance: boolean;
  } | null>(null);

  const [isStep6Completed, setIsStep6Completed] = useState(false);
  const [hasSeenWarning, setHasSeenWarning] = useState(() => {
    // Vérifier si l'utilisateur a déjÃ  vu l'avertissement dans cette session
    return localStorage.getItem('hasSeenWarning') === 'true';
  });
  const [simulationStartTime, setSimulationStartTime] = useState<Date | null>(null);
  const [simulationDuration, setSimulationDuration] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [missingCalculations, setMissingCalculations] = useState<Array<{
    key: string;
    label: string;
    description: string;
    unit: string;
  }>>([]);
  
  // Ã‰tats pour TarifPORT
  const [selectedTarifPORTArticle, setSelectedTarifPORTArticle] = useState<string>('');
  const [tarifPORTTP, setTarifPORTTP] = useState<string>('');
  const [tarifPORTCodeRedevance, setTarifPORTCodeRedevance] = useState<string>('');
  const [showTarifPORTSearchModal, setShowTarifPORTSearchModal] = useState(false);
  const [tarifPORTSearchQuery, setTarifPORTSearchQuery] = useState<string>('');
  const [tarifPORTSearchResults, setTarifPORTSearchResults] = useState<TarifPORTProduct[]>([]);
  
  // Ã‰tat pour le modal de validation des dates
  const [showDateValidationModal, setShowDateValidationModal] = useState(false);
  const [dateValidationMessage, setDateValidationMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effet pour démarrer le chronomètre au début de la simulation
  // REMOVED: Le chronomètre démarre maintenant quand on passe de l'étape 1 Ã  l'étape 2

  // Effet pour le chronomètre
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && simulationStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - simulationStartTime.getTime()) / 1000);
        setSimulationDuration(duration);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, simulationStartTime]);

  // Effet pour arrÃªter le chronomètre Ã  l'étape 6
  useEffect(() => {
    if (activeTab === 'costs' && isTimerRunning) {
      setIsTimerRunning(false);
      // Enregistrer la durée finale
      if (simulationStartTime) {
        const now = new Date();
        const finalDuration = Math.floor((now.getTime() - simulationStartTime.getTime()) / 1000);
        setSimulationDuration(finalDuration);
      }
    }
  }, [activeTab, isTimerRunning, simulationStartTime]);





  // Fonction pour formater le temps en format mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Fonction pour formater les valeurs décimales (sans pourcentage)
  const formatDecimal = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(2);
  };

  // Fonction pour formater les nombres avec séparateur de milliers
  const formatNumber = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(cleanNumberValue(value)) || 0 : value;
    return new Intl.NumberFormat('fr-FR').format(numValue);
  };

  // Fonction pour nettoyer la valeur lors de la saisie
  const cleanNumberValue = (value: string) => {
    // Supprimer les espaces
    let cleaned = value.replace(/\s/g, '');
    
    // Remplacer les virgules par des points pour les séparateurs décimaux
    cleaned = cleaned.replace(/,/g, '.');
    
    // Garder seulement les chiffres et points
    cleaned = cleaned.replace(/[^\d.]/g, '');
    
    // S'assurer qu'il n'y a qu'un seul point décimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limiter Ã  3 décimales maximum pour les montants
    if (parts.length === 2 && parts[1].length > 3) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 3);
    }
    
    return cleaned;
  };

  // Ã‰tats pour les calculs automatiques
  const [autoCalculations, setAutoCalculations] = useState<AutoCalculationSettings>({
    fobConversion: true,
    fret: true,
    assurance: true,
    droitDouane: true,
    coc: true,
    rpi: true,
    fraisFinanciers: true,
    transitaire: true,
    bsc: true,
    fraisImprevus: true,
    rrr: true,
    rcp: true,
    creditEnlevement: true,
    avanceFonds: true
  });

  // Ã‰tats pour les critères
  const [criteria, setCriteria] = useState({
    includeTVA: true, // TVA activée par défaut
    isDangerous: false,
    includeTransitaire: true
  });

  // Ã‰tats pour la configuration de l'assurance
  const [includeWarRisk, setIncludeWarRisk] = useState(true); // Risque de Guerre inclus par défaut
  const [ordinaryRiskRateOverride, setOrdinaryRiskRateOverride] = useState<string>(''); // Taux personnalisé du Risque Ordinaire (vide = utiliser settings.ordinaryRiskRate)

  // Ã‰tats pour les données du formulaire
  const [formData, setFormData] = useState({
    // Informations générales
    dossier: '',
    numeroFacture: '',
    dateFacture: '',
    dateTransaction: '2025-09-13',
    montantFacture: '',
    devise: 'EUR',
    tauxChange: 655.957,
    incoterm: 'FOB',
    
    // Informations de transport
    modeTransport: 'maritime',
    route: '',
    typeConteneur: '',
    nombreConteneurs: 1,
    poidsTotalTonnes: '',
    regimeDouanier: '',
    modePaiement: '',
    
    // Coûts
    fob: '',
    fret: '',
    assurance: '',
    droitDouane: '',
    fraisFinanciers: '',
    prestationTransitaire: '',
    rpi: '',
    coc: '',
    bsc: '',
    creditEnlevement: '',
    rrr: '',
    rcp: '',
    tsDouane: settings.tsDouane.toString(),
    avanceFonds: '',
    fraisImprevus: '',
    tva: ''
  });

  // Ã‰tats pour les acteurs
  const [selectedActors, setSelectedActors] = useState({
    importateur: '',
    fournisseur: '',
    transitaire: ''
  });
  const [actorSearchQueries, setActorSearchQueries] = useState<{ importateur: string; fournisseur: string; transitaire: string }>({
    importateur: '',
    fournisseur: '',
    transitaire: ''
  });


  // Ã‰tats pour les articles
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Ã‰tat pour l'ajout d'article
  const [newArticle, setNewArticle] = useState({
    codeHS: '',
    designation: '',
    quantite: 1,
    prixUnitaire: 0,
    poids: 0,
    tauxDroit: 0
  });
  
  // Ã‰tat pour l'édition d'article
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  
  // Ã‰tats pour la recherche de codes SH
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [editingCodeHS, setEditingCodeHS] = useState<string>('');
  
  // Ã‰tats pour les modals de confirmation
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // Configuration des étapes
  const steps = [
    { id: 'auto-calculations', label: 'Configuration', icon: Settings, description: 'Paramétrage des calculs automatiques' },
    { id: 'general', label: 'Informations générales', icon: FileText, description: 'Dossier, facture et devises' },
    { id: 'transport', label: 'Transport', icon: Package, description: 'Mode de transport et logistique' },
    { id: 'actors', label: 'Acteurs', icon: Users, description: 'Importateur, fournisseur et transitaire' },
    { id: 'articles', label: 'Articles', icon: Package, description: 'Import de la facture fournisseur' },
            { id: 'costs', label: 'Coûts de revient prévisionnels', icon: Calculator, description: 'Saisie des Coûts de revient prévisionnels et frais' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === activeTab);
  };

  const getCurrentStep = () => {
    return steps[getCurrentStepIndex()];
  };

  const getNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
    
    console.log('getNextStep:', {
      activeTab,
      currentIndex,
      totalSteps: steps.length,
      nextStep: nextStep?.id || 'null'
    });
    
    return nextStep;
  };

  const getPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  };

  const goToNextStep = () => {
    console.log('goToNextStep called:', { activeTab, canProceed: canProceedToNext() });
    
    const nextStep = getNextStep();
    if (nextStep) {
      const nextIndex = steps.findIndex(step => step.id === nextStep.id);
      console.log('Next step found:', { nextStep: nextStep.id, nextIndex });
      
      // Démarrer le chronomètre et la sauvegarde quand on passe de l'étape 1 Ã  l'étape 2
      if (activeTab === 'auto-calculations' && nextStep.id === 'general') {
        console.log('=== VÃ‰RIFICATION CRÃ‰DITS ===');
        console.log('User:', user);
        console.log('Remaining credits:', user?.remainingCredits);
        console.log('Condition:', user && user.remainingCredits <= 0);
        
        // Vérifier les crédits avant de démarrer la simulation
        if (!hasValidCredits(user)) {
          console.log('CRÉDITS INSUFFISANTS OU NON VALIDES - Affichage alerte Windows');
          alert('Vous n\'avez pas de crédits valides disponibles. Veuillez acheter un plan et attendre l\'autorisation par l\'administrateur pour continuer.');
          navigate('/dashboard');
          return; // Ne pas continuer si pas de crédits valides
        }
        
        console.log('CRÃ‰DITS SUFFISANTS - Démarrage de la simulation');
        
        // Démarrer le chronomètre
        if (!simulationStartTime && !isTimerRunning) {
          setSimulationStartTime(new Date());
          setIsTimerRunning(true);
        }
        
        // Forcer une sauvegarde immédiate seulement si on a au moins un nom de dossier
        if (user && formData.dossier && formData.dossier.trim() !== '') {
          const simulationData = {
            userId: user.id,
            productName: formData.dossier.trim(),
            fob: parseFloat(formData.fob) || 0,
            fret: parseFloat(formData.fret) || 0,
            assurance: parseFloat(formData.assurance) || 0,
            droitDouane: parseFloat(formData.droitDouane) || 0,
            fraisFinanciers: parseFloat(formData.fraisFinanciers) || 0,
            prestationTransitaire: parseFloat(formData.prestationTransitaire) || 0,
            rpi: parseFloat(formData.rpi) || 0,
            coc: parseFloat(formData.coc) || 0,
            bsc: parseFloat(formData.bsc) || 0,
            creditEnlevement: parseFloat(formData.creditEnlevement) || 0,
            rrr: parseFloat(formData.rrr) || 0,
            rcp: parseFloat(formData.rcp) || 0,
            tsDouane: parseFloat(formData.tsDouane) || 0,
            avanceFonds: parseFloat(formData.avanceFonds) || 0,
            tva: parseFloat(formData.tva) || 0,
            totalCost: 0,
            currency: 'XAF',
            status: 'in_progress' as const,
            activeTab: nextStep.id,
            maxStepReached: nextIndex,
            formData,
            autoCalculations,
            criteria,
            selectedActors,
            articles,
            correctionHistory,
          };
          
          addSimulation(simulationData);
          setSimulationId(Date.now().toString());
          console.log('Simulation créée avec succès:', simulationData.productName);
        } else {
          console.log('Pas de création de simulation - dossier vide ou utilisateur non connecté');
        }
        
        // Passer Ã  l'étape suivante
        setActiveTab(nextStep.id);
        setMaxStepReached(prev => (nextIndex > prev ? nextIndex : prev));
        return; // Sortir de la fonction après avoir traité l'étape 1→2
      }
      
      // Vérifier si on va entrer dans l'étape 6 (costs)
      if (nextStep.id === 'costs') {
        console.log('Attempting to enter step 6 (costs)');
        console.log('isResumedSimulation():', isResumedSimulation());
        
        // Pour les simulations reprises, passer directement Ã  l'étape 6
        if (isResumedSimulation()) {
          console.log('Simulation reprise - passage direct Ã  l\'étape 6');
          confirmStep6Entry();
        }
        // Si l'utilisateur a déjÃ  vu l'avertissement, passer directement Ã  l'étape 6
        else if (hasSeenWarning) {
          console.log('Warning already seen, proceeding directly to step 6');
          confirmStep6Entry();
        } else {
          console.log('Showing warning modal for step 6');
          setShowWarningModal(true);
        }
      } else {
        console.log('Moving to next step:', nextStep.id);
        setActiveTab(nextStep.id);
        setMaxStepReached(prev => (nextIndex > prev ? nextIndex : prev));
      }
    }
  };

  const confirmStep6Entry = () => {
    console.log('confirmStep6Entry called - simulation reprise:', isResumedSimulation());
    
    const nextStep = getNextStep();
    if (nextStep) {
      const nextIndex = steps.findIndex(step => step.id === nextStep.id);
      console.log('Moving to step 6:', { nextStep: nextStep.id, nextIndex });
      
      setActiveTab(nextStep.id);
      setMaxStepReached(prev => (nextIndex > prev ? nextIndex : prev));
      setShowWarningModal(false);
      setHasSeenWarning(true);
      localStorage.setItem('hasSeenWarning', 'true');
      
      // Mettre Ã  jour maxStepReached Ã  6 mais garder le statut en cours
      if (simulationId) {
        try {
          console.log('Updating simulation status to step 6');
          updateSimulation(simulationId, {
            maxStepReached: 6,
            status: 'in_progress', // Garder le statut en cours jusqu'au calcul
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('Erreur lors de la mise Ã  jour du statut:', error);
          // Continuer mÃªme si la mise Ã  jour échoue
        }
      } else {
        console.log('No simulationId found, continuing anyway');
      }
      
      console.log('Step 6 entry confirmed successfully');
    } else {
      console.error('No next step found in confirmStep6Entry');
    }
  };

  const goToPreviousStep = () => {
    const previousStep = getPreviousStep();
    if (previousStep) {
      // EmpÃªcher le retour en arrière depuis l'étape 6
      if (activeTab === 'costs') {
        return; // Ne rien faire si on est Ã  l'étape 6
      }
      setActiveTab(previousStep.id);
    }
  };

  // Fonction pour détecter si c'est une simulation reprise
  const isResumedSimulation = (): boolean => {
    const hasSimulationId = !!(propSimulationId || id || simulationId);
    const hasExistingData = !!(formData.dossier && formData.dossier !== '');
    const hasMaxStepReached = maxStepReached > 0;
    const isResumed = hasSimulationId || hasExistingData || hasMaxStepReached;
    
    console.log('isResumedSimulation check:', { 
      hasSimulationId, 
      hasExistingData, 
      hasMaxStepReached,
      maxStepReached,
      dossier: formData.dossier,
      isResumed
    });
    return isResumed;
  };

  // Validation des étapes
  const validateStep = (stepId: string): boolean => {
    console.log('=== VALIDATION Étape ===', stepId);
    
    switch (stepId) {
      case 'auto-calculations':
        console.log('Étape auto-calculations: toujours valide');
        return true; // Toujours valide
      case 'general':
        const generalValid = !!(formData.dossier && formData.numeroFacture && formData.dateFacture && formData.dateTransaction);
        
        // Validation supplémentaire des dates
        let datesValid = true;
        if (formData.dateFacture && formData.dateTransaction) {
          const factureDate = new Date(formData.dateFacture);
          const transactionDate = new Date(formData.dateTransaction);
          datesValid = factureDate <= transactionDate;
        }
        
        const finalGeneralValid = generalValid && datesValid;
        
        console.log('Étape general validation:', {
          dossier: !!formData.dossier,
          numeroFacture: !!formData.numeroFacture,
          dateFacture: !!formData.dateFacture,
          dateTransaction: !!formData.dateTransaction,
          datesValid,
          isValid: finalGeneralValid
        });
        return finalGeneralValid;
      case 'transport':
        // L'étape transport est valide si tous les champs requis sont remplis
        const hasAllTransportFields = !!(formData.modeTransport && formData.route && formData.regimeDouanier && formData.modePaiement && formData.typeConteneur && formData.poidsTotalTonnes);
        console.log('Étape transport validation:', {
          modeTransport: !!formData.modeTransport,
          route: !!formData.route,
          regimeDouanier: !!formData.regimeDouanier,
          modePaiement: !!formData.modePaiement,
          typeConteneur: !!formData.typeConteneur,
          poidsTotalTonnes: !!formData.poidsTotalTonnes,
          isValid: hasAllTransportFields
        });
        return hasAllTransportFields;
      case 'actors':
        // L'étape acteurs est valide si au moins un acteur est sélectionné
        const actorsValid = !!(selectedActors.importateur || selectedActors.fournisseur || selectedActors.transitaire);
        console.log('Étape actors validation:', {
          importateur: !!selectedActors.importateur,
          fournisseur: !!selectedActors.fournisseur,
          transitaire: !!selectedActors.transitaire,
          isValid: actorsValid
        });
        return actorsValid;
      case 'articles':
        // L'étape articles est valide si :
        // 1. Il y a des articles importés OU
        // 2. C'est une simulation reprise (plus permissif)
        const hasArticles = articles.length > 0;
        
        console.log('Validation étape articles:', {
          hasArticles,
          articlesCount: articles.length,
          montantFacture: formData.montantFacture
        });
        
        // Validation plus permissive : permettre de passer mÃªme sans articles
        // pour les simulations reprises ou pour permettre l'ajout d'articles Ã  l'étape 6
        return true;
      case 'costs':
        // L'étape Coûts de revient prévisionnels est valide si il y a un FOB ou un montant de facture
        // Vérification plus robuste pour les simulations reprises
        const fobValue = !!(formData.fob && formData.fob.trim() !== '' && parseFloat(formData.fob) > 0);
        const montantFactureValue = !!(formData.montantFacture && formData.montantFacture.trim() !== '' && parseFloat(cleanNumberValue(formData.montantFacture)) > 0);
        const costsValid = fobValue || montantFactureValue;
        
        // Pour les simulations reprises, Ãªtre plus permissif
        const isResumed = isResumedSimulation();
        const finalCostsValid = isResumed ? true : costsValid;
        
        console.log('Étape costs validation:', {
          fob: formData.fob,
          fobValue: !!fobValue,
          montantFacture: formData.montantFacture,
          montantFactureValue: !!montantFactureValue,
          isResumed,
          costsValid,
          finalCostsValid
        });
        return finalCostsValid;
              default:
          console.log('Étape inconnue:', stepId);
          return false;
    }
  };

  const isStepValid = (stepId: string): boolean => {
    const isValid = validateStep(stepId);
    
    console.log('isStepValid check:', {
      stepId,
      isValid,
      isResumed: isResumedSimulation()
    });
    
    // Validation stricte : on ne peut avancer que si l'étape est vraiment valide
    return isValid;
  };

  const canProceedToNext = (): boolean => {
    const isValid = isStepValid(activeTab);
    const isResumed = isResumedSimulation();
    
    console.log('canProceedToNext check:', {
      activeTab,
      isValid,
      isResumed,
      articlesCount: articles.length,
      stepValidation: validateStep(activeTab)
    });
    
    // La validation est maintenant gérée directement dans validateStep
    // pour les simulations reprises Ã  l'étape 'costs'
    return isValid;
  };

  // Calcul de la progression globale basé sur l'étape actuelle
  const getGlobalProgress = () => {
    // On ne compte pas l'étape 'auto-calculations' dans la progression
    const realSteps = steps.filter(step => step.id !== 'auto-calculations');
    
    // Obtenir l'index de l'étape actuelle dans les étapes réelles
    const currentStepIndex = realSteps.findIndex(step => step.id === activeTab);
    
    // Si on est Ã  l'étape 6 (costs), la progression est 100%
    if (activeTab === 'costs') {
      return 100;
    }
    
    // Sinon, calculer la progression basée sur l'étape actuelle
    if (currentStepIndex <= 0) return 0;
    if (currentStepIndex >= realSteps.length - 1) return 100;
    return Math.round((currentStepIndex / (realSteps.length - 1)) * 100);
  };

  // Gestion des changements de devise
  const handleCurrencyChange = (newCurrency: string) => {
    const currency = getCurrencyByCode(newCurrency);
    if (currency) {
      setFormData(prev => ({
        ...prev,
        devise: newCurrency,
        tauxChange: currency.exchangeRate
      }));
    }
  };

  // Fonction de validation des dates
  const validateDates = () => {
    const dateFacture = formData.dateFacture;
    const dateTransaction = formData.dateTransaction;
    
    if (dateFacture && dateTransaction) {
      const factureDate = new Date(dateFacture);
      const transactionDate = new Date(dateTransaction);
      
      if (factureDate > transactionDate) {
        setDateValidationMessage(
          `La date de la facture (${dateFacture}) ne peut pas Ãªtre postérieure Ã  la date de la transaction (${dateTransaction}). ` +
          `La date de la facture doit toujours Ãªtre antérieure ou égale Ã  la date de la transaction.`
        );
        setShowDateValidationModal(true);
      }
    }
  };

  // Gestion des changements de formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'devise') {
      handleCurrencyChange(value);
    } else if (name === 'montantFacture') {
      // Pour le montant de la facture, permettre la saisie libre avec virgules
      // Le formatage sera fait lors de la perte de focus (onBlur)
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (name === 'dateFacture' || name === 'dateTransaction') {
      // Mise Ã  jour de la date
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Validation des dates après mise Ã  jour
      setTimeout(() => {
        validateDates();
      }, 100);
    } else {
      const numericKeys = new Set([
        'fob','fret','assurance','droitDouane','fraisFinanciers','prestationTransitaire',
        'rpi','coc','bsc','creditEnlevement','rrr','rcp','tsDouane','avanceFonds','montantFacture','nombreConteneurs'
      ]);
      const decimalKeys = new Set(['poidsTotalTonnes']);
      
      if (numericKeys.has(name)) {
        setFormData(prev => ({
          ...prev,
          [name]: Math.round(Number(value || 0)).toString()
        }));
      } else if (decimalKeys.has(name)) {
        // Pour les champs décimaux, permettre la saisie libre sans formatage automatique
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  // Gestion des calculs automatiques
  const handleAutoCalculationChange = (key: keyof AutoCalculationSettings) => {
    setAutoCalculations(prev => {
      const next = { ...prev, [key]: !prev[key] };

      // Si on désactive un poste auto, vider la valeur correspondante pour forcer la saisie Ã  l'étape 6
      if (prev[key] === true && next[key] === false) {
        setFormData(fd => {
          const cleared = { ...fd } as any;
          switch (key) {
            case 'fret':
              cleared.fret = '';
              break;
            case 'assurance':
              cleared.assurance = '';
              break;
            case 'droitDouane':
              cleared.droitDouane = '';
              break;
            case 'fraisFinanciers':
              cleared.fraisFinanciers = '';
              break;
            case 'transitaire':
              cleared.prestationTransitaire = '';
              break;
            case 'rpi':
              cleared.rpi = '';
              break;
            case 'coc':
              cleared.coc = '';
              break;
            case 'bsc':
              cleared.bsc = '';
              break;
            case 'rrr':
              cleared.rrr = '';
              break;
            case 'rcp':
              cleared.rcp = '';
              break;
            case 'creditEnlevement':
              cleared.creditEnlevement = '';
              break;
            case 'avanceFonds':
              cleared.avanceFonds = '';
              break;
            case 'fraisImprevus':
              cleared.fraisImprevus = '';
              break;
            default:
              break;
          }
          return cleared;
        });
      }

      return next;
    });
  };

  // Gestion des critères
  const handleCriteriaChange = (key: keyof typeof criteria) => {
    setCriteria(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Fonction pour calculer le prix total d'un article
  const calculatePrixTotal = (quantite: number, prixUnitaire: number): number => {
    return quantite * prixUnitaire;
  };

  // Fonction pour ajouter un nouvel article
  const handleAddArticle = () => {
    if (!newArticle.designation.trim()) {
      // Utiliser un toast ou une notification au lieu d'alert
      console.error('La désignation est obligatoire');
      return;
    }
    
    const prixTotal = calculatePrixTotal(newArticle.quantite, newArticle.prixUnitaire);
    
    // Récupérer les données TEC pour le code SH
    const tecArticle = findTECArticleByCode(newArticle.codeHS);
    
    const article: Article = {
      id: Date.now().toString(),
      codeHS: newArticle.codeHS,
      designation: newArticle.designation,
      quantite: newArticle.quantite,
      prixUnitaire: newArticle.prixUnitaire,
      prixTotal: prixTotal,
      poids: newArticle.poids,
      tauxDroit: tecArticle?.cumulAvecTVA || newArticle.tauxDroit,
      montantDroit: 0
    };
    
    setArticles(prev => [...prev, article]);
    
    // Réinitialiser le formulaire
    setNewArticle({
      codeHS: '',
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      poids: 0,
      tauxDroit: 0
    });
  };

  // Fonction pour ouvrir le modal de confirmation de suppression
  const handleDeleteArticle = (articleId: string) => {
    setArticleToDelete(articleId);
    setShowDeleteConfirmModal(true);
  };

  // Fonction pour confirmer la suppression d'un article
  const handleConfirmDeleteArticle = () => {
    if (articleToDelete) {
      setArticles(prev => prev.filter(article => article.id !== articleToDelete));
      setArticleToDelete(null);
    }
    setShowDeleteConfirmModal(false);
  };

  // Fonction pour annuler la suppression d'un article
  const handleCancelDeleteArticle = () => {
    setArticleToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  // Fonction pour modifier un article
  const handleEditArticle = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setEditingArticle(articleId);
      setNewArticle({
        codeHS: article.codeHS,
        designation: article.designation,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        poids: article.poids,
        tauxDroit: article.tauxDroit
      });
    }
  };

  // Fonction pour sauvegarder les modifications d'un article
  const handleSaveEdit = () => {
    if (!editingArticle) return;
    
    const prixTotal = calculatePrixTotal(newArticle.quantite, newArticle.prixUnitaire);
    
    // Récupérer les données TEC pour le nouveau code SH
    const tecArticle = findTECArticleByCode(newArticle.codeHS);
    
    setArticles(prev => prev.map(article => 
      article.id === editingArticle 
        ? {
            ...article,
            codeHS: newArticle.codeHS,
            designation: newArticle.designation,
            quantite: newArticle.quantite,
            prixUnitaire: newArticle.prixUnitaire,
            prixTotal: prixTotal,
            poids: newArticle.poids,
            tauxDroit: tecArticle?.cumulAvecTVA || newArticle.tauxDroit
          }
        : article
    ));
    
    // Réinitialiser
    setEditingArticle(null);
    setNewArticle({
      codeHS: '',
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      poids: 0,
      tauxDroit: 0
    });
  };

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    setEditingArticle(null);
    setNewArticle({
      codeHS: '',
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      poids: 0,
      tauxDroit: 0
    });
  };

  // Fonction pour ouvrir le modal de confirmation de vidage
  const handleClearArticles = () => {
    if (articles.length > 0) {
      setShowClearConfirmModal(true);
    }
  };

  // Fonction pour confirmer le vidage de la table
  const handleConfirmClearArticles = () => {
    setArticles([]);
    // Réinitialiser aussi le formulaire d'ajout
    setNewArticle({
      codeHS: '',
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      poids: 0,
      tauxDroit: 0
    });
    setEditingArticle(null);
    setShowClearConfirmModal(false);
  };

  // Fonction pour annuler le vidage de la table
  const handleCancelClearArticles = () => {
    setShowClearConfirmModal(false);
  };

  // Fonction pour ouvrir le modal de recherche TarifPORT
  const handleTarifPORTSearch = () => {
    setTarifPORTSearchQuery('');
    setTarifPORTSearchResults([]);
    setShowTarifPORTSearchModal(true);
  };

  // Fonction pour rechercher dans les articles TarifPORT
  const handleTarifPORTSearchQuery = (query: string) => {
    setTarifPORTSearchQuery(query);
    
    if (query.trim()) {
      const allArticles = getAllTarifPORTArticles();
      const filteredResults = allArticles.filter(article => 
        article.libelle_produit.toLowerCase().includes(query.toLowerCase()) ||
        article.tp.toLowerCase().includes(query.toLowerCase()) ||
        article.coderedevance.toLowerCase().includes(query.toLowerCase())
      );
      setTarifPORTSearchResults(filteredResults.slice(0, 10)); // Limiter Ã  10 résultats
    } else {
      setTarifPORTSearchResults([]);
    }
  };

  // Fonction pour sélectionner un article TarifPORT
  const handleSelectTarifPORTArticle = (article: TarifPORTProduct) => {
    setSelectedTarifPORTArticle(article.libelle_produit);
    setTarifPORTTP(article.tp);
    setTarifPORTCodeRedevance(article.coderedevance);
    setShowTarifPORTSearchModal(false);
    setTarifPORTSearchQuery('');
    setTarifPORTSearchResults([]);
  };

  // Fonction pour rechercher des codes SH
  const handleSearchCodes = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const codeResults = searchTECArticlesByCode(query);
      const designationResults = searchTECArticlesByDesignation(query);
      const combinedResults = [...codeResults, ...designationResults];
      // Supprimer les doublons basés sur sh10Code
      const uniqueResults = combinedResults.filter((item, index, self) => 
        index === self.findIndex(t => t.sh10Code === item.sh10Code)
      );
      setSearchResults(uniqueResults.slice(0, 10)); // Limiter Ã  10 résultats
    } else {
      setSearchResults([]);
    }
  };

  // Fonction pour ouvrir le modal de recherche de code SH
  const handleEditCodeHS = (codeHS: string) => {
    setEditingCodeHS(codeHS);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchModal(true);
  };

  // Fonction pour sélectionner un code SH
  const handleSelectCodeHS = (newCode: string, designation: string) => {
    // Mettre Ã  jour l'article en cours d'édition
    setNewArticle(prev => ({
      ...prev,
      codeHS: newCode
    }));
    
    // Récupérer l'article TEC complet pour le nouveau code
    const tecArticle = findTECArticleByCode(newCode);
    
    // Debug: afficher les valeurs TEC réelles récupérées
    if (tecArticle) {
      console.log(`✅ Valeurs TEC réelles pour ${newCode}:`, {
        dd: tecArticle.dd,
        rsta: tecArticle.rsta,
        pcs: tecArticle.pcs,
        pua: tecArticle.pua,
        pcc: tecArticle.pcc,
        rrr: tecArticle.rrr,
        rcp: tecArticle.rcp,
        tva: tecArticle.tva,
        cumulSansTVA: tecArticle.cumulSansTVA,
        cumulAvecTVA: tecArticle.cumulAvecTVA
      });
    } else {
      console.log(`⚠️ Aucun article TEC trouvé pour le code: ${newCode}`);
    }
    
    // Mettre à jour l'article en cours d'édition avec toutes les colonnes TEC
    setNewArticle(prev => ({
      ...prev,
      // Charger automatiquement toutes les colonnes TEC
      dd: tecArticle?.dd || 0,
      rsta: tecArticle?.rsta || 0,
      pcs: tecArticle?.pcs || 0,
      pua: tecArticle?.pua || 0,
      pcc: tecArticle?.pcc || 0,
      rrr: tecArticle?.rrr || 0,
      rcp: tecArticle?.rcp || 0,
      tva: tecArticle?.tva || 0,
      cumulSansTVA: tecArticle?.cumulSansTVA || 0,
      cumulAvecTVA: tecArticle?.cumulAvecTVA || 0,
      tauxDroit: tecArticle?.cumulAvecTVA || 0
    }));
    
    // Si on est en mode édition, mettre Ã  jour l'article existant
    if (editingArticle) {
      setArticles(prev => prev.map(article => 
        article.id === editingArticle 
          ? {
              ...article,
              codeHS: newCode,
              // Charger automatiquement toutes les colonnes TEC
              dd: tecArticle?.dd || 0,
              rsta: tecArticle?.rsta || 0,
              pcs: tecArticle?.pcs || 0,
              pua: tecArticle?.pua || 0,
              pcc: tecArticle?.pcc || 0,
              rrr: tecArticle?.rrr || 0,
              rcp: tecArticle?.rcp || 0,
              tva: tecArticle?.tva || 0,
              cumulSansTVA: tecArticle?.cumulSansTVA || 0,
              cumulAvecTVA: tecArticle?.cumulAvecTVA || 0,
              tauxDroit: tecArticle?.cumulAvecTVA || 0
            }
          : article
      ));
    }
    
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Gestion de l'upload de fichier Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Lecture réelle du fichier avec xlsx
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        if (!data) {
          setIsUploading(false);
          return;
        }
        let workbook;
        if (typeof data === 'string') {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Normalisation robuste des en-têtes + parsing numérique tolérant (virgules, espaces, séparateurs)
        const normalizeKey = (key: string) =>
          key
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // retire les accents
            .replace(/[^a-z0-9]+/g, ''); // retire espaces, points, parenthèses

        const parseNumber = (value: any): number => {
          if (typeof value === 'number') return isNaN(value) ? 0 : value;
          if (typeof value !== 'string') return 0;
          const sanitized = value
            .replace(/\s+/g, '') // espaces
            .replace(/\.(?=\d{3}(\D|$))/g, '') // séparateur milliers '.'
            .replace(/,/g, '.') // virgule décimale
            .replace(/[^0-9.\-]/g, ''); // élimine tout autre caractère
          const num = Number(sanitized);
          return isNaN(num) ? 0 : Math.round(num);
        };

        const importedArticles: Article[] = json.map((row, idx) => {
          const normalizedRow: Record<string, any> = {};
          Object.entries(row).forEach(([k, v]) => {
            normalizedRow[normalizeKey(k)] = v;
          });

          const get = (...keys: string[]) => {
            for (const k of keys) {
              const n = normalizedRow[k];
              if (n !== undefined && n !== null && n !== '') return n;
            }
            return '';
          };

        const quantite = parseNumber(get('qte', 'quantite', 'quantite'));
        const prixUnitaire = parseNumber(get('prixunit', 'prixunitaire', 'pu', 'prixunite'));
        const prixTotalImporte = parseNumber(get('prixtotal', 'montanttotal', 'montantttc'));
        
        // Calculer le prix total basé sur quantité * prix unitaire
        const prixTotalCalcule = quantite * prixUnitaire;
        
        // Récupérer l'article TEC pour charger automatiquement les colonnes
        const codeHS = get('codesh', 'codehs', 'codehs');
        const tecArticle = findTECArticleByCode(codeHS);
        
        // Debug: afficher les valeurs TEC réelles récupérées
        if (tecArticle && codeHS) {
          console.log(`✅ Valeurs TEC réelles pour ${codeHS}:`, {
            dd: tecArticle.dd,
            rsta: tecArticle.rsta,
            pcs: tecArticle.pcs,
            pua: tecArticle.pua,
            pcc: tecArticle.pcc,
            rrr: tecArticle.rrr,
            rcp: tecArticle.rcp,
            tva: tecArticle.tva,
            cumulSansTVA: tecArticle.cumulSansTVA,
            cumulAvecTVA: tecArticle.cumulAvecTVA
          });
        } else if (codeHS) {
          console.log(`⚠️ Aucun article TEC trouvé pour le code: ${codeHS}`);
        }
        
        return ({
            id: (get('id') || (idx + 1).toString()),
            codeHS: codeHS,
            designation: get('designation', 'libelle', 'designations'),
            quantite: quantite,
            prixUnitaire: prixUnitaire,
            prixTotal: prixTotalCalcule, // Utiliser le prix calculé plutôt que celui importé
            poids: parseNumber(get('poidskg', 'poids')),
            tauxDroit: parseNumber(get('tauxdroit')) || tecArticle?.cumulAvecTVA || 0,
            montantDroit: parseNumber(get('montantdroit')),
            prixTotalImporte: prixTotalImporte, // Garder le prix total importé pour comparaison
            // Charger automatiquement toutes les colonnes TEC
            dd: tecArticle?.dd || 0,
            rsta: tecArticle?.rsta || 0,
            pcs: tecArticle?.pcs || 0,
            pua: tecArticle?.pua || 0,
            pcc: tecArticle?.pcc || 0,
            rrr: tecArticle?.rrr || 0,
            rcp: tecArticle?.rcp || 0,
            tva: tecArticle?.tva || 0,
            cumulSansTVA: tecArticle?.cumulSansTVA || 0,
            cumulAvecTVA: tecArticle?.cumulAvecTVA || 0,
          });
        });
        setArticles(importedArticles);
        
        // Calculer le montant total de la facture (somme des quantités * prix unitaires)
        const totalFacture = importedArticles.reduce((sum, article) => sum + (article.quantite * article.prixUnitaire), 0);
        const totalFactureFCFA = totalFacture * (parseFloat(formData.tauxChange.toString()) || 1);
        const poidsTotal = importedArticles.reduce((sum, article) => sum + article.poids, 0);
        
        // Vérifier les incohérences avec les données saisies
        const userMontantFacture = parseFloat(cleanNumberValue(formData.montantFacture)) || 0;
        const userDevise = formData.devise;
        const userTauxChange = Number(formData.tauxChange) || 655.957;
        const userPoidsTotalTonnes = parseFloat(formData.poidsTotalTonnes) || 0;
        
        // Vérifier les incohérences dans les prix totaux des articles
        const articlesWithDiscrepancies = importedArticles.filter(article => {
          if (article.prixTotalImporte) {
            const difference = Math.abs(article.prixTotal - article.prixTotalImporte);
            return difference > 0.01; // Tolérance de 0.01
          }
          return false;
        });
        
        const difference = Math.abs(totalFacture - userMontantFacture);
        const percentage = userMontantFacture > 0 ? (difference / userMontantFacture) * 100 : 0;
        
        // Vérification du poids - comparaison en kg
        const userPoidsKg = parseFloat(userPoidsTotalTonnes.toString()) * 1000; // Convertir tonnes en kg
        const poidsDifference = Math.abs(poidsTotal - userPoidsKg);
        const poidsPercentage = userPoidsKg > 0 ? (poidsDifference / userPoidsKg) * 100 : 0;
        
        // Vérification du montant - comparaison en FCFA
        const userMontantFCFA = userMontantFacture * userTauxChange; // Montant saisi converti en FCFA
        const montantFCFADifference = Math.abs(totalFactureFCFA - userMontantFCFA);
        const montantFCFAPercentage = userMontantFCFA > 0 ? (montantFCFADifference / userMontantFCFA) * 100 : 0;
        
        const verificationData = {
          userData: {
            montantFacture: userMontantFacture,
            devise: userDevise,
            tauxChange: userTauxChange,
            poidsTotalTonnes: userPoidsTotalTonnes
          },
          calculatedData: {
            montantTotal: totalFacture,
            montantFCFA: totalFactureFCFA,
            nombreArticles: importedArticles.length,
            poidsTotal: poidsTotal
          },
          discrepancies: {
            montantFacture: {
              user: userMontantFacture,
              calculated: totalFacture,
              difference: totalFacture - userMontantFacture,
              percentage: percentage
            },
            montantFCFA: {
              user: userMontantFCFA,
              calculated: totalFactureFCFA,
              difference: totalFactureFCFA - userMontantFCFA,
              percentage: montantFCFAPercentage
            },
            devise: {
              user: userDevise,
              calculated: userDevise, // MÃªme devise pour l'instant
              match: true
            },
            poids: userPoidsTotalTonnes > 0 ? {
              user: userPoidsTotalTonnes,
              calculated: poidsTotal,
              userInKg: userPoidsKg,
              difference: poidsTotal - userPoidsKg,
              percentage: poidsPercentage
            } : undefined
          }
        };
        
        // Vérifier les codes SH manquants dans la table TEC
        const missingCodes = importedArticles.filter(article => {
          // Convertir le code HS en string s'il n'en est pas une
          const codeHSString = String(article.codeHS);
          
          const tecArticle = findTECArticleByCode(codeHSString);
          // Debug: afficher les codes qui ne sont pas trouvés
          if (!tecArticle) {
            console.log(`Code SH manquant dans TEC: ${codeHSString} - ${article.designation}`);
          } else {
            console.log(`Code SH trouvé dans TEC: ${codeHSString} - ${article.designation}`);
          }
          return !tecArticle;
        });

        // Afficher le modal de vérification si il y a des incohérences sur le montant (en FCFA) OU le poids (en kg)
        const shouldShowVerification = montantFCFAPercentage > 0.1 || (userPoidsTotalTonnes > 0 && poidsPercentage > 0.1);
        
        if (shouldShowVerification) {
          setInvoiceVerificationData(verificationData);
          setShowInvoiceVerificationModal(true);
        } else {
          // Pas d'incohérence, mettre Ã  jour directement
          setFormData(prev => ({
            ...prev,
            montantFacture: Math.round(totalFacture).toString()
          }));
          
          // Vérifier s'il y a des codes SH manquants
          if (missingCodes.length > 0) {
            setMissingCodesData(missingCodes);
            setShowMissingCodesModal(true);
          }
        }
        
        setIsUploading(false);
        setUploadProgress(100);
      };
      // Lecture du fichier en binaire ou arraybuffer selon le type
      if (file.type === 'text/csv') {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
      // Progression simulée
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 150);
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      alert('Erreur lors de l\'import du fichier. Vérifiez le format.');
    }
  };

  // Ajout d'un nouvel acteur
  const handleActorAdded = (newActor: ActorData) => {
    addActor(newActor);
    setSelectedActors(prev => ({
      ...prev,
      [newActor.type]: newActor.id
    }));
    setShowAddActorModal(false);
  };

  // Vérification des calculs manquants
  const checkMissingCalculations = () => {
    const missing: Array<{
      key: string;
      label: string;
      description: string;
      unit: string;
    }> = [];

    const calculationMappings = [
      {
        key: 'fret',
        autoKey: 'fret',
        label: 'Fret maritime/aérien',
        description: 'Coût du transport de la marchandise depuis le port/aéroport d\'origine',
        unit: 'FCFA'
      },
      {
        key: 'assurance',
        autoKey: 'assurance',
        label: 'Assurance transport',
        description: 'Assurance couvrant les risques pendant le transport',
        unit: 'FCFA'
      },
      {
        key: 'droitDouane',
        autoKey: 'droitDouane',
        label: 'Droits de douane',
        description: 'Taxes douanières (DD + RSTA + TVA)',
        unit: 'FCFA'
      },
      {
        key: 'fraisFinanciers',
        autoKey: 'fraisFinanciers',
        label: 'Frais financiers',
        description: 'Frais bancaires selon le mode de paiement (virement, remise, Crédit documentaire)',
        unit: 'FCFA'
      },
      {
        key: 'prestationTransitaire',
        autoKey: 'transitaire',
        label: 'Prestation transitaire',
        description: 'Honoraires du transitaire pour les formalités',
        unit: 'FCFA'
      },
      {
        key: 'rpi',
        autoKey: 'rpi',
        label: 'RPI',
        description: 'Redevance pour Prestations Informatiques',
        unit: 'FCFA'
      },
      {
        key: 'coc',
        autoKey: 'coc',
        label: 'COC',
        description: 'Certificat de Conformité',
        unit: 'FCFA'
      },
      {
        key: 'bsc',
        autoKey: 'bsc',
        label: 'BSC',
        description: 'Bordereau de Suivi des Cargaisons',
        unit: 'FCFA'
      },
      {
        key: 'rrr',
        autoKey: 'rrr',
        label: 'RRR',
        description: 'Redevance de Régularisation',
        unit: 'FCFA'
      },
      {
        key: 'rcp',
        autoKey: 'rcp',
        label: 'RCP',
        description: 'Redevance pour le Contrôle des Prix',
        unit: 'FCFA'
      },
      {
        key: 'fraisImprevus',
        autoKey: 'fraisImprevus',
        label: 'Frais imprévus (CAF)',
        description: 'Provision sur la valeur CAF (taux paramétrable)',
        unit: 'FCFA'
      }
    ];

    calculationMappings.forEach(mapping => {
      // Vérifier si le calcul automatique est désactivé
      const isAutoDisabled = !autoCalculations[mapping.autoKey as keyof AutoCalculationSettings];
      
      // Vérifier si la valeur est manquante ou vide
      const currentValue = formData[mapping.key as keyof typeof formData];
      const isValueMissing = !currentValue || currentValue === '' || currentValue === '0' || Number(currentValue) === 0;
      
      // Si le calcul automatique est désactivé ET que la valeur est manquante, ajouter Ã  la liste
      if (isAutoDisabled && isValueMissing) {
        missing.push({
          key: mapping.key,
          label: mapping.label,
          description: mapping.description,
          unit: mapping.unit
        });
      }
    });

    console.log('Calculs manquants détectés:', missing);
    return missing;
  };

  // Gestion de la saisie manuelle
  // Gestion du modal de vérification de facture
  const handleInvoiceVerificationConfirm = () => {
    if (invoiceVerificationData) {
      // Mettre Ã  jour avec les données calculées
      setFormData(prev => ({
        ...prev,
        montantFacture: Math.round(invoiceVerificationData.calculatedData.montantTotal).toString()
      }));
    }
    setShowInvoiceVerificationModal(false);
    setInvoiceVerificationData(null);
    
    // Vérifier les codes SH manquants après la confirmation
    if (articles.length > 0) {
      const missingCodes = articles.filter(article => {
        // Convertir le code HS en string s'il n'en est pas une
        const codeHSString = String(article.codeHS);
        
        const tecArticle = findTECArticleByCode(codeHSString);
        // Debug: afficher les codes qui ne sont pas trouvés
        if (!tecArticle) {
          console.log(`Code SH manquant dans TEC: ${codeHSString} - ${article.designation}`);
        } else {
          console.log(`Code SH trouvé dans TEC: ${codeHSString} - ${article.designation}`);
        }
        return !tecArticle;
      });
      
      if (missingCodes.length > 0) {
        setMissingCodesData(missingCodes);
        setShowMissingCodesModal(true);
      }
    }
  };

  const handleInvoiceVerificationCancel = () => {
    setShowInvoiceVerificationModal(false);
    setInvoiceVerificationData(null);
  };

  const handleInvoiceVerificationGoBack = () => {
    setShowInvoiceVerificationModal(false);
    setInvoiceVerificationData(null);
    // Revenir Ã  l'étape précédente (transport)
    setActiveTab('transport');
  };

  // Gestion du modal des codes SH manquants
  const handleMissingCodesConfirm = async (correctedCodes: Array<{
    originalCode: string;
    newCode: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
  }>) => {
    // Mettre à jour les articles avec les codes corrigés et toutes les colonnes TEC
    setArticles(prevArticles => 
      prevArticles.map(article => {
        const corrected = correctedCodes.find(c => c.originalCode === article.codeHS);
        if (corrected) {
          // Récupérer l'article TEC complet avec le nouveau code
          const tecArticle = findTECArticleByCode(corrected.newCode);
          
          if (tecArticle) {
            // Mettre à jour toutes les colonnes TEC avec les valeurs de l'article TEC trouvé
            return {
              ...article,
              codeHS: corrected.newCode,
              // Mettre à jour toutes les colonnes TEC
              dd: tecArticle.dd || 0,
              rsta: tecArticle.rsta || 0,
              pcs: tecArticle.pcs || 0,
              pua: tecArticle.pua || 0,
              pcc: tecArticle.pcc || 0,
              rrr: tecArticle.rrr || 0,
              rcp: tecArticle.rcp || 0,
              tva: tecArticle.tva || 0,
              cumulSansTVA: tecArticle.cumulSansTVA || 0,
              cumulAvecTVA: tecArticle.cumulAvecTVA || 0,
              // Mettre à jour le taux de droit avec le cumul avec TVA
              tauxDroit: tecArticle.cumulAvecTVA || 0
            };
          } else {
            // Si l'article TEC n'est pas trouvé, mettre seulement à jour le code
            return {
              ...article,
              codeHS: corrected.newCode
            };
          }
        }
        return article;
      })
    );
    
    // Sauvegarder l'historique des corrections
    const newCorrections = correctedCodes.map(correction => ({
      ...correction,
      date: new Date()
    }));
    
    // Mettre Ã  jour l'historique des corrections
    setCorrectionHistory(prev => [...prev, ...newCorrections]);
    
    // Sauvegarder dans Supabase pour l'historique
    if (user) {
      try {
        const invoiceData = {
          invoiceNumber: formData.numeroFacture || `INV-${Date.now()}`,
          invoiceData: {
            id: `invoice_${Date.now()}`,
            numeroFacture: formData.numeroFacture,
            dateFacture: formData.dateFacture,
            montantTotal: parseFloat(cleanNumberValue(formData.montantFacture)) || 0,
            devise: formData.devise,
            nombreArticles: articles.length,
            corrections: newCorrections,
            articles: articles,
            createdAt: new Date()
          },
          simulationId: simulationId || undefined,
        };
        
        await invoiceHistoryService.createInvoiceHistory(user.id, invoiceData);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique:', error);
      }
    }
    
    setShowMissingCodesModal(false);
    setMissingCodesData([]);
  };

  const handleMissingCodesCancel = () => {
    setShowMissingCodesModal(false);
    setMissingCodesData([]);
  };

  const [pendingCalculation, setPendingCalculation] = useState(false);

  const handleManualInputSave = (values: Record<string, number>) => {
    console.log('Valeurs saisies manuellement:', values);
    
    // Mettre Ã  jour les valeurs du formulaire
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        ...Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, value.toString()])
        )
      };
      
      // S'assurer que les éléments désactivés ont la valeur 0
      const calculationMappings = [
        { key: 'fret', autoKey: 'fret' },
        { key: 'assurance', autoKey: 'assurance' },
        { key: 'droitDouane', autoKey: 'droitDouane' },
        { key: 'fraisFinanciers', autoKey: 'fraisFinanciers' },
        { key: 'prestationTransitaire', autoKey: 'transitaire' },
        { key: 'rpi', autoKey: 'rpi' },
        { key: 'coc', autoKey: 'coc' },
        { key: 'bsc', autoKey: 'bsc' },
        { key: 'rrr', autoKey: 'rrr' },
        { key: 'rcp', autoKey: 'rcp' },
        { key: 'fraisImprevus', autoKey: 'fraisImprevus' }
      ];
      
      calculationMappings.forEach(mapping => {
        if (!autoCalculations[mapping.autoKey as keyof AutoCalculationSettings]) {
          if (!values[mapping.key] && !(updatedFormData as any)[mapping.key]) {
            (updatedFormData as any)[mapping.key] = '0';
          }
        }
      });
      
      console.log('FormData mis Ã  jour avec valeurs désactivées:', updatedFormData);
      return updatedFormData;
    });
    
    setShowManualInputModal(false);
    
    // Marquer qu'un calcul est en attente
    setPendingCalculation(true);
  };



  // Pour suivre la simulation en cours
  const [simulationId, setSimulationId] = useState<string | null>(propSimulationId || id || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Effet pour réinitialiser hasSeenWarning pour chaque nouvelle simulation
  useEffect(() => {
    // Réinitialiser hasSeenWarning pour chaque nouvelle simulation
    setHasSeenWarning(false);
    localStorage.removeItem('hasSeenWarning');
  }, [simulationId]);

  // REMOVED: Vérification des crédits maintenant faite au début du composant

  // Effet pour déclencher le calcul après mise Ã  jour de formData
  useEffect(() => {
    if (pendingCalculation) {
      console.log('Déclenchement du calcul après mise Ã  jour de formData');
      performCalculation();
      setPendingCalculation(false);
    }
  }, [formData, pendingCalculation]);

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    if (!user) return;
    
    // Ne pas sauvegarder si on est encore Ã  l'étape 1 (auto-calculations)
    // et qu'il n'y a pas encore de simulationId (nouvelle simulation)
    if (activeTab === 'auto-calculations' && !simulationId) {
      return;
    }
    
    // Ne pas auto-sauvegarder pendant le calcul ou quand le résultat est affiché
    if (loading || showResult) {
      return;
    }

    setAutoSaveStatus('saving');
    const timeoutId = setTimeout(() => {
      // Préserver un statut 'completed' existant
      let preservedStatus: 'in_progress' | 'completed' = 'in_progress';
      if (simulationId) {
        const existing = simulations.find(s => s.id === simulationId);
        if (existing && existing.status === 'completed') {
          preservedStatus = 'completed';
        }
      }

      const simulationData = {
        userId: user.id,
        productName: formData.dossier || 'Simulation sans nom',
        fob: parseFloat(formData.fob) || 0,
        fret: parseFloat(formData.fret) || 0,
        assurance: parseFloat(formData.assurance) || 0,
        droitDouane: parseFloat(formData.droitDouane) || 0,
        fraisFinanciers: parseFloat(formData.fraisFinanciers) || 0,
        prestationTransitaire: parseFloat(formData.prestationTransitaire) || 0,
        rpi: parseFloat(formData.rpi) || 0,
        coc: parseFloat(formData.coc) || 0,
        bsc: parseFloat(formData.bsc) || 0,
        creditEnlevement: parseFloat(formData.creditEnlevement) || 0,
        rrr: parseFloat(formData.rrr) || 0,
        rcp: parseFloat(formData.rcp) || 0,
        tsDouane: parseFloat(formData.tsDouane) || 0,
        totalCost: 0,
        currency: 'XAF',
        status: preservedStatus,
        // Données pour la reprise exacte
        activeTab,
        maxStepReached,
        formData,
        autoCalculations,
        criteria,
        selectedActors,
        articles,
        correctionHistory,
        includeWarRisk,
        ordinaryRiskRateOverride,
      } as const;
      
      if (!simulationId) {
        // Création d'une nouvelle simulation en cours seulement si on a un nom de dossier
        if (formData.dossier && formData.dossier.trim() !== '') {
          addSimulation(simulationData);
          // On suppose que l'id est basé sur Date.now().toString()
          setSimulationId(Date.now().toString());
          console.log('Simulation créée par sauvegarde automatique:', simulationData.productName);
        } else {
          console.log('Pas de création de simulation par sauvegarde automatique - dossier vide');
        }
      } else {
        // Mise Ã  jour de la simulation existante (sans rétrograder le statut)
        console.log('Sauvegarde automatique - étape:', simulationData.activeTab, 'maxStep:', simulationData.maxStepReached, 'status:', simulationData.status);
        updateSimulation(simulationId, simulationData);
      }
      
      setAutoSaveStatus('saved');
      // Masquer le message après 2 secondes
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 2000); // Sauvegarde automatique après 2 secondes d'inactivité
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, autoCalculations, criteria, selectedActors, articles, activeTab, maxStepReached, loading, showResult, simulations, includeWarRisk, ordinaryRiskRateOverride]);

  // Pré-remplissage si simulationId fourni
  useEffect(() => {
    const simId = propSimulationId || id;
    if (simId && simulations.length > 0) {
      const sim = simulations.find(s => s.id === simId);
      if (sim) {
        console.log('Restauration de la simulation:', sim.id, 'étape:', sim.activeTab, 'maxStep:', sim.maxStepReached);
        
        // Restaurer l'étape actuelle
        if (sim.activeTab) {
          setActiveTab(sim.activeTab);
        }
        if (sim.maxStepReached !== undefined) {
          setMaxStepReached(sim.maxStepReached);
        }
        
        // Restaurer les données du formulaire
        if (sim.formData) {
          // S'assurer que tsDouane est présent dans les données restaurées
          const restoredFormData = {
            ...sim.formData,
            tsDouane: (sim.formData as any).tsDouane || '20000',
            poidsTotalTonnes: (sim.formData as any).poidsTotalTonnes || '',
            avanceFonds: (sim.formData as any).avanceFonds || '',
            fraisImprevus: (sim.formData as any).fraisImprevus || ''
          };
          setFormData(restoredFormData);
        }
        
        // Restaurer les calculs automatiques
        if (sim.autoCalculations) {
          const restoredAutoCalculations = {
            ...sim.autoCalculations,
            creditEnlevement: (sim.autoCalculations as any).creditEnlevement ?? true,
            avanceFonds: (sim.autoCalculations as any).avanceFonds ?? true
          };
          setAutoCalculations(restoredAutoCalculations);
        }
        
        // Restaurer les critères
        if (sim.criteria) {
          setCriteria(sim.criteria);
        }
        
        // Restaurer les paramètres d'assurance
        if ((sim as any).includeWarRisk !== undefined) {
          setIncludeWarRisk((sim as any).includeWarRisk);
        }
        if ((sim as any).ordinaryRiskRateOverride !== undefined) {
          setOrdinaryRiskRateOverride((sim as any).ordinaryRiskRateOverride || '');
        }
        
        // Restaurer les acteurs sélectionnés
        if (sim.selectedActors) {
          setSelectedActors(sim.selectedActors);
        }
        
        // Restaurer les articles
        if (sim.articles) {
          setArticles(sim.articles);
        }
        
        // Restaurer l'historique des corrections
        if (sim.correctionHistory) {
          setCorrectionHistory(sim.correctionHistory);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSimulationId, id, simulations]);

  // Calcul de la simulation
  const performCalculation = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Simulation du calcul
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fonction robuste pour parser les valeurs numériques
      const parseValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Valeur FOB déjÃ  en FCFA depuis l'étape 6 (auto/manuelle)
      const fobValue = parseValue(formData.fob);

      const fretValue = parseValue(formData.fret);
      const assuranceValue = parseValue(formData.assurance);
      const droitDouaneValue = parseValue(formData.droitDouane);
      const fraisFinanciersValue = parseValue(formData.fraisFinanciers);
      const prestationTransitaireValue = parseValue(formData.prestationTransitaire);
      const rpiValue = parseValue(formData.rpi);
      const cocValue = parseValue(formData.coc);
      const bscValue = parseValue(formData.bsc);
      const creditEnlevementValue = parseValue(formData.creditEnlevement);
      const rrrValue = parseValue(formData.rrr);
      const rcpValue = parseValue(formData.rcp);
      const tsDouaneValue = parseValue(formData.tsDouane);
      const avanceFondsValue = parseValue(formData.avanceFonds);
      const fraisImprevusValue = parseValue(formData.fraisImprevus);

      console.log('Valeurs utilisées pour le calcul:', {
        fob: fobValue,
        fret: fretValue,
        assurance: assuranceValue,
        droitDouane: droitDouaneValue,
        fraisFinanciers: fraisFinanciersValue,
        prestationTransitaire: prestationTransitaireValue,
        rpi: rpiValue,
        coc: cocValue,
        bsc: bscValue,
        creditEnlevement: creditEnlevementValue,
        tva: parseValue(formData.tva),
        rrr: rrrValue,
        rcp: rcpValue,
        tsDouane: tsDouaneValue,
        avanceFonds: avanceFondsValue
      });

      console.log('Debug parseFloat:', {
        'formData.fret': formData.fret,
        'typeof formData.fret': typeof formData.fret,
        'parseFloat(formData.fret)': parseFloat(formData.fret),
        'Number(formData.fret)': Number(formData.fret)
      });

      const totalCost = fobValue + fretValue + assuranceValue + droitDouaneValue + 
                       fraisFinanciersValue + prestationTransitaireValue + rpiValue + 
                       cocValue + bscValue + creditEnlevementValue + rrrValue + rcpValue + (fraisImprevusValue || 0) + tsDouaneValue + avanceFondsValue;

      // Détail RPI pour le modal
      const rpiThresholdMin = Number(settings.rpiThresholdMin);
      const rpiThresholdMid = Number(settings.rpiThresholdMid);
      const rpiFlatMid = Number(settings.rpiFlatMid);
      const rpiLicenceRate = Number(settings.rpiLicenceRate);
      const rpiLicenceMin = Number(settings.rpiLicenceMin);
      let rpiTranche: 'zero' | 'flat' | 'licence' = 'zero';
      let rpiLicence = 0;
      let rpiApplied = 0;
      if (fobValue < rpiThresholdMin) {
        rpiTranche = 'zero';
        rpiApplied = 0;
      } else if (fobValue >= rpiThresholdMin && fobValue < rpiThresholdMid) {
        rpiTranche = 'flat';
        rpiApplied = rpiFlatMid;
      } else {
        rpiTranche = 'licence';
        rpiLicence = Math.round(fobValue * rpiLicenceRate);
        rpiApplied = Math.max(rpiLicence, rpiLicenceMin);
      }

      const simulationResult = {
        dossier: formData.dossier,
        numeroFacture: formData.numeroFacture,
        dateFacture: formData.dateFacture,
        dateTransaction: formData.dateTransaction,
        montantFacture: parseFloat(cleanNumberValue(formData.montantFacture)) || 0,
        devise: formData.devise,
        tauxChange: formData.tauxChange,
        incoterm: formData.incoterm,
        regimeDouanier: formData.regimeDouanier,
        modePaiement: formData.modePaiement,
        includeTransitaire: criteria.includeTransitaire,
        transport: {
          mode: formData.modeTransport,
          route: formData.route,
          typeConteneur: formData.typeConteneur,
          nombreConteneurs: formData.nombreConteneurs,
          poidsTotalTonnes: formData.poidsTotalTonnes
        },
        fob: fobValue,
        fret: fretValue,
        assurance: assuranceValue,
        droitDouane: droitDouaneValue,
        fraisFinanciers: fraisFinanciersValue,
        prestationTransitaire: prestationTransitaireValue,
        rpi: rpiValue,
        rpiDetail: {
          tranche: rpiTranche,
          fob: fobValue,
          thresholdMin: rpiThresholdMin,
          thresholdMid: rpiThresholdMid,
          flat: rpiFlatMid,
          licenceRate: rpiLicenceRate,
          licenceMin: rpiLicenceMin,
          licence: rpiLicence,
          applied: rpiApplied,
        },
        coc: cocValue,
        bsc: bscValue,
        creditEnlevement: creditEnlevementValue,
        rrr: rrrValue,
        rcp: rcpValue,
        tsDouane: tsDouaneValue,
        avanceFonds: avanceFondsValue,
        fraisImprevus: fraisImprevusValue,
        totalCost,
        items: articles,
        includeTVA: criteria.includeTVA,
        isDangerous: criteria.isDangerous,
        selectedActors: {
          importateur: selectedActors.importateur,
          fournisseur: selectedActors.fournisseur,
          transitaire: selectedActors.transitaire
        },
        actors: [
          selectedActors.importateur ? getActorsByType('importateur').find(a => a.id === selectedActors.importateur) : null,
          selectedActors.fournisseur ? getActorsByType('fournisseur').find(a => a.id === selectedActors.fournisseur) : null,
          selectedActors.transitaire ? getActorsByType('transitaire').find(a => a.id === selectedActors.transitaire) : null
        ].filter(Boolean)
      };

      console.log('Résultat de simulation créé:', {
        selectedActors: simulationResult.selectedActors,
        transport: simulationResult.transport,
        route: simulationResult.transport?.route
      });
      setResult(simulationResult);
      setShowResult(true);
      
      // Enregistrer la facture dans l'historique
      const invoiceData = {
        id: `invoice_${Date.now()}`,
        numeroFacture: formData.numeroFacture,
        dateFacture: formData.dateFacture,
        montantTotal: parseFloat(cleanNumberValue(formData.montantFacture)) || 0,
        devise: formData.devise,
        nombreArticles: articles.length,
        corrections: [],
        articles: articles,
        createdAt: new Date()
      };
      
      // Sauvegarder dans Supabase pour l'historique
      if (user) {
        try {
          await invoiceHistoryService.createInvoiceHistory(user.id, {
            invoiceNumber: formData.numeroFacture || `INV-${Date.now()}`,
            invoiceData: invoiceData,
            simulationId: simulationId || undefined,
          });
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
      }
      
      // Mettre Ã  jour le statut de la simulation Ã  'completed'
      if (simulationId) {
        console.log('Mise Ã  jour du statut Ã  "completed" dans performCalculation');
        updateSimulation(simulationId, { 
          status: 'completed',
          totalCost: totalCost
        });
      }

      // Déduire un crédit avec le système FIFO
      deductCredit(simulationId || 'new-simulation', formData.dossier || 'Simulation sans nom');

      // Mettre Ã  jour la simulation comme achevée
      if (simulationId) {
        console.log('Mise Ã  jour finale de la simulation Ã  "completed"');
        updateSimulation(simulationId, {
          ...simulationResult,
          numeroFacture: formData.numeroFacture,
          fournisseur: selectedActors.fournisseur ? getActorsByType('fournisseur').find(a => a.id === selectedActors.fournisseur)?.nom || '' : '',
          status: 'completed',
          maxStepReached: 6, // Maintenant on peut mettre Ã  6 car le calcul est réussi
          totalCost,
        });
      } else {
        // Si pas de simulationId, créer une nouvelle simulation achevée
                          addSimulation({
          userId: user.id,
          productName: formData.dossier || 'Simulation sans nom',
          numeroFacture: formData.numeroFacture,
          fournisseur: selectedActors.fournisseur ? getActorsByType('fournisseur').find(a => a.id === selectedActors.fournisseur)?.nom || '' : '',
          fob: fobValue,
          fret: fretValue,
          assurance: assuranceValue,
          droitDouane: droitDouaneValue,
          fraisFinanciers: fraisFinanciersValue,
          prestationTransitaire: prestationTransitaireValue,
          rpi: rpiValue,
          coc: cocValue,
          bsc: bscValue,
          creditEnlevement: creditEnlevementValue,
          rrr: rrrValue,
          rcp: rcpValue,
          totalCost,
          currency: 'XAF',
          status: 'completed',
          // Données pour la reprise exacte
          activeTab,
          maxStepReached,
          formData,
          autoCalculations,
          criteria,
          selectedActors,
          articles,
          correctionHistory,
        });
      }

    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      alert('Une erreur est survenue lors du calcul. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    console.log('=== DÃ‰BUT handleCalculate ===');
    console.log('SimulationId:', simulationId);
    console.log('Ã‰tat des auto calculs:', autoCalculations);
    console.log('Ã‰tat du formData:', {
      rrr: formData.rrr,
      rcp: formData.rcp,
      creditEnlevement: formData.creditEnlevement,
      avanceFonds: formData.avanceFonds
    });
    
    if (!user) return;
    
    // Afficher le modal "dernier crédit" si exactement 1 crédit et pas encore montré
    if (user.remainingCredits === 1 && !hasShownLastCreditNotice) {
      setShowLastCreditModal(true);
      setHasShownLastCreditNotice(true);
      localStorage.setItem('hasShownLastCreditNotice', 'true');
      return; // attendre confirmation utilisateur
    }
    
    if (user.remainingCredits < 1) {
      setShowLastCreditModal(true); // réutilise le modal pour informer et bloquer
      return;
    }

    // Marquer l'étape 6 comme achevée
    setIsStep6Completed(true);

    // Vérifier les calculs manquants
    const missing: Array<{key: string; label: string; description: string; unit: string}> = [];
    
    if (!autoCalculations.fret && (!formData.fret || parseFloat(formData.fret) === 0)) {
      missing.push({
        key: 'fret',
        label: 'Fret maritime/aérien',
        description: 'Coût du transport de la marchandise depuis le port/aéroport d\'origine',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.assurance && (!formData.assurance || parseFloat(formData.assurance) === 0)) {
      missing.push({
        key: 'assurance',
        label: 'Assurance transport',
        description: 'Assurance couvrant les risques pendant le transport',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.droitDouane && (!formData.droitDouane || parseFloat(formData.droitDouane) === 0)) {
      missing.push({
        key: 'droitDouane',
        label: 'Droits de douane',
        description: 'Taxes douanières basées sur les taux cumulés TEC (DD + RSTA + TVA selon critère)',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.fraisFinanciers && (!formData.fraisFinanciers || parseFloat(formData.fraisFinanciers) === 0)) {
      missing.push({
        key: 'fraisFinanciers',
        label: 'Frais financiers',
        description: 'Frais bancaires selon le mode de paiement (virement, remise, Crédit documentaire)',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.transitaire && (!formData.prestationTransitaire || parseFloat(formData.prestationTransitaire) === 0)) {
      missing.push({
        key: 'prestationTransitaire',
        label: 'Prestation transitaire',
        description: 'Honoraires du transitaire pour les formalités douanières',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.rpi && (!formData.rpi || parseFloat(formData.rpi) === 0)) {
      missing.push({
        key: 'rpi',
        label: 'RPI (Redevance Portuaire)',
        description: 'Redevance pour l\'utilisation des infrastructures portuaires',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.coc && (!formData.coc || parseFloat(formData.coc) === 0)) {
      missing.push({
        key: 'coc',
        label: 'COC (Certificate of Conformity)',
        description: 'Certificat de conformité obligatoire',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.bsc && (!formData.bsc || parseFloat(formData.bsc) === 0)) {
      missing.push({
        key: 'bsc',
        label: 'BSC (Bordereau de Suivi des Cargaisons)',
        description: 'Frais de suivi électronique des cargaisons',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.rrr && (!formData.rrr || parseFloat(formData.rrr) === 0)) {
      missing.push({
        key: 'rrr',
        label: 'RRR (Redevance de Régularisation)',
        description: 'Redevance pour la régularisation des opérations',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.rcp && (!formData.rcp || parseFloat(formData.rcp) === 0)) {
      missing.push({
        key: 'rcp',
        label: 'RCP (Redevance Contrôle des Prix)',
        description: 'Redevance pour le contrôle des prix Ã  l\'importation',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.creditEnlevement && (!formData.creditEnlevement || parseFloat(formData.creditEnlevement) === 0)) {
      console.log('Calcul manquant: Crédit d\'enlèvement');
      missing.push({
        key: 'creditEnlevement',
        label: 'Crédit d\'enlèvement',
        description: 'Crédit d\'enlèvement basé sur les droits de douane (DD Ã— 0.004)',
        unit: 'FCFA'
      });
    }
    
    if (!autoCalculations.avanceFonds && (!formData.avanceFonds || parseFloat(formData.avanceFonds) === 0)) {
      console.log('Calcul manquant: Avance de fonds');
      missing.push({
        key: 'avanceFonds',
        label: 'Avance de fonds',
        description: 'Avance de fonds basée sur les droits de douane (DD Ã— 0.0195)',
        unit: 'FCFA'
      });
    }
    
    // Frais imprévus dépend de la valeur CAF; demander si auto désactivé et vide
    if (!autoCalculations.fraisImprevus && (!formData.fraisImprevus || parseFloat(formData.fraisImprevus) === 0)) {
      missing.push({
        key: 'fraisImprevus',
        label: 'Frais imprévus (CAF)',
        description: 'Provision sur la valeur CAF (FOB + Fret + Assurance)',
        unit: 'FCFA'
      });
    }
    
    // Si des calculs sont manquants, afficher le modal de saisie manuelle
    if (missing.length > 0) {
      console.log('=== MODAL DE SAISIE MANUELLE DÃ‰CLENCHÃ‰ ===');
      console.log('Calculs manquants détectés:', missing.map(m => m.key));
      console.log('Valeurs actuelles:', {
        fret: formData.fret,
        prestationTransitaire: formData.prestationTransitaire,
        assurance: formData.assurance,
        droitDouane: formData.droitDouane,
        fraisFinanciers: formData.fraisFinanciers,
        rpi: formData.rpi,
        coc: formData.coc,
        bsc: formData.bsc,
        rrr: formData.rrr,
        rcp: formData.rcp
      });
      console.log('Auto calculs:', {
        fret: autoCalculations.fret,
        transitaire: autoCalculations.transitaire,
        assurance: autoCalculations.assurance,
        droitDouane: autoCalculations.droitDouane,
        fraisFinanciers: autoCalculations.fraisFinanciers,
        rpi: autoCalculations.rpi,
        coc: autoCalculations.coc,
        bsc: autoCalculations.bsc,
        rrr: autoCalculations.rrr,
        rcp: autoCalculations.rcp
      });
      setMissingCalculations(missing);
      setShowManualInputModal(true);
      return;
    }
    
    await performCalculation();
  };

  // Calcul automatique du FOB selon l'incoterm et les articles
  useEffect(() => {
    if (!autoCalculations.fobConversion) return;
    const inc = (formData.incoterm || '').toUpperCase();
    const baseSum = articles.reduce((sum, a) => sum + (Number(a.quantite) * Number(a.prixUnitaire)), 0);
    let computedFob = 0;
    if (inc === 'EXW') {
      computedFob = baseSum * Number(settings.fobMultiplierEXW) * Number(formData.tauxChange || 0);
    } else if (inc === 'FCA') {
      computedFob = baseSum * Number(settings.fobMultiplierFCA) * Number(formData.tauxChange || 0);
    } else {
      computedFob = baseSum * Number(formData.tauxChange || 0) * 1;
    }
    const next = Math.round(computedFob).toString();
    setFormData(prev => (prev.fob !== next ? { ...prev, fob: next } : prev));
  }, [autoCalculations.fobConversion, formData.incoterm, formData.tauxChange, articles, settings.fobMultiplierEXW, settings.fobMultiplierFCA]);

  // Calcul automatique de l'assurance
  useEffect(() => {
    if (!autoCalculations.assurance) return;
    const fob = Math.round(Number(formData.fob || 0));
    const fret = Math.round(Number(formData.fret || 0));
    const valeurAssurance = Math.round((fob + fret) * Number(settings.assuranceValueMultiplier));
    
    // Utiliser le taux personnalisé si défini, sinon utiliser le taux par défaut
    const tauxRisqueOrdinaire = ordinaryRiskRateOverride 
      ? parseFloat(ordinaryRiskRateOverride) || Number(settings.ordinaryRiskRate)
      : Number(settings.ordinaryRiskRate);
    
    let risqueOrdinaire = Math.round(valeurAssurance * tauxRisqueOrdinaire);
    if (risqueOrdinaire < Number(settings.ordinaryRiskMinimum)) {
      risqueOrdinaire = Number(settings.ordinaryRiskMinimum);
    }
    const accessoires = Math.round(Number(settings.accessoriesFlat));
    let taxe = 0;
    const mode = (formData.modeTransport || '').toLowerCase();
    if (mode === 'aerien' || mode === 'aérien' || mode === 'air') {
      taxe = Math.round(risqueOrdinaire * Number(settings.airTaxMultiplier));
    } else {
      taxe = 0;
    }
    
    // Inclure le Risque de Guerre seulement si activé
    const risqueGuerre = includeWarRisk 
      ? Math.round(valeurAssurance * Number(settings.warRiskRate))
      : 0;
    
    const prime = Math.round(risqueOrdinaire + accessoires + taxe + risqueGuerre);
    const next = prime.toString();
    setFormData(prev => (prev.assurance !== next ? { ...prev, assurance: next } : prev));
  }, [autoCalculations.assurance, formData.fob, formData.fret, formData.modeTransport, settings.assuranceValueMultiplier, settings.ordinaryRiskRate, settings.ordinaryRiskMinimum, settings.accessoriesFlat, settings.airTaxMultiplier, settings.warRiskRate, includeWarRisk, ordinaryRiskRateOverride]);

  // Calcul automatique du BSC
  useEffect(() => {
    if (!autoCalculations.bsc) return;
    const type = (formData.typeConteneur || '').toLowerCase();
    const n = Math.round(Number(formData.nombreConteneurs || 0));
    let unitRate = 0;
    if (type === '20_pieds' || type === 'tc20') unitRate = Number(settings.bscRateTC20);
    else if (type === '40_pieds' || type === 'tc40') unitRate = Number(settings.bscRateTC40);
    else if (type === '40_pieds_hc' || type === 'tc40hq') unitRate = Number(settings.bscRateTC40HQ);
    else if (type === 'conventionnel') unitRate = Number(settings.bscRateConventionnel);
    else if (type === 'groupage') unitRate = Number(settings.bscRateGroupage);
    const total = Math.round(unitRate * n);
    const next = total.toString();
    setFormData(prev => (prev.bsc !== next ? { ...prev, bsc: next } : prev));
  }, [autoCalculations.bsc, formData.typeConteneur, formData.nombreConteneurs, settings.bscRateTC20, settings.bscRateTC40, settings.bscRateTC40HQ, settings.bscRateConventionnel, settings.bscRateGroupage]);

  // Gestion des calculs automatiques selon l'incoterm
  useEffect(() => {
    const incoterm = (formData.incoterm || '').toUpperCase();
    const allowedIncoterms = ['EXW', 'FCA', 'FOB'];
    
    if (!allowedIncoterms.includes(incoterm) && incoterm !== '') {
      // Afficher le modal d'avertissement
      setIncotermWarningData({
        incoterm: incoterm,
        willDisableFret: autoCalculations.fret,
        willDisableAssurance: autoCalculations.assurance
      });
      setShowIncotermWarningModal(true);
    }
  }, [formData.incoterm, autoCalculations.fret, autoCalculations.assurance]);

  // Calcul automatique du fret
  useEffect(() => {
    if (!autoCalculations.fret) return;
    
    const typeConteneur = (formData.typeConteneur || '').toLowerCase();
    const nombreConteneurs = Math.round(Number(formData.nombreConteneurs || 0));
            const tauxChange = Number(formData.tauxChange) || 655.957;
    
    // Sélectionner les paramètres selon le type de conteneur
    let fretParams;
    if (typeConteneur === '20_pieds' || typeConteneur === 'tc20') {
      fretParams = {
        // Section 1: Coût prestation de service
        receptionDechargement: settings.fret20ReceptionDechargement,
        dossierDouaneT1: settings.fret20DossierDouaneT1,
        fraisFixe: settings.fret20FraisFixe,
        commissionTransit: settings.fret20CommissionTransit,
        fraisTractionTC: settings.fret20FraisTractionTC,
        fraisDouaneAppurement: settings.fret20FraisDouaneAppurement,
        fraisManutentionQuai: settings.fret20FraisManutentionQuai,
        empotage: settings.fret20Empotage,
        // Section 2: Coût prestation principal
        fretBase: settings.fret20FretBase,
        caf: settings.fret20CAF,
        bafMaritime: settings.fret20BAFMaritime,
        supplementOT: settings.fret20SupplementOT,
        supplementProduitDangereux: settings.fret20SupplementProduitDangereux,
        ebs: settings.fret20EBS,
        gestionBSC: settings.fret20GestionBSC,
        emissionBL: settings.fret20EmissionBL,
        fraisDouaneExport: settings.fret20FraisDouaneExport,
        surchargeProduitDangereux: settings.fret20SurchargeProduitDangereux,
        fretSecurite: settings.fret20FretSecurite,
        sureteISPS: settings.fret20SureteISPS
      };
    } else if (typeConteneur === '40_pieds' || typeConteneur === 'tc40') {
      fretParams = {
        // Section 1: Coût prestation de service
        receptionDechargement: settings.fret40ReceptionDechargement,
        dossierDouaneT1: settings.fret40DossierDouaneT1,
        fraisFixe: settings.fret40FraisFixe,
        commissionTransit: settings.fret40CommissionTransit,
        fraisTractionTC: settings.fret40FraisTractionTC,
        fraisDouaneAppurement: settings.fret40FraisDouaneAppurement,
        fraisManutentionQuai: settings.fret40FraisManutentionQuai,
        empotage: settings.fret40Empotage,
        // Section 2: Coût prestation principal
        fretBase: settings.fret40FretBase,
        caf: settings.fret40CAF,
        bafMaritime: settings.fret40BAFMaritime,
        supplementOT: settings.fret40SupplementOT,
        supplementProduitDangereux: settings.fret40SupplementProduitDangereux,
        ebs: settings.fret40EBS,
        gestionBSC: settings.fret40GestionBSC,
        emissionBL: settings.fret40EmissionBL,
        fraisDouaneExport: settings.fret40FraisDouaneExport,
        surchargeProduitDangereux: settings.fret40SurchargeProduitDangereux,
        fretSecurite: settings.fret40FretSecurite,
        sureteISPS: settings.fret40SureteISPS
      };
    } else {
      // Type de conteneur non reconnu, pas de calcul
      return;
    }
    
    // Calcul du fret total en euros
    const serviceCost = 
      fretParams.receptionDechargement +
      fretParams.dossierDouaneT1 +
      fretParams.fraisFixe +
      fretParams.commissionTransit +
      fretParams.fraisTractionTC +
      fretParams.fraisDouaneAppurement +
      fretParams.fraisManutentionQuai +
      fretParams.empotage;
    
    const principalCost = 
      fretParams.fretBase +
      fretParams.caf +
      fretParams.bafMaritime +
      fretParams.supplementOT +
      fretParams.supplementProduitDangereux +
      fretParams.ebs +
      fretParams.gestionBSC +
      fretParams.emissionBL +
      fretParams.fraisDouaneExport +
      fretParams.surchargeProduitDangereux +
      fretParams.fretSecurite +
      fretParams.sureteISPS;
    
    const fretTotalEuro = serviceCost + principalCost;
    
    // Conversion en FCFA et multiplication par le nombre de conteneurs
    const fretTotalFCFA = Math.round(fretTotalEuro * tauxChange * nombreConteneurs);
    
    const next = fretTotalFCFA.toString();
    setFormData(prev => (prev.fret !== next ? { ...prev, fret: next } : prev));
  }, [
    autoCalculations.fret, 
    formData.typeConteneur, 
    formData.nombreConteneurs, 
    formData.tauxChange,
    settings.fret20ReceptionDechargement,
    settings.fret20DossierDouaneT1,
    settings.fret20FraisFixe,
    settings.fret20CommissionTransit,
    settings.fret20FraisTractionTC,
    settings.fret20FraisDouaneAppurement,
    settings.fret20FraisManutentionQuai,
    settings.fret20Empotage,
    settings.fret20FretBase,
    settings.fret20CAF,
    settings.fret20BAFMaritime,
    settings.fret20SupplementOT,
    settings.fret20SupplementProduitDangereux,
    settings.fret20EBS,
    settings.fret20GestionBSC,
    settings.fret20EmissionBL,
    settings.fret20FraisDouaneExport,
    settings.fret20SurchargeProduitDangereux,
    settings.fret20FretSecurite,
    settings.fret20SureteISPS,
    settings.fret40ReceptionDechargement,
    settings.fret40DossierDouaneT1,
    settings.fret40FraisFixe,
    settings.fret40CommissionTransit,
    settings.fret40FraisTractionTC,
    settings.fret40FraisDouaneAppurement,
    settings.fret40FraisManutentionQuai,
    settings.fret40Empotage,
    settings.fret40FretBase,
    settings.fret40CAF,
    settings.fret40BAFMaritime,
    settings.fret40SupplementOT,
    settings.fret40SupplementProduitDangereux,
    settings.fret40EBS,
    settings.fret40GestionBSC,
    settings.fret40EmissionBL,
    settings.fret40FraisDouaneExport,
    settings.fret40SurchargeProduitDangereux,
    settings.fret40FretSecurite,
    settings.fret40SureteISPS
  ]);



  // Calcul automatique du RPI
  useEffect(() => {
    if (!autoCalculations.rpi) return;
    const fob = Math.round(Number(formData.fob || 0));
    const tMin = Number(settings.rpiThresholdMin);
    const tMid = Number(settings.rpiThresholdMid);
    const flatMid = Number(settings.rpiFlatMid);
    const licenceRate = Number(settings.rpiLicenceRate);
    const licenceMin = Number(settings.rpiLicenceMin);

    let rpi = 0;
    if (fob < tMin) {
      rpi = 0;
    } else if (fob >= tMin && fob < tMid) {
      rpi = flatMid;
    } else {
      const licence = Math.round(fob * licenceRate);
      rpi = Math.max(licence, licenceMin);
    }
    const next = Math.round(rpi).toString();
    setFormData(prev => (prev.rpi !== next ? { ...prev, rpi: next } : prev));
  }, [autoCalculations.rpi, formData.fob, settings.rpiThresholdMin, settings.rpiThresholdMid, settings.rpiFlatMid, settings.rpiLicenceRate, settings.rpiLicenceMin]);

  // Calcul automatique CAF-dépendants: frais imprévus, RRR, RCP
  useEffect(() => {
    const fob = Math.round(Number(formData.fob || 0));
    const fret = Math.round(Number(formData.fret || 0));
    const assurance = Math.round(Number(formData.assurance || 0));
    const caf = fob + fret + assurance;
    
    if (autoCalculations.fraisImprevus) {
      const v = Math.round(caf * Number(settings.cafFraisImprevusRate));
      const next = v.toString();
      setFormData(prev => (prev.fraisImprevus !== next ? { ...prev, fraisImprevus: next } : prev));
    }
  }, [autoCalculations.fraisImprevus, formData.fob, formData.fret, formData.assurance, settings.cafFraisImprevusRate]);

  // Calcul automatique DD-dépendants: crédit d'enlèvement et avance de fonds
  useEffect(() => {
    const droitDouane = Math.round(Number(formData.droitDouane || 0));
    
    console.log('=== CALCULS DD-DÃ‰PENDANTS ===');
    console.log('Droits de douane:', droitDouane);
    console.log('Auto calcul creditEnlevement:', autoCalculations.creditEnlevement);
    console.log('Auto calcul avanceFonds:', autoCalculations.avanceFonds);
    
    // Calcul automatique du crédit d'enlèvement
    if (autoCalculations.creditEnlevement) {
      const creditEnlevement = Math.round(droitDouane * Number(settings.creditEnlevementRate));
      const next = creditEnlevement.toString();
      console.log('Calcul automatique crédit d\'enlèvement:', creditEnlevement, '(DD Ã—', settings.creditEnlevementRate, ')');
      setFormData(prev => (prev.creditEnlevement !== next ? { ...prev, creditEnlevement: next } : prev));
    }
    
    // Calcul automatique de l'avance de fonds
    if (autoCalculations.avanceFonds) {
      const avanceFonds = Math.round(droitDouane * Number(settings.avanceFondsRate));
      const next = avanceFonds.toString();
      console.log('Calcul automatique avance de fonds:', avanceFonds, '(DD Ã—', settings.avanceFondsRate, ')');
      setFormData(prev => (prev.avanceFonds !== next ? { ...prev, avanceFonds: next } : prev));
    }
  }, [autoCalculations.creditEnlevement, autoCalculations.avanceFonds, formData.droitDouane, settings.creditEnlevementRate, settings.avanceFondsRate]);

    // Calcul automatique RRR et RCP basé sur les taux de la base TEC ligne par ligne
  useEffect(() => {
    if (!autoCalculations.rrr && !autoCalculations.rcp) return;
    
    console.log('=== TRIGGER RRR/RCP CALCULATION ===');
    console.log('autoCalculations.rrr:', autoCalculations.rrr);
    console.log('autoCalculations.rcp:', autoCalculations.rcp);
    console.log('articles.length:', articles.length);
    
    let totalRRR = 0;
    let totalRCP = 0;
    
    // Calculer le CAF global pour répartition proportionnelle
    const fobGlobal = Math.round(Number(formData.fob || 0));
    const fretGlobal = Math.round(Number(formData.fret || 0));
    const assuranceGlobal = Math.round(Number(formData.assurance || 0));
    const cafGlobal = fobGlobal + fretGlobal + assuranceGlobal;
    
    console.log('CAF global:', cafGlobal);
    
    if (cafGlobal > 0 && articles.length > 0) {
      const totalPrixArticles = articles.reduce((sum, a) => sum + (Number(a.prixTotal) || 0), 0);
      articles.forEach((article, index) => {
        // Récupérer les données TEC pour cet article
        const tecArticle = findTECArticleByCode(article.codeHS);
        
        // Calculer la part de CAF pour cet article (proportionnelle au prix total)
        const articlePrixTotal = Number(article.prixTotal) || 0;
        const partCAFArticle = totalPrixArticles > 0 ? (articlePrixTotal / totalPrixArticles) * cafGlobal : 0;
        
        console.log(`Article ${index + 1}:`, {
          codeHS: article.codeHS,
          designation: article.designation,
          prixTotal: articlePrixTotal,
          partCAF: partCAFArticle,
          tecArticle: tecArticle
        });
        
        if (tecArticle) {
          // Calcul RRR pour cet article
          // IMPORTANT: Les taux RRR dans la base TEC sont en pourcentages (ex: 20.3%)
          if (autoCalculations.rrr && tecArticle.rrr) {
            const tauxRRR = Number(tecArticle.rrr) || 0; // Taux en pourcentage (ex: 20.3)
            const rrrArticle = Math.round(partCAFArticle * (tauxRRR / 100)); // Division par 100 pour convertir en décimal
            totalRRR += rrrArticle;
            console.log(`RRR article ${index + 1}: ${rrrArticle} (taux: ${tauxRRR}%)`);
          }
          
          // Calcul RCP pour cet article
          // IMPORTANT: Les taux RCP dans la base TEC sont en pourcentages (ex: 20.3%)
          if (autoCalculations.rcp && tecArticle.rcp) {
            const tauxRCP = Number(tecArticle.rcp) || 0; // Taux en pourcentage (ex: 20.3)
            const rcpArticle = Math.round(partCAFArticle * (tauxRCP / 100)); // Division par 100 pour convertir en décimal
            totalRCP += rcpArticle;
            console.log(`RCP article ${index + 1}: ${rcpArticle} (taux: ${tauxRCP}%)`);
          }
        } else {
          console.log(`Article ${index + 1} (${article.codeHS}) non trouvé dans la base TEC`);
        }
      });
    }
    
    console.log('Totaux calculés:', {
      totalRRR,
      totalRCP
    });
    
    // Mettre Ã  jour les valeurs dans le formulaire
    if (autoCalculations.rrr) {
      const nextRRR = totalRRR.toString();
      setFormData(prev => (prev.rrr !== nextRRR ? { ...prev, rrr: nextRRR } : prev));
    }
    
    if (autoCalculations.rcp) {
      const nextRCP = totalRCP.toString();
      setFormData(prev => (prev.rcp !== nextRCP ? { ...prev, rcp: nextRCP } : prev));
    }
    
    console.log('=== FIN DEBUG RRR/RCP ===');
  }, [autoCalculations.rrr, autoCalculations.rcp, articles, formData.fob, formData.fret, formData.assurance]);

  // Calcul automatique des droits de douane basé sur les taux cumulés de la base TEC ligne par ligne
  useEffect(() => {
    if (!autoCalculations.droitDouane) return;
    
    console.log('=== TRIGGER DROITS DE DOUANE CALCULATION ===');
    console.log('autoCalculations.droitDouane:', autoCalculations.droitDouane);
    console.log('criteria.includeTVA:', criteria.includeTVA);
    console.log('articles.length:', articles.length);
    
    let totalDroitDouane = 0;
    let totalTVA = 0;
    
    // Calculer le CAF global pour répartition proportionnelle
    const fobGlobal = Math.round(Number(formData.fob || 0));
    const fretGlobal = Math.round(Number(formData.fret || 0));
    const assuranceGlobal = Math.round(Number(formData.assurance || 0));
    const cafGlobal = fobGlobal + fretGlobal + assuranceGlobal;
    
    console.log('CAF global pour DD:', cafGlobal);
    
    if (cafGlobal > 0 && articles.length > 0) {
      articles.forEach((article, index) => {
        // Récupérer les données TEC pour cet article
        const tecArticle = findTECArticleByCode(article.codeHS);
        
        // Calculer la part de CAF pour cet article (proportionnelle au prix total)
        const articlePrixTotal = Number(article.prixTotal) || 0;
        const totalPrixArticles = articles.reduce((sum, a) => sum + (Number(a.prixTotal) || 0), 0);
        const partCAFArticle = totalPrixArticles > 0 ? (articlePrixTotal / totalPrixArticles) * cafGlobal : 0;
        
        console.log(`Article ${index + 1} DD:`, {
          codeHS: article.codeHS,
          designation: article.designation,
          prixTotal: articlePrixTotal,
          partCAF: partCAFArticle,
          tecArticle: tecArticle
        });
        
        if (tecArticle) {
          // Sélectionner le taux cumulé selon l'activation de la TVA
          const tauxCumule = criteria.includeTVA ? tecArticle.cumulAvecTVA : tecArticle.cumulSansTVA;
          
          if (tauxCumule && tauxCumule > 0) {
            // Calcul DD pour cet article : CAF article Ã— taux cumulé
            const ddArticle = Math.round(partCAFArticle * (tauxCumule / 100));
            totalDroitDouane += ddArticle;
            
            console.log(`DD article ${index + 1}: ${ddArticle} (taux cumulé: ${tauxCumule}%, TVA: ${criteria.includeTVA ? 'incluse' : 'non incluse'})`);
          } else {
            console.log(`Article ${index + 1} (${article.codeHS}): taux cumulé manquant ou nul`);
          }
          
          if (criteria.includeTVA && tecArticle.tva) {
            const tvaArticle = Math.round(partCAFArticle * (tecArticle.tva / 100));
            totalTVA += tvaArticle;
          }
        } else {
          console.log(`Article ${index + 1} (${article.codeHS}) non trouvé dans la base TEC`);
        }
      });
    }
    
    console.log('Total DD calculé:', totalDroitDouane);
    
    // Mettre Ã  jour les valeurs dans le formulaire
    const nextDD = totalDroitDouane.toString();
    const nextTVA = totalTVA.toString();
    setFormData(prev => {
      if (prev.droitDouane === nextDD && prev.tva === nextTVA) {
        return prev;
      }
      return {
        ...prev,
        droitDouane: nextDD,
        tva: nextTVA
      };
    });
    
    console.log('=== FIN DEBUG DROITS DE DOUANE ===');
  }, [autoCalculations.droitDouane, criteria.includeTVA, articles, formData.fob, formData.fret, formData.assurance]);

  // Calcul automatique COC basé sur FOB total et route
  useEffect(() => {
    console.log('=== TRIGGER COC CALCULATION ===');
    console.log('autoCalculations.coc:', autoCalculations.coc);
    console.log('articles.length:', articles.length);
    console.log('formData.route:', formData.route);
    
    if (autoCalculations.coc) {
      const route = formData.route;
      let cocTotal = 0;
      
      // Debug: Afficher les informations de base
      console.log('=== DEBUG COC ===');
      console.log('Route sélectionnée:', route);
      console.log('Nombre d\'articles:', articles.length);
      console.log('Seuil COC:', settings.cocThreshold);
      
      // Calculer le FOB total des articles dans la liste VOC
      let totalFOBVOC = 0;
      let hasVOCArticles = false;
      
      articles.forEach((article, index) => {
        // Vérifier si l'article est présent dans la liste VOC
        const vocProduct = findVOCProductByCode(article.codeHS);
        
        console.log(`Article ${index + 1}:`, {
          codeHS: article.codeHS,
          designation: article.designation,
          prixTotal: article.prixTotal,
          isInVOC: !!vocProduct,
          vocProduct: vocProduct
        });
        
        if (vocProduct) {
          hasVOCArticles = true;
          // Ajouter le FOB de cet article au total VOC
          const articleFOB = article.prixTotal || 0;
          totalFOBVOC += articleFOB;
          console.log(`Article VOC trouvé: ${article.codeHS}, FOB: ${articleFOB}, Total VOC cumulé: ${totalFOBVOC}`);
        }
      });
      
      console.log('Résumé VOC:', {
        hasVOCArticles,
        totalFOBVOC,
        seuil: settings.cocThreshold,
        depasseSeuil: totalFOBVOC >= settings.cocThreshold
      });
      
      // Si on a des articles VOC et que le FOB total VOC >= seuil, calculer le COC
      if (hasVOCArticles && totalFOBVOC >= settings.cocThreshold) {
        let cocValue = 0;
        
        console.log('Calcul du COC pour route:', route);
        console.log('paramètres route A:', {
          taux: settings.cocRateRouteA,
          min: settings.cocMinRouteA,
          max: settings.cocMaxRouteA
        });
        
        // Calcul selon la route sélectionnée
        if (route === 'a') {
          cocValue = Math.round(totalFOBVOC * settings.cocRateRouteA);
          console.log('COC calculé route A:', cocValue);
          
          // Appliquer les limites min/max pour la route A
          if (cocValue <= settings.cocMinRouteA) {
            cocValue = settings.cocMinRouteA;
            console.log('COC limité au minimum route A:', cocValue);
          } else if (cocValue >= settings.cocMaxRouteA) {
            cocValue = settings.cocMaxRouteA;
            console.log('COC limité au maximum route A:', cocValue);
          }
        } else if (route === 'b') {
          cocValue = Math.round(totalFOBVOC * settings.cocRateRouteB);
          console.log('COC calculé route B:', cocValue);
          
          // Appliquer les limites min/max pour la route B
          if (cocValue <= settings.cocMinRouteB) {
            cocValue = settings.cocMinRouteB;
            console.log('COC limité au minimum route B:', cocValue);
          } else if (cocValue >= settings.cocMaxRouteB) {
            cocValue = settings.cocMaxRouteB;
            console.log('COC limité au maximum route B:', cocValue);
          }
        } else if (route === 'c') {
          cocValue = Math.round(totalFOBVOC * settings.cocRateRouteC);
          console.log('COC calculé route C:', cocValue);
          
          // Appliquer les limites min/max pour la route C
          if (cocValue <= settings.cocMinRouteC) {
            cocValue = settings.cocMinRouteC;
            console.log('COC limité au minimum route C:', cocValue);
          } else if (cocValue >= settings.cocMaxRouteC) {
            cocValue = settings.cocMaxRouteC;
            console.log('COC limité au maximum route C:', cocValue);
          }
        }
        
        cocTotal = cocValue;
        console.log('COC final:', cocTotal);
      } else {
        console.log('COC = 0 car:', {
          hasVOCArticles,
          totalFOBVOC,
          seuil: settings.cocThreshold,
          condition: hasVOCArticles && totalFOBVOC >= settings.cocThreshold
        });
      }
      // Si pas d'articles VOC ou FOB total VOC < seuil, COC = 0
      
      const next = cocTotal.toString();
      console.log('COC final Ã  appliquer:', next);
      console.log('=== FIN DEBUG COC ===');
      
      setFormData(prev => (prev.coc !== next ? { ...prev, coc: next } : prev));
    }
  }, [autoCalculations.coc, articles, formData.route, settings.cocThreshold, settings.cocRateRouteA, settings.cocMinRouteA, settings.cocMaxRouteA, settings.cocRateRouteB, settings.cocMinRouteB, settings.cocMaxRouteB, settings.cocRateRouteC, settings.cocMinRouteC, settings.cocMaxRouteC]);

  // Initialisation automatique du TS Douane avec la valeur des paramètres
  useEffect(() => {
    if (!formData.tsDouane || formData.tsDouane === '0') {
      setFormData(prev => ({
        ...prev,
        tsDouane: settings.tsDouane.toString()
      }));
    }
  }, [settings.tsDouane, formData.tsDouane]);

  // Calcul automatique des frais financiers selon le mode de paiement
  useEffect(() => {
    if (!autoCalculations.fraisFinanciers) return;
    
    const montantFacture = parseFloat(cleanNumberValue(formData.montantFacture)) || 0;
          const tauxChange = Number(formData.tauxChange) || 655.957;
    const modePaiement = formData.modePaiement;
    
    // Calculer TotalFournisseur = Montant de la facture * Taux de change
    const totalFournisseur = montantFacture * tauxChange;
    
    let fraisFinanciers = 0;
    
    if (modePaiement === 'virement') {
      // Cas 1 : Virement bancaire
      const fraisOuvertureDossier = Math.round(totalFournisseur * settings.fraisFinanciersVirementOuvertureDossier);
      const fraisDossier = settings.fraisFinanciersVirementDossier;
      const transfertSwift = settings.fraisFinanciersVirementSwift;
      const photocopie = settings.fraisFinanciersVirementPhotocopie;
      
      fraisFinanciers = fraisOuvertureDossier + fraisDossier + transfertSwift + photocopie;
      
    } else if (modePaiement === 'remise_documentaire') {
      // Cas 2 : Remise documentaire
      const fraisOuvertureDossier = Math.round(totalFournisseur * settings.fraisFinanciersRemiseOuvertureDossier);
      const fraisDossier = Math.round(totalFournisseur * settings.fraisFinanciersRemiseDossier);
      const transfertSwift = Math.round(totalFournisseur * settings.fraisFinanciersRemiseSwift);
      const photocopie = settings.fraisFinanciersRemisePhotocopie;
      const fraisImpaye = settings.fraisFinanciersRemiseImpaye;
      const fraisCourrierExpress = Math.round(totalFournisseur * settings.fraisFinanciersRemiseCourrierExpress);
      const commissionProrogatoire = settings.fraisFinanciersRemiseCommissionProrogatoire;
      const commissionChange = Math.round(totalFournisseur * settings.fraisFinanciersRemiseCommissionChange);
      
      // Calcul de la commission
      const commissionCalculee = totalFournisseur * settings.fraisFinanciersRemiseCommissionTaux;
      const commission = commissionCalculee < settings.fraisFinanciersRemiseCommissionSeuil 
        ? settings.fraisFinanciersRemiseCommissionSeuil 
        : commissionCalculee;
      
      fraisFinanciers = Math.round(fraisOuvertureDossier + fraisDossier + transfertSwift + photocopie + 
                                  fraisImpaye + fraisCourrierExpress + commissionProrogatoire + 
                                  commissionChange + commission);
      
    } else if (modePaiement === 'credit_documentaire') {
      // Cas 3 : Crédit documentaire
      const fraisOuvertureDossier = Math.round(totalFournisseur * settings.fraisFinanciersCreditOuvertureDossier);
      const fraisConfirmation = Math.round(totalFournisseur * settings.fraisFinanciersCreditConfirmation);
      const fraisDossier = Math.round(totalFournisseur * settings.fraisFinanciersCreditDossier);
      const transfertSwift = Math.round(totalFournisseur * settings.fraisFinanciersCreditSwift);
      const realisation = Math.round(totalFournisseur * settings.fraisFinanciersCreditRealisation);
      const photocopie = settings.fraisFinanciersCreditPhotocopie;
      const acceptation = Math.round(totalFournisseur * settings.fraisFinanciersCreditAcceptance);
      const negociation = Math.round(totalFournisseur * settings.fraisFinanciersCreditNegociation);
      const commissionPaiement = Math.round(totalFournisseur * settings.fraisFinanciersCreditCommissionPaiement);
      const commission = Math.round(totalFournisseur * settings.fraisFinanciersCreditCommission);
      const taxeBceao = Math.round(totalFournisseur * settings.fraisFinanciersCreditTaxeBceao);
      
      fraisFinanciers = Math.round(taxeBceao + commissionPaiement + commission + negociation + 
                                  acceptation + photocopie + realisation + transfertSwift + 
                                  fraisDossier + fraisConfirmation + fraisOuvertureDossier);
    }
    
    const next = fraisFinanciers.toString();
    setFormData(prev => (prev.fraisFinanciers !== next ? { ...prev, fraisFinanciers: next } : prev));
  }, [autoCalculations.fraisFinanciers, formData.montantFacture, formData.tauxChange, formData.modePaiement, settings]);

  // Calcul automatique de la prestation transitaire
  useEffect(() => {
    if (!autoCalculations.transitaire) return;
    
    console.log('=== TRIGGER PRESTATION TRANSITAIRE CALCULATION ===');
    
    // Récupérer les données nécessaires
    const poids = parseFloat(formData.poidsTotalTonnes) || 0; // Poids en Kg (étape 3)
    const droitDouane = parseFloat(formData.droitDouane) || 0; // DD (étape 6)
    const fob = parseFloat(formData.fob) || 0; // FOB (étape 6)
    const fret = parseFloat(formData.fret) || 0; // Fret (étape 6)
    const assurance = parseFloat(formData.assurance) || 0; // Assurance (étape 6)
    const caf = fob + fret + assurance; // Valeur CAF calculée
    
    const typeConteneur = formData.typeConteneur || '';
    const nombreConteneurs = Math.round(Number(formData.nombreConteneurs || 0));
    
    // Récupérer la zone de l'importateur sélectionné
    const importateurId = selectedActors.importateur;
    const importateur = importateurId ? getActorsByType('importateur').find(a => a.id === importateurId) : null;
    const zoneImportateur = importateur?.zone || 'zone1';
    
    // Récupérer les valeurs TP et Coderedev depuis TarifPORT
    const tpValue = parseFloat(tarifPORTTP) || 0;
    const codeRedevValue = parseFloat(tarifPORTCodeRedevance) || 0;
    
    console.log('Données de base:', {
      poids,
      droitDouane,
      fob,
      fret,
      assurance,
      caf,
      typeConteneur,
      nombreConteneurs,
      zoneImportateur,
      tpValue,
      codeRedevValue
    });
    
    // 1. Poids transport
    const poidsTransport = poids;
    
    // 2. Valeur CAF
    const valeurCAF = caf;
    
    // 3. Droits et Taxes
    const droitsEtTaxes = droitDouane;
    
    // 4. Divers débours
    const diversDebours = settings.transitaireDiversDebours;
    
    // 5. Frais établissement FDI
    const fraisEtablissementFDI = settings.transitaireFraisEtablissementFDI;
    
    // 6. Frais RFCV
    const fraisRFCV = settings.transitaireFraisRFCV;
    
    // 7. Redevance portuaire = TP * Poids
    const redevancePortuaire = tpValue * poids;
    
    // 8. Redevance Municipale = Coderedev * Poids
    const redevanceMunicipale = codeRedevValue * poids;
    
    // 9. Acconage Import TEU
    const acconageImportTEU = settings.transitaireAcconageImportTEU;
    
    // 10. Livraison_TEU selon type de conteneur et zone
    let livraisonTEU = 0;
    if (typeConteneur === '20_pieds' || typeConteneur === 'tc20') {
      if (zoneImportateur === 'zone1') {
        livraisonTEU = settings.transitaireLivraison20Zone1 * nombreConteneurs;
      } else if (zoneImportateur === 'zone2') {
        livraisonTEU = settings.transitaireLivraison20Zone2 * nombreConteneurs;
      } else if (zoneImportateur === 'zone3') {
        livraisonTEU = settings.transitaireLivraison20Zone3 * nombreConteneurs;
      }
    } else if (typeConteneur === '40_pieds' || typeConteneur === 'tc40') {
      if (zoneImportateur === 'zone1') {
        livraisonTEU = settings.transitaireLivraison40Zone1 * nombreConteneurs;
      } else if (zoneImportateur === 'zone2') {
        livraisonTEU = settings.transitaireLivraison40Zone2 * nombreConteneurs;
      } else if (zoneImportateur === 'zone3') {
        livraisonTEU = settings.transitaireLivraison40Zone3 * nombreConteneurs;
      }
    }
    
    // 11. Relevage_TEU selon type de conteneur et zone
    let relevageTEU = 0;
    if (typeConteneur === '20_pieds' || typeConteneur === 'tc20') {
      if (zoneImportateur === 'zone1') {
        relevageTEU = settings.transitaireRelevage20Zone1 * nombreConteneurs;
      } else if (zoneImportateur === 'zone2') {
        relevageTEU = settings.transitaireRelevage20Zone2 * nombreConteneurs;
      } else if (zoneImportateur === 'zone3') {
        relevageTEU = settings.transitaireRelevage20Zone3 * nombreConteneurs;
      }
    } else if (typeConteneur === '40_pieds' || typeConteneur === 'tc40') {
      if (zoneImportateur === 'zone1') {
        relevageTEU = settings.transitaireRelevage40Zone1 * nombreConteneurs;
      } else if (zoneImportateur === 'zone2') {
        relevageTEU = settings.transitaireRelevage40Zone2 * nombreConteneurs;
      } else if (zoneImportateur === 'zone3') {
        relevageTEU = settings.transitaireRelevage40Zone3 * nombreConteneurs;
      }
    }
    
    // 12. Divers Débours (deuxième occurrence)
    const diversDebours2 = settings.transitaireDiversDebours2;
    
    // 13. Echange BL
    const echangeBL = settings.transitaireEchangeBL;
    
    // 14. Nettoyage_TC_TEU selon type de conteneur
    let nettoyageTCTEU = 0;
    if (typeConteneur === '20_pieds' || typeConteneur === 'tc20') {
      nettoyageTCTEU = settings.transitaireNettoyageTC20 * nombreConteneurs;
    } else if (typeConteneur === '40_pieds' || typeConteneur === 'tc40') {
      nettoyageTCTEU = settings.transitaireNettoyageTC40 * nombreConteneurs;
    }
    
    // 15. Taxe ISPS selon type de conteneur
    let taxeISPS = 0;
    if (typeConteneur === '20_pieds' || typeConteneur === 'tc20') {
      taxeISPS = settings.transitaireTaxeISPS20 * nombreConteneurs;
    } else if (typeConteneur === '40_pieds' || typeConteneur === 'tc40') {
      taxeISPS = settings.transitaireTaxeISPS40 * nombreConteneurs;
    }
    
    // 16. Scanner
    const scanner = settings.transitaireScanner;
    
    // 17. Timbre sur BL
    const timbreBL = settings.transitaireTimbreBL;
    
    // 18. Conteneur Service Charge CSC
    const conteneurServiceCharge = settings.transitaireConteneurServiceCharge;
    
    // 19. Ouverture dossier
    const ouvertureDossier = settings.transitaireOuvertureDossier;
    
    // 20. Total Intervention = Somme des éléments de 1 Ã  19
            const totalIntervention = diversDebours + 
                              fraisEtablissementFDI + fraisRFCV + redevancePortuaire + 
                              redevanceMunicipale + acconageImportTEU + livraisonTEU + 
                              relevageTEU + diversDebours2 + echangeBL + nettoyageTCTEU + 
                              taxeISPS + scanner + timbreBL + conteneurServiceCharge + 
                              ouvertureDossier;
    
    // 21. Commission sur avance de Fond = Total Intervention * 0.0195
    const commissionAvanceFonds = totalIntervention * settings.transitaireCommissionAvanceFonds;
    
    // 22. Imprimer et Faxe
    const imprimerFax = settings.transitaireImprimerFax;
    
    // 23. Commission Transit
    const commissionTransit = settings.transitaireCommissionTransit;
    
    // 24. Taxe Sydam
    const taxeSydam = settings.transitaireTaxeSydam;
    
    // 25. HAD selon valeur CAF
    let had = 0;
    if (caf < settings.transitaireHADSeuil1) {
      had = caf * settings.transitaireHADTaux1;
    } else if (caf >= settings.transitaireHADSeuil1 && caf < settings.transitaireHADSeuil2) {
      had = caf * settings.transitaireHADTaux2;
    } else if (caf >= settings.transitaireHADSeuil2 && caf < settings.transitaireHADSeuil3) {
      had = caf * settings.transitaireHADTaux3;
    } else if (caf >= settings.transitaireHADSeuil3 && caf < settings.transitaireHADSeuil4) {
      had = caf * settings.transitaireHADTaux4;
    } else if (caf >= settings.transitaireHADSeuil4) {
      had = caf * settings.transitaireHADTaux5;
    }
    
    // 26. HAD Frais fixe selon valeur CAF
    let hadFraisFixe = 0;
    if (caf < settings.transitaireHADSeuil1) {
      hadFraisFixe = settings.transitaireHADFraisFixe1;
    } else if (caf >= settings.transitaireHADSeuil1 && caf < settings.transitaireHADSeuil2) {
      hadFraisFixe = settings.transitaireHADFraisFixe2;
    } else if (caf >= settings.transitaireHADSeuil2 && caf < settings.transitaireHADSeuil3) {
      hadFraisFixe = settings.transitaireHADFraisFixe3;
    } else if (caf >= settings.transitaireHADSeuil3 && caf < settings.transitaireHADSeuil4) {
      hadFraisFixe = settings.transitaireHADFraisFixe4;
    } else if (caf >= settings.transitaireHADSeuil4) {
      hadFraisFixe = settings.transitaireHADFraisFixe5;
    }
    
    // 27. Total prestation = Total Intervention + somme des éléments de 21 Ã  26
    const totalPrestation = totalIntervention + commissionAvanceFonds + imprimerFax + 
                           commissionTransit + taxeSydam + had + hadFraisFixe;
    
    console.log('Calcul Détaillé prestation transitaire:', {
      // Ã‰léments 1-19
      poidsTransport,
      valeurCAF,
      droitsEtTaxes,
      diversDebours,
      fraisEtablissementFDI,
      fraisRFCV,
      redevancePortuaire,
      redevanceMunicipale,
      acconageImportTEU,
      livraisonTEU,
      relevageTEU,
      diversDebours2,
      echangeBL,
      nettoyageTCTEU,
      taxeISPS,
      scanner,
      timbreBL,
      conteneurServiceCharge,
      ouvertureDossier,
      totalIntervention,
      // Ã‰léments 21-26
      commissionAvanceFonds,
      imprimerFax,
      commissionTransit,
      taxeSydam,
      had,
      hadFraisFixe,
      totalPrestation
    });
    
    const next = Math.round(totalPrestation).toString();
    setFormData(prev => (prev.prestationTransitaire !== next ? { ...prev, prestationTransitaire: next } : prev));
    
    console.log('=== FIN PRESTATION TRANSITAIRE CALCULATION ===');
  }, [
    autoCalculations.transitaire,
    formData.poidsTotalTonnes,
    formData.droitDouane,
    formData.fob,
    formData.fret,
    formData.assurance,
    formData.typeConteneur,
    formData.nombreConteneurs,
    selectedActors.importateur,
    tarifPORTTP,
    tarifPORTCodeRedevance,
    settings
  ]);

  const renderModeBadge = (isAuto: boolean) => (
    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full border ${isAuto ? 'border-cote-ivoire-success text-cote-ivoire-success bg-cote-ivoire-success/30' : 'border-cote-ivoire-secondary text-cote-ivoire-secondary bg-cote-ivoire-secondary/30'}`}>
      {isAuto ? 'Auto' : 'Manuel'}
    </span>
  );

  // Rendu de l'onglet calculs automatiques
  const renderAutoCalculationsTab = () => (
    <div className="space-y-6">
      {/* Section Critères - Déplacée en haut */}
              <div className="bg-white/50 border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="h-6 w-6 mr-3 text-cote-ivoire-primary" />
          Critères de simulation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TVA */}
          <div className="bg-cote-ivoire-lighter/50 rounded-lg p-4 border border-gray-300 hover:border-gray-500 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-lg bg-green-600 text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Inclure la TVA</h4>
                  <p className="text-sm text-gray-800">
                    Ajouter la TVA (19.25%) au calcul final
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    {criteria.includeTVA ? 'TVA incluse dans le calcul' : 'TVA non incluse'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={criteria.includeTVA}
                  onChange={() => handleCriteriaChange('includeTVA')}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Marchandise dangereuse */}
          <div className="bg-cote-ivoire-lighter/50 rounded-lg p-4 border border-gray-300 hover:border-gray-500 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-lg bg-orange-500 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Marchandise dangereuse</h4>
                  <p className="text-sm text-gray-800">
                    Appliquer les frais supplémentaires pour marchandises dangereuses
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    {criteria.isDangerous ? 'Frais supplémentaires appliqués' : 'Marchandise standard'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={criteria.isDangerous}
                  onChange={() => handleCriteriaChange('isDangerous')}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          {/* Prestation transitaire */}
          <div className="bg-cote-ivoire-lighter/50 rounded-lg p-4 border border-gray-300 hover:border-gray-500 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-lg bg-teal-600 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Prestation transitaire</h4>
                  <p className="text-sm text-gray-800">
                    Inclure les frais de prestation transitaire
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    {criteria.includeTransitaire ? 'Transitaire inclus' : 'Sans transitaire'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={criteria.includeTransitaire}
                  onChange={() => handleCriteriaChange('includeTransitaire')}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Résumé des critères */}
        <div className="mt-6 bg-cote-ivoire-lighter/30 rounded-lg p-4 border border-gray-300">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Résumé des critères sélectionnés :</h4>
          <div className="flex flex-wrap gap-2">
            {criteria.includeTVA && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white border border-green-600">
                <CreditCard className="h-3 w-3 mr-1" />
                TVA incluse (19.25%)
              </span>
            )}
            {criteria.isDangerous && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white border border-orange-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                Marchandise dangereuse
              </span>
            )}
            {criteria.includeTransitaire && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-600 text-white border border-teal-600">
                <Users className="h-3 w-3 mr-1" />
                Avec transitaire
              </span>
            )}
            {!criteria.includeTVA && !criteria.isDangerous && !criteria.includeTransitaire && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-900/50 text-gray-600 border border-cote-ivoire-light">
                Aucun critère spécial sélectionné
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
              <div className="bg-gradient-to-r from-cote-ivoire-light to-white border-2 border-cote-ivoire-secondary rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-cote-ivoire-primary mb-2">Actions rapides - Calculs automatiques</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setAutoCalculations(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {} as AutoCalculationSettings))}
              className="bg-cote-ivoire-success/50 text-cote-ivoire-success px-3 py-1 rounded-md text-sm hover:bg-cote-ivoire-success/50 transition-colors flex items-center space-x-1 border border-cote-ivoire-success"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Tout Activer</span>
            </button>
            <button
              onClick={() => setAutoCalculations(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as AutoCalculationSettings))}
                              className="bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary text-white px-3 py-1 rounded-md text-sm hover:from-cote-ivoire-secondary hover:to-cote-ivoire-warning transition-all duration-200 flex items-center space-x-1 border-2 border-cote-ivoire-secondary shadow-md"
            >
              <X className="h-4 w-4" />
              <span>Tout Désactiver</span>
            </button>
          </div>
        </div>
        <p className="text-cote-ivoire-primary text-sm">
          Configurez les calculs automatiques pour optimiser votre simulation
        </p>
        
        {/* Configuration du Risque de Guerre et du Risque Ordinaire */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Risque de Guerre */}
          <div className="bg-white/80 border border-gray-300 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-lg bg-red-500 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">Inclure le Risque de Guerre</h4>
                  <p className="text-sm text-gray-600">
                    Inclure ou exclure le Risque de Guerre dans le calcul de la prime d'assurance
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    {includeWarRisk ? 'Risque de Guerre inclus' : 'Risque de Guerre exclu'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={includeWarRisk}
                  onChange={(e) => setIncludeWarRisk(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>

          {/* Taux du Risque Ordinaire */}
          <div className="bg-white/80 border border-gray-300 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Calculator className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Taux du Risque Ordinaire (VO)
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Taux par défaut: 0.15% (0.0015). Laissez vide pour utiliser la valeur par défaut.
                </p>
                <input
                  type="text"
                  value={ordinaryRiskRateOverride}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permettre les nombres décimaux (ex: 0.0015 pour 0.15%)
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setOrdinaryRiskRateOverride(value);
                    }
                  }}
                  placeholder={`Par défaut: ${(Number(settings?.ordinaryRiskRate) || 0.0015) * 100}%`}
                  className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {ordinaryRiskRateOverride 
                    ? `Taux personnalisé: ${(parseFloat(ordinaryRiskRateOverride) || 0) * 100}%`
                    : `Taux par défaut: ${(Number(settings?.ordinaryRiskRate) || 0.0015) * 100}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des calculs automatiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            key: 'fobConversion',
            title: 'FOB (en EUR)',
            description: 'Free On Board, ou Franco Ã  bord',
            icon: Calculator,
            color: 'text-cote-ivoire-primary'
          },
          {
            key: 'droitDouane',
            title: 'Droit de douane (FCFA)',
            description: 'Calcul automatique basé sur les taux TEC',
            icon: CreditCard,
            color: 'text-cote-ivoire-primary'
          },
          {
            key: 'rpi',
            title: 'RPI (FCFA)',
            description: 'Redevance prestation import',
            icon: Settings,
            color: 'text-indigo-400'
          },
          {
            key: 'rrr',
            title: 'RRR (FCFA)',
            description: 'Rémunération pour Reproduction par Reprographie',
            icon: Settings,
            color: 'text-cyan-400'
          },
          {
            key: 'creditEnlevement',
            title: 'Crédit d\'enlèvement (FCFA)',
            description: 'Calcul basé sur les droits de douane',
            icon: Calculator,
            color: 'text-emerald-400'
          },
          {
            key: 'fret',
            title: 'Fret (FCFA)',
            description: 'Cout du transport international',
            icon: Package,
            color: 'text-cote-ivoire-success'
          },
          {
            key: 'fraisFinanciers',
            title: 'Frais financiers (FCFA)',
            description: 'Calcul selon le mode de paiement',
            icon: Calculator,
            color: 'text-cote-ivoire-secondary'
          },
          {
            key: 'coc',
            title: 'COC (FCFA)',
            description: 'Certificat of conformity',
            icon: FileText,
            color: 'text-orange-400'
          },
          {
            key: 'rcp',
            title: 'RCP (FCFA)',
            description: 'Redevance copie privée',
            icon: FileText,
            color: 'text-lime-400'
          },
          {
            key: 'avanceFonds',
            title: 'Avance de fonds (FCFA)',
            description: 'Calcul basé sur les droits de douane',
            icon: Calculator,
            color: 'text-violet-400'
          },
          {
            key: 'assurance',
            title: 'Assurance (FCFA)',
            description: 'Prime d\'assurance transport',
            icon: Shield,
            color: 'text-cote-ivoire-primary'
          },
          {
            key: 'transitaire',
            title: 'Prestation transitaire (FCFA)',
            description: 'Calcul automatique selon taux paramétré',
            icon: Users,
            color: 'text-teal-400'
          },
          {
            key: 'bsc',
            title: 'BSC (FCFA)',
            description: 'Bordereaux de suivi de cargaison',
            icon: Package,
            color: 'text-pink-400'
          },
          {
            key: 'tsDouane',
            title: 'TS Douane (FCFA)',
            description: 'Travaux Supplémentaires douane',
            icon: CreditCard,
            color: 'text-cote-ivoire-primary'
          },
          {
            key: 'fraisImprevus',
            title: 'Frais imprévus (FCFA)',
            description: 'Provision pour frais non prévus (CAF Ã— taux paramétrable)',
            icon: AlertTriangle,
            color: 'text-yellow-400'
          }
        ].map((item) => (
          <div
            key={item.key}
            className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-lg hover:border-gray-500 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg bg-cote-ivoire-lighter ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-800">{item.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={autoCalculations[item.key as keyof AutoCalculationSettings]}
                  onChange={() => handleAutoCalculationChange(item.key as keyof AutoCalculationSettings)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cote-ivoire-primary"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* paramètres actuels */}
              <div className="bg-white/50 border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Résumé de la Configuration</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-gray-800">
            <span>• Critères spéciaux :</span>
            <span className="font-medium text-cote-ivoire-primary">
              {Object.values(criteria).filter(Boolean).length}/3 activés
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-800">
            <span>• Calculs activés :</span>
            <span className="font-medium text-cote-ivoire-success">
              {Object.values(autoCalculations).filter(Boolean).length}/14
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-800">
            <span>• Calculs désactivés :</span>
            <span className="font-medium text-cote-ivoire-primary">
              {Object.values(autoCalculations).filter(v => !v).length}/14
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-800">
            <span>• Statut général :</span>
            <span className={`font-medium flex items-center space-x-1 ${
              Object.values(autoCalculations).every(Boolean) ? 'text-cote-ivoire-success' : 'text-orange-400'
            }`}>
              <CheckCircle className="h-4 w-4" />
              <span>{Object.values(autoCalculations).every(Boolean) ? 'Tout activé' : 'Partiellement activé'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu de l'onglet acteurs
  const renderActorsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['importateur', 'fournisseur', 'transitaire'].map((actorType) => {
        const actors = getActorsByType(actorType as any);
        const selectedActorId = selectedActors[actorType as keyof typeof selectedActors];
        const query = actorSearchQueries[actorType as keyof typeof actorSearchQueries]?.toLowerCase() || '';
        const filteredActors = query
          ? actors.filter(a => (a.nom || '').toLowerCase().includes(query) || (a.id || '').toLowerCase().includes(query))
          : actors;
        const selectedActor = actors.find(a => a.id === selectedActorId);

        return (
          <div key={actorType} className="bg-cote-ivoire-lighter rounded-lg p-6 border border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white capitalize flex items-center">
                <Users className="h-5 w-5 mr-2" />
                {actorType}
              </h3>
              <button
                onClick={() => {
                  setAddActorType(actorType as any);
                  setShowAddActorModal(true);
                }}
                className="bg-cote-ivoire-primary text-white px-3 py-1 rounded text-sm hover:bg-cote-ivoire-primary transition-colors"
              >
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={actorSearchQueries[actorType as keyof typeof actorSearchQueries]}
                onChange={(e) => setActorSearchQueries(prev => ({
                  ...prev,
                  [actorType]: e.target.value
                }))}
                placeholder={`Rechercher un ${actorType}...`}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
              />
              <select
                value={selectedActorId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedActors(prev => ({
                    ...prev,
                    [actorType]: value
                  }));
                  setActorSearchQueries(prev => ({
                    ...prev,
                    [actorType]: ''
                  }));
                }}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
              >
                <option value="">Sélectionner un {actorType}</option>
                {filteredActors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.nom}
                  </option>
                ))}
              </select>

              {selectedActor && (
                <div className="bg-cote-ivoire-light rounded p-3 text-sm">
                  <p className="text-white font-medium">{selectedActor.nom}</p>
                  {selectedActor.adresse && (
                    <p className="text-gray-800">{selectedActor.adresse}</p>
                  )}
                  <div className="flex space-x-4 mt-2 text-gray-600">
                    {selectedActor.telephone && (
                      <span>ðŸ“ž {selectedActor.telephone}</span>
                    )}
                    {selectedActor.email && (
                      <span>âœ‰ï¸ {selectedActor.email}</span>
                    )}
                  </div>
                  {selectedActor.zone && (
                    <div className="mt-2">
                      <span className="text-cote-ivoire-primary text-xs font-medium">ðŸ“ Zone: {selectedActor.zone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Rendu de l'onglet informations générales
  const renderGeneralInfoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Numéro de dossier *
          </label>
          <input
            type="text"
            name="dossier"
            value={formData.dossier}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
            placeholder="Ex: DOS-2024-001"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Numéro de facture *
            </label>
            <input
              type="text"
              name="numeroFacture"
              value={formData.numeroFacture}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
              placeholder="Ex: FAC-2024-001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Montant de la facture *
              <span className="text-xs text-gray-500 ml-2">
                (en {formData.devise})
              </span>
            </label>
            <input
              type="text"
              name="montantFacture"
              value={formData.montantFacture}
              onChange={(e) => {
                // Permettre la saisie de virgules et points
                let inputValue = e.target.value;
                
                // Supprimer les espaces
                inputValue = inputValue.replace(/\s/g, '');
                
                // Permettre seulement les chiffres, virgules et points
                inputValue = inputValue.replace(/[^\d,.]/g, '');
                
                // S'assurer qu'il n'y a qu'un seul séparateur décimal (virgule ou point)
                const commaCount = (inputValue.match(/,/g) || []).length;
                const dotCount = (inputValue.match(/\./g) || []).length;
                
                if (commaCount > 1 || dotCount > 1) {
                  // Garder seulement le premier séparateur
                  const parts = inputValue.split(/[,.]/);
                  if (parts.length > 2) {
                    inputValue = parts[0] + '.' + parts.slice(1).join('');
                  }
                }
                
                // Limiter Ã  3 décimales maximum pour les montants
                const parts = inputValue.split(/[,.]/);
                if (parts.length === 2 && parts[1].length > 3) {
                  inputValue = parts[0] + '.' + parts[1].substring(0, 3);
                }
                
                // Permettre l'affichage des virgules pendant la saisie
                // Convertir les points en virgules pour l'affichage
                if (inputValue.includes('.')) {
                  inputValue = inputValue.replace('.', ',');
                }
                
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'montantFacture', value: inputValue }
                });
              }}
              onBlur={(e) => {
                // Convertir les virgules en points lors de la perte de focus
                const cleanedValue = cleanNumberValue(e.target.value);
                
                // Mettre Ã  jour le montant de la facture avec la valeur nettoyée
                setFormData(prev => ({
                  ...prev,
                  montantFacture: cleanedValue,
                  // Calculer automatiquement le FOB si le montant facture change
                  fob: Math.round(Number(cleanedValue || 0)).toString()
                }));
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
              placeholder="0"
              required
            />
            {formData.montantFacture && (
              <div className="text-xs text-gray-600 mt-1 space-y-1">
                <p>
                  Valeur saisie: {formatNumber(formData.montantFacture)} {formData.devise}
                </p>
                <p>
                  Ã‰quivalent: {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XAF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(parseFloat(cleanNumberValue(formData.montantFacture)) * (Number(formData.tauxChange) || 655.957))}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Date de la facture *
            </label>
            <input
              type="date"
              name="dateFacture"
              value={formData.dateFacture}
              onChange={handleInputChange}
              onBlur={validateDates}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Date de la transaction *
            </label>
            <input
              type="date"
              name="dateTransaction"
              value={formData.dateTransaction}
              onChange={handleInputChange}
              onBlur={validateDates}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Devise de facturation *
            </label>
            <select
              name="devise"
              value={formData.devise}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
              required
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Taux de change (vers FCFA)
            </label>
            <input
              type="number"
              name="tauxChange"
              value={Number(formData.tauxChange) || 655.957}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
              step="0.001"
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Incoterm *
          </label>
          <select
            name="incoterm"
            value={formData.incoterm}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800"
            required
          >
            {INCOTERMS.map((incoterm) => (
              <option key={incoterm.code} value={incoterm.code}>
                {incoterm.code} - {incoterm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section TarifPORT */}
              <div className="bg-white rounded-lg border border-gray-300 p-6">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center">
          <svg className="h-4 w-4 mr-2 text-cote-ivoire-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Sélection TarifPORT
        </h4>
        
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche et sélection des articles TarifPORT */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  catégorie ou famille d'article *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedTarifPORTArticle}
                    readOnly
                    placeholder="Sélectionner une catégorie ou famille d'article..."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 pr-10"
                  />
                  <button
                    onClick={handleTarifPORTSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cote-ivoire-primary hover:text-cote-ivoire-primary transition-colors"
                    title="Rechercher dans TarifPORT"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

          {/* Zone de saisie TP */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              TP
            </label>
            <input
              type="text"
              value={tarifPORTTP}
              readOnly
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-800 placeholder-gray-500"
              placeholder="TP automatique"
            />
          </div>

          {/* Zone de saisie Code Redevance */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Code Redevance
            </label>
            <input
              type="text"
              value={tarifPORTCodeRedevance}
              readOnly
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-800 placeholder-gray-500"
              placeholder="Code automatique"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu de l'onglet transport
  const renderTransportTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Mode de transport *
          </label>
          <select
            name="modeTransport"
            value={formData.modeTransport}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
            required
          >
            <option value="">Sélectionner un mode de transport</option>
            <option value="maritime">Maritime</option>
            <option value="aerien">Aérien</option>
            <option value="routier">Routier</option>
            <option value="ferroviaire">Ferroviaire</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Route *
          </label>
          <select
            name="route"
            value={formData.route}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
            required
          >
            <option value="">Sélectionner une route</option>
            <option value="A">Route A</option>
            <option value="B">Route B</option>
            <option value="C">Route C</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Type de conteneur *
          </label>
                      <select
              name="typeConteneur"
              value={formData.typeConteneur}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
              required
            >
            <option value="">Sélectionner un type de conteneur</option>
            <option value="20_pieds">20 pieds</option>
            <option value="40_pieds">40 pieds</option>
            <option value="40_pieds_hc">40 pieds HC</option>
            <option value="conventionnel">Conventionnel</option>
            <option value="groupage">Groupage</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Nombre de conteneurs
          </label>
          <input
            type="number"
            name="nombreConteneurs"
            value={formData.nombreConteneurs}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Poids total (tonnes) *
          </label>
                      <input
              type="number"
              name="poidsTotalTonnes"
              value={formData.poidsTotalTonnes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 font-bold text-lg"
              step="0.001"
              min="0"
              placeholder="Ex: 1.250"
              required
            />
          {formData.poidsTotalTonnes && (
            <p className="text-xs text-gray-600 mt-1">
              Ã‰quivalent: {parseFloat(formData.poidsTotalTonnes) * 1000} kg
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            régime douanier *
          </label>
          <select
            name="regimeDouanier"
            value={formData.regimeDouanier}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
            required
          >
            <option value="">Sélectionner un régime douanier</option>
            <option value="IM4">IM4</option>
            <option value="IM5">IM5</option>
            <option value="IM7">IM7</option>
            <option value="IM8">IM8</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Mode de paiement *
          </label>
          <select
            name="modePaiement"
            value={formData.modePaiement}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 font-bold text-lg"
            required
          >
            <option value="">Sélectionner un mode de paiement</option>
            <option value="virement">Virement</option>
            <option value="credit_documentaire">Crédit documentaire</option>
            <option value="remise_documentaire">Remise documentaire</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Rendu de l'onglet articles
  const renderArticlesTab = () => (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />



      {isUploading && (
        <div className="bg-cote-ivoire-lighter rounded-lg p-4 border border-gray-300">
          <div className="flex items-center space-x-3 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cote-ivoire-primary"></div>
            <span className="text-white text-sm">Chargement des articles...</span>
          </div>
          <div className="w-full bg-cote-ivoire-light rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary h-2 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-600 mt-1">
            {uploadProgress}%
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
          {/* En-tête du tableau avec titre et boutons */}
                      <div className="flex items-center justify-between p-4 bg-cote-ivoire-lighter border-b border-gray-300">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary rounded-lg flex items-center justify-center shadow-md">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Articles de la facture</h3>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-success/50 text-cote-ivoire-success border border-cote-ivoire-success hover:bg-cote-ivoire-success/50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Importer Excel</span>
              </button>
              <button
                onClick={handleClearArticles}
                disabled={articles.length === 0}
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary text-white border-2 border-cote-ivoire-secondary hover:from-cote-ivoire-secondary hover:to-cote-ivoire-warning transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Vider la table</span>
              </button>
            </div>
          </div>

          {/* Tableau des articles */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cote-ivoire-lighter border-b border-gray-300">
                  <th className="text-center py-3 px-4 text-gray-800 font-semibold">Actions</th>
                  <th className="text-left py-3 px-4 text-gray-800 font-semibold">Code SH</th>
                  <th className="text-left py-3 px-4 text-gray-800 font-semibold">Désignation</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Qté</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Prix Unit.</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Total</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Poids</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Taux</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">U/S</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">DD (%)</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">RSTA (%)</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">PCS</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">PUA</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">PCC</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">RRR</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">RCP</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">TVA (%)</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Cumul Sans TVA (%)</th>
                  <th className="text-right py-3 px-4 text-gray-800 font-semibold">Cumul Avec TVA (%)</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => {
                  // Récupérer les données TEC pour l'unité statistique uniquement
                  const tecArticle = findTECArticleByCode(article.codeHS);
                  
                  return (
                    <tr key={article.id} className="border-b border-gray-300 hover:bg-cote-ivoire-lighter/50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEditArticle(article.id)}
                            className="p-1 text-cote-ivoire-primary hover:text-cote-ivoire-primary transition-colors" 
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteArticle(article.id)}
                            className="p-1 text-cote-ivoire-primary hover:text-cote-ivoire-primary transition-colors" 
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cote-ivoire-primary font-mono">{article.codeHS}</td>
                      <td className="py-3 px-4 text-gray-800">{article.designation}</td>
                      <td className="py-3 px-4 text-gray-800 text-right">{article.quantite}</td>
                      <td className="py-3 px-4 text-gray-800 text-right">
                        {new Intl.NumberFormat('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(article.prixUnitaire)}
                      </td>
                      <td className="py-3 px-4 text-cote-ivoire-success font-medium text-right">
                        {new Intl.NumberFormat('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(article.prixTotal)}
                      </td>
                      <td className="py-3 px-4 text-gray-800 text-right">{article.poids}</td>
                      <td className="py-3 px-4 text-gray-800 text-right font-semibold">{formatDecimal(article.tauxDroit)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-secondary text-right font-medium">{tecArticle?.us || '-'}</td>
                      <td className="py-3 px-4 text-cote-ivoire-primary text-right font-semibold">{formatDecimal(article.dd)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-warning text-right font-semibold">{formatDecimal(article.rsta)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-success text-right font-semibold">{formatDecimal(article.pcs)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-secondary text-right font-semibold">{formatDecimal(article.pua)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-warning text-right font-semibold">{formatDecimal(article.pcc)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-success text-right">{formatDecimal(article.rrr)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-warning text-right">{formatDecimal(article.rcp)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-primary text-right font-semibold">{formatDecimal(article.tva)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-success text-right font-semibold">{formatDecimal(article.cumulSansTVA)}</td>
                      <td className="py-3 px-4 text-cote-ivoire-success text-right font-semibold">{formatDecimal(article.cumulAvecTVA)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section de saisie manuelle d'articles */}
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="h-4 w-4 mr-2 text-cote-ivoire-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Ajouter un Article
            </h4>
            
            {/* Formulaire horizontal comme dans l'image */}
            <div className="flex items-center space-x-3">
              {/* Code SH avec bouton de recherche */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Code SH"
                  value={newArticle.codeHS}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, codeHS: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-400 text-sm pr-10 font-bold"
                />
                <button
                  onClick={() => handleEditCodeHS(newArticle.codeHS)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cote-ivoire-primary hover:text-cote-ivoire-primary transition-colors"
                  title="Rechercher dans la table TEC"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Désignation */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Désignation *"
                  value={newArticle.designation}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, designation: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-400 text-sm font-bold"
                />
              </div>

              {/* Quantité */}
              <div className="w-20">
                <input
                  type="number"
                  value={newArticle.quantite}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setNewArticle(prev => ({ ...prev, quantite: 0 }));
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setNewArticle(prev => ({ ...prev, quantite: numValue }));
                      }
                    }
                  }}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-400 text-sm font-bold"
                />
              </div>

              {/* Prix Unitaire */}
              <div className="w-24">
                <input
                  type="number"
                  value={newArticle.prixUnitaire}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '.') {
                      setNewArticle(prev => ({ ...prev, prixUnitaire: value === '' ? 0 : 0 }));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        setNewArticle(prev => ({ ...prev, prixUnitaire: numValue }));
                      }
                    }
                  }}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-400 text-sm font-bold"
                />
              </div>

              {/* Poids */}
              <div className="w-20">
                <input
                  type="number"
                  value={newArticle.poids}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '.') {
                      setNewArticle(prev => ({ ...prev, poids: value === '' ? 0 : 0 }));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        setNewArticle(prev => ({ ...prev, poids: numValue }));
                      }
                    }
                  }}
                  step="0.001"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-400 text-sm font-bold"
                />
              </div>

              {/* Taux */}
              <div className="w-20">
                <input
                  type="number"
                  value={newArticle.tauxDroit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '.') {
                      setNewArticle(prev => ({ ...prev, tauxDroit: value === '' ? 0 : 0 }));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        setNewArticle(prev => ({ ...prev, tauxDroit: numValue }));
                      }
                    }
                  }}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-400 text-sm font-bold"
                />
              </div>

              {/* Checkboxes TVA et Danger */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-500 text-cote-ivoire-primary focus:ring-blue-500" />
                  <span className="text-sm text-gray-800">TVA</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-500 text-cote-ivoire-primary focus:ring-red-500" />
                  <span className="text-sm text-gray-800">Danger</span>
                </label>
              </div>

              {/* Bouton d'ajout */}
              <div className="w-12">
                {editingArticle ? (
                  <div className="flex space-x-1">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-cote-ivoire-success text-white px-2 py-2 rounded-md hover:bg-cote-ivoire-success transition-colors text-sm font-medium"
                      title="Sauvegarder"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="flex-1 bg-cote-ivoire-light text-white px-2 py-2 rounded-md hover:bg-cote-ivoire-lighter transition-colors text-sm font-medium"
                      title="Annuler"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleAddArticle}
                    className="w-full bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary text-white px-3 py-2 rounded-md hover:from-cote-ivoire-secondary hover:to-cote-ivoire-warning transition-all duration-200 text-sm font-medium shadow-lg border border-cote-ivoire-secondary"
                    title="Ajouter l'article"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
            
            {/* Affichage du prix total calculé automatiquement */}
            {(newArticle.quantite > 0 || newArticle.prixUnitaire > 0) && (
              <div className="mt-3 p-2 bg-cote-ivoire-primary/20 border border-cote-ivoire-primary/50 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cote-ivoire-primary">Prix total calculé :</span>
                  <span className="text-cote-ivoire-primary font-medium">
                    {new Intl.NumberFormat('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(calculatePrixTotal(newArticle.quantite, newArticle.prixUnitaire))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Résumé en bas */}
          <div className="p-4 bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-secondary/10 border-t border-cote-ivoire-primary/30">
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-cote-ivoire-primary">{articles.length}</div>
                <div className="text-sm text-gray-700 font-medium">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cote-ivoire-success">
                  {articles.reduce((sum, article) => sum + article.quantite, 0)}
                </div>
                <div className="text-sm text-gray-700 font-medium">Quantité totale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cote-ivoire-secondary">
                  {articles.reduce((sum, article) => sum + article.poids, 0)}
                </div>
                <div className="text-sm text-gray-700 font-medium">Poids total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cote-ivoire-primary">
                  {new Intl.NumberFormat('fr-FR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(articles.reduce((sum, article) => sum + article.prixTotal, 0))}
                </div>
                <div className="text-sm text-gray-700 font-medium">Valeur totale</div>
              </div>
            </div>
          </div>
        </div>
      )}



      {articles.length === 0 && !isUploading && (
        <div className="text-center py-12 bg-cote-ivoire-lighter rounded-lg border border-gray-300">
          <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Aucun article ajouté</p>
          <p className="text-gray-500 text-sm mb-4">
            <strong className="text-orange-400">OBLIGATOIRE :</strong> Ajoutez des articles pour continuer vers l'étape suivante
          </p>
          <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-4 mb-4">
            <p className="text-orange-200 text-sm font-medium">
              âš ï¸ Vous devez ajouter au moins un article pour continuer
            </p>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => {
                // Faire défiler vers la section de saisie manuelle
                const manualSection = document.querySelector('input[placeholder="Désignation *"]')?.closest('.bg-white');
                if (manualSection) {
                  manualSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Focus sur le champ désignation après un court délai
                  setTimeout(() => {
                    const input = document.querySelector('input[placeholder="Désignation *"]') as HTMLInputElement;
                    if (input) input.focus();
                  }, 500);
                }
              }}
                              className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/50 text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Saisie manuelle</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-success/50 text-cote-ivoire-success border border-cote-ivoire-success hover:bg-cote-ivoire-success/50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import Excel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

          // Rendu de l'onglet Coûts de revient prévisionnels
  const renderCostsTab = () => {
    // Calcul de la valeur CAF (FOB + Fret + Assurance)
    const fobValue = parseFloat(formData.fob) || 0;
    const fretValue = parseFloat(formData.fret) || 0;
    const assuranceValue = parseFloat(formData.assurance) || 0;
    const cafValue = fobValue + fretValue + assuranceValue;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };



    return (
      <div className="space-y-6">
        {/* Affichage de la valeur CAF calculée en surbrillance */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 border border-orange-400 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg shadow-md">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Valeur CAF calculée</h3>
                <p className="text-sm text-white/80">FOB + Fret + Assurance (lecture seule)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">
                {formatCurrency(cafValue)}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {fobValue > 0 ? `${formatCurrency(fobValue)} + ${formatCurrency(fretValue)} + ${formatCurrency(assuranceValue)}` : 'Valeurs non saisies'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              FOB (en {formData.devise}) {renderModeBadge(!!autoCalculations.fobConversion)}
              <DetailedCalculationModal
                title="Calcul du FOB"
                formula="FOB = Î£(Quantité Ã— Prix unitaire) Ã— Multiplicateur Ã— Taux de change"
                explanation="Le FOB (Free On Board) représente la valeur des marchandises au point d'embarquement. Le calcul dépend de l'incoterm utilisé."
                details={[
                  { label: "Somme articles", value: `${formatCurrency(articles.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0))}`, description: "Total des articles en devise" },
                  { label: "Multiplicateur", value: autoCalculations.fobConversion ? (formData.incoterm === 'EXW' ? '1.03' : formData.incoterm === 'FCA' ? '1.05' : '1.00') : '1.00', description: "Selon incoterm" },
                  { label: "Taux de change", value: `${formData.tauxChange}`, description: "Devise vers FCFA" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Incoterms :</strong></p>
                  <p>• EXW : Multiplicateur 1.03</p>
                  <p>• FCA : Multiplicateur 1.05</p>
                  <p>• FOB : Multiplicateur 1.00</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="number"
              name="fob"
              value={formData.fob}
              onChange={handleInputChange}
              readOnly={!!autoCalculations.fobConversion}
              title={autoCalculations.fobConversion ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.fobConversion ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Fret (FCFA) {renderModeBadge(!!autoCalculations.fret)}
              <DetailedCalculationModal
                title="Calcul du Fret"
                formula="Fret = (Coûts service + Coûts principal) Ã— Taux de change Ã— Nombre conteneurs"
                explanation="Le fret maritime comprend tous les coûts de transport, manutention et services portuaires."
                details={[
                  { label: "Coûts service", value: "1 025 €", description: "Réception, dossier, commission, traction, etc." },
                  { label: "Coûts principal", value: "1 698 €", description: "Fret base, BAF, suppléments, sécurité" },
                  { label: "Total euros", value: "2 723 €", description: "Par conteneur" },
                  { label: "Taux de change", value: `${formData.tauxChange}`, description: "EUR vers FCFA" },
                  { label: "Nombre conteneurs", value: `${formData.nombreConteneurs}`, description: "Type: ${formData.typeConteneur}" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Coûts service :</strong> Réception, dossier douane, commission transit, traction, manutention, empotage</p>
                  <p><strong>Coûts principal :</strong> Fret base, BAF maritime, suppléments, EBS, gestion BSC, émission BL, sécurité</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="fret"
              value={formatNumber(formData.fret)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'fret', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.fret}
              title={autoCalculations.fret ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.fret ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Assurance (FCFA) {renderModeBadge(!!autoCalculations.assurance)}
              <DetailedCalculationModal
                title="Calcul de l'Assurance"
                formula="Assurance = (FOB + Fret) Ã— 1.2 Ã— (Risque ordinaire + Accessoires + Taxe + Risque guerre)"
                explanation="L'assurance couvre les risques pendant le transport maritime. Le calcul inclut plusieurs composantes."
                details={[
                  { label: "Valeur assurée", value: `${formatCurrency(fobValue + fretValue)}`, description: "FOB + Fret" },
                  { label: "Multiplicateur", value: "1.2", description: "Valeur d'assurance" },
                  { label: "Risque ordinaire", value: "0.15%", description: "Risque de base" },
                  { label: "Accessoires", value: "2 500 FCFA", description: "Frais fixes" },
                  { label: "Taxe aérienne", value: formData.modeTransport === 'aerien' ? "7%" : "0%", description: "Si transport aérien" },
                  { label: "Risque guerre", value: "0.1%", description: "Risque supplémentaire" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Composantes :</strong></p>
                  <p>• Risque ordinaire : 0.15% de la valeur assurée</p>
                  <p>• Accessoires : 2 500 FCFA (frais fixes)</p>
                  <p>• Taxe aérienne : 7% si transport aérien</p>
                  <p>• Risque guerre : 0.1% de la valeur assurée</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="assurance"
              value={formatNumber(formData.assurance)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'assurance', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.assurance}
              title={autoCalculations.assurance ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.assurance ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Droit de douane (FCFA) {renderModeBadge(!!autoCalculations.droitDouane)}
              <DetailedCalculationModal
                title="Calcul des Droits de Douane"
                formula="DD = Î£(Part CAF article Ã— Taux cumulé TEC) pour chaque article"
                explanation="Les droits de douane sont calculés ligne par ligne selon les taux de la base TEC. Le CAF global est réparti proportionnellement entre les articles."
                details={[
                  { label: "CAF global", value: `${formatCurrency(cafValue)}`, description: "FOB + Fret + Assurance" },
                  { label: "Nombre articles", value: `${articles.length}`, description: "Articles dans la facture" },
                  { label: "Critère TVA", value: criteria.includeTVA ? "Avec TVA" : "Sans TVA", description: "Taux utilisé" },
                  { label: "Base TEC", value: "Taux cumulés", description: "DD + RSTA + TVA selon critère" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Méthode :</strong></p>
                  <p>1. Calcul du CAF global (FOB + Fret + Assurance)</p>
                  <p>2. Répartition proportionnelle du CAF entre les articles</p>
                  <p>3. Application du taux cumulé TEC pour chaque article</p>
                  <p>4. Somme de tous les droits de douane calculés</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="droitDouane"
              value={formatNumber(formData.droitDouane)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'droitDouane', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.droitDouane}
              title={autoCalculations.droitDouane ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.droitDouane ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Frais financiers (FCFA) {renderModeBadge(!!autoCalculations.fraisFinanciers)}
              <DetailedCalculationModal
                title="Calcul des Frais Financiers"
                formula="Frais = Somme des frais selon mode de paiement (Virement/Remise/Crédit documentaire)"
                explanation="Les frais financiers varient selon le mode de paiement choisi. Chaque mode a ses propres composantes."
                details={[
                  { label: "Mode paiement", value: formData.modePaiement || "Non défini", description: "Mode sélectionné" },
                  { label: "Base calcul", value: formData.modePaiement === 'virement' ? "Montant facture" : "Montant facture", description: "Base pour les pourcentages" },
                  { label: "Frais fixes", value: "Selon mode", description: "Frais indépendants du montant" },
                  { label: "Frais variables", value: "Selon mode", description: "Pourcentages du montant" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Modes de paiement :</strong></p>
                  <p><strong>Virement :</strong> Dossier (15 000), Swift (20 000), Photocopie (10 000)</p>
                  <p><strong>Remise :</strong> Ouverture (1%), Dossier, Swift, Photocopie, Impayé, Courrier, Commission</p>
                  <p><strong>Crédit documentaire :</strong> Ouverture (0.25%), Confirmation, Réalisation, Négociation, Commission</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="fraisFinanciers"
              value={formatNumber(formData.fraisFinanciers)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'fraisFinanciers', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.fraisFinanciers}
              title={autoCalculations.fraisFinanciers ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.fraisFinanciers ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Prestation transitaire (FCFA) {renderModeBadge(!!autoCalculations.transitaire)}
              <DetailedCalculationModal
                title="Calcul de la Prestation Transitaire"
                formula="Prestation = Total Intervention + Commission avance + Imprimer/Fax + Commission transit + Taxe Sydam + HAD + HAD Frais fixe"
                explanation="La prestation transitaire comprend tous les services du transitaire : intervention, commissions et taxes."
                details={[
                  { label: "Total Intervention", value: "Ã‰léments 1-19", description: "Poids, CAF, DD, redevances, etc." },
                  { label: "Commission avance", value: "1.95%", description: "Du Total Intervention" },
                  { label: "Imprimer/Fax", value: "5 434 FCFA", description: "Frais fixes" },
                  { label: "Commission transit", value: "29 250 FCFA", description: "Frais fixes" },
                  { label: "Taxe Sydam", value: "19 500 FCFA", description: "Frais fixes" },
                  { label: "HAD", value: "Selon CAF", description: "Taux progressif selon valeur CAF" },
                  { label: "HAD Frais fixe", value: "Selon CAF", description: "Frais fixes selon valeur CAF" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Total Intervention (16 éléments) :</strong></p>
                  <p>1. Divers débours 2. Frais FDI 3. Frais RFCV 4. Redevance portuaire</p>
                  <p>5. Redevance municipale 6. Acconage TEU 7. Livraison TEU 8. Relevage TEU</p>
                  <p>9. Divers débours 10. Echange BL 11. Nettoyage TEU 12. Taxe ISPS</p>
                  <p>13. Scanner 14. Timbre BL 15. Service charge 16. Ouverture dossier</p>
                  <p><em>Note : Poids, CAF et DD ne sont plus inclus dans le Total Intervention</em></p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="prestationTransitaire"
              value={formatNumber(formData.prestationTransitaire)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'prestationTransitaire', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.transitaire}
              title={autoCalculations.transitaire ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.transitaire ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              RPI (FCFA) {renderModeBadge(!!autoCalculations.rpi)}
              <DetailedCalculationModal
                title="Calcul du RPI"
                formula="RPI = (FOB + Fret + Assurance) Ã— Taux RPI"
                explanation="Le RPI (Redevance pour la Promotion Industrielle) est calculé sur la valeur CAF."
                details={[
                  { label: "Valeur CAF", value: `${formatCurrency(cafValue)}`, description: "FOB + Fret + Assurance" },
                  { label: "Taux RPI", value: "0.5%", description: "Taux fixe" },
                  { label: "Calcul", value: `${formatCurrency(cafValue * 0.005)}`, description: "CAF Ã— 0.5%" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>RPI :</strong> Redevance pour la Promotion Industrielle</p>
                  <p><strong>Taux :</strong> 0.5% de la valeur CAF</p>
                  <p><strong>Base :</strong> Valeur totale des marchandises (FOB + Fret + Assurance)</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="rpi"
              value={formatNumber(formData.rpi)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'rpi', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.rpi}
              title={autoCalculations.rpi ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.rpi ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              COC (FCFA) {renderModeBadge(!!autoCalculations.coc)}
              <DetailedCalculationModal
                title="Calcul du COC"
                formula="COC = FOB Articles VOC × Taux COC selon route (si FOB VOC ≥ Seuil)"
                explanation="Le COC (Certificate of Conformity) est calculé uniquement sur les articles VOC (Vérification Obligatoire de Conformité) dont le FOB total dépasse le seuil défini."
                details={[
                  { label: "Articles VOC", value: articles.filter(a => findVOCProductByCode(a.codeHS)).length.toString(), description: "Articles soumis à vérification" },
                  { label: "FOB Articles VOC", value: `${formatCurrency(articles.reduce((sum, a) => sum + (findVOCProductByCode(a.codeHS) ? (a.prixTotal || 0) : 0), 0))}`, description: "FOB total des articles VOC" },
                  { label: "Seuil COC", value: `${formatCurrency(settings.cocThreshold)}`, description: "Seuil minimum pour déclencher le COC" },
                  { label: "Route", value: formData.route || "Non définie", description: "Route A, B ou C" },
                  { label: "Condition", value: articles.some(a => findVOCProductByCode(a.codeHS)) && articles.reduce((sum, a) => sum + (findVOCProductByCode(a.codeHS) ? (a.prixTotal || 0) : 0), 0) >= settings.cocThreshold ? "COC applicable" : "COC = 0", description: "Si articles VOC et seuil atteint" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Logique de calcul :</strong></p>
                  <p>1. Identifier les articles VOC dans la liste</p>
                  <p>2. Calculer le FOB total des articles VOC</p>
                  <p>3. Si FOB VOC ≥ Seuil → Calculer COC selon route</p>
                  <p>4. Sinon → COC = 0</p>
                  <br/>
                  <p><strong>Taux par route :</strong></p>
                  <p><strong>Route A :</strong> {settings.cocRateRouteA}% (Min: {formatCurrency(settings.cocMinRouteA)}, Max: {formatCurrency(settings.cocMaxRouteA)})</p>
                  <p><strong>Route B :</strong> {settings.cocRateRouteB}% (Min: {formatCurrency(settings.cocMinRouteB)}, Max: {formatCurrency(settings.cocMaxRouteB)})</p>
                  <p><strong>Route C :</strong> {settings.cocRateRouteC}% (Min: {formatCurrency(settings.cocMinRouteC)}, Max: {formatCurrency(settings.cocMaxRouteC)})</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="coc"
              value={formatNumber(formData.coc)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'coc', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.coc}
              title={autoCalculations.coc ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.coc ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              BSC (FCFA) {renderModeBadge(!!autoCalculations.bsc)}
              <DetailedCalculationModal
                title="Calcul du BSC"
                formula="BSC = Montant facture Ã— Taux BSC selon route"
                explanation="Le BSC (Bordereau de Suivi Cargaison) est calculé selon la route d'importation et le montant de la facture."
                details={[
                  { label: "Montant facture", value: `${formatCurrency(fobValue)}`, description: "Valeur FOB" },
                  { label: "Route", value: formData.route || "Non définie", description: "Route A, B ou C" },
                  { label: "Taux BSC", value: formData.route === 'A' ? "0.3%" : formData.route === 'B' ? "0.2%" : "0.1%", description: "Selon route" },
                  { label: "Seuils", value: "Selon route", description: "Min/Max selon route" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Routes :</strong></p>
                  <p><strong>Route A :</strong> 0.3% (Min: 15 000, Max: 300 000 FCFA)</p>
                  <p><strong>Route B :</strong> 0.2% (Min: 10 000, Max: 200 000 FCFA)</p>
                  <p><strong>Route C :</strong> 0.1% (Min: 5 000, Max: 100 000 FCFA)</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="bsc"
              value={formatNumber(formData.bsc)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'bsc', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.bsc}
              title={autoCalculations.bsc ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.bsc ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              RRR (FCFA) {renderModeBadge(!!autoCalculations.rrr)}
              <DetailedCalculationModal
                title="Calcul du RRR"
                formula="RRR = Î£(Part CAF article Ã— Taux RRR TEC) pour chaque article"
                explanation="Le RRR (Redevance de Régulation et de Régulation) est calculé ligne par ligne selon les taux de la base TEC. IMPORTANT: Les taux TEC sont en pourcentages (ex: 20.3%)."
                details={[
                  { label: "CAF global", value: `${formatCurrency(cafValue)}`, description: "FOB + Fret + Assurance" },
                  { label: "Nombre articles", value: `${articles.length}`, description: "Articles dans la facture" },
                  { label: "Base TEC", value: "Taux RRR", description: "Taux RRR par code SH10" },
                  { label: "Méthode", value: "Répartition proportionnelle", description: "CAF réparti entre articles" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Méthode :</strong></p>
                  <p>1. Calcul du CAF global (FOB + Fret + Assurance)</p>
                  <p>2. Répartition proportionnelle du CAF entre les articles</p>
                  <p>3. Application du taux RRR TEC pour chaque article</p>
                  <p>4. Somme de tous les RRR calculés</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="rrr"
              value={formatNumber(formData.rrr)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'rrr', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.rrr}
              title={autoCalculations.rrr ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.rrr ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              RCP (FCFA) {renderModeBadge(!!autoCalculations.rcp)}
              <DetailedCalculationModal
                title="Calcul du RCP"
                formula="RCP = Î£(Part CAF article Ã— Taux RCP TEC) pour chaque article"
                explanation="Le RCP (Redevance de Contrôle et de Prévention) est calculé ligne par ligne selon les taux de la base TEC. IMPORTANT: Les taux TEC sont en pourcentages (ex: 20.3%)."
                details={[
                  { label: "CAF global", value: `${formatCurrency(cafValue)}`, description: "FOB + Fret + Assurance" },
                  { label: "Nombre articles", value: `${articles.length}`, description: "Articles dans la facture" },
                  { label: "Base TEC", value: "Taux RCP", description: "Taux RCP par code SH10" },
                  { label: "Méthode", value: "Répartition proportionnelle", description: "CAF réparti entre articles" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Méthode :</strong></p>
                  <p>1. Calcul du CAF global (FOB + Fret + Assurance)</p>
                  <p>2. Répartition proportionnelle du CAF entre les articles</p>
                  <p>3. Application du taux RCP TEC pour chaque article</p>
                  <p>4. Somme de tous les RCP calculés</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="rcp"
              value={formatNumber(formData.rcp)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'rcp', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.rcp}
              title={autoCalculations.rcp ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.rcp ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              TS Douane (FCFA)
              <DetailedCalculationModal
                title="Calcul du TS Douane"
                formula="TS Douane = 20 000 FCFA (frais fixes)"
                explanation="Le TS Douane (Timbre de Service Douane) est un frais fixe de 20 000 FCFA."
                details={[
                  { label: "Montant fixe", value: "20 000 FCFA", description: "Frais fixes" },
                  { label: "Base", value: "Par dossier", description: "Indépendant du montant" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>TS Douane :</strong> Timbre de Service Douane</p>
                  <p><strong>Montant :</strong> 20 000 FCFA (frais fixes)</p>
                  <p><strong>Application :</strong> Par dossier d'importation</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="tsDouane"
              value={formatNumber(formData.tsDouane)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'tsDouane', value: cleanedValue }
                });
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 font-bold text-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Crédit d'enlèvement (FCFA) {renderModeBadge(!!autoCalculations.creditEnlevement)}
              <DetailedCalculationModal
                title="Calcul du Crédit d'Enlèvement"
                formula="Crédit d'enlèvement = Droits de douane Ã— 0.4%"
                explanation="Le crédit d'enlèvement est calculé sur les droits de douane Ã  un taux de 0.4%."
                details={[
                  { label: "Droits de douane", value: `${formatCurrency(parseFloat(formData.droitDouane) || 0)}`, description: "Base de calcul" },
                  { label: "Taux", value: "0.4%", description: "Taux fixe" },
                  { label: "Calcul", value: `${formatCurrency((parseFloat(formData.droitDouane) || 0) * 0.004)}`, description: "DD Ã— 0.004" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Crédit d'enlèvement :</strong> Frais calculés sur les droits de douane</p>
                  <p><strong>Taux :</strong> 0.4% des droits de douane</p>
                  <p><strong>Base :</strong> Montant total des droits de douane</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="creditEnlevement"
              value={formatNumber(formData.creditEnlevement)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'creditEnlevement', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.creditEnlevement}
              title={autoCalculations.creditEnlevement ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.creditEnlevement ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Avance de fonds (FCFA) {renderModeBadge(!!autoCalculations.avanceFonds)}
              <DetailedCalculationModal
                title="Calcul de l'Avance de Fonds"
                formula="Avance de fonds = Droits de douane Ã— 1.95%"
                explanation="L'avance de fonds est calculée sur les droits de douane Ã  un taux de 1.95%."
                details={[
                  { label: "Droits de douane", value: `${formatCurrency(parseFloat(formData.droitDouane) || 0)}`, description: "Base de calcul" },
                  { label: "Taux", value: "1.95%", description: "Taux fixe" },
                  { label: "Calcul", value: `${formatCurrency((parseFloat(formData.droitDouane) || 0) * 0.0195)}`, description: "DD Ã— 0.0195" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Avance de fonds :</strong> Frais calculés sur les droits de douane</p>
                  <p><strong>Taux :</strong> 1.95% des droits de douane</p>
                  <p><strong>Base :</strong> Montant total des droits de douane</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="avanceFonds"
              value={formatNumber(formData.avanceFonds)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'avanceFonds', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.avanceFonds}
              title={autoCalculations.avanceFonds ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.avanceFonds ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              Frais imprévus (FCFA) {renderModeBadge(!!autoCalculations.fraisImprevus)}
              <DetailedCalculationModal
                title="Calcul des Frais Imprévus"
                formula="Frais imprévus = CAF Ã— Taux paramétrable"
                explanation="Les frais imprévus sont calculés sur la valeur CAF (FOB + Fret + Assurance) selon un taux paramétrable (par défaut 5%)."
                details={[
                  { label: "CAF", value: `${formatCurrency(cafValue)}`, description: "FOB + Fret + Assurance" },
                  { label: "Taux", value: `${(settings.cafFraisImprevusRate * 100).toFixed(1)}%`, description: "Configurable dans les paramètres" },
                  { label: "Calcul", value: `${formatCurrency(cafValue * settings.cafFraisImprevusRate)}`, description: "CAF Ã— Taux" }
                ]}
              >
                <div className="text-xs text-gray-600 mt-2">
                  <p><strong>Frais imprévus :</strong> Provision pour les frais non prévus</p>
                  <p><strong>Taux :</strong> {(settings.cafFraisImprevusRate * 100).toFixed(1)}% de la valeur CAF</p>
                  <p><strong>Base :</strong> Valeur CAF (FOB + Fret + Assurance)</p>
                </div>
              </DetailedCalculationModal>
            </label>
            <input
              type="text"
              name="fraisImprevus"
              value={formatNumber(formData.fraisImprevus)}
              onChange={(e) => {
                const cleanedValue = cleanNumberValue(e.target.value);
                handleInputChange({
                  ...e,
                  target: { ...e.target, name: 'fraisImprevus', value: cleanedValue }
                });
              }}
              readOnly={!!autoCalculations.fraisImprevus}
              title={autoCalculations.fraisImprevus ? 'Calcul automatique activé' : undefined}
              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 ${autoCalculations.fraisImprevus ? 'bg-gray-100 cursor-not-allowed font-bold text-lg' : ''}`}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    );
  };

  const currentStep = getCurrentStep();
  const currentStepIndex = getCurrentStepIndex();
  const globalProgress = getGlobalProgress();



  return (
    <div className="space-y-6">
      {/* En-tÃªte avec progression améliorée */}
      <div className="relative bg-cote-ivoire-success rounded-xl shadow-lg border border-gray-300 overflow-hidden backdrop-blur-md">
        {/* Barre de progression en haut */}
        <div className="h-1 bg-gray-200">{/* h-1 = 4px */}
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 transition-all duration-500 ease-out rounded"
            style={{ width: `${globalProgress}%` }}
          ></div>
        </div>
        


        {/* Notification de sauvegarde automatique */}
        {autoSaveStatus !== 'idle' && (
          <div className="absolute top-2 right-4 z-10">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              autoSaveStatus === 'saving' 
                ? 'bg-cote-ivoire-primary text-cote-ivoire-primary border border-cote-ivoire-primary' 
                : 'bg-cote-ivoire-success text-cote-ivoire-success border border-cote-ivoire-success'
            }`}>
              {autoSaveStatus === 'saving' ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cote-ivoire-primary"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  <span>Sauvegardé</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 bg-cote-ivoire-success/20 rounded-lg p-4 border border-cote-ivoire-success/30">
              {/* Numéro d'étape et bulle icône */}
              <div className="relative flex items-center space-x-2">
                <span className="text-2xl font-bold text-white drop-shadow mr-2 select-none">
                  {currentStepIndex + 1}
                </span>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md border-2 border-cote-ivoire-primary">
                  <span className="flex items-center justify-center w-full h-full">
                    <currentStep.icon className="h-6 w-6 text-white" />
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cote-ivoire-success rounded-full flex items-center justify-center border-2 border-white">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 drop-shadow">
                  Simulateur de Coût de Revient Prévisionnel
                </h1>
                {/* Flèche bleue sous le titre */}
                {(() => {
                  const nextStep = getNextStep();
                  if (!nextStep) return null;
                  return (
                    <div className="flex items-center space-x-2 bg-orange-600 text-white border border-orange-600 rounded-lg px-3 py-2 mt-2 mb-2 shadow-md w-max self-start">
                      <span className="text-white text-sm font-semibold">Prochaine étape :</span>
                      <ArrowRight className="h-5 w-5 text-white" />
                      <span className="text-white text-sm font-semibold flex items-center">
                        {nextStep && nextStep.icon && React.createElement(nextStep.icon, { className: "h-4 w-4 mr-1 text-white" })}
                        {nextStep && nextStep.label}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <currentStep.icon className="h-4 w-4 text-white" />
                                      <span className="text-white font-medium">
                    Étape {currentStepIndex + 1}/{steps.length}: {currentStep.label}
                  </span>
                  </div>
                  <div className="text-white">â€¢</div>
                  <span className="text-white">{currentStep.description}</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1 text-xs bg-cote-ivoire-success/30 text-white px-2 py-1 rounded-full border border-cote-ivoire-success">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>En cours</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Métriques de progression */}
            <div className="flex flex-col items-end space-y-3">
              {/* Chronomètre de simulation */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary">
                <Clock className="h-3 w-3" />
                <span>Temps: {formatTime(simulationDuration)}</span>
                {isTimerRunning && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-right">
                <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                  <div className="flex items-center justify-end space-x-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-cote-ivoire-primary" />
                    <span className="text-xs text-gray-600">Progression</span>
                  </div>
                  <p className="text-xl font-bold text-cote-ivoire-primary">{globalProgress}%</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                  <div className="flex items-center justify-end space-x-2 mb-1">
                    <CreditCard className="h-4 w-4 text-cote-ivoire-success" />
                    <span className="text-xs text-gray-600">Crédits</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{user?.remainingCredits || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par étapes avec indicateurs visuels */}
      <div className="bg-cote-ivoire-lighter rounded-xl shadow-lg border border-gray-300">
        <div className="border-b border-cote-ivoire-primary/20">
          <nav className="flex space-x-0 px-6" aria-label="Tabs">
            {steps.map((step, index) => {
              const isActive = activeTab === step.id;
              const isCompleted = index < maxStepReached; // modifié
              const isAccessible = index <= maxStepReached; // modifié
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && setActiveTab(step.id)}
                  disabled={!isAccessible}
                  className={`relative py-4 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                    isActive
                      ? 'border-cote-ivoire-primary text-cote-ivoire-primary bg-cote-ivoire-primary/10'
                      : isCompleted
                        ? 'border-cote-ivoire-success text-cote-ivoire-success hover:text-cote-ivoire-success hover:border-cote-ivoire-success'
                        : isAccessible
                          ? 'border-transparent text-gray-600 hover:text-cote-ivoire-primary hover:border-cote-ivoire-primary'
                          : 'border-transparent text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base font-bold text-cote-ivoire-primary mr-2 select-none">
                    {index + 1}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-cote-ivoire-primary text-white'
                      : isCompleted
                        ? 'bg-cote-ivoire-success text-white'
                        : isAccessible
                          ? 'bg-cote-ivoire-secondary text-white'
                          : 'bg-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <span className="flex items-center justify-center w-full h-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-full h-full">
                        <step.icon className="h-4 w-4 text-white" />
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline">{step.label}</span>
                  {/* Indicateur de progression */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'auto-calculations' && renderAutoCalculationsTab()}
          {activeTab === 'actors' && renderActorsTab()}
          {activeTab === 'general' && renderGeneralInfoTab()}
          {activeTab === 'transport' && renderTransportTab()}
          {activeTab === 'articles' && renderArticlesTab()}
          {activeTab === 'costs' && renderCostsTab()}
        </div>

        {/* Navigation entre étapes */}
        <div className="border-t border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                              {getPreviousStep() && activeTab !== 'costs' && (
                  <button
                    onClick={goToPreviousStep}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-white text-cote-ivoire-primary border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Précédent</span>
                  </button>
                )}
              
              {/* Message d'information Ã  l'étape 6 */}
              {activeTab === 'costs' && (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-cote-ivoire-success text-white border border-cote-ivoire-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>Simulation achevée - Prêt pour le calcul final</span>
                </div>
              )}
              
              {/* Bouton "Mettre en attente" - Masqué Ã  l'étape 6 */}
              {activeTab !== 'costs' && (
                <button
                  onClick={() => {
                    // Sauvegarder la simulation actuelle avec toutes les données
                    const simulationData = {
                      userId: user?.id || '',
                      productName: formData.dossier || 'Simulation sans nom',
                      fob: parseFloat(formData.fob) || 0,
                      fret: parseFloat(formData.fret) || 0,
                      assurance: parseFloat(formData.assurance) || 0,
                      droitDouane: parseFloat(formData.droitDouane) || 0,
                      fraisFinanciers: parseFloat(formData.fraisFinanciers) || 0,
                      prestationTransitaire: parseFloat(formData.prestationTransitaire) || 0,
                      rpi: parseFloat(formData.rpi) || 0,
                      coc: parseFloat(formData.coc) || 0,
                      bsc: parseFloat(formData.bsc) || 0,
                      creditEnlevement: parseFloat(formData.creditEnlevement) || 0,
                      rrr: parseFloat(formData.rrr) || 0,
                      rcp: parseFloat(formData.rcp) || 0,
                      tsDouane: parseFloat(formData.tsDouane) || 0,
                      totalCost: 0,
                      currency: 'XAF',
                      status: 'in_progress' as const,
                      // Données pour la reprise exacte
                      activeTab,
                      maxStepReached,
                      formData,
                      autoCalculations,
                      criteria,
                      selectedActors,
                      articles,
                      correctionHistory,
                    };
                    
                    if (!simulationId) {
                      addSimulation(simulationData);
                    } else {
                      updateSimulation(simulationId, simulationData);
                    }
                    
                    // Naviguer vers le dashboard
                    navigate('/dashboard');
                  }}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-secondary text-white border border-cote-ivoire-secondary hover:bg-cote-ivoire-secondary/90"
                >
                  <Clock className="h-4 w-4" />
                  <span>Mettre en attente</span>
                </button>
              )}
              
              {/* Indicateur de validation de l'étape */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                canProceedToNext()
                  ? 'bg-cote-ivoire-success text-white border border-cote-ivoire-success'
                  : 'bg-cote-ivoire-primary text-white border border-cote-ivoire-primary'
              }`}>
                {canProceedToNext() ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Étape validée</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {activeTab === 'general' 
                        ? 'Remplissez tous les champs obligatoires (dossier, facture, dates)' 
                        : activeTab === 'transport'
                        ? 'Sélectionnez tous les champs de transport (mode, route, conteneur, poids, régime, paiement)'
                        : activeTab === 'actors'
                        ? 'Sélectionnez au moins un acteur (importateur, fournisseur ou transitaire)'
                        : activeTab === 'articles' 
                        ? 'Importez une facture pour continuer' 
                        : activeTab === 'costs'
                        ? 'Saisissez au moins le FOB ou le montant de facture'
                        : 'Complétez les champs requis'
                      }
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {getNextStep() ? (
                <button
                  onClick={() => {
                    console.log('=== CLIC BOUTON SUIVANT ===');
                    console.log('activeTab:', activeTab);
                    console.log('canProceedToNext():', canProceedToNext());
                    console.log('isResumedSimulation():', isResumedSimulation());
                    console.log('validateStep(activeTab):', validateStep(activeTab));
                    goToNextStep();
                  }}
                  disabled={!canProceedToNext()}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Bouton ${canProceedToNext() ? 'activé' : 'désactivé'} - activeTab: ${activeTab}, isResumed: ${isResumedSimulation()}`}
                >
                  <span>Suivant</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleCalculate}
                  disabled={loading || !user || user.remainingCredits < 1}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-success/50 text-cote-ivoire-success border border-cote-ivoire-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="h-5 w-5" />
                  <span>{loading ? 'Calcul en cours...' : isStep6Completed ? 'Générer les résultats' : 'Calculer le coût de revient prévisionnel'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddActorModal && (
        <AddActorModal
          type={addActorType}
          onClose={() => setShowAddActorModal(false)}
          onActorAdded={handleActorAdded}
        />
      )}

      {/* Modal de recherche de codes SH */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full border border-gray-300 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-cote-ivoire-primary rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Rechercher un code SH dans la table TEC</h3>
                    <p className="text-gray-600 text-sm">
                      Recherchez par code SH ou désignation pour corriger le code
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Interface de recherche */}
              <div className="space-y-4 mb-6">
                <div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchCodes(e.target.value)}
                    placeholder="Rechercher par code SH ou désignation..."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {searchResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-cote-ivoire-lighter rounded-lg hover:bg-cote-ivoire-light cursor-pointer"
                          onClick={() => handleSelectCodeHS(result.sh10Code, result.designation)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-cote-ivoire-primary">{result.sh10Code}</span>
                              <span className="text-gray-600">|</span>
                              <span className="text-gray-800 text-sm">{result.designation}</span>
                            </div>
                          </div>
                          <button className="text-cote-ivoire-success hover:text-cote-ivoire-success">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center text-gray-600 py-4">
                    Aucun résultat trouvé pour "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition-colors"
                >
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recherche TarifPORT */}
      {showTarifPORTSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full border border-gray-300 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-cote-ivoire-primary rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Rechercher une catégorie ou famille d'article</h3>
                    <p className="text-gray-600 text-sm">
                      Recherchez par libellé, TP ou code de redevance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTarifPORTSearchModal(false)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Interface de recherche */}
              <div className="space-y-4 mb-6">
                <div>
                  <input
                    type="text"
                    value={tarifPORTSearchQuery}
                    onChange={(e) => handleTarifPORTSearchQuery(e.target.value)}
                    placeholder="Rechercher par libellé, TP ou code de redevance..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-900 placeholder-gray-500"
                  />
                </div>

                {tarifPORTSearchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {tarifPORTSearchResults.map((article, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer border border-gray-200"
                          onClick={() => handleSelectTarifPORTArticle(article)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-cote-ivoire-primary font-medium">{article.tp}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-700 text-sm">{article.libelle_produit}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-600 text-xs">{article.coderedevance}</span>
                            </div>
                          </div>
                          <button className="text-cote-ivoire-success hover:text-green-700">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tarifPORTSearchQuery && tarifPORTSearchResults.length === 0 && (
                  <div className="text-center text-gray-600 py-4">
                    Aucun résultat trouvé pour "{tarifPORTSearchQuery}"
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTarifPORTSearchModal(false)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition-colors"
                >
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualInputModal && (
        <ManualInputModal
          missingCalculations={missingCalculations}
          onClose={() => setShowManualInputModal(false)}
          onSave={handleManualInputSave}
        />
      )}

      {showResult && result && (
        <CostResultModal
          result={result}
          onClose={() => {
            // S'assurer que le statut est bien mis Ã  jour Ã  'completed'
            if (simulationId) {
              updateSimulation(simulationId, {
                status: 'completed',
                updatedAt: new Date()
              });
              console.log('Statut de la simulation mis Ã  jour Ã  "completed"');
            }
            setShowResult(false);
            navigate('/dashboard');
          }}
        />
      )}

      {/* Modal de vérification de facture */}
      {showInvoiceVerificationModal && invoiceVerificationData && (
        <InvoiceVerificationModal
          isOpen={showInvoiceVerificationModal}
          onClose={handleInvoiceVerificationCancel}
          onConfirm={handleInvoiceVerificationConfirm}
          onGoBack={handleInvoiceVerificationGoBack}
          userData={invoiceVerificationData.userData}
          calculatedData={invoiceVerificationData.calculatedData}
          discrepancies={invoiceVerificationData.discrepancies}
        />
      )}

      {/* Modal des codes SH manquants */}
      {showMissingCodesModal && (
        <MissingCodesModal
          isOpen={showMissingCodesModal}
          onClose={handleMissingCodesCancel}
          onConfirm={handleMissingCodesConfirm}
          missingCodes={missingCodesData}
        />
      )}

      {/* Modal de confirmation de suppression d'article */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full border border-gray-300 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-cote-ivoire-primary rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
                  <p className="text-gray-600 text-sm">Suppression d'un article</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 mb-3">
                  ÃŠtes-vous sûr de vouloir supprimer cet article ?
                </p>
                <div className="bg-cote-ivoire-primary/30 border border-cote-ivoire-primary/50 rounded-lg p-4">
                  <p className="text-cote-ivoire-primary text-sm font-medium">
                    âš ï¸ Cette action est irréversible
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDeleteArticle}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition-colors"
                >
                  <span>Annuler</span>
                </button>
                <button
                  onClick={handleConfirmDeleteArticle}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-orange-600 transition-colors"
                >
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de vidage de table */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full border border-gray-300 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-cote-ivoire-primary rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirmer le vidage</h3>
                  <p className="text-gray-600 text-sm">Suppression de tous les articles</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 mb-3">
                  ÃŠtes-vous sûr de vouloir supprimer tous les articles ?
                </p>
                <div className="bg-cote-ivoire-primary/30 border border-cote-ivoire-primary/50 rounded-lg p-4">
                  <p className="text-cote-ivoire-primary text-sm font-medium">
                    âš ï¸ Cette action supprimera {articles.length} article(s) de manière irréversible
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelClearArticles}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-900/50 text-gray-800 border border-cote-ivoire-light hover:bg-white/50 transition-colors"
                >
                  <span>Annuler</span>
                </button>
                <button
                  onClick={handleConfirmClearArticles}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/50 text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/50 transition-colors"
                >
                  <span>Vider la table</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'avertissement pour incoterm */}
      {showIncotermWarningModal && incotermWarningData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full border border-gray-300 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Avertissement Incoterm</h3>
                  <p className="text-gray-600 text-sm">Incoterm {incotermWarningData.incoterm}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 mb-3">
                  Vous avez sélectionné l'incoterm <strong className="text-orange-400">{incotermWarningData.incoterm}</strong>.
                </p>
                <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-4">
                  <p className="text-orange-200 text-sm font-medium">
                    âš ï¸ Cet incoterm nécessite une saisie manuelle des valeurs suivantes :
                  </p>
                  <ul className="text-orange-200 text-sm mt-2 space-y-1">
                    {incotermWarningData.willDisableFret && (
                      <li>â€¢ <strong>Fret</strong> - Le calcul automatique sera désactivé</li>
                    )}
                    {incotermWarningData.willDisableAssurance && (
                      <li>â€¢ <strong>Assurance</strong> - Le calcul automatique sera désactivé</li>
                    )}
                  </ul>
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  Vous pourrez toujours saisir ces valeurs manuellement Ã  l'étape 1.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowIncotermWarningModal(false);
                    setIncotermWarningData(null);
                    // Réactiver les calculs automatiques
                    setAutoCalculations(prev => ({
                      ...prev,
                      fret: true,
                      assurance: true
                    }));
                    // Remettre l'incoterm Ã  vide
                    setFormData(prev => ({ ...prev, incoterm: '' }));
                  }}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-900/50 text-gray-800 border border-cote-ivoire-light hover:bg-white/50 transition-colors"
                >
                  <span>Annuler</span>
                </button>
                <button
                  onClick={() => {
                    setShowIncotermWarningModal(false);
                    setIncotermWarningData(null);
                    // Désactiver les calculs automatiques
                    setAutoCalculations(prev => ({
                      ...prev,
                      fret: false,
                      assurance: false
                    }));
                    // Remettre Ã  zéro les montants du fret et de l'assurance
                    setFormData(prev => ({
                      ...prev,
                      fret: '0',
                      assurance: '0'
                    }));
                  }}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-orange-900/50 text-orange-300 border border-orange-700 hover:bg-orange-800/50 transition-colors"
                >
                  <span>Continuer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'avertissement avant l'étape 6 */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full border border-gray-300 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-cote-ivoire-secondary rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Attention !</h3>
                  <p className="text-gray-600 text-sm">Étape finale</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 mb-3">
                  Vous êtes sur le point d'entrer dans l'<strong className="text-cote-ivoire-secondary">étape 6 - Coûts de revient prévisionnels</strong>, qui est l'étape finale de la simulation.
                </p>
                <div className="bg-cote-ivoire-secondary/30 border border-cote-ivoire-secondary/50 rounded-lg p-4">
                  <p className="text-cote-ivoire-secondary text-sm font-medium">
                    âš ï¸ Important : Une fois dans cette étape, vous ne pourrez plus revenir aux étapes précédentes.
                  </p>
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  Assurez-vous que toutes les informations des étapes précédentes sont correctes avant de continuer.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    setHasSeenWarning(true);
                    localStorage.setItem('hasSeenWarning', 'true');
                  }}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-900/50 text-gray-800 border border-cote-ivoire-light hover:bg-white/50 transition-colors"
                >
                  <span>Retour</span>
                </button>
                <button
                  onClick={confirmStep6Entry}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-secondary/50 text-cote-ivoire-secondary border border-cote-ivoire-secondary hover:bg-cote-ivoire-secondary/50 transition-colors"
                >
                  <span>Continuer vers l'étape 6</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation des dates */}
      {showDateValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full border border-gray-300 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Validation des dates</h3>
                  <p className="text-gray-600 text-sm">Erreur de saisie</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 mb-3">
                  {dateValidationMessage}
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-700 text-sm font-medium">
                    ðŸ’¡ Conseil : La date de la facture doit toujours Ãªtre antérieure ou égale Ã  la date de la transaction.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDateValidationModal(false)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 transition-colors"
                >
                  <span>Compris</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal avertissement dernier crédit */}
      {showLastCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full border border-cote-ivoire-light shadow-2xl">
            <div className="p-6 border-b border-cote-ivoire-light bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-success/10 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900">Dernier crédit disponible</h3>
              <p className="text-sm text-gray-700 mt-1">Après cette simulation, vous devrez acheter de nouveaux crédits pour continuer.</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cote-ivoire-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cote-ivoire-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">Il vous reste <span className="font-semibold text-cote-ivoire-primary">{user?.remainingCredits ?? 0}</span> crédit{(user?.remainingCredits ?? 0) > 1 ? 's' : ''}. La simulation actuelle utilisera ce crédit.</p>
                  <p className="text-gray-600 text-sm mt-1">Vous pourrez souscrire un nouveau plan ou acheter des crédits supplémentaires Ã  la fin.</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-cote-ivoire-light flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLastCreditModal(false)}
                className="px-3 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-cote-ivoire-light hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => { setShowLastCreditModal(false); setTimeout(() => handleCalculate(), 0); }}
                className="px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-success text-white hover:opacity-90"
                disabled={user && user.remainingCredits < 1}
              >
                Continuer
              </button>
              <button
                onClick={() => { setShowLastCreditModal(false); navigate('/plans'); }}
                className="px-3 py-2 rounded-full text-sm font-medium bg-white text-cote-ivoire-primary border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/10"
              >
                Voir les offres
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulatorForm;


