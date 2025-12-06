import React from 'react';
import { Calculator, TrendingUp, Shield, Zap, CheckCircle, ArrowRight, Globe, Users, BarChart3, Clock, Ship, Plane, Train, Truck } from 'lucide-react';
import { plans } from '../../data/plans';
import PlanCard from '../Plans/PlanCard';
import logoOic from '../../logo-oic.jpg';

interface HomePageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogin, onRegister }) => {
  const handlePlanSelect = () => {
    onRegister();
  };

  return (
    <div className="min-h-screen bg-cote-ivoire-light">
      {/* Navigation */}
              <nav className="bg-cote-ivoire-primary/95 border-b border-gray-300 sticky top-0 z-40 backdrop-blur-sm shadow-cote-ivoire-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg 
                width="60" 
                height="40" 
                viewBox="0 0 60 40" 
                className="mr-3 drop-shadow-lg"
                style={{ backgroundColor: 'transparent' }}
              >
                {/* "O" - Cercle avec icônes de transport */}
                <circle cx="10" cy="10" r="6" fill="#1e40af"/>
                <circle cx="10" cy="10" r="4" fill="#1d4ed8"/>
                <rect x="7" y="7" width="6" height="0.8" fill="white" rx="0.4" transform="rotate(12 10 7.4)"/>
                <rect x="5" y="9" width="10" height="0.8" fill="white" rx="0.4"/>
                <rect x="6" y="11" width="8" height="0.8" fill="white" rx="0.4" transform="rotate(-6 10 11.4)"/>
                
                {/* "i" - Barre verticale avec drapeau ivoirien */}
                <rect x="18" y="3" width="1.5" height="14" fill="#1e40af" rx="0.8"/>
                <rect x="16" y="3" width="5" height="2.5" rx="0.4">
                  <defs>
                    <linearGradient id="flagNav" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#ff8c00'}}/>
                      <stop offset="33%" style={{stopColor: '#ff8c00'}}/>
                      <stop offset="33%" style={{stopColor: '#ffffff'}}/>
                      <stop offset="66%" style={{stopColor: '#ffffff'}}/>
                      <stop offset="66%" style={{stopColor: '#00a651'}}/>
                      <stop offset="100%" style={{stopColor: '#00a651'}}/>
                    </linearGradient>
                  </defs>
                  <rect x="16" y="3" width="5" height="2.5" fill="url(#flagNav)" rx="0.4"/>
                </rect>
                
                {/* "C" - Croissant */}
                <path d="M 26 3 A 6 6 0 0 1 26 17 A 6 6 0 0 1 26 3" stroke="#1e40af" strokeWidth="2" fill="none" strokeLinecap="round"/>
                
                {/* Lignes ondulées */}
                <path d="M 3 20 Q 9 18 15 20 Q 21 22 27 20" stroke="#ff8c00" strokeWidth="0.8" fill="none"/>
                <path d="M 3 24 Q 9 26 15 24 Q 21 22 27 24" stroke="#00a651" strokeWidth="0.8" fill="none"/>
                
                {/* Texte "Office Ivoirien des Chargeurs" */}
                <text x="30" y="30" fontFamily="Arial, sans-serif" fontSize="4" fontWeight="bold" fill="#1e40af">
                  Office Ivoirien
                </text>
                <text x="30" y="35" fontFamily="Arial, sans-serif" fontSize="4" fontWeight="bold" fill="#1e40af">
                  Chargeurs
                </text>
              </svg>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white">KPRAGUE</span>
                <span className="text-base font-semibold text-white/90 -mt-1">SYSANEV</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onLogin}
                className="text-white hover:text-white/80 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Déjà inscrit ? Se connecter
              </button>
              <button
                onClick={onRegister}
                className="bg-white text-cote-ivoire-primary px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-all duration-200 shadow-cote-ivoire-medium hover:shadow-cote-ivoire-large transform hover:-translate-y-0.5"
              >
                Inscrivez-vous pour simuler
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cote-ivoire-primary via-cote-ivoire-secondary to-cote-ivoire-accent">
        {/* Image de fond du navire */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url('/bateau.png')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cote-ivoire-primary/80 via-cote-ivoire-secondary/75 to-cote-ivoire-accent/80"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Contenu principal à gauche */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
                  KPRAGUE
                </h1>
                <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-6">
                  SYSANEV
                </h2>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="text-[#0f172a]">Calculez vos coûts de revient prévisionnels</span>
                <span className="block text-[#0f172a]">en commerce international</span>
              </h3>
              <p className="text-xl text-white/80 mb-8 max-w-3xl lg:max-w-none leading-relaxed">
                La plateforme de référence pour les importateurs et exportateurs. 
                Simulez précisément vos coûts de revient prévisionnels FOB, fret, assurance, droits de douane et bien plus.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12">
                <button
                  onClick={onRegister}
                  className="bg-cote-ivoire-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-cote-ivoire-primary/90 transition-all duration-200 shadow-cote-ivoire-large hover:shadow-cote-ivoire-xl transform hover:-translate-y-1 flex items-center space-x-2"
                >
                  <span>Commencer gratuitement</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={onLogin}
                  className="bg-cote-ivoire-success text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-cote-ivoire-success/90 transition-all duration-200 shadow-cote-ivoire-large hover:shadow-cote-ivoire-xl transform hover:-translate-y-1 flex items-center space-x-2"
                >
                  <span>Déjà client ? Se connecter</span>
                </button>
              </div>
            </div>

            {/* Icône OIC à droite */}
            <div className="flex justify-center lg:justify-end items-center">
              <div className="relative">
                {/* Logo OIC directement sur l'arrière-plan orange */}
                <div className="text-center">
                  {/* Logo OIC avec transparence */}
                  <div className="mb-6">
                    <img 
                      src={logoOic} 
                      alt="Office Ivoirien des Chargeurs" 
                      className="w-96 h-auto mx-auto drop-shadow-2xl animate-float hover:scale-105 transition-all duration-500 ease-in-out"
                      style={{
                        filter: 'brightness(1.5) contrast(1.6) saturate(1.4)',
                        mixBlendMode: 'multiply',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                  
                  {/* Icônes des moyens de transport */}
                  <div className="flex justify-center items-center space-x-6 mb-4">
                    <div className="flex flex-col items-center group">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/30 transition-all duration-300 hover:scale-110">
                        <Ship className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-white/80 text-xs font-medium">Maritime</span>
                    </div>
                    
                    <div className="flex flex-col items-center group">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/30 transition-all duration-300 hover:scale-110">
                        <Plane className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-white/80 text-xs font-medium">Aérien</span>
                    </div>
                    
                    <div className="flex flex-col items-center group">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/30 transition-all duration-300 hover:scale-110">
                        <Train className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-white/80 text-xs font-medium">Ferroviaire</span>
                    </div>
                    
                    <div className="flex flex-col items-center group">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/30 transition-all duration-300 hover:scale-110">
                        <Truck className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-white/80 text-xs font-medium">Routier</span>
                    </div>
                  </div>

                </div>
                
                {/* Éléments décoratifs flottants */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-white/20 rounded-full animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Pourquoi choisir <span className="text-cote-ivoire-primary">KPRAGUE - SYSANEV</span> ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une solution complète pour optimiser vos opérations d'import-export
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-cote-ivoire-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cote-ivoire-primary/20 transition-colors border border-cote-ivoire-primary/20">
                <TrendingUp className="h-8 w-8 text-cote-ivoire-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Calculs précis</h3>
              <p className="text-gray-600">
                Algorithmes avancés pour des simulations exactes incluant tous les frais
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-cote-ivoire-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cote-ivoire-primary/20 transition-colors border border-cote-ivoire-primary/20">
                <Shield className="h-8 w-8 text-cote-ivoire-success" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Sécurisé</h3>
              <p className="text-gray-600">
                Vos données commerciales sont protégées par un chiffrement de niveau bancaire
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-cote-ivoire-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cote-ivoire-secondary/20 transition-colors border border-cote-ivoire-secondary/20">
                <Zap className="h-8 w-8 text-cote-ivoire-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Instantané</h3>
              <p className="text-gray-600">
                Résultats en temps réel avec rapports détaillés exportables en PDF
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-cote-ivoire-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cote-ivoire-warning/20 transition-colors border border-cote-ivoire-warning/20">
                <Globe className="h-8 w-8 text-cote-ivoire-warning" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">International</h3>
              <p className="text-gray-600">
                Adapté aux réglementations douanières de multiples pays
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-cote-ivoire-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-cote-ivoire-primary mb-2">10,000+</div>
              <div className="text-gray-600">Simulations effectuées</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cote-ivoire-success mb-2">500+</div>
              <div className="text-gray-600">Entreprises clientes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cote-ivoire-secondary mb-2">99.9%</div>
              <div className="text-gray-600">Précision des calculs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Tarifs transparents et flexibles
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Commencez gratuitement, 
              évoluez selon votre croissance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={handlePlanSelect}
                isPopular={index === 2}
              />
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Besoin d'un plan sur mesure pour votre entreprise ?
            </p>
            <button
              onClick={onRegister}
              className="bg-cote-ivoire-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-cote-ivoire-primary/90 transition-colors"
            >
              Contactez notre équipe
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-cote-ivoire-primary to-cote-ivoire-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comment ça marche avec <span className="text-white">KPRAGUE - SYSANEV</span> ?
            </h2>
            <p className="text-xl text-white/80">
              Trois étapes simples pour obtenir vos simulations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-cote-ivoire-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Inscrivez-vous</h3>
              <p className="text-white/80">
                Créez votre compte en 30 secondes et bénéficiez de 3 simulations gratuites
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white text-cote-ivoire-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Saisissez vos données</h3>
              <p className="text-white/80">
                Entrez les informations de votre marchandise : FOB, fret, assurance, etc.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white text-cote-ivoire-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Obtenez vos résultats</h3>
              <p className="text-white/80">
                Recevez instantanément votre coût de revient prévisionnel détaillé et exportable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à optimiser vos opérations d'import-export ?
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Rejoignez des centaines d'entreprises qui font confiance à <span className="text-cote-ivoire-primary font-bold">KPRAGUE - SYSANEV</span> 
            pour leurs simulations de coût de revient prévisionnel.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRegister}
              className="bg-cote-ivoire-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-cote-ivoire-primary/90 transition-all duration-200 shadow-cote-ivoire-large hover:shadow-cote-ivoire-xl transform hover:-translate-y-1"
            >
              Commencer maintenant - C'est gratuit
            </button>
            <button
              onClick={onLogin}
                              className="border-2 border-gray-300 text-gray-800 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-500 hover:text-white transition-all duration-200"
            >
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
              <footer className="bg-white py-12 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <Calculator className="h-8 w-8 text-cote-ivoire-primary mr-3" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-cote-ivoire-primary">KPRAGUE</span>
              <span className="text-base font-semibold text-gray-600 -mt-1">SYSANEV</span>
            </div>
          </div>
          
          <div className="text-center text-gray-600">
            <p className="mb-4">
              La plateforme de référence pour les simulations de coût de revient prévisionnel en commerce international
            </p>
            <p className="text-sm">
              © 2024 <span className="font-bold text-cote-ivoire-primary">KPRAGUE - SYSANEV</span>. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
