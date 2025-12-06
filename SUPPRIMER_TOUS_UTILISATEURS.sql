-- ============================================
-- SUPPRESSION COMPLÈTE DE TOUS LES UTILISATEURS
-- ============================================
-- ⚠️ ATTENTION: Ce script est DESTRUCTIF et irréversible
-- Il supprime TOUS les utilisateurs et toutes leurs données associées
-- ============================================
-- ⚠️ AVANT D'EXÉCUTER:
-- 1. Faites une sauvegarde complète de votre base de données
-- 2. Assurez-vous que c'est bien ce que vous voulez faire
-- 3. Ce script supprime aussi toutes les données liées (simulations, commandes, etc.)
-- ============================================

-- ============================================
-- 1. COMPTER LES UTILISATEURS AVANT SUPPRESSION
-- ============================================
DO $$
DECLARE
  auth_users_count INTEGER;
  app_users_count INTEGER;
BEGIN
  -- Compter les utilisateurs dans auth.users
  SELECT COUNT(*) INTO auth_users_count
  FROM auth.users;
  
  -- Compter les utilisateurs dans users_app
  SELECT COUNT(*) INTO app_users_count
  FROM public.users_app;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 ÉTAT ACTUEL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Utilisateurs dans auth.users: %', auth_users_count;
  RAISE NOTICE 'Profils dans users_app: %', app_users_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 2. COMPTER LES DONNÉES ASSOCIÉES QUI SERONT SUPPRIMÉES
-- ============================================
DO $$
DECLARE
  simulations_count INTEGER;
  orders_count INTEGER;
  credit_pools_count INTEGER;
  actors_count INTEGER;
  invoices_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO simulations_count FROM public.simulations;
  SELECT COUNT(*) INTO orders_count FROM public.orders;
  SELECT COUNT(*) INTO credit_pools_count FROM public.credit_pools;
  SELECT COUNT(*) INTO actors_count FROM public.actors;
  SELECT COUNT(*) INTO invoices_count FROM public.invoice_history;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 DONNÉES QUI SERONT SUPPRIMÉES (CASCADE):';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Simulations: %', simulations_count;
  RAISE NOTICE 'Commandes: %', orders_count;
  RAISE NOTICE 'Pools de crédits: %', credit_pools_count;
  RAISE NOTICE 'Acteurs: %', actors_count;
  RAISE NOTICE 'Factures: %', invoices_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Si vous voulez continuer, décommentez les sections suivantes';
  RAISE NOTICE '';
END $$;

-- ============================================
-- 3. OPTION 1: SUPPRIMER TOUS LES UTILISATEURS DE auth.users
-- ============================================
-- ⚠️ Cette méthode supprime TOUT (utilisateurs + toutes les données liées via CASCADE)
-- Décommentez la section ci-dessous pour exécuter

/*
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🗑️  Suppression de TOUS les utilisateurs de auth.users...';
  
  -- Supprimer tous les utilisateurs
  -- Cela supprimera automatiquement tous les profils dans users_app
  -- et toutes les données liées grâce aux contraintes CASCADE
  DELETE FROM auth.users;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % utilisateur(s) supprimé(s) de auth.users', deleted_count;
  RAISE NOTICE '✅ Toutes les données associées ont été supprimées (CASCADE)';
END $$;
*/

-- ============================================
-- 4. OPTION 2: SUPPRIMER TOUS LES PROFILS DE users_app
-- ============================================
-- ⚠️ Cette méthode ne supprime que les profils, pas les utilisateurs auth
-- Les utilisateurs pourront toujours se connecter mais n'auront plus de profil
-- Décommentez la section ci-dessous pour exécuter

/*
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🗑️  Suppression de TOUS les profils de users_app...';
  
  -- Supprimer tous les profils
  DELETE FROM public.users_app;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % profil(s) supprimé(s) de users_app', deleted_count;
  RAISE NOTICE '⚠️  Les utilisateurs dans auth.users existent toujours';
END $$;
*/

-- ============================================
-- 5. OPTION 3: SUPPRIMER UTILISATEUR PAR UTILISATEUR (avec détails)
-- ============================================
-- Cette méthode affiche des informations pour chaque utilisateur supprimé
-- Décommentez la section ci-dessous pour exécuter

/*
DO $$
DECLARE
  user_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🗑️  Suppression détaillée de tous les utilisateurs...';
  RAISE NOTICE '';
  
  -- Parcourir tous les utilisateurs
  FOR user_record IN
    SELECT 
      id,
      email,
      created_at
    FROM auth.users
    ORDER BY created_at
  LOOP
    -- Afficher les informations de l'utilisateur
    RAISE NOTICE '📋 Suppression de: % (ID: %, Créé le: %)', 
      user_record.email, 
      user_record.id, 
      user_record.created_at;
    
    -- Supprimer l'utilisateur
    DELETE FROM auth.users WHERE id = user_record.id;
    
    deleted_count := deleted_count + 1;
    RAISE NOTICE '  ✅ Utilisateur supprimé';
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total: % utilisateur(s) supprimé(s)', deleted_count;
END $$;
*/

-- ============================================
-- 6. OPTION 4: SUPPRIMER TOUS SAUF LES ADMINS
-- ============================================
-- Cette méthode conserve les administrateurs
-- Décommentez la section ci-dessous pour exécuter

/*
DO $$
DECLARE
  deleted_count INTEGER;
  kept_count INTEGER;
BEGIN
  RAISE NOTICE '🗑️  Suppression de tous les utilisateurs SAUF les admins...';
  
  -- Compter les admins qui seront conservés
  SELECT COUNT(DISTINCT user_id) INTO kept_count
  FROM public.admin_users
  WHERE is_active = true;
  
  RAISE NOTICE '📋 % admin(s) seront conservé(s)', kept_count;
  
  -- Supprimer tous les utilisateurs qui ne sont pas admin
  DELETE FROM auth.users
  WHERE id NOT IN (
    SELECT DISTINCT user_id 
    FROM public.admin_users 
    WHERE is_active = true
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % utilisateur(s) supprimé(s)', deleted_count;
  RAISE NOTICE '✅ % admin(s) conservé(s)', kept_count;
END $$;
*/

-- ============================================
-- 7. NETTOYAGE SUPPLÉMENTAIRE (supprimer les données orphelines)
-- ============================================
-- Supprimer les données qui n'ont pas de référence user_id valide
-- Utile après une suppression partielle
-- Décommentez la section ci-dessous pour exécuter

/*
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🧹 Nettoyage des données orphelines...';
  
  -- Supprimer les simulations sans utilisateur valide
  DELETE FROM public.simulations
  WHERE user_id NOT IN (SELECT id FROM public.users_app);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % simulation(s) orpheline(s) supprimée(s)', deleted_count;
  
  -- Supprimer les commandes sans utilisateur valide
  DELETE FROM public.orders
  WHERE user_id NOT IN (SELECT id FROM public.users_app);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % commande(s) orpheline(s) supprimée(s)', deleted_count;
  
  -- Supprimer les acteurs sans utilisateur valide
  DELETE FROM public.actors
  WHERE user_id NOT IN (SELECT id FROM public.users_app);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % acteur(s) orphelin(s) supprimé(s)', deleted_count;
  
  -- Supprimer les factures sans utilisateur valide
  DELETE FROM public.invoice_history
  WHERE user_id NOT IN (SELECT id FROM public.users_app);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % facture(s) orpheline(s) supprimée(s)', deleted_count;
  
  -- Supprimer les pools de crédits sans utilisateur valide
  DELETE FROM public.credit_pools
  WHERE user_id NOT IN (SELECT id FROM public.users_app);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % pool(s) de crédit(s) orphelin(s) supprimé(s)', deleted_count;
  
  -- Supprimer les paramètres sans utilisateur valide
  DELETE FROM public.settings
  WHERE user_id NOT IN (SELECT id FROM public.users_app);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % paramètre(s) orphelin(s) supprimé(s)', deleted_count;
  
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;
*/

-- ============================================
-- 8. VÉRIFICATION FINALE
-- ============================================
DO $$
DECLARE
  auth_users_remaining INTEGER;
  app_users_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_users_remaining FROM auth.users;
  SELECT COUNT(*) INTO app_users_remaining FROM public.users_app;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 ÉTAT FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Utilisateurs restants dans auth.users: %', auth_users_remaining;
  RAISE NOTICE 'Profils restants dans users_app: %', app_users_remaining;
  RAISE NOTICE '========================================';
  
  IF auth_users_remaining = 0 AND app_users_remaining = 0 THEN
    RAISE NOTICE '✅ Tous les utilisateurs ont été supprimés';
  ELSIF auth_users_remaining > 0 OR app_users_remaining > 0 THEN
    RAISE NOTICE 'ℹ️  Il reste encore des utilisateurs dans la base';
  END IF;
END $$;

-- ============================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================
-- 1. DÉCOMMENTEZ l'option que vous souhaitez utiliser (supprimez /* et */)
-- 2. OPTION 1: Supprime TOUT (recommandé pour un reset complet)
-- 3. OPTION 2: Supprime seulement les profils (les users auth restent)
-- 4. OPTION 3: Suppression détaillée avec informations
-- 5. OPTION 4: Conserve les administrateurs
-- 6. OPTION 7: Nettoie les données orphelines après suppression partielle
--
-- ⚠️ ATTENTION: 
-- - Ces opérations sont IRRÉVERSIBLES
-- - Faites une sauvegarde avant d'exécuter
-- - Testez d'abord sur une base de test
-- ============================================


