import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Loader, Database, Trash2 } from 'lucide-react';
import { importTECFromExcel, importVOCFromExcel, importTarifPORTFromExcel, ImportResult } from '../../services/excelImportService';
import { referenceDataService } from '../../services/supabase/referenceDataService';

type DataType = 'tec' | 'voc' | 'tarifport';

const ReferenceDataImportPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DataType>('tec');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [clearExisting, setClearExisting] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un fichier Excel
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setResult({
        success: false,
        imported: 0,
        errors: ['Le fichier doit être un fichier Excel (.xlsx, .xls) ou CSV'],
        warnings: [],
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let importResult: ImportResult;

      switch (selectedType) {
        case 'tec':
          importResult = await importTECFromExcel(file, clearExisting);
          break;
        case 'voc':
          importResult = await importVOCFromExcel(file, clearExisting);
          break;
        case 'tarifport':
          importResult = await importTarifPORTFromExcel(file, clearExisting);
          break;
        default:
          throw new Error('Type de données non reconnu');
      }

      setResult(importResult);
    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        errors: [error.message || 'Erreur lors de l\'import'],
        warnings: [],
      });
    } finally {
      setLoading(false);
      // Réinitialiser l'input pour permettre de recharger le même fichier
      event.target.value = '';
    }
  };

  const handleClearData = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les données ${selectedType.toUpperCase()} ? Cette action est irréversible.`)) {
      return;
    }

    setLoading(true);
    try {
      switch (selectedType) {
        case 'tec':
          await referenceDataService.clearAllTECArticles();
          break;
        case 'voc':
          await referenceDataService.clearAllVOCProducts();
          break;
        case 'tarifport':
          await referenceDataService.clearAllTarifPORTProducts();
          break;
      }
      setResult({
        success: true,
        imported: 0,
        errors: [],
        warnings: [`Toutes les données ${selectedType.toUpperCase()} ont été supprimées`],
      });
    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        errors: [error.message || 'Erreur lors de la suppression'],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getDataTypeInfo = (type: DataType) => {
    switch (type) {
      case 'tec':
        return {
          name: 'TEC (Tarif Extérieur Commun)',
          description: 'Articles du tarif extérieur commun avec codes SH, droits de douane, taxes, etc.',
          requiredColumns: ['Code SH10', 'Désignation'],
          optionalColumns: ['US', 'DD', 'RSTA', 'PCS', 'PUA', 'PCC', 'RRR', 'RCP', 'TVA', 'Code SH6', 'TUB', 'DUS', 'DUD', 'TCB', 'TSM', 'TSB', 'PSV', 'TAI', 'TAB', 'TUF'],
        };
      case 'voc':
        return {
          name: 'VOC (Vérification d\'Origine des Conteneurs)',
          description: 'Produits soumis à vérification d\'origine avec codes SH et statut d\'exemption',
          requiredColumns: ['Code SH', 'Désignation'],
          optionalColumns: ['Observation', 'Exempté'],
        };
      case 'tarifport':
        return {
          name: 'TarifPORT',
          description: 'Produits du tarif portuaire avec libellés, chapitres et codes de redevance',
          requiredColumns: ['Libellé Produit'],
          optionalColumns: ['Chapitre', 'TP', 'Code Redevance'],
        };
    }
  };

  const dataTypeInfo = getDataTypeInfo(selectedType);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Import des Données de Référence
            </h1>
            <p className="text-gray-600">
              Importez les données TEC, VOC et TarifPORT depuis des fichiers Excel
            </p>
          </div>
          <Database className="h-8 w-8 text-blue-600" />
        </div>

        {/* Sélection du type de données */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de données à importer
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(['tec', 'voc', 'tarifport'] as DataType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setResult(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {getDataTypeInfo(type).name}
                </div>
                <div className="text-xs text-gray-600">
                  {type.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Informations sur le format */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Format du fichier Excel
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                {dataTypeInfo.description}
              </p>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-blue-900">Colonnes obligatoires :</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {dataTypeInfo.requiredColumns.map((col) => (
                      <span
                        key={col}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                {dataTypeInfo.optionalColumns.length > 0 && (
                  <div>
                    <span className="font-medium text-blue-900">Colonnes optionnelles :</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dataTypeInfo.optionalColumns.map((col) => (
                        <span
                          key={col}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Remplacer toutes les données existantes (supprime les données actuelles avant l'import)
            </span>
          </label>
        </div>

        {/* Zone de téléchargement */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer flex flex-col items-center space-y-4 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader className="h-12 w-12 text-blue-600 animate-spin" />
                <div className="text-gray-600">Import en cours...</div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <span className="text-blue-600 font-medium">
                    Cliquez pour sélectionner un fichier Excel
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    ou glissez-déposez le fichier ici
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Formats acceptés: .xlsx, .xls, .csv
                </div>
              </>
            )}
          </label>
        </div>

        {/* Bouton de suppression */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer toutes les données {selectedType.toUpperCase()}</span>
          </button>
        </div>

        {/* Résultat de l'import */}
        {result && (
          <div className={`mt-6 rounded-lg p-4 ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Import réussi' : 'Erreur lors de l\'import'}
                </h3>
                
                {result.success && (
                  <div className="text-green-800 mb-2">
                    <strong>{result.imported}</strong> enregistrement(s) importé(s) avec succès
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="mb-2">
                    <div className="font-medium text-red-900 mb-1">Erreurs :</div>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div>
                    <div className="font-medium text-yellow-900 mb-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Avertissements :</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceDataImportPage;


