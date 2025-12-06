import React, { useState, useEffect } from 'react';
import { X, Save, Building, User, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { ActorData } from '../../data/actors';
import { COUNTRIES } from '../../data/countries';

interface ActorModalProps {
  actor: ActorData | null;
  onClose: () => void;
  onSave: (actor: Omit<ActorData, 'id'>) => void;
}

const ActorModal: React.FC<ActorModalProps> = ({ actor, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    type: 'importateur' as ActorData['type'],
    zone: '',
    pays: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (actor) {
      setFormData({
        nom: actor.nom,
        adresse: actor.adresse,
        telephone: actor.telephone,
        email: actor.email,
        type: actor.type,
        zone: actor.zone || '',
        pays: actor.pays || ''
      });
    } else {
      setFormData({
        nom: '',
        adresse: '',
        telephone: '',
        email: '',
        type: 'importateur',
        zone: '',
        pays: ''
      });
    }
  }, [actor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de l\'entreprise est obligatoire';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.telephone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulation d'une opération asynchrone
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSave({
        nom: formData.nom.trim(),
        adresse: formData.adresse.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim(),
        type: formData.type,
        zone: formData.zone.trim() || undefined,
        pays: formData.pays.trim() || undefined
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-cote-ivoire-xl">
        <div className="sticky top-0 bg-white border-b border-cote-ivoire-light p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>{actor ? 'Modifier l\'acteur' : 'Nouvel acteur'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type d'acteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'acteur *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary text-gray-800"
              required
            >
              <option value="importateur">Importateur</option>
              <option value="fournisseur">Fournisseur</option>
              <option value="transitaire">Transitaire</option>
            </select>
          </div>

          {/* Nom de l'entreprise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Nom de l'entreprise *</span>
              </div>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 ${
                errors.nom ? 'border-cote-ivoire-error' : 'border-cote-ivoire-medium'
              }`}
              placeholder="Nom de l'entreprise"
              required
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-cote-ivoire-error">{errors.nom}</p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Adresse complète</span>
              </div>
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary text-gray-800 placeholder-gray-500 resize-none"
              placeholder="Adresse complète de l'entreprise"
              rows={3}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Numéro de téléphone</span>
                </div>
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 ${
                  errors.telephone ? 'border-cote-ivoire-error' : 'border-cote-ivoire-medium'
                }`}
                placeholder="+237 XXX XX XX XX"
              />
              {errors.telephone && (
                <p className="mt-1 text-sm text-cote-ivoire-error">{errors.telephone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Adresse email</span>
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500 ${
                  errors.email ? 'border-cote-ivoire-error' : 'border-cote-ivoire-medium'
                }`}
                placeholder="contact@entreprise.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-cote-ivoire-error">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Zone (uniquement pour les importateurs) */}
          {formData.type === 'importateur' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Zone de localisation</span>
                </div>
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary text-gray-800"
              >
                <option value="">Sélectionner une zone</option>
                <option value="zone1">Zone 1</option>
                <option value="zone2">Zone 2</option>
                <option value="zone3">Zone 3</option>
                <option value="hors_zone">Hors Zone</option>
              </select>
            </div>
          )}

          {/* Pays (uniquement pour les fournisseurs) */}
          {formData.type === 'fournisseur' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Pays *</span>
                </div>
              </label>
              <select
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-cote-ivoire-medium rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-cote-ivoire-primary text-gray-800"
                required
              >
                <option value="">Sélectionner un pays</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Aperçu */}
          <div className="bg-cote-ivoire-lighter rounded-lg p-4 border border-cote-ivoire-light">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Aperçu de l'acteur</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-cote-ivoire-primary/10 text-cote-ivoire-primary px-2 py-1 rounded border border-cote-ivoire-primary/20">
                  {getTypeLabel(formData.type)}
                </span>
                <span className="text-gray-800 font-medium">
                  {formData.nom || 'Nom de l\'entreprise'}
                </span>
              </div>
              {formData.adresse && (
                <p className="text-sm text-gray-600">{formData.adresse}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {formData.telephone && (
                  <span>📞 {formData.telephone}</span>
                )}
                {formData.email && (
                  <span>✉️ {formData.email}</span>
                )}
                {formData.zone && (
                  <span>📍 {formData.zone}</span>
                )}
                {formData.pays && (
                  <span>🌍 {COUNTRIES.find(c => c.code === formData.pays)?.name || formData.pays}</span>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4 border-t border-cote-ivoire-light">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cote-ivoire-primary text-white py-3 px-4 rounded-md hover:bg-cote-ivoire-primary/90 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Sauvegarde...' : (actor ? 'Modifier' : 'Ajouter')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActorModal;
