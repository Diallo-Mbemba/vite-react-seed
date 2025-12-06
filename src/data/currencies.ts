export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number; // Taux par rapport au FCFA
}

export const CURRENCIES: Currency[] = [
  // Devises principales
  { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', exchangeRate: 1 },
  { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', exchangeRate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 655.957 },
  { code: 'USD', name: 'Dollar américain', symbol: '$', exchangeRate: 580.50 },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', exchangeRate: 750.25 },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', exchangeRate: 640.80 },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'C$', exchangeRate: 430.75 },
  { code: 'AUD', name: 'Dollar australien', symbol: 'A$', exchangeRate: 385.90 },
  
  // Devises asiatiques
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', exchangeRate: 4.15 },
  { code: 'CNY', name: 'Yuan chinois', symbol: '¥', exchangeRate: 82.30 },
  { code: 'KRW', name: 'Won sud-coréen', symbol: '₩', exchangeRate: 0.45 },
  { code: 'INR', name: 'Roupie indienne', symbol: '₹', exchangeRate: 7.20 },
  { code: 'SGD', name: 'Dollar de Singapour', symbol: 'S$', exchangeRate: 430.60 },
  { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$', exchangeRate: 74.50 },
  { code: 'THB', name: 'Baht thaïlandais', symbol: '฿', exchangeRate: 16.80 },
  { code: 'MYR', name: 'Ringgit malaisien', symbol: 'RM', exchangeRate: 130.40 },
  { code: 'IDR', name: 'Roupie indonésienne', symbol: 'Rp', exchangeRate: 0.038 },
  { code: 'VND', name: 'Dong vietnamien', symbol: '₫', exchangeRate: 0.024 },
  
  // Devises du Moyen-Orient et Afrique
  { code: 'AED', name: 'Dirham des Émirats', symbol: 'د.إ', exchangeRate: 158.20 },
  { code: 'SAR', name: 'Riyal saoudien', symbol: 'ر.س', exchangeRate: 154.80 },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'ج.م', exchangeRate: 18.75 },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'د.م.', exchangeRate: 58.90 },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'د.ت', exchangeRate: 185.60 },
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', exchangeRate: 32.15 },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦', exchangeRate: 0.75 },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: '₵', exchangeRate: 48.30 },
  
  // Devises d'Amérique latine
  { code: 'BRL', name: 'Real brésilien', symbol: 'R$', exchangeRate: 115.80 },
  { code: 'MXN', name: 'Peso mexicain', symbol: '$', exchangeRate: 34.20 },
  { code: 'ARS', name: 'Peso argentin', symbol: '$', exchangeRate: 1.65 },
  { code: 'CLP', name: 'Peso chilien', symbol: '$', exchangeRate: 0.65 },
  { code: 'COP', name: 'Peso colombien', symbol: '$', exchangeRate: 0.145 },
  
  // Autres devises importantes
  { code: 'RUB', name: 'Rouble russe', symbol: '₽', exchangeRate: 6.35 },
  { code: 'TRY', name: 'Livre turque', symbol: '₺', exchangeRate: 19.85 },
  { code: 'PLN', name: 'Zloty polonais', symbol: 'zł', exchangeRate: 145.30 },
  { code: 'CZK', name: 'Couronne tchèque', symbol: 'Kč', exchangeRate: 25.80 },
  { code: 'HUF', name: 'Forint hongrois', symbol: 'Ft', exchangeRate: 1.65 },
  { code: 'RON', name: 'Leu roumain', symbol: 'lei', exchangeRate: 132.40 },
  { code: 'BGN', name: 'Lev bulgare', symbol: 'лв', exchangeRate: 335.20 },
  { code: 'HRK', name: 'Kuna croate', symbol: 'kn', exchangeRate: 87.15 },
  { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr', exchangeRate: 55.90 },
  { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr', exchangeRate: 54.20 },
  { code: 'DKK', name: 'Couronne danoise', symbol: 'kr', exchangeRate: 88.10 },
  { code: 'ISK', name: 'Couronne islandaise', symbol: 'kr', exchangeRate: 4.25 }
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(currency => currency.code === code);
};

export const getExchangeRate = (fromCurrency: string, toCurrency: string = 'XAF'): number => {
  const from = getCurrencyByCode(fromCurrency);
  const to = getCurrencyByCode(toCurrency);
  
  if (!from || !to) return 1;
  
  // Conversion via FCFA comme devise de référence
  if (fromCurrency === 'XAF') return 1 / to.exchangeRate;
  if (toCurrency === 'XAF') return from.exchangeRate;
  
  return from.exchangeRate / to.exchangeRate;
};
