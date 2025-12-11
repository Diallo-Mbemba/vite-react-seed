import { supabase } from '@/integrations/supabase/client';

/**
 * Service pour gérer les paramètres utilisateur dans Supabase
 */
export const settingsService = {
  /**
   * Récupérer les paramètres d'un utilisateur
   */
  async getUserSettings(userId: string): Promise<any> {
    try {
      console.log('🔍 Récupération des paramètres pour userId:', userId);
      
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data')
        .eq('user_id', userId)
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur 406 si aucun résultat

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de paramètres, retourner les valeurs par défaut
          console.log('ℹ️ Aucun paramètre trouvé, utilisation des valeurs par défaut');
          return {};
        }
        
        // Log détaillé de l'erreur
        console.error('❌ Erreur lors de la récupération des paramètres:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Si c'est une erreur de permissions RLS, retourner un objet vide au lieu de throw
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.warn('⚠️ Erreur de permissions RLS, utilisation des valeurs par défaut');
          return {};
        }
        
        throw error;
      }

      console.log('✅ Paramètres récupérés:', data?.settings_data ? 'Oui' : 'Non (vide)');
      return data?.settings_data || {};
    } catch (error: any) {
      console.error('❌ Erreur dans getUserSettings:', error);
      // Retourner un objet vide au lieu de throw pour permettre à l'application de continuer
      return {};
    }
  },

  /**
   * Mettre à jour les paramètres d'un utilisateur
   */
  async updateUserSettings(userId: string, settings: any): Promise<void> {
    // Vérifier si des paramètres existent déjà
    const { data: existing, error: checkError } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(); // Utiliser maybeSingle() pour éviter l'erreur 406 si aucun résultat
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      // Mettre à jour
      const { error } = await supabase
        .from('settings')
        .update({ settings_data: settings })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Créer
      const { error } = await supabase
        .from('settings')
        .insert({
          user_id: userId,
          settings_data: settings,
        });

      if (error) throw error;
    }
  },
};


