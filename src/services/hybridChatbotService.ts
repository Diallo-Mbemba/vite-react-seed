import ChatbotService from '../utils/chatbotService';
import OpenAIService, { SimulationContext, ChatMessage } from './openaiService';

interface HybridResponse {
  content: string;
  source: 'local' | 'openai' | 'fallback';
  confidence: number;
}

class HybridChatbotService {
  private openaiService: OpenAIService;
  private localService: typeof ChatbotService;

  constructor(openaiApiKey?: string) {
    this.openaiService = new OpenAIService(openaiApiKey);
    this.localService = ChatbotService;
  }

  /**
   * Génère une réponse hybride en combinant les services local et OpenAI
   */
  async generateResponse(
    userMessage: string,
    simulationData: any,
    conversationHistory: ChatMessage[] = []
  ): Promise<HybridResponse> {
    try {
      // 1. D'abord, analyser l'intention avec notre service local
      const intent = this.analyzeIntent(userMessage);
      
      // 2. Si c'est une question complexe ou nécessite une analyse approfondie, utiliser GPT-4
      if (this.shouldUseOpenAI(intent, userMessage)) {
        return await this.getOpenAIResponse(userMessage, simulationData, conversationHistory);
      }

      // 3. Sinon, utiliser notre service local intelligent
      return await this.getLocalResponse(userMessage, simulationData);

    } catch (error) {
      console.error('Erreur Hybrid Chatbot Service:', error);
      // Fallback vers le service local en cas d'erreur
      return await this.getLocalResponse(userMessage, simulationData);
    }
  }

  /**
   * Détermine si on doit utiliser OpenAI pour cette question
   */
  private shouldUseOpenAI(intent: any, message: string): boolean {
    // Questions complexes qui bénéficient de GPT-4
    const complexQuestions = [
      'comparaison',
      'scénario',
      'alternative',
      'recommandation détaillée',
      'analyse approfondie',
      'stratégie',
      'planification',
      'optimisation avancée',
      'risque détaillé',
      'conseil personnalisé'
    ];

    // Questions techniques ou réglementaires
    const technicalQuestions = [
      'réglementation',
      'loi',
      'décret',
      'convention',
      'accord',
      'traité',
      'norme',
      'standard',
      'procédure',
      'document'
    ];

    // Questions nécessitant une analyse contextuelle
    const contextualQuestions = [
      'pourquoi',
      'comment',
      'quand',
      'où',
      'quelle est la différence',
      'explique',
      'détaillée',
      'complet'
    ];

    const messageLower = message.toLowerCase();
    
    // Utiliser OpenAI si:
    // 1. La question contient des mots-clés complexes
    // 2. La question est très longue (analyse approfondie)
    // 3. La question demande une explication détaillée
    // 4. L'intention n'est pas clairement définie
    
    return (
      complexQuestions.some(keyword => messageLower.includes(keyword)) ||
      technicalQuestions.some(keyword => messageLower.includes(keyword)) ||
      contextualQuestions.some(keyword => messageLower.includes(keyword)) ||
      message.length > 100 ||
      intent.confidence < 0.6 ||
      messageLower.includes('explique') ||
      messageLower.includes('pourquoi') ||
      messageLower.includes('comment faire') ||
      messageLower.includes('guide') ||
      messageLower.includes('tutoriel')
    );
  }

  /**
   * Obtient une réponse d'OpenAI
   */
  private async getOpenAIResponse(
    userMessage: string,
    simulationData: any,
    conversationHistory: ChatMessage[]
  ): Promise<HybridResponse> {
    if (!this.openaiService.isConfigured()) {
      throw new Error('OpenAI API non configurée');
    }

    const context: SimulationContext = this.mapSimulationData(simulationData);
    const content = await this.openaiService.generateResponse(
      userMessage,
      context,
      conversationHistory
    );

    return {
      content,
      source: 'openai',
      confidence: 0.9
    };
  }

  /**
   * Obtient une réponse du service local
   */
  private async getLocalResponse(
    userMessage: string,
    simulationData: any
  ): Promise<HybridResponse> {
    const context = {
      simulationData,
      conversationHistory: [],
      currentTopic: undefined
    };

    const content = await this.localService.generateResponse(userMessage, context);

    return {
      content,
      source: 'local',
      confidence: 0.8
    };
  }

  /**
   * Mappe les données de simulation vers le format OpenAI
   */
  private mapSimulationData(simulationData: any): SimulationContext {
    const articles = simulationData.articles || simulationData.items || [];
    
    return {
      dossier: simulationData.dossier,
      numeroFacture: simulationData.numeroFacture,
      fob: simulationData.fob,
      totalCost: simulationData.totalCost,
      articles: articles.map((article: any) => ({
        designation: article.designation,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        codeHS: article.codeHS
      })),
      incoterm: simulationData.incoterm,
      modeTransport: simulationData.transport?.mode || simulationData.modeTransport,
      paysFournisseur: this.getPaysFournisseur(simulationData),
      devise: simulationData.devise,
      tauxChange: simulationData.tauxChange
    };
  }

  /**
   * Récupère le pays du fournisseur
   */
  private getPaysFournisseur(simulationData: any): string | undefined {
    if (simulationData.selectedActors?.fournisseur && simulationData.actors) {
      const fournisseur = simulationData.actors.find(
        (actor: any) => actor.id === simulationData.selectedActors.fournisseur
      );
      return fournisseur?.country;
    }
    return undefined;
  }

  /**
   * Analyse l'intention (copié du service local)
   */
  private analyzeIntent(message: string): { type: string; confidence: number } {
    const greetings = ['bonjour', 'salut', 'hello', 'hi', 'bonsoir'];
    const costKeywords = ['coût', 'prix', 'fob', 'total', 'montant', 'frais', 'budget', 'caf', 'coût assurance fret'];
    const transportKeywords = ['transport', 'fret', 'conteneur', 'logistique', 'livraison', 'shipping'];
    const incotermKeywords = ['incoterm', 'exw', 'fob', 'cif', 'ddp', 'ddp'];
    const optimizationKeywords = ['optimiser', 'améliorer', 'réduire', 'minimiser', 'maximiser', 'efficacité'];
    const riskKeywords = ['risque', 'danger', 'problème', 'difficulté', 'challenge', 'défi'];
    const pricingKeywords = ['marge', 'rentabilité', 'profit', 'bénéfice', 'stratégie prix'];
    const comparisonKeywords = ['comparer', 'différence', 'mieux', 'meilleur', 'alternative'];
    const articleKeywords = ['article', 'produit', 'marchandise', 'hs', 'code', 'quantité', 'poids', 'unitaire'];
    const helpKeywords = ['aide', 'help', 'assistance', 'comment', 'que faire', 'recommandation'];

    if (greetings.some(g => message.includes(g))) {
      return { type: 'greeting', confidence: 0.9 };
    }
    if (costKeywords.some(k => message.includes(k))) {
      return { type: 'cost_analysis', confidence: 0.8 };
    }
    if (transportKeywords.some(k => message.includes(k))) {
      return { type: 'transport_question', confidence: 0.8 };
    }
    if (incotermKeywords.some(k => message.includes(k))) {
      return { type: 'incoterm_question', confidence: 0.8 };
    }
    if (optimizationKeywords.some(k => message.includes(k))) {
      return { type: 'optimization_question', confidence: 0.8 };
    }
    if (riskKeywords.some(k => message.includes(k))) {
      return { type: 'risk_question', confidence: 0.8 };
    }
    if (pricingKeywords.some(k => message.includes(k))) {
      return { type: 'pricing_question', confidence: 0.8 };
    }
    if (articleKeywords.some(k => message.includes(k))) {
      return { type: 'article_question', confidence: 0.8 };
    }
    if (comparisonKeywords.some(k => message.includes(k))) {
      return { type: 'comparison_question', confidence: 0.8 };
    }
    if (helpKeywords.some(k => message.includes(k))) {
      return { type: 'help', confidence: 0.9 };
    }

    return { type: 'general_question', confidence: 0.5 };
  }

  /**
   * Vérifie si OpenAI est configuré
   */
  isOpenAIConfigured(): boolean {
    return this.openaiService.isConfigured();
  }

  /**
   * Configure OpenAI
   */
  configureOpenAI(apiKey: string): void {
    this.openaiService.updateConfig({ apiKey });
  }
}

export default HybridChatbotService;
export type { HybridResponse };

