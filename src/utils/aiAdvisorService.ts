interface SimulationData {
  // Étape 1: Informations générales
  dossier?: string;
  numeroFacture?: string;
  dateFacture?: string;
  dateTransaction?: string;
  montantFacture?: number;
  devise?: string;
  tauxChange?: number;
  incoterm?: string;
  regimeDouanier?: string;
  modePaiement?: string;

  // Étape 2: Acteurs commerciaux
  importateur?: string;
  fournisseur?: string;
  transitaire?: string;
  paysFournisseur?: string;

  // Étape 3: Transport et logistique
  modeTransport?: string;
  route?: string;
  typeConteneur?: string;
  nombreConteneurs?: number;
  poidsTotal?: number;

  // Étape 4: Articles et coûts
  articles?: Array<{
    codeHS: string;
    designation: string;
    quantite: number;
    poidsUnitaire: number;
    prixUnitaire: number;
    fretUnitaire: number;
    assuranceUnitaire: number;
    droitDouaneUnitaire: number;
    rstaUnitaire: number;
    pcsUnitaire: number;
    puaUnitaire: number;
    pccUnitaire: number;
    rrrUnitaire: number;
    rcpUnitaire: number;
    tvaUnitaire: number;
    tsbUnitaire: number;
    tabUnitaire: number;
  }>;

  // Coûts totaux
  fob?: number;
  fret?: number;
  assurance?: number;
  droitDouane?: number;
  tva?: number;
  totalCost?: number;

  // Autres coûts
  rpi?: number;
  coc?: number;
  fraisFinanciers?: number;
  transitaire?: number;
  bsc?: number;
  tsDouane?: number;
  fraisImprevus?: number;
  creditEnlevement?: number;
  avanceFonds?: number;
  rrr?: number;
  rcp?: number;
}

interface AIRecommendation {
  category: 'operationnel' | 'financier' | 'action_immediate';
  title: string;
  description: string;
  priority: 'haute' | 'moyenne' | 'basse';
  impact: 'positif' | 'neutre' | 'negatif';
  icon: string;
  timeframe?: string;
}

interface AIAdviceResult {
  recommendations: AIRecommendation[];
  summary: string;
  riskLevel: 'faible' | 'moyen' | 'eleve';
  confidence: number; // 0-100
}

// Clé API OpenAI pour les conseils admin
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';

export class AIAdvisorService {
  /**
   * Génère des conseils admin en utilisant OpenAI pour des recommandations plus réalistes
   */
  static async generateAdviceWithOpenAI(simulationData: SimulationData): Promise<AIAdviceResult> {
    try {
      const prompt = this.buildAdminAdvicePrompt(simulationData);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en import-export et réglementation douanière en Côte d\'Ivoire. Tu fournis des conseils administratifs précis, réalistes et actionnables basés sur les données de simulation d\'importation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur OpenAI: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      return this.parseOpenAIResponse(aiResponse, simulationData);
    } catch (error) {
      console.error('Erreur lors de la génération des conseils OpenAI:', error);
      // Fallback vers la méthode classique en cas d'erreur
      return this.generateAdvice(simulationData);
    }
  }

  /**
   * Construit le prompt pour les conseils admin
   */
  private static buildAdminAdvicePrompt(data: SimulationData): string {
    const articles = data.articles || [];
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0);
    const costRatio = data.fob && data.totalCost ? (data.totalCost / data.fob).toFixed(2) : 'N/A';
    const avgUnitCost = data.totalCost && totalUnits > 0 ? (data.totalCost / totalUnits).toLocaleString('fr-FR') : 'N/A';
    const transportRatio = data.fob && data.fret ? ((data.fret / data.fob) * 100).toFixed(1) : 'N/A';

    return `Analyse cette simulation d'importation en Côte d'Ivoire et génère des conseils administratifs réalistes et actionnables.

DONNÉES DE LA SIMULATION:
- Dossier: ${data.dossier || 'N/A'}
- Numéro facture: ${data.numeroFacture || 'N/A'}
- FOB: ${data.fob ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.fob) : 'N/A'}
- Fret: ${data.fret ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.fret) : 'N/A'}
- Assurance: ${data.assurance ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.assurance) : 'N/A'}
- Droits de douane: ${data.droitDouane ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.droitDouane) : 'N/A'}
- Coût total: ${data.totalCost ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.totalCost) : 'N/A'}
- Ratio coût/FOB: ${costRatio}x
- Coût unitaire moyen: ${avgUnitCost} FCFA
- Ratio transport/FOB: ${transportRatio}%
- Incoterm: ${data.incoterm || 'N/A'}
- Mode de transport: ${data.modeTransport || 'N/A'}
- Route: ${data.route || 'N/A'}
- Mode de paiement: ${data.modePaiement || 'N/A'}
- Pays fournisseur: ${data.paysFournisseur || 'N/A'}
- Nombre d'articles: ${articles.length}
- Total unités: ${totalUnits}

ARTICLES:
${articles.map((article, index) => 
  `${index + 1}. ${article.designation} - ${article.quantite} unités - ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(article.prixUnitaire)}/unité - Code HS: ${article.codeHS}`
).join('\n')}

GÉNÈRE UNE RÉPONSE EN FORMAT JSON STRICT avec cette structure:
{
  "summary": "Résumé de 2-3 phrases de l'analyse globale",
  "riskLevel": "faible" | "moyen" | "eleve",
  "confidence": 85,
  "recommendations": [
    {
      "category": "operationnel" | "financier" | "action_immediate",
      "title": "Titre court et clair",
      "description": "Description détaillée et actionnable (2-3 phrases)",
      "priority": "haute" | "moyenne" | "basse",
      "impact": "positif" | "neutre" | "negatif",
      "icon": "emoji approprié"
    }
  ]
}

CONSIGNES:
- Sois précis et utilise les données réelles de la simulation
- Génère 5-8 recommandations variées et réalistes
- Inclus des conseils sur: optimisation des coûts, incoterms, logistique, paiement, réglementation douanière ivoirienne
- Les conseils doivent être actionnables et spécifiques au contexte ivoirien
- Utilise un langage professionnel mais accessible
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;

  }

  /**
   * Parse la réponse OpenAI en format AIAdviceResult
   */
  private static parseOpenAIResponse(aiResponse: string, simulationData: SimulationData): AIAdviceResult {
    try {
      // Extraire le JSON de la réponse (peut contenir du markdown)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        summary: parsed.summary || 'Analyse générée par IA',
        riskLevel: parsed.riskLevel || 'moyen',
        confidence: parsed.confidence || 75,
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse OpenAI:', error);
      // Fallback vers la méthode classique
      return this.generateAdvice(simulationData);
    }
  }

  /**
   * Génère des conseils (méthode classique - fallback)
   */
  static generateAdvice(simulationData: SimulationData): AIAdviceResult {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidenceScore = 0;

    // Analyse des coûts et identification des problèmes
    const costAnalysis = this.analyzeCosts(simulationData);
    recommendations.push(...costAnalysis.recommendations);
    riskScore += costAnalysis.riskScore;
    confidenceScore += costAnalysis.confidence;

    // Analyse des incoterms
    const incotermAnalysis = this.analyzeIncoterms(simulationData);
    recommendations.push(...incotermAnalysis.recommendations);
    riskScore += incotermAnalysis.riskScore;
    confidenceScore += incotermAnalysis.confidence;

    // Analyse de la logistique
    const logisticsAnalysis = this.analyzeLogistics(simulationData);
    recommendations.push(...logisticsAnalysis.recommendations);
    riskScore += logisticsAnalysis.riskScore;
    confidenceScore += logisticsAnalysis.confidence;

    // Analyse financière
    const financialAnalysis = this.analyzeFinancial(simulationData);
    recommendations.push(...financialAnalysis.recommendations);
    riskScore += financialAnalysis.riskScore;
    confidenceScore += financialAnalysis.confidence;

    // Analyse des volumes
    const volumeAnalysis = this.analyzeVolume(simulationData);
    recommendations.push(...volumeAnalysis.recommendations);
    riskScore += volumeAnalysis.riskScore;
    confidenceScore += volumeAnalysis.confidence;

    // Analyse des articles spécifiques
    const articleAnalysis = this.analyzeArticles(simulationData);
    recommendations.push(...articleAnalysis.recommendations);
    riskScore += articleAnalysis.riskScore;
    confidenceScore += articleAnalysis.confidence;

    // Analyse temporelle
    const temporalAnalysis = this.analyzeTemporal(simulationData);
    recommendations.push(...temporalAnalysis.recommendations);
    riskScore += temporalAnalysis.riskScore;
    confidenceScore += temporalAnalysis.confidence;

    // Analyse géographique
    const geographicAnalysis = this.analyzeGeographic(simulationData);
    recommendations.push(...geographicAnalysis.recommendations);
    riskScore += geographicAnalysis.riskScore;
    confidenceScore += geographicAnalysis.confidence;

    // Génération d'actions immédiates basées sur les analyses
    const immediateActions = this.generateImmediateActions(simulationData, recommendations);
    recommendations.push(...immediateActions);

    // Calcul du niveau de risque et de confiance
    const riskLevel = riskScore > 70 ? 'eleve' : riskScore > 40 ? 'moyen' : 'faible';
    const confidence = Math.min(95, Math.max(60, confidenceScore / 7));

    // Génération du résumé
    const summary = this.generateSummary(simulationData, riskLevel, recommendations.length);

    return {
      recommendations,
      summary,
      riskLevel,
      confidence
    };
  }

  private static analyzeCosts(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    if (!data.totalCost || !data.fob) return { recommendations, riskScore, confidence };

    const costRatio = data.totalCost / data.fob;
    const totalUnits = data.articles?.reduce((sum, article) => sum + article.quantite, 0) || 1;
    const avgUnitCost = data.totalCost / totalUnits;
    const transportRatio = data.fret ? data.fret / data.fob : 0;
    const insuranceRatio = data.assurance ? data.assurance / data.fob : 0;
    const dutyRatio = data.droitDouane ? data.droitDouane / data.fob : 0;

    // Analyse dynamique du ratio coût total / FOB avec seuils adaptatifs
    const costRatioThresholds = {
      excellent: 1.5,  // Excellent
      good: 2.0,       // Bon
      acceptable: 2.5, // Acceptable
      high: 3.0,       // Élevé
      critical: 4.0    // Critique
    };

    if (costRatio > costRatioThresholds.critical) {
      recommendations.push({
        category: 'operationnel',
        title: 'CRITIQUE: Optimisation Urgente des Coûts',
        description: `Ratio coût/FOB critique (${costRatio.toFixed(2)}x). Les coûts de revient prévisionnels dépassent 400% du FOB. Révision complète nécessaire des fournisseurs et de la logistique.`,
        priority: 'haute',
        impact: 'negatif',
        icon: '⚠️'
      });
      riskScore += 40;
    } else if (costRatio > costRatioThresholds.high) {
      recommendations.push({
        category: 'operationnel',
        title: 'Optimisation des Coûts de Revient Prévisionnels',
        description: `Ratio coût/FOB élevé (${costRatio.toFixed(2)}x). Les coûts de revient prévisionnels représentent plus de 300% du FOB, nécessitant une optimisation.`,
        priority: 'haute',
        impact: 'negatif',
        icon: '⚙️'
      });
      riskScore += 30;
    } else if (costRatio > costRatioThresholds.acceptable) {
      recommendations.push({
        category: 'operationnel',
        title: 'Amélioration des Coûts de Revient Prévisionnels',
        description: `Ratio coût/FOB acceptable mais améliorable (${costRatio.toFixed(2)}x). Opportunités d'optimisation identifiées.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📊'
      });
      riskScore += 15;
    } else if (costRatio <= costRatioThresholds.good) {
      recommendations.push({
        category: 'operationnel',
        title: 'Excellent Ratio Coût/FOB',
        description: `Ratio coût/FOB excellent (${costRatio.toFixed(2)}x). Vos coûts de revient prévisionnels sont bien maîtrisés.`,
        priority: 'basse',
        impact: 'positif',
        icon: '✅'
      });
      riskScore -= 5;
    }

    // Analyse dynamique du coût unitaire avec seuils adaptatifs
    const unitCostThresholds = {
      low: 100000,     // Faible
      medium: 300000,  // Moyen
      high: 500000,    // Élevé
      veryHigh: 800000 // Très élevé
    };

    if (avgUnitCost > unitCostThresholds.veryHigh) {
      recommendations.push({
        category: 'financier',
        title: 'Stratégie de Prix Premium Nécessaire',
        description: `Coût unitaire très élevé (${avgUnitCost.toLocaleString()} FCFA). Une marge de 40-50% est nécessaire pour maintenir la rentabilité. Positionnement premium recommandé.`,
        priority: 'haute',
        impact: 'positif',
        icon: '💰'
      });
      riskScore += 25;
    } else if (avgUnitCost > unitCostThresholds.high) {
      recommendations.push({
        category: 'financier',
        title: 'Stratégie de Prix Adaptée',
        description: `Coût unitaire élevé (${avgUnitCost.toLocaleString()} FCFA). Une marge de 30-35% est recommandée pour maintenir la rentabilité.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '💰'
      });
      riskScore += 15;
    } else if (avgUnitCost < unitCostThresholds.low) {
      recommendations.push({
        category: 'financier',
        title: 'Opportunité de Marge Élevée',
        description: `Coût unitaire faible (${avgUnitCost.toLocaleString()} FCFA). Excellente opportunité de marge élevée. Stratégie de prix agressive possible.`,
        priority: 'basse',
        impact: 'positif',
        icon: '🎯'
      });
      riskScore -= 10;
    }

    // Analyse spécifique des frais de transport
    if (transportRatio > 0.4) {
      recommendations.push({
        category: 'operationnel',
        title: 'Transport: Optimisation Critique',
        description: `Frais de transport très élevés (${(transportRatio * 100).toFixed(1)}% du FOB). Groupage obligatoire ou changement de fournisseur recommandé.`,
        priority: 'haute',
        impact: 'positif',
        icon: '🚛'
      });
      riskScore += 25;
    } else if (transportRatio > 0.25) {
      recommendations.push({
        category: 'operationnel',
        title: 'Optimisation du Transport',
        description: `Frais de transport élevés (${(transportRatio * 100).toFixed(1)}% du FOB). Envisager le groupage ou la négociation de tarifs préférentiels.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '🚛'
      });
      riskScore += 15;
    } else if (transportRatio < 0.1) {
      recommendations.push({
        category: 'operationnel',
        title: 'Transport Optimisé',
        description: `Frais de transport excellents (${(transportRatio * 100).toFixed(1)}% du FOB). Transport bien négocié.`,
        priority: 'basse',
        impact: 'positif',
        icon: '✅'
      });
      riskScore -= 5;
    }

    // Analyse des droits de douane
    if (dutyRatio > 0.3) {
      recommendations.push({
        category: 'operationnel',
        title: 'Droits de Douane Élevés',
        description: `Droits de douane élevés (${(dutyRatio * 100).toFixed(1)}% du FOB). Vérifier les accords commerciaux et les exemptions possibles.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📋'
      });
      riskScore += 20;
    }

    confidence += 25;
    return { recommendations, riskScore, confidence };
  }

  private static analyzeIncoterms(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    if (!data.incoterm) return { recommendations, riskScore, confidence };

    // Analyse selon l'incoterm
    switch (data.incoterm?.toUpperCase()) {
      case 'EXW':
        recommendations.push({
          category: 'operationnel',
          title: 'Révision Incoterms',
          description: 'Incoterm EXW : Vous assumez tous les risques et coûts. Étudier le passage en FOB ou CIF pour réduire les responsabilités.',
          priority: 'haute',
          impact: 'positif',
          icon: '📋'
        });
        riskScore += 25;
        break;
      
      case 'FOB':
        if (data.fret && data.fret > data.fob * 0.2) {
          recommendations.push({
            category: 'operationnel',
            title: 'Révision Incoterms',
            description: 'Incoterm FOB avec fret élevé. Étudier le passage en CIF pour réduire les frais de transport.',
            priority: 'moyenne',
            impact: 'positif',
            icon: '📋'
          });
          riskScore += 15;
        }
        break;
      
      case 'CIF':
        recommendations.push({
          category: 'operationnel',
          title: 'Incoterm CIF Optimal',
          description: 'Incoterm CIF bien choisi. Le fournisseur assume les coûts de transport et d\'assurance, réduisant vos risques.',
          priority: 'basse',
          impact: 'positif',
          icon: '✅'
        });
        riskScore -= 5; // Réduit le risque
        break;
    }

    confidence += 15;
    return { recommendations, riskScore, confidence };
  }

  private static analyzeLogistics(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    // Analyse du mode de transport
    if (data.modeTransport === 'maritime' && data.typeConteneur === '20 pieds') {
      recommendations.push({
        category: 'operationnel',
        title: 'Optimisation Logistique',
        description: 'Conteneur 20 pieds sélectionné. Pour des volumes importants, considérer le conteneur 40 pieds pour réduire le coût unitaire.',
        priority: 'moyenne',
        impact: 'positif',
        icon: '📦'
      });
      riskScore += 10;
    }

    // Analyse du nombre de conteneurs
    if (data.nombreConteneurs && data.nombreConteneurs > 1) {
      recommendations.push({
        category: 'operationnel',
        title: 'Négociation Volume',
        description: `Volume important (${data.nombreConteneurs} conteneurs). Négocier des tarifs dégressifs avec les prestataires logistiques.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📊'
      });
      riskScore += 5;
    }

    confidence += 15;
    return { recommendations, riskScore, confidence };
  }

  private static analyzeFinancial(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    // Analyse du mode de paiement
    if (data.modePaiement === 'Virement' && data.montantFacture && data.montantFacture > 10000) {
      recommendations.push({
        category: 'financier',
        title: 'Optimisation des Paiements',
        description: 'Montant important en virement. Considérer des instruments de paiement sécurisés (LC, garanties bancaires) pour réduire les risques.',
        priority: 'moyenne',
        impact: 'positif',
        icon: '💳'
      });
      riskScore += 20;
    }

    // Analyse des frais financiers
    if (data.fraisFinanciers && data.fraisFinanciers > data.fob * 0.05) {
      recommendations.push({
        category: 'financier',
        title: 'Gestion des Frais Financiers',
        description: 'Frais financiers élevés. Optimiser les délais de paiement et négocier de meilleures conditions bancaires.',
        priority: 'haute',
        impact: 'positif',
        icon: '🏦'
      });
      riskScore += 25;
    }

    // Analyse du taux de change
    if (data.devise && data.devise !== 'XOF' && data.tauxChange) {
      recommendations.push({
        category: 'financier',
        title: 'Gestion du Risque de Change',
        description: `Transaction en ${data.devise}. Considérer la couverture de change pour se protéger contre les fluctuations (taux actuel: ${data.tauxChange}).`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📈'
      });
      riskScore += 15;
    }

    confidence += 20;
    return { recommendations, riskScore, confidence };
  }

  private static analyzeVolume(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    if (!data.articles) return { recommendations, riskScore, confidence };

    const totalQuantity = data.articles.reduce((sum, article) => sum + article.quantite, 0);
    const totalWeight = data.articles.reduce((sum, article) => sum + (article.quantite * article.poidsUnitaire), 0);

    // Analyse du volume total
    if (totalQuantity > 100) {
      recommendations.push({
        category: 'operationnel',
        title: 'Optimisation des Volumes',
        description: `Volume important (${totalQuantity} unités, ${totalWeight.toFixed(1)} kg). Négocier des tarifs dégressifs et optimiser la logistique.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📊'
      });
      riskScore += 5;
    } else if (totalQuantity < 10) {
      recommendations.push({
        category: 'operationnel',
        title: 'Volume Faible',
        description: `Volume faible (${totalQuantity} unités). Considérer le groupage ou augmenter les quantités pour améliorer la rentabilité.`,
        priority: 'haute',
        impact: 'negatif',
        icon: '⚠️'
      });
      riskScore += 30;
    }

    // Analyse de la diversité des produits
    if (data.articles.length > 5) {
      recommendations.push({
        category: 'operationnel',
        title: 'Complexité de l\'Assortiment',
        description: `Assortiment diversifié (${data.articles.length} produits). Optimiser la gestion des stocks et les coûts de revient prévisionnels par produit.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '🎯'
      });
      riskScore += 10;
    }

    confidence += 15;
    return { recommendations, riskScore, confidence };
  }

  private static generateSummary(data: SimulationData, riskLevel: string, recommendationCount: number): string {
    const totalValue = data.totalCost || 0;
    const avgUnitCost = totalValue / (data.articles?.length || 1);
    
    let summary = `Analyse de votre simulation d'importation (${data.dossier || 'N/A'}) : `;
    
    if (riskLevel === 'faible') {
      summary += `Votre projet présente un profil de risque faible avec des coûts de revient prévisionnels maîtrisés (${avgUnitCost.toLocaleString()} FCFA/unité). `;
    } else if (riskLevel === 'moyen') {
      summary += `Votre projet présente un profil de risque moyen nécessitant quelques ajustements pour optimiser les coûts de revient prévisionnels (${avgUnitCost.toLocaleString()} FCFA/unité). `;
    } else {
      summary += `Votre projet présente un profil de risque élevé qui nécessite une attention particulière pour optimiser les coûts de revient prévisionnels (${avgUnitCost.toLocaleString()} FCFA/unité). `;
    }

    summary += `${recommendationCount} recommandations ont été générées pour améliorer la rentabilité et réduire les risques de votre opération d'importation.`;

    return summary;
  }

  private static analyzeArticles(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    if (!data.articles || data.articles.length === 0) return { recommendations, riskScore, confidence };

    // Analyse de la diversité des produits
    const productCount = data.articles.length;
    const totalQuantity = data.articles.reduce((sum, article) => sum + article.quantite, 0);
    const avgQuantityPerProduct = totalQuantity / productCount;
    
    // Analyse des codes SH
    const hsCodes = data.articles.map(a => a.codeHS);
    const uniqueHSChapters = new Set(hsCodes.map(code => code.substring(0, 2))).size;
    
    // Analyse des poids
    const totalWeight = data.articles.reduce((sum, article) => sum + (article.quantite * article.poidsUnitaire), 0);
    const avgWeightPerUnit = totalWeight / totalQuantity;

    // Recommandations basées sur la diversité
    if (productCount > 10) {
      recommendations.push({
        category: 'operationnel',
        title: 'Gestion d\'Assortiment Complexe',
        description: `Assortiment très diversifié (${productCount} produits, ${uniqueHSChapters} chapitres SH). Optimisation de la gestion des stocks et des coûts de revient prévisionnels par catégorie recommandée.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📊'
      });
      riskScore += 15;
    } else if (productCount === 1) {
      recommendations.push({
        category: 'operationnel',
        title: 'Spécialisation Monoproduit',
        description: `Importation spécialisée (${productCount} produit). Excellente opportunité de négociation de volume et d'optimisation des coûts de revient prévisionnels.`,
        priority: 'basse',
        impact: 'positif',
        icon: '🎯'
      });
      riskScore -= 5;
    }

    // Recommandations basées sur les quantités
    if (avgQuantityPerProduct < 5) {
      recommendations.push({
        category: 'operationnel',
        title: 'Quantités Faibles par Produit',
        description: `Quantité moyenne faible par produit (${avgQuantityPerProduct.toFixed(1)} unités). Considérer l'augmentation des volumes pour améliorer les tarifs et réduire les coûts de revient prévisionnels.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '⚠️'
      });
      riskScore += 20;
    } else if (avgQuantityPerProduct > 50) {
      recommendations.push({
        category: 'operationnel',
        title: 'Excellent Volume par Produit',
        description: `Volume excellent par produit (${avgQuantityPerProduct.toFixed(1)} unités). Excellente position de négociation pour optimiser les coûts de revient prévisionnels.`,
        priority: 'basse',
        impact: 'positif',
        icon: '✅'
      });
      riskScore -= 10;
    }

    // Recommandations basées sur le poids
    if (avgWeightPerUnit > 10) {
      recommendations.push({
        category: 'operationnel',
        title: 'Produits Lourds - Optimisation Transport',
        description: `Produits lourds (${avgWeightPerUnit.toFixed(1)} kg/unité). Optimiser l'arrimage et négocier des tarifs au poids avec les transporteurs.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '📦'
      });
      riskScore += 10;
    }

    confidence += 20;
    return { recommendations, riskScore, confidence };
  }

  private static analyzeTemporal(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    if (!data.dateFacture || !data.dateTransaction) return { recommendations, riskScore, confidence };

    // Analyse des délais
    const factureDate = new Date(data.dateFacture);
    const transactionDate = new Date(data.dateTransaction);
    const daysDifference = Math.abs((factureDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

    // Analyse de la saisonnalité
    const month = factureDate.getMonth() + 1;
    const isHighSeason = month >= 10 || month <= 2; // Octobre à Février

    if (daysDifference > 30) {
      recommendations.push({
        category: 'operationnel',
        title: 'Délai Facture-Transaction Élevé',
        description: `Délai important entre facture et transaction (${daysDifference} jours). Risque de fluctuation des taux de change et des coûts de revient prévisionnels.`,
        priority: 'moyenne',
        impact: 'negatif',
        icon: '⏰'
      });
      riskScore += 20;
    }

    if (isHighSeason) {
      recommendations.push({
        category: 'operationnel',
        title: 'Période de Haute Saison',
        description: `Importation en haute saison (${this.getMonthName(month)}). Augmentation possible des coûts de transport et nécessité d'anticiper les délais.`,
        priority: 'moyenne',
        impact: 'negatif',
        icon: '📅'
      });
      riskScore += 15;
    } else {
      recommendations.push({
        category: 'operationnel',
        title: 'Période de Basse Saison',
        description: `Importation en basse saison (${this.getMonthName(month)}). Opportunité de négocier de meilleurs tarifs de transport.`,
        priority: 'basse',
        impact: 'positif',
        icon: '✅'
      });
      riskScore -= 5;
    }

    confidence += 15;
    return { recommendations, riskScore, confidence };
  }

  private static analyzeGeographic(data: SimulationData): { recommendations: AIRecommendation[], riskScore: number, confidence: number } {
    const recommendations: AIRecommendation[] = [];
    let riskScore = 0;
    let confidence = 0;

    if (!data.paysFournisseur) return { recommendations, riskScore, confidence };

    // Analyse géographique basée sur le pays fournisseur
    const country = data.paysFournisseur.toLowerCase();
    
    // Pays avec accords préférentiels
    const preferentialCountries = ['france', 'allemagne', 'italie', 'espagne', 'belgique', 'pays-bas'];
    const asianCountries = ['chine', 'inde', 'vietnam', 'thailande', 'indonesie', 'malaisie'];
    const africanCountries = ['maroc', 'tunisie', 'egypte', 'afrique du sud', 'kenya'];
    const americanCountries = ['etats-unis', 'canada', 'bresil', 'mexique'];

    if (preferentialCountries.includes(country)) {
      recommendations.push({
        category: 'operationnel',
        title: 'Avantage Accords Commerciaux',
        description: `Fournisseur européen (${data.paysFournisseur}). Bénéfice des accords commerciaux UE-UEMOA pour réduire les droits de douane et optimiser les coûts de revient prévisionnels.`,
        priority: 'basse',
        impact: 'positif',
        icon: '✅'
      });
      riskScore -= 10;
    } else if (asianCountries.includes(country)) {
      recommendations.push({
        category: 'operationnel',
        title: 'Optimisation Transport Asiatique',
        description: `Fournisseur asiatique (${data.paysFournisseur}). Délais de transport longs, nécessité d'optimiser les coûts de revient prévisionnels et la gestion des stocks.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '🌏'
      });
      riskScore += 15;
    } else if (africanCountries.includes(country)) {
      recommendations.push({
        category: 'operationnel',
        title: 'Transport Intra-Africain',
        description: `Fournisseur africain (${data.paysFournisseur}). Opportunité de développement du commerce intra-africain avec des délais réduits.`,
        priority: 'basse',
        impact: 'positif',
        icon: '🌍'
      });
      riskScore -= 5;
    } else if (americanCountries.includes(country)) {
      recommendations.push({
        category: 'operationnel',
        title: 'Transport Transatlantique',
        description: `Fournisseur américain (${data.paysFournisseur}). Transport transatlantique avec coûts de revient prévisionnels spécifiques à optimiser.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '🌎'
      });
      riskScore += 10;
    }

    confidence += 15;
    return { recommendations, riskScore, confidence };
  }

  private static generateImmediateActions(data: SimulationData, existingRecommendations: AIRecommendation[]): AIRecommendation[] {
    const actions: AIRecommendation[] = [];
    
    // Génération d'actions basées sur les recommandations existantes
    const highPriorityRecs = existingRecommendations.filter(r => r.priority === 'haute');
    const negativeImpactRecs = existingRecommendations.filter(r => r.impact === 'negatif');

    if (highPriorityRecs.length > 0) {
      actions.push({
        category: 'action_immediate',
        title: 'Priorité 1: Actions Correctives Urgentes',
        description: `${highPriorityRecs.length} problème(s) critique(s) identifié(s). Actions correctives immédiates nécessaires dans les 15 jours.`,
        priority: 'haute',
        impact: 'positif',
        icon: '⚡',
        timeframe: '15 jours'
      });
    }

    if (negativeImpactRecs.length > 0) {
      actions.push({
        category: 'action_immediate',
        title: 'Priorité 2: Mitigation des Risques',
        description: `${negativeImpactRecs.length} risque(s) négatif(s) identifié(s). Plan de mitigation à mettre en place dans le mois.`,
        priority: 'moyenne',
        impact: 'positif',
        icon: '🛡️',
        timeframe: '1 mois'
      });
    }

    // Actions génériques basées sur les données
    if (data.fret && data.fret > data.fob * 0.3) {
      actions.push({
        category: 'action_immediate',
        title: 'Renégociation Transport',
        description: 'Frais de transport élevés détectés. Renégocier avec les transporteurs ou changer de fournisseur.',
        priority: 'moyenne',
        impact: 'positif',
        icon: '🚛',
        timeframe: '2 semaines'
      });
    }

    if (data.totalCost && data.fob && (data.totalCost / data.fob) > 2.5) {
      actions.push({
        category: 'action_immediate',
        title: 'Audit des Coûts',
        description: 'Ratio coût/FOB élevé. Audit complet des coûts de revient prévisionnels requis.',
        priority: 'haute',
        impact: 'positif',
        icon: '🔍',
        timeframe: '1 semaine'
      });
    }

    return actions;
  }

  private static getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
  }
}

export default AIAdvisorService;
