import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/supabase/adminService';
import { AdminUser } from '../../types/order';
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  User,
  AlertCircle,
  RefreshCw,
  Mail,
  Calendar
} from 'lucide-react';

const CashierManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [cashiers, setCashiers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulaire de création
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [cashierName, setCashierName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');

  useEffect(() => {
    checkAdminAndLoadCashiers();
  }, [user]);

  const checkAdminAndLoadCashiers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userIsAdmin = await adminService.isAdmin(user.id);
      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        await loadCashiers();
      } else {
        setError('Vous n\'avez pas les permissions nécessaires pour accéder à cette page.');
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification des permissions:', error);
      setError('Erreur lors de la vérification des permissions.');
    } finally {
      setLoading(false);
    }
  };

  const loadCashiers = async () => {
    try {
      setLoading(true);
      const allCashiers = await adminService.getAllCashiers();
      setCashiers(allCashiers);
      setError(null);
    } catch (error: any) {
      console.error('Erreur lors du chargement des caissiers:', error);
      setError('Erreur lors du chargement des caissiers. Vérifiez la console pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    const query = userSearchQuery.trim();
    
    if (!query) {
      setSearchResults([]);
      setError(null);
      return;
    }

    // Minimum 2 caractères pour la recherche
    if (query.length < 2) {
      setError('Veuillez entrer au moins 2 caractères pour la recherche.');
      setSearchResults([]);
      return;
    }

    try {
      setError(null);
      setIsSearching(true);
      console.log('🔍 Recherche d\'utilisateurs...', { query });
      
      const results = await adminService.searchUsers(query);
      
      console.log('✅ Résultats de recherche:', results.length, results);
      
      if (results.length === 0) {
        setError(null); // Ne pas afficher d'erreur, juste un message informatif dans l'UI
      } else {
        setError(null);
      }
      
      setSearchResults(results);
    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche:', error);
      
      // Messages d'erreur plus détaillés
      let errorMessage = 'Erreur lors de la recherche d\'utilisateurs.';
      
      if (error?.message) {
        if (error.message.includes('permission denied') || error.message.includes('RLS') || error.message.includes('row-level security')) {
          errorMessage = '❌ Erreur de permissions. Assurez-vous que vous êtes connecté avec un compte administrateur et exécutez le script FIX_RLS_ADMIN_VIEW_USERS.sql dans Supabase pour permettre aux admins de voir tous les utilisateurs.';
        } else if (error.message.includes('connecté')) {
          errorMessage = '❌ ' + error.message;
        } else if (error.message.includes('administrateurs')) {
          errorMessage = '❌ ' + error.message;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (userData: { id: string; email: string; name: string }) => {
    setSelectedUserId(userData.id);
    setCashierName(userData.name);
    setCashierEmail(userData.email);
    setSearchResults([]);
    setUserSearchQuery('');
  };

  const handleCreateCashier = async () => {
    if (!selectedUserId) {
      setError('Veuillez sélectionner un utilisateur.');
      return;
    }

    if (!cashierName.trim() || !cashierEmail.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Création du caissier...', {
        userId: selectedUserId,
        name: cashierName.trim(),
        email: cashierEmail.trim()
      });
      
      await adminService.createCashier(selectedUserId, cashierName.trim(), cashierEmail.trim());
      
      console.log('✅ Caissier créé avec succès');
      setSuccess('✅ Caissier créé avec succès ! L\'utilisateur peut maintenant se connecter et accéder à la page Caisse OIC.');
      setShowCreateModal(false);
      resetCreateForm();
      await loadCashiers();
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du caissier:', error);
      
      // Messages d'erreur plus détaillés
      let errorMessage = 'Erreur lors de la création du caissier.';
      
      if (error?.message) {
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMessage = '❌ Erreur de permissions. Assurez-vous que vous êtes connecté avec un compte administrateur et que les politiques RLS sont correctement configurées dans Supabase.';
        } else if (error.message.includes('déjà un compte')) {
          errorMessage = '❌ ' + error.message;
        } else if (error.message.includes('n\'existe pas')) {
          errorMessage = '❌ ' + error.message;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleEditCashier = async () => {
    if (!selectedCashier) return;

    if (!cashierName.trim() || !cashierEmail.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setError(null);
      await adminService.updateAdminUser(selectedCashier.id, {
        name: cashierName.trim(),
        email: cashierEmail.trim(),
      });
      setSuccess('Caissier mis à jour avec succès !');
      setShowEditModal(false);
      setSelectedCashier(null);
      await loadCashiers();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du caissier:', error);
      setError(error.message || 'Erreur lors de la mise à jour du caissier.');
    }
  };

  const handleToggleActive = async (cashier: AdminUser) => {
    try {
      if (cashier.isActive) {
        await adminService.deactivateAdminUser(cashier.id);
        setSuccess(`Caissier ${cashier.name} désactivé.`);
      } else {
        await adminService.activateAdminUser(cashier.id);
        setSuccess(`Caissier ${cashier.name} activé.`);
      }
      await loadCashiers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erreur lors de la modification du statut:', error);
      setError(error.message || 'Erreur lors de la modification du statut.');
    }
  };

  const handleDeleteCashier = async (cashier: AdminUser) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le caissier ${cashier.name} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await adminService.deleteAdminUser(cashier.id);
      setSuccess('Caissier supprimé avec succès !');
      await loadCashiers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setError(error.message || 'Erreur lors de la suppression du caissier.');
    }
  };

  const resetCreateForm = () => {
    setSelectedUserId('');
    setCashierName('');
    setCashierEmail('');
    setUserSearchQuery('');
    setSearchResults([]);
  };

  const openEditModal = (cashier: AdminUser) => {
    setSelectedCashier(cashier);
    setCashierName(cashier.name);
    setCashierEmail(cashier.email);
    setShowEditModal(true);
  };

  const filteredCashiers = cashiers.filter(cashier =>
    cashier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cashier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-cote-ivoire-primary" />
                Gestion des Caissiers
              </h1>
              <p className="text-gray-600 mt-1">Créez et gérez les comptes caissiers</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadCashiers}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </button>
              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-dark transition-colors flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nouveau Caissier
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Recherche */}
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un caissier par nom ou email..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
            />
          </div>
        </div>

        {/* Liste des caissiers */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCashiers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? 'Aucun caissier trouvé.' : 'Aucun caissier enregistré.'}
                    </td>
                  </tr>
                ) : (
                  filteredCashiers.map((cashier) => (
                    <tr key={cashier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{cashier.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {cashier.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cashier.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cashier.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(cashier.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(cashier)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(cashier)}
                            className={cashier.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            title={cashier.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {cashier.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCashier(cashier)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Créer un nouveau caissier</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher un utilisateur parmi tous les utilisateurs enregistrés
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        // Réinitialiser les résultats si le champ est vide
                        if (!e.target.value.trim()) {
                          setSearchResults([]);
                          setError(null);
                        }
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                      placeholder="Rechercher par email ou nom (minimum 2 caractères)..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                    />
                    <button
                      onClick={handleSearchUsers}
                      disabled={!userSearchQuery.trim() || userSearchQuery.trim().length < 2 || isSearching}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      title={userSearchQuery.trim().length < 2 ? "Entrez au moins 2 caractères" : "Rechercher"}
                    >
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 La recherche filtre parmi tous les utilisateurs enregistrés dans le système
                  </p>

                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-64 overflow-y-auto bg-white">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                        {searchResults.length} utilisateur{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                      </div>
                      {searchResults.map((userData) => (
                        <button
                          key={userData.id}
                          onClick={() => handleSelectUser(userData)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{userData.name || 'Nom non renseigné'}</div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {userSearchQuery.trim() && searchResults.length === 0 && !error && (
                    <div className="mt-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      Aucun utilisateur trouvé pour "{userSearchQuery}". Essayez une autre recherche.
                    </div>
                  )}
                </div>

                {selectedUserId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du caissier
                      </label>
                      <input
                        type="text"
                        value={cashierName}
                        onChange={(e) => setCashierName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email du caissier
                      </label>
                      <input
                        type="email"
                        value={cashierEmail}
                        onChange={(e) => setCashierEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateCashier}
                    disabled={!selectedUserId}
                    className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Créer le caissier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition */}
        {showEditModal && selectedCashier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Modifier le caissier</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCashier(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={cashierEmail}
                    onChange={(e) => setCashierEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCashier(null);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditCashier}
                    className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-md hover:bg-cote-ivoire-dark"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierManagementPage;

