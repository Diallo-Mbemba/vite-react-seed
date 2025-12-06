export interface UserInscription {
  id: string;
  userId: string;
  inscriptionNumber: string;
  createdAt: Date;
  status: 'active' | 'suspended' | 'expired';
}

export interface PaymentRecord {
  id: string;
  userId: string;
  inscriptionNumber: string;
  amount: number;
  currency: string;
  paymentMethod: 'caisse_oic' | 'mobile_money' | 'bank_transfer' | 'credit_card';
  status: 'pending' | 'paid' | 'validated' | 'cancelled';
  cashierId?: string;
  validatorId?: string;
  paidAt?: Date;
  validatedAt?: Date;
  receiptNumber: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashierSession {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: Date;
  endTime?: Date;
  totalAmount: number;
  totalTransactions: number;
  isActive: boolean;
}

export interface PaymentValidation {
  id: string;
  paymentId: string;
  validatorId: string;
  validatorName: string;
  validatedAt: Date;
  notes?: string;
  status: 'approved' | 'rejected';
}

