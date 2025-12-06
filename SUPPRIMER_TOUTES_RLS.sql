-- ============================================
-- SUPPRESSION COMPLÈTE DE TOUTES LES RLS
-- ============================================
-- Ce script supprime TOUTES les politiques RLS
-- et désactive RLS sur TOUTES les tables de la base de données
-- ============================================
-- ⚠️ ATTENTION: Ce script supprime TOUTE la sécurité au niveau des lignes
-- Utilisez uniquement si vous souhaitez gérer l'accès autrement
-- ============================================

-- ============================================
-- 1. LISTE DE TOUTES LES TABLES AVEC RLS
-- ============================================
DO $$
DECLARE
  table_record RECORD;
  tables_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Recherche de toutes les tables avec RLS activé...';
  
  FOR table_record IN
    SELECT 
      schemaname,
      tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = tablename
      AND n.nspname = schemaname
      AND c.relrowsecurity = true
    )
  LOOP
    RAISE NOTICE '📋 Table trouvée avec RLS: %.%', table_record.schemaname, table_record.tablename;
    tables_count := tables_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Total de tables avec RLS trouvées: %', tables_count;
END $$;

-- ============================================
-- 2. SUPPRIMER TOUTES LES POLITIQUES RLS DE TOUTES LES TABLES
-- ============================================
DO $$
DECLARE
  policy_record RECORD;
  policies_deleted INTEGER := 0;
  current_table TEXT;
BEGIN
  RAISE NOTICE '🗑️  Suppression de toutes les politiques RLS...';
  
  -- Parcourir toutes les tables publiques
  FOR policy_record IN
    SELECT DISTINCT
      schemaname,
      tablename,
      policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      -- Supprimer la politique
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
        policy_record.policyname, 
        policy_record.schemaname, 
        policy_record.tablename
      );
      
      IF current_table IS DISTINCT FROM policy_record.tablename THEN
        current_table := policy_record.tablename;
        RAISE NOTICE '📋 Table: %', current_table;
      END IF;
      
      RAISE NOTICE '  ✅ Politique supprimée: %', policy_record.policyname;
      policies_deleted := policies_deleted + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ❌ Erreur lors de la suppression de la politique % sur %.%: %', 
          policy_record.policyname, 
          policy_record.schemaname, 
          policy_record.tablename, 
          SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Total de politiques supprimées: %', policies_deleted;
END $$;

-- ============================================
-- 3. DÉSACTIVER RLS SUR TOUTES LES TABLES PUBLIQUES
-- ============================================
DO $$
DECLARE
  table_record RECORD;
  tables_disabled INTEGER := 0;
BEGIN
  RAISE NOTICE '🔒 Désactivation de RLS sur toutes les tables...';
  
  -- Désactiver RLS sur toutes les tables publiques qui l'ont activé
  FOR table_record IN
    SELECT 
      c.relname as tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'  -- Tables uniquement
    AND c.relrowsecurity = true  -- RLS est activé
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
      RAISE NOTICE '  ✅ RLS désactivé sur: %', table_record.tablename;
      tables_disabled := tables_disabled + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ❌ Erreur lors de la désactivation de RLS sur %: %', 
          table_record.tablename, 
          SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Total de tables désactivées: %', tables_disabled;
END $$;

-- ============================================
-- 4. SUPPRIMER LES FONCTIONS HELPER QUI UTILISENT RLS
-- ============================================
DO $$
BEGIN
  DROP FUNCTION IF EXISTS is_user_admin(UUID);
  DROP FUNCTION IF EXISTS is_user_admin();
  DROP FUNCTION IF EXISTS is_user_cashier(UUID);
  DROP FUNCTION IF EXISTS is_user_cashier();
  
  RAISE NOTICE '✅ Fonctions helper supprimées (si elles existaient)';
END $$;

-- ============================================
-- 5. VÉRIFICATION FINALE
-- ============================================
DO $$
DECLARE
  remaining_policies INTEGER;
  tables_with_rls INTEGER;
BEGIN
  -- Compter les politiques restantes
  SELECT COUNT(*) INTO remaining_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Compter les tables avec RLS encore activé
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RÉSUMÉ FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Politiques RLS restantes: %', remaining_policies;
  RAISE NOTICE 'Tables avec RLS encore activé: %', tables_with_rls;
  RAISE NOTICE '';
  
  IF remaining_policies = 0 AND tables_with_rls = 0 THEN
    RAISE NOTICE '✅ SUCCÈS: Toutes les RLS ont été supprimées!';
  ELSIF remaining_policies > 0 THEN
    RAISE WARNING '⚠️  Il reste encore % politique(s) RLS', remaining_policies;
  ELSIF tables_with_rls > 0 THEN
    RAISE WARNING '⚠️  Il reste encore % table(s) avec RLS activé', tables_with_rls;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. LISTE DES TABLES RESTANTES (pour information)
-- ============================================
SELECT 
  c.relname as "Table",
  CASE 
    WHEN c.relrowsecurity THEN '⚠️ RLS Activé'
    ELSE '✅ RLS Désactivé'
  END as "Statut RLS",
  (SELECT COUNT(*) 
   FROM pg_policies p 
   WHERE p.schemaname = 'public' 
   AND p.tablename = c.relname) as "Nombre de politiques"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;

-- ============================================
-- 7. LISTE DES POLITIQUES RESTANTES (si aucune, résultat vide)
-- ============================================
SELECT 
  tablename as "Table",
  policyname as "Politique",
  cmd as "Commande",
  qual as "Condition USING",
  with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- ✅ Toutes les politiques RLS ont été supprimées
-- ✅ RLS a été désactivé sur toutes les tables
-- ⚠️  La base de données est maintenant accessible sans restriction RLS
-- ⚠️  Assurez-vous de gérer l'accès aux données autrement (au niveau application, etc.)
-- 
-- Si vous souhaitez réactiver RLS plus tard, vous devrez:
-- 1. Exécuter: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- 2. Créer de nouvelles politiques avec CREATE POLICY
--
-- ============================================
-- FIN DU SCRIPT
-- ============================================

