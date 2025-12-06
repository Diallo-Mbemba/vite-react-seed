import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SimulationProvider } from './contexts/SimulationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import SimulatorForm from './components/Simulator/SimulatorForm';
import PlansPage from './components/Plans/PlansPage';
import SettingsPage from './components/SettingsPage';
import ActorsPage from './components/Actors/ActorsPage';
import HomePage from './components/Home/HomePage';
import TECSearchPage from './components/TEC/TECSearchPage';
import PaymentSuccess from './pages/PaymentSuccess';

import InvoiceHistoryPage from './components/Simulator/InvoiceHistoryPage';
import OICCashierPage from './components/Payment/OICCashierPage';
import PaymentValidationPage from './components/Payment/PaymentValidationPage';
import PaymentGuard from './components/Payment/PaymentGuard';
import CashierManagementPage from './components/Admin/CashierManagementPage';
import { useAdmin } from './hooks/useAdmin';

const SimulatorRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Autoriser uniquement si on vient du dashboard (bouton dédiée)
  const fromDashboard = (location.state as any)?.fromDashboard;
  if (!fromDashboard) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Guard pour les routes admin uniquement
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAdmin();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Guard pour les routes admin et caissier
const AdminOrCashierGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isCashier, loading } = useAdmin();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cote-ivoire-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin && !isCashier) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [_currentPage, _setCurrentPage] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Fermer le modal d'authentification quand l'utilisateur est connecté
  React.useEffect(() => {
    if (isAuthenticated) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <HomePage 
          onLogin={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
          onRegister={() => {
            setAuthMode('register');
            setShowAuthModal(true);
          }}
        />
        
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative">
              {authMode === 'login' ? (
                <LoginForm 
                  onToggleForm={() => setAuthMode('register')}
                  onClose={() => setShowAuthModal(false)}
                />
              ) : (
                <RegisterForm 
                  onToggleForm={() => setAuthMode('login')}
                  onClose={() => setShowAuthModal(false)}
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/simulator" element={
          <SimulatorRouteGuard>
            <PaymentGuard>
              <SimulatorForm />
            </PaymentGuard>
          </SimulatorRouteGuard>
        } />
        <Route path="/simulator/:id" element={
          <SimulatorRouteGuard>
            <PaymentGuard>
              <SimulatorForm />
            </PaymentGuard>
          </SimulatorRouteGuard>
        } />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/actors" element={<ActorsPage />} />
        {/* Paramètres - Admin uniquement */}
        <Route path="/settings" element={
          <AdminGuard>
            <SettingsPage />
          </AdminGuard>
        } />
        <Route path="/tec" element={<TECSearchPage />} />
        <Route path="/invoice-history" element={<InvoiceHistoryPage />} />
        {/* Caisse OIC - Admin et Caissier */}
        <Route path="/oic-cashier" element={
          <AdminOrCashierGuard>
            <OICCashierPage />
          </AdminOrCashierGuard>
        } />
        {/* Validation - Admin uniquement */}
        <Route path="/payment-validation" element={
          <AdminGuard>
            <PaymentValidationPage />
          </AdminGuard>
        } />
        {/* Gestion des caissiers - Admin uniquement */}
        <Route path="/admin/cashiers" element={
          <AdminGuard>
            <CashierManagementPage />
          </AdminGuard>
        } />
        <Route path="/payment/success" element={<PaymentSuccess />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <SimulationProvider>
            <Router>
              <MainApp />
            </Router>
          </SimulationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
