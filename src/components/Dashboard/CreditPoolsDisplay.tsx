import React, { useState, useEffect } from 'react';
import { CreditPool, CreditUsage } from '../../types';
import { getUserCreditPools, getCreditUsageHistory } from '../../services/creditFIFOService';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet, TrendingUp, Package, ShoppingCart, ArrowRight } from 'lucide-react';

interface CreditPoolsDisplayProps {
  className?: string;
}

const CreditPoolsDisplay: React.FC<CreditPoolsDisplayProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [creditPools, setCreditPools] = useState<CreditPool[]>([]);
  const [creditUsage, setCreditUsage] = useState<CreditUsage[]>([]);

  useEffect(() => {
    if (!user) {
      setCreditPools([]);
      setCreditUsage([]);
      return;
    }

    let isMounted = true;

    const fetchCredits = async () => {
      try {
        const pools = await getUserCreditPools(user.id);
        const usage = await getCreditUsageHistory(user.id);

        if (!isMounted) return;

        setCreditPools(Array.isArray(pools) ? pools : []);
        setCreditUsage(Array.isArray(usage) ? usage : []);
      } catch (error) {
        console.error('Erreur lors du chargement des pools de crédits:', error);
        if (!isMounted) return;
        setCreditPools([]);
        setCreditUsage([]);
      }
    };

    fetchCredits();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user || creditPools.length === 0) {
    return null;
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPoolStatus = (pool: CreditPool) => {
    if (!pool.isActive) return 'Inactif';
    if (pool.remainingCredits === 0) return 'Épuisé';
    if (pool.remainingCredits === pool.totalCredits) return 'Non utilisé';
    return 'Partiellement utilisé';
  };

  const getStatusBadgeColor = (pool: CreditPool) => {
    if (!pool.isActive) return 'bg-gray-100 text-gray-700';
    if (pool.remainingCredits === 0) return 'bg-red-100 text-red-700';
    if (pool.remainingCredits === pool.totalCredits) return 'bg-green-100 text-green-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const totalRemainingCredits = creditPools.reduce((sum, pool) => sum + pool.remainingCredits, 0);
  const totalUsedCredits = creditPools.reduce((sum, pool) => sum + (pool.totalCredits - pool.remainingCredits), 0);
  const totalPurchasedCredits = creditPools.reduce((sum, pool) => sum + pool.totalCredits, 0);
  const activePoolsCount = creditPools.filter(pool => pool.isActive && pool.remainingCredits > 0).length;
  
  // Calculer le pourcentage de consommation totale
  const totalConsumptionPercentage = totalPurchasedCredits > 0 
    ? Math.round((totalUsedCredits / totalPurchasedCredits) * 100) 
    : 0;

  // Trier les pools par date de création (FIFO - plus ancien en premier)
  const sortedPools = [...creditPools].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Trouver le pool en cours d'utilisation (premier pool FIFO avec des crédits restants)
  const currentPoolInUse = sortedPools.find(pool => 
    pool.isActive && pool.remainingCredits > 0
  );

  // Calculer le pourcentage de progression pour chaque pool
  const getProgressPercentage = (pool: CreditPool) => {
    if (pool.totalCredits === 0) return 0;
    const used = pool.totalCredits - pool.remainingCredits;
    return Math.round((used / pool.totalCredits) * 100);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Gestion des crédits
          </h3>

        {/* Résumé des crédits - 4 cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">{totalRemainingCredits}</div>
            <div className="text-sm text-green-600 mt-1">Crédits restants</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">{totalUsedCredits}</div>
            <div className="text-sm text-green-600 mt-1">Crédits utilisés</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">{activePoolsCount}</div>
            <div className="text-sm text-purple-600 mt-1">Pools actifs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalPurchasedCredits}</div>
            <div className="text-sm text-gray-600 mt-1">Total acheté</div>
          </div>
        </div>

        {/* Barre de progression de consommation totale */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Consommation totale de crédits</h4>
            <span className="text-sm font-bold text-gray-900">
              {totalConsumptionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="h-4 rounded-full transition-all duration-300 bg-orange-500"
              style={{ width: `${totalConsumptionPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>{totalUsedCredits} crédits utilisés</span>
            <span>{totalRemainingCredits} crédits restants</span>
          </div>
        </div>

        {/* Commande en cours d'utilisation */}
        {currentPoolInUse && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg animate-blink-border animate-blink-bg shadow-lg">
              <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                  </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Commande en cours d'utilisation</p>
                  <p className="text-xs text-green-700 mt-1">
                    {currentPoolInUse.orderNumber} - {currentPoolInUse.planName} 
                    ({currentPoolInUse.remainingCredits} crédits restants)
                  </p>
                  </div>
                </div>
                <div className="text-right">
                <div className="text-sm font-semibold text-green-900">
                  {getProgressPercentage(currentPoolInUse)}% utilisé
                  </div>
                <div className="w-32 bg-green-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(currentPoolInUse)}%` }}
                    />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Détails par souscription (FIFO) */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Détails par souscription (FIFO)
          </h4>
          
          {/* Tableau des pools de crédits */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Position FIFO</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date d'achat</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Numéro de commande</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Crédits achetés</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Crédits utilisés</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Crédits restants</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Progression</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedPools.map((pool, index) => {
                  const usedCredits = pool.totalCredits - pool.remainingCredits;
                  const progressPercentage = getProgressPercentage(pool);
                  const isCurrentPool = currentPoolInUse?.id === pool.id;
                  const fifoPosition = index + 1;
                  const totalPools = sortedPools.length;
                  const isFirst = fifoPosition === 1;
                  const isLast = fifoPosition === totalPools;
                  
                  return (
                    <tr 
                      key={pool.id} 
                      className={`border-b hover:bg-gray-50 ${
                        isCurrentPool 
                          ? 'bg-green-50 border-2 border-green-500 animate-blink-border animate-blink-bg shadow-md' 
                          : 'border-gray-100'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          {!isFirst && (
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <div className={`flex items-center justify-center min-w-[32px] h-8 px-2 rounded font-semibold text-sm ${
                            isCurrentPool
                              ? 'bg-green-500 text-white'
                              : isFirst && pool.isActive && pool.remainingCredits > 0
                              ? 'bg-green-100 text-green-700 border-2 border-green-500'
                              : pool.isActive && pool.remainingCredits > 0
                              ? 'bg-green-50 text-green-700 border border-green-300'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {fifoPosition}
                          </div>
                          {!isLast && (
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-2">
                          {isCurrentPool && (
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                          )}
                          <span className={isCurrentPool ? 'font-semibold text-green-900' : ''}>
                            {formatDate(pool.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${isCurrentPool ? 'text-green-900 font-semibold' : 'text-gray-700 font-medium'}`}>
                        {pool.orderNumber}
                      </td>
                      <td className={`py-3 px-4 font-medium ${isCurrentPool ? 'text-green-900' : 'text-gray-900'}`}>
                        {pool.totalCredits}
                      </td>
                      <td className={`py-3 px-4 ${isCurrentPool ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                        {usedCredits}
                      </td>
                      <td className={`py-3 px-4 font-medium ${isCurrentPool ? 'text-green-900' : 'text-gray-900'}`}>
                        {pool.remainingCredits}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-3 min-w-[120px]">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                progressPercentage === 100 
                                  ? 'bg-red-500' 
                                  : progressPercentage > 0 
                                  ? 'bg-yellow-400' 
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-700 font-medium min-w-[40px] text-right">
                            {progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isCurrentPool && getPoolStatus(pool) === 'Partiellement utilisé'
                            ? 'bg-green-200 text-green-800 border-2 border-green-500 animate-blink-border'
                            : getStatusBadgeColor(pool)
                        }`}>
                          {isCurrentPool && getPoolStatus(pool) === 'Partiellement utilisé' ? 'En cours d\'utilisation' : getPoolStatus(pool)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPoolsDisplay;
