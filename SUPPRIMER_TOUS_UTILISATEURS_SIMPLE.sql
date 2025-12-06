-- ============================================
-- SUPPRESSION SIMPLE DE TOUS LES UTILISATEURS
-- ============================================
-- ⚠️ ATTENTION: Ce script est DESTRUCTIF et irréversible
-- Il supprime TOUS les utilisateurs et toutes leurs données associées
-- ============================================

-- ============================================
-- 1. AFFICHER L'ÉTAT AVANT SUPPRESSION
-- ============================================
DO $$
DECLARE
  auth_users_count INTEGER;
  app_users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;
  SELECT COUNT(*) INTO app_users_count FROM public.users_app;
  
  RAISE NOTICE '⚠️  ATTENTION: Vous allez supprimer % utilisateur(s) et % profil(s)', auth_users_count, app_users_count;
  RAISE NOTICE '⚠️  Toutes les données associées seront également supprimées (CASCADE)';
END $$;

-- ============================================
-- 2. SUPPRIMER TOUS LES UTILISATEURS
-- ============================================
-- Cette suppression supprimera automatiquement:
-- - Tous les profils dans users_app (CASCADE)
-- - Toutes les simulations
-- - Toutes les commandes
-- - Tous les pools de crédits
-- - Tous les acteurs
-- - Toutes les factures
-- - Tous les paramètres
-- - Et toutes les autres données liées
DELETE FROM auth.users;

-- ============================================
-- 3. VÉRIFICATION FINALE
-- ============================================
DO $$
DECLARE
  auth_users_remaining INTEGER;
  app_users_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_users_remaining FROM auth.users;
  SELECT COUNT(*) INTO app_users_remaining FROM public.users_app;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Suppression terminée';
  RAISE NOTICE 'Utilisateurs restants: %', auth_users_remaining;
  RAISE NOTICE 'Profils restants: %', app_users_remaining;
END $$;

