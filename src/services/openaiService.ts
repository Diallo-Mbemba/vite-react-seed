interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface SimulationContext {
  dossier?: string;
  numeroFacture?: string;
  fob?: number;
  totalCost?: number;
  articles?: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
    codeHS: string;
  }>;
  incoterm?: string;
  modeTransport?: string;
  paysFournisseur?: string;
  devise?: string;
  tauxChange?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenAIService {
  private config: OpenAIConfig;

  constructor(apiKey?: string) {
    this.config = {
      apiKey: apiKey || import.meta.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7,
    };
  }

  /**
   * Génère une réponse GPT-4 basée sur le contexte de simulation
   */
  async generateResponse(
    userMessage: string, 
    simulationContext: SimulationContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Clé API OpenAI manquante');
      }

      const systemPrompt = this.buildSystemPrompt(simulationContext);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Garder les 10 derniers messages pour le contexte
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur OpenAI API: ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';

    } catch (error) {
      console.error('Erreur OpenAI Service:', error);
      throw error;
    }
  }

  /**
   * Construit le prompt système avec le contexte de simulation
   */
  private buildSystemPrompt(context: SimulationContext): string {
    const articles = context.articles || [];
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0);
    const totalValue = articles.reduce((sum, article) => sum + (article.prixUnitaire * article.quantite), 0);

    return `Tu es un expert IA spécialisé dans l'analyse des simulations d'importation en Côte d'Ivoire. 

CONTEXTE DE LA SIMULATION ACTUELLE:
- Dossier: ${context.dossier || 'Import'}
- Numéro facture: ${context.numeroFacture || 'N/A'}
- FOB: ${context.fob ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(context.fob) : 'N/A'}
- Coût total: ${context.totalCost ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(context.totalCost) : 'N/A'}
- Incoterm: ${context.incoterm || 'N/A'}
- Mode transport: ${context.modeTransport || 'N/A'}
- Pays fournisseur: ${context.paysFournisseur || 'N/A'}
- Devise: ${context.devise || 'XOF'}
- Taux de change: ${context.tauxChange || 'N/A'}

ARTICLES IMPORTÉS (${articles.length} produits):
${articles.map((article, index) => 
  `${index + 1}. ${article.designation} - ${article.quantite} unités - ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(article.prixUnitaire)}/unité - Code HS: ${article.codeHS}`
).join('\n')}

TOTAUX:
- Nombre total d'unités: ${totalUnits}
- Valeur totale FOB: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalValue)}

TON RÔLE:
Tu dois analyser cette simulation d'importation et répondre aux questions de l'utilisateur avec des conseils précis et personnalisés basés sur ces données réelles.

STYLE DE RÉPONSE:
- Utilise des données précises de la simulation
- Donne des conseils concrets et actionables
- Utilise des emojis pour rendre les réponses plus engageantes
- Structure tes réponses avec des titres et des listes
- Calcule des ratios et métriques pertinentes
- Propose des optimisations spécifiques à cette simulation

DOMAINES D'EXPERTISE:
- Analyse des coûts de revient prévisionnels et CAF
- Optimisation du transport et de la logistique
- Stratégies d'incoterms
- Gestion des risques d'importation
- Recommandations de prix et marges
- Réglementation douanière ivoirienne
- Optimisation fiscale et administrative

Réponds toujours en français et utilise les données exactes de cette simulation pour donner des conseils personnalisés.`;
  }

  /**
   * Vérifie si la clé API est configurée
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 0;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default OpenAIService;
export type { SimulationContext, ChatMessage };

