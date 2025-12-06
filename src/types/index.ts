export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
  remainingCredits: number;
  totalCredits: number;
  createdAt: Date;
  // Nouveau système FIFO pour les crédits
  creditPools?: CreditPool[];
}

export interface Simulation {
  id: string;
  userId: string;
  productName: string;
  numeroFacture?: string; // Numéro de facture lié à la simulation
  fournisseur?: string; // Nom du fournisseur
  fob: number;
  fret: number;
  assurance: number;
  droitDouane: number;
  tva: number;
  fraisFinanciers: number;
  prestationTransitaire: number;
  rpi: number;
  coc: number;
  bsc: number;
  creditEnlevement: number;
  rrr: number;
  rcp: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  currency: string;
  status: 'in_progress' | 'completed' | 'deleted'; // Ajout de 'deleted' pour la suppression logique
  // Données pour la reprise exacte
  activeTab?: string;
  maxStepReached?: number;
  formData?: {
    dossier: string;
    numeroFacture: string;
    dateFacture: string;
    dateTransaction: string;
    montantFacture: string;
    devise: string;
    tauxChange: number;
    incoterm: string;
    modeTransport: string;
    route: string;
    typeConteneur: string;
    nombreConteneurs: number;
    regimeDouanier: string;
    modePaiement: string;
    fob: string;
    fret: string;
    assurance: string;
    droitDouane: string;
    fraisFinanciers: string;
    prestationTransitaire: string;
    rpi: string;
    coc: string;
    bsc: string;
    creditEnlevement: string;
    rrr: string;
    rcp: string;
  };
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
  };
  criteria?: {
    includeTVA: boolean;
    isDangerous: boolean;
    includeTransitaire: boolean;
  };
  selectedActors?: {
    importateur: string;
    fournisseur: string;
    transitaire: string;
  };
  articles?: Array<{
    id: string;
    codeHS: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
    poids: number;
    tauxDroit: number;
    montantDroit: number;
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
  }>;
  correctionHistory?: Array<{
    originalCode: string;
    newCode: string;
    designation: string;
    date: Date;
    tariffs?: any;
  }>;
}

export type PlanType = 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  credits: number;
  color: string;
  description: string;
  features: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Nouveau système FIFO pour les crédits
export interface CreditPool {
  id: string;
  orderId: string; // Référence à la commande source
  orderNumber: string; // Numéro de commande lisible
  planId: PlanType;
  planName: string;
  totalCredits: number; // Crédits initiaux de cette commande
  remainingCredits: number; // Crédits restants de cette commande
  createdAt: Date; // Date de création de la commande
  expiresAt?: Date; // Date d'expiration (optionnel)
  isActive: boolean; // Pool actif ou non
}

// Historique des crédits utilisés
export interface CreditUsage {
  id: string;
  userId: string;
  simulationId: string;
  creditPoolId: string; // Référence au pool de crédits utilisé
  orderId: string; // Commande source du crédit
  orderNumber: string;
  usedAt: Date;
  simulationName: string; // Nom du dossier de simulation
}

export interface SimulationResult {
  dossier: string;
  numeroFacture: string;
  dateFacture: string;
  dateTransaction: string;
  montantFacture: number;
  devise: string;
  tauxChange: number;
  incoterm: string;
  regimeDouanier?: string;
  modePaiement?: string;
  includeTransitaire: boolean;
  transport?: {
    mode: string;
    route: string;
    typeConteneur: string;
    nombreConteneurs: number;
    poidsTotalTonnes?: string;
  };
  fob: number;
  fret: number;
  assurance: number;
  droitDouane: number;
  fraisFinanciers: number;
  prestationTransitaire: number;
  rpi: number;
  rpiDetail?: {
    tranche: string;
    fob: number;
    thresholdMin: number;
    thresholdMid: number;
    flat: number;
    licenceRate: number;
    licenceMin: number;
    licence: number;
    applied: number;
  };
  coc: number;
  bsc: number;
  creditEnlevement: number;
  rrr: number;
  rcp: number;
  tsDouane: number;
  avanceFonds: number;
  totalCost: number;
  items: Array<{
    id: string;
    codeHS: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
    poids: number;
    tauxDroit: number;
    montantDroit: number;
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
  }>;
  includeTVA: boolean;
  isDangerous: boolean;
  selectedActors: {
    importateur: string;
    fournisseur: string;
    transitaire: string;
  };
  actors?: Array<{
    id: string;
    nom: string;
    type: string;
  } | null>;
}
