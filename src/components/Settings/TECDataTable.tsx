import React, { useState, useEffect } from 'react';
import { Search, Edit, Save, X, Database, ChevronLeft, ChevronRight, Filter, Info } from 'lucide-react';
import { TECArticle } from '../../types/tec';
import { getTECArticles, saveTECArticles } from '../../data/tec';

const TECDataTable: React.FC = () => {
  const [articles, setArticles] = useState<TECArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<TECArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TECArticle>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [filterColumn, setFilterColumn] = useState('all');

  useEffect(() => {
    const data = getTECArticles();
    setArticles(data);
    setFilteredArticles(data);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => {
        const query = searchQuery.toLowerCase();
        switch (filterColumn) {
          case 'code':
            return article.sh10Code.toLowerCase().includes(query);
          case 'designation':
            return article.designation.toLowerCase().includes(query);
          case 'all':
          default:
            return article.sh10Code.toLowerCase().includes(query) ||
                   article.designation.toLowerCase().includes(query);
        }
      });
      setFilteredArticles(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, articles, filterColumn]);

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return value > 0 ? `${value.toFixed(2)}%` : '0.00%';
  };

  const handleEdit = (article: TECArticle) => {
    setEditingId(article.sh10Code);
    setEditData({
      dd: article.dd || 0,
      rsta: article.rsta || 0,
      pcs: article.pcs || 0,
      pua: article.pua || 0,
      pcc: article.pcc || 0,
      rrr: article.rrr || 0,
      rcp: article.rcp || 0,
      tva: article.tva || 0,
      cumulSansTVA: article.cumulSansTVA || 0,
      cumulAvecTVA: article.cumulAvecTVA || 0
    });
  };

  const handleSave = (article: TECArticle) => {
    const updatedArticle = { ...article, ...editData };
    const updatedArticles = articles.map(a => 
      a.sh10Code === article.sh10Code ? updatedArticle : a
    );
    setArticles(updatedArticles);
    saveTECArticles(updatedArticles);
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleInputChange = (field: keyof TECArticle, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditData(prev => ({ ...prev, [field]: numValue }));
  };

  // Fonction pour créer le contenu de l'infobulle
  const createTooltipContent = (article: TECArticle) => {
    return `
      <div style="padding: 20px; max-width: 500px; background: linear-gradient(135deg, #1a5f3a 0%, #2d5a3d 100%); border: 2px solid #4ade80; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        
        <!-- En-tête avec code SH10 et SH6 -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #4ade80;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #fbbf24; margin-bottom: 5px;">${article.sh10Code}</div>
            <div style="font-size: 14px; color: #e5e7eb;">Unité: ${article.us}</div>
          </div>
          <div style="font-size: 18px; font-weight: bold; color: #fbbf24;">${article.sh6Code}</div>
        </div>

        <!-- Désignation du produit -->
        <div style="background: rgba(251, 191, 36, 0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #fbbf24;">
          <div style="font-weight: bold; color: #fbbf24; margin-bottom: 8px; font-size: 16px;">DÉSIGNATION DU PRODUIT</div>
          <div style="font-size: 13px; line-height: 1.4; color: #e5e7eb;">${article.designation}</div>
        </div>

        <!-- Taux principaux -->
        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; color: #4ade80; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #4ade80; padding-bottom: 5px;">TAUX PRINCIPAUX</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
            <div><strong style="color: #4ade80;">DD:</strong> <span style="color: #4ade80;">${formatPercentage(article.dd)}</span></div>
            <div><strong style="color: #4ade80;">RSTA:</strong> <span style="color: #4ade80;">${formatPercentage(article.rsta)}</span></div>
            <div><strong style="color: #4ade80;">TVA:</strong> <span style="color: #4ade80;">${formatPercentage(article.tva)}</span></div>
            <div><strong style="color: #4ade80;">Cumul A/TVA:</strong> <span style="color: #4ade80;">${formatPercentage(article.cumulAvecTVA)}</span></div>
          </div>
        </div>

        <!-- Taux détaillés -->
        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; color: #60a5fa; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #60a5fa; padding-bottom: 5px;">TAUX DÉTAILLÉS</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
            <div><strong style="color: #60a5fa;">PCS:</strong> <span style="color: #60a5fa;">${formatPercentage(article.pcs)}</span></div>
            <div><strong style="color: #60a5fa;">PUA:</strong> <span style="color: #60a5fa;">${formatPercentage(article.pua)}</span></div>
            <div><strong style="color: #60a5fa;">PCC:</strong> <span style="color: #60a5fa;">${formatPercentage(article.pcc)}</span></div>
            <div><strong style="color: #60a5fa;">Cumul S/TVA:</strong> <span style="color: #60a5fa;">${formatPercentage(article.cumulSansTVA)}</span></div>
            <div><strong style="color: #60a5fa;">RRR:</strong> <span style="color: #60a5fa;">${formatPercentage(article.rrr)}</span></div>
            <div><strong style="color: #60a5fa;">RCP:</strong> <span style="color: #60a5fa;">${formatPercentage(article.rcp)}</span></div>
          </div>
        </div>

        <!-- Codes spéciaux -->
        <div>
          <div style="font-weight: bold; color: #a78bfa; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #a78bfa; padding-bottom: 5px;">CODES SPÉCIAUX</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
            <div><strong style="color: #a78bfa;">TUB:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tub) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">DUS:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.dus) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">DUD:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.dud) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">TCB:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tcb) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">TSM:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tsm) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">TSB:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tsb) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">PSV:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.psv) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">TAI:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tai) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">TAB:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tab) || 0)}</span></div>
            <div><strong style="color: #a78bfa;">TUF:</strong> <span style="color: #a78bfa;">${formatPercentage(parseFloat(article.tuf) || 0)}</span></div>
          </div>
        </div>
      </div>
    `;
  };

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-300">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-cote-ivoire-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Données TEC</h3>
          </div>
          <div className="text-sm text-gray-600">
            {filteredArticles.length} articles sur {articles.length} total
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par code SH ou désignation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg border flex items-center space-x-2 ${
                showFilters 
                  ? 'bg-cote-ivoire-primary text-white border-cote-ivoire-primary' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Rechercher dans :</label>
                <select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Tous les champs</option>
                  <option value="code">Code SH uniquement</option>
                  <option value="designation">Désignation uniquement</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code SH10</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DD %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSTA %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCS %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PUA %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCC %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RRR %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCP %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulé sans TVA %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulé avec TVA %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVA %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentArticles.map((article, index) => (
              <tr 
                key={`${article.sh10Code}-${index}`} 
                className="hover:bg-gray-50 cursor-pointer group relative"
                title="Survolez pour voir la fiche complète"
                onMouseEnter={(e) => {
                  // Supprimer l'ancien tooltip s'il existe
                  const existingTooltip = document.getElementById('tooltip-' + article.sh10Code);
                  if (existingTooltip) {
                    existingTooltip.remove();
                  }
                  
                  const tooltip = document.createElement('div');
                  tooltip.style.position = 'fixed';
                  tooltip.style.zIndex = '9999';
                  tooltip.style.left = `${e.clientX + 15}px`;
                  tooltip.style.top = `${e.clientY - 10}px`;
                  tooltip.style.pointerEvents = 'none';
                  tooltip.innerHTML = createTooltipContent(article);
                  tooltip.id = 'tooltip-' + article.sh10Code;
                  document.body.appendChild(tooltip);
                  
                  // Afficher le tooltip immédiatement
                  setTimeout(() => {
                    if (tooltip.parentNode) {
                      tooltip.style.opacity = '1';
                    }
                  }, 10);
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById('tooltip-' + article.sh10Code);
                  if (tooltip) {
                    tooltip.remove();
                  }
                }}
              >
                <td className="px-4 py-3 text-sm font-medium text-cote-ivoire-primary">
                  <div className="flex items-center space-x-2">
                    <span>{article.sh10Code}</span>
                    <Info className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={article.designation}>
                  {article.designation}
                </td>
                
                {/* US */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="text"
                      value={editData.us || ''}
                      onChange={(e) => handleInputChange('us', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{article.us || ''}</span>
                  )}
                </td>
                
                {/* DD */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.dd || 0}
                      onChange={(e) => handleInputChange('dd', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.dd)}</span>
                  )}
                </td>

                {/* RSTA */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.rsta || 0}
                      onChange={(e) => handleInputChange('rsta', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.rsta)}</span>
                  )}
                </td>

                {/* PCS */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.pcs || 0}
                      onChange={(e) => handleInputChange('pcs', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.pcs)}</span>
                  )}
                </td>

                {/* PUA */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.pua || 0}
                      onChange={(e) => handleInputChange('pua', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.pua)}</span>
                  )}
                </td>

                {/* PCC */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.pcc || 0}
                      onChange={(e) => handleInputChange('pcc', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.pcc)}</span>
                  )}
                </td>

                {/* RRR */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.rrr || 0}
                      onChange={(e) => handleInputChange('rrr', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.rrr)}</span>
                  )}
                </td>

                {/* RCP */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.rcp || 0}
                      onChange={(e) => handleInputChange('rcp', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.rcp)}</span>
                  )}
                </td>

                {/* Cumul Sans TVA */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.cumulSansTVA || 0}
                      onChange={(e) => handleInputChange('cumulSansTVA', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.cumulSansTVA)}</span>
                  )}
                </td>

                {/* Cumul Avec TVA */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.cumulAvecTVA || 0}
                      onChange={(e) => handleInputChange('cumulAvecTVA', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.cumulAvecTVA)}</span>
                  )}
                </td>

                {/* TVA */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.tva || 0}
                      onChange={(e) => handleInputChange('tva', e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{formatPercentage(article.tva)}</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-sm">
                  {editingId === article.sh10Code ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(article)}
                        className="text-green-600 hover:text-green-800"
                        title="Sauvegarder"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-800"
                        title="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(article)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredArticles.length)} sur {filteredArticles.length} résultats
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === page
                        ? 'bg-cote-ivoire-primary text-white border-cote-ivoire-primary'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredArticles.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucun article trouvé. Essayez de modifier vos critères de recherche.
        </div>
      )}
    </div>
  );
};

export default TECDataTable; 
