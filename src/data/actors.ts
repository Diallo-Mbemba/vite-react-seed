export interface ActorData {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  type: 'importateur' | 'fournisseur' | 'transitaire';
  zone?: string;
  pays?: string; // Code ISO du pays (ex: 'FR', 'DE', 'CN')
}

export let ACTORS_DATABASE: ActorData[] = [
  // Importateurs
  {
    id: 'imp_001',
    nom: 'SARL IMPORT PLUS',
    adresse: 'BP 1234, Douala, Cameroun',
    telephone: '+237 233 42 15 67',
    email: 'contact@importplus.cm',
    type: 'importateur'
  },
  {
    id: 'imp_002',
    nom: 'CAMEROON TRADE COMPANY',
    adresse: 'Rue de la Liberté, Yaoundé, Cameroun',
    telephone: '+237 222 31 45 89',
    email: 'info@camtrade.cm',
    type: 'importateur'
  },
  {
    id: 'imp_003',
    nom: 'AFRICA BUSINESS GROUP',
    adresse: 'Zone Industrielle, Douala, Cameroun',
    telephone: '+237 233 56 78 90',
    email: 'contact@africabg.com',
    type: 'importateur'
  },

  // Fournisseurs
  {
    id: 'four_001',
    nom: 'EUROPEAN SUPPLIERS LTD',
    adresse: '123 Business Street, Hamburg, Germany',
    telephone: '+49 40 123 456 789',
    email: 'sales@eurosuppliers.de',
    type: 'fournisseur',
    pays: 'DE'
  },
  {
    id: 'four_002',
    nom: 'ASIA MANUFACTURING CO.',
    adresse: '456 Industrial Zone, Shanghai, China',
    telephone: '+86 21 987 654 321',
    email: 'export@asiamfg.cn',
    type: 'fournisseur',
    pays: 'CN'
  },
  {
    id: 'four_003',
    nom: 'FRENCH EXPORT SARL',
    adresse: '789 Avenue de la République, Marseille, France',
    telephone: '+33 4 91 12 34 56',
    email: 'commercial@frenchexport.fr',
    type: 'fournisseur',
    pays: 'FR'
  },

  // Transitaires
  {
    id: 'trans_001',
    nom: 'BOLLORE LOGISTICS',
    adresse: 'Port Autonome de Douala, Cameroun',
    telephone: '+237 233 40 50 60',
    email: 'douala@bollore.com',
    type: 'transitaire'
  },
  {
    id: 'trans_002',
    nom: 'MAERSK CAMEROON',
    adresse: 'Terminal à Conteneurs, Douala, Cameroun',
    telephone: '+237 233 45 67 89',
    email: 'cameroon@maersk.com',
    type: 'transitaire'
  },
  {
    id: 'trans_003',
    nom: 'SAGA CAMEROUN',
    adresse: 'Rue des Transitaires, Douala, Cameroun',
    telephone: '+237 233 78 90 12',
    email: 'operations@saga.cm',
    type: 'transitaire'
  }
];

export const getActorsByType = (type: ActorData['type']): ActorData[] => {
  return ACTORS_DATABASE.filter(actor => actor.type === type);
};

export const getActorById = (id: string): ActorData | undefined => {
  return ACTORS_DATABASE.find(actor => actor.id === id);
};

export const addActor = (newActor: ActorData): void => {
  ACTORS_DATABASE.push(newActor);
};

export const updateActor = (id: string, updatedActor: Omit<ActorData, 'id'>): boolean => {
  const index = ACTORS_DATABASE.findIndex(actor => actor.id === id);
  if (index !== -1) {
    ACTORS_DATABASE[index] = { ...updatedActor, id };
    return true;
  }
  return false;
};

export const deleteActor = (id: string): boolean => {
  const index = ACTORS_DATABASE.findIndex(actor => actor.id === id);
  if (index !== -1) {
    ACTORS_DATABASE.splice(index, 1);
    return true;
  }
  return false;
};
