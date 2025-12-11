import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSimulation } from '../../contexts/SimulationContext';
import { 
  Calendar, 
  Trash2, 
  Eye, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  FileText,
  Download,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CostResultModal from './CostResultModal';
import { generatePDFReport, generateGroupedByCodeSHPDF, generateSyntheseMinutePDF } from '../../utils/pdfGenerator';
import { downloadReport } from '../../utils/reportGenerator';

// Interface pour les factures groupées (utilisée pour le typage interne)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type GroupedInvoicesType = {
  date: string;
  invoices: any[];
  totalAmount: number;
  count: number;
};

const InvoiceHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { getSimulationsByUser, deleteSimulation } = useSimulation();
  const navigate = useNavigate();
  
  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  if (!user) return null;

  // Récupérer les simulations de l'utilisateur
  const userSimulations = getSimulationsByUser(user.id);
  const allSimulations = userSimulations.length === 0 ? getSimulationsByUser('test-user') : userSimulations;

  // Filtrer les simulations valides
  const validSimulations = allSimulations.filter(sim => {
    const isPhantom = sim.totalCost === 0 && 
      (!sim.formData?.dossier || sim.formData.dossier.trim() === '' || sim.productName === 'Simulation sans nom');
    return !isPhantom && sim.status !== 'deleted';
  });

  // Fonction de formatage des devises
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fonction de formatage des dates
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction de formatage des dates courtes
  const formatShortDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Fonction pour obtenir le nom du jour
  const getDayName = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  };

  // Filtrer les simulations selon les critères
  const filteredSimulations = useMemo(() => {
    return validSimulations.filter(sim => {
      const dossier = sim.formData?.dossier || sim.productName || '';
      const numeroFacture = sim.numeroFacture || sim.formData?.numeroFacture || '';
      const q = searchQuery.trim().toLowerCase();
      
      const matchesQuery = !q || 
        dossier.toLowerCase().includes(q) || 
        numeroFacture.toLowerCase().includes(q) ||
        sim.id.toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === 'all' || sim.status === statusFilter;
      
      // Filtre par date
      const simDate = new Date(sim.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

      let matchesDate = true;
      switch (dateFilter) {
        case 'today':
          matchesDate = simDate >= today;
          break;
        case 'week':
          matchesDate = simDate >= weekAgo;
          break;
        case 'month':
          matchesDate = simDate >= monthAgo;
          break;
        case 'year':
          matchesDate = simDate >= yearAgo;
          break;
        default:
          matchesDate = true;
      }

      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [validSimulations, searchQuery, statusFilter, dateFilter]);

  // Grouper les factures par date
  const groupedInvoices = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    filteredSimulations.forEach(sim => {
      const date = new Date(sim.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(sim);
    });

    // Convertir en tableau et calculer les totaux
    return Object.entries(groups)
      .map(([date, invoices]) => {
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
        return {
          date,
          invoices: invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          totalAmount,
          count: invoices.length
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredSimulations]);

  // Handlers
  const handleViewInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetailsModal(true);
  };

  const handleViewResult = (simulation: any) => {
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
      assurance: simulation.assurance || 0,
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

  const handleExportPDF = async (simulation: any) => {
    try {
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
        transport: {
          mode: simulation.formData?.modeTransport || 'maritime',
          route: simulation.formData?.route || '',
          typeConteneur: simulation.formData?.typeConteneur || '',
          nombreConteneurs: simulation.formData?.nombreConteneurs || 1
        },
        fob: simulation.fob,
        fret: simulation.fret,
        assurance: simulation.assurance || 0,
        droitDouane: simulation.droitDouane,
        fraisFinanciers: simulation.fraisFinanciers,
        prestationTransitaire: simulation.prestationTransitaire,
        rpi: simulation.rpi,
        coc: simulation.coc,
        bsc: simulation.bsc,
        creditEnlevement: simulation.creditEnlevement,
        rrr: simulation.rrr,
        rcp: simulation.rcp,
        totalCost: simulation.totalCost,
        items: simulation.articles || [],
        autoCalculations: simulation.autoCalculations
      };
      await generatePDFReport(result, null);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleExportGroupedPDF = async (simulation: any) => {
    try {
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
        fob: simulation.fob,
        fret: simulation.fret,
        assurance: simulation.assurance || 0,
        droitDouane: simulation.droitDouane,
        fraisFinanciers: simulation.fraisFinanciers,
        prestationTransitaire: simulation.prestationTransitaire,
        rpi: simulation.rpi,
        coc: simulation.coc,
        bsc: simulation.bsc,
        creditEnlevement: simulation.creditEnlevement,
        rrr: simulation.rrr,
        rcp: simulation.rcp,
        tsDouane: simulation.tsDouane || 0,
        avanceFonds: simulation.avanceFonds || 0,
        totalCost: simulation.totalCost,
        items: simulation.articles || [],
        includeTVA: simulation.criteria?.includeTVA || true,
        isDangerous: simulation.criteria?.isDangerous || false,
        selectedActors: simulation.selectedActors || {},
        actors: simulation.actors || []
      } as any;
      await generateGroupedByCodeSHPDF(result);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF groupé:', error);
      alert('Erreur lors de la génération du PDF groupé. Veuillez réessayer.');
    }
  };

  const handleExportSyntheseMinutePDF = async (simulation: any) => {
    try {
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
        fob: simulation.fob,
        fret: simulation.fret,
        assurance: simulation.assurance || 0,
        droitDouane: simulation.droitDouane,
        fraisFinanciers: simulation.fraisFinanciers,
        prestationTransitaire: simulation.prestationTransitaire,
        rpi: simulation.rpi,
        coc: simulation.coc,
        bsc: simulation.bsc,
        creditEnlevement: simulation.creditEnlevement,
        rrr: simulation.rrr,
        rcp: simulation.rcp,
        tsDouane: simulation.tsDouane || 0,
        avanceFonds: simulation.avanceFonds || 0,
        totalCost: simulation.totalCost,
        items: simulation.articles || [],
        includeTVA: simulation.criteria?.includeTVA || true,
        isDangerous: simulation.criteria?.isDangerous || false,
        selectedActors: simulation.selectedActors || {},
        actors: simulation.actors || []
      } as any;
      await generateSyntheseMinutePDF(result);
    } catch (error) {
      console.error('Erreur lors de la génération de la synthèse minute:', error);
      alert('Erreur lors de la génération de la synthèse minute. Veuillez réessayer.');
    }
  };

  const handleDownloadReport = (simulation: any) => {
    try {
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
        transport: {
          mode: simulation.formData?.modeTransport || 'maritime',
          route: simulation.formData?.route || '',
          typeConteneur: simulation.formData?.typeConteneur || '',
          nombreConteneurs: simulation.formData?.nombreConteneurs || 1
        },
        fob: simulation.fob,
        fret: simulation.fret,
        assurance: simulation.assurance || 0,
        droitDouane: simulation.droitDouane,
        fraisFinanciers: simulation.fraisFinanciers,
        prestationTransitaire: simulation.prestationTransitaire,
        rpi: simulation.rpi,
        coc: simulation.coc,
        bsc: simulation.bsc,
        creditEnlevement: simulation.creditEnlevement,
        rrr: simulation.rrr,
        rcp: simulation.rcp,
        tsDouane: simulation.tsDouane || 0,
        avanceFonds: simulation.avanceFonds || 0,
        totalCost: simulation.totalCost,
        items: simulation.articles || [],
        includeTVA: simulation.criteria?.includeTVA || true,
        isDangerous: simulation.criteria?.isDangerous || false,
        selectedActors: simulation.selectedActors || {},
        actors: simulation.actors || []
      };
      downloadReport(result);
    } catch (error) {
      console.error('Erreur lors du téléchargement du rapport:', error);
      alert('Erreur lors du téléchargement du rapport. Veuillez réessayer.');
    }
  };

  const handleDelete = (simulationId: string) => {
    setShowDeleteConfirm(simulationId);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteSimulation(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const toggleGroup = (date: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Historique des Factures</h1>
                <p className="text-gray-600 mt-1">
                  {filteredSimulations.length} facture(s) trouvée(s)
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Retour au Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher par dossier, numéro de facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cote-ivoire-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cote-ivoire-primary focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Terminées</option>
                <option value="in_progress">En cours</option>
              </select>
            </div>

            {/* Filtre par date */}
            <div className="sm:w-48">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cote-ivoire-primary focus:border-transparent"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {groupedInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune facture trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucune facture ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedInvoices.map((group) => (
              <div key={group.date} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* En-tête du groupe */}
                <div 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(group.date)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-cote-ivoire-primary" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(group.date)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getDayName(group.date)} • {group.count} facture(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(group.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-600">Total du jour</p>
                      </div>
                      {expandedGroups.has(group.date) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails du groupe */}
                {expandedGroups.has(group.date) && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dossier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              N° Facture
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Montant
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {invoice.formData?.dossier || invoice.productName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatShortDate(invoice.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {invoice.formData?.numeroFacture || '—'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(invoice.status)}
                                  <span className="text-sm text-gray-900">
                                    {getStatusText(invoice.status)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(invoice.totalCost)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => handleViewInvoiceDetails(invoice)}
                                    className="text-cote-ivoire-primary hover:text-cote-ivoire-primary/80 transition-colors"
                                    title="Voir les détails"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {invoice.status === 'completed' && (
                                    <>
                                      <button
                                        onClick={() => handleViewResult(invoice)}
                                        className="text-green-600 hover:text-green-800 transition-colors"
                                        title="Voir le résultat"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDownloadReport(invoice)}
                                        className="text-green-600 hover:text-green-800 transition-colors mr-2"
                                        title="Télécharger rapport complet"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleExportPDF(invoice)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                        title="Exporter en PDF"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleExportGroupedPDF(invoice)}
                                        className="text-cote-ivoire-primary hover:text-orange-700 transition-colors"
                                        title="PDF regroupé par Code SH"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleExportSyntheseMinutePDF(invoice)}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                                        title="Synthèse Minute - Totaux des droits et taxes"
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        <span>Minute transitaire</span>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDelete(invoice.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails de la facture */}
      {showInvoiceDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-cote-ivoire-primary rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Détails de la facture</h3>
                    <p className="text-gray-600 text-sm">
                      {selectedInvoice.formData?.numeroFacture || 'Sans numéro'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceDetailsModal(false)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Dossier:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.dossier || selectedInvoice.productName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Numéro facture:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.numeroFacture || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date facture:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.dateFacture || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date transaction:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.dateTransaction || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Devise:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.devise || selectedInvoice.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Taux de change:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.tauxChange || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Incoterm:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.incoterm || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Régime douanier:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.regimeDouanier || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Mode de paiement:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.modePaiement || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Transport</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Mode:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.modeTransport || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Route:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.route || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Type conteneur:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.typeConteneur || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Nombre conteneurs:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedInvoice.formData?.nombreConteneurs || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles */}
              {selectedInvoice.articles && selectedInvoice.articles.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Articles ({selectedInvoice.articles.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-3 text-gray-700 font-semibold">Code SH</th>
                          <th className="text-left py-2 px-3 text-gray-700 font-semibold">Désignation</th>
                          <th className="text-center py-2 px-3 text-gray-700 font-semibold">Quantité</th>
                          <th className="text-right py-2 px-3 text-gray-700 font-semibold">Prix unitaire</th>
                          <th className="text-right py-2 px-3 text-gray-700 font-semibold">Prix total</th>
                          <th className="text-center py-2 px-3 text-gray-700 font-semibold">Poids</th>
                          <th className="text-center py-2 px-3 text-gray-700 font-semibold">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.articles.map((article: any, index: number) => {
                          // Vérifier si le code SH a été corrigé
                          const isCorrected = selectedInvoice.correctionHistory?.some((correction: any) => 
                            correction.originalCode === article.codeHS
                          );
                          
                          return (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="py-2 px-3">
                                <div className="font-mono">
                                  {isCorrected ? (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-orange-600 line-through">{article.codeHS}</span>
                                      <span className="text-green-600">→</span>
                                      <span className="text-green-600">
                                        {selectedInvoice.correctionHistory.find((c: any) => c.originalCode === article.codeHS)?.newCode}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-900">{article.codeHS}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-gray-900">{article.designation}</td>
                              <td className="py-2 px-3 text-center text-gray-900">{article.quantite}</td>
                              <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(article.prixUnitaire)}</td>
                              <td className="py-2 px-3 text-right text-gray-900 font-medium">{formatCurrency(article.prixTotal)}</td>
                              <td className="py-2 px-3 text-center text-gray-900">{article.poids} kg</td>
                              <td className="py-2 px-3 text-center">
                                {isCorrected ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Corrigé
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Manquant
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                                </div>
              )}

              {/* Historique des corrections de codes SH */}
              {selectedInvoice.correctionHistory && selectedInvoice.correctionHistory.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
                  <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Corrections de codes SH ({selectedInvoice.correctionHistory.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedInvoice.correctionHistory.map((correction: any, index: number) => (
                      <div key={index} className="bg-white/70 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono text-orange-600 line-through">{correction.originalCode}</span>
                          <span className="text-green-600">→</span>
                          <span className="font-mono text-green-600">{correction.newCode}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {correction.designation}
                        </div>
                        {correction.tariffs && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="bg-orange-100 p-2 rounded border border-orange-300">
                              <div className="text-orange-700 font-medium">DD</div>
                              <div className="text-gray-900">{correction.tariffs.dd?.toFixed(2)}%</div>
                            </div>
                            <div className="bg-orange-100 p-2 rounded border border-orange-300">
                              <div className="text-orange-700 font-medium">RSTA</div>
                              <div className="text-gray-900">{correction.tariffs.rsta?.toFixed(2)}%</div>
                            </div>
                            <div className="bg-orange-100 p-2 rounded border border-orange-300">
                              <div className="text-orange-700 font-medium">TVA</div>
                              <div className="text-gray-900">{correction.tariffs.tva?.toFixed(2)}%</div>
                            </div>
                            <div className="bg-green-100 p-2 rounded border border-green-300">
                              <div className="text-green-700 font-medium">Total</div>
                              <div className="text-gray-900">{correction.tariffs.cumulAvecTVA?.toFixed(2)}%</div>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Corrigé le {new Date(correction.date).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coûts */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Détail des coûts</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">FOB:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.fob)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Fret:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.fret)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Assurance:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.assurance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Droits de douane:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.droitDouane)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Frais financiers:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.fraisFinanciers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Prestation transitaire:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.prestationTransitaire)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">RPI:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.rpi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">COC:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.coc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">BSC:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.bsc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Crédit d'enlèvement:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.creditEnlevement)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">RRR:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.rrr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">RCP:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.rcp)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Coût total:</span>
                    <span className="text-lg font-bold text-cote-ivoire-primary">{formatCurrency(selectedInvoice.totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInvoiceDetailsModal(false)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition-colors"
                >
                  <span>Fermer</span>
                </button>
                {selectedInvoice.status === 'completed' && (
                  <button
                    onClick={() => {
                      setShowInvoiceDetailsModal(false);
                      handleViewResult(selectedInvoice);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-orange-600 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Voir le résultat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer cette facture ? Cette action ne peut pas être annulée.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de résultat */}
      {showResultModal && selectedResult && (
        <CostResultModal
          result={selectedResult}
          onClose={() => {
            setShowResultModal(false);
            setSelectedResult(null);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceHistoryPage; 
