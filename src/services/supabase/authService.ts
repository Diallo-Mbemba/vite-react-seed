import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';
  remainingCredits: number;
  totalCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service d'authentification Supabase
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Erreur Supabase signUp:', error);
      throw error;
    }

    // Si l'utilisateur est créé mais nécessite une confirmation email
    // On attend un peu pour que le trigger SQL s'exécute
    if (data.user) {
      // Attendre un peu pour que le trigger crée le profil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier si le profil a été créé
      try {
        const profile = await this.getUserProfile(data.user.id);
        if (!profile) {
          console.warn('Le profil utilisateur n\'a pas été créé automatiquement. Création manuelle...');
          // Créer le profil manuellement si le trigger n'a pas fonctionné
          await this.createUserProfileManually(data.user.id, email, name);
        }
      } catch (profileError) {
        console.error('Erreur lors de la vérification du profil:', profileError);
        // Essayer de créer le profil manuellement
        try {
          await this.createUserProfileManually(data.user.id, email, name);
        } catch (createError) {
          console.error('Erreur lors de la création manuelle du profil:', createError);
          // Ne pas bloquer l'inscription si le profil n'est pas créé
          // Il pourra être créé plus tard
        }
      }
    }

    return data;
  },

  /**
   * Créer le profil utilisateur manuellement (fallback si le trigger ne fonctionne pas)
   */
  async createUserProfileManually(userId: string, email: string, name: string) {
    const { data, error } = await supabase
      .from('users_app')
      .insert({
        id: userId,
        email: email,
        name: name,
        plan: 'free',
        remaining_credits: 3,
        total_credits: 3,
      })
      .select()
      .single();

    if (error) {
      // Si l'erreur est "duplicate key", c'est OK, le profil existe déjà
      if (error.code === '23505') {
        console.log('Le profil existe déjà, pas besoin de le créer');
        return null;
      }
      console.error('Erreur lors de la création manuelle du profil:', error);
      throw error;
    }

    return data;
  },

  /**
   * Connexion d'un utilisateur
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Déconnexion
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Récupérer la session actuelle
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Récupérer le profil utilisateur étendu
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('🔍 Récupération du profil pour userId:', userId);
    
    try {
      // Vérifier que l'utilisateur est bien authentifié
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur auth:', authError);
        throw new Error('Erreur d\'authentification: ' + authError.message);
      }
      
      if (!authUser) {
        console.error('❌ Aucun utilisateur authentifié');
        throw new Error('Utilisateur non authentifié');
      }
      
      console.log('✅ Utilisateur authentifié:', authUser.id);
      console.log('🔍 Vérification RLS - auth.uid():', authUser.id, 'userId recherché:', userId);
      
      // Ajouter un timeout pour éviter que la requête reste bloquée
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La requête a pris plus de 5 secondes')), 5000);
      });
      
      const queryPromise = supabase
        .from('users_app')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erreur lors de la récupération du profil:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status,
          statusCode: error.statusCode,
        });
        
        // Erreur 500 - Problème serveur (souvent lié aux politiques RLS)
        if (error.status === 500 || error.statusCode === 500) {
          console.error('🚫 Erreur 500: Problème serveur lors de la récupération du profil');
          console.error('💡 Solution: Exécutez le script FIX_RLS_PROFIL_CONNEXION.sql dans Supabase');
          throw new Error('Erreur serveur lors de la récupération du profil. Vérifiez les politiques RLS dans Supabase. Consultez GUIDE_FIX_PROFIL_CONNEXION.md');
        }
        
        // Erreur RLS courante
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.error('🚫 Erreur RLS: La politique de sécurité bloque l\'accès au profil');
          console.error('💡 Solution: Exécutez le script FIX_RLS_PROFIL_CONNEXION.sql dans Supabase');
          throw new Error('Accès refusé par la politique de sécurité. Vérifiez les politiques RLS. Consultez GUIDE_FIX_PROFIL_CONNEXION.md');
        }
        
        if (error.code === 'PGRST116') {
          console.warn('⚠️ Profil non trouvé (PGRST116)');
          return null; // Not found
        }
        
        throw error;
      }

      if (!data) {
        console.warn('⚠️ Aucune donnée retournée pour le profil');
        return null;
      }

      console.log('✅ Profil récupéré avec succès:', {
        email: data.email,
        name: data.name,
        id: data.id
      });
      
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        plan: data.plan,
        remainingCredits: data.remaining_credits,
        totalCredits: data.total_credits,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error: any) {
      console.error('❌ Exception lors de la récupération du profil:', {
        error,
        message: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.plan !== undefined) updateData.plan = updates.plan;
    if (updates.remainingCredits !== undefined) updateData.remaining_credits = updates.remainingCredits;
    if (updates.totalCredits !== undefined) updateData.total_credits = updates.totalCredits;

    const { data, error } = await supabase
      .from('users_app')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      plan: data.plan,
      remainingCredits: data.remaining_credits,
      totalCredits: data.total_credits,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
};


