/**
 * Utilitaire pour nettoyer le localStorage des données critiques
 * qui devraient être stockées dans Supabase
 */

/**
 * Liste des clés localStorage qui contiennent des données critiques
 * qui doivent être dans Supabase et non dans localStorage
 */
const CRITICAL_KEYS = [
  'user',           // Utilisateur - devrait être dans Supabase Auth + users_app
  'users',          // Liste d'utilisateurs - devrait être dans users_app
  'simulations',   // Simulations - devrait être dans simulations
  'orders',         // Commandes - devrait être dans orders
  'orderValidations', // Validations - devrait être dans order_validations
  'paymentRecords', // Paiements - devrait être dans orders
  'paymentValidations', // Validations paiements - devrait être dans order_validations
  'stripePayments', // Paiements Stripe - devrait être dans orders
  'userInscriptions', // Inscriptions - devrait être dans users_app
  // Les pools de crédits et usage sont gérés par Supabase maintenant
  // mais on garde les anciennes clés pour nettoyage
  ...Array.from({ length: 100 }, (_, i) => `creditPools_${i}`),
  ...Array.from({ length: 100 }, (_, i) => `creditUsage_${i}`),
];

/**
 * Clés qui peuvent rester en localStorage (données de référence ou temporaires)
 */
const ALLOWED_KEYS = [
  'tecArticles',           // Données de référence TEC
  'vocProducts',           // Données de référence VOC
  'tarifportProducts',     // Données de référence TarifPORT
  'adminDecisionCriteria', // Critères de décision admin (préférences)
  'hasSeenWarning',        // Préférence UI temporaire
  'hasShownLastCreditNotice', // Préférence UI temporaire
  'invoiceHistory',        // Historique local (peut être migré vers Supabase plus tard)
  'cashierSessions',        // Sessions de caissier temporaires
  'activeCashierSession',  // Session active temporaire
  'settings',              // Paramètres (peuvent rester en localStorage pour performance)
];

/**
 * Nettoyer le localStorage des données critiques
 * @param keepAllowed - Si true, garde les clés autorisées. Si false, nettoie tout sauf les clés autorisées.
 */
export const cleanupLocalStorage = (keepAllowed: boolean = true): void => {
  console.log('🧹 Nettoyage du localStorage...');
  
  let cleanedCount = 0;
  const cleanedKeys: string[] = [];

  // Nettoyer les clés critiques
  CRITICAL_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleanedKeys.push(key);
      cleanedCount++;
    }
  });

  // Si on ne garde pas les clés autorisées, nettoyer aussi les autres clés non autorisées
  if (!keepAllowed) {
    // Parcourir toutes les clés du localStorage
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !ALLOWED_KEYS.includes(key) && !CRITICAL_KEYS.includes(key)) {
        allKeys.push(key);
      }
    }
    
    allKeys.forEach(key => {
      // Vérifier si c'est une clé de crédit (format creditPools_* ou creditUsage_*)
      if (key.startsWith('creditPools_') || key.startsWith('creditUsage_')) {
        localStorage.removeItem(key);
        cleanedKeys.push(key);
        cleanedCount++;
      }
    });
  }

  if (cleanedCount > 0) {
    console.log(`✅ ${cleanedCount} clé(s) nettoyée(s) du localStorage:`, cleanedKeys);
  } else {
    console.log('✅ Aucune donnée critique trouvée dans le localStorage');
  }
};

/**
 * Vérifier quelles clés critiques sont présentes dans le localStorage
 */
export const checkLocalStorage = (): { critical: string[]; allowed: string[]; other: string[] } => {
  const critical: string[] = [];
  const allowed: string[] = [];
  const other: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (CRITICAL_KEYS.some(k => key === k || key.startsWith('creditPools_') || key.startsWith('creditUsage_'))) {
      critical.push(key);
    } else if (ALLOWED_KEYS.includes(key)) {
      allowed.push(key);
    } else {
      other.push(key);
    }
  }

  return { critical, allowed, other };
};

/**
 * Nettoyer le localStorage lors de la connexion
 * À appeler après une connexion réussie à Supabase
 */
export const cleanupOnLogin = (): void => {
  console.log('🔐 Nettoyage du localStorage après connexion Supabase...');
  cleanupLocalStorage(true);
  
  // Vérifier s'il reste des données critiques
  const { critical } = checkLocalStorage();
  if (critical.length > 0) {
    console.warn('⚠️ Des données critiques sont encore présentes dans le localStorage:', critical);
    // Nettoyer à nouveau
    critical.forEach(key => localStorage.removeItem(key));
    console.log('✅ Nettoyage supplémentaire effectué');
  }
};


