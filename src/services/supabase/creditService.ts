import { supabase } from '../../lib/supabaseClient';
import { CreditPool, CreditUsage } from '../../types';
import { Order } from '../../types/order';

/**
 * Service pour gérer les crédits FIFO dans Supabase
 */
export const creditService = {
  /**
   * Créer un pool de crédits à partir d'une commande
   */
  async createCreditPoolFromOrder(order: Order): Promise<CreditPool> {
    const insertData = {
      user_id: order.userId,
      order_id: order.id,
      order_number: order.orderNumber,
      plan_id: order.planId,
      plan_name: order.planName,
      total_credits: order.planCredits,
      remaining_credits: order.planCredits,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('credit_pools')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToCreditPool(data);
  },

  /**
   * Récupérer tous les pools de crédits d'un utilisateur
   */
  async getUserCreditPools(userId: string): Promise<CreditPool[]> {
    const { data, error } = await supabase
      .from('credit_pools')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }); // FIFO order

    if (error) throw error;

    return data.map(this.mapToCreditPool);
  },

  /**
   * Consommer un crédit (FIFO)
   */
  async consumeCredit(
    userId: string,
    simulationId: string,
    simulationName: string
  ): Promise<{ success: boolean; creditPool?: CreditPool; error?: string }> {
    // Trouver le premier pool actif avec des crédits restants (FIFO)
    const { data: pools, error: poolsError } = await supabase
      .from('credit_pools')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('remaining_credits', 0)
      .order('created_at', { ascending: true })
      .limit(1);

    if (poolsError) {
      return { success: false, error: poolsError.message };
    }

    if (!pools || pools.length === 0) {
      return { success: false, error: 'Aucun crédit disponible' };
    }

    const pool = pools[0];

    // Décrémenter le crédit
    const { data: updatedPool, error: updateError } = await supabase
      .from('credit_pools')
      .update({ remaining_credits: pool.remaining_credits - 1 })
      .eq('id', pool.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Enregistrer l'utilisation
    await this.recordCreditUsage({
      userId,
      simulationId,
      creditPoolId: pool.id,
      orderId: pool.order_id,
      orderNumber: pool.order_number,
      simulationName,
    });

    return {
      success: true,
      creditPool: this.mapToCreditPool(updatedPool),
    };
  },

  /**
   * Enregistrer l'utilisation d'un crédit
   */
  async recordCreditUsage(usage: Omit<CreditUsage, 'id' | 'usedAt'>): Promise<CreditUsage> {
    const insertData = {
      user_id: usage.userId,
      simulation_id: usage.simulationId,
      credit_pool_id: usage.creditPoolId,
      order_id: usage.orderId,
      order_number: usage.orderNumber,
      simulation_name: usage.simulationName,
    };

    const { data, error } = await supabase
      .from('credit_usage')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToCreditUsage(data);
  },

  /**
   * Récupérer l'historique d'utilisation des crédits
   */
  async getCreditUsageHistory(userId: string): Promise<CreditUsage[]> {
    const { data, error } = await supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToCreditUsage);
  },

  /**
   * Désactiver un pool de crédits
   */
  async deactivateCreditPool(poolId: string): Promise<void> {
    const { error } = await supabase
      .from('credit_pools')
      .update({ is_active: false })
      .eq('id', poolId);

    if (error) throw error;
  },

  /**
   * Vérifier si un utilisateur a des crédits disponibles
   */
  async hasAvailableCredits(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('credit_pools')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('remaining_credits', 0)
      .limit(1);

    if (error) throw error;

    return data && data.length > 0;
  },

  /**
   * Mapper depuis la base de données vers CreditPool
   */
  mapToCreditPool(data: any): CreditPool {
    return {
      id: data.id,
      orderId: data.order_id,
      orderNumber: data.order_number,
      planId: data.plan_id,
      planName: data.plan_name,
      totalCredits: data.total_credits,
      remainingCredits: data.remaining_credits,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      isActive: data.is_active,
    };
  },

  /**
   * Mapper depuis la base de données vers CreditUsage
   */
  mapToCreditUsage(data: any): CreditUsage {
    return {
      id: data.id,
      userId: data.user_id,
      simulationId: data.simulation_id,
      creditPoolId: data.credit_pool_id,
      orderId: data.order_id,
      orderNumber: data.order_number,
      usedAt: new Date(data.used_at),
      simulationName: data.simulation_name,
    };
  },
};


