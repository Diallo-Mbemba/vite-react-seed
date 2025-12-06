-- ============================================
-- SCHÉMA COMPLET SUPABASE - KPRAGUE (VERSION SÉCURISÉE)
-- ============================================
-- Cette version vérifie l'existence avant de créer
-- Utilisez ce script si vous avez des erreurs "already exists"
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
-- 2. TRIGGERS POUR updated_at (VERSION SÉCURISÉE)
-- ============================================
-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_users_app_updated_at ON users_app;
DROP TRIGGER IF EXISTS update_simulations_updated_at ON simulations;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer les triggers
CREATE TRIGGER update_users_app_updated_at 
  BEFORE UPDATE ON users_app
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at 
  BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TRIGGER POUR CRÉATION AUTOMATIQUE DU PROFIL
-- ============================================
-- Supprimer l'ancien trigger et fonction s'ils existent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Recréer la fonction
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
    RAISE WARNING 'Erreur lors de la création du profil utilisateur pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- 4. CRÉER LE PROFIL POUR LES UTILISATEURS EXISTANTS
-- ============================================
-- Si des utilisateurs existent déjà dans auth.users mais pas dans users_app
INSERT INTO users_app (
  id,
  email,
  name,
  plan,
  remaining_credits,
  total_credits
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as name,
  'free' as plan,
  3 as remaining_credits,
  3 as total_credits
FROM auth.users au
LEFT JOIN users_app ua ON au.id = ua.id
WHERE ua.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Vérifiez que tout s'est bien passé :
-- SELECT COUNT(*) FROM users_app;



