import { TarifPORTProduct } from '../types/tarifport';
import { loadSampleTarifPORTData } from './tarifportSampleData';

// Cache en mémoire pour éviter les appels répétés
let tarifPORTDataCache: TarifPORTProduct[] | null = null;
let tarifPORTDataCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fonction pour charger les données TarifPORT depuis Supabase (avec fallback)
export const loadTarifPORTData = async (): Promise<TarifPORTProduct[]> => {
  // Vérifier le cache
  const now = Date.now();
  if (tarifPORTDataCache && (now - tarifPORTDataCacheTime) < CACHE_DURATION) {
    return tarifPORTDataCache;
  }

  try {
    // Essayer Supabase d'abord
    const { referenceDataService } = await import('../services/supabase/referenceDataService');
    const products = await referenceDataService.getAllTarifPORTProducts();
    
    if (products.length > 0) {
      tarifPORTDataCache = products;
      tarifPORTDataCacheTime = now;
      console.log('TarifPORT - Produits chargés depuis Supabase:', products.length);
      return products;
    }
  } catch (error) {
    console.warn('Erreur lors du chargement depuis Supabase, fallback vers localStorage:', error);
  }

  // Fallback vers localStorage
  try {
    const storedData = localStorage.getItem('tarifportProducts');
    if (storedData) {
      const products = JSON.parse(storedData);
      tarifPORTDataCache = products;
      tarifPORTDataCacheTime = now;
      console.log('TarifPORT - Produits chargés depuis localStorage:', products.length);
      return products;
    }
  } catch (error) {
    console.error('Erreur lors du parsing des données TarifPORT:', error);
  }

  // Dernier fallback : données d'exemple
  const sampleData = loadSampleTarifPORTData();
  tarifPORTDataCache = sampleData;
  tarifPORTDataCacheTime = now;
  return sampleData;
};

// Fonction pour récupérer tous les articles TarifPORT
export const getAllTarifPORTArticles = async (): Promise<TarifPORTProduct[]> => {
  return await loadTarifPORTData();
};

// Fonction pour rechercher un article par son libellé
export const findTarifPORTArticleByLibelle = async (libelle: string): Promise<TarifPORTProduct | undefined> => {
  const products = await loadTarifPORTData();
  return products.find(article => 
    article.libelle_produit.toLowerCase().includes(libelle.toLowerCase())
  );
};

// Fonction pour rechercher un article par son code de redevance
export const findTarifPORTArticleByCodeRedevance = async (codeRedevance: string): Promise<TarifPORTProduct | undefined> => {
  const products = await loadTarifPORTData();
  const normalizedCode = String(codeRedevance).toLowerCase();
  return products.find(article => 
    String(article.coderedevance || '').toLowerCase() === normalizedCode
  );
};

// Fonction pour rechercher un article par son TP
export const findTarifPORTArticleByTP = async (tp: string): Promise<TarifPORTProduct | undefined> => {
  const products = await loadTarifPORTData();
  const normalizedTP = String(tp).toLowerCase();
  return products.find(article => 
    String(article.tp || '').toLowerCase() === normalizedTP
  );
};

// Fonction pour sauvegarder les produits TarifPORT (pour compatibilité, mais les données sont maintenant dans Supabase)
export const saveTarifPORTProducts = (products: TarifPORTProduct[]): void => {
  try {
    localStorage.setItem('tarifportProducts', JSON.stringify(products));
    tarifPORTDataCache = products;
    tarifPORTDataCacheTime = Date.now();
    console.log('TarifPORT - Produits sauvegardés dans localStorage (fallback):', products.length);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des produits TarifPORT:', error);
  }
}; 
