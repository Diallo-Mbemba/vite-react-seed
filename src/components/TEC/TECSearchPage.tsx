import React, { useState, useEffect } from 'react';
import { Search, FileText, Hash, Database, X } from 'lucide-react';
import { TECArticle } from '../../types/tec';
import { getTECArticles, searchTECArticlesByCode, searchTECArticlesByDesignation } from '../../data/tec';
import TECTooltip from './TECTooltip';

const TECSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'designation'>('code');
  const [results, setResults] = useState<TECArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalArticles, setTotalArticles] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<TECArticle | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Charger le nombre total d'articles au démarrage
  useEffect(() => {
    const articles = getTECArticles();
    setTotalArticles(articles.length);
  }, []);

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
        searchResults = searchTECArticlesByCode(searchQuery);
      } else {
        searchResults = searchTECArticlesByDesignation(searchQuery);
      }
      
      setResults(searchResults.slice(0, 100)); // Limiter à 100 résultats
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '-';
    }
    return value > 0 ? `${value.toFixed(2)}%` : '-';
  };

  // Gestion du survol pour afficher le tooltip
  const handleRowHover = (article: TECArticle, event: React.MouseEvent) => {
    setSelectedArticle(article);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setIsTooltipVisible(true);
  };

  // Gestion de la fin du survol
  const handleRowLeave = () => {
    setIsTooltipVisible(false);
    setSelectedArticle(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <div className="flex items-center space-x-3 mb-2">
          <Database className="h-8 w-8 text-cote-ivoire-primary" />
          <h1 className="text-2xl font-bold text-white">
            Recherche TEC (Tarif Extérieur Commun)
          </h1>
        </div>
        <p className="text-gray-600">
          Recherchez les codes SH et leurs tarifs douaniers associés
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="bg-cote-ivoire-primary/50 px-3 py-1 rounded-full border border-cote-ivoire-primary">
            <span className="text-cote-ivoire-primary text-sm font-medium">
              {totalArticles} articles disponibles
            </span>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h2 className="text-lg font-semibold text-white mb-4">Recherche d'articles</h2>
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
              <Hash className="h-4 w-4 text-gray-800" />
              <span className="text-sm font-medium text-gray-800">Code SH</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="designation"
                checked={searchType === 'designation'}
                onChange={(e) => setSearchType(e.target.value as 'code' | 'designation')}
                className="text-cote-ivoire-primary"
              />
              <FileText className="h-4 w-4 text-gray-800" />
              <span className="text-sm font-medium text-gray-800">Désignation</span>
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
              className="w-full pl-14 pr-4 py-3 bg-cote-ivoire-lighter border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
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
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-300">
          <div className="p-4 border-b border-gray-300">
            <h3 className="text-lg font-semibold text-white">Résultats de la recherche</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cote-ivoire-lighter">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Code SH10</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Désignation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">US</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">DD %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">RSTA %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">PCS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">PUA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">PCC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">RRR</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">RCP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TVA %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Cumul S/TVA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Cumul A/TVA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TUB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">DUS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">DUD</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TCB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TSM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TSB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">PSV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TAI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TAB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">TUF</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">SH6</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-700">
                {results.map((article, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-green-800 cursor-pointer"
                    onMouseEnter={(e) => handleRowHover(article, e)}
                    onMouseLeave={handleRowLeave}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-cote-ivoire-primary hover:text-white">{article.sh10Code}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white max-w-xs truncate">
                      {article.designation}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cote-ivoire-lighter text-gray-800 hover:bg-white hover:text-green-800">
                        {article.us}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.dd)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.rsta)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.pcs)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.pua)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.pcc)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.rrr)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.rcp)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{formatPercentage(article.tva)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cote-ivoire-lighter text-gray-800 hover:bg-white hover:text-green-800">
                        {formatPercentage(article.cumulSansTVA)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cote-ivoire-primary/50 text-cote-ivoire-primary hover:bg-white hover:text-green-800">
                        {formatPercentage(article.cumulAvecTVA)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tub || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.dus || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.dud || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tcb || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tsm || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tsb || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.psv || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tai || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tab || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.tuf || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 hover:text-white">{article.sh6Code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {searchQuery.length >= 2 && !isLoading && results.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Aucun article trouvé pour "{searchQuery}"</p>
          <p className="text-sm mt-2 text-gray-500">Essayez avec d'autres termes de recherche</p>
        </div>
      )}

      {/* Tooltip de fiche produit */}
      <TECTooltip
        article={selectedArticle}
        isVisible={isTooltipVisible}
        position={tooltipPosition}
      />
    </div>
  );
};

export default TECSearchPage; 
