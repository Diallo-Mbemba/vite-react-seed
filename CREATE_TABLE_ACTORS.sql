-- ============================================
-- CRÉATION/MODIFICATION DE LA TABLE actors
-- ============================================
-- Ce script crée ou modifie la table actors pour correspondre à la structure ActorData
-- avec user_id pour que chaque utilisateur ait ses propres acteurs
-- ============================================

-- 1. Vérifier si la table existe déjà avec une structure différente
-- Si la table existe avec une structure différente (name au lieu de nom, etc.),
-- on va créer une nouvelle table ou modifier la structure existante

-- 2. Créer la table actors avec la structure correcte (ActorData)
-- Si la table existe déjà avec une autre structure, cette commande ne fera rien
-- Vous devrez peut-être la modifier manuellement ou créer une nouvelle table
CREATE TABLE IF NOT EXISTS actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  adresse TEXT NOT NULL,
  telephone VARCHAR(50),
  email VARCHAR(255),
  type VARCHAR(50) NOT NULL CHECK (type IN ('importateur', 'fournisseur', 'transitaire')),
  zone VARCHAR(100),
  pays VARCHAR(2), -- Code ISO du pays (ex: 'FR', 'DE', 'CN')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actors_user_id ON actors(user_id);
CREATE INDEX IF NOT EXISTS idx_actors_type ON actors(type);
CREATE INDEX IF NOT EXISTS idx_actors_nom ON actors(nom);

-- 4. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_actors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_actors_updated_at_trigger ON actors;
CREATE TRIGGER update_actors_updated_at_trigger
  BEFORE UPDATE ON actors
  FOR EACH ROW
  EXECUTE FUNCTION update_actors_updated_at();

-- 5. Activer RLS
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own actors" ON actors;
DROP POLICY IF EXISTS "Users can insert own actors" ON actors;
DROP POLICY IF EXISTS "Users can update own actors" ON actors;
DROP POLICY IF EXISTS "Users can delete own actors" ON actors;

-- 7. Créer les politiques RLS
-- Les utilisateurs peuvent voir leurs propres acteurs
CREATE POLICY "Users can view own actors" ON actors
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres acteurs
CREATE POLICY "Users can insert own actors" ON actors
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres acteurs
CREATE POLICY "Users can update own actors" ON actors
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres acteurs
CREATE POLICY "Users can delete own actors" ON actors
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 8. S'assurer que les permissions sont correctes
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON actors TO postgres, anon, authenticated, service_role;

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier que la table existe
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'actors' THEN '✅ Table actors existe'
    ELSE '❌ Table actors n''existe pas'
  END as "Status"
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'actors';

-- Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'actors'
ORDER BY ordinal_position;

-- Vérifier que RLS est activé
SELECT 
  relname as "Table",
  CASE 
    WHEN relrowsecurity THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as "RLS Status"
FROM pg_class
WHERE relname = 'actors';

-- Vérifier les politiques RLS
SELECT 
  policyname,
  cmd,
  qual as "Condition USING",
  with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'actors'
ORDER BY policyname;

