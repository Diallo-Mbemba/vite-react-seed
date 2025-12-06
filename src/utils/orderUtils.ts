import { Order, OrderStatus, OrderValidation, OrderStats, OrderSearchFilters } from '../types/order';
import { orderService } from '../services/supabase/orderService';
import { creditService } from '../services/supabase/creditService';

// Générer un numéro de commande unique
export const generateOrderNumber = (): string => {
  return orderService.generateOrderNumber();
};

// Créer une nouvelle commande
export const createOrder = async (
  orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> => {
  return await orderService.createOrder(orderData);
};

// Récupérer toutes les commandes
export const getAllOrders = async (): Promise<Order[]> => {
  return await orderService.getAllOrders();
};

// Récupérer les commandes d'un utilisateur
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  return await orderService.getUserOrders(userId);
};

// Récupérer une commande par ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  return await orderService.getOrderById(orderId);
};

// Récupérer une commande par numéro
export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  return await orderService.getOrderByNumber(orderNumber);
};

// Filtrer les commandes
export const filterOrders = async (filters: OrderSearchFilters): Promise<Order[]> => {
  let orders = await getAllOrders();

  if (filters.status) {
    orders = orders.filter((order) => order.status === filters.status);
  }

  if (filters.userId) {
    orders = orders.filter((order) => order.userId === filters.userId);
  }

  if (filters.orderNumber) {
    orders = orders.filter((order) =>
      order.orderNumber.toLowerCase().includes(filters.orderNumber!.toLowerCase())
    );
  }

  if (filters.dateFrom) {
    orders = orders.filter((order) => order.createdAt >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    orders = orders.filter((order) => order.createdAt <= filters.dateTo!);
  }

  if (filters.validatedBy) {
    orders = orders.filter((order) => order.validatedBy === filters.validatedBy);
  }

  if (filters.authorizedBy) {
    orders = orders.filter((order) => order.authorizedBy === filters.authorizedBy);
  }

  return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Mettre à jour le statut d'une commande
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  updatedBy: string,
  notes?: string
): Promise<boolean> => {
  try {
    console.log('🔄 Mise à jour du statut de la commande...', {
      orderId,
      status,
      updatedBy,
      notes
    });

    const order = await orderService.updateOrderStatus(orderId, status, updatedBy, notes);

    // Si la commande est autorisée, créer le pool de crédits
    if (status === 'authorized') {
      try {
        console.log('🔄 Création du pool de crédits pour la commande...', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          planCredits: order.planCredits
        });
        
        await creditService.createCreditPoolFromOrder(order);
        
        console.log('✅ Pool de crédits créé avec succès');
      } catch (creditError: any) {
        console.error('❌ Erreur lors de la création du pool de crédits:', creditError);
        
        // Si l'erreur est liée aux permissions RLS
        if (creditError?.code === '42501' || creditError?.message?.includes('permission denied') || creditError?.message?.includes('RLS')) {
          throw new Error(`Permission refusée pour créer le pool de crédits. Vérifiez que vous êtes connecté avec un compte administrateur et que la politique RLS "Admins can insert credit pools for any user" existe dans Supabase. Détails: ${creditError.message}`);
        }
        
        // Propager l'erreur avec un message plus clair
        throw new Error(`Erreur lors de la création du pool de crédits: ${creditError.message || creditError}`);
      }
    }

    console.log('✅ Statut de la commande mis à jour avec succès');
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    
    // Propager l'erreur pour permettre une gestion plus fine dans les composants
    throw error;
  }
};

// Calculer les statistiques des commandes
export const getOrderStats = async (): Promise<OrderStats> => {
  try {
    const orders = await getAllOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    return {
      totalOrders: orders.length,
      pendingValidation: orders.filter((o) => o.status === 'pending_validation').length,
      validated: orders.filter((o) => o.status === 'validated').length,
      authorized: orders.filter((o) => o.status === 'authorized').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
      todayOrders: todayOrders.length,
      todayAmount: todayOrders.reduce((sum, order) => sum + order.amount, 0),
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return {
      totalOrders: 0,
      pendingValidation: 0,
      validated: 0,
      authorized: 0,
      cancelled: 0,
      totalAmount: 0,
      todayOrders: 0,
      todayAmount: 0,
    };
  }
};

// Récupérer les commandes en attente de validation
export const getPendingOrders = async (): Promise<Order[]> => {
  return await filterOrders({ status: 'pending_validation' });
};

// Récupérer les commandes validées en attente d'autorisation
export const getValidatedOrders = async (): Promise<Order[]> => {
  return await filterOrders({ status: 'validated' });
};

// Récupérer les commandes autorisées
export const getAuthorizedOrders = async (): Promise<Order[]> => {
  return await filterOrders({ status: 'authorized' });
};

// Vérifier si une commande peut être validée
export const canValidateOrder = (order: Order): boolean => {
  return order.status === 'pending_validation';
};

// Vérifier si une commande peut être autorisée
export const canAuthorizeOrder = (order: Order): boolean => {
  return order.status === 'validated';
};

// Formater le montant
export const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Obtenir la couleur du statut
export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'pending_validation':
      return 'bg-yellow-100 text-yellow-800';
    case 'validated':
      return 'bg-blue-100 text-blue-800';
    case 'authorized':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Obtenir le texte du statut
export const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case 'pending_validation':
      return 'En attente de validation';
    case 'validated':
      return 'Validé par la caisse';
    case 'authorized':
      return 'Autorisé par l\'admin';
    case 'cancelled':
      return 'Annulé';
    case 'expired':
      return 'Expiré';
    default:
      return status;
  }
};
