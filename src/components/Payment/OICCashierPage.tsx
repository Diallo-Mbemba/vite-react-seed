import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  User, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Printer,
  Search,
  Clock,
  Users,
  Package,
  Eye,
  XCircle,
  FileText,
  Calendar,
  Download
} from 'lucide-react';
import { 
  createPaymentRecord, 
  generateInscriptionNumber, 
  getActiveCashierSession, 
  createCashierSession,
  closeCashierSession,
  getAllPayments,
  // updateUserCreditsAfterPayment n'est plus nécessaire - les crédits sont gérés via orderUtils.updateOrderStatus()
} from '../../utils/paymentUtils';
import { 
  generateDailySalesReport, 
  generatePeriodSalesReport, 
  printSalesReport, 
  downloadSalesReport 
} from '../../utils/salesReportUtils';
import { generateOICInvoice } from '../../utils/oicInvoiceGenerator';
import { PaymentRecord, CashierSession } from '../../types/payment';
import { 
  getOrderByNumber, 
  updateOrderStatus, 
  formatCurrency as formatCurrencyUtil,
  getStatusText,
  getStatusColor
} from '../../utils/orderUtils';
import { Order } from '../../types/order';
import { useAuth } from '../../contexts/AuthContext';

const OICCashierPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [cashierName, setCashierName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Paiement pack simulation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [sessionStats, setSessionStats] = useState({ totalAmount: 0, totalTransactions: 0 });
  
  // Nouvelles variables pour la gestion des commandes
  const [orderNumber, setOrderNumber] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isValidatingOrder, setIsValidatingOrder] = useState(false);
  
  // Variables pour les rapports de ventes
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportType, setReportType] = useState<'day' | 'period'>('day');

  useEffect(() => {
    // Vérifier s'il y a une session active
    const session = getActiveCashierSession();
    setActiveSession(session);
    
    if (session) {
      updateSessionStats();
    }
  }, []);

  const updateSessionStats = () => {
    const payments = getAllPayments();
    const sessionPayments = payments.filter(p => 
      p.cashierId === activeSession?.cashierId && 
      p.createdAt >= new Date(activeSession?.startTime || 0)
    );
    
    setSessionStats({
      totalAmount: sessionPayments.reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: sessionPayments.length
    });
  };

  const startSession = () => {
    if (!cashierName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    
    const session = createCashierSession(
      `cashier_${Date.now()}`,
      cashierName.trim()
    );
    setActiveSession(session);
  };

  const endSession = () => {
    if (confirm('Êtes-vous sûr de vouloir fermer la session ?')) {
      closeCashierSession();
      setActiveSession(null);
      setCashierName('');
      setSessionStats({ totalAmount: 0, totalTransactions: 0 });
    }
  };

  // Rechercher une commande par numéro
  const searchOrder = async () => {
    try {
      if (!orderNumber.trim()) {
        alert('Veuillez entrer un numéro de commande');
        return;
      }

      const order = await getOrderByNumber(orderNumber.trim());
      if (!order) {
        alert('Commande non trouvée');
        return;
      }

      if (order.status !== 'pending_validation') {
        alert(`Cette commande a déjà été ${getStatusText(order.status).toLowerCase()}`);
        return;
      }

      setFoundOrder(order);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Erreur lors de la recherche de commande:', error);
      alert('Erreur lors de la recherche de la commande');
    }
  };

  // Valider une commande
  const validateOrder = async () => {
    if (!foundOrder || !activeSession) {
      return;
    }

    // Vérifier que l'utilisateur est connecté (nécessaire pour RLS)
    if (!user) {
      alert('❌ Vous devez être connecté pour valider une commande.\n\n' +
        'Les politiques RLS (Row Level Security) nécessitent que vous soyez authentifié.\n' +
        'Veuillez vous connecter avec votre compte caissier.');
      return;
    }

    setIsValidatingOrder(true);
    
    try {
      // Utiliser l'ID de l'utilisateur connecté (requis pour RLS)
      // Note: Pour que cela fonctionne avec RLS, l'utilisateur doit être authentifié et avoir le rôle 'cashier' dans admin_users
      const validatorId = user.id;
      const validatorName = activeSession.cashierName;

      console.log('🔄 Validation de la commande...', {
        orderId: foundOrder.id,
        orderNumber: foundOrder.orderNumber,
        validatorId,
        validatorName,
        userAuthenticated: !!user
      });

      await updateOrderStatus(
        foundOrder.id, 
        'validated', 
        validatorId,
        `Validé par ${validatorName}`
      );

      // Si on arrive ici, la validation a réussi
      // Créer un reçu de paiement
        const payment = createPaymentRecord({
          userId: foundOrder.userId,
          inscriptionNumber: foundOrder.orderNumber,
          amount: foundOrder.amount,
          currency: foundOrder.currency,
          paymentMethod: 'caisse_oic',
          status: 'paid',
          cashierId: activeSession.cashierId,
          paidAt: new Date(),
          description: `Paiement commande ${foundOrder.orderNumber} - ${foundOrder.planName}`
        });

        // NE PAS mettre à jour les crédits ici - ils seront mis à jour lors de l'autorisation par l'admin
        console.log(`✅ Commande validée par la caisse. Les crédits seront ajoutés après autorisation par l'administrateur.`);

        // Sauvegarder les informations client pour la facture
        setCustomerName(foundOrder.userName);
        setCustomerEmail(foundOrder.userEmail);
        
        setLastReceipt(payment);
        setShowReceipt(true);
        
        // Réinitialiser
        setOrderNumber('');
        setFoundOrder(null);
        setShowOrderDetails(false);
        updateSessionStats();
        
        alert('Commande validée avec succès ! La commande est maintenant en attente d\'autorisation par l\'administrateur pour l\'ajout des crédits.');
    } catch (error: any) {
      console.error('❌ Erreur lors de la validation:', error);
      
      // Messages d'erreur plus détaillés
      let errorMessage = 'Erreur lors de la validation de la commande.';
      let showDetailedHelp = false;
      
      if (error?.message) {
        if (error.message.includes('permission denied') || error.message.includes('RLS') || error.message.includes('Permission refusée')) {
          errorMessage = '❌ Erreur de permissions RLS.\n\n' +
            'Pour résoudre ce problème :\n' +
            '1. Assurez-vous que vous êtes connecté avec votre compte\n' +
            '2. Vérifiez que votre compte existe dans la table admin_users avec le rôle "cashier"\n' +
            '3. Exécutez le script FIX_RLS_CAISSIER.sql dans Supabase SQL Editor\n\n' +
            'Détails: ' + error.message;
          showDetailedHelp = true;
        } else if (error.message.includes('Commande non trouvée')) {
          errorMessage = '❌ ' + error.message + '\n\n' +
            'Causes possibles :\n' +
            '1. La commande a été supprimée\n' +
            '2. Problème de permissions RLS (vous ne pouvez pas voir/mettre à jour cette commande)\n' +
            '3. L\'ID de la commande est incorrect\n\n' +
            'Vérifiez les politiques RLS dans Supabase.';
          showDetailedHelp = true;
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Erreur: L\'ID du validateur n\'existe pas dans la base de données.';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      alert(errorMessage);
      
      // Afficher des informations de débogage dans la console
      if (showDetailedHelp) {
        console.log('🔍 Informations de débogage:', {
          userId: user?.id,
          validatorId,
          validatorName,
          orderId: foundOrder?.id,
          orderNumber: foundOrder?.orderNumber,
          userAuthenticated: !!user
        });
      }
    } finally {
      setIsValidatingOrder(false);
    }
  };

  const processPayment = async () => {
    if (!activeSession) {
      alert('Aucune session active');
      return;
    }
    
    if (!customerName.trim() || !customerEmail.trim() || !amount.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Montant invalide');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Générer un numéro d'inscription pour le client
      const inscriptionNumber = generateInscriptionNumber();
      
      // Créer l'enregistrement de paiement
      const payment = createPaymentRecord({
        userId: `user_${Date.now()}`,
        inscriptionNumber,
        amount: paymentAmount,
        currency: 'XOF',
        paymentMethod: 'caisse_oic',
        status: 'paid',
        cashierId: activeSession.cashierId,
        paidAt: new Date(),
        description: description.trim()
      });
      
      setLastReceipt(payment);
      setShowReceipt(true);
      
      // Réinitialiser le formulaire
      setCustomerName('');
      setCustomerEmail('');
      setAmount('');
      
      // Mettre à jour les statistiques
      updateSessionStats();
      
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      alert('Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    if (lastReceipt && activeSession) {
      // Générer la facture A4 au format PDF
      generateOICInvoice({
        payment: lastReceipt,
        cashierSession: activeSession,
        customerName: customerName || foundOrder?.userName,
        customerEmail: customerEmail || foundOrder?.userEmail
      }).catch(error => {
        console.error('Erreur lors de la génération de la facture:', error);
        alert('Erreur lors de la génération de la facture');
      });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <CreditCard className="h-12 w-12 text-cote-ivoire-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Caisse OIC</h1>
            <p className="text-gray-600">Démarrez votre session de caisse</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du caissier
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                placeholder="Entrez votre nom"
              />
            </div>
            
            <button
              onClick={startSession}
              className="w-full bg-cote-ivoire-primary text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
            >
              Démarrer la session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête de session */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Caisse OIC</h1>
              <p className="text-gray-600">Session: {activeSession.cashierName}</p>
              <p className="text-sm text-gray-500">
                Début: {new Date(activeSession.startTime).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cote-ivoire-primary">
                {formatCurrency(sessionStats.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">
                {sessionStats.totalTransactions} transactions
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Rapports
              </button>
              <button
                onClick={endSession}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Fermer session
              </button>
            </div>
          </div>
        </div>

        {/* Recherche de commande */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Validation des commandes
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de commande
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                  placeholder="Entrez le numéro de commande (ex: CMD-123456-ABCD)"
                  onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
                />
                <button
                  onClick={searchOrder}
                  className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire de paiement */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-cote-ivoire-primary" />
              Paiement direct (sans commande)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du client *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                  placeholder="Nom complet du client"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du client *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (XOF) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                />
              </div>
              
              <button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full bg-cote-ivoire-primary text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Encaisser le paiement
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Statistiques de session */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-cote-ivoire-primary" />
              Statistiques de session
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Montant total encaissé</span>
                <span className="text-xl font-bold text-cote-ivoire-primary">
                  {formatCurrency(sessionStats.totalAmount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Nombre de transactions</span>
                <span className="text-xl font-bold text-gray-900">
                  {sessionStats.totalTransactions}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Durée de session</span>
                <span className="text-lg font-medium text-gray-900">
                  {Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / (1000 * 60))} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de détails de commande */}
        {showOrderDetails && foundOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Détails de la commande</h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Numéro de commande</label>
                    <p className="text-lg font-bold text-cote-ivoire-primary">{foundOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(foundOrder.status)}`}>
                      {getStatusText(foundOrder.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Utilisateur</label>
                    <p className="font-medium">{foundOrder.userName}</p>
                    <p className="text-sm text-gray-500">{foundOrder.userEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Plan</label>
                    <p className="font-medium">{foundOrder.planName}</p>
                    <p className="text-sm text-gray-500">{foundOrder.planCredits} crédits</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Montant</label>
                    <p className="text-lg font-bold">{formatCurrencyUtil(foundOrder.amount, foundOrder.currency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date de création</label>
                    <p className="font-medium">{new Date(foundOrder.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={validateOrder}
                  disabled={isValidatingOrder}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {isValidatingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider et encaisser
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de facture A4 */}
        {showReceipt && lastReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900">Paiement enregistré</h2>
                  <p className="text-gray-600">Facture A4 générée avec succès</p>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {/* Prévisualisation de la facture */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-6" style={{ minHeight: '400px' }}>
                {/* En-tête OIC */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-1">OFFICE IVOIRIEN DES CHARGEURS</h3>
                      <p className="text-sm opacity-90">OIC - Système de Gestion des Paiements</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>Abidjan, Côte d'Ivoire</p>
                      <p>Tél: +225 XX XX XX XX XX</p>
                      <p>Email: contact@oic.ci</p>
                    </div>
                  </div>
                </div>
                
                {/* Titre Facture */}
                <div className="text-center mb-6">
                  <h4 className="text-3xl font-bold text-blue-600 mb-2">FACTURE</h4>
                  <div className="h-1 bg-blue-600 w-32 mx-auto"></div>
                </div>
                
                {/* Informations Client */}
                <div className="mb-4">
                  <h5 className="font-bold text-gray-700 mb-2">INFORMATIONS CLIENT</h5>
                  <div className="bg-white border border-gray-200 rounded p-4">
                    {customerName && <p className="mb-1"><span className="font-semibold">Nom:</span> {customerName}</p>}
                    {customerEmail && <p className="mb-1"><span className="font-semibold">Email:</span> {customerEmail}</p>}
                    <p className="mb-0"><span className="font-semibold text-blue-600">Numéro d'inscription:</span> <span className="text-blue-600 font-bold">{lastReceipt.inscriptionNumber}</span></p>
                  </div>
                </div>
                
                {/* Informations Caissier */}
                {activeSession && (
                  <div className="mb-4">
                    <h5 className="font-bold text-gray-700 mb-2">INFORMATIONS CAISSIER</h5>
                    <div className="bg-white border border-gray-200 rounded p-4">
                      <p className="mb-1"><span className="font-semibold">Caissier/Caissière:</span> {activeSession.cashierName}</p>
                      <p className="mb-0"><span className="font-semibold">ID Session:</span> {activeSession.cashierId}</p>
                    </div>
                  </div>
                )}
                
                {/* Détails du paiement */}
                <div className="mb-4">
                  <h5 className="font-bold text-gray-700 mb-2">DÉTAILS DU PAIEMENT</h5>
                  <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-blue-600 text-white">
                        <tr>
                          <th className="text-left p-3">Description</th>
                          <th className="text-right p-3">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-3">{lastReceipt.description || 'Paiement pack simulation'}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(lastReceipt.amount)}</td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="p-3 font-bold">TOTAL</td>
                          <td className="p-3 text-right font-bold text-blue-600 text-lg">{formatCurrency(lastReceipt.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-semibold">Numéro de reçu:</span> {lastReceipt.receiptNumber}</p>
                  <p><span className="font-semibold">Date de paiement:</span> {new Date(lastReceipt.paidAt!).toLocaleString('fr-FR')}</p>
                  <p><span className="font-semibold">Méthode de paiement:</span> Caisse OIC</p>
                  <p><span className="font-semibold">Statut:</span> Payé</p>
                </div>
                
                {/* Pied de page */}
                <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
                  <p className="font-bold text-gray-700 mb-1">OFFICE IVOIRIEN DES CHARGEURS</p>
                  <p>OIC - Système de Gestion des Paiements</p>
                  <p>Abidjan, Côte d'Ivoire | Tél: +225 XX XX XX XX XX | Email: contact@oic.ci</p>
                  <p className="mt-2">Facture générée le {new Date().toLocaleString('fr-FR')}</p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={printReceipt}
                  className="flex-1 bg-cote-ivoire-primary text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center font-semibold"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Télécharger Facture A4 (PDF)
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-semibold"
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

export default OICCashierPage;

