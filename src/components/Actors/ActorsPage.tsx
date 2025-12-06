import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Users, Building, Phone, Mail, MapPin, Filter, Globe, Loader2 } from 'lucide-react';
import { ActorData } from '../../data/actors';
import { COUNTRIES } from '../../data/countries';
import { useAuth } from '../../contexts/AuthContext';
import { actorDataService } from '../../services/supabase/actorDataService';
import ActorModal from './ActorModal';

const ActorsPage: React.FC = () => {
  const { user } = useAuth();
  const [actors, setActors] = useState<ActorData[]>([]);
  const [filteredActors, setFilteredActors] = useState<ActorData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'importateur' | 'fournisseur' | 'transitaire'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingActor, setEditingActor] = useState<ActorData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les acteurs depuis Supabase
  useEffect(() => {
    const loadActors = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const actorsData = await actorDataService.getActorsByUser(user.id);
        setActors(actorsData);
      } catch (err: any) {
        console.error('Erreur lors du chargement des acteurs:', err);
        setError('Erreur lors du chargement des acteurs. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    loadActors();
  }, [user?.id]);

  // Mise à jour de la liste filtrée
  useEffect(() => {
    let filtered = actors;

    // Filtrage par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(actor => actor.type === selectedType);
    }

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(actor =>
        actor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        actor.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        actor.telephone.includes(searchTerm) ||
        actor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActors(filtered);
  }, [actors, searchTerm, selectedType]);

  const handleAddActor = () => {
    setEditingActor(null);
    setShowModal(true);
  };

  const handleEditActor = (actor: ActorData) => {
    setEditingActor(actor);
    setShowModal(true);
  };

  const handleSaveActor = async (actorData: Omit<ActorData, 'id'>) => {
    if (!user?.id) {
      setError('Vous devez être connecté pour sauvegarder un acteur.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      if (editingActor) {
        // Modification
        const updatedActor = await actorDataService.updateActor(editingActor.id, actorData);
        setActors(actors.map(actor =>
          actor.id === editingActor.id ? updatedActor : actor
        ));
      } else {
        // Ajout
        const newActor = await actorDataService.createActor(user.id, actorData);
        setActors([...actors, newActor]);
      }
      setShowModal(false);
      setEditingActor(null);
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde de l\'acteur:', err);
      
      // Messages d'erreur plus détaillés
      if (err.code === '42501' || err.message?.includes('permission denied') || err.message?.includes('RLS')) {
        setError('Erreur de permissions. Assurez-vous que la table actors existe et que les politiques RLS sont correctement configurées. Exécutez FIX_CREATION_ACTEUR.sql dans Supabase.');
      } else if (err.code === '42P01' || err.message?.includes('does not exist')) {
        setError('La table actors n\'existe pas. Exécutez FIX_CREATION_ACTEUR.sql dans Supabase.');
      } else if (err.message?.includes('null value') || err.message?.includes('NOT NULL')) {
        setError('Certains champs obligatoires sont manquants. Veuillez remplir tous les champs requis.');
      } else {
        setError(`Erreur lors de la sauvegarde de l'acteur: ${err.message || 'Erreur inconnue'}. Consultez la console pour plus de détails.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActor = async (id: string) => {
    try {
      setError(null);
      await actorDataService.deleteActor(id);
      setActors(actors.filter(actor => actor.id !== id));
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'acteur:', err);
      setError('Erreur lors de la suppression de l\'acteur. Veuillez réessayer.');
    }
  };

  const getTypeLabel = (type: ActorData['type']) => {
    switch (type) {
      case 'importateur': return 'Importateur';
      case 'fournisseur': return 'Fournisseur';
      case 'transitaire': return 'Transitaire';
      default: return type;
    }
  };

  const getTypeColor = (type: ActorData['type']) => {
    switch (type) {
      case 'importateur': return 'bg-cote-ivoire-primary/10 text-cote-ivoire-primary border-cote-ivoire-primary/20';
      case 'fournisseur': return 'bg-cote-ivoire-success/10 text-cote-ivoire-success border-cote-ivoire-success/20';
      case 'transitaire': return 'bg-cote-ivoire-secondary/10 text-cote-ivoire-secondary border-cote-ivoire-secondary/20';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const stats = [
    {
      label: 'Total acteurs',
      value: actors.length,
      icon: Users,
      color: 'bg-cote-ivoire-primary'
    },
    {
      label: 'Importateurs',
      value: actors.filter(a => a.type === 'importateur').length,
      icon: Building,
      color: 'bg-cote-ivoire-success'
    },
    {
      label: 'Fournisseurs',
      value: actors.filter(a => a.type === 'fournisseur').length,
      icon: Building,
      color: 'bg-cote-ivoire-primary'
    },
    {
      label: 'Transitaires',
      value: actors.filter(a => a.type === 'transitaire').length,
      icon: Building,
      color: 'bg-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cote-ivoire-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des acteurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestion des acteurs</h1>
            <p className="text-gray-600">Gérez vos importateurs, fournisseurs et transitaires</p>
          </div>
          <button
            onClick={handleAddActor}
            disabled={!user}
            className="bg-cote-ivoire-primary text-white px-4 py-2 rounded-lg hover:bg-cote-ivoire-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un acteur</span>
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-cote-ivoire-light p-6 border border-gray-300">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, adresse, téléphone ou email..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-cote-ivoire-medium rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
              />
            </div>
          </div>

          {/* Filtre par type */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary"
            >
              <option value="all">Tous les types</option>
              <option value="importateur">Importateurs</option>
              <option value="fournisseur">Fournisseurs</option>
              <option value="transitaire">Transitaires</option>
            </select>
          </div>
        </div>
      </div>

      {/* Résultats de recherche */}
      <div className="mt-4 text-sm text-gray-600">
        {filteredActors.length} acteur{filteredActors.length > 1 ? 's' : ''} trouvé{filteredActors.length > 1 ? 's' : ''}
        {searchTerm && ` pour "${searchTerm}"`}
        {selectedType !== 'all' && ` dans la catégorie "${getTypeLabel(selectedType)}"`}
      </div>

      {/* Liste des acteurs */}
      <div className="bg-white rounded-lg shadow-cote-ivoire-light border border-gray-300">
        {filteredActors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm || selectedType !== 'all' 
                ? 'Aucun acteur trouvé avec ces critères'
                : 'Aucun acteur enregistré'
              }
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm || selectedType !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier acteur'
              }
            </p>
            {(!searchTerm && selectedType === 'all') && (
              <button
                onClick={handleAddActor}
                className="bg-cote-ivoire-primary text-white px-6 py-2 rounded-lg hover:bg-cote-ivoire-primary/90 transition-colors"
              >
                Ajouter un acteur
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cote-ivoire-light">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Adresse</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActors.map((actor) => (
                  <tr key={actor.id} className="border-b border-cote-ivoire-light hover:bg-cote-ivoire-lighter">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(actor.type)}`}>
                        {getTypeLabel(actor.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{actor.nom}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {actor.telephone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{actor.telephone}</span>
                          </div>
                        )}
                        {actor.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{actor.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {actor.adresse && (
                        <div className="space-y-1">
                          <div className="flex items-start space-x-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{actor.adresse}</span>
                          </div>
                          {actor.pays && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Globe className="h-3 w-3" />
                              <span>{COUNTRIES.find(c => c.code === actor.pays)?.name || actor.pays}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditActor(actor)}
                          className="text-cote-ivoire-primary hover:text-cote-ivoire-primary/80 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(actor.id)}
                          className="text-cote-ivoire-error hover:text-cote-ivoire-error/80 p-1"
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
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-cote-ivoire-light shadow-cote-ivoire-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cet acteur ? Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
                              <button
                  onClick={() => showDeleteConfirm && handleDeleteActor(showDeleteConfirm)}
                  className="flex-1 bg-cote-ivoire-error text-white py-2 px-4 rounded-md hover:bg-cote-ivoire-error/90 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'ajout/modification */}
        {showModal && (
          <ActorModal
            actor={editingActor}
            onClose={() => {
              setShowModal(false);
              setEditingActor(null);
            }}
            onSave={handleSaveActor}
          />
        )}
      </div>
    );
};

export default ActorsPage;
