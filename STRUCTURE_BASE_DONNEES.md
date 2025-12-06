# STRUCTURE COMPLÈTE DE LA BASE DE DONNÉES SUPABASE
## Application SAAS KPrague - Simulation de Coûts d'Importation

---

## 📋 TABLES PRINCIPALES

### 1. `users_app`
**Description:** Profil utilisateur étendu (lié à `auth.users`)

**Colonnes:**
- `id` (UUID, PK) - Référence à `auth.users(id)`
- `email` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT, NOT NULL)
- `plan` (TEXT, NOT NULL, DEFAULT 'free') - CHECK: 'free', 'bronze', 'silver', 'gold', 'diamond'
- `remaining_credits` (INTEGER, NOT NULL, DEFAULT 0)
- `total_credits` (INTEGER, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_users_app_email` sur `email`
- `idx_users_app_plan` sur `plan`

---

### 2. `simulations`
**Description:** Simulations de coûts d'importation

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `product_name` (TEXT, NOT NULL)
- `numero_facture` (TEXT)
- `fournisseur` (TEXT)
- `fob` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `fret` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `assurance` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `droit_douane` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `tva` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `frais_financiers` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `prestation_transitaire` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `rpi` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `coc` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `bsc` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `credit_enlevement` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `rrr` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `rcp` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `total_cost` (NUMERIC(15,2), NOT NULL, DEFAULT 0)
- `currency` (TEXT, NOT NULL, DEFAULT 'XAF')
- `status` (TEXT, NOT NULL, DEFAULT 'in_progress') - CHECK: 'in_progress', 'completed', 'deleted'
- `active_tab` (TEXT)
- `max_step_reached` (INTEGER, DEFAULT 0)
- `form_data` (JSONB)
- `auto_calculations` (JSONB)
- `criteria` (JSONB)
- `selected_actors` (JSONB)
- `articles` (JSONB)
- `correction_history` (JSONB)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_simulations_user_id` sur `user_id`
- `idx_simulations_status` sur `status`
- `idx_simulations_created_at` sur `created_at DESC`

---

### 3. `orders`
**Description:** Commandes d'abonnements/achats de crédits

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_number` (TEXT, NOT NULL, UNIQUE)
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `user_email` (TEXT, NOT NULL)
- `user_name` (TEXT, NOT NULL)
- `plan_id` (TEXT, NOT NULL)
- `plan_name` (TEXT, NOT NULL)
- `plan_credits` (INTEGER, NOT NULL)
- `amount` (NUMERIC(15,2), NOT NULL)
- `currency` (TEXT, NOT NULL, DEFAULT 'XAF')
- `status` (TEXT, NOT NULL, DEFAULT 'pending_validation') - CHECK: 'pending_validation', 'validated', 'authorized', 'cancelled', 'expired'
- `payment_method` (TEXT, NOT NULL) - CHECK: 'caisse_oic', 'stripe', 'lygos'
- `validated_at` (TIMESTAMPTZ)
- `authorized_at` (TIMESTAMPTZ)
- `validated_by` (UUID, FK → `users_app(id)`)
- `authorized_by` (UUID, FK → `users_app(id)`)
- `receipt_number` (TEXT)
- `receipt_url` (TEXT)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_orders_user_id` sur `user_id`
- `idx_orders_order_number` sur `order_number`
- `idx_orders_status` sur `status`
- `idx_orders_created_at` sur `created_at DESC`

---

### 4. `order_validations`
**Description:** Historique des validations et autorisations de commandes

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_id` (UUID, NOT NULL, FK → `orders(id)`)
- `validator_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `validator_name` (TEXT, NOT NULL)
- `validated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `type` (TEXT, NOT NULL) - CHECK: 'validation', 'authorization'
- `notes` (TEXT)

**Index:**
- `idx_order_validations_order_id` sur `order_id`
- `idx_order_validations_validator_id` sur `validator_id`

---

### 5. `credit_pools`
**Description:** Pools de crédits achetés par les utilisateurs

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `order_id` (UUID, NOT NULL, FK → `orders(id)`)
- `order_number` (TEXT, NOT NULL)
- `plan_id` (TEXT, NOT NULL) - CHECK: 'free', 'bronze', 'silver', 'gold', 'diamond'
- `plan_name` (TEXT, NOT NULL)
- `total_credits` (INTEGER, NOT NULL)
- `remaining_credits` (INTEGER, NOT NULL)
- `expires_at` (TIMESTAMPTZ)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_credit_pools_user_id` sur `user_id`
- `idx_credit_pools_order_id` sur `order_id`
- `idx_credit_pools_created_at` sur `created_at`
- `idx_credit_pools_active` sur `(is_active, remaining_credits)` WHERE `is_active = true`

---

### 6. `credit_usage`
**Description:** Historique d'utilisation des crédits

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `simulation_id` (UUID, NOT NULL, FK → `simulations(id)`)
- `credit_pool_id` (UUID, NOT NULL, FK → `credit_pools(id)`)
- `order_id` (UUID, NOT NULL, FK → `orders(id)`)
- `order_number` (TEXT, NOT NULL)
- `used_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `simulation_name` (TEXT, NOT NULL)

**Index:**
- `idx_credit_usage_user_id` sur `user_id`
- `idx_credit_usage_simulation_id` sur `simulation_id`
- `idx_credit_usage_credit_pool_id` sur `credit_pool_id`
- `idx_credit_usage_used_at` sur `used_at DESC`

---

### 7. `settings`
**Description:** Paramètres utilisateur

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`, UNIQUE)
- `settings_data` (JSONB, NOT NULL, DEFAULT '{}')
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_settings_user_id` sur `user_id`

---

### 8. `admin_users`
**Description:** Utilisateurs administrateurs et caissiers

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`, UNIQUE)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL, UNIQUE)
- `role` (TEXT, NOT NULL) - CHECK: 'admin', 'cashier'
- `permissions` (TEXT[], DEFAULT ARRAY[]::TEXT[])
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_admin_users_user_id` sur `user_id`
- `idx_admin_users_email` sur `email`
- `idx_admin_users_role` sur `role`

---

### 9. `actors`
**Description:** Acteurs commerciaux (fournisseurs, importateurs, transitaires)

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `nom` (TEXT, NOT NULL) - ou `name` selon version
- `adresse` (TEXT, NOT NULL) - ou `address` selon version
- `telephone` (TEXT) - ou `phone` selon version
- `email` (TEXT)
- `zone` (VARCHAR(100))
- `pays` (VARCHAR(2)) - Code ISO du pays
- `type` (TEXT) - CHECK: 'importateur', 'fournisseur', 'transitaire' (ou 'supplier', 'customer', 'transporter', 'other')
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_actors_user_id` sur `user_id`
- `idx_actors_type` sur `type`

---

### 10. `invoice_history`
**Description:** Historique des factures générées

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK → `users_app(id)`)
- `simulation_id` (UUID, FK → `simulations(id)`)
- `invoice_number` (TEXT, NOT NULL)
- `invoice_data` (JSONB, NOT NULL)
- `pdf_url` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_invoice_history_user_id` sur `user_id`
- `idx_invoice_history_simulation_id` sur `simulation_id`
- `idx_invoice_history_invoice_number` sur `invoice_number`

---

### 11. `admin_decision_criteria`
**Description:** Critères de décision admin (globaux ou par utilisateur)

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK → `users_app(id)`) - NULL pour critères globaux
- `criteria_data` (JSONB, NOT NULL)
- `is_global` (BOOLEAN, NOT NULL, DEFAULT false)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_admin_decision_criteria_user_id` sur `user_id`
- `idx_admin_decision_criteria_global` sur `is_global`

---

### 12. `reference_data`
**Description:** Données de référence partagées (TEC, VOC, TarifPORT)

**Colonnes:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `type` (TEXT, NOT NULL) - CHECK: 'tec', 'voc', 'tarifport'
- `data` (JSONB, NOT NULL)
- `created_by` (UUID, FK → `users_app(id)`)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Index:**
- `idx_reference_data_type` sur `type`
- `idx_reference_data_created_at` sur `created_at DESC`

---

## 🔧 TRIGGERS ET FONCTIONS

### Triggers
- `update_users_app_updated_at` - Met à jour `updated_at` sur `users_app`
- `update_simulations_updated_at` - Met à jour `updated_at` sur `simulations`
- `update_orders_updated_at` - Met à jour `updated_at` sur `orders`
- `update_settings_updated_at` - Met à jour `updated_at` sur `settings`
- `update_actors_updated_at` - Met à jour `updated_at` sur `actors`
- `update_admin_decision_criteria_updated_at` - Met à jour `updated_at` sur `admin_decision_criteria`
- `update_reference_data_updated_at` - Met à jour `updated_at` sur `reference_data`
- `on_auth_user_created` - Crée automatiquement un profil dans `users_app` lors de l'inscription
- `update_credits_on_pool_change` - Met à jour les crédits de l'utilisateur lors des changements dans `credit_pools`

### Fonctions
- `update_updated_at_column()` - Fonction générique pour mettre à jour `updated_at`
- `create_user_profile()` - Crée un profil utilisateur (SECURITY DEFINER)
- `update_user_credits()` - Met à jour les crédits totaux de l'utilisateur
- `is_user_admin()` - Vérifie si un utilisateur est admin (peut exister)
- `is_user_cashier()` - Vérifie si un utilisateur est caissier (peut exister)

---

## 📊 TABLES POTENTIELLES (d'après SUPABASE_SCHEMA.txt)

Les tables suivantes peuvent exister selon les versions :
- `users` (ancienne version, peut-être remplacée par `users_app`)
- `subscriptions`
- `payments`
- `simulation_articles`
- `tec_articles`
- `voc_products`
- `tarifport_products`
- `currencies`
- `incoterms`
- `user_settings`

---

## ⚠️ NOTES IMPORTANTES

1. **RLS (Row Level Security)** est activé sur toutes les tables principales
2. Les politiques RLS varient selon les besoins de sécurité
3. Certaines tables peuvent avoir des structures différentes selon les migrations effectuées
4. La table `actors` peut avoir des colonnes différentes selon la version (nom/adresse vs name/address)
5. Toutes les tables utilisent `UUID` comme clé primaire avec `gen_random_uuid()`

---

## 🔗 RELATIONS PRINCIPALES

```
auth.users
    ↓ (1:1)
users_app
    ↓ (1:N)
    ├─→ simulations
    ├─→ orders
    ├─→ credit_pools
    ├─→ credit_usage
    ├─→ settings (1:1)
    ├─→ actors
    ├─→ invoice_history
    └─→ admin_users (1:1)

orders
    ↓ (1:N)
    ├─→ order_validations
    └─→ credit_pools

simulations
    ↓ (1:N)
    ├─→ credit_usage
    └─→ invoice_history

credit_pools
    ↓ (1:N)
    └─→ credit_usage
```

---

**Dernière mise à jour:** Généré depuis les fichiers SQL du projet


