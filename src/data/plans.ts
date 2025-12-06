import { Plan } from '../types';

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    credits: 3,
    color: 'bg-gray-100 text-gray-800',
    description: 'Parfait pour découvrir notre service',
    features: [
      '3 simulations gratuites',
      'Calculateur de base',
      'Support par email',
      'Historique limité'
    ]
  },
  {
    id: 'bronze',
    name: 'Bronze',
    price: 1000,
    credits: 1,
    color: 'bg-gradient-to-br from-cote-ivoire-primary to-cote-ivoire-accent text-white',
    description: 'Pour les besoins ponctuels',
    features: [
      '1 simulation',
      'Calculateur avancé',
      'Support prioritaire',
      'Rapport détaillé'
    ]
  },
  {
    id: 'silver',
    name: 'Argent',
    price: 8000,
    credits: 10,
    color: 'bg-gradient-to-br from-cote-ivoire-secondary to-cote-ivoire-primary text-white',
    description: 'Idéal pour les PME',
    features: [
      '10 simulations',
      'Calculateur avancé',
      'Support prioritaire',
      'Rapports exportables',
      'Historique complet'
    ]
  },
  {
    id: 'gold',
    name: 'Or',
    price: 88000,
    credits: 100,
    color: 'bg-gradient-to-br from-cote-ivoire-warning to-cote-ivoire-secondary text-white',
    description: 'Pour les entreprises en croissance',
    features: [
      '100 simulations',
      'Calculateur expert',
      'Support dédié',
      'API access',
      'Rapports personnalisés',
      'Alertes marché'
    ]
  },
  {
    id: 'diamond',
    name: 'Diamant',
    price: 880000,
    credits: 1000,
    color: 'bg-gradient-to-br from-cote-ivoire-success to-cote-ivoire-primary text-white',
    description: 'Solution enterprise',
    features: [
      '1000 simulations',
      'Calculateur premium',
      'Support 24/7',
      'API illimitée',
      'Tableaux de bord avancés',
      'Formation incluse',
      'Intégration ERP'
    ]
  }
];
