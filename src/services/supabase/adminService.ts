import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '../../types/order';

/**
 * Service pour gérer les utilisateurs administrateurs et caissiers
 */
export const adminService = {
  /**
   * Vérifier si l'utilisateur actuel est un admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false; // Aucun résultat
      console.error('Erreur lors de la vérification du rôle admin:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Vérifier si l'utilisateur actuel est un caissier
   */
  async isCashier(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'cashier')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false; // Aucun résultat
      console.error('Erreur lors de la vérification du rôle caissier:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Récupérer le rôle de l'utilisateur actuel
   */
  async getUserRole(userId: string): Promise<'admin' | 'cashier' | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Erreur lors de la récupération du rôle:', error);
      return null;
    }

    return data?.role as 'admin' | 'cashier' | null;
  },

  /**
   * Récupérer tous les caissiers
   */
  async getAllCashiers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', 'cashier')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToAdminUser);
  },

  /**
   * Récupérer tous les admins
   */
  async getAllAdmins(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToAdminUser);
  },

  /**
   * Récupérer un utilisateur admin par ID
   */
  async getAdminUserById(id: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToAdminUser(data) : null;
  },

  /**
   * Créer un nouveau caissier
   * L'utilisateur doit d'abord exister dans users_app
   */
  async createCashier(
    userId: string,
    name: string,
    email: string,
    permissions: string[] = ['validate_orders']
  ): Promise<AdminUser> {
    // Vérifier que l'utilisateur est authentifié et est admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      throw new Error('Vous devez être connecté pour créer un caissier.');
    }

    // Vérifier que l'utilisateur connecté est admin
    const userIsAdmin = await this.isAdmin(authUser.id);
    if (!userIsAdmin) {
      throw new Error('Seuls les administrateurs peuvent créer des caissiers.');
    }

    console.log('✅ Vérification admin réussie, création du caissier...', {
      adminId: authUser.id,
      targetUserId: userId
    });

    // Vérifier que l'utilisateur existe dans users_app
    const { data: userData, error: userError } = await supabase
      .from('users_app')
      .select('id, email, name')
      .eq('id', userId)
      .maybeSingle(); // Utiliser maybeSingle() pour éviter l'erreur 406

    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Erreur lors de la vérification de l'utilisateur: ${userError.message}`);
    }

    if (!userData) {
      throw new Error(`L'utilisateur avec l'ID ${userId} n'existe pas dans users_app. Veuillez d'abord créer le compte utilisateur.`);
    }

    // Vérifier qu'il n'existe pas déjà un admin_user pour cet utilisateur
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(); // Utiliser maybeSingle() pour éviter l'erreur si aucun résultat

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la vérification de l\'utilisateur existant:', checkError);
      throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
    }

    if (existingAdmin) {
      throw new Error('Cet utilisateur a déjà un compte administrateur/caissier.');
    }

    // Créer le caissier
    const insertData = {
      user_id: userId,
      name: name || userData.name,
      email: email || userData.email,
      role: 'cashier' as const,
      permissions,
      is_active: true,
    };

    console.log('🔄 Insertion du caissier dans admin_users...', insertData);

    const { data, error } = await supabase
      .from('admin_users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de l\'insertion:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Gestion d'erreur plus détaillée
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS') || error.message?.includes('row-level security')) {
        throw new Error(`Permission refusée pour créer le caissier. Vérifiez que vous êtes connecté avec un compte administrateur et que les politiques RLS sont correctement configurées. Exécutez le script FIX_RLS_ADMIN_USERS.sql dans Supabase. Détails: ${error.message}`);
      }
      if (error.code === '23505') { // Unique violation
        throw new Error('Cet email est déjà utilisé par un autre compte administrateur/caissier.');
      }
      throw error;
    }

    console.log('✅ Caissier créé avec succès:', data);
    return this.mapToAdminUser(data);
  },

  /**
   * Créer un nouvel admin système
   * L'utilisateur doit d'abord exister dans users_app
   */
  async createAdmin(
    userId: string,
    name: string,
    email: string,
    permissions: string[] = ['manage_all', 'manage_cashiers', 'manage_orders']
  ): Promise<AdminUser> {
    // Vérifier que l'utilisateur existe dans users_app
    const { data: userData, error: userError } = await supabase
      .from('users_app')
      .select('id, email, name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new Error(`L'utilisateur avec l'ID ${userId} n'existe pas dans users_app. Veuillez d'abord créer le compte utilisateur.`);
    }

    // Vérifier qu'il n'existe pas déjà un admin_user pour cet utilisateur
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      throw new Error('Cet utilisateur a déjà un compte administrateur/caissier.');
    }

    // Créer l'admin
    const insertData = {
      user_id: userId,
      name: name || userData.name,
      email: email || userData.email,
      role: 'admin' as const,
      permissions,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('admin_users')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToAdminUser(data);
  },

  /**
   * Mettre à jour un utilisateur admin/caissier
   */
  async updateAdminUser(
    id: string,
    updates: Partial<Pick<AdminUser, 'name' | 'email' | 'permissions' | 'isActive'>>
  ): Promise<AdminUser> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapToAdminUser(data);
  },

  /**
   * Désactiver un utilisateur admin/caissier
   */
  async deactivateAdminUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Activer un utilisateur admin/caissier
   */
  async activateAdminUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Supprimer un utilisateur admin/caissier
   */
  async deleteAdminUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Rechercher des utilisateurs dans users_app par email ou nom
   * Nécessite que l'admin ait la permission de voir tous les utilisateurs (politique RLS)
   */
  async searchUsers(query: string): Promise<Array<{ id: string; email: string; name: string }>> {
    if (!query || !query.trim()) {
      return [];
    }

    const searchTerm = query.trim();
    
    console.log('🔍 Recherche d\'utilisateurs dans adminService...', {
      query: searchTerm,
      userId: (await supabase.auth.getUser()).data.user?.id
    });

    // Vérifier que l'utilisateur est authentifié
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      throw new Error('Vous devez être connecté pour rechercher des utilisateurs.');
    }

    console.log('✅ Utilisateur authentifié:', authUser.id);

    // Vérifier que l'utilisateur est admin
    const userIsAdmin = await this.isAdmin(authUser.id);
    if (!userIsAdmin) {
      throw new Error('Seuls les administrateurs peuvent rechercher des utilisateurs.');
    }

    console.log('✅ Utilisateur est admin, recherche en cours...');

    // Construire la requête avec une syntaxe plus robuste
    // Utiliser ilike avec des conditions OR - syntaxe corrigée
    const { data, error } = await supabase
      .from('users_app')
      .select('id, email, name')
      .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ Erreur lors de la recherche:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Gestion d'erreur plus détaillée
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS') || error.message?.includes('row-level security')) {
        throw new Error(`Permission refusée pour rechercher les utilisateurs. Vérifiez que vous êtes connecté avec un compte administrateur et que la politique RLS "Admins can view all users" existe dans Supabase. Exécutez le script FIX_RLS_ADMIN_VIEW_USERS.sql. Détails: ${error.message}`);
      }
      
      if (error.code === 'PGRST116') {
        // Aucun résultat trouvé, ce n'est pas une erreur
        console.log('ℹ️ Aucun utilisateur trouvé');
        return [];
      }
      
      throw error;
    }

    console.log('✅ Recherche réussie:', data?.length || 0, 'utilisateurs trouvés');
    return data || [];
  },

  /**
   * Mapper depuis la base de données vers AdminUser
   */
  mapToAdminUser(data: any): AdminUser {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      createdAt: new Date(data.created_at),
      isActive: data.is_active,
    };
  },
};

