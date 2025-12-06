import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, X, Shield, ArrowRight, AlertCircle, CheckCircle, Star, Zap, Users } from 'lucide-react';

interface RegisterFormProps {
  onToggleForm: () => void;
  onClose?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { register, isAuthenticated } = useAuth();

  // Fermer le formulaire automatiquement quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && onClose) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);

    try {
      const success = await register(formData.email, formData.password, formData.name);
      if (success) {
        console.log('Inscription réussie');
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        // Le formulaire se fermera automatiquement via useEffect quand isAuthenticated devient true
      }
    } catch (err: any) {
      console.error('Erreur d\'inscription:', err);
      // Afficher le message d'erreur Supabase si disponible
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Traduire les messages d'erreur courants
      if (errorMessage.includes('User already registered') || errorMessage.includes('already registered')) {
        errorMessage = 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.';
      } else if (errorMessage.includes('Password should be at least') || errorMessage.includes('Password')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (errorMessage.includes('Invalid email') || errorMessage.includes('invalid')) {
        errorMessage = 'Adresse email invalide.';
      } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        errorMessage = 'Erreur de configuration serveur. Les tables de base de données sont manquantes. Contactez le support.';
      } else if (errorMessage.includes('Database error') || errorMessage.includes('database')) {
        errorMessage = 'Erreur de base de données. Vérifiez que le schéma SQL a été exécuté dans Supabase.';
      } else if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
        errorMessage = 'Erreur de permissions. Vérifiez les politiques RLS dans Supabase.';
      } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email confirmation')) {
        errorMessage = 'Veuillez confirmer votre email. Vérifiez votre boîte de réception.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Validations en temps réel
  const isNameValid = formData.name.length >= 2;
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.');
  const isPasswordValid = formData.password.length >= 6;
  const isConfirmPasswordValid = formData.confirmPassword === formData.password && formData.confirmPassword.length > 0;
  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        {/* Header avec logo et titre */}
        <div className="relative bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary rounded-t-2xl p-6 text-white">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">KPRAGUE</h1>
              <p className="text-sm text-white/80">SYSANEV</p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center">
            Créer votre compte
          </h2>
          <p className="text-sm text-white/80 text-center mt-1">
            Commencez vos simulations gratuitement
          </p>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium text-sm">Erreur d'inscription</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Nom complet */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                Nom complet
              </label>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  focusedField === 'name' 
                    ? 'bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-secondary/10' 
                    : 'bg-gray-50'
                }`}></div>
                <div className="relative flex items-center">
                  <User className={`absolute left-4 h-5 w-5 transition-colors duration-200 pointer-events-none z-10 ${
                    focusedField === 'name' ? 'text-cote-ivoire-primary' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-14 pr-4 py-4 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary/20 text-gray-800 placeholder-gray-400 transition-all duration-200 relative z-20"
                    placeholder="Votre nom complet"
                    required
                  />
                  {isNameValid && (
                    <CheckCircle className="absolute right-4 h-5 w-5 text-green-500 pointer-events-none z-10" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Champ Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Adresse email
              </label>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  focusedField === 'email' 
                    ? 'bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-secondary/10' 
                    : 'bg-gray-50'
                }`}></div>
                <div className="relative flex items-center">
                  <Mail className={`absolute left-4 h-5 w-5 transition-colors duration-200 pointer-events-none z-10 ${
                    focusedField === 'email' ? 'text-cote-ivoire-primary' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-14 pr-4 py-4 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary/20 text-gray-800 placeholder-gray-400 transition-all duration-200 relative z-20"
                    placeholder="votre@email.com"
                    required
                  />
                  {isEmailValid && (
                    <CheckCircle className="absolute right-4 h-5 w-5 text-green-500 pointer-events-none z-10" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Mot de passe
              </label>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  focusedField === 'password' 
                    ? 'bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-secondary/10' 
                    : 'bg-gray-50'
                }`}></div>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-4 h-5 w-5 transition-colors duration-200 pointer-events-none z-10 ${
                    focusedField === 'password' ? 'text-cote-ivoire-primary' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-14 pr-12 py-4 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary/20 text-gray-800 placeholder-gray-400 transition-all duration-200 relative z-20"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-30"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {formData.password && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${isPasswordValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Au moins 6 caractères</span>
                </div>
              )}
            </div>
            
            {/* Champ Confirmation mot de passe */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  focusedField === 'confirmPassword' 
                    ? 'bg-gradient-to-r from-cote-ivoire-primary/10 to-cote-ivoire-secondary/10' 
                    : 'bg-gray-50'
                }`}></div>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-4 h-5 w-5 transition-colors duration-200 pointer-events-none z-10 ${
                    focusedField === 'confirmPassword' ? 'text-cote-ivoire-primary' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-14 pr-4 py-4 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary/20 text-gray-800 placeholder-gray-400 transition-all duration-200 relative z-20"
                    placeholder="••••••••"
                    required
                  />
                  {isConfirmPasswordValid && (
                    <CheckCircle className="absolute right-4 h-5 w-5 text-green-500 pointer-events-none z-10" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary text-white py-4 px-6 rounded-xl font-semibold hover:from-cote-ivoire-primary/90 hover:to-cote-ivoire-secondary/90 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Lien vers la connexion */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-gray-600">
              Déjà un compte ?{' '}
              <button
                onClick={onToggleForm}
                className="text-cote-ivoire-primary hover:text-cote-ivoire-primary/80 font-semibold transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>
          
          {/* Avantages de l'inscription */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
              <Star className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium text-sm">3 simulations gratuites</p>
                <p className="text-green-600 text-xs">Aucune carte de crédit requise</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
              <Zap className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium text-sm">Résultats instantanés</p>
                <p className="text-blue-600 text-xs">Calculs précis et détaillés</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl">
              <Shield className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <div>
                <p className="text-purple-800 font-medium text-sm">Données sécurisées</p>
                <p className="text-purple-600 text-xs">Chiffrement de niveau bancaire</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
