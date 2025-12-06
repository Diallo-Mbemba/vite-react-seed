import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  DollarSign, 
  Receipt,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Package,
  Shield,
  FileText,
  Calendar,
  Download,
  Printer
} from 'lucide-react';
import { 
  getPendingPayments, 
  getAllPayments, 
  validatePayment,
  getUserInscriptionNumber
} from '../../utils/paymentUtils';
import { 
  generateDailySalesReport, 
  generatePeriodSalesReport, 
  printSalesReport, 
  downloadSalesReport 
} from '../../utils/salesReportUtils';
import { PaymentRecord } from '../../types/payment';
import { 
  getAllOrders, 
  filterOrders as filterOrdersUtil, 
  updateOrderStatus, 
  getOrderStats,
  formatCurrency,
  getStatusColor,
  getStatusText,
  canAuthorizeOrder
} from '../../utils/orderUtils';
import { Order, OrderStatus, OrderStats } from '../../types/order';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../contexts/AuthContext';

const PaymentValidationPage: React.FC = () => {
  const { isAdmin, isCashier } = useAdmin();
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [validatorName, setValidatorName] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'validated'>('all');
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  // Nouvelles variables pour la gestion des commandes
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingValidation: 0,
    validated: 0,
    authorized: 0,
    cancelled: 0,
    totalAmount: 0,
    todayOrders: 0,
    todayAmount: 0,
  });
  // Pour les caissiers, forcer l'onglet "orders" (ils ne doivent voir que les commandes)
  const [activeTab, setActiveTab] = useState<'payments' | 'orders'>(
    isCashier && !isAdmin ? 'orders' : 'orders'
  );
  
  // Variables pour les rapports de ventes
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportType, setReportType] = useState<'day' | 'period'>('day');

  useEffect(() => {
    loadPayments();
    loadOrders();
  }, [isAdmin, isCashier]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  useEffect(() => {
    filterOrdersData();
  }, [orders, searchTerm, orderStatusFilter]);

  const loadPayments = () => {
    const allPayments = getAllPayments();
    setPayments(allPayments);
  };

  const loadOrders = async () => {
    try {
      let allOrders = await getAllOrders();
      
      // Pour les caissiers, filtrer uniquement les commandes en attente de validation ou déjà validées
      if (isCashier && !isAdmin) {
        allOrders = allOrders.filter(order => 
          order.status === 'pending_validation' || order.status === 'validated'
        );
      }
      
      setOrders(allOrders);
      const stats = await getOrderStats();
      setStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.inscriptionNumber.toLowerCase().includes(term) ||
        payment.receiptNumber.toLowerCase().includes(term) ||
        payment.description.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(filtered);
  };

  const filterOrdersData = async () => {
    try {
      const filters: any = {
        status: orderStatusFilter === 'all' ? undefined : orderStatusFilter,
      };

      let filtered = await filterOrdersUtil(filters);

      // Pour les caissiers, filtrer uniquement les commandes en attente de validation ou déjà validées
      if (isCashier && !isAdmin) {
        filtered = filtered.filter(order => 
          order.status === 'pending_validation' || order.status === 'validated'
        );
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(order =>
          order.orderNumber.toLowerCase().includes(term) ||
          order.userName.toLowerCase().includes(term) ||
          order.userEmail.toLowerCase().includes(term)
        );
      }

      setFilteredOrders(filtered);
    } catch (error) {
      console.error('Erreur lors du filtrage des commandes:', error);
    }
  };

  const handleValidatePayment = (paymentId: string, approved: boolean) => {
    if (!validatorName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    if (approved) {
      const success = validatePayment(paymentId, `validator_${Date.now()}`, validatorName.trim(), validationNotes.trim());
      if (success) {
        alert('Paiement validé avec succès');
        loadPayments();
        setShowValidationModal(false);
        setSelectedPayment(null);
        setValidationNotes('');
      } else {
        alert('Erreur lors de la validation');
      }
    } else {
      // Marquer comme rejeté (à implémenter selon les besoins)
      alert('Paiement rejeté');
      setShowValidationModal(false);
      setSelectedPayment(null);
      setValidationNotes('');
    }
  };

  const handleAuthorizeOrder = async (orderId: string) => {
    if (!validatorName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    // Vérifier que l'utilisateur est connecté (nécessaire pour RLS)
    if (!user) {
      alert('❌ Vous devez être connecté pour autoriser une commande.\n\n' +
        'Les politiques RLS (Row Level Security) nécessitent que vous soyez authentifié.\n' +
        'Veuillez vous connecter avec votre compte administrateur.');
      return;
    }

    try {
      // Utiliser l'ID de l'utilisateur connecté (requis pour RLS)
      const authorizerId = user.id;
      
      console.log('🔄 Autorisation de la commande...', {
        orderId,
        authorizerId,
        validatorName: validatorName.trim()
      });

      const success = await updateOrderStatus(
        orderId, 
        'authorized', 
        authorizerId, 
        validationNotes.trim() || `Autorisé par ${validatorName.trim()}`
      );
      
      if (success) {
        alert('✅ Commande autorisée avec succès ! Les crédits ont été automatiquement ajoutés au compte utilisateur.');
        loadOrders();
        setShowOrderModal(false);
        setSelectedOrder(null);
        setValidationNotes('');
      } else {
        alert('❌ Erreur lors de l\'autorisation');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'autorisation:', error);
      
      // Messages d'erreur plus détaillés
      let errorMessage = 'Erreur lors de l\'autorisation de la commande.';
      
      if (error?.message) {
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMessage = '❌ Erreur de permissions. Assurez-vous que vous êtes connecté et que votre compte a le rôle d\'administrateur dans Supabase.';
        } else if (error.message.includes('Commande non trouvée')) {
          errorMessage = `❌ ${error.message}`;
        } else if (error.message.includes('foreign key')) {
          errorMessage = '❌ Erreur: L\'ID de l\'autoriseur n\'existe pas dans la base de données.';
        } else {
          errorMessage = `❌ Erreur: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En attente</span>;
      case 'paid':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Payé</span>;
      case 'validated':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Validé</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Annulé</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'caisse_oic':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Caisse OIC</span>;
      case 'mobile_money':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Mobile Money</span>;
      case 'bank_transfer':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Virement</span>;
      case 'credit_card':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Carte</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{method}</span>;
    }
  };

  // Fonctions pour les rapports de ventes
  const handlePrintDailyReport = () => {
    const report = generateDailySalesReport();
    printSalesReport(report);
  };

  const handlePrintPeriodReport = () => {
    if (!reportStartDate || !reportEndDate) {
      alert('Veuillez sélectionner une période');
      return;
    }
    
    const startDate = new Date(reportStartDate);
    const endDate = new Date(reportEndDate);
    
    if (startDate > endDate) {
      alert('La date de début doit être antérieure à la date de fin');
      return;
    }
    
    const report = generatePeriodSalesReport(startDate, endDate);
    printSalesReport(report);
  };

  const handleDownloadDailyReport = () => {
    const report = generateDailySalesReport();
    downloadSalesReport(report);
  };

  const handleDownloadPeriodReport = () => {
    if (!reportStartDate || !reportEndDate) {
      alert('Veuillez sélectionner une période');
      return;
    }
    
    const startDate = new Date(reportStartDate);
    const endDate = new Date(reportEndDate);
    
    if (startDate > endDate) {
      alert('La date de début doit être antérieure à la date de fin');
      return;
    }
    
    const report = generatePeriodSalesReport(startDate, endDate);
    downloadSalesReport(report);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation des Paiements</h1>
              <p className="text-gray-600">Gérer les paiements et autoriser les commandes</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-cote-ivoire-primary">
                  {activeTab === 'orders' ? stats.validated : payments.filter(p => p.status === 'paid').length}
                </div>
                <div className="text-sm text-gray-600">
                  {activeTab === 'orders' ? 'Commandes validées' : 'Paiements en attente'}
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Rapports
              </button>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                // Les caissiers ne peuvent pas changer d'onglet
                if (isCashier && !isAdmin) return;
                setActiveTab('orders');
              }}
              disabled={isCashier && !isAdmin}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-cote-ivoire-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              } ${isCashier && !isAdmin ? 'opacity-100 cursor-default' : ''}`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Commandes OIC
            </button>
            {/* Onglet Paiements directs - visible uniquement pour les admins */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'payments'
                    ? 'bg-white text-cote-ivoire-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Receipt className="h-4 w-4 inline mr-2" />
                Paiements directs
              </button>
            )}
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                  placeholder={activeTab === 'orders' ? 'Numéro commande, nom, email...' : 'Numéro inscription, reçu...'}
                />
              </div>
            </div>
            
            {/* Filtre de statut - visible uniquement pour les paiements directs (admins) */}
            {activeTab === 'payments' && isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                >
                  <option value="all">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="validated">Validé</option>
                </select>
              </div>
            )}
            
            {/* Filtre de statut pour les commandes - visible uniquement pour les admins */}
            {activeTab === 'orders' && isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                >
                  <option value="all">Tous</option>
                  <option value="pending_validation">En attente de validation</option>
                  <option value="validated">Validé</option>
                  <option value="authorized">Autorisé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du validateur
              </label>
              <input
                type="text"
                value={validatorName}
                onChange={(e) => setValidatorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                placeholder="Votre nom"
              />
            </div>
          </div>
        </div>

        {/* Contenu conditionnel selon l'onglet */}
        {activeTab === 'orders' ? (
          /* Tableau des commandes */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{order.userName}</div>
                          <div className="text-gray-500">{order.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{order.planName}</div>
                          <div className="text-gray-500">{order.planCredits} crédits</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.amount, order.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Bouton d'autorisation - visible uniquement pour les admins */}
                          {isAdmin && canAuthorizeOrder(order) && (
                            <button
                              onClick={() => handleAuthorizeOrder(order.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Autoriser"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune commande trouvée</p>
              </div>
            )}
          </div>
        ) : (
          /* Tableau des paiements */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reçu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Méthode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.receiptNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cote-ivoire-primary font-medium">
                        {payment.inscriptionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(payment.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowValidationModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {payment.status === 'paid' && (
                            <button
                              onClick={() => handleValidatePayment(payment.id, true)}
                              className="text-green-600 hover:text-green-900"
                              title="Valider"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun paiement trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Modal de validation */}
        {showValidationModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center mb-6">
                <Receipt className="h-12 w-12 text-cote-ivoire-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Détails du paiement</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Numéro de reçu:</span>
                  <span className="font-bold">{selectedPayment.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Numéro d'inscription:</span>
                  <span className="font-bold text-cote-ivoire-primary">{selectedPayment.inscriptionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Montant:</span>
                  <span className="font-bold">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Méthode:</span>
                  <span className="font-bold">{getPaymentMethodBadge(selectedPayment.paymentMethod)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Date:</span>
                  <span className="font-bold">{new Date(selectedPayment.createdAt).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Statut:</span>
                  <span className="font-bold">{getStatusBadge(selectedPayment.status)}</span>
                </div>
              </div>
              
              {selectedPayment.status === 'paid' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes de validation (optionnel)
                  </label>
                  <textarea
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                    rows={3}
                    placeholder="Ajoutez des notes si nécessaire..."
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                {selectedPayment.status === 'paid' && (
                  <button
                    onClick={() => handleValidatePayment(selectedPayment.id, true)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider
                  </button>
                )}
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails de commande */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Détails de la commande</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Numéro de commande</label>
                    <p className="text-lg font-bold text-cote-ivoire-primary">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Utilisateur</label>
                    <p className="font-medium">{selectedOrder.userName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.userEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Plan</label>
                    <p className="font-medium">{selectedOrder.planName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.planCredits} crédits</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Montant</label>
                    <p className="text-lg font-bold">{formatCurrency(selectedOrder.amount, selectedOrder.currency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date de création</label>
                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                
                {selectedOrder.validatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Validé le</label>
                    <p className="font-medium">{new Date(selectedOrder.validatedAt).toLocaleString('fr-FR')}</p>
                  </div>
                )}
                
                {selectedOrder.authorizedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Autorisé le</label>
                    <p className="font-medium">{new Date(selectedOrder.authorizedAt).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                {/* Bouton d'autorisation - visible uniquement pour les admins */}
                {isAdmin && canAuthorizeOrder(selectedOrder) && (
                  <button
                    onClick={() => handleAuthorizeOrder(selectedOrder.id)}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Autoriser les crédits
                  </button>
                )}
                
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal des rapports de ventes */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Rapports des ventes
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Rapport du jour */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Rapport du jour
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Générer un rapport des ventes pour aujourd'hui ({new Date().toLocaleDateString('fr-FR')})
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePrintDailyReport}
                      className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </button>
                    <button
                      onClick={handleDownloadDailyReport}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </button>
                  </div>
                </div>
                
                {/* Rapport sur période */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Rapport sur période
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Générer un rapport des ventes pour une période donnée
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePrintPeriodReport}
                      className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </button>
                    <button
                      onClick={handleDownloadPeriodReport}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentValidationPage;

