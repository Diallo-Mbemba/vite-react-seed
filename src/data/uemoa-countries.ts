// Pays de l'Union Économique et Monétaire Ouest-Africaine (UEMOA)
export const UEMOA_COUNTRIES = [
  'BF', // Burkina Faso
  'CI', // Côte d'Ivoire
  'ML', // Mali
  'NE', // Niger
  'SN', // Sénégal
  'TG', // Togo
  'BJ', // Bénin
  'GW'  // Guinée-Bissau
];

// Fonction utilitaire pour vérifier si un pays fait partie de l'UEMOA
export const isUEMOACountry = (countryCode: string): boolean => {
  return UEMOA_COUNTRIES.includes(countryCode);
};

// Fonction utilitaire pour obtenir le nom du pays UEMOA
export const getUEMOACountryName = (countryCode: string): string => {
  const names: { [key: string]: string } = {
    'BF': 'Burkina Faso',
    'CI': 'Côte d\'Ivoire',
    'ML': 'Mali',
    'NE': 'Niger',
    'SN': 'Sénégal',
    'TG': 'Togo',
    'BJ': 'Bénin',
    'GW': 'Guinée-Bissau'
  };
  return names[countryCode] || countryCode;
};
