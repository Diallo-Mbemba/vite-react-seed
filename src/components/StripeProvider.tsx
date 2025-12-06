import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe, DEFAULT_PAYMENT_OPTIONS, validateStripeConfig } from '../config/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children, clientSecret }) => {
  // Vérifier la configuration Stripe
  if (!validateStripeConfig()) {
    console.warn('Configuration Stripe manquante. Les paiements ne fonctionneront pas.');
    return <>{children}</>;
  }

  const stripePromise = getStripe();

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        ...DEFAULT_PAYMENT_OPTIONS,
        currency: DEFAULT_PAYMENT_OPTIONS.currency || 'xaf', // Déjà en minuscules
        clientSecret,
      }}
    >
      {children}
    </Elements>
  );
};

export default StripeProvider;

