import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ActorData } from '../../data/actors';

interface AddActorModalProps {
  type: 'importateur' | 'fournisseur' | 'transitaire';
  onClose: () => void;
  onActorAdded: (actor: ActorData) => void;
}

const AddActorModal: React.FC<AddActorModalProps> = ({ type, onClose, onActorAdded }) => {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    zone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nom.trim()) {
      setError('Le nom de l\'entreprise est obligatoire');
      return;
    }

    setLoading(true);

    try {
      // Simulation d'ajout à la base de données
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newActor: ActorData = {
        id: `${type}_${Date.now()}`,
        nom: formData.nom.trim(),
        adresse: formData.adresse.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim(),
        type,
        zone: formData.zone.trim() || undefined
      };

      onActorAdded(newActor);
    } catch (err) {
      setError('Erreur lors de l\'ajout de l\'acteur');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'importateur': return 'Importateur';
      case 'fournisseur': return 'Fournisseur';
      case 'transitaire': return 'Transitaire';
      default: return 'Acteur';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 border border-gray-300 shadow-cote-ivoire-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Ajouter un {getTypeLabel()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-cote-ivoire-primary/50 border border-cote-ivoire-primary rounded-md text-cote-ivoire-primary text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500"
              placeholder="Nom de l'entreprise"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse complète
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 resize-none"
              placeholder="Adresse complète"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500"
              placeholder="+237 XXX XX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500"
              placeholder="contact@entreprise.com"
            />
          </div>

          {type === 'importateur' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone de localisation
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800"
              >
                <option value="">Sélectionner une zone</option>
                <option value="zone1">Zone 1</option>
                <option value="zone2">Zone 2</option>
                <option value="zone3">Zone 3</option>
                <option value="hors_zone">Hors Zone</option>
              </select>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/10 text-gray-700 border border-cote-ivoire-primary/20 hover:bg-cote-ivoire-primary/20 transition-colors"
            >
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-cote-ivoire-primary/50 text-cote-ivoire-primary border border-cote-ivoire-primary hover:bg-cote-ivoire-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Ajout...' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddActorModal;
