import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { 
  getAllOrders, 
  filterOrders, 
  updateOrderStatus, 
  getOrderStats,
  formatCurrency,
  getStatusColor,
  getStatusText,
  canValidateOrder,
  canAuthorizeOrder
} from '../../utils/orderUtils';
import { Order, OrderStatus, OrderSearchFilters, OrderStats } from '../../types/order';

interface OrderManagementProps {
  userRole: 'admin' | 'cashier' | 'user';
  userId?: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ userRole, userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      const allOrders = await getAllOrders();
      setOrders(allOrders);
      const stats = await getOrderStats();
      setStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  };

  const applyFilters = async () => {
    try {
      const filters: OrderSearchFilters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
      };

      if (userRole === 'user' && userId) {
        filters.userId = userId;
      }

      if (searchTerm.trim()) {
        // Recherche par numéro de commande ou nom d'utilisateur
        const filtered = orders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOrders(filtered);
      } else {
        const filtered = await filterOrders(filters);
        setFilteredOrders(filtered);
      }
    } catch (error) {
      console.error('Erreur lors du filtrage des commandes:', error);
    }
  };

  const handleValidateOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const success = await updateOrderStatus(orderId, 'validated', `cashier_${Date.now()}`);
      if (success) {
        await loadOrders();
        setShowOrderModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const success = await updateOrderStatus(orderId, 'authorized', `admin_${Date.now()}`);
      if (success) {
        await loadOrders();
        setShowOrderModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'autorisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getActionButtons = (order: Order) => {
    const buttons = [];

    if (userRole === 'cashier' && canValidateOrder(order)) {
      buttons.push(
        <button
          key="validate"
          onClick={() => handleValidateOrder(order.id)}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Valider
        </button>
      );
    }

    if (userRole === 'admin' && canAuthorizeOrder(order)) {
      buttons.push(
        <button
          key="authorize"
          onClick={() => handleAuthorizeOrder(order.id)}
          disabled={loading}
          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          Autoriser
        </button>
      );
    }

    buttons.push(
      <button
        key="view"
        onClick={() => handleViewOrder(order)}
        className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
      >
        Voir
      </button>
    );

    return buttons;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête avec statistiques */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userRole === 'user' ? 'Mes Commandes' : 'Gestion des Commandes'}
              </h1>
              <p className="text-gray-600">
                {userRole === 'user' 
                  ? 'Suivez le statut de vos commandes'
                  : 'Gérez les commandes et validations'
                }
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </button>
          </div>

          {/* Statistiques */}
          {userRole !== 'user' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">En attente</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.pendingValidation}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Validées</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.validated}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Autorisées</p>
                    <p className="text-2xl font-bold text-green-900">{stats.authorized}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-gray-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">Montant total</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                  placeholder="Numéro commande, nom..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
              >
                <option value="all">Tous</option>
                <option value="pending_validation">En attente</option>
                <option value="validated">Validé</option>
                <option value="authorized">Autorisé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-cote-ivoire-primary text-white py-2 px-4 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center justify-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des commandes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  {userRole !== 'user' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                  )}
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
                    {userRole !== 'user' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{order.userName}</div>
                          <div className="text-gray-500">{order.userEmail}</div>
                        </div>
                      </td>
                    )}
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
                        {getActionButtons(order)}
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

        {/* Modal de détails de commande */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la commande
                </h2>
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
                {userRole === 'cashier' && canValidateOrder(selectedOrder) && (
                  <button
                    onClick={() => handleValidateOrder(selectedOrder.id)}
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Valider la commande
                  </button>
                )}
                
                {userRole === 'admin' && canAuthorizeOrder(selectedOrder) && (
                  <button
                    onClick={() => handleAuthorizeOrder(selectedOrder.id)}
                    disabled={loading}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Autoriser les crédits
                  </button>
                )}
                
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
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

export default OrderManagement;

