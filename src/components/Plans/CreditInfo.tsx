import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserCreditPools, getCreditStatus } from '../../services/creditFIFOService';
import { CreditPool } from '../../types';
import { Info, CreditCard, Clock, CheckCircle } from 'lucide-react';

interface CreditStatus {
  totalCredits: number;
  remainingCredits: number;
  usedCredits: number;
  activePools: CreditPool[];
  hasAvailableCredits: boolean;
}

const CreditInfo: React.FC = () => {
  const { user } = useAuth();
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [creditPools, setCreditPools] = useState<CreditPool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCreditStatus(null);
      setCreditPools([]);
      setLoading(false);
      return;
    }

    const loadCreditData = async () => {
      try {
        setLoading(true);
        const [status, pools] = await Promise.all([
          getCreditStatus(user.id),
          getUserCreditPools(user.id)
        ]);
        setCreditStatus(status);
        setCreditPools(Array.isArray(pools) ? pools : []);
      } catch (error) {
        console.error('Erreur lors du chargement des crédits:', error);
        setCreditStatus({
          totalCredits: 0,
          remainingCredits: 0,
          usedCredits: 0,
          activePools: [],
          hasAvailableCredits: false,
        });
        setCreditPools([]);
      } finally {
        setLoading(false);
      }
    };

    loadCreditData();
  }, [user]);

  if (!user) return null;

  if (loading || !creditStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            État de vos Crédits
          </h3>
        </div>
        <div className="text-center py-4 text-gray-500">Chargement...</div>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          État de vos Crédits
        </h3>
      </div>

      {/* Résumé des crédits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">{creditStatus.remainingCredits}</div>
          <div className="text-sm text-blue-600">Crédits Restants</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">{creditStatus.usedCredits}</div>
          <div className="text-sm text-green-600">Crédits Utilisés</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-900">{creditStatus.activePools?.length || 0}</div>
          <div className="text-sm text-purple-600">Pools Actifs</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{creditStatus.totalCredits}</div>
          <div className="text-sm text-gray-600">Total Acheté</div>
        </div>
      </div>

      {/* Pools de crédits récents */}
      {creditPools && creditPools.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Pools de Crédits Récents</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {creditPools.slice(0, 3).map((pool, index) => (
              <div key={pool.id} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">#{index + 1}</span>
                  <span className="font-medium">{pool.planName}</span>
                  <span className="text-gray-500">({pool.orderNumber})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    pool.remainingCredits === 0 
                      ? 'bg-red-100 text-red-700' 
                      : pool.remainingCredits === pool.totalCredits
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pool.remainingCredits}/{pool.totalCredits}
                  </span>
                  <span className="text-gray-500">{formatDate(pool.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information sur le système FIFO */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Système FIFO Activé</h5>
            <p className="text-sm text-blue-700">
              Les crédits sont consommés dans l'ordre d'achat (premier acheté, premier utilisé). 
              Vous pouvez acheter de nouveaux crédits même si vous en avez encore.
            </p>
          </div>
        </div>
      </div>

      {/* Statut de disponibilité */}
      <div className="mt-4 flex items-center gap-2">
        {creditStatus.hasAvailableCredits ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Prêt pour de nouvelles simulations
            </span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 font-medium">
              Aucun crédit disponible - Achetez un plan pour continuer
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default CreditInfo;
