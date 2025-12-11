import { TECArticle } from '../types/tec';

// Fonction pour valider et corriger les taux TEC
const validateAndFixTECTariffs = (articles: TECArticle[]): TECArticle[] => {
  return articles.map(article => ({
    ...article,
    // S'assurer que les taux sont des nombres avec 2 décimales maximum
    // Et vérifier qu'ils sont dans des plages raisonnables
    dd: typeof article.dd === 'number' ? Math.max(0, Number(article.dd.toFixed(2))) : 0,
    rsta: typeof article.rsta === 'number' ? Math.max(0, Number(article.rsta.toFixed(2))) : 0,
    pcs: typeof article.pcs === 'number' ? Math.max(0, Number(article.pcs.toFixed(2))) : 0,
    pua: typeof article.pua === 'number' ? Math.max(0, Number(article.pua.toFixed(2))) : 0,
    pcc: typeof article.pcc === 'number' ? Math.max(0, Number(article.pcc.toFixed(2))) : 0,
    cumulSansTVA: typeof article.cumulSansTVA === 'number' ? Math.max(0, Number(article.cumulSansTVA.toFixed(2))) : 0,
    cumulAvecTVA: typeof article.cumulAvecTVA === 'number' ? Math.max(0, Number(article.cumulAvecTVA.toFixed(2))) : 0,
    tva: typeof article.tva === 'number' ? Math.max(0, Number(article.tva.toFixed(2))) : 0,
  }));
};

// Cache en mémoire pour éviter les appels répétés
let tecArticlesCache: TECArticle[] | null = null;
let tecArticlesCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Récupérer tous les articles TEC depuis Supabase (avec fallback localStorage)
export const getTECArticles = async (): Promise<TECArticle[]> => {
  // Vérifier le cache
  const now = Date.now();
  if (tecArticlesCache && (now - tecArticlesCacheTime) < CACHE_DURATION) {
    return tecArticlesCache;
  }

  try {
    // Essayer Supabase d'abord
    const { referenceDataService } = await import('../services/supabase/referenceDataService');
    const articles = await referenceDataService.getAllTECArticles();
    
    if (articles.length > 0) {
      const validatedArticles = validateAndFixTECTariffs(articles);
      tecArticlesCache = validatedArticles;
      tecArticlesCacheTime = now;
      console.log('TEC - Articles chargés depuis Supabase:', validatedArticles.length);
      return validatedArticles;
    }
  } catch (error) {
    console.warn('Erreur lors du chargement depuis Supabase, fallback vers localStorage:', error);
  }

  // Fallback vers localStorage
  try {
    const savedArticles = localStorage.getItem('tecArticles');
    if (savedArticles) {
      const articles = JSON.parse(savedArticles);
      const validatedArticles = validateAndFixTECTariffs(articles);
      tecArticlesCache = validatedArticles;
      tecArticlesCacheTime = now;
      console.log('TEC - Articles chargés depuis localStorage:', validatedArticles.length);
      return validatedArticles;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des articles TEC:', error);
  }

  return [];
};

// Rechercher un article TEC par code SH
export const findTECArticleByCode = async (code: string): Promise<TECArticle | null> => {
  const articles = await getTECArticles();
  
  // Vérifier que le code est bien une string
  if (typeof code !== 'string') {
    console.log(`Erreur: le code SH n'est pas une string:`, code, typeof code);
    return null;
  }
  
  console.log(`Recherche du code SH: ${code}`);
  console.log(`Nombre d'articles TEC disponibles: ${articles.length}`);
  
  // Normaliser le code recherché (enlever les points et espaces)
  const normalizedCode = code.replace(/[.\s]/g, '');
  console.log(`Code recherché normalisé: ${normalizedCode}`);
  
  const foundArticle = articles.find(article => {
    // Normaliser les codes de l'article
    const normalizedSh10Code = article.sh10Code.replace(/[.\s]/g, '');
    const normalizedSh6Code = article.sh6Code.replace(/[.\s]/g, '');
    
    const match = normalizedSh10Code === normalizedCode || 
                  normalizedSh6Code === normalizedCode ||
                  article.sh10Code === code || 
                  article.sh6Code === code;
    
    if (match) {
      console.log(`Match trouvé! Code original: ${code}, Article: ${article.sh10Code} / ${article.sh6Code}`);
    }
    
    return match;
  });
  
  if (foundArticle) {
    console.log(`Article trouvé: ${foundArticle.sh10Code} / ${foundArticle.sh6Code} - ${foundArticle.designation}`);
  } else {
    console.log(`Aucun article trouvé pour le code: ${code}`);
    // Afficher quelques exemples d'articles disponibles pour debug
    if (articles.length > 0) {
      console.log(`Exemples d'articles disponibles:`, articles.slice(0, 3).map(a => `${a.sh10Code} / ${a.sh6Code} - ${a.designation}`));
      // Afficher tous les codes SH disponibles pour debug
      console.log(`Tous les codes SH disponibles:`, articles.map(a => `${a.sh10Code} / ${a.sh6Code}`));
      console.log(`Codes SH 10 chiffres disponibles:`, articles.map(a => a.sh10Code));
      console.log(`Codes SH 6 chiffres disponibles:`, articles.map(a => a.sh6Code));
    }
  }
  
  return foundArticle || null;
};

// Rechercher des articles TEC par désignation
export const searchTECArticlesByDesignation = async (query: string): Promise<TECArticle[]> => {
  const articles = await getTECArticles();
  const lowerQuery = query.toLowerCase();
  return articles.filter(article => 
    article.designation.toLowerCase().includes(lowerQuery)
  );
};

// Rechercher des articles TEC par code SH (recherche partielle)
export const searchTECArticlesByCode = async (query: string): Promise<TECArticle[]> => {
  const articles = await getTECArticles();
  const lowerQuery = query.toLowerCase();
  return articles.filter(article => 
    article.sh10Code.toLowerCase().includes(lowerQuery) ||
    article.sh6Code.toLowerCase().includes(lowerQuery)
  );
};

// Obtenir les taux de droits pour un code SH
export const getTECTariffs = async (code: string) => {
  const article = await findTECArticleByCode(code);
  if (!article) return null;

  return {
    dd: article.dd, // Droits de douane
    rsta: article.rsta, // RSTA
    pcs: article.pcs, // PCS
    pua: article.pua, // PUA
    pcc: article.pcc, // PCC
    cumulSansTVA: article.cumulSansTVA, // Taux cumulé sans TVA
    cumulAvecTVA: article.cumulAvecTVA, // Taux cumulé avec TVA
    tva: article.tva, // TVA
  };
};

// Calculer les droits de douane pour un article
export const calculateCustomsDuties = async (fobValue: number, code: string): Promise<number> => {
  const tariffs = await getTECTariffs(code);
  if (!tariffs) return 0;

  // Calculer les droits de douane (DD + RSTA + PCS + PUA + PCC)
  const totalRate = tariffs.dd + tariffs.rsta + tariffs.pcs + tariffs.pua + tariffs.pcc;
  return Math.round(fobValue * (totalRate / 100));
};

// Calculer la TVA pour un article
export const calculateVAT = async (cafValue: number, code: string): Promise<number> => {
  const tariffs = await getTECTariffs(code);
  if (!tariffs) return 0;

  return Math.round(cafValue * (tariffs.tva / 100));
};

// Sauvegarder les articles TEC dans le localStorage
export const saveTECArticles = (articles: TECArticle[]): void => {
  try {
    // Valider et corriger les taux avant la sauvegarde
    const validatedArticles = validateAndFixTECTariffs(articles);
    localStorage.setItem('tecArticles', JSON.stringify(validatedArticles));
    console.log('TEC - Articles sauvegardés:', validatedArticles.length);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des articles TEC:', error);
  }
};

// VERSIONS SYNCHRONES - utilisent le cache localStorage pour éviter les appels async
// Ces fonctions sont utilisées par SimulatorForm.tsx qui ne peut pas utiliser await

// Version synchrone de findTECArticleByCode - utilise localStorage directement
export const findTECArticleByCodeSync = (code: string): TECArticle | null => {
  try {
    const savedArticles = localStorage.getItem('tecArticles');
    if (!savedArticles) return null;
    
    const articles: TECArticle[] = JSON.parse(savedArticles);
    
    if (typeof code !== 'string') return null;
    
    const normalizedCode = code.replace(/[.\s]/g, '');
    
    const foundArticle = articles.find(article => {
      const normalizedSh10Code = article.sh10Code.replace(/[.\s]/g, '');
      const normalizedSh6Code = article.sh6Code.replace(/[.\s]/g, '');
      
      return normalizedSh10Code === normalizedCode || 
             normalizedSh6Code === normalizedCode ||
             article.sh10Code === code || 
             article.sh6Code === code;
    });
    
    return foundArticle || null;
  } catch (error) {
    console.error('Erreur lors de la recherche TEC synchrone:', error);
    return null;
  }
};

// Version synchrone de searchTECArticlesByCode
export const searchTECArticlesByCodeSync = (query: string): TECArticle[] => {
  try {
    const savedArticles = localStorage.getItem('tecArticles');
    if (!savedArticles) return [];
    
    const articles: TECArticle[] = JSON.parse(savedArticles);
    const lowerQuery = query.toLowerCase();
    
    return articles.filter(article => 
      article.sh10Code.toLowerCase().includes(lowerQuery) ||
      article.sh6Code.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Erreur lors de la recherche TEC synchrone:', error);
    return [];
  }
};

// Version synchrone de searchTECArticlesByDesignation
export const searchTECArticlesByDesignationSync = (query: string): TECArticle[] => {
  try {
    const savedArticles = localStorage.getItem('tecArticles');
    if (!savedArticles) return [];
    
    const articles: TECArticle[] = JSON.parse(savedArticles);
    const lowerQuery = query.toLowerCase();
    
    return articles.filter(article => 
      article.designation.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Erreur lors de la recherche TEC synchrone:', error);
    return [];
  }
};
