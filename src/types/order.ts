export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  planCredits: number;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: 'caisse_oic' | 'stripe' | 'lygos';
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  authorizedAt?: Date;
  validatedBy?: string; // ID du caissier
  authorizedBy?: string; // ID de l'admin
  receiptNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

export type OrderStatus = 
  | 'pending_validation'    // En attente de validation par la caisse
  | 'validated'            // Validé par la caisse OIC
  | 'authorized'           // Autorisé par l'admin
  | 'cancelled'            // Annulé
  | 'expired';             // Expiré

export interface OrderValidation {
  id: string;
  orderId: string;
  validatorId: string;
  validatorName: string;
  validatedAt: Date;
  notes?: string;
  type: 'validation' | 'authorization';
}

export interface OrderSearchFilters {
  status?: OrderStatus;
  userId?: string;
  orderNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  validatedBy?: string;
  authorizedBy?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingValidation: number;
  validated: number;
  authorized: number;
  cancelled: number;
  totalAmount: number;
  todayOrders: number;
  todayAmount: number;
}

export interface CashierSession {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: Date;
  endTime?: Date;
  totalAmount: number;
  totalOrders: number;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  permissions: string[];
  createdAt: Date;
  isActive: boolean;
}

