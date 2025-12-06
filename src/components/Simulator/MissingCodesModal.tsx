import React, { useState } from 'react';
import { AlertTriangle, XCircle, FileText, Search, Info, Edit, Check, X } from 'lucide-react';
import { findTECArticleByCode, searchTECArticlesByCode, searchTECArticlesByDesignation, getTECTariffs } from '../../data/tec';

interface MissingCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (correctedCodes: Array<{
    originalCode: string;
    newCode: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
  }>) => void;
  missingCodes: Array<{
    codeHS: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
  }>;
}

const MissingCodesModal: React.FC<MissingCodesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  missingCodes
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [correctedCodes, setCorrectedCodes] = useState<{[key: string]: string}>({});
  const [correctionHistory, setCorrectionHistory] = useState<Array<{
    originalCode: string;
    newCode: string;
    designation: string;
    date: Date;
    tariffs?: any;
  }>>([]);

  if (!isOpen) return null;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const codeResults = searchTECArticlesByCode(query);
      const designationResults = searchTECArticlesByDesignation(query);
      const combinedResults = [...codeResults, ...designationResults];
      // Supprimer les doublons basés sur sh10Code
      const uniqueResults = combinedResults.filter((item, index, self) => 
        index === self.findIndex(t => t.sh10Code === item.sh10Code)
      );
      setSearchResults(uniqueResults.slice(0, 10)); // Limiter à 10 résultats
    } else {
      setSearchResults([]);
    }
  };

  const handleCodeCorrection = (originalCode: string, newCode: string, designation: string) => {
    // Récupérer les tarifs douaniers pour le nouveau code
    const tariffs = getTECTariffs(newCode);
    
    // Ajouter à l'historique des corrections
    const correction = {
      originalCode,
      newCode,
      designation,
      date: new Date(),
      tariffs
    };
    
    setCorrectionHistory(prev => [...prev, correction]);
    setCorrectedCodes(prev => ({
      ...prev,
      [originalCode]: newCode
    }));
    setEditingIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleConfirm = () => {
    const correctedData = missingCodes.map(article => ({
      originalCode: article.codeHS,
      newCode: correctedCodes[article.codeHS] || article.codeHS,
      designation: article.designation,
      quantite: article.quantite,
      prixUnitaire: article.prixUnitaire,
      prixTotal: article.prixTotal
    }));
    onConfirm(correctedData);
  };

  const formatCurrency = (amount: number, currency: string = 'FCFA') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'FCFA' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('fr-FR').format(number);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl max-w-6xl w-full border border-gray-300 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Codes SH manquants dans la table TEC</h3>
                <p className="text-gray-600 text-sm">
                  {missingCodes.length} code(s) SH trouvé(s) dans la facture mais absent(s) de la table TEC
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Avertissement */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">Attention :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Les codes SH manquants ne pourront pas bénéficier des calculs automatiques de droits de douane</li>
                  <li>• Vous devrez saisir manuellement les taux de droits pour ces articles</li>
                  <li>• Considérez ajouter ces codes SH à la table TEC pour les prochaines utilisations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Liste des codes manquants */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
            <h4 className="text-gray-900 font-semibold mb-4 flex items-center space-x-2">
              <Search className="h-5 w-5 text-orange-400" />
              <span>Codes SH manquants ({missingCodes.length})</span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cote-ivoire-light">
                    <th className="text-left py-3 px-4 text-gray-800 font-semibold">Code SH</th>
                    <th className="text-left py-3 px-4 text-gray-800 font-semibold">Désignation</th>
                    <th className="text-center py-3 px-4 text-gray-800 font-semibold">Quantité</th>
                    <th className="text-right py-3 px-4 text-gray-800 font-semibold">Prix unitaire</th>
                    <th className="text-right py-3 px-4 text-gray-800 font-semibold">Prix total</th>
                    <th className="text-center py-3 px-4 text-gray-800 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {missingCodes.map((article, index) => (
                    <tr key={index} className="border-b border-cote-ivoire-light hover:bg-cote-ivoire-light/30">
                                              <td className="py-3 px-4 text-gray-900 font-mono bg-orange-100 rounded">
                          {correctedCodes[article.codeHS] ? (
                            <div className="flex items-center space-x-2">
                              <span className="line-through text-orange-600">{article.codeHS}</span>
                              <span className="text-green-600">→</span>
                              <span className="text-green-600">{correctedCodes[article.codeHS]}</span>
                            </div>
                          ) : (
                            article.codeHS
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {article.designation}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {formatNumber(article.quantite)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {formatCurrency(article.prixUnitaire)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 font-medium">
                          {formatCurrency(article.prixTotal)}
                        </td>
                      <td className="py-3 px-4 text-center">
                        {editingIndex === index ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="text-cote-ivoire-primary hover:text-cote-ivoire-primary"
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

            {/* Interface de recherche et correction */}
            {editingIndex !== null && (
              <div className="mt-6 bg-white rounded-lg p-4 border border-cote-ivoire-light">
                <h5 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Search className="h-4 w-4 text-cote-ivoire-primary" />
                  <span>Rechercher un code SH dans la table TEC</span>
                </h5>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Rechercher par code SH ou désignation..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary text-gray-800 placeholder-gray-500"
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {searchResults.map((result, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-cote-ivoire-lighter rounded-lg hover:bg-cote-ivoire-light cursor-pointer"
                            onClick={() => handleCodeCorrection(missingCodes[editingIndex].codeHS, result.sh10Code, result.designation)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-orange-600">{result.sh10Code}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-900 text-sm">{result.designation}</span>
                              </div>
                            </div>
                            <button className="text-green-600 hover:text-green-700">
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && (
                    <div className="text-center text-gray-600 py-4">
                      Aucun résultat trouvé pour "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Résumé des corrections avec tarifs */}
          {correctionHistory.length > 0 && (
            <div className="bg-cote-ivoire-success/30 border border-cote-ivoire-success/50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-cote-ivoire-success mt-0.5" />
                <div className="text-sm text-cote-ivoire-success w-full">
                  <p className="font-medium mb-2">Codes SH corrigés avec tarifs douaniers :</p>
                  <div className="space-y-3">
                    {correctionHistory.map((correction, index) => (
                      <div key={index} className="bg-white/50 rounded-lg p-3 border border-cote-ivoire-light">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono text-cote-ivoire-primary">{correction.originalCode}</span>
                          <span className="text-cote-ivoire-success">→</span>
                          <span className="font-mono text-cote-ivoire-success">{correction.newCode}</span>
                        </div>
                        <div className="text-xs text-gray-800 mb-2">
                          {correction.designation}
                        </div>
                        {correction.tariffs && (
                          <div className="space-y-3">
                            {/* Première ligne - Tarifs de base */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="bg-orange-100 p-2 rounded border border-orange-300">
                                <div className="text-orange-700 font-medium">DD</div>
                                <div className="text-gray-900">{correction.tariffs.dd?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-orange-100 p-2 rounded border border-orange-300">
                                <div className="text-orange-700 font-medium">RSTA</div>
                                <div className="text-gray-900">{correction.tariffs.rsta?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-orange-100 p-2 rounded border border-orange-300">
                                <div className="text-orange-700 font-medium">TVA</div>
                                <div className="text-gray-900">{correction.tariffs.tva?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-green-100 p-2 rounded border border-green-300">
                                <div className="text-green-700 font-medium">Total (avec TVA)</div>
                                <div className="text-gray-900">{correction.tariffs.cumulAvecTVA?.toFixed(2)}%</div>
                              </div>
                            </div>
                            
                            {/* Deuxième ligne - Taux cumulé sans TVA et autres tarifs */}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                              <div className="bg-blue-100 p-2 rounded border border-blue-300">
                                <div className="text-blue-700 font-medium">Cumul sans TVA</div>
                                <div className="text-gray-900">{correction.tariffs.cumulSansTVA?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-green-100 p-2 rounded border border-green-300">
                                <div className="text-green-700 font-medium">Cumul avec TVA</div>
                                <div className="text-gray-900">{correction.tariffs.cumulAvecTVA?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-purple-100 p-2 rounded border border-purple-300">
                                <div className="text-purple-700 font-medium">PUA</div>
                                <div className="text-gray-900">{correction.tariffs.pua?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-purple-100 p-2 rounded border border-purple-300">
                                <div className="text-purple-700 font-medium">PCC</div>
                                <div className="text-gray-900">{correction.tariffs.pcc?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-red-100 p-2 rounded border border-red-300">
                                <div className="text-red-700 font-medium">RRR</div>
                                <div className="text-gray-900">{correction.tariffs.rrr?.toFixed(2)}%</div>
                              </div>
                              <div className="bg-red-100 p-2 rounded border border-red-300">
                                <div className="text-red-700 font-medium">RCP</div>
                                <div className="text-gray-900">{correction.tariffs.rcp?.toFixed(2)}%</div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-2">
                          Corrigé le {correction.date.toLocaleString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommandations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Recommandations :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Utilisez le bouton d'édition pour rechercher et corriger les codes SH manquants</li>
                  <li>• Recherchez par code SH ou par désignation dans la table TEC</li>
                  <li>• Les codes corrigés seront automatiquement appliqués à votre facture</li>
                  <li>• Vous pouvez continuer même si certains codes ne sont pas corrigés</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition-colors"
            >
              <span>Annuler</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-cote-ivoire-primary text-white border border-cote-ivoire-primary hover:bg-orange-600 transition-colors"
            >
              <span>Continuer avec saisie manuelle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissingCodesModal; 
