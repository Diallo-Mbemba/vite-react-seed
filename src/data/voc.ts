import { VOCProduct } from '../types/voc';

// Cache en mémoire pour éviter les appels répétés
let vocProductsCache: VOCProduct[] | null = null;
let vocProductsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Récupérer tous les produits VOC depuis Supabase (avec fallback localStorage)
export const getVOCProducts = async (): Promise<VOCProduct[]> => {
  // Vérifier le cache
  const now = Date.now();
  if (vocProductsCache && (now - vocProductsCacheTime) < CACHE_DURATION) {
    return vocProductsCache;
  }

  try {
    // Essayer Supabase d'abord
    const { referenceDataService } = await import('../services/supabase/referenceDataService');
    const products = await referenceDataService.getAllVOCProducts();
    
    if (products.length > 0) {
      vocProductsCache = products;
      vocProductsCacheTime = now;
      console.log('VOC - Produits chargés depuis Supabase:', products.length);
      return products;
    }
  } catch (error) {
    console.warn('Erreur lors du chargement depuis Supabase, fallback vers localStorage:', error);
  }

  // Fallback vers localStorage
  try {
    const savedProducts = localStorage.getItem('vocProducts');
    if (savedProducts) {
      const products = JSON.parse(savedProducts);
      vocProductsCache = products;
      vocProductsCacheTime = now;
      console.log('VOC - Produits chargés depuis localStorage:', products.length);
      return products;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des produits VOC:', error);
  }

  return [];
};

// Rechercher un produit VOC par code SH
export const findVOCProductByCode = async (code: string): Promise<VOCProduct | null> => {
  try {
    // Essayer Supabase d'abord
    const { referenceDataService } = await import('../services/supabase/referenceDataService');
    const product = await referenceDataService.getVOCProductByCode(code);
    if (product) {
      return product;
    }
  } catch (error) {
    console.warn('Erreur lors de la recherche dans Supabase, fallback vers localStorage:', error);
  }

  // Fallback vers localStorage
  const products = await getVOCProducts();
  const normalizedCode = code.replace(/[.\s]/g, '');
  return products.find(product => {
    const normalizedProductCode = product.codeSH.replace(/[.\s]/g, '');
    return normalizedProductCode === normalizedCode || product.codeSH === code;
  }) || null;
};

// Rechercher des produits VOC par désignation
export const searchVOCProductsByDesignation = async (query: string): Promise<VOCProduct[]> => {
  const products = await getVOCProducts();
  const lowerQuery = query.toLowerCase();
  return products.filter(product => 
    product.designation.toLowerCase().includes(lowerQuery)
  );
};

// Rechercher des produits VOC par code SH (recherche partielle)
export const searchVOCProductsByCode = async (query: string): Promise<VOCProduct[]> => {
  const products = await getVOCProducts();
  const lowerQuery = query.toLowerCase();
  return products.filter(product => 
    product.codeSH.toLowerCase().includes(lowerQuery)
  );
};

// Vérifier si un produit est exempté du VOC
export const isVOCExempted = async (code: string): Promise<boolean> => {
  const product = await findVOCProductByCode(code);
  return product ? product.exempte : true; // Par défaut, exempté
};

// Sauvegarder les produits VOC (pour compatibilité, mais les données sont maintenant dans Supabase)
export const saveVOCProducts = (products: VOCProduct[]): void => {
  try {
    localStorage.setItem('vocProducts', JSON.stringify(products));
    vocProductsCache = products;
    vocProductsCacheTime = Date.now();
    console.log('VOC - Produits sauvegardés dans localStorage (fallback):', products.length);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des produits VOC:', error);
  }
}; 
