import * as XLSX from 'xlsx';
import { TECArticle } from '../types/tec';
import { VOCProduct } from '../types/voc';
import { TarifPORTProduct } from '../types/tarifport';
import { referenceDataService } from './supabase/referenceDataService';

/**
 * Service pour importer les données de référence depuis des fichiers Excel
 */

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

/**
 * Mapping des colonnes Excel vers les propriétés TypeScript
 */
const TEC_COLUMN_MAPPING: Record<string, keyof TECArticle> = {
  'Code SH10': 'sh10Code',
  'SH10 Code': 'sh10Code',
  'Code SH 10': 'sh10Code',
  'Désignation': 'designation',
  'US': 'us',
  'DD': 'dd',
  'RSTA': 'rsta',
  'PCS': 'pcs',
  'PUA': 'pua',
  'PCC': 'pcc',
  'RRR': 'rrr',
  'RCP': 'rcp',
  'Cumul Sans TVA': 'cumulSansTVA',
  'Cumul Avec TVA': 'cumulAvecTVA',
  'TVA': 'tva',
  'Code SH6': 'sh6Code',
  'SH6 Code': 'sh6Code',
  'Code SH 6': 'sh6Code',
  'TUB': 'tub',
  'DUS': 'dus',
  'DUD': 'dud',
  'TCB': 'tcb',
  'TSM': 'tsm',
  'TSB': 'tsb',
  'PSV': 'psv',
  'TAI': 'tai',
  'TAB': 'tab',
  'TUF': 'tuf',
};

const VOC_COLUMN_MAPPING: Record<string, keyof VOCProduct> = {
  'Code SH': 'codeSH',
  'Code SH6': 'codeSH',
  'Code SH 6': 'codeSH',
  'Désignation': 'designation',
  'Observation': 'observation',
  'Exempté': 'exempte',
  'Exempte': 'exempte',
};

const TARIFPORT_COLUMN_MAPPING: Record<string, keyof TarifPORTProduct> = {
  'Libellé Produit': 'libelle_produit',
  'Libelle Produit': 'libelle_produit',
  'Chapitre': 'chapitre',
  'TP': 'tp',
  'Code Redevance': 'coderedevance',
  'Code Redevance': 'coderedevance',
};

/**
 * Normaliser le nom de colonne (enlever espaces, accents, etc.)
 */
function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/\s+/g, ' ');
}

/**
 * Trouver la colonne correspondante dans le mapping
 */
function findColumnMapping(
  columnName: string,
  mapping: Record<string, any>
): string | null {
  const normalized = normalizeColumnName(columnName);
  
  // Chercher une correspondance exacte
  for (const [key, value] of Object.entries(mapping)) {
    if (normalizeColumnName(key) === normalized) {
      return value;
    }
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(mapping)) {
    if (normalized.includes(normalizeColumnName(key)) || 
        normalizeColumnName(key).includes(normalized)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Convertir une valeur Excel en nombre
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Convertir une valeur Excel en booléen
 */
function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === '1' || lower === 'oui' || lower === 'yes' || lower === 'true' || lower === 'exempté' || lower === 'exempte';
  }
  return false;
}

/**
 * Importer les articles TEC depuis un fichier Excel
 */
export async function importTECFromExcel(
  file: File,
  clearExisting: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Lire le fichier Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Prendre la première feuille
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir en JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      result.errors.push('Le fichier Excel doit contenir au moins un en-tête et une ligne de données');
      return result;
    }

    // Première ligne = en-têtes
    const headers = (jsonData[0] as any[]).map((h: any) => String(h || '').trim());
    const rows = jsonData.slice(1) as any[][];

    // Mapper les colonnes
    const columnMap: Record<number, keyof TECArticle> = {};
    headers.forEach((header, index) => {
      const mapping = findColumnMapping(header, TEC_COLUMN_MAPPING);
      if (mapping) {
        columnMap[index] = mapping;
      } else if (header) {
        result.warnings.push(`Colonne non reconnue: "${header}"`);
      }
    });

    // Vérifier les colonnes obligatoires
    const requiredColumns = ['sh10Code', 'designation'];
    const missingColumns = requiredColumns.filter(col => 
      !Object.values(columnMap).includes(col as keyof TECArticle)
    );

    if (missingColumns.length > 0) {
      result.errors.push(`Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`);
      return result;
    }

    // Parser les données
    const articles: Omit<TECArticle, 'id'>[] = [];
    
    rows.forEach((row, rowIndex) => {
      // Ignorer les lignes vides
      if (row.every((cell: any) => !cell || String(cell).trim() === '')) {
        return;
      }

      const article: any = {};
      
      Object.entries(columnMap).forEach(([colIndex, property]) => {
        const value = row[parseInt(colIndex)];
        
        if (value !== undefined && value !== null && value !== '') {
          if (property === 'dd' || property === 'rsta' || property === 'pcs' || 
              property === 'pua' || property === 'pcc' || property === 'rrr' || 
              property === 'rcp' || property === 'cumulSansTVA' || 
              property === 'cumulAvecTVA' || property === 'tva') {
            article[property] = parseNumber(value);
          } else if (property === 'sh10Code' || property === 'sh6Code') {
            // Nettoyer le code SH (enlever les points, espaces, etc.)
            article[property] = String(value).replace(/[^\d]/g, '').slice(0, 10);
          } else {
            article[property] = String(value).trim();
          }
        }
      });

      // Vérifier que l'article a au moins un code SH10
      if (article.sh10Code) {
        articles.push(article as Omit<TECArticle, 'id'>);
      } else {
        result.warnings.push(`Ligne ${rowIndex + 2}: Code SH10 manquant, ligne ignorée`);
      }
    });

    if (articles.length === 0) {
      result.errors.push('Aucun article valide trouvé dans le fichier');
      return result;
    }

    // Nettoyer les données existantes si demandé
    if (clearExisting) {
      await referenceDataService.clearAllTECArticles();
    }

    // Insérer dans Supabase
    const imported = await referenceDataService.bulkInsertTECArticles(articles);
    result.imported = imported;
    result.success = true;

  } catch (error: any) {
    result.errors.push(`Erreur lors de l'import: ${error.message || error}`);
    console.error('Erreur import TEC:', error);
  }

  return result;
}

/**
 * Importer les produits VOC depuis un fichier Excel
 */
export async function importVOCFromExcel(
  file: File,
  clearExisting: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    warnings: [],
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      result.errors.push('Le fichier Excel doit contenir au moins un en-tête et une ligne de données');
      return result;
    }

    const headers = (jsonData[0] as any[]).map((h: any) => String(h || '').trim());
    const rows = jsonData.slice(1) as any[][];

    const columnMap: Record<number, keyof VOCProduct> = {};
    headers.forEach((header, index) => {
      const mapping = findColumnMapping(header, VOC_COLUMN_MAPPING);
      if (mapping) {
        columnMap[index] = mapping;
      }
    });

    const requiredColumns = ['codeSH', 'designation'];
    const missingColumns = requiredColumns.filter(col => 
      !Object.values(columnMap).includes(col as keyof VOCProduct)
    );

    if (missingColumns.length > 0) {
      result.errors.push(`Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`);
      return result;
    }

    const products: Omit<VOCProduct, 'id'>[] = [];

    rows.forEach((row, rowIndex) => {
      if (row.every((cell: any) => !cell || String(cell).trim() === '')) {
        return;
      }

      const product: any = {};

      Object.entries(columnMap).forEach(([colIndex, property]) => {
        const value = row[parseInt(colIndex)];
        
        if (value !== undefined && value !== null && value !== '') {
          if (property === 'exempte') {
            product[property] = parseBoolean(value);
          } else if (property === 'codeSH') {
            product[property] = String(value).replace(/[^\d]/g, '').slice(0, 10);
          } else {
            product[property] = String(value).trim();
          }
        }
      });

      if (product.codeSH) {
        products.push(product as Omit<VOCProduct, 'id'>);
      } else {
        result.warnings.push(`Ligne ${rowIndex + 2}: Code SH manquant, ligne ignorée`);
      }
    });

    if (products.length === 0) {
      result.errors.push('Aucun produit valide trouvé dans le fichier');
      return result;
    }

    if (clearExisting) {
      await referenceDataService.clearAllVOCProducts();
    }

    const imported = await referenceDataService.bulkInsertVOCProducts(products);
    result.imported = imported;
    result.success = true;

  } catch (error: any) {
    result.errors.push(`Erreur lors de l'import: ${error.message || error}`);
    console.error('Erreur import VOC:', error);
  }

  return result;
}

/**
 * Importer les produits TarifPORT depuis un fichier Excel
 */
export async function importTarifPORTFromExcel(
  file: File,
  clearExisting: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    warnings: [],
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      result.errors.push('Le fichier Excel doit contenir au moins un en-tête et une ligne de données');
      return result;
    }

    const headers = (jsonData[0] as any[]).map((h: any) => String(h || '').trim());
    const rows = jsonData.slice(1) as any[][];

    const columnMap: Record<number, keyof TarifPORTProduct> = {};
    headers.forEach((header, index) => {
      const mapping = findColumnMapping(header, TARIFPORT_COLUMN_MAPPING);
      if (mapping) {
        columnMap[index] = mapping;
      }
    });

    const requiredColumns = ['libelle_produit'];
    const missingColumns = requiredColumns.filter(col => 
      !Object.values(columnMap).includes(col as keyof TarifPORTProduct)
    );

    if (missingColumns.length > 0) {
      result.errors.push(`Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`);
      return result;
    }

    const products: Omit<TarifPORTProduct, 'id'>[] = [];

    rows.forEach((row, rowIndex) => {
      if (row.every((cell: any) => !cell || String(cell).trim() === '')) {
        return;
      }

      const product: any = {};

      Object.entries(columnMap).forEach(([colIndex, property]) => {
        const value = row[parseInt(colIndex)];
        
        if (value !== undefined && value !== null && value !== '') {
          // Gérer les types NUMERIC pour tp et code_redevance
          if (property === 'tp' || property === 'coderedevance') {
            product[property] = String(parseNumber(value));
          } else {
            product[property] = String(value).trim();
          }
        }
      });

      if (product.libelle_produit) {
        products.push(product as Omit<TarifPORTProduct, 'id'>);
      } else {
        result.warnings.push(`Ligne ${rowIndex + 2}: Libellé produit manquant, ligne ignorée`);
      }
    });

    if (products.length === 0) {
      result.errors.push('Aucun produit valide trouvé dans le fichier');
      return result;
    }

    if (clearExisting) {
      await referenceDataService.clearAllTarifPORTProducts();
    }

    const imported = await referenceDataService.bulkInsertTarifPORTProducts(products);
    result.imported = imported;
    result.success = true;

  } catch (error: any) {
    result.errors.push(`Erreur lors de l'import: ${error.message || error}`);
    console.error('Erreur import TarifPORT:', error);
  }

  return result;
}

