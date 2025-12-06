import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, X, Shield, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginFormProps {
  onToggleForm: () => void;
  onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        console.log('Connexion réussie');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      
      // Afficher le message d'erreur Supabase si disponible
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      
      // Extraire le message d'erreur
      const errorCode = err?.code || err?.error?.code;
      const errorStatus = err?.status || err?.error?.status;
      const errorMsg = err?.message || err?.error?.message || '';
      
      // Gérer les erreurs spécifiques selon le code
      if (errorCode === 'invalid_credentials' || errorStatus === 400) {
        if (errorMsg.includes('Email not confirmed') || errorMsg.includes('email confirmation')) {
          errorMessage = 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception (et les spams).';
        } else {
          errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants et assurez-vous que vous avez confirmé votre email.';
        }
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect. Si vous venez de vous inscrire, vérifiez que vous avez confirmé votre email.';
      } else if (errorMsg.includes('Email not confirmed') || errorMsg.includes('email confirmation')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception (et les spams).';
      } else if (errorMsg.includes('User not found') || errorMsg.includes('No user found')) {
        errorMessage = 'Aucun compte trouvé avec cet email. Vérifiez votre adresse email ou créez un compte.';
      } else if (errorMsg.includes('Too many requests') || errorStatus === 429) {
        errorMessage = 'Trop de tentatives de connexion. Veuillez patienter quelques instants avant de réessayer.';
      } else if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
        errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;

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
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">KPRAGUE</h1>
              <p className="text-sm text-white/80">SYSANEV</p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center">
            Connexion sécurisée
          </h2>
          <p className="text-sm text-white/80 text-center mt-1">
            Accédez à votre espace de simulation
          </p>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium text-sm">Erreur de connexion</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </div>
            
            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading || !isEmailValid || !isPasswordValid}
              className="w-full bg-gradient-to-r from-cote-ivoire-primary to-cote-ivoire-secondary text-white py-4 px-6 rounded-xl font-semibold hover:from-cote-ivoire-primary/90 hover:to-cote-ivoire-secondary/90 focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Lien vers l'inscription */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-gray-600">
              Pas encore de compte ?{' '}
              <button
                onClick={onToggleForm}
                className="text-cote-ivoire-primary hover:text-cote-ivoire-primary/80 font-semibold transition-colors"
              >
                Créer un compte gratuit
              </button>
            </p>
          </div>
          
          {/* Informations de sécurité */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium text-sm">Connexion sécurisée</p>
                <p className="text-blue-600 text-sm mt-1">
                  Vos données sont protégées par un chiffrement de niveau bancaire
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
