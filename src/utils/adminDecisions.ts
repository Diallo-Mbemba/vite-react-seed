import { isUEMOACountry } from '../data/uemoa-countries';
import { adminDecisionService } from '../services/supabase/adminDecisionService';

export interface AdminDecisionCriteria {
  licenceControlArrival: number;
  licenceAdmissionFDI: number;
  fobDispenseRFCV: number;
  fobSoumisRFCV: number;
  fobVocNonAdmis: number;
  fobVocAdmis: number;
  assuranceNonRecevable: number;
  assuranceRecevable: number;
  coefficientSatisfaisant: number;
  rcpDifferentZero: boolean;
}

export interface AdminDecision {
  category: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
  icon: string;
}

export interface SimulationData {
  licence?: number;
  fob?: number;
  fobVoc?: number;
  assurance?: number;
  caf?: number;
  coefficientRevient?: number;
  rcp?: number;
  rrr?: number;
  modePaiement?: string;
  incoterm?: string;
  route?: string;
  paysFournisseur?: string;
}

// Critères par défaut
const defaultCriteria: AdminDecisionCriteria = {
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
};

// Cache pour éviter les appels répétés
let criteriaCache: AdminDecisionCriteria | null = null;
let criteriaCacheTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute

// Charger les critères depuis Supabase (avec cache)
const getCriteria = async (userId?: string): Promise<AdminDecisionCriteria> => {
  // Vérifier le cache
  const now = Date.now();
  if (criteriaCache && (now - criteriaCacheTime) < CACHE_DURATION) {
    return criteriaCache;
  }

  try {
    const saved = await adminDecisionService.getCriteria(userId);
    if (saved && saved.criteriaData) {
      criteriaCache = { ...defaultCriteria, ...saved.criteriaData };
      criteriaCacheTime = now;
      return criteriaCache;
    }
  } catch (error) {
    console.error('Error loading criteria from Supabase:', error);
    // Fallback vers localStorage pour migration progressive
    try {
      const saved = localStorage.getItem('adminDecisionCriteria');
      if (saved) {
        const parsed = JSON.parse(saved);
        criteriaCache = { ...defaultCriteria, ...parsed };
        criteriaCacheTime = now;
        return criteriaCache;
      }
    } catch (localError) {
      console.error('Error loading criteria from localStorage:', localError);
    }
  }

  criteriaCache = defaultCriteria;
  criteriaCacheTime = now;
  return criteriaCache;
};

export const generateAdminDecisions = async (data: SimulationData, userId?: string): Promise<AdminDecision[]> => {
  console.log('🔥 GENERATE ADMIN DECISIONS CALLED 🔥');
  console.log('generateAdminDecisions called with data:', data);
  const criteria = await getCriteria(userId);
  console.log('Criteria loaded:', criteria);
  console.log('Data properties:', {
    licence: data.licence,
    fob: data.fob,
    fobVoc: data.fobVoc,
    assurance: data.assurance,
    caf: data.caf,
    coefficientRevient: data.coefficientRevient,
    rcp: data.rcp,
    rrr: data.rrr,
    modePaiement: data.modePaiement,
    incoterm: data.incoterm,
    route: data.route,
    paysFournisseur: data.paysFournisseur
  });
  const decisions: AdminDecision[] = [];

  // 1. Décisions basées sur la licence
  console.log('=== ÉVALUATION LICENCE ===');
  console.log('data.licence:', data.licence);
  console.log('criteria.licenceControlArrival:', criteria.licenceControlArrival);
  console.log('criteria.licenceAdmissionFDI:', criteria.licenceAdmissionFDI);
  
  if (data.licence !== undefined) {
    console.log('Licence définie, évaluation des conditions...');
    if (data.licence === criteria.licenceControlArrival) {
      console.log('→ Condition contrôle d\'arrivée remplie');
      decisions.push({
        category: 'Licence',
        title: 'Contrôle d\'arrivée',
        description: 'CONTROLE D\'ARRIVEE',
        type: 'warning',
        icon: '🚨'
      });
    } else if (data.licence >= criteria.licenceAdmissionFDI) {
      console.log('→ Condition admission FDI remplie');
      decisions.push({
        category: 'Licence',
        title: 'Admission FDI',
        description: 'ADMIS A LA LEVEE DE LA FDI PAR CONNECTION GUCE',
        type: 'success',
        icon: '✅'
      });
    } else {
      console.log('→ Aucune condition licence remplie');
    }
  } else {
    console.log('→ Licence non définie');
  }

  // 2. Décisions basées sur FOB
  console.log('=== ÉVALUATION FOB ===');
  console.log('data.fob:', data.fob);
  console.log('criteria.fobDispenseRFCV:', criteria.fobDispenseRFCV);
  console.log('criteria.fobSoumisRFCV:', criteria.fobSoumisRFCV);
  
  if (data.fob !== undefined) {
    console.log('FOB défini, évaluation des conditions...');
    if (data.fob < criteria.fobDispenseRFCV) {
      console.log('→ Condition dispense RFCV remplie');
      decisions.push({
        category: 'FOB',
        title: 'Dispense RFCV',
        description: 'DISPENSE RFCV',
        type: 'info',
        icon: 'ℹ️'
      });
    } else if (data.fob >= criteria.fobSoumisRFCV) {
      console.log('→ Condition soumis RFCV remplie');
      decisions.push({
        category: 'FOB',
        title: 'Soumis au RFCV',
        description: 'SOUMIS AU RFCV ET CONTROLE STRUCTURE EN CHARGE DE LA QUALITE PAR CONNECTION GUCE',
        type: 'warning',
        icon: '⚠️'
      });
    } else {
      console.log('→ Aucune condition FOB remplie');
    }
  } else {
    console.log('→ FOB non défini');
  }

  // 3. Décisions basées sur FOB_VOC
  if (data.fobVoc !== undefined) {
    if (data.fobVoc < criteria.fobVocNonAdmis) {
      decisions.push({
        category: 'FOB_VOC',
        title: 'Non admis VOC',
        description: 'NON ADMIS A LA LEVEE DU VOC PAR CONNECTION GUCE',
        type: 'error',
        icon: '❌'
      });
    } else if (data.fobVoc >= criteria.fobVocAdmis) {
      decisions.push({
        category: 'FOB_VOC',
        title: 'Admis VOC',
        description: 'ADMIS A LA LEVEE DU VOC CONTROLE OBLIGATOIRE AVANT EXPEDITION SELON LA ROUTE A-B-C CHOISIE',
        type: 'success',
        icon: '✅'
      });

      // Décisions basées sur la route
      if (data.route) {
        switch (data.route.toUpperCase()) {
          case 'A':
            decisions.push({
              category: 'Route',
              title: 'Route A',
              description: 'ROUTE A : CONTROLE PHYSIQUE OBLIGATOIRE - IMPORTATION IRREGULIERE OU PRODUITS SENSIBLES',
              type: 'warning',
              icon: '🔍'
            });
            break;
          case 'B':
            decisions.push({
              category: 'Route',
              title: 'Route B',
              description: 'ROUTE B : IMPORTATIONS REGULIERES DE PRODUITS HOMOGENES NON SENSIBLES PREALABLEMENT ENREGISTRES',
              type: 'info',
              icon: '📋'
            });
            break;
          case 'C':
            decisions.push({
              category: 'Route',
              title: 'Route C',
              description: 'ROUTE C : MARCHANDISES SOUS CERTIFICATION - CONTROLE DOCUMENTAIRE',
              type: 'info',
              icon: '📄'
            });
            break;
        }
      }
    }
  }

  // 4. Décisions basées sur l'assurance
  console.log('=== ÉVALUATION ASSURANCE ===');
  console.log('data.assurance:', data.assurance);
  console.log('criteria.assuranceNonRecevable:', criteria.assuranceNonRecevable);
  console.log('criteria.assuranceRecevable:', criteria.assuranceRecevable);
  
  if (data.assurance !== undefined) {
    if (data.assurance < criteria.assuranceNonRecevable) {
      decisions.push({
        category: 'Assurance',
        title: 'Prime non recevable',
        description: `PRIME NON RECEVABLE PAR LA DOUANE, NE PEUT ETRE INFERIEUR A ${criteria.assuranceNonRecevable} F.CFA - REDRESSEMENT DOUANE F.CFA HORS FRAIS ASACI`,
        type: 'error',
        icon: '❌'
      });
    } else if (data.assurance >= criteria.assuranceRecevable) {
      decisions.push({
        category: 'Assurance',
        title: 'Prime recevable',
        description: 'ASSURANCE TRANSPORT FACULTE GUCE, PRIME POTENTIELLEMENT RECEVABLE PAR LA DOUANE',
        type: 'success',
        icon: '✅'
      });
    } else {
      decisions.push({
        category: 'Assurance',
        title: 'Certificat d\'assurance',
        description: 'LEVER UN CERTIFICAT D\'ASSURANCE VIA LE GUCE',
        type: 'info',
        icon: '📋'
      });
    }

    // Vérification de la valeur d'assurance par rapport à CAF
    if (data.caf !== undefined) {
      const valeurAssuranceEnDouane = 0.95 * data.caf;
      if (data.assurance < valeurAssuranceEnDouane) {
        decisions.push({
          category: 'Assurance',
          title: 'Valeur assurance insuffisante',
          description: `LA VALEUR DE L'ASSURANCE DOIT ETRE SUPERIEURE A 95% de la valeur CAF soit ${valeurAssuranceEnDouane.toLocaleString('fr-FR')} F.CFA`,
          type: 'warning',
          icon: '⚠️'
        });
      }
    }
  }

  // 5. Décisions basées sur le pays du fournisseur (UEMOA)
  if (data.paysFournisseur && isUEMOACountry(data.paysFournisseur)) {
    decisions.push({
      category: 'UEMOA',
      title: 'Autorisation de change',
      description: 'ADMIS A LA LEVEE DE L\'AUTORISATION DE CHANGE',
      type: 'success',
      icon: '✅'
    });
  }

  // 6. Décisions basées sur le mode de paiement
  if (data.modePaiement) {
    switch (data.modePaiement.toLowerCase()) {
      case 'crédit documentaire':
      case 'credit documentaire':
        decisions.push({
          category: 'Paiement',
          title: 'Crédit documentaire',
          description: 'CREDIT DOCUMENTAIRE FORTE SECURITE NB: FRAIS BANCAIRES ET FINANCIERS PLUS ELEVES SI IRREVOCABLE ET CONFIRMES',
          type: 'success',
          icon: '🔒'
        });
        break;
      case 'remise documentaire':
      case 'remise documentaire':
        decisions.push({
          category: 'Paiement',
          title: 'Remise documentaire',
          description: 'REMISE DOCUMENTAIRE CONTRE PAIEMENT - BONNE SECURITE SI DOCUMENTS CONFORMES',
          type: 'info',
          icon: '📄'
        });
        break;
      case 'virement bancaire':
      case 'virement':
        decisions.push({
          category: 'Paiement',
          title: 'Virement bancaire',
          description: 'VIREMENT- TRES FAIBLE SECURITE DE PAIEMENT',
          type: 'warning',
          icon: '⚠️'
        });
        break;
    }
  }

  // 7. Décisions basées sur l'Incoterm
  if (data.incoterm) {
    const incotermDecisions: { [key: string]: { title: string; description: string } } = {
      'EXW': {
        title: 'EXW',
        description: 'EXW- PRISE EN CHARGE DES RISQUES ET DES DEPENSES DEPUIS L\'USINE DU FOURNISSEUR'
      },
      'FCA': {
        title: 'FCA',
        description: 'FCA- PRISE EN CHARGE DES RISQUES ET DES DEPENSES JUSQU\'AU LIEU CONVENU'
      },
      'FOB': {
        title: 'FOB',
        description: 'FOB- PRISE EN CHARGE DES RISQUES ET DES FRAIS DEPUIS BORD NAVIRE EXPORT'
      },
      'CFR': {
        title: 'CFR',
        description: 'CFR- PRISE EN CHARGE DES RISQUES ET DES DEPENSES JUSQU\'AU PORT DE DESTINATION'
      },
      'CIF': {
        title: 'CIF',
        description: 'CIF- PRISE EN CHARGE DES RISQUES ET DES DEPENSES ET ASSURANCE JUSQU\'AU PORT DE DESTINATION'
      },
      'DDP': {
        title: 'DDP',
        description: 'DDP- PRISE EN CHARGE DES RISQUES ET DES DEPENSES JUSQU\'A L\'ENTREPOT DU CLIENT - DROIT DE DOUANE PAYE'
      },
      'DPU': {
        title: 'DPU',
        description: 'DPU- PRISE EN CHARGE DES RISQUES ET DES DEPENSES JUSQU\'A L\'ENTREPOT DU CLIENT - DROIT DE DOUANE NON PAYE'
      }
    };

    const incotermDecision = incotermDecisions[data.incoterm.toUpperCase()];
    if (incotermDecision) {
      decisions.push({
        category: 'Incoterm',
        title: incotermDecision.title,
        description: incotermDecision.description,
        type: 'info',
        icon: '📦'
      });
    }
  }

  // 8. Décisions basées sur le coefficient de revient
  if (data.coefficientRevient !== undefined) {
    if (data.coefficientRevient <= criteria.coefficientSatisfaisant) {
      decisions.push({
        category: 'Coefficient',
        title: 'Coefficient satisfaisant',
        description: 'COEFFICIENT MULTIPLICATEUR SATISFAISANT POUR LE MODE MARITIME',
        type: 'success',
        icon: '✅'
      });
    } else {
      decisions.push({
        category: 'Coefficient',
        title: 'Coefficient non satisfaisant',
        description: 'COEFFICIENT MULTIPLICATEUR NON SATISFAISANT POUR LE MODE MARITIME - POIDS ET VALEUR FAIBLE POUR CE MODE DE TRANSPORT',
        type: 'warning',
        icon: '⚠️'
      });
    }
  }

  // 9. Décision BSC (toujours présente)
  decisions.push({
    category: 'BSC',
    title: 'BSC',
    description: 'ADMIS A LA LEVEE DU BSC',
    type: 'success',
    icon: '✅'
  });

  // 10. Décisions basées sur RCP/RRR
  if (criteria.rcpDifferentZero && data.rcp !== undefined && data.rcp !== 0) {
    decisions.push({
      category: 'RCP/RRR',
      title: 'Redevance RCP/RRR',
      description: 'SOUMIS A LA REDEVANCE RCP / RRR',
      type: 'info',
      icon: '💰'
    });
  }

  // Toujours ajouter la décision BSC (elle doit toujours être présente)
  // Cette décision a déjà été ajoutée plus haut dans le code, mais on s'assure qu'elle existe
  const hasBSC = decisions.some(d => d.category === 'BSC');
  if (!hasBSC) {
    decisions.push({
      category: 'BSC',
      title: 'BSC',
      description: 'ADMIS A LA LEVEE DU BSC',
      type: 'success',
      icon: '✅'
    });
  }

  console.log('Generated decisions:', decisions.length, decisions);
  return decisions;
};
