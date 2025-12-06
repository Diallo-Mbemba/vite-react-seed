-- ============================================
-- CRÉATION DES TABLES MANQUANTES ET RLS
-- ============================================
-- Ce script crée les tables manquantes pour remplacer localStorage
-- et définit les politiques RLS pour que chaque utilisateur ne voie que ses données
-- ============================================

-- ============================================
-- 0. NETTOYAGE PRÉLIMINAIRE (supprimer les anciennes politiques si elles existent)
-- ============================================
-- Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own actors" ON actors;
DROP POLICY IF EXISTS "Users can insert own actors" ON actors;
DROP POLICY IF EXISTS "Users can update own actors" ON actors;
DROP POLICY IF EXISTS "Users can delete own actors" ON actors;

DROP POLICY IF EXISTS "Users can view own invoice history" ON invoice_history;
DROP POLICY IF EXISTS "Users can insert own invoice history" ON invoice_history;
DROP POLICY IF EXISTS "Users can update own invoice history" ON invoice_history;
DROP POLICY IF EXISTS "Users can delete own invoice history" ON invoice_history;

DROP POLICY IF EXISTS "Users can view own or global criteria" ON admin_decision_criteria;
DROP POLICY IF EXISTS "Users can insert own criteria" ON admin_decision_criteria;
DROP POLICY IF EXISTS "Users can update own criteria" ON admin_decision_criteria;
DROP POLICY IF EXISTS "Users can delete own criteria" ON admin_decision_criteria;
DROP POLICY IF EXISTS "Admins can manage global criteria" ON admin_decision_criteria;

DROP POLICY IF EXISTS "Authenticated users can view reference data" ON reference_data;
DROP POLICY IF EXISTS "Admins can manage reference data" ON reference_data;

-- ============================================
-- 1. TABLE: actors (Acteurs)
-- ============================================
CREATE TABLE IF NOT EXISTS actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  city TEXT,
  type TEXT CHECK (type IN ('supplier', 'customer', 'transporter', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actors_user_id ON actors(user_id);
CREATE INDEX IF NOT EXISTS idx_actors_type ON actors(type);

-- ============================================
-- 2. TABLE: invoice_history (Historique des factures)
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_data JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_history_user_id ON invoice_history(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_simulation_id ON invoice_history(simulation_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice_number ON invoice_history(invoice_number);

-- ============================================
-- 3. TABLE: admin_decision_criteria (Critères de décision admin)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_decision_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_app(id) ON DELETE CASCADE, -- NULL pour les critères globaux
  criteria_data JSONB NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_decision_criteria_user_id ON admin_decision_criteria(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_decision_criteria_global ON admin_decision_criteria(is_global);

-- ============================================
-- 4. TABLE: reference_data (Données de référence TEC, VOC, TarifPORT)
-- ============================================
-- Note: Ces données sont partagées entre tous les utilisateurs (données de référence)
CREATE TABLE IF NOT EXISTS reference_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('tec', 'voc', 'tarifport')),
  data JSONB NOT NULL,
  created_by UUID REFERENCES users_app(id), -- Qui a importé les données
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_data_type ON reference_data(type);
CREATE INDEX IF NOT EXISTS idx_reference_data_created_at ON reference_data(created_at DESC);

-- ============================================
-- 5. TRIGGERS pour updated_at
-- ============================================
-- Créer ou remplacer la fonction (si elle existe déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent, puis les recréer
DROP TRIGGER IF EXISTS update_actors_updated_at ON actors;
CREATE TRIGGER update_actors_updated_at BEFORE UPDATE ON actors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_decision_criteria_updated_at ON admin_decision_criteria;
CREATE TRIGGER update_admin_decision_criteria_updated_at BEFORE UPDATE ON admin_decision_criteria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reference_data_updated_at ON reference_data;
CREATE TRIGGER update_reference_data_updated_at BEFORE UPDATE ON reference_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_decision_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_data ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLITIQUES RLS POUR actors
-- ============================================
-- Les utilisateurs ne peuvent voir que leurs propres acteurs
CREATE POLICY "Users can view own actors" ON actors
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres acteurs
CREATE POLICY "Users can insert own actors" ON actors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres acteurs
CREATE POLICY "Users can update own actors" ON actors
  FOR UPDATE USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres acteurs
CREATE POLICY "Users can delete own actors" ON actors
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLITIQUES RLS POUR invoice_history
-- ============================================
-- Les utilisateurs ne peuvent voir que leur propre historique
CREATE POLICY "Users can view own invoice history" ON invoice_history
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leur propre historique
CREATE POLICY "Users can insert own invoice history" ON invoice_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre historique
CREATE POLICY "Users can update own invoice history" ON invoice_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre historique
CREATE POLICY "Users can delete own invoice history" ON invoice_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLITIQUES RLS POUR admin_decision_criteria
-- ============================================
-- Les utilisateurs peuvent voir leurs propres critères et les critères globaux
CREATE POLICY "Users can view own or global criteria" ON admin_decision_criteria
  FOR SELECT USING (
    auth.uid() = user_id 
    OR is_global = true
  );

-- Les utilisateurs peuvent créer leurs propres critères
CREATE POLICY "Users can insert own criteria" ON admin_decision_criteria
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres critères
CREATE POLICY "Users can update own criteria" ON admin_decision_criteria
  FOR UPDATE USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres critères
CREATE POLICY "Users can delete own criteria" ON admin_decision_criteria
  FOR DELETE USING (auth.uid() = user_id);

-- Les admins peuvent créer et modifier les critères globaux
CREATE POLICY "Admins can manage global criteria" ON admin_decision_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- ============================================
-- POLITIQUES RLS POUR reference_data
-- ============================================
-- Tous les utilisateurs authentifiés peuvent voir les données de référence (partagées)
CREATE POLICY "Authenticated users can view reference data" ON reference_data
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seuls les admins peuvent créer/modifier/supprimer les données de référence
CREATE POLICY "Admins can manage reference data" ON reference_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- ============================================
-- VÉRIFICATION DES POLITIQUES
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd,
  qual as "Condition USING",
  with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('actors', 'invoice_history', 'admin_decision_criteria', 'reference_data')
ORDER BY tablename, policyname;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. Les acteurs sont privés à chaque utilisateur
-- 2. L'historique des factures est privé à chaque utilisateur
-- 3. Les critères de décision admin peuvent être globaux (partagés) ou privés
-- 4. Les données de référence (TEC, VOC, TarifPORT) sont partagées entre tous les utilisateurs
-- 5. Seuls les admins peuvent gérer les données de référence et les critères globaux

