-- ============================================
-- TABLES POUR LES DONNÉES DE RÉFÉRENCE
-- TEC, VOC et TarifPORT
-- ============================================

-- ============================================
-- 1. TABLE: tec_articles (Tarif Extérieur Commun)
-- ============================================
CREATE TABLE IF NOT EXISTS tec_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sh10_code TEXT NOT NULL,
  designation TEXT NOT NULL,
  us TEXT,
  dd NUMERIC(10, 2) DEFAULT 0,
  rsta NUMERIC(10, 2) DEFAULT 0,
  pcs NUMERIC(10, 2) DEFAULT 0,
  pua NUMERIC(10, 2) DEFAULT 0,
  pcc NUMERIC(10, 2) DEFAULT 0,
  rrr NUMERIC(10, 2) DEFAULT 0,
  rcp NUMERIC(10, 2) DEFAULT 0,
  cumul_sans_tva NUMERIC(10, 2) DEFAULT 0,
  cumul_avec_tva NUMERIC(10, 2) DEFAULT 0,
  tva NUMERIC(10, 2) DEFAULT 0,
  sh6_code TEXT,
  tub NUMERIC(10, 2) DEFAULT 0,
  dus NUMERIC(10, 2) DEFAULT 0,
  dud NUMERIC(10, 2) DEFAULT 0,
  tcb NUMERIC(10, 2) DEFAULT 0,
  tsm NUMERIC(10, 2) DEFAULT 0,
  tsb NUMERIC(10, 2) DEFAULT 0,
  psv NUMERIC(10, 2) DEFAULT 0,
  tai NUMERIC(10, 2) DEFAULT 0,
  tab NUMERIC(10, 2) DEFAULT 0,
  tuf NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER DEFAULT 1 -- Pour gérer les versions des données
);

-- Index pour tec_articles
CREATE INDEX IF NOT EXISTS idx_tec_articles_sh10_code ON tec_articles(sh10_code);
CREATE INDEX IF NOT EXISTS idx_tec_articles_sh6_code ON tec_articles(sh6_code);
CREATE INDEX IF NOT EXISTS idx_tec_articles_updated_at ON tec_articles(updated_at DESC);

-- Contrainte d'unicité sur sh10_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_tec_articles_sh10_unique ON tec_articles(sh10_code);

-- ============================================
-- 2. TABLE: voc_products (Vérification d'Origine des Conteneurs)
-- ============================================
CREATE TABLE IF NOT EXISTS voc_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_sh TEXT NOT NULL,
  designation TEXT NOT NULL,
  observation TEXT,
  exempte BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Index pour voc_products
CREATE INDEX IF NOT EXISTS idx_voc_products_code_sh ON voc_products(code_sh);
CREATE INDEX IF NOT EXISTS idx_voc_products_updated_at ON voc_products(updated_at DESC);

-- Contrainte d'unicité sur code_sh
CREATE UNIQUE INDEX IF NOT EXISTS idx_voc_products_code_sh_unique ON voc_products(code_sh);

-- ============================================
-- 3. TABLE: tarifport_products (Tarif PORT)
-- ============================================
CREATE TABLE IF NOT EXISTS tarifport_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle_produit TEXT NOT NULL,
  chapitre TEXT,
  tp NUMERIC(10, 2) DEFAULT 0,
  code_redevance NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Index pour tarifport_products
CREATE INDEX IF NOT EXISTS idx_tarifport_products_chapitre ON tarifport_products(chapitre);
CREATE INDEX IF NOT EXISTS idx_tarifport_products_tp ON tarifport_products(tp);
CREATE INDEX IF NOT EXISTS idx_tarifport_products_updated_at ON tarifport_products(updated_at DESC);

-- ============================================
-- 4. POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE tec_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifport_products ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les données de référence
CREATE POLICY "Anyone can read TEC articles" ON tec_articles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read VOC products" ON voc_products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read TarifPORT products" ON tarifport_products
  FOR SELECT USING (true);

-- Politique : Seuls les admins peuvent modifier les données
CREATE POLICY "Admins can insert TEC articles" ON tec_articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can update TEC articles" ON tec_articles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can delete TEC articles" ON tec_articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can insert VOC products" ON voc_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can update VOC products" ON voc_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can delete VOC products" ON voc_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can insert TarifPORT products" ON tarifport_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can update TarifPORT products" ON tarifport_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can delete TarifPORT products" ON tarifport_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- ============================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reference_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_tec_articles_updated_at
  BEFORE UPDATE ON tec_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_data_updated_at();

CREATE TRIGGER update_voc_products_updated_at
  BEFORE UPDATE ON voc_products
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_data_updated_at();

CREATE TRIGGER update_tarifport_products_updated_at
  BEFORE UPDATE ON tarifport_products
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_data_updated_at();

-- ============================================
-- FIN DU SCRIPT
-- ============================================

