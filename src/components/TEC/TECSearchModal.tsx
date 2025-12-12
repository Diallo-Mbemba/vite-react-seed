import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Hash } from 'lucide-react';
import { TECArticle } from '../../types/tec';
import { searchTECArticlesByCodeSync, searchTECArticlesByDesignationSync } from '../../data/tec';

interface TECSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (article: TECArticle) => void;
}

const TECSearchModal: React.FC<TECSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'designation'>('code');
  const [results, setResults] = useState<TECArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effectuer la recherche quand la requête change
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simuler un délai pour l'expérience utilisateur
    const timeoutId = setTimeout(() => {
      let searchResults: TECArticle[] = [];
      
      if (searchType === 'code') {
        searchResults = searchTECArticlesByCodeSync(searchQuery);
      } else {
        searchResults = searchTECArticlesByDesignationSync(searchQuery);
      }
      
      setResults(searchResults.slice(0, 50)); // Limiter à 50 résultats
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const handleSelect = (article: TECArticle) => {
    onSelect(article);
    onClose();
    setSearchQuery('');
    setResults([]);
  };

  const formatPercentage = (value: number) => {
    return value > 0 ? `${value.toFixed(2)}%` : '-';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-cote-ivoire-primary" />
              <h2 className="text-xl font-semibold text-gray-900">
                Recherche TEC (Tarif Extérieur Commun)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-4">
            {/* Type de recherche */}
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="code"
                  checked={searchType === 'code'}
                  onChange={(e) => setSearchType(e.target.value as 'code' | 'designation')}
                  className="text-cote-ivoire-primary"
                />
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Code SH</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="designation"
                  checked={searchType === 'designation'}
                  onChange={(e) => setSearchType(e.target.value as 'code' | 'designation')}
                  className="text-cote-ivoire-primary"
                />
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Désignation</span>
              </label>
            </div>

            {/* Champ de recherche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchType === 'code' 
                    ? "Rechercher par code SH (minimum 2 caractères)..." 
                    : "Rechercher par désignation (minimum 2 caractères)..."
                }
                className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Statistiques */}
            <div className="text-sm text-gray-600">
              {searchQuery.length >= 2 ? (
                isLoading ? (
                  <span>Recherche en cours...</span>
                ) : (
                  <span>{results.length} résultat(s) trouvé(s)</span>
                )
              ) : (
                <span>Entrez au moins 2 caractères pour commencer la recherche</span>
              )}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {results.map((article, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(article)}
                  className="p-4 hover:bg-cote-ivoire-success hover:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm bg-cote-ivoire-primary text-cote-ivoire-primary px-2 py-1 rounded">
                          {article.sh10Code}
                        </span>
                        {article.sh6Code && (
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            SH6: {article.sh6Code}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {article.designation}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>US: {article.us}</span>
                        <span>DD: {formatPercentage(article.dd)}</span>
                        <span>RSTA: {formatPercentage(article.rsta)}</span>
                        <span>TVA: {formatPercentage(article.tva)}</span>
                        <span>Cumul: {formatPercentage(article.cumulAvecTVA)}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>PCS: {formatPercentage(article.pcs)}</div>
                        <div>PUA: {formatPercentage(article.pua)}</div>
                        <div>PCC: {formatPercentage(article.pcc)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 && !isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-800" />
              <p>Aucun article trouvé pour "{searchQuery}"</p>
              <p className="text-sm mt-2">Essayez avec d'autres termes de recherche</p>
            </div>
          ) : null}
        </div>

        {/* Pied de page */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Articles TEC disponibles dans la base
            </span>
            <span>
              Cliquez sur un article pour le sélectionner
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TECSearchModal; 
