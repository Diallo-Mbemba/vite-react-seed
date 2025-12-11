import { supabase } from '@/integrations/supabase/client';

export interface Actor {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  type?: 'supplier' | 'customer' | 'transporter' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const actorService = {
  /**
   * Récupérer tous les acteurs d'un utilisateur
   */
  async getActorsByUser(userId: string): Promise<Actor[]> {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapToActor);
  },

  /**
   * Récupérer un acteur par ID
   */
  async getActorById(id: string): Promise<Actor | null> {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapToActor(data) : null;
  },

  /**
   * Créer un acteur
   */
  async createActor(userId: string, actor: Omit<Actor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Actor> {
    const { data, error } = await supabase
      .from('actors')
      .insert({
        user_id: userId,
        name: actor.name,
        email: actor.email,
        phone: actor.phone,
        address: actor.address,
        country: actor.country,
        city: actor.city,
        type: actor.type,
        notes: actor.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToActor(data);
  },

  /**
   * Mettre à jour un acteur
   */
  async updateActor(id: string, updates: Partial<Omit<Actor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Actor> {
    const { data, error } = await supabase
      .from('actors')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
        country: updates.country,
        city: updates.city,
        type: updates.type,
        notes: updates.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToActor(data);
  },

  /**
   * Supprimer un acteur
   */
  async deleteActor(id: string): Promise<void> {
    const { error } = await supabase
      .from('actors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  mapToActor(data: any): Actor {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      country: data.country,
      city: data.city,
      type: data.type,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },
};

