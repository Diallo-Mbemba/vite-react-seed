import React, { useState, useEffect } from 'react';
import { Search, Edit, Save, X, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { VOCProduct } from '../../types/voc';
import { getVOCProducts, saveVOCProducts } from '../../data/voc';

const VOCDataTable: React.FC = () => {
  const [products, setProducts] = useState<VOCProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VOCProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<VOCProduct>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [filterColumn, setFilterColumn] = useState('all');
  const [filterExempte, setFilterExempte] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      const data = await getVOCProducts();
      setProducts(data);
      setFilteredProducts(data);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        switch (filterColumn) {
          case 'code':
            return product.codeSH.toLowerCase().includes(query);
          case 'designation':
            return product.designation.toLowerCase().includes(query);
          case 'all':
          default:
            return product.codeSH.toLowerCase().includes(query) ||
                   product.designation.toLowerCase().includes(query);
        }
      });
    }

    // Filtre par statut d'exemption
    if (filterExempte !== 'all') {
      const isExempte = filterExempte === 'exempte';
      filtered = filtered.filter(product => product.exempte === isExempte);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, products, filterColumn, filterExempte]);

  const handleEdit = (product: VOCProduct) => {
    setEditingId(product.codeSH);
    setEditData({
      exempte: product.exempte,
      observation: product.observation || ''
    });
  };

  const handleSave = (product: VOCProduct) => {
    const updatedProduct = { ...product, ...editData };
    const updatedProducts = products.map(p => 
      p.codeSH === product.codeSH ? updatedProduct : p
    );
    setProducts(updatedProducts);
    saveVOCProducts(updatedProducts);
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleInputChange = (field: keyof VOCProduct, value: string | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-300">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-cote-ivoire-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Données VOC</h3>
          </div>
          <div className="text-sm text-gray-600">
            {filteredProducts.length} produits sur {products.length} total
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par code ou désignation..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Statut d'exemption :</label>
                  <select
                    value={filterExempte}
                    onChange={(e) => setFilterExempte(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Tous</option>
                    <option value="exempte">Exemptés</option>
                    <option value="non-exempte">Non exemptés</option>
                  </select>
                </div>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code SH</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exempté</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product, index) => (
              <tr key={`${product.codeSH}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-cote-ivoire-primary">
                  {product.codeSH}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={product.designation}>
                  {product.designation}
                </td>
                
                {/* Exempté */}
                <td className="px-4 py-3 text-sm">
                  {editingId === product.codeSH ? (
                    <select
                      value={editData.exempte ? '1' : '0'}
                      onChange={(e) => handleInputChange('exempte', e.target.value === '1')}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="1">Oui</option>
                      <option value="0">Non</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.exempte 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.exempte ? 'Oui' : 'Non'}
                    </span>
                  )}
                </td>

                {/* Observation */}
                <td className="px-4 py-3 text-sm">
                  {editingId === product.codeSH ? (
                    <input
                      type="text"
                      value={editData.observation || ''}
                      onChange={(e) => handleInputChange('observation', e.target.value)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-gray-900">{product.observation || '-'}</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-sm">
                  {editingId === product.codeSH ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(product)}
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
                      onClick={() => handleEdit(product)}
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
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length} résultats
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

      {filteredProducts.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucun produit trouvé. Essayez de modifier vos critères de recherche.
        </div>
      )}
    </div>
  );
};

export default VOCDataTable; 
