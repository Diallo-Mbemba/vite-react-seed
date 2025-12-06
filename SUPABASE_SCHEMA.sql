-- ============================================
-- SCHÉMA COMPLET SUPABASE - KPRAGUE
-- ============================================
-- Copier ce script dans Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLE: users_app (Profil utilisateur étendu)
-- ============================================
CREATE TABLE IF NOT EXISTS users_app (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'bronze', 'silver', 'gold', 'diamond')),
  remaining_credits INTEGER NOT NULL DEFAULT 0,
  total_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_app_email ON users_app(email);
CREATE INDEX IF NOT EXISTS idx_users_app_plan ON users_app(plan);

-- ============================================
-- 2. TABLE: simulations
-- ============================================
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  numero_facture TEXT,
  fournisseur TEXT,
  fob NUMERIC(15, 2) NOT NULL DEFAULT 0,
  fret NUMERIC(15, 2) NOT NULL DEFAULT 0,
  assurance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  droit_douane NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tva NUMERIC(15, 2) NOT NULL DEFAULT 0,
  frais_financiers NUMERIC(15, 2) NOT NULL DEFAULT 0,
  prestation_transitaire NUMERIC(15, 2) NOT NULL DEFAULT 0,
  rpi NUMERIC(15, 2) NOT NULL DEFAULT 0,
  coc NUMERIC(15, 2) NOT NULL DEFAULT 0,
  bsc NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit_enlevement NUMERIC(15, 2) NOT NULL DEFAULT 0,
  rrr NUMERIC(15, 2) NOT NULL DEFAULT 0,
  rcp NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'deleted')),
  active_tab TEXT,
  max_step_reached INTEGER DEFAULT 0,
  form_data JSONB,
  auto_calculations JSONB,
  criteria JSONB,
  selected_actors JSONB,
  articles JSONB,
  correction_history JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour simulations
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at DESC);

-- ============================================
-- 3. TABLE: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_credits INTEGER NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('pending_validation', 'validated', 'authorized', 'cancelled', 'expired')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('caisse_oic', 'stripe', 'lygos')),
  validated_at TIMESTAMPTZ,
  authorized_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users_app(id),
  authorized_by UUID REFERENCES users_app(id),
  receipt_number TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- 4. TABLE: order_validations
-- ============================================
CREATE TABLE IF NOT EXISTS order_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES users_app(id),
  validator_name TEXT NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('validation', 'authorization')),
  notes TEXT
);

-- Index pour order_validations
CREATE INDEX IF NOT EXISTS idx_order_validations_order_id ON order_validations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_validations_validator_id ON order_validations(validator_id);

-- ============================================
-- 5. TABLE: credit_pools
-- ============================================
CREATE TABLE IF NOT EXISTS credit_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'bronze', 'silver', 'gold', 'diamond')),
  plan_name TEXT NOT NULL,
  total_credits INTEGER NOT NULL,
  remaining_credits INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour credit_pools
CREATE INDEX IF NOT EXISTS idx_credit_pools_user_id ON credit_pools(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_pools_order_id ON credit_pools(order_id);
CREATE INDEX IF NOT EXISTS idx_credit_pools_created_at ON credit_pools(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_pools_active ON credit_pools(is_active, remaining_credits) WHERE is_active = true;

-- ============================================
-- 6. TABLE: credit_usage
-- ============================================
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  credit_pool_id UUID NOT NULL REFERENCES credit_pools(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  simulation_name TEXT NOT NULL
);

-- Index pour credit_usage
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_simulation_id ON credit_usage(simulation_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_credit_pool_id ON credit_usage(credit_pool_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_used_at ON credit_usage(used_at DESC);

-- ============================================
-- 7. TABLE: settings
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE UNIQUE,
  settings_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour settings
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- ============================================
-- 8. TABLE: admin_users
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_app(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ============================================
-- 9. TRIGGERS POUR updated_at
-- ============================================
-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_users_app_updated_at ON users_app;
DROP TRIGGER IF EXISTS update_simulations_updated_at ON simulations;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_credits_on_pool_change ON credit_pools;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_app_updated_at BEFORE UPDATE ON users_app
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users_app
DROP POLICY IF EXISTS "Users can view own profile" ON users_app;
CREATE POLICY "Users can view own profile" ON users_app
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users_app;
CREATE POLICY "Users can update own profile" ON users_app
  FOR UPDATE USING (auth.uid() = id);

-- IMPORTANT: Permettre au trigger de créer le profil (pas de politique INSERT pour les utilisateurs)
-- Le trigger SECURITY DEFINER s'exécute avec les permissions du créateur de la fonction

-- Politiques RLS pour simulations
DROP POLICY IF EXISTS "Users can view own simulations" ON simulations;
CREATE POLICY "Users can view own simulations" ON simulations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own simulations" ON simulations;
CREATE POLICY "Users can insert own simulations" ON simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own simulations" ON simulations;
CREATE POLICY "Users can update own simulations" ON simulations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own simulations" ON simulations;
CREATE POLICY "Users can delete own simulations" ON simulations
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour credit_pools
DROP POLICY IF EXISTS "Users can view own credit pools" ON credit_pools;
CREATE POLICY "Users can view own credit pools" ON credit_pools
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit pools" ON credit_pools;
CREATE POLICY "Users can insert own credit pools" ON credit_pools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credit pools" ON credit_pools;
CREATE POLICY "Users can update own credit pools" ON credit_pools
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques RLS pour credit_usage
DROP POLICY IF EXISTS "Users can view own credit usage" ON credit_usage;
CREATE POLICY "Users can view own credit usage" ON credit_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit usage" ON credit_usage;
CREATE POLICY "Users can insert own credit usage" ON credit_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour settings
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON settings;
CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour admin_users (lecture seule pour tous, modification admin uniquement)
DROP POLICY IF EXISTS "Anyone can view admin users" ON admin_users;
CREATE POLICY "Anyone can view admin users" ON admin_users
  FOR SELECT USING (true);

-- Politiques pour orders (admins peuvent voir toutes les commandes)
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Politiques pour order_validations (admins et caissiers)
DROP POLICY IF EXISTS "Admins and cashiers can view validations" ON order_validations;
CREATE POLICY "Admins and cashiers can view validations" ON order_validations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'cashier') AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins and cashiers can insert validations" ON order_validations;
CREATE POLICY "Admins and cashiers can insert validations" ON order_validations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'cashier') AND is_active = true
    )
  );

-- ============================================
-- 11. FONCTION: Créer profil utilisateur automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_app (id, email, name, plan, remaining_credits, total_credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free',
    3,
    3
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Logger l'erreur mais ne pas bloquer la création de l'utilisateur auth
    RAISE WARNING 'Erreur lors de la création du profil utilisateur: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- 12. FONCTION: Mettre à jour les crédits totaux
-- ============================================
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users_app
  SET 
    remaining_credits = (
      SELECT COALESCE(SUM(remaining_credits), 0)
      FROM credit_pools
      WHERE user_id = NEW.user_id AND is_active = true
    ),
    total_credits = (
      SELECT COALESCE(SUM(total_credits), 0)
      FROM credit_pools
      WHERE user_id = NEW.user_id
    ),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_credits_on_pool_change ON credit_pools;

CREATE TRIGGER update_credits_on_pool_change
  AFTER INSERT OR UPDATE OR DELETE ON credit_pools
  FOR EACH ROW EXECUTE FUNCTION update_user_credits();

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

