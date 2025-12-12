import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Database, FileText, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { loadSampleTarifPORTData } from '../../data/tarifportSampleData';
import { TarifPORTProduct } from '../../types/tarifport';
import { referenceDataService } from '../../services/supabase/referenceDataService';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';

const TarifPORTManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [products, setProducts] = useState<TarifPORTProduct[]>([]);
  const [searchLibelle, setSearchLibelle] = useState('');
  const [searchChapitre, setSearchChapitre] = useState('');
  const [searchTP, setSearchTP] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<TarifPORTProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [_loading, setLoading] = useState(true);

  // Charger les produits depuis Supabase au démarrage
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const referenceData = await referenceDataService.getReferenceData('tarifport');
        
        if (referenceData && referenceData.data && Array.isArray(referenceData.data)) {
          setProducts(referenceData.data);
        } else {
          // Fallback vers localStorage pour migration progressive
          const savedProducts = localStorage.getItem('tarifportProducts');
          if (savedProducts) {
            try {
              setProducts(JSON.parse(savedProducts));
            } catch (error) {
              console.error('Erreur lors du parsing localStorage:', error);
              setProducts([]);
            }
          } else {
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        // Fallback vers localStorage
        const savedProducts = localStorage.getItem('tarifportProducts');
        if (savedProducts) {
          try {
            setProducts(JSON.parse(savedProducts));
          } catch (parseError) {
            console.error('Erreur lors du parsing localStorage:', parseError);
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filtrer les produits selon les critères de recherche
  useEffect(() => {
    let filtered = products;

    if (searchLibelle.trim()) {
      filtered = filtered.filter(product => 
        product.libelle_produit.toLowerCase().includes(searchLibelle.toLowerCase())
      );
    }

    if (searchChapitre.trim()) {
      filtered = filtered.filter(product => 
        product.chapitre.toLowerCase().includes(searchChapitre.toLowerCase())
      );
    }

    if (searchTP.trim()) {
      filtered = filtered.filter(product => 
        product.tp.toLowerCase().includes(searchTP.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchLibelle, searchChapitre, searchTP]);

  // Gérer l'upload du fichier Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) {
          setIsUploading(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Ignorer la première ligne (en-têtes)
        const rows = jsonData.slice(1);

        const parsedProducts: TarifPORTProduct[] = rows
          .filter((row: any) => row.length >= 4) // Vérifier qu'il y a au moins 4 colonnes
          .map((row: any) => ({
            libelle_produit: String(row[0] || ''),
            chapitre: String(row[1] || ''),
            tp: String(row[2] || ''),
            coderedevance: String(row[3] || ''),
          }))
          .filter(product => product.libelle_produit && product.chapitre); // Filtrer les lignes vides

        setProducts(parsedProducts);
        
        // Sauvegarder dans Supabase (admin uniquement)
        if (!isAdmin) {
          alert('Seuls les administrateurs peuvent modifier les données de référence.');
          setIsUploading(false);
          return;
        }

        referenceDataService.saveReferenceData('tarifport', parsedProducts, user?.id)
          .then(() => {
            alert(`${parsedProducts.length} produits TarifPORT ont été importés avec succès !`);
          })
          .catch((error) => {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde. Vérifiez vos droits administrateur.');
          });
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import du fichier Excel');
    } finally {
      setIsUploading(false);
    }
  };

  // Vider la table
  const clearTable = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent supprimer les données de référence.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir vider toute la table TarifPORT ?')) {
      try {
        await referenceDataService.deleteReferenceData('tarifport');
        setProducts([]);
        alert('Table TarifPORT vidée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Charger les données d'exemple
  const loadSampleData = async () => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent modifier les données de référence.');
      return;
    }

    if (window.confirm('Voulez-vous charger les données d\'exemple TarifPORT ? Cela remplacera les données existantes.')) {
      try {
        const sampleData = loadSampleTarifPORTData();
        await referenceDataService.saveReferenceData('tarifport', sampleData, user?.id);
        setProducts(sampleData);
        alert(`${sampleData.length} produits d'exemple ont été chargés avec succès !`);
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'exemple:', error);
        alert('Erreur lors du chargement des données d\'exemple. Vérifiez vos droits administrateur.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <div className="flex items-center space-x-3 mb-2">
          <Database className="h-8 w-8 text-cote-ivoire-primary" />
          <h1 className="text-2xl font-bold text-white">
            Gestion du TarifPORT
          </h1>
        </div>
        <p className="text-gray-600">
          Importez les tarifs portuaires depuis un fichier Excel. Le fichier doit contenir 4 colonnes : Libellé produit, Chapitre, TP, Code redevance.
        </p>
      </div>

      {/* Section Produits TarifPORT en base */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Produits TarifPORT en base</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-cote-ivoire-primary">{products.length}</span>
            <button
              onClick={loadSampleData}
              className="flex items-center space-x-2 px-4 py-2 bg-cote-ivoire-success text-white rounded-lg hover:bg-cote-ivoire-success transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Données d'exemple</span>
            </button>
            <button
              onClick={clearTable}
              className="flex items-center space-x-2 px-4 py-2 bg-cote-ivoire-primary text-white rounded-lg hover:bg-cote-ivoire-primary transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Vider la table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Fichier Excel TarifPORT */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Fichier Excel TarifPORT</h2>
        <div className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cote-ivoire-primary file:text-cote-ivoire-primary hover:file:bg-cote-ivoire-primary"
          />
          <button
            disabled={isUploading}
            className="flex items-center space-x-2 px-6 py-3 bg-cote-ivoire-primary text-white rounded-lg hover:bg-cote-ivoire-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5" />
            <span>{isUploading ? 'Chargement...' : 'Charger le fichier TarifPORT'}</span>
          </button>
        </div>
      </div>

      {/* Format requis */}
      <div className="bg-cote-ivoire-secondary border border-cote-ivoire-secondary rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-cote-ivoire-secondary mt-0.5" />
          <div>
            <h3 className="font-semibold text-cote-ivoire-secondary mb-2">Format requis</h3>
            <p className="text-sm text-cote-ivoire-secondary">
              Le fichier Excel doit contenir 4 colonnes dans l'ordre suivant : Libellé produit, Chapitre, TP, Code redevance.
            </p>
          </div>
        </div>
      </div>

      {/* Filtres de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recherche et filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé produit
            </label>
            <input
              type="text"
              value={searchLibelle}
              onChange={(e) => setSearchLibelle(e.target.value)}
              placeholder="Rechercher par libellé..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapitre
            </label>
            <input
              type="text"
              value={searchChapitre}
              onChange={(e) => setSearchChapitre(e.target.value)}
              placeholder="Rechercher par chapitre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TP
            </label>
            <input
              type="text"
              value={searchTP}
              onChange={(e) => setSearchTP(e.target.value)}
              placeholder="Rechercher par TP..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-700">Libellé produit</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Chapitre</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">TP</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Code redevance</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-cote-ivoire-success hover:text-white">
                  <td className="py-4 px-6 text-gray-900">{product.libelle_produit}</td>
                  <td className="py-4 px-6 text-gray-900">{product.chapitre}</td>
                  <td className="py-4 px-6 text-gray-900">{product.tp}</td>
                  <td className="py-4 px-6 text-gray-900">{product.coderedevance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Aucun produit TarifPORT trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TarifPORTManagementPage; 
