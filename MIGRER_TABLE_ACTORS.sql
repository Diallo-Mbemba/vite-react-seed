-- ============================================
-- MIGRATION DE LA TABLE actors
-- ============================================
-- Ce script migre la table actors existante vers la nouvelle structure
-- qui correspond à ActorData (nom, adresse, telephone, etc.)
-- ============================================

-- 1. Vérifier la structure actuelle de la table
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_nom BOOLEAN;
  has_name BOOLEAN;
BEGIN
  -- Vérifier si la colonne user_id existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'actors' 
    AND column_name = 'user_id'
  ) INTO has_user_id;
  
  -- Vérifier si la colonne nom existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'actors' 
    AND column_name = 'nom'
  ) INTO has_nom;
  
  -- Vérifier si la colonne name existe (ancienne structure)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'actors' 
    AND column_name = 'name'
  ) INTO has_name;
  
  -- Si la table existe avec l'ancienne structure (name au lieu de nom)
  IF has_name AND NOT has_nom THEN
    RAISE NOTICE '⚠️ La table actors existe avec l''ancienne structure (name, phone, etc.)';
    RAISE NOTICE '📝 Migration nécessaire vers la nouvelle structure (nom, adresse, telephone, etc.)';
    
    -- Ajouter les colonnes manquantes
    IF NOT has_user_id THEN
      ALTER TABLE actors ADD COLUMN user_id UUID REFERENCES users_app(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ Colonne user_id ajoutée';
    END IF;
    
    -- Renommer les colonnes si nécessaire
    ALTER TABLE actors RENAME COLUMN name TO nom;
    ALTER TABLE actors RENAME COLUMN phone TO telephone;
    ALTER TABLE actors RENAME COLUMN address TO adresse;
    RAISE NOTICE '✅ Colonnes renommées';
    
    -- Ajouter les colonnes manquantes
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'actors' 
      AND column_name = 'zone'
    ) THEN
      ALTER TABLE actors ADD COLUMN zone VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'actors' 
      AND column_name = 'pays'
    ) THEN
      ALTER TABLE actors ADD COLUMN pays VARCHAR(2);
    END IF;
    
    -- Supprimer les colonnes qui ne sont plus nécessaires
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'actors' 
      AND column_name = 'city'
    ) THEN
      ALTER TABLE actors DROP COLUMN city;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'actors' 
      AND column_name = 'notes'
    ) THEN
      ALTER TABLE actors DROP COLUMN notes;
    END IF;
    
    -- Modifier le type si nécessaire
    ALTER TABLE actors 
      DROP CONSTRAINT IF EXISTS actors_type_check,
      ADD CONSTRAINT actors_type_check CHECK (type IN ('importateur', 'fournisseur', 'transitaire'));
    
    RAISE NOTICE '✅ Migration de la structure terminée';
  ELSIF has_nom THEN
    RAISE NOTICE '✅ La table actors a déjà la bonne structure (nom, adresse, telephone, etc.)';
  ELSE
    RAISE NOTICE 'ℹ️ La table actors n''existe pas encore, elle sera créée par CREATE_TABLE_ACTORS.sql';
  END IF;
END $$;

-- 2. S'assurer que user_id existe et n'est pas NULL pour les enregistrements existants
-- Si des acteurs existent sans user_id, ils seront assignés au premier utilisateur admin
DO $$
DECLARE
  first_admin_id UUID;
  actors_without_user INTEGER;
BEGIN
  -- Compter les acteurs sans user_id
  SELECT COUNT(*) INTO actors_without_user
  FROM actors
  WHERE user_id IS NULL;
  
  IF actors_without_user > 0 THEN
    -- Trouver le premier admin
    SELECT user_id INTO first_admin_id
    FROM admin_users
    WHERE role = 'admin' AND is_active = true
    LIMIT 1;
    
    IF first_admin_id IS NOT NULL THEN
      -- Assigner les acteurs sans user_id au premier admin
      UPDATE actors
      SET user_id = first_admin_id
      WHERE user_id IS NULL;
      
      RAISE NOTICE '✅ % acteur(s) sans user_id assigné(s) au premier admin', actors_without_user;
    ELSE
      RAISE WARNING '⚠️ Aucun admin trouvé. Les acteurs sans user_id ne seront pas accessibles.';
    END IF;
  END IF;
END $$;

-- 3. S'assurer que user_id est NOT NULL
ALTER TABLE actors 
  ALTER COLUMN user_id SET NOT NULL;

-- 4. Vérifier la structure finale
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'actors'
ORDER BY ordinal_position;

