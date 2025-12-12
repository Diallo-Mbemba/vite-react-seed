import React, { useState, useEffect } from 'react';
import { Upload, Search, Filter, Trash2, Database, FileText, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { loadSampleTECData } from '../../data/tecSampleData';
import { TECArticle } from '../../types/tec';
import { referenceDataService } from '../../services/supabase/referenceDataService';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';

const TECManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [articles, setArticles] = useState<TECArticle[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [searchDesignation, setSearchDesignation] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<TECArticle[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [_loading, setLoading] = useState(true);

  // Charger les articles depuis Supabase au démarrage
  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        console.log('TEC Management - Chargement des articles depuis Supabase...');
        const referenceData = await referenceDataService.getReferenceData('tec');
        
        if (referenceData && referenceData.data && Array.isArray(referenceData.data)) {
          console.log('TEC Management - Articles chargés:', referenceData.data.length);
          setArticles(referenceData.data);
        } else {
          console.log('TEC Management - Aucun article trouvé dans Supabase, fallback vers localStorage');
          // Fallback vers localStorage pour migration progressive
          const savedArticles = localStorage.getItem('tecArticles');
          if (savedArticles) {
            try {
              const parsedArticles = JSON.parse(savedArticles);
              setArticles(parsedArticles);
            } catch (error) {
              console.error('TEC Management - Erreur lors du parsing localStorage:', error);
              setArticles([]);
            }
          } else {
            setArticles([]);
          }
        }
      } catch (error) {
        console.error('TEC Management - Erreur lors du chargement:', error);
        // Fallback vers localStorage
        const savedArticles = localStorage.getItem('tecArticles');
        if (savedArticles) {
          try {
            const parsedArticles = JSON.parse(savedArticles);
            setArticles(parsedArticles);
          } catch (parseError) {
            console.error('TEC Management - Erreur lors du parsing localStorage:', parseError);
            setArticles([]);
          }
        } else {
          setArticles([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Filtrer les articles selon les critères de recherche
  useEffect(() => {
    let filtered = articles;

    if (searchCode.trim()) {
      filtered = filtered.filter(article => 
        article.sh10Code.toLowerCase().includes(searchCode.toLowerCase()) ||
        article.sh6Code.toLowerCase().includes(searchCode.toLowerCase())
      );
    }

    if (searchDesignation.trim()) {
      filtered = filtered.filter(article => 
        article.designation.toLowerCase().includes(searchDesignation.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [articles, searchCode, searchDesignation]);

  // Gérer l'upload du fichier Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('TEC Management - Fichier sélectionné:', file.name, file.size, 'bytes');
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) {
          console.error('TEC Management - Aucune donnée lue du fichier');
          setIsUploading(false);
          return;
        }

        console.log('TEC Management - Lecture du fichier Excel...');
        const workbook = XLSX.read(data, { type: 'binary' });
        console.log('TEC Management - Feuilles disponibles:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log('=== DÉBUT IMPORT TEC ===');
        console.log('TEC Management - Données brutes:', jsonData.length, 'lignes');
        console.log('TEC Management - Première ligne (en-têtes):', jsonData[0]);
        console.log('TEC Management - Structure des colonnes:');
        jsonData[0].forEach((header: string, index: number) => {
          console.log(`Colonne ${index} (${String.fromCharCode(65 + index)}):`, header);
        });

        // Ignorer la première ligne (en-têtes)
        const rows = jsonData.slice(1);
        console.log('TEC Management - Lignes de données:', rows.length);

        // Fonction pour convertir correctement les valeurs numériques depuis Excel
        const parseExcelNumber = (value: any): number => {
          // Si la valeur est null, undefined ou vide, retourner 0
          if (value === null || value === undefined || value === '') {
            return 0;
          }
          
          // Si c'est déjà un nombre, le retourner directement
          if (typeof value === 'number') {
            return value;
          }
          
          // Convertir en string et nettoyer
          const strValue = String(value).trim();
          
          // Gérer les cas spéciaux
          if (strValue === '-' || strValue === 'N/A' || strValue === 'NA' || strValue === '' || strValue === 'null') {
            return 0;
          }
          
          // Supprimer les symboles % et espaces s'ils sont présents
          let cleanValue = strValue.replace(/[%\s]/g, '');
          
          // Gestion spécifique du format français avec virgule comme séparateur décimal
          // Format: "1 234,56" -> "1234.56"
          if (cleanValue.includes(',')) {
            // Supprimer les espaces de milliers (format français)
            cleanValue = cleanValue.replace(/\s/g, '');
            // Remplacer la virgule par un point pour la conversion
            cleanValue = cleanValue.replace(',', '.');
          }
          
          // Convertir en nombre
          const numValue = parseFloat(cleanValue);
          
          // Vérifier si c'est un nombre valide
          if (isNaN(numValue)) {
            console.warn('TEC Management - Valeur non numérique détectée:', value, 'Type:', typeof value, 'Valeur nettoyée:', cleanValue);
            return 0;
          }
          
          // Retourner la valeur telle quelle (sans arrondi forcé)
          return numValue;
        };

        console.log('TEC Management - Filtrage des lignes avec au moins 24 colonnes...');
        const validRows = rows.filter((row: any) => {
          const isValid = row.length >= 24;
          if (!isValid) {
            console.log('TEC Management - Ligne ignorée (colonnes insuffisantes):', row.length, 'colonnes');
          }
          return isValid;
        });
        
        console.log('TEC Management - Lignes valides:', validRows.length);

        const parsedArticles: TECArticle[] = validRows
          .map((row: any, index: number) => {
            // Log spécifique pour les colonnes K et L (taux cumulés) dans les 5 premières lignes
            if (index < 5) {
              console.log(`=== LIGNE ${index + 1} ===`);
              console.log('Colonne K (10) - Valeur brute:', row[10], 'Type:', typeof row[10]);
              console.log('Colonne L (11) - Valeur brute:', row[11], 'Type:', typeof row[11]);
              console.log('Parsing K (cumul sans TVA):', parseExcelNumber(row[10]));
              console.log('Parsing L (cumul avec TVA):', parseExcelNumber(row[11]));
              
              // Diagnostic spécifique pour le format français
              if (typeof row[10] === 'string' && row[10].includes(',')) {
                console.log('⚠️ FORMAT FRANÇAIS DÉTECTÉ - Colonne K:', row[10]);
              }
              if (typeof row[11] === 'string' && row[11].includes(',')) {
                console.log('⚠️ FORMAT FRANÇAIS DÉTECTÉ - Colonne L:', row[11]);
              }
            }
            
            // Log spécifique pour le code SH 8431490000
            if (row[0] === '8431490000') {
              console.log('=== CODE SH 8431490000 TROUVÉ ===');
              console.log('Code SH:', row[0]);
              console.log('Désignation:', row[1]);
              console.log('Colonne K (10) - Cumul sans TVA (brut):', row[10], 'Type:', typeof row[10]);
              console.log('Colonne L (11) - Cumul avec TVA (brut):', row[11], 'Type:', typeof row[11]);
              console.log('Parsing K (cumul sans TVA):', parseExcelNumber(row[10]));
              console.log('Parsing L (cumul avec TVA):', parseExcelNumber(row[11]));
            }
            
            const article = {
              sh10Code: String(row[0] || ''), // sh10 code (Colonne A)
              designation: String(row[1] || ''), // designation (Colonne B)
              us: String(row[2] || ''), // us (Colonne C)
              dd: parseExcelNumber(row[3]), // dd (Colonne D)
              rsta: parseExcelNumber(row[4]), // rsta (Colonne E)
              pcs: parseExcelNumber(row[5]), // pcs (Colonne F)
              pua: parseExcelNumber(row[6]), // pua (Colonne G)
              pcc: parseExcelNumber(row[7]), // pcc (Colonne H)
              rrr: parseExcelNumber(row[8]), // rrr (Colonne I)
              rcp: parseExcelNumber(row[9]), // rcp (Colonne J)
              cumulSansTVA: parseExcelNumber(row[10]), // cumul sans tva (Colonne K)
              cumulAvecTVA: parseExcelNumber(row[11]), // cumul avec tva (Colonne L)
              tva: parseExcelNumber(row[12]), // tva (Colonne M)
              sh6Code: String(row[13] || ''), // h6 cod (Colonne N)
              tub: String(row[14] || ''), // tub (Colonne O)
              dus: String(row[15] || ''), // dus (Colonne P)
              dud: String(row[16] || ''), // dud (Colonne Q)
              tcb: String(row[17] || ''), // tcb (Colonne R)
              tsm: String(row[18] || ''), // tsm (Colonne S)
              tsb: String(row[19] || ''), // tsb (Colonne T)
              psv: String(row[20] || ''), // psv (Colonne U)
              tai: String(row[21] || ''), // tai (Colonne V)
              tab: String(row[22] || ''), // tab (Colonne W)
              tuf: String(row[23] || ''), // tuf (Colonne X)
            };
            
            // Calcul automatique des taux cumulés si ils sont manquants
            let cumulSansTVA = article.cumulSansTVA;
            let cumulAvecTVA = article.cumulAvecTVA;
            
            // Si le cumul sans TVA est manquant, le calculer
            if (cumulSansTVA === 0) {
              cumulSansTVA = article.dd + article.rsta + article.pcs + article.pua + article.pcc;
              console.log(`TEC Management - Calcul automatique cumul sans TVA pour ${article.sh10Code}: ${cumulSansTVA}%`);
            }
            
            // Si le cumul avec TVA est manquant, le calculer
            if (cumulAvecTVA === 0) {
              cumulAvecTVA = cumulSansTVA + article.tva;
              console.log(`TEC Management - Calcul automatique cumul avec TVA pour ${article.sh10Code}: ${cumulAvecTVA}%`);
            }
            
            // Mettre à jour l'article avec les taux calculés
            const finalArticle = {
              ...article,
              cumulSansTVA,
              cumulAvecTVA
            };
            
            // Vérification spécifique pour le code SH 8431490000
            if (finalArticle.sh10Code === '8431490000') {
              console.log('=== ARTICLE 8431490000 CRÉÉ ===');
              console.log('Article complet:', finalArticle);
              console.log('Cumul sans TVA final:', finalArticle.cumulSansTVA);
              console.log('Cumul avec TVA final:', finalArticle.cumulAvecTVA);
            }
            
            return finalArticle;
          })
          .filter(article => {
            const isValid = article.sh10Code && article.designation;
            if (!isValid) {
              console.log('TEC Management - Article ignoré (données manquantes):', article.sh10Code, article.designation);
            }
            return isValid;
          }); // Filtrer les lignes vides

        console.log('TEC Management - Articles parsés:', parsedArticles.length);
        if (parsedArticles.length > 0) {
          console.log('TEC Management - Premier article:', parsedArticles[0]);
          
          // Vérification des taux cumulés dans les 5 premières lignes
          console.log('=== VÉRIFICATION FINALE ===');
          parsedArticles.slice(0, 5).forEach((article, index) => {
            console.log(`Article ${index + 1} - Code: ${article.sh10Code}`);
            console.log(`  Cumul sans TVA: ${article.cumulSansTVA}`);
            console.log(`  Cumul avec TVA: ${article.cumulAvecTVA}`);
            console.log(`  TVA: ${article.tva}`);
          });
          
          // Diagnostic des articles avec taux cumulés manquants
          const articlesSansCumulSansTVA = parsedArticles.filter(a => a.cumulSansTVA === 0);
          const articlesSansCumulAvecTVA = parsedArticles.filter(a => a.cumulAvecTVA === 0);
          
          console.log('=== DIAGNOSTIC TAUX CUMULÉS ===');
          console.log(`Articles sans cumul sans TVA: ${articlesSansCumulSansTVA.length}`);
          console.log(`Articles sans cumul avec TVA: ${articlesSansCumulAvecTVA.length}`);
          
          if (articlesSansCumulSansTVA.length > 0) {
            console.log('Exemples d\'articles sans cumul sans TVA:');
            articlesSansCumulSansTVA.slice(0, 3).forEach(article => {
              console.log(`  - ${article.sh10Code}: ${article.designation}`);
            });
          }
          
          if (articlesSansCumulAvecTVA.length > 0) {
            console.log('Exemples d\'articles sans cumul avec TVA:');
            articlesSansCumulAvecTVA.slice(0, 3).forEach(article => {
              console.log(`  - ${article.sh10Code}: ${article.designation}`);
            });
          }
          
          console.log('=== FIN IMPORT TEC ===');
        }

        // Alert de confirmation avec les statistiques
        const cumulSansTVA = parsedArticles.filter(a => a.cumulSansTVA > 0).length;
        const cumulAvecTVA = parsedArticles.filter(a => a.cumulAvecTVA > 0).length;
        
        // Générer un rapport détaillé des problèmes
        const rapportProblemes = [];
        const articlesSansCumulSansTVA = parsedArticles.filter(a => a.cumulSansTVA === 0);
        const articlesSansCumulAvecTVA = parsedArticles.filter(a => a.cumulAvecTVA === 0);
        
        if (articlesSansCumulSansTVA.length > 0) {
          rapportProblemes.push(`⚠️ ${articlesSansCumulSansTVA.length} articles sans cumul sans TVA`);
        }
        
        if (articlesSansCumulAvecTVA.length > 0) {
          rapportProblemes.push(`⚠️ ${articlesSansCumulAvecTVA.length} articles sans cumul avec TVA`);
        }
        
        if (rapportProblemes.length > 0) {
          console.log('=== RAPPORT PROBLÈMES ===');
          rapportProblemes.forEach(probleme => console.log(probleme));
        }
        
        alert(`Import terminé !\n${parsedArticles.length} articles importés\n${cumulSansTVA} avec cumul sans TVA\n${cumulAvecTVA} avec cumul avec TVA`);

        setArticles(parsedArticles);
        
        // Sauvegarder dans Supabase (admin uniquement)
        if (!isAdmin) {
          alert('Seuls les administrateurs peuvent modifier les données de référence.');
          setIsUploading(false);
          return;
        }

        referenceDataService.saveReferenceData('tec', parsedArticles, user?.id)
          .then(() => {
            console.log('TEC Management - Articles sauvegardés dans Supabase');
          })
          .catch((error) => {
            console.error('TEC Management - Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde. Vérifiez vos droits administrateur.');
          });
        
        // Statistiques d'import
        const stats = {
          total: parsedArticles.length,
          avecCumulSansTVA: parsedArticles.filter(a => a.cumulSansTVA > 0).length,
          avecCumulAvecTVA: parsedArticles.filter(a => a.cumulAvecTVA > 0).length,
          avecTVA: parsedArticles.filter(a => a.tva > 0).length,
          calculsAutomatiques: parsedArticles.filter(a => {
            // Vérifier si les taux ont été calculés automatiquement
            const tauxDeBase = a.dd + a.rsta + a.pcs + a.pua + a.pcc;
            return a.cumulSansTVA === tauxDeBase || a.cumulAvecTVA === (tauxDeBase + a.tva);
          }).length
        };
        
        console.log('TEC Management - Statistiques d\'import:', stats);
        
        const message = `${parsedArticles.length} articles TEC ont été importés avec succès !
        
Statistiques:
- Articles avec cumul sans TVA: ${stats.avecCumulSansTVA}
- Articles avec cumul avec TVA: ${stats.avecCumulAvecTVA}
- Articles avec TVA: ${stats.avecTVA}
- Calculs automatiques effectués: ${stats.calculsAutomatiques}

Note: Les taux cumulés manquants ont été calculés automatiquement à partir des taux de base.`;
        
        alert(message);
      };

      reader.readAsBinaryString(file);
      
      reader.onerror = () => {
        console.error('TEC Management - Erreur lors de la lecture du fichier');
        alert('Erreur lors de la lecture du fichier Excel');
        setIsUploading(false);
      };
      
    } catch (error) {
      console.error('TEC Management - Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import du fichier Excel: ' + (error instanceof Error ? error.message : String(error)));
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

    if (window.confirm('Êtes-vous sûr de vouloir vider toute la table TEC ?')) {
      try {
        await referenceDataService.deleteReferenceData('tec');
        setArticles([]);
        alert('Table TEC vidée avec succès !');
      } catch (error) {
        console.error('TEC Management - Erreur lors de la suppression:', error);
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

    if (window.confirm('Voulez-vous charger les données d\'exemple TEC ? Cela remplacera les données existantes.')) {
      try {
        const sampleData = loadSampleTECData();
        await referenceDataService.saveReferenceData('tec', sampleData, user?.id);
        setArticles(sampleData);
        alert(`${sampleData.length} articles d'exemple ont été chargés avec succès !`);
      } catch (error) {
        console.error('TEC Management - Erreur lors du chargement des données d\'exemple:', error);
        alert('Erreur lors du chargement des données d\'exemple. Vérifiez vos droits administrateur.');
      }
    }
  };

  // Exporter les données TEC pour vérification
  const exportTECData = () => {
    if (articles.length === 0) {
      alert('Aucune donnée TEC à exporter');
      return;
    }

    // Vérification spécifique pour le code SH 8431490000
    const article8431490000 = articles.find(a => a.sh10Code === '8431490000');
    if (article8431490000) {
      console.log('=== EXPORT - ARTICLE 8431490000 ===');
      console.log('Article trouvé:', article8431490000);
    }

    const csvContent = [
      // En-têtes
      ['Code SH', 'Désignation', 'DD', 'RSTA', 'PCS', 'PUA', 'PCC', 'Cumul sans TVA', 'Cumul avec TVA', 'TVA'],
      // Données
      ...articles.map(article => [
        article.sh10Code,
        article.designation,
        article.dd,
        article.rsta,
        article.pcs,
        article.pua,
        article.pcc,
        article.cumulSansTVA,
        article.cumulAvecTVA,
        article.tva
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tec_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction de diagnostic des problèmes de format Excel
  const diagnostiquerFormatExcel = () => {
    const recommandations = [
      '📋 Vérifiez que votre fichier Excel contient exactement 24 colonnes',
      '📊 Les colonnes K (11) et L (12) doivent contenir les taux cumulés',
      '🔢 Les valeurs numériques doivent être au format décimal (point ou virgule)',
      '❌ Évitez les symboles % dans les cellules numériques',
      '📝 Assurez-vous que la première ligne contient les en-têtes',
      '🔍 Vérifiez qu\'il n\'y a pas de lignes vides au début du fichier'
    ];

    const message = `🔧 Diagnostic du format Excel requis :

${recommandations.join('\n')}

📋 Structure attendue :
Colonne A: Code SH | Colonne K: Cumul sans TVA | Colonne L: Cumul avec TVA

💡 Si les taux cumulés ne se chargent pas :
1. Vérifiez le format des cellules (numérique, pas texte)
2. Assurez-vous qu'il n'y a pas d'espaces avant/après les valeurs
3. Utilisez le point (.) ou la virgule (,) comme séparateur décimal`;

    alert(message);
  };

  // Fonction de diagnostic spécifique pour le format français
  const diagnostiquerFormatFrancais = () => {
    const message = `🇫🇷 Diagnostic du format français Excel :

⚠️ PROBLÈME DÉTECTÉ : Format français avec virgule comme séparateur décimal

📊 Votre fichier utilise le format : # ##0,00####
- Espaces de milliers : 1 234,56
- Virgule comme séparateur décimal
- Format personnalisé français

🛠️ SOLUTIONS :

1️⃣ SOLUTION RAPIDE (Recommandée) :
   - Sélectionnez les colonnes K et L
   - Clic droit → "Format de cellule"
   - Choisissez "Nombre" (pas "Personnalisée")
   - Sélectionnez "Utiliser le point (.) comme séparateur"
   - Sauvegardez et réimportez

2️⃣ SOLUTION ALTERNATIVE :
   - L'application gère maintenant automatiquement le format français
   - Les valeurs comme "1 234,56" seront converties en "1234.56"
   - Testez l'import avec votre fichier actuel

3️⃣ VÉRIFICATION :
   - Après import, consultez la console (F12)
   - Recherchez les messages "FORMAT FRANÇAIS DÉTECTÉ"
   - Vérifiez que les taux cumulés ne sont plus à 0%`;

    alert(message);
  };

  // Formater les pourcentages
  const formatPercentage = (value: number) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <div className="flex items-center space-x-3 mb-2">
          <Database className="h-8 w-8 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion du TEC (Tarif Extérieur Commun)
          </h1>
        </div>
        <p className="text-gray-600">
          Importez les codes SH et tarifs douaniers depuis un fichier Excel. Le fichier doit contenir 24 colonnes avec les codes SH10, désignations et tarifs.
        </p>
      </div>

      {/* Section Articles TEC en base */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Articles TEC en base</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-orange-600">{articles.length}</span>
            <button
              onClick={loadSampleData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Données d'exemple</span>
            </button>
            <button
              onClick={exportTECData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
            <button
              onClick={clearTable}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Vider la table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Fichier Excel TEC */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Fichier Excel TEC</h2>
        <div className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cote-ivoire-primary file:text-cote-ivoire-primary hover:file:bg-cote-ivoire-primary"
          />
          <div className="flex space-x-3">
            <button
              disabled={isUploading}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-5 w-5" />
              <span>{isUploading ? 'Chargement...' : 'Charger le fichier TEC'}</span>
            </button>
            <button
              onClick={diagnostiquerFormatExcel}
              className="flex items-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Diagnostic général</span>
            </button>
            <button
              onClick={diagnostiquerFormatFrancais}
              className="flex items-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Format français</span>
            </button>
          </div>
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Conseils pour un import réussi :</p>
            <ul className="space-y-1 text-xs">
              <li>• Le fichier doit contenir exactement 24 colonnes</li>
              <li>• Les colonnes K et L doivent contenir les taux cumulés</li>
              <li>• Les valeurs numériques doivent être au format décimal</li>
              <li>• Évitez les symboles % dans les cellules numériques</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Format requis */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800 mb-2">Format requis</h3>
            <p className="text-sm text-orange-700">
              Le fichier Excel doit contenir 24 colonnes dans l'ordre suivant : sh10 code, designation, us, dd, rsta, pcs, pua, pcc, rrr, rcp, cumul sans tva, cumul avec tva, tva, h6 cod, tub, dus, dud, tcb, tsm, tsb, psv, tai, tab, tuf.
            </p>
          </div>
        </div>
      </div>

      {/* Section de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recherche et filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Code SH</span>
            </label>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Minimum 2 caractères..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Désignation</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchDesignation}
                onChange={(e) => setSearchDesignation(e.target.value)}
                placeholder="Rechercher par désignation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchDesignation && (
                <span className="absolute right-2 top-2 px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
                  Actif
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <span className="text-sm text-gray-600">{filteredArticles.length} résultats</span>
        </div>
        
        {/* Table */}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumul S/TVA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumul A/TVA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVA %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SH6</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TUB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DUD</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TCB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TSM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TSB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PSV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TUF</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.map((article, index) => (
                <tr key={index} className="hover:bg-cote-ivoire-success hover:text-white">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{article.sh10Code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={article.designation}>
                    {article.designation}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {article.us}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.dd)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.rsta)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.pcs)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.pua)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.pcc)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.rrr)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.rcp)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatPercentage(article.cumulSansTVA)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cote-ivoire-primary text-cote-ivoire-primary">
                      {formatPercentage(article.cumulAvecTVA)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(article.tva)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{article.sh6Code}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tub) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.dus) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.dud) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tcb) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tsm) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tsb) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.psv) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tai) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tab) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatPercentage(parseFloat(article.tuf) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TECManagementPage; 
