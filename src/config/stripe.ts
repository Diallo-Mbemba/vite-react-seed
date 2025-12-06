import { loadStripe, Stripe, StripeElementLocale } from '@stripe/stripe-js';

// Configuration Stripe
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
  webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
  currency: (import.meta.env.VITE_DEFAULT_CURRENCY || 'XAF').toLowerCase(), // Stripe nécessite des minuscules
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
};

// Instance Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!STRIPE_CONFIG.publishableKey || STRIPE_CONFIG.publishableKey.trim() === '') {
    console.warn('Stripe publishable key is missing. Stripe features will be disabled.');
    return Promise.resolve(null);
  }
  
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

// Validation de la configuration
export const validateStripeConfig = (): boolean => {
  // Seule la clé publique est nécessaire côté client
  if (!STRIPE_CONFIG.publishableKey || STRIPE_CONFIG.publishableKey.trim() === '') {
    console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY est manquante dans le fichier .env');
    return false;
  }
  
  if (!STRIPE_CONFIG.publishableKey.startsWith('pk_test_') && !STRIPE_CONFIG.publishableKey.startsWith('pk_live_')) {
    console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY semble invalide (doit commencer par pk_test_ ou pk_live_)');
    return false;
  }
  
  return true;
};

// Options par défaut pour les paiements
export const DEFAULT_PAYMENT_OPTIONS = {
  currency: STRIPE_CONFIG.currency, // Déjà en minuscules depuis STRIPE_CONFIG
  locale: 'fr' as StripeElementLocale,
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#f39c12', // Couleur Côte d'Ivoire
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
};

