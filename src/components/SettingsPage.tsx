import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Info, Upload, Download, Trash2, Database, FileText, AlertCircle, Gavel } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TECArticle } from '../types/tec';
import { VOCProduct } from '../types/voc';
import { TarifPORTProduct } from '../types/tarifport';
import { loadSampleTECData } from '../data/tecSampleData';
import TECDataTable from './Settings/TECDataTable';
import VOCDataTable from './Settings/VOCDataTable';
import TarifPORTDataTable from './Settings/TarifPORTDataTable';
import { loadSampleVOCData } from '../data/vocSampleData';
import { loadSampleTarifPORTData } from '../data/tarifportSampleData';
import AdminDecisionsSettings from './Settings/AdminDecisionsSettings';
import TestAdminDecisions from './TestAdminDecisions';
import { referenceDataService } from '../services/supabase/referenceDataService';
import { useAdmin } from '../hooks/useAdmin';

const InfoTooltip: React.FC<{ text: string }>= ({ text }) => (
  <span className="group relative inline-flex items-center cursor-help ml-2 align-middle">
    <span
      tabIndex={0}
      aria-label="Aide"
      className="p-1.5 rounded-full bg-gray-200/80 border border-gray-400 text-gray-600 group-hover:text-cote-ivoire-primary group-hover:border-cote-ivoire-primary focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary transition-colors"
    >
      <Info className="h-4 w-4" />
    </span>
    <span className="pointer-events-none absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-96 max-w-[28rem] bg-white text-gray-800 text-sm leading-relaxed p-4 rounded-xl border border-cote-ivoire-warning shadow-cote-ivoire-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
      {text}
      <span className="absolute top-full left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-l border-b border-cote-ivoire-warning rotate-45"></span>
    </span>
  </span>
);

// Helper pour convertir une valeur en string avec une valeur par défaut
const safeToString = (value: any, defaultValue: string = '0'): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  
  // ⚠️ TOUS LES HOOKS DOIVENT ÊTRE APPELÉS AVANT TOUT RETURN CONDITIONNEL
  // Afficher un loader seulement pendant le chargement initial (max 3 secondes)
  const [showLoader, setShowLoader] = useState(true);
  
  // États pour les paramètres de calcul (TOUS les useState doivent être avant le return)
  const [exw, setExw] = useState(safeToString(settings?.fobMultiplierEXW, '1.03'));
  const [fca, setFca] = useState(safeToString(settings?.fobMultiplierFCA, '1.05'));
  const [assValMul, setAssValMul] = useState(safeToString(settings?.assuranceValueMultiplier, '1.1'));
  const [ordRiskRate, setOrdRiskRate] = useState(safeToString(settings?.ordinaryRiskRate, '0.005'));
  const [ordRiskMin, setOrdRiskMin] = useState(safeToString(settings?.ordinaryRiskMinimum, '50000'));
  const [accessories, setAccessories] = useState(safeToString(settings?.accessoriesFlat, '0'));
  const [bscTC20, setBscTC20] = useState(safeToString(settings?.bscRateTC20, '0'));
  const [bscTC40, setBscTC40] = useState(safeToString(settings?.bscRateTC40, '0'));
  const [bscTC40HQ, setBscTC40HQ] = useState(safeToString(settings?.bscRateTC40HQ, '0'));
  const [bscConventionnel, setBscConventionnel] = useState(safeToString(settings?.bscRateConventionnel, '0'));
  const [bscGroupage, setBscGroupage] = useState(safeToString(settings?.bscRateGroupage, '0'));
 
  // États pour la gestion des fichiers Excel
  const [isUploadingTEC, setIsUploadingTEC] = useState(false);
  const [isUploadingVOC, setIsUploadingVOC] = useState(false);
  const [isUploadingTarifPORT, setIsUploadingTarifPORT] = useState(false);
  const [tecCount, setTecCount] = useState(0);
  const [vocCount, setVocCount] = useState(0);
  const [tarifportCount, setTarifportCount] = useState(0);
  const [activeTab, setActiveTab] = useState('fob');
  const [cafFraisImprevusRate, setCafFraisImprevusRate] = useState(safeToString(settings?.cafFraisImprevusRate, '0'));
  const [rpiThresholdMin, setRpiThresholdMin] = useState(safeToString(settings?.rpiThresholdMin, '0'));
  const [rpiThresholdMid, setRpiThresholdMid] = useState(safeToString(settings?.rpiThresholdMid, '0'));
  const [rpiFlatMid, setRpiFlatMid] = useState(safeToString(settings?.rpiFlatMid, '0'));

  const [cocThreshold, setCocThreshold] = useState(safeToString(settings?.cocThreshold, '0'));
  const [cocRateRouteA, setCocRateRouteA] = useState(safeToString(settings?.cocRateRouteA, '0'));
  const [cocMinRouteA, setCocMinRouteA] = useState(safeToString(settings?.cocMinRouteA, '0'));
  const [cocMaxRouteA, setCocMaxRouteA] = useState(safeToString(settings?.cocMaxRouteA, '0'));
  const [cocRateRouteB, setCocRateRouteB] = useState(safeToString(settings?.cocRateRouteB, '0'));
  const [cocMinRouteB, setCocMinRouteB] = useState(safeToString(settings?.cocMinRouteB, '0'));
  const [cocMaxRouteB, setCocMaxRouteB] = useState(safeToString(settings?.cocMaxRouteB, '0'));
  const [cocRateRouteC, setCocRateRouteC] = useState(safeToString(settings?.cocRateRouteC, '0'));
  const [cocMinRouteC, setCocMinRouteC] = useState(safeToString(settings?.cocMinRouteC, '0'));
  const [cocMaxRouteC, setCocMaxRouteC] = useState(safeToString(settings?.cocMaxRouteC, '0'));
  
  // États pour les paramètres des frais financiers - Virement bancaire
  const [fraisFinanciersVirementOuvertureDossier, setFraisFinanciersVirementOuvertureDossier] = useState(safeToString(settings?.fraisFinanciersVirementOuvertureDossier, '0'));
  const [fraisFinanciersVirementDossier, setFraisFinanciersVirementDossier] = useState(safeToString(settings?.fraisFinanciersVirementDossier, '0'));
  const [fraisFinanciersVirementSwift, setFraisFinanciersVirementSwift] = useState(safeToString(settings?.fraisFinanciersVirementSwift, '0'));
  const [fraisFinanciersVirementPhotocopie, setFraisFinanciersVirementPhotocopie] = useState(safeToString(settings?.fraisFinanciersVirementPhotocopie, '0'));
  
  // États pour les paramètres des frais financiers - Remise documentaire
  const [fraisFinanciersRemiseOuvertureDossier, setFraisFinanciersRemiseOuvertureDossier] = useState(safeToString(settings?.fraisFinanciersRemiseOuvertureDossier, '0'));
  const [fraisFinanciersRemiseDossier, setFraisFinanciersRemiseDossier] = useState(safeToString(settings?.fraisFinanciersRemiseDossier, '0'));
  const [fraisFinanciersRemiseSwift, setFraisFinanciersRemiseSwift] = useState(safeToString(settings?.fraisFinanciersRemiseSwift, '0'));
  const [fraisFinanciersRemisePhotocopie, setFraisFinanciersRemisePhotocopie] = useState(safeToString(settings?.fraisFinanciersRemisePhotocopie, '0'));
  const [fraisFinanciersRemiseImpaye, setFraisFinanciersRemiseImpaye] = useState(safeToString(settings?.fraisFinanciersRemiseImpaye, '0'));
  const [fraisFinanciersRemiseCourrierExpress, setFraisFinanciersRemiseCourrierExpress] = useState(safeToString(settings?.fraisFinanciersRemiseCourrierExpress, '0'));
  const [fraisFinanciersRemiseCommissionProrogatoire, setFraisFinanciersRemiseCommissionProrogatoire] = useState(safeToString(settings?.fraisFinanciersRemiseCommissionProrogatoire, '0'));
  const [fraisFinanciersRemiseCommissionChange, setFraisFinanciersRemiseCommissionChange] = useState(safeToString(settings?.fraisFinanciersRemiseCommissionChange, '0'));
  const [fraisFinanciersRemiseCommissionSeuil, setFraisFinanciersRemiseCommissionSeuil] = useState(safeToString(settings?.fraisFinanciersRemiseCommissionSeuil, '0'));
  const [fraisFinanciersRemiseCommissionTaux, setFraisFinanciersRemiseCommissionTaux] = useState(safeToString(settings?.fraisFinanciersRemiseCommissionTaux, '0'));
  
  // États pour les paramètres des frais financiers - Crédit documentaire
  const [fraisFinanciersCreditOuvertureDossier, setFraisFinanciersCreditOuvertureDossier] = useState(safeToString(settings?.fraisFinanciersCreditOuvertureDossier, '0'));
  const [fraisFinanciersCreditConfirmation, setFraisFinanciersCreditConfirmation] = useState(safeToString(settings?.fraisFinanciersCreditConfirmation, '0'));
  const [fraisFinanciersCreditDossier, setFraisFinanciersCreditDossier] = useState(safeToString(settings?.fraisFinanciersCreditDossier, '0'));
  const [fraisFinanciersCreditSwift, setFraisFinanciersCreditSwift] = useState(safeToString(settings?.fraisFinanciersCreditSwift, '0'));
  const [fraisFinanciersCreditRealisation, setFraisFinanciersCreditRealisation] = useState(safeToString(settings?.fraisFinanciersCreditRealisation, '0'));
  const [fraisFinanciersCreditPhotocopie, setFraisFinanciersCreditPhotocopie] = useState(safeToString(settings?.fraisFinanciersCreditPhotocopie, '0'));
  const [fraisFinanciersCreditAcceptance, setFraisFinanciersCreditAcceptance] = useState(safeToString(settings?.fraisFinanciersCreditAcceptance, '0'));
  const [fraisFinanciersCreditNegociation, setFraisFinanciersCreditNegociation] = useState(safeToString(settings?.fraisFinanciersCreditNegociation, '0'));
  const [fraisFinanciersCreditCommissionPaiement, setFraisFinanciersCreditCommissionPaiement] = useState(safeToString(settings?.fraisFinanciersCreditCommissionPaiement, '0'));
  const [fraisFinanciersCreditCommission, setFraisFinanciersCreditCommission] = useState(safeToString(settings?.fraisFinanciersCreditCommission, '0'));
  const [fraisFinanciersCreditTaxeBceao, setFraisFinanciersCreditTaxeBceao] = useState(safeToString(settings?.fraisFinanciersCreditTaxeBceao, '0'));
  const [tsDouane, setTsDouane] = useState(safeToString(settings?.tsDouane, '0'));

  // États pour les paramètres du fret - Conteneur 20 pieds
  const [fret20ReceptionDechargement, setFret20ReceptionDechargement] = useState(settings.fret20ReceptionDechargement?.toString() || '75');
  const [fret20DossierDouaneT1, setFret20DossierDouaneT1] = useState(settings.fret20DossierDouaneT1?.toString() || '25');
  const [fret20FraisFixe, setFret20FraisFixe] = useState(settings.fret20FraisFixe?.toString() || '45');
  const [fret20CommissionTransit, setFret20CommissionTransit] = useState(settings.fret20CommissionTransit?.toString() || '75');
  const [fret20FraisTractionTC, setFret20FraisTractionTC] = useState(settings.fret20FraisTractionTC?.toString() || '175');
  const [fret20FraisDouaneAppurement, setFret20FraisDouaneAppurement] = useState(settings.fret20FraisDouaneAppurement?.toString() || '40');
  const [fret20FraisManutentionQuai, setFret20FraisManutentionQuai] = useState(settings.fret20FraisManutentionQuai?.toString() || '220');
  const [fret20Empotage, setFret20Empotage] = useState(settings.fret20Empotage?.toString() || '370');
  const [fret20FretBase, setFret20FretBase] = useState(settings.fret20FretBase?.toString() || '370');
  const [fret20CAF, setFret20CAF] = useState(settings.fret20CAF?.toString() || '0');
  const [fret20BAFMaritime, setFret20BAFMaritime] = useState(settings.fret20BAFMaritime?.toString() || '300');
  const [fret20SupplementOT, setFret20SupplementOT] = useState(settings.fret20SupplementOT?.toString() || '500');
  const [fret20SupplementProduitDangereux, setFret20SupplementProduitDangereux] = useState(settings.fret20SupplementProduitDangereux?.toString() || '85');
  const [fret20EBS, setFret20EBS] = useState(settings.fret20EBS?.toString() || '75');
  const [fret20GestionBSC, setFret20GestionBSC] = useState(settings.fret20GestionBSC?.toString() || '55');
  const [fret20EmissionBL, setFret20EmissionBL] = useState(settings.fret20EmissionBL?.toString() || '50');
  const [fret20FraisDouaneExport, setFret20FraisDouaneExport] = useState(settings.fret20FraisDouaneExport?.toString() || '50');
  const [fret20SurchargeProduitDangereux, setFret20SurchargeProduitDangereux] = useState(settings.fret20SurchargeProduitDangereux?.toString() || '200');
  const [fret20FretSecurite, setFret20FretSecurite] = useState(settings.fret20FretSecurite?.toString() || '4');
  const [fret20SureteISPS, setFret20SureteISPS] = useState(settings.fret20SureteISPS?.toString() || '9');

  // États pour les paramètres du fret - Conteneur 40 pieds
  const [fret40ReceptionDechargement, setFret40ReceptionDechargement] = useState(settings.fret40ReceptionDechargement?.toString() || '75');
  const [fret40DossierDouaneT1, setFret40DossierDouaneT1] = useState(settings.fret40DossierDouaneT1?.toString() || '25');
  const [fret40FraisFixe, setFret40FraisFixe] = useState(settings.fret40FraisFixe?.toString() || '45');
  const [fret40CommissionTransit, setFret40CommissionTransit] = useState(settings.fret40CommissionTransit?.toString() || '75');
  const [fret40FraisTractionTC, setFret40FraisTractionTC] = useState(settings.fret40FraisTractionTC?.toString() || '175');
  const [fret40FraisDouaneAppurement, setFret40FraisDouaneAppurement] = useState(settings.fret40FraisDouaneAppurement?.toString() || '40');
  const [fret40FraisManutentionQuai, setFret40FraisManutentionQuai] = useState(settings.fret40FraisManutentionQuai?.toString() || '220');
  const [fret40Empotage, setFret40Empotage] = useState(settings.fret40Empotage?.toString() || '370');
  const [fret40FretBase, setFret40FretBase] = useState(settings.fret40FretBase?.toString() || '370');
  const [fret40CAF, setFret40CAF] = useState(settings.fret40CAF?.toString() || '0');
  const [fret40BAFMaritime, setFret40BAFMaritime] = useState(settings.fret40BAFMaritime?.toString() || '300');
  const [fret40SupplementOT, setFret40SupplementOT] = useState(settings.fret40SupplementOT?.toString() || '500');
  const [fret40SupplementProduitDangereux, setFret40SupplementProduitDangereux] = useState(settings.fret40SupplementProduitDangereux?.toString() || '85');
  const [fret40EBS, setFret40EBS] = useState(settings.fret40EBS?.toString() || '75');
  const [fret40GestionBSC, setFret40GestionBSC] = useState(settings.fret40GestionBSC?.toString() || '55');
  const [fret40EmissionBL, setFret40EmissionBL] = useState(settings.fret40EmissionBL?.toString() || '50');
  const [fret40FraisDouaneExport, setFret40FraisDouaneExport] = useState(settings.fret40FraisDouaneExport?.toString() || '50');
  const [fret40SurchargeProduitDangereux, setFret40SurchargeProduitDangereux] = useState(settings.fret40SurchargeProduitDangereux?.toString() || '200');
  const [fret40FretSecurite, setFret40FretSecurite] = useState(settings.fret40FretSecurite?.toString() || '4');
  const [fret40SureteISPS, setFret40SureteISPS] = useState(settings.fret40SureteISPS?.toString() || '9');

  // États pour les paramètres de la prestation transitaire
  const [transitaireDiversDebours, setTransitaireDiversDebours] = useState(settings.transitaireDiversDebours?.toString() || '50000');
  const [transitaireFraisEtablissementFDI, setTransitaireFraisEtablissementFDI] = useState(settings.transitaireFraisEtablissementFDI?.toString() || '14500');
  const [transitaireFraisRFCV, setTransitaireFraisRFCV] = useState(settings.transitaireFraisRFCV?.toString() || '14500');
  const [transitaireAcconageImportTEU, setTransitaireAcconageImportTEU] = useState(settings.transitaireAcconageImportTEU?.toString() || '50000');
  const [transitaireDiversDebours2, setTransitaireDiversDebours2] = useState(settings.transitaireDiversDebours2?.toString() || '50000');
  const [transitaireEchangeBL, setTransitaireEchangeBL] = useState(settings.transitaireEchangeBL?.toString() || '50000');
  const [transitaireNettoyageTC20, setTransitaireNettoyageTC20] = useState(settings.transitaireNettoyageTC20?.toString() || '5000');
  const [transitaireNettoyageTC40, setTransitaireNettoyageTC40] = useState(settings.transitaireNettoyageTC40?.toString() || '10000');
  const [transitaireTaxeISPS20, setTransitaireTaxeISPS20] = useState(settings.transitaireTaxeISPS20?.toString() || '14500');
  const [transitaireTaxeISPS40, setTransitaireTaxeISPS40] = useState(settings.transitaireTaxeISPS40?.toString() || '29000');
  const [transitaireScanner, setTransitaireScanner] = useState(settings.transitaireScanner?.toString() || '0');
  const [transitaireTimbreBL, setTransitaireTimbreBL] = useState(settings.transitaireTimbreBL?.toString() || '5000');
  const [transitaireConteneurServiceCharge, setTransitaireConteneurServiceCharge] = useState(settings.transitaireConteneurServiceCharge?.toString() || '25000');
  const [transitaireOuvertureDossier, setTransitaireOuvertureDossier] = useState(settings.transitaireOuvertureDossier?.toString() || '8250');
  const [transitaireCommissionAvanceFonds, setTransitaireCommissionAvanceFonds] = useState(settings.transitaireCommissionAvanceFonds?.toString() || '0.0195');
  const [transitaireImprimerFax, setTransitaireImprimerFax] = useState(settings.transitaireImprimerFax?.toString() || '5434');
  const [transitaireCommissionTransit, setTransitaireCommissionTransit] = useState(settings.transitaireCommissionTransit?.toString() || '29250');
  const [transitaireTaxeSydam, setTransitaireTaxeSydam] = useState(settings.transitaireTaxeSydam?.toString() || '19500');
  
  // États pour les paramètres HAD selon valeur CAF
  const [transitaireHADSeuil1, setTransitaireHADSeuil1] = useState(settings.transitaireHADSeuil1?.toString() || '5000000');
  const [transitaireHADSeuil2, setTransitaireHADSeuil2] = useState(settings.transitaireHADSeuil2?.toString() || '10000000');
  const [transitaireHADSeuil3, setTransitaireHADSeuil3] = useState(settings.transitaireHADSeuil3?.toString() || '25000000');
  const [transitaireHADSeuil4, setTransitaireHADSeuil4] = useState(settings.transitaireHADSeuil4?.toString() || '50000000');
  const [transitaireHADTaux1, setTransitaireHADTaux1] = useState(settings.transitaireHADTaux1?.toString() || '0.018');
  const [transitaireHADTaux2, setTransitaireHADTaux2] = useState(settings.transitaireHADTaux2?.toString() || '0.013');
  const [transitaireHADTaux3, setTransitaireHADTaux3] = useState(settings.transitaireHADTaux3?.toString() || '0.007');
  const [transitaireHADTaux4, setTransitaireHADTaux4] = useState(settings.transitaireHADTaux4?.toString() || '0.0046');
  const [transitaireHADTaux5, setTransitaireHADTaux5] = useState(settings.transitaireHADTaux5?.toString() || '0.0026');
  const [transitaireHADFraisFixe1, setTransitaireHADFraisFixe1] = useState(settings.transitaireHADFraisFixe1?.toString() || '45500');
  const [transitaireHADFraisFixe2, setTransitaireHADFraisFixe2] = useState(settings.transitaireHADFraisFixe2?.toString() || '71500');
  const [transitaireHADFraisFixe3, setTransitaireHADFraisFixe3] = useState(settings.transitaireHADFraisFixe3?.toString() || '130000');
  const [transitaireHADFraisFixe4, setTransitaireHADFraisFixe4] = useState(settings.transitaireHADFraisFixe4?.toString() || '195000');
  const [transitaireHADFraisFixe5, setTransitaireHADFraisFixe5] = useState(settings.transitaireHADFraisFixe5?.toString() || '292500');
  
  // États pour les paramètres de livraison selon zone et type de conteneur
  const [transitaireLivraison20Zone1, setTransitaireLivraison20Zone1] = useState(settings.transitaireLivraison20Zone1?.toString() || '66000');
  const [transitaireLivraison20Zone2, setTransitaireLivraison20Zone2] = useState(settings.transitaireLivraison20Zone2?.toString() || '100000');
  const [transitaireLivraison20Zone3, setTransitaireLivraison20Zone3] = useState(settings.transitaireLivraison20Zone3?.toString() || '134000');
  const [transitaireLivraison40Zone1, setTransitaireLivraison40Zone1] = useState(settings.transitaireLivraison40Zone1?.toString() || '132000');
  const [transitaireLivraison40Zone2, setTransitaireLivraison40Zone2] = useState(settings.transitaireLivraison40Zone2?.toString() || '200000');
  const [transitaireLivraison40Zone3, setTransitaireLivraison40Zone3] = useState(settings.transitaireLivraison40Zone3?.toString() || '264000');
  
  // États pour les paramètres de relevage selon zone et type de conteneur
  const [transitaireRelevage20Zone1, setTransitaireRelevage20Zone1] = useState(settings.transitaireRelevage20Zone1?.toString() || '25000');
  const [transitaireRelevage20Zone2, setTransitaireRelevage20Zone2] = useState(settings.transitaireRelevage20Zone2?.toString() || '30000');
  const [transitaireRelevage20Zone3, setTransitaireRelevage20Zone3] = useState(settings.transitaireRelevage20Zone3?.toString() || '30000');
  const [transitaireRelevage40Zone1, setTransitaireRelevage40Zone1] = useState(settings.transitaireRelevage40Zone1?.toString() || '50000');
  const [transitaireRelevage40Zone2, setTransitaireRelevage40Zone2] = useState(settings.transitaireRelevage40Zone2?.toString() || '60000');
  const [transitaireRelevage40Zone3, setTransitaireRelevage40Zone3] = useState(settings.transitaireRelevage40Zone3?.toString() || '60000');

  // ⚠️ TOUS LES HOOKS (useEffect) DOIVENT ÊTRE APRÈS TOUS LES useState ET AVANT TOUT RETURN
  // useEffect pour gérer le loader
  useEffect(() => {
    // Si le chargement est terminé, masquer le loader rapidement
    if (!settingsLoading) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [settingsLoading]);
  
  // Timeout de sécurité : masquer le loader après 3 secondes même si loading est true
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout du chargement des paramètres, affichage avec valeurs par défaut');
      setShowLoader(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // ⚠️ MAINTENANT ON PEUT FAIRE LE RETURN CONDITIONNEL APRÈS TOUS LES HOOKS
  // Afficher le loader seulement si vraiment en cours de chargement ET moins de 3 secondes
  if (showLoader && settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
          <p className="text-sm text-gray-400 mt-2">Si cela prend trop de temps, vérifiez la console (F12)</p>
        </div>
      </div>
    );
  }

  // Fonction pour charger les compteurs depuis Supabase
  const loadReferenceDataCounts = async () => {
    try {
      // Charger TEC
      const tecData = await referenceDataService.getReferenceData('tec');
      setTecCount(tecData?.data ? (Array.isArray(tecData.data) ? tecData.data.length : 0) : 0);

      // Charger VOC
      const vocData = await referenceDataService.getReferenceData('voc');
      setVocCount(vocData?.data ? (Array.isArray(vocData.data) ? vocData.data.length : 0) : 0);

      // Charger TarifPORT
      const tarifportData = await referenceDataService.getReferenceData('tarifport');
      setTarifportCount(tarifportData?.data ? (Array.isArray(tarifportData.data) ? tarifportData.data.length : 0) : 0);
    } catch (error) {
      console.error('Erreur lors du chargement des données de référence:', error);
      // Fallback vers localStorage pour migration progressive
      const tecArticles = localStorage.getItem('tecArticles');
      const vocProducts = localStorage.getItem('vocProducts');
      const tarifportProducts = localStorage.getItem('tarifportProducts');
      setTecCount(tecArticles ? JSON.parse(tecArticles).length : 0);
      setVocCount(vocProducts ? JSON.parse(vocProducts).length : 0);
      setTarifportCount(tarifportProducts ? JSON.parse(tarifportProducts).length : 0);
    }
  };

  // useEffect pour charger les paramètres depuis settings
  useEffect(() => {
    // Ne pas charger si settings n'est pas encore chargé
    if (!settings || Object.keys(settings).length === 0) {
      return;
    }

    // Charger les valeurs depuis les paramètres
    setExw(safeToString(settings.fobMultiplierEXW, '1.03'));
    setFca(safeToString(settings.fobMultiplierFCA, '1.05'));
    setAssValMul(safeToString(settings.assuranceValueMultiplier, '1.1'));
    setOrdRiskRate(safeToString(settings.ordinaryRiskRate, '0.005'));
    setOrdRiskMin(safeToString(settings.ordinaryRiskMinimum, '50000'));
    setAccessories(safeToString(settings.accessoriesFlat, '0'));
    setBscTC20(safeToString(settings.bscRateTC20, '0'));
    setBscTC40(safeToString(settings.bscRateTC40, '0'));
    setBscTC40HQ(safeToString(settings.bscRateTC40HQ, '0'));
    setBscConventionnel(safeToString(settings.bscRateConventionnel, '0'));
    setBscGroupage(safeToString(settings.bscRateGroupage, '0'));

    // Charger les compteurs TEC, VOC et TarifPORT depuis Supabase
    loadReferenceDataCounts();
    setRpiThresholdMin(safeToString(settings.rpiThresholdMin, '0'));
    setRpiThresholdMid(safeToString(settings.rpiThresholdMid, '0'));
    setCafFraisImprevusRate(safeToString(settings.cafFraisImprevusRate, '0'));
    setRpiFlatMid(safeToString(settings.rpiFlatMid, '0'));
    setCocThreshold(safeToString(settings.cocThreshold, '0'));
    setCocRateRouteA(safeToString(settings.cocRateRouteA, '0'));
    setCocMinRouteA(safeToString(settings.cocMinRouteA, '0'));
    setCocMaxRouteA(safeToString(settings.cocMaxRouteA, '0'));
    setCocRateRouteB(safeToString(settings.cocRateRouteB, '0'));
    setCocMinRouteB(safeToString(settings.cocMinRouteB, '0'));
    setCocMaxRouteB(safeToString(settings.cocMaxRouteB, '0'));
    setCocRateRouteC(safeToString(settings.cocRateRouteC, '0'));
    setCocMinRouteC(safeToString(settings.cocMinRouteC, '0'));
    setCocMaxRouteC(safeToString(settings.cocMaxRouteC, '0'));
    
    // Charger les paramètres des frais financiers - Virement bancaire
    setFraisFinanciersVirementOuvertureDossier(safeToString(settings.fraisFinanciersVirementOuvertureDossier, '0'));
    setFraisFinanciersVirementDossier(safeToString(settings.fraisFinanciersVirementDossier, '0'));
    setFraisFinanciersVirementSwift(safeToString(settings.fraisFinanciersVirementSwift, '0'));
    setFraisFinanciersVirementPhotocopie(safeToString(settings.fraisFinanciersVirementPhotocopie, '0'));
    
    // Charger les paramètres des frais financiers - Remise documentaire
    setFraisFinanciersRemiseOuvertureDossier(safeToString(settings.fraisFinanciersRemiseOuvertureDossier, '0'));
    setFraisFinanciersRemiseDossier(safeToString(settings.fraisFinanciersRemiseDossier, '0'));
    setFraisFinanciersRemiseSwift(safeToString(settings.fraisFinanciersRemiseSwift, '0'));
    setFraisFinanciersRemisePhotocopie(safeToString(settings.fraisFinanciersRemisePhotocopie, '0'));
    setFraisFinanciersRemiseImpaye(safeToString(settings.fraisFinanciersRemiseImpaye, '0'));
    setFraisFinanciersRemiseCourrierExpress(safeToString(settings.fraisFinanciersRemiseCourrierExpress, '0'));
    setFraisFinanciersRemiseCommissionProrogatoire(safeToString(settings.fraisFinanciersRemiseCommissionProrogatoire, '0'));
    setFraisFinanciersRemiseCommissionChange(safeToString(settings.fraisFinanciersRemiseCommissionChange, '0'));
    setFraisFinanciersRemiseCommissionSeuil(safeToString(settings.fraisFinanciersRemiseCommissionSeuil, '0'));
    setFraisFinanciersRemiseCommissionTaux(safeToString(settings.fraisFinanciersRemiseCommissionTaux, '0'));
    
    // Charger les paramètres des frais financiers - Crédit documentaire
    setFraisFinanciersCreditOuvertureDossier(safeToString(settings.fraisFinanciersCreditOuvertureDossier, '0'));
    setFraisFinanciersCreditConfirmation(safeToString(settings.fraisFinanciersCreditConfirmation, '0'));
    setFraisFinanciersCreditDossier(safeToString(settings.fraisFinanciersCreditDossier, '0'));
    setFraisFinanciersCreditSwift(safeToString(settings.fraisFinanciersCreditSwift, '0'));
    setFraisFinanciersCreditRealisation(safeToString(settings.fraisFinanciersCreditRealisation, '0'));
    setFraisFinanciersCreditPhotocopie(safeToString(settings.fraisFinanciersCreditPhotocopie, '0'));
    setFraisFinanciersCreditAcceptance(safeToString(settings.fraisFinanciersCreditAcceptance, '0'));
    setFraisFinanciersCreditNegociation(safeToString(settings.fraisFinanciersCreditNegociation, '0'));
    setFraisFinanciersCreditCommissionPaiement(safeToString(settings.fraisFinanciersCreditCommissionPaiement, '0'));
    setFraisFinanciersCreditCommission(safeToString(settings.fraisFinanciersCreditCommission, '0'));
    setFraisFinanciersCreditTaxeBceao(safeToString(settings.fraisFinanciersCreditTaxeBceao, '0'));
    setTsDouane(safeToString(settings.tsDouane, '0'));
    
    // Charger les paramètres du fret - Conteneur 20 pieds
    setFret20ReceptionDechargement(settings.fret20ReceptionDechargement?.toString() || '75');
    setFret20DossierDouaneT1(settings.fret20DossierDouaneT1?.toString() || '25');
    setFret20FraisFixe(settings.fret20FraisFixe?.toString() || '45');
    setFret20CommissionTransit(settings.fret20CommissionTransit?.toString() || '75');
    setFret20FraisTractionTC(settings.fret20FraisTractionTC?.toString() || '175');
    setFret20FraisDouaneAppurement(settings.fret20FraisDouaneAppurement?.toString() || '40');
    setFret20FraisManutentionQuai(settings.fret20FraisManutentionQuai?.toString() || '220');
    setFret20Empotage(settings.fret20Empotage?.toString() || '370');
    setFret20FretBase(settings.fret20FretBase?.toString() || '370');
    setFret20CAF(settings.fret20CAF?.toString() || '0');
    setFret20BAFMaritime(settings.fret20BAFMaritime?.toString() || '300');
    setFret20SupplementOT(settings.fret20SupplementOT?.toString() || '500');
    setFret20SupplementProduitDangereux(settings.fret20SupplementProduitDangereux?.toString() || '85');
    setFret20EBS(settings.fret20EBS?.toString() || '75');
    setFret20GestionBSC(settings.fret20GestionBSC?.toString() || '55');
    setFret20EmissionBL(settings.fret20EmissionBL?.toString() || '50');
    setFret20FraisDouaneExport(settings.fret20FraisDouaneExport?.toString() || '50');
    setFret20SurchargeProduitDangereux(settings.fret20SurchargeProduitDangereux?.toString() || '200');
    setFret20FretSecurite(settings.fret20FretSecurite?.toString() || '4');
    setFret20SureteISPS(settings.fret20SureteISPS?.toString() || '9');
    
    // Charger les paramètres du fret - Conteneur 40 pieds
    setFret40ReceptionDechargement(settings.fret40ReceptionDechargement?.toString() || '75');
    setFret40DossierDouaneT1(settings.fret40DossierDouaneT1?.toString() || '25');
    setFret40FraisFixe(settings.fret40FraisFixe?.toString() || '45');
    setFret40CommissionTransit(settings.fret40CommissionTransit?.toString() || '75');
    setFret40FraisTractionTC(settings.fret40FraisTractionTC?.toString() || '175');
    setFret40FraisDouaneAppurement(settings.fret40FraisDouaneAppurement?.toString() || '40');
    setFret40FraisManutentionQuai(settings.fret40FraisManutentionQuai?.toString() || '220');
    setFret40Empotage(settings.fret40Empotage?.toString() || '370');
    setFret40FretBase(settings.fret40FretBase?.toString() || '370');
    setFret40CAF(settings.fret40CAF?.toString() || '0');
    setFret40BAFMaritime(settings.fret40BAFMaritime?.toString() || '300');
    setFret40SupplementOT(settings.fret40SupplementOT?.toString() || '500');
    setFret40SupplementProduitDangereux(settings.fret40SupplementProduitDangereux?.toString() || '85');
    setFret40EBS(settings.fret40EBS?.toString() || '75');
    setFret40GestionBSC(settings.fret40GestionBSC?.toString() || '55');
    setFret40EmissionBL(settings.fret40EmissionBL?.toString() || '50');
    setFret40FraisDouaneExport(settings.fret40FraisDouaneExport?.toString() || '50');
    setFret40SurchargeProduitDangereux(settings.fret40SurchargeProduitDangereux?.toString() || '200');
    setFret40FretSecurite(settings.fret40FretSecurite?.toString() || '4');
    setFret40SureteISPS(settings.fret40SureteISPS?.toString() || '9');
    
    // Charger les paramètres de la prestation transitaire
    setTransitaireDiversDebours(settings.transitaireDiversDebours?.toString() || '50000');
    setTransitaireFraisEtablissementFDI(settings.transitaireFraisEtablissementFDI?.toString() || '14500');
    setTransitaireFraisRFCV(settings.transitaireFraisRFCV?.toString() || '14500');
    setTransitaireAcconageImportTEU(settings.transitaireAcconageImportTEU?.toString() || '50000');
    setTransitaireDiversDebours2(settings.transitaireDiversDebours2?.toString() || '50000');
    setTransitaireEchangeBL(settings.transitaireEchangeBL?.toString() || '50000');
    setTransitaireNettoyageTC20(settings.transitaireNettoyageTC20?.toString() || '5000');
    setTransitaireNettoyageTC40(settings.transitaireNettoyageTC40?.toString() || '10000');
    setTransitaireTaxeISPS20(settings.transitaireTaxeISPS20?.toString() || '14500');
    setTransitaireTaxeISPS40(settings.transitaireTaxeISPS40?.toString() || '29000');
    setTransitaireScanner(settings.transitaireScanner?.toString() || '0');
    setTransitaireTimbreBL(settings.transitaireTimbreBL?.toString() || '5000');
    setTransitaireConteneurServiceCharge(settings.transitaireConteneurServiceCharge?.toString() || '25000');
    setTransitaireOuvertureDossier(settings.transitaireOuvertureDossier?.toString() || '8250');
    setTransitaireCommissionAvanceFonds(settings.transitaireCommissionAvanceFonds?.toString() || '0.0195');
    setTransitaireImprimerFax(settings.transitaireImprimerFax?.toString() || '5434');
    setTransitaireCommissionTransit(settings.transitaireCommissionTransit?.toString() || '29250');
    setTransitaireTaxeSydam(settings.transitaireTaxeSydam?.toString() || '19500');
    
    // Charger les paramètres HAD selon valeur CAF
    setTransitaireHADSeuil1(settings.transitaireHADSeuil1?.toString() || '5000000');
    setTransitaireHADSeuil2(settings.transitaireHADSeuil2?.toString() || '10000000');
    setTransitaireHADSeuil3(settings.transitaireHADSeuil3?.toString() || '25000000');
    setTransitaireHADSeuil4(settings.transitaireHADSeuil4?.toString() || '50000000');
    setTransitaireHADTaux1(settings.transitaireHADTaux1?.toString() || '0.018');
    setTransitaireHADTaux2(settings.transitaireHADTaux2?.toString() || '0.013');
    setTransitaireHADTaux3(settings.transitaireHADTaux3?.toString() || '0.007');
    setTransitaireHADTaux4(settings.transitaireHADTaux4?.toString() || '0.0046');
    setTransitaireHADTaux5(settings.transitaireHADTaux5?.toString() || '0.0026');
    setTransitaireHADFraisFixe1(settings.transitaireHADFraisFixe1?.toString() || '45500');
    setTransitaireHADFraisFixe2(settings.transitaireHADFraisFixe2?.toString() || '71500');
    setTransitaireHADFraisFixe3(settings.transitaireHADFraisFixe3?.toString() || '130000');
    setTransitaireHADFraisFixe4(settings.transitaireHADFraisFixe4?.toString() || '195000');
    setTransitaireHADFraisFixe5(settings.transitaireHADFraisFixe5?.toString() || '292500');
    
    // Charger les paramètres de livraison selon zone et type de conteneur
    setTransitaireLivraison20Zone1(settings.transitaireLivraison20Zone1?.toString() || '66000');
    setTransitaireLivraison20Zone2(settings.transitaireLivraison20Zone2?.toString() || '100000');
    setTransitaireLivraison20Zone3(settings.transitaireLivraison20Zone3?.toString() || '134000');
    setTransitaireLivraison40Zone1(settings.transitaireLivraison40Zone1?.toString() || '132000');
    setTransitaireLivraison40Zone2(settings.transitaireLivraison40Zone2?.toString() || '200000');
    setTransitaireLivraison40Zone3(settings.transitaireLivraison40Zone3?.toString() || '264000');
    
    // Charger les paramètres de relevage selon zone et type de conteneur
    setTransitaireRelevage20Zone1(settings.transitaireRelevage20Zone1?.toString() || '25000');
    setTransitaireRelevage20Zone2(settings.transitaireRelevage20Zone2?.toString() || '30000');
    setTransitaireRelevage20Zone3(settings.transitaireRelevage20Zone3?.toString() || '30000');
    setTransitaireRelevage40Zone1(settings.transitaireRelevage40Zone1?.toString() || '50000');
    setTransitaireRelevage40Zone2(settings.transitaireRelevage40Zone2?.toString() || '60000');
    setTransitaireRelevage40Zone3(settings.transitaireRelevage40Zone3?.toString() || '60000');
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      fobMultiplierEXW: parseFloat(exw),
      fobMultiplierFCA: parseFloat(fca),
      assuranceValueMultiplier: parseFloat(assValMul),
      ordinaryRiskRate: parseFloat(ordRiskRate),
      ordinaryRiskMinimum: parseFloat(ordRiskMin),
      accessoriesFlat: parseFloat(accessories),
      bscRateTC20: parseFloat(bscTC20),
      bscRateTC40: parseFloat(bscTC40),
      bscRateTC40HQ: parseFloat(bscTC40HQ),
      bscRateConventionnel: parseFloat(bscConventionnel),
      bscRateGroupage: parseFloat(bscGroupage),
      rpiThresholdMin: parseFloat(rpiThresholdMin),
      rpiThresholdMid: parseFloat(rpiThresholdMid),
      rpiFlatMid: parseFloat(rpiFlatMid),
      cafFraisImprevusRate: parseFloat(cafFraisImprevusRate),

      cocThreshold: parseFloat(cocThreshold),
      cocRateRouteA: parseFloat(cocRateRouteA),
      cocMinRouteA: parseFloat(cocMinRouteA),
      cocMaxRouteA: parseFloat(cocMaxRouteA),
      cocRateRouteB: parseFloat(cocRateRouteB),
      cocMinRouteB: parseFloat(cocMinRouteB),
      cocMaxRouteB: parseFloat(cocMaxRouteB),
      cocRateRouteC: parseFloat(cocRateRouteC),
      cocMinRouteC: parseFloat(cocMinRouteC),
      cocMaxRouteC: parseFloat(cocMaxRouteC),
      // Paramètres des frais financiers - Virement bancaire
      fraisFinanciersVirementOuvertureDossier: parseFloat(fraisFinanciersVirementOuvertureDossier),
      fraisFinanciersVirementDossier: parseFloat(fraisFinanciersVirementDossier),
      fraisFinanciersVirementSwift: parseFloat(fraisFinanciersVirementSwift),
      fraisFinanciersVirementPhotocopie: parseFloat(fraisFinanciersVirementPhotocopie),
      // Paramètres des frais financiers - Remise documentaire
      fraisFinanciersRemiseOuvertureDossier: parseFloat(fraisFinanciersRemiseOuvertureDossier),
      fraisFinanciersRemiseDossier: parseFloat(fraisFinanciersRemiseDossier),
      fraisFinanciersRemiseSwift: parseFloat(fraisFinanciersRemiseSwift),
      fraisFinanciersRemisePhotocopie: parseFloat(fraisFinanciersRemisePhotocopie),
      fraisFinanciersRemiseImpaye: parseFloat(fraisFinanciersRemiseImpaye),
      fraisFinanciersRemiseCourrierExpress: parseFloat(fraisFinanciersRemiseCourrierExpress),
      fraisFinanciersRemiseCommissionProrogatoire: parseFloat(fraisFinanciersRemiseCommissionProrogatoire),
      fraisFinanciersRemiseCommissionChange: parseFloat(fraisFinanciersRemiseCommissionChange),
      fraisFinanciersRemiseCommissionSeuil: parseFloat(fraisFinanciersRemiseCommissionSeuil),
      fraisFinanciersRemiseCommissionTaux: parseFloat(fraisFinanciersRemiseCommissionTaux),
      // Paramètres des frais financiers - Crédit documentaire
      fraisFinanciersCreditOuvertureDossier: parseFloat(fraisFinanciersCreditOuvertureDossier),
      fraisFinanciersCreditConfirmation: parseFloat(fraisFinanciersCreditConfirmation),
      fraisFinanciersCreditDossier: parseFloat(fraisFinanciersCreditDossier),
      fraisFinanciersCreditSwift: parseFloat(fraisFinanciersCreditSwift),
      fraisFinanciersCreditRealisation: parseFloat(fraisFinanciersCreditRealisation),
      fraisFinanciersCreditPhotocopie: parseFloat(fraisFinanciersCreditPhotocopie),
      fraisFinanciersCreditAcceptance: parseFloat(fraisFinanciersCreditAcceptance),
      fraisFinanciersCreditNegociation: parseFloat(fraisFinanciersCreditNegociation),
      fraisFinanciersCreditCommissionPaiement: parseFloat(fraisFinanciersCreditCommissionPaiement),
      fraisFinanciersCreditCommission: parseFloat(fraisFinanciersCreditCommission),
      fraisFinanciersCreditTaxeBceao: parseFloat(fraisFinanciersCreditTaxeBceao),
      tsDouane: parseFloat(tsDouane),
      
      // Paramètres du fret - Conteneur 20 pieds
      fret20ReceptionDechargement: parseFloat(fret20ReceptionDechargement),
      fret20DossierDouaneT1: parseFloat(fret20DossierDouaneT1),
      fret20FraisFixe: parseFloat(fret20FraisFixe),
      fret20CommissionTransit: parseFloat(fret20CommissionTransit),
      fret20FraisTractionTC: parseFloat(fret20FraisTractionTC),
      fret20FraisDouaneAppurement: parseFloat(fret20FraisDouaneAppurement),
      fret20FraisManutentionQuai: parseFloat(fret20FraisManutentionQuai),
      fret20Empotage: parseFloat(fret20Empotage),
      fret20FretBase: parseFloat(fret20FretBase),
      fret20CAF: parseFloat(fret20CAF),
      fret20BAFMaritime: parseFloat(fret20BAFMaritime),
      fret20SupplementOT: parseFloat(fret20SupplementOT),
      fret20SupplementProduitDangereux: parseFloat(fret20SupplementProduitDangereux),
      fret20EBS: parseFloat(fret20EBS),
      fret20GestionBSC: parseFloat(fret20GestionBSC),
      fret20EmissionBL: parseFloat(fret20EmissionBL),
      fret20FraisDouaneExport: parseFloat(fret20FraisDouaneExport),
      fret20SurchargeProduitDangereux: parseFloat(fret20SurchargeProduitDangereux),
      fret20FretSecurite: parseFloat(fret20FretSecurite),
      fret20SureteISPS: parseFloat(fret20SureteISPS),
      
      // Paramètres du fret - Conteneur 40 pieds
      fret40ReceptionDechargement: parseFloat(fret40ReceptionDechargement),
      fret40DossierDouaneT1: parseFloat(fret40DossierDouaneT1),
      fret40FraisFixe: parseFloat(fret40FraisFixe),
      fret40CommissionTransit: parseFloat(fret40CommissionTransit),
      fret40FraisTractionTC: parseFloat(fret40FraisTractionTC),
      fret40FraisDouaneAppurement: parseFloat(fret40FraisDouaneAppurement),
      fret40FraisManutentionQuai: parseFloat(fret40FraisManutentionQuai),
      fret40Empotage: parseFloat(fret40Empotage),
      fret40FretBase: parseFloat(fret40FretBase),
      fret40CAF: parseFloat(fret40CAF),
      fret40BAFMaritime: parseFloat(fret40BAFMaritime),
      fret40SupplementOT: parseFloat(fret40SupplementOT),
      fret40SupplementProduitDangereux: parseFloat(fret40SupplementProduitDangereux),
      fret40EBS: parseFloat(fret40EBS),
      fret40GestionBSC: parseFloat(fret40GestionBSC),
      fret40EmissionBL: parseFloat(fret40EmissionBL),
      fret40FraisDouaneExport: parseFloat(fret40FraisDouaneExport),
      fret40SurchargeProduitDangereux: parseFloat(fret40SurchargeProduitDangereux),
      fret40FretSecurite: parseFloat(fret40FretSecurite),
      fret40SureteISPS: parseFloat(fret40SureteISPS),
      
      // Paramètres de la prestation transitaire
      transitaireDiversDebours: parseFloat(transitaireDiversDebours),
      transitaireFraisEtablissementFDI: parseFloat(transitaireFraisEtablissementFDI),
      transitaireFraisRFCV: parseFloat(transitaireFraisRFCV),
      transitaireAcconageImportTEU: parseFloat(transitaireAcconageImportTEU),
      transitaireDiversDebours2: parseFloat(transitaireDiversDebours2),
      transitaireEchangeBL: parseFloat(transitaireEchangeBL),
      transitaireNettoyageTC20: parseFloat(transitaireNettoyageTC20),
      transitaireNettoyageTC40: parseFloat(transitaireNettoyageTC40),
      transitaireTaxeISPS20: parseFloat(transitaireTaxeISPS20),
      transitaireTaxeISPS40: parseFloat(transitaireTaxeISPS40),
      transitaireScanner: parseFloat(transitaireScanner),
      transitaireTimbreBL: parseFloat(transitaireTimbreBL),
      transitaireConteneurServiceCharge: parseFloat(transitaireConteneurServiceCharge),
      transitaireOuvertureDossier: parseFloat(transitaireOuvertureDossier),
      transitaireCommissionAvanceFonds: parseFloat(transitaireCommissionAvanceFonds),
      transitaireImprimerFax: parseFloat(transitaireImprimerFax),
      transitaireCommissionTransit: parseFloat(transitaireCommissionTransit),
      transitaireTaxeSydam: parseFloat(transitaireTaxeSydam),
      
      // Paramètres HAD selon valeur CAF
      transitaireHADSeuil1: parseFloat(transitaireHADSeuil1),
      transitaireHADSeuil2: parseFloat(transitaireHADSeuil2),
      transitaireHADSeuil3: parseFloat(transitaireHADSeuil3),
      transitaireHADSeuil4: parseFloat(transitaireHADSeuil4),
      transitaireHADTaux1: parseFloat(transitaireHADTaux1),
      transitaireHADTaux2: parseFloat(transitaireHADTaux2),
      transitaireHADTaux3: parseFloat(transitaireHADTaux3),
      transitaireHADTaux4: parseFloat(transitaireHADTaux4),
      transitaireHADTaux5: parseFloat(transitaireHADTaux5),
      transitaireHADFraisFixe1: parseFloat(transitaireHADFraisFixe1),
      transitaireHADFraisFixe2: parseFloat(transitaireHADFraisFixe2),
      transitaireHADFraisFixe3: parseFloat(transitaireHADFraisFixe3),
      transitaireHADFraisFixe4: parseFloat(transitaireHADFraisFixe4),
      transitaireHADFraisFixe5: parseFloat(transitaireHADFraisFixe5),
      
      // Paramètres de livraison selon zone et type de conteneur
      transitaireLivraison20Zone1: parseFloat(transitaireLivraison20Zone1),
      transitaireLivraison20Zone2: parseFloat(transitaireLivraison20Zone2),
      transitaireLivraison20Zone3: parseFloat(transitaireLivraison20Zone3),
      transitaireLivraison40Zone1: parseFloat(transitaireLivraison40Zone1),
      transitaireLivraison40Zone2: parseFloat(transitaireLivraison40Zone2),
      transitaireLivraison40Zone3: parseFloat(transitaireLivraison40Zone3),
      
      // Paramètres de relevage selon zone et type de conteneur
      transitaireRelevage20Zone1: parseFloat(transitaireRelevage20Zone1),
      transitaireRelevage20Zone2: parseFloat(transitaireRelevage20Zone2),
      transitaireRelevage20Zone3: parseFloat(transitaireRelevage20Zone3),
      transitaireRelevage40Zone1: parseFloat(transitaireRelevage40Zone1),
      transitaireRelevage40Zone2: parseFloat(transitaireRelevage40Zone2),
      transitaireRelevage40Zone3: parseFloat(transitaireRelevage40Zone3),
    });
    alert('Paramètres enregistrés.');
  };

  // Gestion de l'upload du fichier Excel TEC
  const handleTECFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTEC(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        if (!data) {
          setIsUploadingTEC(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Ignorer la première ligne (en-têtes)
        const rows = jsonData.slice(1);

        const parsedArticles: TECArticle[] = rows
          .filter((row: any) => row.length >= 24) // Vérifier qu'il y a au moins 24 colonnes
          .map((row: any) => ({
            sh10Code: String(row[0] || ''), // SH10_COD
            designation: String(row[1] || ''), // Désignation des marchandises
            us: String(row[2] || ''), // US#
            dd: Number(row[3]) || 0, // D#D#
            rsta: Number(row[4]) || 0, // RS
            pcs: Number(row[5]) || 0, // PCS
            pua: Number(row[6]) || 0, // PUA
            pcc: Number(row[7]) || 0, // PCC
            cumulSansTVA: Number(row[8]) || 0, // TAUX CUMILE SANS TVA
            cumulAvecTVA: Number(row[9]) || 0, // TAUX CUMILE AVEC TVA
            tva: Number(row[10]) || 0, // TVA
            sh6Code: String(row[11] || ''), // H6_CO
            tub: String(row[12] || ''), // TUB
            dus: String(row[13] || ''), // DUS
            dud: String(row[14] || ''), // DUD
            tcb: String(row[15] || ''), // TCB
            tsm: String(row[16] || ''), // TSM
            tsb: String(row[17] || ''), // TSB
            psv: String(row[18] || ''), // PS
            tai: String(row[19] || ''), // TAI
            tab: String(row[20] || ''), // TAB
            tuf: String(row[21] || ''), // TUF
                    rrr: Number(row[22]) || 0, // RRR
        rcp: Number(row[23]) || 0, // RCP
          }))
          .filter(article => article.sh10Code && article.designation); // Filtrer les lignes vides

        // Sauvegarder dans Supabase (admin uniquement)
        if (!isAdmin) {
          alert('Seuls les administrateurs peuvent modifier les données de référence.');
          setIsUploadingTEC(false);
          return;
        }

        try {
          await referenceDataService.saveReferenceData('tec', parsedArticles, user?.id);
          setTecCount(parsedArticles.length);
          alert(`${parsedArticles.length} articles TEC ont été importés avec succès !`);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde TEC:', error);
          alert('Erreur lors de la sauvegarde des articles TEC. Vérifiez vos droits administrateur.');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erreur lors de l\'import TEC:', error);
      alert('Erreur lors de l\'import du fichier Excel TEC');
    } finally {
      setIsUploadingTEC(false);
    }
  };

  // Gestion de l'upload du fichier Excel VOC
  const handleVOCFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVOC(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        if (!data) {
          setIsUploadingVOC(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Ignorer la première ligne (en-têtes)
        const rows = jsonData.slice(1);

        const parsedProducts: VOCProduct[] = rows
          .filter((row: any) => row.length >= 4) // Vérifier qu'il y a au moins 4 colonnes
          .map((row: any) => ({
            codeSH: String(row[0] || ''),
            designation: String(row[1] || ''),
            observation: String(row[2] || ''),
            exempte: Number(row[3]) === 1, // 1 pour Oui, 0 pour Non
          }))
          .filter(product => product.codeSH && product.designation); // Filtrer les lignes vides

        // Sauvegarder dans Supabase (admin uniquement)
        if (!isAdmin) {
          alert('Seuls les administrateurs peuvent modifier les données de référence.');
          setIsUploadingVOC(false);
          return;
        }

        try {
          await referenceDataService.saveReferenceData('voc', parsedProducts, user?.id);
          setVocCount(parsedProducts.length);
          alert(`${parsedProducts.length} produits VOC ont été importés avec succès !`);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde VOC:', error);
          alert('Erreur lors de la sauvegarde des produits VOC. Vérifiez vos droits administrateur.');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erreur lors de l\'import VOC:', error);
      alert('Erreur lors de l\'import du fichier Excel VOC');
    } finally {
      setIsUploadingVOC(false);
    }
  };

  // Charger les données d'exemple TEC
  const loadSampleTEC = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent modifier les données de référence.');
      return;
    }

    if (window.confirm('Voulez-vous charger les données d\'exemple TEC ? Cela remplacera les données existantes.')) {
      try {
        const sampleData = loadSampleTECData();
        await referenceDataService.saveReferenceData('tec', sampleData, user?.id);
        setTecCount(sampleData.length);
        alert(`${sampleData.length} articles d'exemple TEC ont été chargés avec succès !`);
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'exemple TEC:', error);
        alert('Erreur lors du chargement des données d\'exemple TEC. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Charger les données d'exemple VOC
  const loadSampleVOC = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent modifier les données de référence.');
      return;
    }

    if (window.confirm('Voulez-vous charger les données d\'exemple VOC ? Cela remplacera les données existantes.')) {
      try {
        const sampleData = loadSampleVOCData();
        await referenceDataService.saveReferenceData('voc', sampleData, user?.id);
        setVocCount(sampleData.length);
        alert(`${sampleData.length} produits d'exemple VOC ont été chargés avec succès !`);
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'exemple VOC:', error);
        alert('Erreur lors du chargement des données d\'exemple VOC. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Vider la table TEC
  const clearTECTable = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent supprimer les données de référence.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir vider toute la table TEC ?')) {
      try {
        await referenceDataService.deleteReferenceData('tec');
        setTecCount(0);
        alert('Table TEC vidée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression TEC:', error);
        alert('Erreur lors de la suppression des articles TEC. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Vider la table VOC
  const clearVOCTable = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent supprimer les données de référence.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir vider toute la table VOC ?')) {
      try {
        await referenceDataService.deleteReferenceData('voc');
        setVocCount(0);
        alert('Table VOC vidée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression VOC:', error);
        alert('Erreur lors de la suppression des produits VOC. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Gestion de l'upload du fichier Excel TarifPORT
  const handleTarifPORTFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTarifPORT(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        if (!data) {
          setIsUploadingTarifPORT(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Ignorer la première ligne (en-têtes)
        const rows = jsonData.slice(1);

        const parsedProducts: TarifPORTProduct[] = rows
          .filter((row: any) => row.length >= 4) // Vérifier qu'il y a au moins 4 colonnes
          .map((row: any) => ({
            libelle_produit: String(row[0] || ''),
            chapitre: String(row[1] || ''),
            tp: String(row[2] || ''),
            coderedevance: String(row[3] || ''),
          }))
          .filter(product => product.libelle_produit && product.chapitre); // Filtrer les lignes vides

        // Sauvegarder dans Supabase (admin uniquement)
        if (!isAdmin) {
          alert('Seuls les administrateurs peuvent modifier les données de référence.');
          setIsUploadingTarifPORT(false);
          return;
        }

        try {
          await referenceDataService.saveReferenceData('tarifport', parsedProducts, user?.id);
          setTarifportCount(parsedProducts.length);
          alert(`${parsedProducts.length} produits TarifPORT ont été importés avec succès !`);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde TarifPORT:', error);
          alert('Erreur lors de la sauvegarde des produits TarifPORT. Vérifiez vos droits administrateur.');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erreur lors de l\'import TarifPORT:', error);
      alert('Erreur lors de l\'import du fichier Excel TarifPORT');
    } finally {
      setIsUploadingTarifPORT(false);
    }
  };

  // Charger les données d'exemple TarifPORT
  const loadSampleTarifPORT = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent modifier les données de référence.');
      return;
    }

    if (window.confirm('Voulez-vous charger les données d\'exemple TarifPORT ? Cela remplacera les données existantes.')) {
      try {
        const sampleData = loadSampleTarifPORTData();
        await referenceDataService.saveReferenceData('tarifport', sampleData, user?.id);
        setTarifportCount(sampleData.length);
        alert(`${sampleData.length} produits d'exemple TarifPORT ont été chargés avec succès !`);
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'exemple TarifPORT:', error);
        alert('Erreur lors du chargement des données d\'exemple TarifPORT. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Vider la table TarifPORT
  const clearTarifPORTTable = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent supprimer les données de référence.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir vider toute la table TarifPORT ?')) {
      try {
        await referenceDataService.deleteReferenceData('tarifport');
        setTarifportCount(0);
        alert('Table TarifPORT vidée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression TarifPORT:', error);
        alert('Erreur lors de la suppression des produits TarifPORT. Vérifiez vos droits administrateur.');
      }
    }
  };

  return (
    <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Paramètres de l'application</h1>
        <p className="text-gray-600 text-sm">Configurez les paramètres de calcul et gérez les données TEC et VOC.</p>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-cote-ivoire-light">
        <div className="border-b border-gray-300">
          <nav className="flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('fob')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'fob'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
              }`}
            >
              Multiplicateurs FOB
            </button>
            <button
              onClick={() => setActiveTab('assurance')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'assurance'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Paramètres d'assurance
            </button>
            <button
              onClick={() => setActiveTab('imprevus')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'imprevus'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Frais imprévus (CAF)
            </button>
            <button
              onClick={() => setActiveTab('bsc')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'bsc'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Paramètres BSC
            </button>
            <button
              onClick={() => setActiveTab('rpi')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'rpi'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Paramètres RPI
            </button>

            <button
              onClick={() => setActiveTab('coc')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'coc'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Paramètres COC
            </button>
            <button
              onClick={() => setActiveTab('fraisFinanciers')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'fraisFinanciers'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Frais financiers
            </button>
            <button
              onClick={() => setActiveTab('fret')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'fret'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Paramètres Fret
            </button>
            <button
              onClick={() => setActiveTab('transitaire')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'transitaire'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Prestation Transitaire
            </button>
            <button
              onClick={() => setActiveTab('fichiers')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'fichiers'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Gestion des fichiers
            </button>
            <button
              onClick={() => setActiveTab('tableaux')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'tableaux'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Tableaux de données
            </button>
            <button
              onClick={() => setActiveTab('admin-decisions')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'admin-decisions'
                  ? 'border-cote-ivoire-primary text-cote-ivoire-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Gavel className="h-4 w-4 inline mr-1" />
              Décisions Admin
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'fob' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Multiplicateurs FOB</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Multiplicateur FOB pour Incoterm EXW (par défaut 1.03)</span>
                      <InfoTooltip text="FOB(EXW) = somme(quantité × prix unitaire) × multiplicateur EXW × taux de change" />
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white"
                      value={exw}
                      onChange={(e) => setExw(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Multiplicateur FOB pour Incoterm FCA (par défaut 1.05)</span>
                      <InfoTooltip text="FOB(FCA) = somme(quantité × prix unitaire) × multiplicateur FCA × taux de change" />
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white"
                      value={fca}
                      onChange={(e) => setFca(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'assurance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres d'assurance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Multiplicateur de Valeur Assurance (par défaut 1.2)</span>
                      <InfoTooltip text="Valeur Assurance = (FOB + Fret) × multiplicateur" />
                    </label>
                    <input type="number" step="0.001" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={assValMul} onChange={(e) => setAssValMul(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux du Risque ordinaire (décimal, ex: 0.0015 = 0,15%)</span>
                      <InfoTooltip text="Risque ordinaire = max(minimum, Valeur Assurance × taux)" />
                    </label>
                    <input type="number" step="0.0001" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={ordRiskRate} onChange={(e) => setOrdRiskRate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Minimum du Risque ordinaire (ex: 5000 FCFA)</span>
                      <InfoTooltip text="Plancher appliqué au Risque ordinaire si le calcul est inférieur" />
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={ordRiskMin} onChange={(e) => setOrdRiskMin(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Accessoires forfaitaires (ex: 2500 FCFA)</span>
                      <InfoTooltip text="Composant fixe de la prime d'assurance" />
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={accessories} onChange={(e) => setAccessories(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'bsc' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres BSC (Bordereau de Suivi des Cargaisons)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      BSC Conteneur 20 pieds (FCFA)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={bscTC20} onChange={(e) => setBscTC20(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      BSC Conteneur 40 pieds (FCFA)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={bscTC40} onChange={(e) => setBscTC40(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      BSC Conteneur 40 pieds HC (FCFA)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={bscTC40HQ} onChange={(e) => setBscTC40HQ(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      BSC Transport conventionnel (FCFA)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={bscConventionnel} onChange={(e) => setBscConventionnel(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      BSC Groupage (FCFA)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={bscGroupage} onChange={(e) => setBscGroupage(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'imprevus' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Frais imprévus (sur CAF)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais imprévus (décimal, ex: 0.05 = 5%)</span>
                    </label>
                    <input type="number" step="0.0001" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={cafFraisImprevusRate} onChange={(e) => setCafFraisImprevusRate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'rpi' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres RPI (Régime de Préférence d'Importation)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Seuil minimum FOB (exclusion RPI)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={rpiThresholdMin} onChange={(e) => setRpiThresholdMin(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Seuil milieu FOB (RPI forfaitaire)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={rpiThresholdMid} onChange={(e) => setRpiThresholdMid(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      RPI forfaitaire milieu (FCFA)
                    </label>
                    <input type="number" step="1" className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" value={rpiFlatMid} onChange={(e) => setRpiFlatMid(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}



          {activeTab === 'coc' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres COC (Certificat d'Origine et de Conformité)</h2>
                
                {/* Paramètre global */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Paramètre global</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Seuil FOB pour COC (FCFA)</span>
                        <InfoTooltip text="Seuil minimum FOB pour déclencher le calcul du COC" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocThreshold} 
                        onChange={(e) => setCocThreshold(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Route A */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Route A</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Taux COC Route A (décimal)</span>
                        <InfoTooltip text="Taux appliqué à FOBcoc pour calculer le COC sur la route A" />
                      </label>
                      <input 
                        type="number" 
                        step="0.0001" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocRateRouteA} 
                        onChange={(e) => setCocRateRouteA(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Minimum COC Route A (FCFA)</span>
                        <InfoTooltip text="Valeur minimum du COC pour la route A" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocMinRouteA} 
                        onChange={(e) => setCocMinRouteA(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Maximum COC Route A (FCFA)</span>
                        <InfoTooltip text="Valeur maximum du COC pour la route A" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocMaxRouteA} 
                        onChange={(e) => setCocMaxRouteA(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Route B */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Route B</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Taux COC Route B (décimal)</span>
                        <InfoTooltip text="Taux appliqué à FOBcoc pour calculer le COC sur la route B" />
                      </label>
                      <input 
                        type="number" 
                        step="0.0001" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocRateRouteB} 
                        onChange={(e) => setCocRateRouteB(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Minimum COC Route B (FCFA)</span>
                        <InfoTooltip text="Valeur minimum du COC pour la route B" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocMinRouteB} 
                        onChange={(e) => setCocMinRouteB(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Maximum COC Route B (FCFA)</span>
                        <InfoTooltip text="Valeur maximum du COC pour la route B" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocMaxRouteB} 
                        onChange={(e) => setCocMaxRouteB(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Route C */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Route C</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Taux COC Route C (décimal)</span>
                        <InfoTooltip text="Taux appliqué à FOBcoc pour calculer le COC sur la route C" />
                      </label>
                      <input 
                        type="number" 
                        step="0.0001" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocRateRouteC} 
                        onChange={(e) => setCocRateRouteC(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Minimum COC Route C (FCFA)</span>
                        <InfoTooltip text="Valeur minimum du COC pour la route C" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocMinRouteC} 
                        onChange={(e) => setCocMinRouteC(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                        <span>Maximum COC Route C (FCFA)</span>
                        <InfoTooltip text="Valeur maximum du COC pour la route C" />
                      </label>
                      <input 
                        type="number" 
                        step="1000" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={cocMaxRouteC} 
                        onChange={(e) => setCocMaxRouteC(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-orange-900/30 border border-orange-700/50 rounded-lg p-3">
                  <div className="text-xs text-orange-200">
                    <p className="font-medium mb-1">Calcul automatique COC:</p>
                    <p>1. Identifier tous les articles dans la liste VOC</p>
                    <p>2. Calculer le FOB total des articles VOC</p>
                    <p>3. Si FOB total VOC &lt; seuil → COC = 0</p>
                    <p>4. Si FOB total VOC ≥ seuil → COC = FOB total VOC × taux selon la route</p>
                    <p>5. Si COC ≤ minimum → COC = minimum</p>
                    <p>6. Si COC ≥ maximum → COC = maximum</p>
                    <p className="text-gray-600 mt-1">Le calcul se fait sur le FOB total des articles VOC et dépend de la route sélectionnée (A, B ou C).</p>
                    <p className="text-gray-600 mt-2">Paramètres par défaut:</p>
                    <p className="text-gray-600">• Route A: 0.45% (min: 197,000, max: 2,684,000)</p>
                    <p className="text-gray-600">• Route B: 0.40% (min: 187,150, max: 25,490,800)</p>
                    <p className="text-gray-600">• Route C: 0.30% (min: 167,450, max: 2,281,400)</p>
                  </div>
                </div>
              </div>
              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'fraisFinanciers' && (
            <div className="space-y-6">
              {/* Virement bancaire */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres des frais financiers - Virement bancaire</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais d'ouverture de dossier (décimal, ex: 0.01 = 1%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais d'ouverture de dossier" />
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersVirementOuvertureDossier} 
                      onChange={(e) => setFraisFinanciersVirementOuvertureDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Frais de dossier forfaitaires (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour les frais de dossier" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersVirementDossier} 
                      onChange={(e) => setFraisFinanciersVirementDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Frais de transfert SWIFT (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour les frais de transfert SWIFT" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersVirementSwift} 
                      onChange={(e) => setFraisFinanciersVirementSwift(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Frais de photocopie (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour les frais de photocopie" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersVirementPhotocopie} 
                      onChange={(e) => setFraisFinanciersVirementPhotocopie(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="mt-4 bg-cote-ivoire-primary/30 border border-cote-ivoire-primary/50 rounded-lg p-3">
                  <div className="text-xs text-cote-ivoire-primary">
                    <p className="font-medium mb-1">Calcul automatique - Virement bancaire:</p>
                    <p>Frais financiers = (TotalFournisseur × taux ouverture) + frais dossier + SWIFT + photocopie</p>
                  </div>
                </div>
              </div>

              {/* Remise documentaire */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres des frais financiers - Remise documentaire</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais d'ouverture de dossier (décimal, ex: 0.01 = 1%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais d'ouverture de dossier" />
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseOuvertureDossier} 
                      onChange={(e) => setFraisFinanciersRemiseOuvertureDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais de dossier (décimal, ex: 0 = 0%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de dossier" />
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseDossier} 
                      onChange={(e) => setFraisFinanciersRemiseDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux transfert SWIFT (décimal, ex: 0 = 0%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de transfert SWIFT" />
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseSwift} 
                      onChange={(e) => setFraisFinanciersRemiseSwift(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Frais de photocopie (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour les frais de photocopie" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemisePhotocopie} 
                      onChange={(e) => setFraisFinanciersRemisePhotocopie(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Frais d'impayé (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour les frais d'impayé" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseImpaye} 
                      onChange={(e) => setFraisFinanciersRemiseImpaye(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux courrier express (décimal, ex: 0 = 0%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de courrier express" />
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseCourrierExpress} 
                      onChange={(e) => setFraisFinanciersRemiseCourrierExpress(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Commission prorogatoire (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour la commission prorogatoire" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseCommissionProrogatoire} 
                      onChange={(e) => setFraisFinanciersRemiseCommissionProrogatoire(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux commission de change (décimal, ex: 0.002 = 0.2%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer la commission de change" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseCommissionChange} 
                      onChange={(e) => setFraisFinanciersRemiseCommissionChange(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Seuil commission (FCFA)</span>
                      <InfoTooltip text="Seuil minimum pour la commission calculée" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseCommissionSeuil} 
                      onChange={(e) => setFraisFinanciersRemiseCommissionSeuil(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux commission (décimal, ex: 0.0015 = 0.15%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer la commission" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersRemiseCommissionTaux} 
                      onChange={(e) => setFraisFinanciersRemiseCommissionTaux(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="mt-4 bg-cote-ivoire-success/30 border border-cote-ivoire-success/50 rounded-lg p-3">
                  <div className="text-xs text-cote-ivoire-success">
                    <p className="font-medium mb-1">Calcul automatique - Remise documentaire:</p>
                    <p>Commission = max(seuil, TotalFournisseur × taux commission)</p>
                    <p>Frais financiers = somme de tous les frais + commission</p>
                  </div>
                </div>
              </div>

              {/* Crédit documentaire */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres des frais financiers - Crédit documentaire</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais d'ouverture de dossier (décimal, ex: 0.0025 = 0.25%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais d'ouverture de dossier" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditOuvertureDossier} 
                      onChange={(e) => setFraisFinanciersCreditOuvertureDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais de confirmation (décimal, ex: 0.0025 = 0.25%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de confirmation" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditConfirmation} 
                      onChange={(e) => setFraisFinanciersCreditConfirmation(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux frais de dossier (décimal, ex: 0 = 0%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de dossier" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditDossier} 
                      onChange={(e) => setFraisFinanciersCreditDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux transfert SWIFT (décimal, ex: 0 = 0%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de transfert SWIFT" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditSwift} 
                      onChange={(e) => setFraisFinanciersCreditSwift(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux réalisation (décimal, ex: 0.0030 = 0.3%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de réalisation" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditRealisation} 
                      onChange={(e) => setFraisFinanciersCreditRealisation(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Frais de photocopie (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour les frais de photocopie" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditPhotocopie} 
                      onChange={(e) => setFraisFinanciersCreditPhotocopie(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux acceptation (décimal, ex: 0 = 0%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais d'acceptation" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                                      value={fraisFinanciersCreditAcceptance}
                onChange={(e) => setFraisFinanciersCreditAcceptance(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux négociation (décimal, ex: 0.010 = 1%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer les frais de négociation" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditNegociation} 
                      onChange={(e) => setFraisFinanciersCreditNegociation(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux commission de paiement (décimal, ex: 0.010 = 1%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer la commission de paiement" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditCommissionPaiement} 
                      onChange={(e) => setFraisFinanciersCreditCommissionPaiement(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux commission (décimal, ex: 0.025 = 2.5%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer la commission" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditCommission} 
                      onChange={(e) => setFraisFinanciersCreditCommission(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>Taux taxe BCEAO (décimal, ex: 0.006 = 0.6%)</span>
                      <InfoTooltip text="Taux appliqué à TotalFournisseur pour calculer la taxe BCEAO" />
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={fraisFinanciersCreditTaxeBceao} 
                      onChange={(e) => setFraisFinanciersCreditTaxeBceao(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="mt-4 bg-cote-ivoire-primary/30 border border-cote-ivoire-primary/50 rounded-lg p-3">
                  <div className="text-xs text-cote-ivoire-primary">
                    <p className="font-medium mb-1">Calcul automatique - Crédit documentaire:</p>
                    <p>Frais financiers = somme de tous les frais (taux × TotalFournisseur + montants fixes)</p>
                  </div>
                </div>
              </div>

              {/* TS Douane */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres TS Douane</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                      <span>TS Douane (FCFA)</span>
                      <InfoTooltip text="Montant fixe pour le TS Douane (Taxe de Service Douane)" />
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={tsDouane} 
                      onChange={(e) => setTsDouane(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="mt-4 bg-orange-900/30 border border-orange-700/50 rounded-lg p-3">
                  <div className="text-xs text-orange-200">
                    <p className="font-medium mb-1">TS Douane:</p>
                    <p>Montant fixe ajouté au coût de revient final</p>
                  </div>
                </div>
              </div>

              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'fichiers' && (
            <div className="space-y-6">
              {/* Section Gestion des fichiers Excel */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Gestion TEC */}
                <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Database className="h-6 w-6 text-cote-ivoire-primary" />
                      <h2 className="text-gray-800 font-semibold">Gestion du TEC</h2>
                    </div>
                    <div className="bg-cote-ivoire-primary px-3 py-1 rounded-full border border-cote-ivoire-primary">
                      <span className="text-white text-sm font-medium">{tecCount} articles</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleTECFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cote-ivoire-primary file:text-cote-ivoire-primary hover:file:bg-cote-ivoire-primary"
                    />
                    <button
                      disabled={isUploadingTEC}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isUploadingTEC ? 'Chargement...' : 'Importer les données TEC'}</span>
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleTEC}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-cote-ivoire-success text-white border border-cote-ivoire-success hover:bg-cote-ivoire-success transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Modèle Excel</span>
                      </button>
                      <button
                        onClick={clearTECTable}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-primary transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Vider la table</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Format requis TEC */}
                  <div className="mt-4 bg-cote-ivoire-secondary/30 border border-cote-ivoire-secondary/50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-cote-ivoire-secondary mt-0.5" />
                      <div className="text-xs text-cote-ivoire-secondary">
                        <p className="font-medium mb-1">Format du fichier Excel TEC:</p>
                        <p>24 colonnes: sh10 code, designation, us, dd, rsta, pcs, pua, pcc, rrr, rcp, cumul sans tva, cumul avec tva, tva, h6 cod, tub, dus, dud, tcb, tsm, tsb, psv, tai, tab, tuf</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Gestion VOC */}
                <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-cote-ivoire-success" />
                      <h2 className="text-gray-800 font-semibold">Gestion des Produits VOC</h2>
                    </div>
                    <div className="bg-cote-ivoire-success px-3 py-1 rounded-full border border-cote-ivoire-success">
                      <span className="text-white text-sm font-medium">{vocCount} produits</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleVOCFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cote-ivoire-success file:text-cote-ivoire-success hover:file:bg-cote-ivoire-success"
                    />
                    <button
                      disabled={isUploadingVOC}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-cote-ivoire-success text-white border border-cote-ivoire-success hover:bg-cote-ivoire-success transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isUploadingVOC ? 'Chargement...' : 'Importer les données VOC'}</span>
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleVOC}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-cote-ivoire-success text-white border border-cote-ivoire-success hover:bg-cote-ivoire-success transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Modèle Excel</span>
                      </button>
                      <button
                        onClick={clearVOCTable}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-cote-ivoire-primary transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Vider la table</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Format requis VOC */}
                  <div className="mt-4 bg-cote-ivoire-secondary/30 border border-cote-ivoire-secondary/50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-cote-ivoire-secondary mt-0.5" />
                      <div className="text-xs text-cote-ivoire-secondary">
                        <p className="font-medium mb-1">Format du fichier Excel VOC:</p>
                        <p>Colonne A: Code SH (obligatoire)</p>
                        <p>Colonne B: Désignation (obligatoire)</p>
                        <p>Colonne C: Observation (optionnel)</p>
                        <p>Colonne D: Exempté - 1 pour Oui, 0 pour Non (par défaut: 1)</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Gestion TarifPORT */}
                <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Database className="h-6 w-6 text-cote-ivoire-primary" />
                      <h2 className="text-gray-800 font-semibold">Gestion du TarifPORT</h2>
                    </div>
                    <div className="bg-cote-ivoire-primary px-3 py-1 rounded-full border border-cote-ivoire-primary">
                      <span className="text-white text-sm font-medium">{tarifportCount} produits</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleTarifPORTFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cote-ivoire-primary file:text-cote-ivoire-primary hover:file:bg-cote-ivoire-primary"
                    />
                    <button
                      disabled={isUploadingTarifPORT}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/50 text-cote-ivoire-primary border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isUploadingTarifPORT ? 'Chargement...' : 'Importer les données TarifPORT'}</span>
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleTarifPORT}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/50 text-cote-ivoire-primary border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/50 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Modèle Excel</span>
                      </button>
                      <button
                        onClick={clearTarifPORTTable}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/50 text-cote-ivoire-primary border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Vider la table</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Format requis TarifPORT */}
                  <div className="mt-4 bg-cote-ivoire-secondary/30 border border-cote-ivoire-secondary/50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-cote-ivoire-secondary mt-0.5" />
                      <div className="text-xs text-cote-ivoire-secondary">
                        <p className="font-medium mb-1">Format du fichier Excel TarifPORT:</p>
                        <p>Colonne A: Libellé produit (obligatoire)</p>
                        <p>Colonne B: Chapitre (obligatoire)</p>
                        <p>Colonne C: TP (obligatoire)</p>
                        <p>Colonne D: Code redevance (obligatoire)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fret' && (
            <div className="space-y-6">
              {/* Conteneur 20 pieds */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres du Fret - Conteneur 20 pieds</h2>
                
                {/* Section 1: Coût prestation de service */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 text-cote-ivoire-primary">Section 1: Coût prestation de service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais réception Déchargement (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20ReceptionDechargement} 
                        onChange={(e) => setFret20ReceptionDechargement(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Dossier Douane T1 (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20DossierDouaneT1} 
                        onChange={(e) => setFret20DossierDouaneT1(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais fixe (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FraisFixe} 
                        onChange={(e) => setFret20FraisFixe(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Commission Transit (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20CommissionTransit} 
                        onChange={(e) => setFret20CommissionTransit(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Traction TC (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FraisTractionTC} 
                        onChange={(e) => setFret20FraisTractionTC(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Douane Appurement (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FraisDouaneAppurement} 
                        onChange={(e) => setFret20FraisDouaneAppurement(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Manutention Quai (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FraisManutentionQuai} 
                        onChange={(e) => setFret20FraisManutentionQuai(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Empotage (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20Empotage} 
                        onChange={(e) => setFret20Empotage(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Coût prestation principal */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 text-cote-ivoire-success">Section 2: Coût prestation principal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Fret de base (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FretBase} 
                        onChange={(e) => setFret20FretBase(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        CAF (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20CAF} 
                        onChange={(e) => setFret20CAF(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        BAF Maritime (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20BAFMaritime} 
                        onChange={(e) => setFret20BAFMaritime(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Supplément OT (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20SupplementOT} 
                        onChange={(e) => setFret20SupplementOT(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Supplément produit dangereux (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20SupplementProduitDangereux} 
                        onChange={(e) => setFret20SupplementProduitDangereux(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        EBS (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20EBS} 
                        onChange={(e) => setFret20EBS(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Gestion BSC (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20GestionBSC} 
                        onChange={(e) => setFret20GestionBSC(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Emission BL (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20EmissionBL} 
                        onChange={(e) => setFret20EmissionBL(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Douane Export (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FraisDouaneExport} 
                        onChange={(e) => setFret20FraisDouaneExport(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Surcharge Produit Dangereux (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20SurchargeProduitDangereux} 
                        onChange={(e) => setFret20SurchargeProduitDangereux(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Fret Sécurité (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20FretSecurite} 
                        onChange={(e) => setFret20FretSecurite(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Sûreté ISPS (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret20SureteISPS} 
                        onChange={(e) => setFret20SureteISPS(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteneur 40 pieds */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres du Fret - Conteneur 40 pieds</h2>
                
                {/* Section 1: Coût prestation de service */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 text-cote-ivoire-primary">Section 1: Coût prestation de service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais réception Déchargement (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40ReceptionDechargement} 
                        onChange={(e) => setFret40ReceptionDechargement(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Dossier Douane T1 (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40DossierDouaneT1} 
                        onChange={(e) => setFret40DossierDouaneT1(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais fixe (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FraisFixe} 
                        onChange={(e) => setFret40FraisFixe(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Commission Transit (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40CommissionTransit} 
                        onChange={(e) => setFret40CommissionTransit(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Traction TC (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FraisTractionTC} 
                        onChange={(e) => setFret40FraisTractionTC(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Douane Appurement (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FraisDouaneAppurement} 
                        onChange={(e) => setFret40FraisDouaneAppurement(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Manutention Quai (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FraisManutentionQuai} 
                        onChange={(e) => setFret40FraisManutentionQuai(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Empotage (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40Empotage} 
                        onChange={(e) => setFret40Empotage(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Coût prestation principal */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 text-cote-ivoire-success">Section 2: Coût prestation principal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Fret de base (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FretBase} 
                        onChange={(e) => setFret40FretBase(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        CAF (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40CAF} 
                        onChange={(e) => setFret40CAF(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        BAF Maritime (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40BAFMaritime} 
                        onChange={(e) => setFret40BAFMaritime(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Supplément OT (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40SupplementOT} 
                        onChange={(e) => setFret40SupplementOT(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Supplément produit dangereux (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40SupplementProduitDangereux} 
                        onChange={(e) => setFret40SupplementProduitDangereux(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        EBS (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40EBS} 
                        onChange={(e) => setFret40EBS(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Gestion BSC (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40GestionBSC} 
                        onChange={(e) => setFret40GestionBSC(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Emission BL (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40EmissionBL} 
                        onChange={(e) => setFret40EmissionBL(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Frais Douane Export (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FraisDouaneExport} 
                        onChange={(e) => setFret40FraisDouaneExport(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Surcharge Produit Dangereux (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40SurchargeProduitDangereux} 
                        onChange={(e) => setFret40SurchargeProduitDangereux(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Fret Sécurité (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40FretSecurite} 
                        onChange={(e) => setFret40FretSecurite(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Sûreté ISPS (€)
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                        value={fret40SureteISPS} 
                        onChange={(e) => setFret40SureteISPS(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'transitaire' && (
            <div className="space-y-6">
              {/* Paramètres de base de la prestation transitaire */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres de base de la prestation transitaire</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Divers débours (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireDiversDebours} 
                      onChange={(e) => setTransitaireDiversDebours(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais établissement FDI (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireFraisEtablissementFDI} 
                      onChange={(e) => setTransitaireFraisEtablissementFDI(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais RFCV (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireFraisRFCV} 
                      onChange={(e) => setTransitaireFraisRFCV(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Acconage import TEU (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireAcconageImportTEU} 
                      onChange={(e) => setTransitaireAcconageImportTEU(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Divers débours 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireDiversDebours2} 
                      onChange={(e) => setTransitaireDiversDebours2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Échange BL (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireEchangeBL} 
                      onChange={(e) => setTransitaireEchangeBL(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Nettoyage TC 20 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireNettoyageTC20} 
                      onChange={(e) => setTransitaireNettoyageTC20(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Nettoyage TC 40 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireNettoyageTC40} 
                      onChange={(e) => setTransitaireNettoyageTC40(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taxe ISPS 20 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireTaxeISPS20} 
                      onChange={(e) => setTransitaireTaxeISPS20(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taxe ISPS 40 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireTaxeISPS40} 
                      onChange={(e) => setTransitaireTaxeISPS40(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Scanner (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireScanner} 
                      onChange={(e) => setTransitaireScanner(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Timbre BL (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireTimbreBL} 
                      onChange={(e) => setTransitaireTimbreBL(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Conteneur Service Charge (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireConteneurServiceCharge} 
                      onChange={(e) => setTransitaireConteneurServiceCharge(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Ouverture dossier (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireOuvertureDossier} 
                      onChange={(e) => setTransitaireOuvertureDossier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Commission avance fonds (taux)
                    </label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireCommissionAvanceFonds} 
                      onChange={(e) => setTransitaireCommissionAvanceFonds(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Imprimer/Fax (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireImprimerFax} 
                      onChange={(e) => setTransitaireImprimerFax(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Commission transit (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireCommissionTransit} 
                      onChange={(e) => setTransitaireCommissionTransit(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taxe Sydam (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireTaxeSydam} 
                      onChange={(e) => setTransitaireTaxeSydam(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Paramètres HAD selon valeur CAF */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres HAD selon valeur CAF</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Seuil 1 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADSeuil1} 
                      onChange={(e) => setTransitaireHADSeuil1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taux 1
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADTaux1} 
                      onChange={(e) => setTransitaireHADTaux1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais fixe 1 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADFraisFixe1} 
                      onChange={(e) => setTransitaireHADFraisFixe1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Seuil 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADSeuil2} 
                      onChange={(e) => setTransitaireHADSeuil2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taux 2
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADTaux2} 
                      onChange={(e) => setTransitaireHADTaux2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais fixe 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADFraisFixe2} 
                      onChange={(e) => setTransitaireHADFraisFixe2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Seuil 3 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADSeuil3} 
                      onChange={(e) => setTransitaireHADSeuil3(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taux 3
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADTaux3} 
                      onChange={(e) => setTransitaireHADTaux3(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais fixe 3 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADFraisFixe3} 
                      onChange={(e) => setTransitaireHADFraisFixe3(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Seuil 4 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADSeuil4} 
                      onChange={(e) => setTransitaireHADSeuil4(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taux 4
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADTaux4} 
                      onChange={(e) => setTransitaireHADTaux4(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais fixe 4 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADFraisFixe4} 
                      onChange={(e) => setTransitaireHADFraisFixe4(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Taux 5
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADTaux5} 
                      onChange={(e) => setTransitaireHADTaux5(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Frais fixe 5 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireHADFraisFixe5} 
                      onChange={(e) => setTransitaireHADFraisFixe5(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Paramètres de livraison selon zone et type de conteneur */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres de livraison selon zone et type de conteneur</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Livraison 20 Zone 1 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireLivraison20Zone1} 
                      onChange={(e) => setTransitaireLivraison20Zone1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Livraison 20 Zone 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireLivraison20Zone2} 
                      onChange={(e) => setTransitaireLivraison20Zone2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Livraison 20 Zone 3 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireLivraison20Zone3} 
                      onChange={(e) => setTransitaireLivraison20Zone3(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Livraison 40 Zone 1 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireLivraison40Zone1} 
                      onChange={(e) => setTransitaireLivraison40Zone1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Livraison 40 Zone 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireLivraison40Zone2} 
                      onChange={(e) => setTransitaireLivraison40Zone2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Livraison 40 Zone 3 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireLivraison40Zone3} 
                      onChange={(e) => setTransitaireLivraison40Zone3(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Paramètres de relevage selon zone et type de conteneur */}
              <div className="bg-white rounded-lg p-6 border border-cote-ivoire-light">
                <h2 className="text-white font-semibold mb-4">Paramètres de relevage selon zone et type de conteneur</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Relevage 20 Zone 1 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireRelevage20Zone1} 
                      onChange={(e) => setTransitaireRelevage20Zone1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Relevage 20 Zone 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireRelevage20Zone2} 
                      onChange={(e) => setTransitaireRelevage20Zone2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Relevage 20 Zone 3 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireRelevage20Zone3} 
                      onChange={(e) => setTransitaireRelevage20Zone3(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Relevage 40 Zone 1 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireRelevage40Zone1} 
                      onChange={(e) => setTransitaireRelevage40Zone1(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Relevage 40 Zone 2 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireRelevage40Zone2} 
                      onChange={(e) => setTransitaireRelevage40Zone2(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Relevage 40 Zone 3 (FCFA)
                    </label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full px-3 py-2 bg-cote-ivoire-lighter border border-cote-ivoire-light rounded-md text-white" 
                      value={transitaireRelevage40Zone3} 
                      onChange={(e) => setTransitaireRelevage40Zone3(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div>
                <button onClick={handleSave} className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {activeTab === 'tableaux' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
                <h1 className="text-xl font-bold text-gray-800 mb-2">Tableaux de données</h1>
                <p className="text-gray-600 text-sm">Parcourez et modifiez les données TEC, VOC et TarifPORT importées.</p>
              </div>

              {/* Tableaux de données modifiables */}
              <div className="space-y-8">
                <TECDataTable />
                <VOCDataTable />
                <TarifPORTDataTable />
              </div>
            </div>
          )}

          {activeTab === 'admin-decisions' && (
            <div className="space-y-6">
              <TestAdminDecisions />
              <AdminDecisionsSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 
