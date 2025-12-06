import { UserInscription, PaymentRecord, CashierSession, PaymentValidation } from '../types/payment';
import { Order } from '../types/order';
import { plans } from '../data/plans';
import { createCreditPoolFromOrder, addCreditPoolToUser, migrateUserToFIFOSystem } from '../services/creditFIFOService';

// Générer un numéro d'inscription unique
export const generateInscriptionNumber = (): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INS-${year}${month}-${random}`;
};

// Générer un numéro de reçu
export const generateReceiptNumber = (): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RC-${year}${month}${day}-${random}`;
};

// Vérifier si un utilisateur peut faire des simulations
export const canUserSimulate = (userId: string): boolean => {
  // Récupérer les paiements de l'utilisateur depuis le localStorage
  const payments = getPaymentsByUserId(userId);
  
  // Vérifier s'il y a au moins un paiement validé
  return payments.some(payment => payment.status === 'validated');
};

// Vérifier si un utilisateur a des crédits valides (provenant de commandes autorisées)
export const hasValidCredits = (user: any): boolean => {
  if (!user || user.remainingCredits <= 0) {
    return false;
  }
  
  // Migrer l'utilisateur vers le nouveau système FIFO si nécessaire
  const migratedUser = migrateUserToFIFOSystem(user);
  
  // Utiliser le nouveau système FIFO pour vérifier les crédits
  if (migratedUser.creditPools && migratedUser.creditPools.length > 0) {
    return migratedUser.creditPools.some(pool => pool.isActive && pool.remainingCredits > 0);
  }
  
  // Fallback vers l'ancien système
  const ordersData = localStorage.getItem('orders');
  if (!ordersData) {
    return false;
  }
  
  const allOrders: any[] = JSON.parse(ordersData);
  const authorizedOrders = allOrders.filter(order => 
    order.userId === user.id && order.status === 'authorized'
  );
  
  // L'utilisateur a des crédits valides s'il a au moins une commande autorisée
  return authorizedOrders.length > 0;
};

// Vérifier si un utilisateur peut acheter des crédits
// NOUVEAU: Les utilisateurs peuvent maintenant acheter des crédits même s'ils en ont encore
export const canUserBuyCredits = (user: any): boolean => {
  if (!user) return false;
  
  // NOUVEAU COMPORTEMENT: L'utilisateur peut toujours acheter des crédits
  // Les crédits s'ajoutent en FIFO (premier acheté, premier utilisé)
  return true;
};

// Obtenir le message d'information pour l'achat de crédits
export const getCreditPurchaseMessage = (user: any): string => {
  if (!user) return '';
  
  // Migrer l'utilisateur vers le nouveau système FIFO si nécessaire
  const migratedUser = migrateUserToFIFOSystem(user);
  
  if (migratedUser.remainingCredits > 0) {
    return `Vous avez ${migratedUser.remainingCredits} crédit${migratedUser.remainingCredits > 1 ? 's' : ''} disponible${migratedUser.remainingCredits > 1 ? 's' : ''}. Vous pouvez acheter de nouveaux crédits qui s'ajouteront à votre stock existant (système FIFO).`;
  }
  
  return 'Vous n\'avez plus de crédits. Vous pouvez acheter un nouveau pack.';
};

// Récupérer les paiements d'un utilisateur
export const getPaymentsByUserId = (userId: string): PaymentRecord[] => {
  const allPayments = getAllPayments();
  return allPayments.filter(payment => payment.userId === userId);
};

// Récupérer le numéro d'inscription d'un utilisateur
export const getUserInscriptionNumber = (userId: string): string | null => {
  const inscriptions = localStorage.getItem('userInscriptions');
  if (!inscriptions) return null;
  
  const allInscriptions: UserInscription[] = JSON.parse(inscriptions);
  const userInscription = allInscriptions.find(ins => ins.userId === userId && ins.status === 'active');
  
  return userInscription ? userInscription.inscriptionNumber : null;
};

// Créer un enregistrement de paiement
export const createPaymentRecord = (paymentData: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'receiptNumber'>): PaymentRecord => {
  const payment: PaymentRecord = {
    ...paymentData,
    id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    receiptNumber: generateReceiptNumber(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Sauvegarder dans le localStorage
  const existingPayments = localStorage.getItem('paymentRecords');
  const payments: PaymentRecord[] = existingPayments ? JSON.parse(existingPayments) : [];
  payments.push(payment);
  localStorage.setItem('paymentRecords', JSON.stringify(payments));
  
  return payment;
};

// Valider un paiement
export const validatePayment = (paymentId: string, validatorId: string, validatorName: string, notes?: string): boolean => {
  const payments = localStorage.getItem('paymentRecords');
  if (!payments) return false;
  
  const allPayments: PaymentRecord[] = JSON.parse(payments);
  const paymentIndex = allPayments.findIndex(p => p.id === paymentId);
  
  if (paymentIndex === -1) return false;
  
  // Mettre à jour le paiement
  allPayments[paymentIndex].status = 'validated';
  allPayments[paymentIndex].validatorId = validatorId;
  allPayments[paymentIndex].validatedAt = new Date();
  allPayments[paymentIndex].updatedAt = new Date();
  
  // Sauvegarder
  localStorage.setItem('paymentRecords', JSON.stringify(allPayments));
  
  // Créer l'enregistrement de validation
  const validation: PaymentValidation = {
    id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    paymentId,
    validatorId,
    validatorName,
    validatedAt: new Date(),
    notes,
    status: 'approved'
  };
  
  const existingValidations = localStorage.getItem('paymentValidations');
  const validations: PaymentValidation[] = existingValidations ? JSON.parse(existingValidations) : [];
  validations.push(validation);
  localStorage.setItem('paymentValidations', JSON.stringify(validations));
  
  return true;
};

// Récupérer tous les paiements en attente de validation
export const getPendingPayments = (): PaymentRecord[] => {
  const allPayments = getAllPayments();
  return allPayments.filter(payment => payment.status === 'paid');
};

// Récupérer tous les paiements
export const getAllPayments = (): PaymentRecord[] => {
  const payments = localStorage.getItem('paymentRecords');
  if (!payments) return [];
  
  const parsedPayments = JSON.parse(payments);
  // Convertir les dates string en objets Date
  return parsedPayments.map((payment: any) => ({
    ...payment,
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt),
    paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
    validatedAt: payment.validatedAt ? new Date(payment.validatedAt) : undefined
  }));
};

// Créer une session de caissier
export const createCashierSession = (cashierId: string, cashierName: string): CashierSession => {
  const session: CashierSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    cashierId,
    cashierName,
    startTime: new Date(),
    totalAmount: 0,
    totalTransactions: 0,
    isActive: true
  };
  
  // Sauvegarder la session active
  localStorage.setItem('activeCashierSession', JSON.stringify(session));
  
  return session;
};

// Récupérer la session de caissier active
export const getActiveCashierSession = (): CashierSession | null => {
  const session = localStorage.getItem('activeCashierSession');
  if (!session) return null;
  
  return JSON.parse(session);
};

// Fermer une session de caissier
export const closeCashierSession = (): boolean => {
  const session = getActiveCashierSession();
  if (!session) return false;
  
  session.endTime = new Date();
  session.isActive = false;
  
  // Sauvegarder dans l'historique
  const existingSessions = localStorage.getItem('cashierSessions');
  const sessions: CashierSession[] = existingSessions ? JSON.parse(existingSessions) : [];
  sessions.push(session);
  localStorage.setItem('cashierSessions', JSON.stringify(sessions));
  
  // Supprimer la session active
  localStorage.removeItem('activeCashierSession');
  
  return true;
};

// Mettre à jour les crédits utilisateur après validation d'une commande OIC
// OBSOLÈTE: Cette fonction utilise localStorage. Utilisez orderUtils.updateOrderStatus() à la place.
// Le pool de crédits est créé automatiquement via creditService.createCreditPoolFromOrder()
// @deprecated Utilisez orderUtils.updateOrderStatus() avec status 'authorized'
export const updateUserCreditsAfterPayment = async (order: Order): Promise<boolean> => {
  console.warn('⚠️ updateUserCreditsAfterPayment est obsolète. Utilisez orderUtils.updateOrderStatus() à la place.');
  
  try {
    // Utiliser le service Supabase pour créer le pool de crédits
    const { creditService } = await import('../services/supabase/creditService');
    await creditService.createCreditPoolFromOrder(order);
    
    console.log(`✅ Pool de crédits créé pour la commande ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la création du pool de crédits:', error);
    return false;
  }
};

// Fonction pour mettre à jour les crédits d'un utilisateur spécifique (pour les admins)
// OBSOLÈTE: Cette fonction utilise localStorage. Les crédits sont gérés via Supabase maintenant.
// @deprecated Les crédits sont automatiquement mis à jour via les credit_pools dans Supabase
export const updateUserCreditsById = async (userId: string, credits: number): Promise<boolean> => {
  console.warn('⚠️ updateUserCreditsById est obsolète. Les crédits sont gérés via Supabase credit_pools.');
  
  // Cette fonction ne devrait plus être utilisée car les crédits sont gérés
  // automatiquement via les credit_pools dans Supabase
  // Pour ajouter des crédits, créez une commande et autorisez-la
  console.error('Cette fonction ne devrait plus être utilisée. Créez une commande à la place.');
  return false;
};

