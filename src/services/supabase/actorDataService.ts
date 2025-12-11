import { supabase } from '@/integrations/supabase/client';
import { ActorData } from '../../data/actors';

/**
 * Service Supabase pour la gestion des acteurs
 * Utilise la structure ActorData (nom, adresse, telephone, etc.)
 */
export const actorDataService = {
  /**
   * Récupérer tous les acteurs d'un utilisateur
   */
  async getActorsByUser(userId: string): Promise<ActorData[]> {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des acteurs:', error);
      throw error;
    }

    return data.map(this.mapToActorData);
  },

  /**
   * Récupérer un acteur par ID
   */
  async getActorById(id: string): Promise<ActorData | null> {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('❌ Erreur lors de la récupération de l\'acteur:', error);
      throw error;
    }

    return data ? this.mapToActorData(data) : null;
  },

  /**
   * Créer un acteur
   */
  async createActor(userId: string, actor: Omit<ActorData, 'id'>): Promise<ActorData> {
    const { data, error } = await supabase
      .from('actors')
      .insert({
        user_id: userId,
        nom: actor.nom,
        adresse: actor.adresse,
        telephone: actor.telephone,
        email: actor.email,
        type: actor.type,
        zone: actor.zone,
        pays: actor.pays,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création de l\'acteur:', error);
      throw error;
    }

    return this.mapToActorData(data);
  },

  /**
   * Mettre à jour un acteur
   */
  async updateActor(id: string, updates: Partial<Omit<ActorData, 'id'>>): Promise<ActorData> {
    const updateData: any = {};
    
    if (updates.nom !== undefined) updateData.nom = updates.nom;
    if (updates.adresse !== undefined) updateData.adresse = updates.adresse;
    if (updates.telephone !== undefined) updateData.telephone = updates.telephone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.zone !== undefined) updateData.zone = updates.zone;
    if (updates.pays !== undefined) updateData.pays = updates.pays;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('actors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'acteur:', error);
      throw error;
    }

    return this.mapToActorData(data);
  },

  /**
   * Supprimer un acteur
   */
  async deleteActor(id: string): Promise<void> {
    const { error } = await supabase
      .from('actors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur lors de la suppression de l\'acteur:', error);
      throw error;
    }
  },

  /**
   * Mapper les données Supabase vers ActorData
   */
  mapToActorData(data: any): ActorData {
    return {
      id: data.id,
      nom: data.nom,
      adresse: data.adresse,
      telephone: data.telephone || '',
      email: data.email || '',
      type: data.type,
      zone: data.zone,
      pays: data.pays,
    };
  },
};

