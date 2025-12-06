import { supabase } from '../../lib/supabaseClient';
import { Simulation } from '../../types';

/**
 * Service pour gérer les simulations dans Supabase
 */
export const simulationService = {
  /**
   * Récupérer toutes les simulations d'un utilisateur
   */
  async getSimulationsByUser(userId: string): Promise<Simulation[]> {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToSimulation);
  },

  /**
   * Récupérer une simulation par ID
   */
  async getSimulationById(simulationId: string): Promise<Simulation | null> {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToSimulation(data) : null;
  },

  /**
   * Créer une nouvelle simulation
   */
  async createSimulation(simulation: Omit<Simulation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Simulation> {
    const insertData = this.mapFromSimulation(simulation);

    const { data, error } = await supabase
      .from('simulations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToSimulation(data);
  },

  /**
   * Mettre à jour une simulation
   */
  async updateSimulation(simulationId: string, updates: Partial<Simulation>): Promise<Simulation> {
    const updateData: any = {};

    if (updates.productName !== undefined) updateData.product_name = updates.productName;
    if (updates.numeroFacture !== undefined) updateData.numero_facture = updates.numeroFacture;
    if (updates.fournisseur !== undefined) updateData.fournisseur = updates.fournisseur;
    if (updates.fob !== undefined) updateData.fob = updates.fob;
    if (updates.fret !== undefined) updateData.fret = updates.fret;
    if (updates.assurance !== undefined) updateData.assurance = updates.assurance;
    if (updates.droitDouane !== undefined) updateData.droit_douane = updates.droitDouane;
    if (updates.tva !== undefined) updateData.tva = updates.tva;
    if (updates.fraisFinanciers !== undefined) updateData.frais_financiers = updates.fraisFinanciers;
    if (updates.prestationTransitaire !== undefined) updateData.prestation_transitaire = updates.prestationTransitaire;
    if (updates.rpi !== undefined) updateData.rpi = updates.rpi;
    if (updates.coc !== undefined) updateData.coc = updates.coc;
    if (updates.bsc !== undefined) updateData.bsc = updates.bsc;
    if (updates.creditEnlevement !== undefined) updateData.credit_enlevement = updates.creditEnlevement;
    if (updates.rrr !== undefined) updateData.rrr = updates.rrr;
    if (updates.rcp !== undefined) updateData.rcp = updates.rcp;
    if (updates.totalCost !== undefined) updateData.total_cost = updates.totalCost;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.activeTab !== undefined) updateData.active_tab = updates.activeTab;
    if (updates.maxStepReached !== undefined) updateData.max_step_reached = updates.maxStepReached;
    if (updates.formData !== undefined) updateData.form_data = updates.formData;
    if (updates.autoCalculations !== undefined) updateData.auto_calculations = updates.autoCalculations;
    if (updates.criteria !== undefined) updateData.criteria = updates.criteria;
    if (updates.selectedActors !== undefined) updateData.selected_actors = updates.selectedActors;
    if (updates.articles !== undefined) updateData.articles = updates.articles;
    if (updates.correctionHistory !== undefined) updateData.correction_history = updates.correctionHistory;

    const { data, error } = await supabase
      .from('simulations')
      .update(updateData)
      .eq('id', simulationId)
      .select()
      .single();

    if (error) throw error;

    return this.mapToSimulation(data);
  },

  /**
   * Supprimer une simulation (soft delete)
   */
  async deleteSimulation(simulationId: string): Promise<void> {
    const { error } = await supabase
      .from('simulations')
      .update({ status: 'deleted' })
      .eq('id', simulationId);

    if (error) throw error;
  },

  /**
   * Mapper depuis la base de données vers Simulation
   */
  mapToSimulation(data: any): Simulation {
    return {
      id: data.id,
      userId: data.user_id,
      productName: data.product_name,
      numeroFacture: data.numero_facture,
      fournisseur: data.fournisseur,
      fob: Number(data.fob),
      fret: Number(data.fret),
      assurance: Number(data.assurance),
      droitDouane: Number(data.droit_douane),
      tva: Number(data.tva),
      fraisFinanciers: Number(data.frais_financiers),
      prestationTransitaire: Number(data.prestation_transitaire),
      rpi: Number(data.rpi),
      coc: Number(data.coc),
      bsc: Number(data.bsc),
      creditEnlevement: Number(data.credit_enlevement),
      rrr: Number(data.rrr),
      rcp: Number(data.rcp),
      totalCost: Number(data.total_cost),
      currency: data.currency,
      status: data.status,
      activeTab: data.active_tab,
      maxStepReached: data.max_step_reached,
      formData: data.form_data,
      autoCalculations: data.auto_calculations,
      criteria: data.criteria,
      selectedActors: data.selected_actors,
      articles: data.articles,
      correctionHistory: data.correction_history,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Mapper depuis Simulation vers la base de données
   */
  mapFromSimulation(simulation: Omit<Simulation, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      user_id: simulation.userId,
      product_name: simulation.productName,
      numero_facture: simulation.numeroFacture,
      fournisseur: simulation.fournisseur,
      fob: simulation.fob,
      fret: simulation.fret,
      assurance: simulation.assurance,
      droit_douane: simulation.droitDouane,
      tva: simulation.tva,
      frais_financiers: simulation.fraisFinanciers,
      prestation_transitaire: simulation.prestationTransitaire,
      rpi: simulation.rpi,
      coc: simulation.coc,
      bsc: simulation.bsc,
      credit_enlevement: simulation.creditEnlevement,
      rrr: simulation.rrr,
      rcp: simulation.rcp,
      total_cost: simulation.totalCost,
      currency: simulation.currency,
      status: simulation.status || 'in_progress',
      active_tab: simulation.activeTab,
      max_step_reached: simulation.maxStepReached,
      form_data: simulation.formData,
      auto_calculations: simulation.autoCalculations,
      criteria: simulation.criteria,
      selected_actors: simulation.selectedActors,
      articles: simulation.articles,
      correction_history: simulation.correctionHistory,
    };
  },
};


