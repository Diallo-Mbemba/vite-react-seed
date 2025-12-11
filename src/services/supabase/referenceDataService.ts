import { supabase } from '@/integrations/supabase/client';

export type ReferenceDataType = 'tec' | 'voc' | 'tarifport';

export interface ReferenceData {
  id: string;
  type: ReferenceDataType;
  data: any; // JSONB - array of items
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const referenceDataService = {
  /**
   * Récupérer les données de référence par type
   */
  async getReferenceData(type: ReferenceDataType): Promise<ReferenceData | null> {
    const { data, error } = await supabase
      .from('reference_data')
      .select('*')
      .eq('type', type)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToReferenceData(data) : null;
  },

  /**
   * Récupérer toutes les données de référence
   */
  async getAllReferenceData(): Promise<ReferenceData[]> {
    const { data, error } = await supabase
      .from('reference_data')
      .select('*')
      .order('type', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapToReferenceData);
  },

  /**
   * Créer ou mettre à jour les données de référence (admin uniquement)
   */
  async saveReferenceData(
    type: ReferenceDataType,
    data: any[],
    createdBy?: string
  ): Promise<ReferenceData> {
    // Vérifier s'il existe déjà des données de ce type
    const existing = await this.getReferenceData(type);

    if (existing) {
      // Mettre à jour
      const { data: updated, error } = await supabase
        .from('reference_data')
        .update({
          data: data,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToReferenceData(updated);
    } else {
      // Créer
      const { data: created, error } = await supabase
        .from('reference_data')
        .insert({
          type: type,
          data: data,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapToReferenceData(created);
    }
  },

  /**
   * Supprimer les données de référence (admin uniquement)
   */
  async deleteReferenceData(type: ReferenceDataType): Promise<void> {
    const { error } = await supabase
      .from('reference_data')
      .delete()
      .eq('type', type);

    if (error) throw error;
  },

  mapToReferenceData(data: any): ReferenceData {
    return {
      id: data.id,
      type: data.type,
      data: data.data,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },
};
