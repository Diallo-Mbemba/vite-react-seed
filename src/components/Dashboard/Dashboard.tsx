import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSimulation } from '../../contexts/SimulationContext';
import { hasValidCredits } from '../../utils/paymentUtils';
import { Calculator, TrendingUp, Calendar, CreditCard, Play, Trash2, Eye, X, Search, ArrowUpDown, ChevronUp, ChevronDown, Package, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CostResultModal from '../Simulator/CostResultModal';
import { getUserOrders, formatCurrency, getStatusColor, getStatusText } from '../../utils/orderUtils';
import { Order } from '../../types/order';
import CreditPoolsDisplay from './CreditPoolsDisplay';

const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { getSimulationsByUser, updateSimulation, simulations } = useSimulation();
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  type SortKey = 'dossier' | 'numeroFacture' | 'createdAt' | 'updatedAt' | 'totalCost' | 'caf' | 'droitDouane' | 'incoterm' | 'status';
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Nouvelles variables pour les commandes
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  // Charger les commandes de l'utilisateur
  useEffect(() => {
    const loadUserOrders = async () => {
      if (user) {
        try {
          const orders = await getUserOrders(user.id);
          setUserOrders(orders);
        } catch (error) {
          console.error('Erreur lors du chargement des commandes:', error);
          setUserOrders([]);
        }
      }
    };
    loadUserOrders();
  }, [user]);

  if (!user) return null;

  // Afficher toutes les simulations disponibles
  const userSimulations = getSimulationsByUser(user.id);
  // Si aucune simulation pour cet utilisateur, afficher toutes les simulations (pour les données de test)
  const allSimulations = userSimulations.length === 0 ? getSimulationsByUser('test-user') : userSimulations;
  
  // Log pour déboguer les statuts des simulations
  console.log('Simulations dans le Dashboard:', allSimulations.map(sim => ({
    id: sim.id,
    productName: sim.productName,
    status: sim.status,
    totalCost: sim.totalCost
  })));
  
  // Filtrer les simulations fantômes (coût total = 0 et nom vide ou "Simulation sans nom")
  const validSimulations = allSimulations.filter(sim => {
    const isPhantom = sim.totalCost === 0 && 
      (!sim.formData?.dossier || sim.formData.dossier.trim() === '' || sim.productName === 'Simulation sans nom');
    return !isPhantom;
  });
  
  const filteredSimulations = validSimulations.filter(sim => {
        const dossier = sim.formData?.dossier || sim.productName || '';
    const numeroFacture = sim.numeroFacture || sim.formData?.numeroFacture || '';
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q || 
      dossier.toLowerCase().includes(q) || 
      numeroFacture.toLowerCase().includes(q) ||
      sim.id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || sim.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    const direction = sortDir === 'asc' ? 1 : -1;
    const getDossier = (s: any) => (s.formData?.dossier || s.productName || '') as string;
    const getNumeroFacture = (s: any) => (s.numeroFacture || s.formData?.numeroFacture || '') as string;

    const getUpdatedAt = (s: any) => new Date(s.updatedAt || s.createdAt).getTime();
    const getCreatedAt = (s: any) => new Date(s.createdAt).getTime();
    const getIncoterm = (s: any) => ((s.formData?.incoterm || '') as string).toUpperCase();
    const num = (n: any) => (typeof n === 'number' ? n : Number(n) || 0);

    let left: string | number = 0;
    let right: string | number = 0;
    switch (sortBy) {
      case 'dossier':
        left = getDossier(a);
        right = getDossier(b);
        break;
      case 'numeroFacture':
        left = getNumeroFacture(a);
        right = getNumeroFacture(b);
        break;

      case 'createdAt':
        left = getCreatedAt(a);
        right = getCreatedAt(b);
        break;
      case 'updatedAt':
        left = getUpdatedAt(a);
        right = getUpdatedAt(b);
        break;
      case 'totalCost':
        left = num(a.totalCost);
        right = num(b.totalCost);
        break;
      case 'caf':
        left = num(a.fob + a.fret + (a.assurance || 0));
        right = num(b.fob + b.fret + (b.assurance || 0));
        break;
      case 'droitDouane':
        left = num(a.droitDouane);
        right = num(b.droitDouane);
        break;
      case 'incoterm':
        left = getIncoterm(a);
        right = getIncoterm(b);
        break;
      case 'status':
        left = a.status as string;
        right = b.status as string;
        break;
      default:
        left = 0; right = 0;
    }
    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right, 'fr') * direction;
    }
    return ((left as number) - (right as number)) * direction;
  });
  const statsByStatus = {
    total: validSimulations.length,
    inProgress: validSimulations.filter(s => s.status === 'in_progress').length,
    completed: validSimulations.filter(s => s.status === 'completed').length,
  };
  const totalSpent = validSimulations.reduce((sum, sim) => sum + sim.totalCost, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handler pour "reprendre" (à adapter selon le routeur utilisé)
  const handleResume = (simulationId: string) => {
    navigate(`/simulator/${simulationId}`);
  };

  // Handler pour supprimer une simulation (en cours)
  const handleDelete = (simulationId: string) => {
    // Suppression locale (à adapter pour la persistance réelle)
    updateSimulation(simulationId, { status: 'deleted' });
  };

  // Handler pour afficher le résultat d'une simulation achevée
  const handleViewResult = (simulation: any) => {
    // Construire l'objet résultat à partir de la simulation
    const result = {
      dossier: simulation.formData?.dossier || simulation.productName,
      numeroFacture: simulation.formData?.numeroFacture || '',
      dateFacture: simulation.formData?.dateFacture || '',
      dateTransaction: simulation.formData?.dateTransaction || '',
      montantFacture: simulation.formData?.montantFacture || simulation.fob,
      devise: simulation.formData?.devise || simulation.currency,
      tauxChange: simulation.formData?.tauxChange || 655.957,
      incoterm: simulation.formData?.incoterm || '',
      regimeDouanier: simulation.formData?.regimeDouanier || '',
      modePaiement: simulation.formData?.modePaiement || '',
      includeTransitaire: simulation.criteria?.includeTransitaire || true,
      includeTVA: simulation.criteria?.includeTVA || true,
      isDangerous: simulation.criteria?.isDangerous || false,
      transport: {
        mode: simulation.formData?.modeTransport || 'maritime',
        route: simulation.formData?.route || '',
        typeConteneur: simulation.formData?.typeConteneur || '',
        nombreConteneurs: simulation.formData?.nombreConteneurs || 1
      },
      selectedActors: simulation.selectedActors || {
        importateur: '',
        fournisseur: '',
        transitaire: ''
      },
      fob: simulation.fob,
      fret: simulation.fret,
      assurance: simulation.assurance,
      droitDouane: simulation.droitDouane,
      fraisFinanciers: simulation.fraisFinanciers,
      prestationTransitaire: simulation.prestationTransitaire,
      rpi: simulation.rpi,
      coc: simulation.coc,
      bsc: simulation.bsc,
      creditEnlevement: simulation.creditEnlevement,
      rrr: simulation.rrr,
      rcp: simulation.rcp,
      avanceFonds: simulation.avanceFonds || 0,
      tsDouane: simulation.tsDouane || 0,
      totalCost: simulation.totalCost,
      items: simulation.articles || [],
      autoCalculations: simulation.autoCalculations
    };
    setSelectedResult(result);
    setShowResultModal(true);
  };

  const stats = [
    {
      name: 'Simulations effectuées',
      value: userSimulations.length,
      icon: Calculator,
      color: 'bg-cote-ivoire-primary'
    },
    {
      name: 'Crédits restants',
      value: user.remainingCredits,
      icon: CreditCard,
      color: 'bg-cote-ivoire-success'
    },
    {
      name: 'Coût total calculé',
      value: formatCurrency(totalSpent),
      icon: TrendingUp,
      color: 'bg-cote-ivoire-secondary'
    },
    {
      name: 'Plan actuel',
      value: user.plan.charAt(0).toUpperCase() + user.plan.slice(1),
      icon: Calendar,
      color: 'bg-cote-ivoire-warning'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Bienvenue, {user.name} !
            </h1>
            <p className="text-gray-600">
              Voici un aperçu de votre activité sur Kprague
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshUser}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors"
              title="Actualiser les crédits"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/invoice-history')}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white border border-green-600 hover:bg-green-700 transition-colors"
            >
              Historique des factures
            </button>
            <button
              onClick={() => {
                if (!hasValidCredits(user)) {
                  alert('Vous n\'avez pas de crédits valides disponibles. Veuillez acheter un plan et attendre l\'autorisation par l\'administrateur pour démarrer une nouvelle simulation.');
                  return;
                }
                navigate('/simulator', { state: { fromDashboard: true } });
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-orange-600 transition-colors"
            >
              Nouvelle simulation
            </button>
          </div>
        </div>
      </div>

      {/* Affichage des pools de crédits FIFO */}
      <CreditPoolsDisplay />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section des commandes */}
      {userOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-cote-ivoire-primary" />
              <h2 className="text-xl font-bold text-gray-800">Mes Commandes</h2>
              <span className="bg-cote-ivoire-primary text-white text-xs px-2 py-1 rounded-full">
                {userOrders.length}
              </span>
            </div>
            <button
              onClick={() => setShowOrders(!showOrders)}
              className="text-cote-ivoire-primary hover:text-cote-ivoire-dark text-sm font-medium"
            >
              {showOrders ? 'Masquer' : 'Voir tout'}
            </button>
          </div>

          {showOrders ? (
            <div className="space-y-3">
              {userOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{order.planName}</span> - {order.planCredits} crédits
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(order.amount, order.currency)} • {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {order.status === 'pending_validation' && (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          En attente de validation
                        </div>
                      )}
                      {order.status === 'validated' && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Validé par la caisse
                        </div>
                      )}
                      {order.status === 'authorized' && (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Crédits débloqués
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{order.orderNumber}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{order.planName}</div>
                  <div className="text-sm text-gray-500">{formatCurrency(order.amount, order.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Historique des simulations
        </h2>
        
        {/* Légende des saisies manuelles */}
        <div className="mb-4 p-3 bg-cote-ivoire-lighter rounded-lg border border-cote-ivoire-light">
          <p className="text-sm text-gray-700 mb-2 font-medium">Légende des saisies manuelles :</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">FOB</span>
              <span className="text-gray-600">FOB saisi manuellement</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">Fret</span>
              <span className="text-gray-600">Fret saisi manuellement</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">Ass</span>
              <span className="text-gray-600">Assurance saisie manuellement</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">DD</span>
              <span className="text-gray-600">Droits de douane saisis manuellement</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">COC</span>
              <span className="text-gray-600">COC saisi manuellement</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">RPI</span>
              <span className="text-gray-600">RPI saisi manuellement</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <div className="bg-cote-ivoire-lighter rounded-lg p-3 border border-cote-ivoire-light">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-800">{statsByStatus.total}</p>
            </div>
            <div className="bg-cote-ivoire-lighter rounded-lg p-3 border border-cote-ivoire-light">
              <p className="text-xs text-gray-600">En cours</p>
              <p className="text-lg font-bold text-cote-ivoire-warning">{statsByStatus.inProgress}</p>
            </div>
            <div className="bg-cote-ivoire-lighter rounded-lg p-3 border border-cote-ivoire-light">
              <p className="text-xs text-gray-600">Achevées</p>
              <p className="text-lg font-bold text-cote-ivoire-success">{statsByStatus.completed}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative w-72">
              <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par dossier, facture, fournisseur ou ID"
                className="w-full pl-9 pr-3 py-2 bg-white border border-cote-ivoire-medium rounded-md text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Achevées</option>
            </select>
          </div>
        </div>
        
        {filteredSimulations.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600">Aucune simulation ne correspond à votre recherche</p>
            <p className="text-gray-500 text-sm mt-2">
              Utilisez notre calculateur pour commencer vos simulations
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-cote-ivoire-light">
                  {[
                    { key: 'dossier', label: 'Dossier', width: 'w-48' },
                    { key: 'numeroFacture', label: 'N° Facture', width: 'w-32' },
                    { key: 'createdAt', label: 'Créée le', width: 'w-28' },
                    { key: 'updatedAt', label: 'Modifiée le', width: 'w-28' },
                    { key: 'totalCost', label: 'Coût total', width: 'w-32' },
                    { key: 'autoCalculations', label: 'Saisies manuelles', width: 'w-32' },
                    { key: 'caf', label: 'CAF', width: 'w-28' },
                    { key: 'droitDouane', label: 'Droit de douane', width: 'w-32' },
                    { key: 'incoterm', label: 'Incoterm', width: 'w-24' },
                    { key: 'status', label: 'Statut', width: 'w-32' },
                                      ].map(col => (
                      <th key={col.key} className={`text-left py-3 px-4 font-medium text-gray-700 ${col.width}`}>
                        <button onClick={() => handleSort(col.key as SortKey)} className="inline-flex items-center space-x-1 hover:text-cote-ivoire-primary">
                          <span>{col.label}</span>
                          {sortBy === col.key ? (
                            sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {sortedSimulations.map((simulation) => (
                  <tr key={simulation.id} className="border-b border-cote-ivoire-light hover:bg-cote-ivoire-lighter">
                    <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap w-48">
                      <div className="truncate" title={simulation.formData?.dossier || simulation.productName}>
                        {simulation.formData?.dossier || simulation.productName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm w-32">
                      <div className="truncate" title={simulation.numeroFacture || simulation.formData?.numeroFacture || '—'}>
                        {simulation.numeroFacture || simulation.formData?.numeroFacture || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-28">
                      {new Date(simulation.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-28">
                      {new Date(simulation.updatedAt || simulation.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-medium text-cote-ivoire-success w-32">
                      {formatCurrency(simulation.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">
                      <div className="flex flex-wrap gap-1">
                        {!simulation.autoCalculations?.fobConversion && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="FOB saisi manuellement">
                            FOB
                          </span>
                        )}
                        {!simulation.autoCalculations?.fret && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="Fret saisi manuellement">
                            Fret
                          </span>
                        )}
                        {!simulation.autoCalculations?.assurance && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="Assurance saisie manuellement">
                            Ass
                          </span>
                        )}
                        {!simulation.autoCalculations?.droitDouane && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="Droits de douane saisis manuellement">
                            DD
                          </span>
                        )}
                        {!simulation.autoCalculations?.coc && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="COC saisi manuellement">
                            COC
                          </span>
                        )}
                        {!simulation.autoCalculations?.rpi && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="RPI saisi manuellement">
                            RPI
                          </span>
                        )}
                        {!simulation.autoCalculations?.bsc && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="BSC saisi manuellement">
                            BSC
                          </span>
                        )}
                        {!simulation.autoCalculations?.fraisFinanciers && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="Frais financiers saisis manuellement">
                            FF
                          </span>
                        )}
                        {!simulation.autoCalculations?.transitaire && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="Prestation transitaire saisie manuellement">
                            PT
                          </span>
                        )}
                        {!simulation.autoCalculations?.rrr && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="RRR saisi manuellement">
                            RRR
                          </span>
                        )}
                        {!simulation.autoCalculations?.rcp && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300" title="RCP saisi manuellement">
                            RCP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 w-28">
                      <div className="text-gray-600">
                        <span 
                          title={`Détail CAF:
FOB: ${formatCurrency(simulation.fob)}
Fret: ${formatCurrency(simulation.fret)}
Assurance: ${formatCurrency(simulation.assurance || 0)}
Total CAF: ${formatCurrency(simulation.fob + simulation.fret + (simulation.assurance || 0))}`}
                        >
                          {formatCurrency(simulation.fob + simulation.fret + (simulation.assurance || 0))}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 w-32">
                      <div className={`flex items-center space-x-1 ${simulation.autoCalculations?.droitDouane ? 'text-cote-ivoire-error' : 'text-gray-600'}`}>
                        {simulation.autoCalculations?.droitDouane && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-cote-ivoire-error/20 text-cote-ivoire-error text-xs" title="Calculé automatiquement">
                            A
                          </span>
                        )}
                        <span>{formatCurrency(simulation.droitDouane || 0)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-24">
                      {(simulation.formData?.incoterm || '').toUpperCase() || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {simulation.status === 'completed' ? (
                        <div className="flex space-x-2">
                          <span className="text-cote-ivoire-success font-bold">Achevée</span>
                          <button
                            onClick={() => handleViewResult(simulation)}
                            className="flex items-center px-2 py-1 bg-cote-ivoire-primary text-white rounded text-xs hover:bg-cote-ivoire-primary/90"
                          >
                            <Eye className="h-3 w-3 mr-1" /> Voir
                          </button>
                        </div>
                      ) : (
                        <span className="text-cote-ivoire-warning font-bold">En cours</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {simulation.status === 'in_progress' && (
                        <div className="flex space-x-2">
                          <button
                            className="flex items-center px-3 py-1 bg-cote-ivoire-primary text-white rounded text-xs hover:bg-cote-ivoire-primary/90"
                            onClick={() => handleResume(simulation.id)}
                          >
                            <Play className="h-4 w-4 mr-1" /> Reprendre
                          </button>
                          <button
                            className="flex items-center px-3 py-1 bg-cote-ivoire-error text-white rounded text-xs hover:bg-cote-ivoire-error/90"
                            onClick={() => handleDelete(simulation.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de résultat */}
      {showResultModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-cote-ivoire-xl border border-cote-ivoire-light">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Résultat de la simulation</h2>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <CostResultModal
                result={selectedResult}
                autoCalculations={selectedResult.autoCalculations}
                onClose={() => setShowResultModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
