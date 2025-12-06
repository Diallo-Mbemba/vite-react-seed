import { supabase } from '../../lib/supabaseClient';

export interface AdminDecisionCriteria {
  id: string;
  userId?: string;
  criteriaData: any; // JSONB
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const adminDecisionService = {
  /**
   * Récupérer les critères globaux
   */
  async getGlobalCriteria(): Promise<AdminDecisionCriteria | null> {
    const { data, error } = await supabase
      .from('admin_decision_criteria')
      .select('*')
      .eq('is_global', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToCriteria(data) : null;
  },

  /**
   * Récupérer les critères d'un utilisateur
   */
  async getUserCriteria(userId: string): Promise<AdminDecisionCriteria | null> {
    const { data, error } = await supabase
      .from('admin_decision_criteria')
      .select('*')
      .eq('user_id', userId)
      .eq('is_global', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToCriteria(data) : null;
  },

  /**
   * Récupérer les critères (globaux ou utilisateur)
   */
  async getCriteria(userId?: string): Promise<AdminDecisionCriteria | null> {
    // D'abord essayer de récupérer les critères globaux
    const global = await this.getGlobalCriteria();
    if (global) return global;

    // Sinon, récupérer les critères de l'utilisateur si userId est fourni
    if (userId) {
      return await this.getUserCriteria(userId);
    }

    return null;
  },

  /**
   * Créer ou mettre à jour les critères globaux (admin uniquement)
   */
  async saveGlobalCriteria(criteriaData: any): Promise<AdminDecisionCriteria> {
    // Vérifier s'il existe déjà des critères globaux
    const existing = await this.getGlobalCriteria();

    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from('admin_decision_criteria')
        .update({
          criteria_data: criteriaData,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToCriteria(data);
    } else {
      // Créer
      const { data, error } = await supabase
        .from('admin_decision_criteria')
        .insert({
          user_id: null,
          criteria_data: criteriaData,
          is_global: true,
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapToCriteria(data);
    }
  },

  /**
   * Créer ou mettre à jour les critères d'un utilisateur
   */
  async saveUserCriteria(userId: string, criteriaData: any): Promise<AdminDecisionCriteria> {
    // Vérifier s'il existe déjà des critères pour cet utilisateur
    const existing = await this.getUserCriteria(userId);

    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from('admin_decision_criteria')
        .update({
          criteria_data: criteriaData,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToCriteria(data);
    } else {
      // Créer
      const { data, error } = await supabase
        .from('admin_decision_criteria')
        .insert({
          user_id: userId,
          criteria_data: criteriaData,
          is_global: false,
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapToCriteria(data);
    }
  },

  /**
   * Supprimer les critères d'un utilisateur
   */
  async deleteUserCriteria(userId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_decision_criteria')
      .delete()
      .eq('user_id', userId)
      .eq('is_global', false);

    if (error) throw error;
  },

  mapToCriteria(data: any): AdminDecisionCriteria {
    return {
      id: data.id,
      userId: data.user_id,
      criteriaData: data.criteria_data,
      isGlobal: data.is_global,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },
};

