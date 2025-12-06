export interface Incoterm {
  code: string;
  name: string;
  description: string;
  category: 'maritime' | 'multimodal';
  riskTransfer: string;
  costResponsibility: string;
}

export const INCOTERMS: Incoterm[] = [
  // Incoterms multimodaux (tous modes de transport)
  {
    code: 'EXW',
    name: 'Ex Works (À l\'usine)',
    description: 'Le vendeur met la marchandise à disposition dans ses locaux',
    category: 'multimodal',
    riskTransfer: 'Locaux du vendeur',
    costResponsibility: 'Acheteur prend en charge tous les coûts'
  },
  {
    code: 'FCA',
    name: 'Free Carrier (Franco transporteur)',
    description: 'Le vendeur remet la marchandise au transporteur désigné par l\'acheteur',
    category: 'multimodal',
    riskTransfer: 'Remise au transporteur',
    costResponsibility: 'Vendeur jusqu\'au transporteur'
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To (Port payé jusqu\'à)',
    description: 'Le vendeur paie le transport jusqu\'au lieu de destination convenu',
    category: 'multimodal',
    riskTransfer: 'Remise au transporteur',
    costResponsibility: 'Vendeur paie le transport principal'
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To (Port payé, assurance comprise)',
    description: 'Le vendeur paie transport et assurance jusqu\'au lieu de destination',
    category: 'multimodal',
    riskTransfer: 'Remise au transporteur',
    costResponsibility: 'Vendeur paie transport et assurance'
  },
  {
    code: 'DAP',
    name: 'Delivered At Place (Rendu au lieu de destination)',
    description: 'Le vendeur livre la marchandise au lieu de destination convenu',
    category: 'multimodal',
    riskTransfer: 'Lieu de destination',
    costResponsibility: 'Vendeur jusqu\'au lieu de destination'
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded (Rendu au lieu de destination déchargé)',
    description: 'Le vendeur livre et décharge la marchandise au lieu convenu',
    category: 'multimodal',
    riskTransfer: 'Après déchargement',
    costResponsibility: 'Vendeur inclut déchargement'
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid (Rendu droits acquittés)',
    description: 'Le vendeur livre la marchandise dédouanée au lieu de destination',
    category: 'multimodal',
    riskTransfer: 'Lieu de destination final',
    costResponsibility: 'Vendeur paie tous les coûts et droits'
  },

  // Incoterms maritimes et voies navigables intérieures
  {
    code: 'FAS',
    name: 'Free Alongside Ship (Franco le long du navire)',
    description: 'Le vendeur livre la marchandise le long du navire au port d\'embarquement',
    category: 'maritime',
    riskTransfer: 'Le long du navire',
    costResponsibility: 'Vendeur jusqu\'au port d\'embarquement'
  },
  {
    code: 'FOB',
    name: 'Free On Board (Franco à bord)',
    description: 'Le vendeur livre la marchandise à bord du navire au port d\'embarquement',
    category: 'maritime',
    riskTransfer: 'À bord du navire',
    costResponsibility: 'Vendeur jusqu\'à bord du navire'
  },
  {
    code: 'CFR',
    name: 'Cost and Freight (Coût et fret)',
    description: 'Le vendeur paie les coûts et le fret jusqu\'au port de destination',
    category: 'maritime',
    riskTransfer: 'À bord du navire au port d\'embarquement',
    costResponsibility: 'Vendeur paie le fret maritime'
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight (Coût, assurance et fret)',
    description: 'Le vendeur paie coûts, assurance et fret jusqu\'au port de destination',
    category: 'maritime',
    riskTransfer: 'À bord du navire au port d\'embarquement',
    costResponsibility: 'Vendeur paie fret et assurance maritime'
  }
];

export const getIncotermByCode = (code: string): Incoterm | undefined => {
  return INCOTERMS.find(incoterm => incoterm.code === code);
};

export const getIncotermsByCategory = (category: 'maritime' | 'multimodal'): Incoterm[] => {
  return INCOTERMS.filter(incoterm => incoterm.category === category);
};
