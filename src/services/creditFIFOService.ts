import { CreditPool, CreditUsage, PlanType } from '../types';
import { Order } from '../types/order';
import { plans } from '../data/plans';
import { creditService } from './supabase/creditService';
import { orderService } from './supabase/orderService';

/**
 * Service pour gérer le système FIFO des crédits de simulation
 * Utilise maintenant Supabase au lieu de localStorage
 */

/**
 * Créer un nouveau pool de crédits à partir d'une commande autorisée
 */
export const createCreditPoolFromOrder = async (order: Order): Promise<CreditPool> => {
  return await creditService.createCreditPoolFromOrder(order);
};

/**
 * Ajouter un pool de crédits à un utilisateur
 */
export const addCreditPoolToUser = async (userId: string, creditPool: CreditPool): Promise<void> => {
  // Le pool est déjà créé dans Supabase, pas besoin de faire quoi que ce soit
  // Les crédits totaux sont mis à jour automatiquement via le trigger SQL
};

/**
 * Consommer un crédit en utilisant le système FIFO
 */
export const consumeCredit = async (
  userId: string,
  simulationId: string,
  simulationName: string
): Promise<{ success: boolean; creditPool?: CreditPool; error?: string }> => {
  return await creditService.consumeCredit(userId, simulationId, simulationName);
};

/**
 * Vérifier si l'utilisateur a des crédits disponibles
 */
export const hasAvailableCredits = async (userId: string): Promise<boolean> => {
  return await creditService.hasAvailableCredits(userId);
};

/**
 * Obtenir l'historique des crédits utilisés par un utilisateur
 */
export const getCreditUsageHistory = async (userId: string): Promise<CreditUsage[]> => {
  return await creditService.getCreditUsageHistory(userId);
};

/**
 * Obtenir les détails des pools de crédits d'un utilisateur
 */
export const getUserCreditPools = async (userId: string): Promise<CreditPool[]> => {
  return await creditService.getUserCreditPools(userId);
};

/**
 * Désactiver un pool de crédits (pour les remboursements ou annulations)
 */
export const deactivateCreditPool = async (poolId: string): Promise<boolean> => {
  try {
    await creditService.deactivateCreditPool(poolId);
    return true;
  } catch (error) {
    console.error('Erreur lors de la désactivation du pool:', error);
    return false;
  }
};

/**
 * Obtenir le statut détaillé des crédits d'un utilisateur
 */
export const getCreditStatus = async (userId: string) => {
  const pools = await getUserCreditPools(userId);
  const totalCredits = pools.reduce((sum, pool) => sum + pool.totalCredits, 0);
  const remainingCredits = pools.reduce((sum, pool) => sum + pool.remainingCredits, 0);
  const usedCredits = totalCredits - remainingCredits;
  const activePools = pools.filter((pool) => pool.isActive && pool.remainingCredits > 0);

  return {
    totalCredits,
    remainingCredits,
    usedCredits,
    activePools,
    allPools: pools,
    hasAvailableCredits: await hasAvailableCredits(userId),
  };
};

/**
 * Migrer un utilisateur existant vers le nouveau système FIFO
 * Cette fonction est maintenant obsolète car la migration se fait automatiquement
 * via Supabase lors de l'autorisation d'une commande
 */
export const migrateUserToFIFOSystem = async (userId: string): Promise<void> => {
  // La migration se fait automatiquement lors de l'autorisation d'une commande
  // Cette fonction est conservée pour compatibilité mais ne fait rien
  console.log('Migration FIFO: La migration se fait automatiquement via Supabase');
};
