import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { Calculator, LogOut, User, CreditCard, Database, FileText, Receipt, CheckCircle, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<Pick<LayoutProps, 'children'>> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin, isCashier } = useAdmin();
  
  // Les menus admin/caissier sont visibles uniquement pour les admins et caissiers
  // Ne pas masquer les menus pendant le chargement pour éviter qu'ils disparaissent
  const canAccessAdminFeatures = isAdmin || isCashier;
  
  // Si le chargement des rôles échoue, on affiche quand même les menus de base
  // pour éviter qu'ils disparaissent complètement

  return (
    <div className="min-h-screen bg-cote-ivoire-light">
      <nav className="bg-cote-ivoire-primary shadow-cote-ivoire-light border-b border-cote-ivoire-light">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-white mr-2" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">Kprague</span>
                <span className="text-xs text-white/80 -mt-1">Sysanev</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-6">
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/dashboard' || location.pathname === '/' 
                        ? 'bg-white text-cote-ivoire-primary' 
                        : 'text-white hover:text-white hover:bg-white/20'
                    }`}
                  >
                    Tableau de bord
                  </Link>
                  {/* Lien Simulateur masqué pour forcer le passage par le tableau de bord */}
                  <Link
                    to="/actors"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/actors'
                        ? 'bg-white text-cote-ivoire-primary' 
                        : 'text-white hover:text-white hover:bg-white/20'
                    }`}
                  >
                    Acteurs
                  </Link>
                  <Link
                    to="/plans"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/plans'
                        ? 'bg-white text-cote-ivoire-primary' 
                        : 'text-white hover:text-white hover:bg-white/20'
                    }`}
                  >
                    Plans
                  </Link>
                  {/* Paramètres - visible uniquement pour les admins */}
                  {isAdmin && (
                    <Link
                      to="/settings"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/settings'
                          ? 'bg-white text-cote-ivoire-primary' 
                          : 'text-white hover:text-white hover:bg-white/20'
                      }`}
                    >
                      Paramètres
                    </Link>
                  )}
                  <Link
                    to="/tec"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/tec'
                        ? 'bg-white text-cote-ivoire-primary' 
                        : 'text-white hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <Database className="h-4 w-4 inline mr-1" />
                    TEC
                  </Link>
                  <Link
                    to="/invoice-history"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/invoice-history'
                        ? 'bg-white text-cote-ivoire-primary' 
                        : 'text-white hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-1" />
                    Factures
                  </Link>
                  {/* Caisse OIC - visible uniquement pour les admins et caissiers */}
                  {canAccessAdminFeatures && (
                    <Link
                      to="/oic-cashier"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/oic-cashier'
                          ? 'bg-white text-cote-ivoire-primary' 
                          : 'text-white hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <Receipt className="h-4 w-4 inline mr-1" />
                      Caisse OIC
                    </Link>
                  )}
                  {/* Validation - visible uniquement pour les admins */}
                  {isAdmin && (
                    <Link
                      to="/payment-validation"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/payment-validation'
                          ? 'bg-white text-cote-ivoire-primary' 
                          : 'text-white hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Validation
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin/cashiers"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/admin/cashiers'
                          ? 'bg-white text-cote-ivoire-primary' 
                          : 'text-white hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <Shield className="h-4 w-4 inline mr-1" />
                      Admin
                    </Link>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full border border-white/30">
                    <CreditCard className="h-4 w-4 text-white" />
                    <span className="text-sm text-white font-medium">
                      {user.remainingCredits} crédits
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">{user.name}</span>
                  </div>
                  
                  <button
                    onClick={logout}
                    className="text-white hover:text-white/80 p-1 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="max-w-screen-2xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
