import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus, OrderValidation } from '../../types/order';

/**
 * Service pour gérer les commandes dans Supabase
 */
export const orderService = {
  /**
   * Générer un numéro de commande unique
   */
  generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CMD-${timestamp}-${random}`;
  },

  /**
   * Créer une nouvelle commande
   */
  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const orderNumber = this.generateOrderNumber();

    const insertData = {
      order_number: orderNumber,
      user_id: orderData.userId,
      user_email: orderData.userEmail,
      user_name: orderData.userName,
      plan_id: orderData.planId,
      plan_name: orderData.planName,
      plan_credits: orderData.planCredits,
      amount: orderData.amount,
      currency: orderData.currency,
      status: orderData.status || 'pending_validation',
      payment_method: orderData.paymentMethod,
      notes: orderData.notes,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToOrder(data);
  },

  /**
   * Récupérer toutes les commandes
   */
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToOrder);
  },

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToOrder);
  },

  /**
   * Récupérer une commande par ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToOrder(data) : null;
  },

  /**
   * Récupérer une commande par numéro
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToOrder(data) : null;
  },

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updatedBy: string,
    notes?: string
  ): Promise<Order> {
    const updateData: any = {
      status,
    };

    if (status === 'validated') {
      updateData.validated_at = new Date().toISOString();
      updateData.validated_by = updatedBy;
      updateData.receipt_number = this.generateReceiptNumber();
    } else if (status === 'authorized') {
      updateData.authorized_at = new Date().toISOString();
      updateData.authorized_by = updatedBy;
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Vérifier d'abord que la commande existe et est accessible
    const existingOrder = await this.getOrderById(orderId);
    if (!existingOrder) {
      throw new Error(`Commande non trouvée avec l'ID: ${orderId}. Vérifiez que la commande existe et que vous avez les permissions nécessaires.`);
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      // Si la commande n'existe pas (code PGRST116) - mais on l'a déjà vérifiée, donc c'est probablement RLS
      if (error.code === 'PGRST116') {
        throw new Error(`Commande non trouvée avec l'ID: ${orderId}. Erreur possible de permissions RLS.`);
      }
      // Erreur de permissions RLS
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        throw new Error(`Permission refusée pour mettre à jour la commande. Vérifiez que vous êtes connecté et que votre compte a le rôle 'cashier' dans la table admin_users. Détails: ${error.message}`);
      }
      throw error;
    }

    if (!data) {
      throw new Error(`La mise à jour de la commande ${orderId} n'a retourné aucun résultat. Cela peut indiquer un problème de permissions RLS.`);
    }

    // Créer un enregistrement de validation
    try {
      await this.createOrderValidation({
        orderId,
        validatorId: updatedBy,
        validatorName: await this.getValidatorName(updatedBy),
        type: status === 'validated' ? 'validation' : 'authorization',
        notes,
      });
    } catch (validationError) {
      // Log l'erreur mais ne pas bloquer la mise à jour du statut
      console.warn('Erreur lors de la création de l\'enregistrement de validation:', validationError);
    }

    return this.mapToOrder(data);
  },

  /**
   * Créer un enregistrement de validation
   */
  async createOrderValidation(validationData: Omit<OrderValidation, 'id' | 'validatedAt'>): Promise<OrderValidation> {
    const insertData = {
      order_id: validationData.orderId,
      validator_id: validationData.validatorId,
      validator_name: validationData.validatorName,
      type: validationData.type,
      notes: validationData.notes,
    };

    const { data, error } = await supabase
      .from('order_validations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      orderId: data.order_id,
      validatorId: data.validator_id,
      validatorName: data.validator_name,
      validatedAt: new Date(data.validated_at),
      type: data.type,
      notes: data.notes,
    };
  },

  /**
   * Récupérer le nom du validateur
   */
  async getValidatorName(validatorId: string): Promise<string> {
    // Essayer de récupérer depuis admin_users
    const { data, error } = await supabase
      .from('admin_users')
      .select('name')
      .eq('user_id', validatorId)
      .single();

    if (!error && data) return data.name;

    // Fallback: récupérer depuis users_app
    const { data: userData, error: userError } = await supabase
      .from('users_app')
      .select('name')
      .eq('id', validatorId)
      .single();

    if (!userError && userData) return userData.name;

    // Si aucun nom n'est trouvé, utiliser un nom par défaut basé sur l'ID
    // Si l'ID commence par "cashier_", c'est probablement une session de caissier
    if (validatorId.startsWith('cashier_')) {
      return 'Caissier OIC';
    }
    
    return `Utilisateur ${validatorId.substring(0, 8)}...`;
  },

  /**
   * Générer un numéro de reçu
   */
  generateReceiptNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  },

  /**
   * Mapper depuis la base de données vers Order
   */
  mapToOrder(data: any): Order {
    return {
      id: data.id,
      orderNumber: data.order_number,
      userId: data.user_id,
      userEmail: data.user_email,
      userName: data.user_name,
      planId: data.plan_id,
      planName: data.plan_name,
      planCredits: data.plan_credits,
      amount: Number(data.amount),
      currency: data.currency,
      status: data.status,
      paymentMethod: data.payment_method,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      validatedAt: data.validated_at ? new Date(data.validated_at) : undefined,
      authorizedAt: data.authorized_at ? new Date(data.authorized_at) : undefined,
      validatedBy: data.validated_by,
      authorizedBy: data.authorized_by,
      receiptNumber: data.receipt_number,
      receiptUrl: data.receipt_url,
      notes: data.notes,
    };
  },
};


