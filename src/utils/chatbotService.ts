interface SimulationData {
  // Informations générales
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
  
  // Acteurs commerciaux
  selectedActors?: {
    importateur?: string;
    fournisseur?: string;
    transitaire?: string;
  };
  actors?: Array<{
    id: string;
    name: string;
    country: string;
    type: string;
  }>;
  
  // Transport et logistique
  transport?: {
    mode?: string;
    route?: string;
    typeConteneur?: string;
    nombreConteneurs?: number;
  };
  modeTransport?: string;
  route?: string;
  typeConteneur?: string;
  nombreConteneurs?: number;
  poidsTotal?: number;
  
  // Articles
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
  items?: Array<{
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
  
  // Coûts
  fob?: number;
  fret?: number;
  assurance?: number;
  droitDouane?: number;
  tva?: number;
  totalCost?: number;
  rpi?: number;
  coc?: number;
  fraisFinanciers?: number;
  prestationTransitaire?: number;
  bsc?: number;
  tsDouane?: number;
  fraisImprevus?: number;
  creditEnlevement?: number;
  avanceFonds?: number;
  rrr?: number;
  rcp?: number;
  
  // Calculs automatiques
  autoCalculations?: {
    fobConversion?: boolean;
    fret?: boolean;
    assurance?: boolean;
    droitDouane?: boolean;
    coc?: boolean;
    rpi?: boolean;
    fraisFinanciers?: boolean;
    transitaire?: boolean;
    bsc?: boolean;
    fraisImprevus?: boolean;
    rrr?: boolean;
    rcp?: boolean;
    creditEnlevement?: boolean;
    avanceFonds?: boolean;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  simulationData: SimulationData;
  conversationHistory: ChatMessage[];
  currentTopic?: string;
}

class ChatbotService {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static async generateResponse(userMessage: string, context: ChatContext): Promise<string> {
    const message = userMessage.toLowerCase().trim();
    const simulationData = context.simulationData;

    const intent = this.analyzeIntent(message);

    switch (intent.type) {
      case 'greeting':
        return this.generateGreetingResponse(simulationData);
      case 'cost_analysis':
        return this.generateCostAnalysisResponse(simulationData, message);
      case 'transport_question':
        return this.generateTransportResponse(simulationData, message);
      case 'incoterm_question':
        return this.generateIncotermResponse(simulationData, message);
      case 'optimization_question':
        return this.generateOptimizationResponse(simulationData, message);
      case 'risk_question':
        return this.generateRiskAnalysisResponse(simulationData, message);
      case 'pricing_question':
        return this.generatePricingResponse(simulationData, message);
      case 'article_question':
        return this.generateArticleResponse(simulationData, message);
      case 'comparison_question':
        return this.generateComparisonResponse(simulationData, message);
      case 'general_question':
        return this.generateGeneralResponse(simulationData, message);
      case 'help':
        return this.generateHelpResponse();
      default:
        return this.generateDefaultResponse(simulationData);
    }
  }

  private static analyzeIntent(message: string): { type: string; confidence: number } {
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

  private static generateGreetingResponse(data: SimulationData): string {
    return `Bonjour ! 👋 Je suis votre assistant IA spécialisé dans l'analyse des simulations d'importation.

J'ai analysé votre simulation "${data.dossier || 'Import'}" et je peux vous aider avec :

📊 **Analyse des coûts** : Ratio FOB, coûts de revient prévisionnels, optimisation
🚛 **Transport & Logistique** : Fret, conteneurs, délais
📋 **Incoterms** : Optimisation des conditions commerciales
💰 **Stratégie de prix** : Marges, rentabilité
⚠️ **Gestion des risques** : Identification et mitigation
🎯 **Optimisation** : Recommandations personnalisées

Que souhaitez-vous savoir sur votre simulation ?`;
  }

  private static generateCostAnalysisResponse(data: SimulationData, message: string): string {
    const costRatio = data.totalCost && data.fob ? data.totalCost / data.fob : 0;
    const articles = data.articles || data.items || [];
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0) || 1;
    const avgUnitCost = data.totalCost ? data.totalCost / totalUnits : 0;
    const transportRatio = data.fret && data.fob ? (data.fret / data.fob) * 100 : 0;
    
    // Calcul de la CAF (Coût Assurance Fret)
    const caf = data.fob && data.fret && data.assurance ? 
      data.fob + data.fret + data.assurance : 
      data.totalCost || 0;

    let response = `## 📊 Analyse des Coûts de Revient Prévisionnels\n\n`;
    
    response += `**Données de votre simulation "${data.dossier || 'Import'}" :**\n\n`;
    
    // Informations générales
    if (data.numeroFacture) response += `• **N° Facture :** ${data.numeroFacture}\n`;
    if (data.dateFacture) response += `• **Date Facture :** ${data.dateFacture}\n`;
    if (data.devise && data.tauxChange) response += `• **Devise :** ${data.devise} (Taux: ${data.tauxChange})\n`;
    
    response += `\n**💰 Répartition des coûts :**\n`;
    response += `• **FOB :** ${this.formatCurrency(data.fob || 0)}\n`;
    response += `• **Fret :** ${this.formatCurrency(data.fret || 0)}\n`;
    response += `• **Assurance :** ${this.formatCurrency(data.assurance || 0)}\n`;
    response += `• **🎯 CAF (Coût Assurance Fret) :** **${this.formatCurrency(caf)}**\n`;
    response += `• **Droits de douane :** ${this.formatCurrency(data.droitDouane || 0)}\n`;
    response += `• **TVA :** ${this.formatCurrency(data.tva || 0)}\n`;
    response += `• **Autres frais :** ${this.formatCurrency((data.rpi || 0) + (data.coc || 0) + (data.fraisFinanciers || 0) + (data.prestationTransitaire || 0) + (data.bsc || 0) + (data.tsDouane || 0) + (data.fraisImprevus || 0) + (data.creditEnlevement || 0) + (data.avanceFonds || 0) + (data.rrr || 0) + (data.rcp || 0))}\n`;
    response += `• **🎯 Coût total final :** **${this.formatCurrency(data.totalCost || 0)}**\n\n`;

    response += `**📈 Analyses :**\n`;
    response += `• **Ratio coût/FOB :** ${costRatio.toFixed(2)}x\n`;
    response += `• **Coût unitaire moyen :** ${this.formatCurrency(avgUnitCost)}\n`;
    response += `• **Transport :** ${transportRatio.toFixed(1)}% du FOB\n`;
    response += `• **Nombre d'articles :** ${articles.length}\n`;
    response += `• **Total unités :** ${totalUnits}\n\n`;

    // Réponse spécifique selon la question
    if (message.includes('caf') || message.includes('coût assurance fret')) {
      response += `**🎯 Réponse à votre question sur la CAF :**\n`;
      response += `La **CAF (Coût Assurance Fret)** de votre simulation est de **${this.formatCurrency(caf)}**.\n\n`;
      response += `Cette valeur inclut :\n`;
      response += `• FOB : ${this.formatCurrency(data.fob || 0)}\n`;
      response += `• Fret : ${this.formatCurrency(data.fret || 0)}\n`;
      response += `• Assurance : ${this.formatCurrency(data.assurance || 0)}\n\n`;
    }

    if (costRatio > 3.0) {
      response += `⚠️ **Attention** : Votre ratio coût/FOB est élevé (${costRatio.toFixed(2)}x). Je recommande :\n`;
      response += `• Renégocier avec le fournisseur\n`;
      response += `• Optimiser la logistique (groupage)\n`;
      response += `• Revoir les incoterms (passer en CIF si possible)\n`;
    } else if (costRatio > 2.0) {
      response += `✅ **Bon** : Votre ratio coût/FOB est acceptable (${costRatio.toFixed(2)}x) mais peut être amélioré.\n`;
      response += `• Opportunités d'optimisation identifiées\n`;
      response += `• Considérer l'augmentation des volumes\n`;
    } else {
      response += `🎉 **Excellent** : Votre ratio coût/FOB est très bon (${costRatio.toFixed(2)}x) !\n`;
      response += `• Vos coûts de revient prévisionnels sont bien maîtrisés\n`;
    }

    return response;
  }

  private static generateTransportResponse(data: SimulationData, _message: string): string {
    const transportRatio = data.fret && data.fob ? (data.fret / data.fob) * 100 : 0;
    const articles = data.articles || data.items || [];
    const modeTransport = data.transport?.mode || data.modeTransport;
    const typeConteneur = data.transport?.typeConteneur || data.typeConteneur;
    const nombreConteneurs = data.transport?.nombreConteneurs || data.nombreConteneurs;
    const route = data.transport?.route || data.route;
    
    let response = `## 🚛 Analyse Transport & Logistique\n\n`;
    
    response += `**Configuration de votre simulation :**\n`;
    response += `• **Mode de transport :** ${modeTransport || 'N/A'}\n`;
    response += `• **Route :** ${route || 'N/A'}\n`;
    response += `• **Type de conteneur :** ${typeConteneur || 'N/A'}\n`;
    response += `• **Nombre de conteneurs :** ${nombreConteneurs || 'N/A'}\n`;
    response += `• **Fret total :** ${this.formatCurrency(data.fret || 0)}\n`;
    response += `• **Pourcentage du FOB :** ${transportRatio.toFixed(1)}%\n\n`;

    // Informations sur les acteurs
    if (data.selectedActors?.transitaire) {
      const transitaire = data.actors?.find(actor => actor.id === data.selectedActors?.transitaire);
      if (transitaire) {
        response += `• **Transitaire :** ${transitaire.name} (${transitaire.country})\n`;
      }
    }

    response += `\n**📊 Analyse du fret :**\n`;
    if (transportRatio > 30) {
      response += `⚠️ **Fret élevé** : Vos frais de transport représentent ${transportRatio.toFixed(1)}% du FOB.\n\n`;
      response += `**Recommandations :**\n`;
      response += `• Négocier des tarifs dégressifs avec le transporteur\n`;
      response += `• Envisager le groupage avec d'autres importateurs\n`;
      response += `• Comparer plusieurs transporteurs\n`;
      response += `• Optimiser l'arrimage du conteneur\n`;
      response += `• Considérer un conteneur plus grand si possible\n`;
    } else if (transportRatio > 20) {
      response += `✅ **Fret acceptable** : ${transportRatio.toFixed(1)}% du FOB. Quelques optimisations possibles.\n\n`;
      response += `**Suggestions d'amélioration :**\n`;
      response += `• Négocier des tarifs pour les prochaines expéditions\n`;
      response += `• Optimiser le chargement du conteneur\n`;
    } else {
      response += `🎉 **Fret optimisé** : ${transportRatio.toFixed(1)}% du FOB. Excellent !\n\n`;
      response += `**Points forts :**\n`;
      response += `• Vos frais de transport sont bien maîtrisés\n`;
      response += `• Configuration logistique efficace\n`;
    }

    // Suggestions spécifiques
    if (typeConteneur === '20 pieds' && articles.length > 5) {
      response += `\n💡 **Suggestion d'optimisation :**\n`;
      response += `Avec ${articles.length} produits différents, considérez un conteneur 40 pieds pour réduire le coût unitaire et optimiser l'espace.`;
    }

    if (modeTransport === 'maritime' && route) {
      response += `\n🌊 **Route maritime :** ${route}\n`;
      response += `• Vérifiez les tarifs de la ligne maritime\n`;
      response += `• Considérez les alternatives de ports d'arrivée\n`;
    }

    return response;
  }

  private static generateIncotermResponse(data: SimulationData, _message: string): string {
    const incoterm = data.incoterm?.toUpperCase();
    
    let response = `## 📋 Analyse Incoterms\n\n`;
    response += `**Incoterm de votre simulation : ${incoterm || 'N/A'}**\n\n`;

    // Informations contextuelles
    if (data.modePaiement) {
      response += `**Mode de paiement :** ${data.modePaiement}\n`;
    }
    if (data.selectedActors?.fournisseur) {
      const fournisseur = data.actors?.find(actor => actor.id === data.selectedActors?.fournisseur);
      if (fournisseur) {
        response += `**Fournisseur :** ${fournisseur.name} (${fournisseur.country})\n`;
      }
    }
    response += `\n`;

    switch (incoterm) {
      case 'EXW':
        response += `⚠️ **EXW (Ex Works)** : Vous assumez tous les risques et coûts.\n\n`;
        response += `**Inconvénients :**\n`;
        response += `• Responsabilité totale du transport\n`;
        response += `• Gestion complexe de la logistique\n`;
        response += `• Risques élevés\n\n`;
        response += `**Recommandation :** Passer en FOB ou CIF pour réduire les risques.`;
        break;
      
      case 'FOB':
        response += `✅ **FOB (Free On Board)** : Bon choix pour le contrôle.\n\n`;
        response += `**Avantages :**\n`;
        response += `• Contrôle du transport\n`;
        response += `• Négociation directe avec transporteurs\n`;
        response += `• Visibilité sur les coûts\n\n`;
        response += `**À considérer :** Si le fret est élevé (${((data.fret || 0) / (data.fob || 1) * 100).toFixed(1)}% du FOB), passer en CIF peut être avantageux.`;
        break;
      
      case 'CIF':
        response += `🎉 **CIF (Cost, Insurance, Freight)** : Excellent choix !\n\n`;
        response += `**Avantages :**\n`;
        response += `• Fournisseur gère transport et assurance\n`;
        response += `• Coûts prévisibles\n`;
        response += `• Risques réduits\n\n`;
        response += `**Optimal** pour votre simulation actuelle.`;
        break;
      
      default:
        response += `Je recommande d'analyser votre incoterm actuel. Voici les options :\n\n`;
        response += `• **EXW** : Maximum de contrôle, maximum de risques\n`;
        response += `• **FOB** : Équilibre entre contrôle et simplicité\n`;
        response += `• **CIF** : Simplicité et réduction des risques\n`;
        response += `• **DDP** : Maximum de simplicité, coût plus élevé`;
    }

    return response;
  }

  private static generateArticleResponse(data: SimulationData, message: string): string {
    const articles = data.articles || data.items || [];
    
    if (articles.length === 0) {
      return `## 📦 Analyse des Articles\n\nAucun article trouvé dans votre simulation. Veuillez vérifier que les données sont correctement saisies.`;
    }

    let response = `## 📦 Analyse des Articles\n\n`;
    response += `**Votre simulation contient ${articles.length} article(s) :**\n\n`;

    // Calculs globaux
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0);
    const totalWeight = articles.reduce((sum, article) => sum + (article.poidsUnitaire * article.quantite), 0);
    const totalValue = articles.reduce((sum, article) => sum + (article.prixUnitaire * article.quantite), 0);

    response += `**📊 Totaux :**\n`;
    response += `• **Nombre total d'unités :** ${totalUnits}\n`;
    response += `• **Poids total :** ${totalWeight.toFixed(2)} kg\n`;
    response += `• **Valeur totale FOB :** ${this.formatCurrency(totalValue)}\n\n`;

    // Détail des articles
    response += `**📋 Détail par article :**\n\n`;
    
    articles.forEach((article, index) => {
      const valueTotal = article.prixUnitaire * article.quantite;
      const weightTotal = article.poidsUnitaire * article.quantite;
      
      response += `**${index + 1}. ${article.designation}**\n`;
      response += `• **Code HS :** ${article.codeHS}\n`;
      response += `• **Quantité :** ${article.quantite} unités\n`;
      response += `• **Prix unitaire :** ${this.formatCurrency(article.prixUnitaire)}\n`;
      response += `• **Valeur totale :** ${this.formatCurrency(valueTotal)}\n`;
      response += `• **Poids unitaire :** ${article.poidsUnitaire} kg\n`;
      response += `• **Poids total :** ${weightTotal.toFixed(2)} kg\n`;
      
      // Coûts unitaires
      if (article.fretUnitaire || article.droitDouaneUnitaire || article.tvaUnitaire) {
        response += `• **Coûts unitaires :**\n`;
        if (article.fretUnitaire) response += `  - Fret : ${this.formatCurrency(article.fretUnitaire)}\n`;
        if (article.droitDouaneUnitaire) response += `  - Droits douane : ${this.formatCurrency(article.droitDouaneUnitaire)}\n`;
        if (article.tvaUnitaire) response += `  - TVA : ${this.formatCurrency(article.tvaUnitaire)}\n`;
      }
      
      response += `\n`;
    });

    // Réponse spécifique selon la question
    if (message.includes('quantité') || message.includes('quantite')) {
      response += `**🎯 Réponse sur les quantités :**\n`;
      response += `Vous importez un total de **${totalUnits} unités** réparties sur ${articles.length} article(s) différents.\n\n`;
    }

    if (message.includes('poids') || message.includes('poid')) {
      response += `**🎯 Réponse sur les poids :**\n`;
      response += `Le poids total de votre importation est de **${totalWeight.toFixed(2)} kg**.\n\n`;
    }

    if (message.includes('code hs') || message.includes('codehs')) {
      response += `**🎯 Codes HS de vos articles :**\n`;
      articles.forEach((article, index) => {
        response += `${index + 1}. ${article.codeHS} - ${article.designation}\n`;
      });
      response += `\n`;
    }

    return response;
  }

  private static generateOptimizationResponse(data: SimulationData, _message: string): string {
    const costRatio = data.totalCost && data.fob ? data.totalCost / data.fob : 0;
    const articles = data.articles || data.items || [];
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0);
    const transportRatio = data.fret && data.fob ? (data.fret / data.fob) * 100 : 0;
    
    let response = `## 🎯 Recommandations d'Optimisation\n\n`;
    response += `**Basé sur votre simulation "${data.dossier || 'Import'}", voici mes recommandations prioritaires :**\n\n`;

    // Analyse des ratios
    response += `**📊 Analyse de vos ratios :**\n`;
    response += `• Ratio coût/FOB : ${costRatio.toFixed(2)}x\n`;
    response += `• Transport/FOB : ${transportRatio.toFixed(1)}%\n`;
    response += `• Volume : ${totalUnits} unités\n`;
    response += `• Articles : ${articles.length} produits\n\n`;

    let priorityCount = 1;

    if (costRatio > 2.5) {
      response += `**${priorityCount}. Optimisation des Coûts (PRIORITÉ HAUTE)**\n`;
      response += `• Ratio coût/FOB : ${costRatio.toFixed(2)}x - À améliorer\n`;
      response += `• **Actions immédiates :**\n`;
      response += `  - Renégocier avec le fournisseur\n`;
      response += `  - Optimiser la logistique (groupage)\n`;
      response += `  - Revoir les incoterms (passer en CIF si possible)\n\n`;
      priorityCount++;
    }

    if (transportRatio > 25) {
      response += `**${priorityCount}. Optimisation Transport**\n`;
      response += `• Fret élevé : ${this.formatCurrency(data.fret || 0)} (${transportRatio.toFixed(1)}% du FOB)\n`;
      response += `• **Actions recommandées :**\n`;
      response += `  - Négocier des tarifs dégressifs\n`;
      response += `  - Envisager le groupage\n`;
      response += `  - Comparer plusieurs transporteurs\n`;
      response += `  - Optimiser l'arrimage du conteneur\n\n`;
      priorityCount++;
    }

    if (totalUnits < 50) {
      response += `**${priorityCount}. Augmentation des Volumes**\n`;
      response += `• Volume actuel : ${totalUnits} unités\n`;
      response += `• **Stratégies :**\n`;
      response += `  - Négocier des tarifs dégressifs\n`;
      response += `  - Créer des économies d'échelle\n`;
      response += `  - Planifier des importations régulières\n\n`;
      priorityCount++;
    }

    response += `**${priorityCount}. Stratégie Globale d'Optimisation**\n`;
    response += `• **Diversification :** Multiplier les sources d'approvisionnement\n`;
    response += `• **Négociation :** Établir des accords-cadres\n`;
    response += `• **Logistique :** Optimiser la gestion des stocks\n`;
    response += `• **Concurrence :** Analyser les prix du marché local\n`;
    response += `• **Réglementation :** Surveiller les évolutions douanières\n`;

    return response;
  }

  private static generateRiskAnalysisResponse(data: SimulationData, _message: string): string {
    const costRatio = data.totalCost && data.fob ? data.totalCost / data.fob : 0;
    const transportRatio = data.fret && data.fob ? (data.fret / data.fob) * 100 : 0;
    const articles = data.articles || data.items || [];
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0);
    
    const riskFactors: string[] = [];
    const riskLevels: string[] = [];
    
    // Analyse des risques
    if (costRatio > 3.0) {
      riskFactors.push('Ratio coût/FOB élevé');
      riskLevels.push('HAUT');
    }
    if (data.fret && data.fob && data.fret > data.fob * 0.3) {
      riskFactors.push('Fret élevé');
      riskLevels.push('MOYEN');
    }
    if (data.incoterm === 'EXW') {
      riskFactors.push('Incoterm EXW risqué');
      riskLevels.push('HAUT');
    }
    if (data.devise && data.devise !== 'XOF') {
      riskFactors.push('Risque de change');
      riskLevels.push('MOYEN');
    }
    if (totalUnits < 10) {
      riskFactors.push('Volume faible');
      riskLevels.push('FAIBLE');
    }
    if (articles.length > 10) {
      riskFactors.push('Complexité douanière');
      riskLevels.push('MOYEN');
    }
    
    let response = `## ⚠️ Analyse des Risques\n\n`;
    response += `**Profil de risque de votre simulation "${data.dossier || 'Import'}" :**\n\n`;
    
    if (riskFactors.length === 0) {
      response += `🎉 **Excellent** : Votre simulation présente un profil de risque faible !\n\n`;
      response += `**Points forts :**\n`;
      response += `• Coûts de revient prévisionnels maîtrisés (${costRatio.toFixed(2)}x)\n`;
      response += `• Transport optimisé (${transportRatio.toFixed(1)}% du FOB)\n`;
      response += `• Configuration logistique efficace\n`;
      response += `• Conditions commerciales favorables\n`;
    } else {
      response += `**Risques identifiés (${riskFactors.length}) :**\n\n`;
      
      riskFactors.forEach((risk, index) => {
        const level = riskLevels[index];
        const emoji = level === 'HAUT' ? '🔴' : level === 'MOYEN' ? '🟡' : '🟢';
        response += `${emoji} **${level}** : ${risk}\n`;
      });
      
      response += `\n**📋 Plan de mitigation personnalisé :**\n`;
      
      if (riskFactors.includes('Ratio coût/FOB élevé')) {
        response += `• **Surveillance renforcée** des ratios de coûts\n`;
        response += `• **Négociation continue** avec les fournisseurs\n`;
      }
      
      if (riskFactors.includes('Fret élevé')) {
        response += `• **Diversification** des transporteurs\n`;
        response += `• **Optimisation** de la logistique (groupage)\n`;
      }
      
      if (riskFactors.includes('Incoterm EXW risqué')) {
        response += `• **Évaluation** d'un changement d'incoterm\n`;
        response += `• **Assurance** renforcée\n`;
      }
      
      if (riskFactors.includes('Risque de change')) {
        response += `• **Couverture** de change\n`;
        response += `• **Surveillance** des taux\n`;
      }
      
      response += `• **Mise en place d'alertes** de seuils\n`;
      response += `• **Diversification** des sources d'approvisionnement\n`;
    }

    return response;
  }

  private static generatePricingResponse(data: SimulationData, _message: string): string {
    const articles = data.articles || data.items || [];
    const totalUnits = articles.reduce((sum, article) => sum + article.quantite, 0) || 1;
    const avgUnitCost = data.totalCost ? data.totalCost / totalUnits : 0;
    const costRatio = data.totalCost && data.fob ? data.totalCost / data.fob : 0;
    
    let response = `## 💰 Stratégie de Prix\n\n`;
    response += `**Analyse de prix pour votre simulation "${data.dossier || 'Import'}" :**\n\n`;
    
    response += `**📊 Données de base :**\n`;
    response += `• **Coût unitaire moyen :** ${this.formatCurrency(avgUnitCost)}\n`;
    response += `• **Coût total :** ${this.formatCurrency(data.totalCost || 0)}\n`;
    response += `• **FOB :** ${this.formatCurrency(data.fob || 0)}\n`;
    response += `• **Ratio coût/FOB :** ${costRatio.toFixed(2)}x\n`;
    response += `• **Nombre d'articles :** ${articles.length}\n`;
    response += `• **Total unités :** ${totalUnits}\n\n`;
    
    response += `**🎯 Recommandations de marge par segment :**\n\n`;
    
    if (avgUnitCost > 800000) {
      response += `**Segment PREMIUM (${this.formatCurrency(avgUnitCost)}/unité)**\n`;
      response += `• **Marge recommandée :** 40-50%\n`;
      response += `• **Prix de vente suggéré :** ${this.formatCurrency(avgUnitCost * 1.45)}\n`;
      response += `• **Stratégie :** Positionnement premium, qualité supérieure\n`;
      response += `• **Marché cible :** Clients haut de gamme\n\n`;
    } else if (avgUnitCost > 300000) {
      response += `**Segment STANDARD (${this.formatCurrency(avgUnitCost)}/unité)**\n`;
      response += `• **Marge recommandée :** 30-35%\n`;
      response += `• **Prix de vente suggéré :** ${this.formatCurrency(avgUnitCost * 1.33)}\n`;
      response += `• **Stratégie :** Positionnement standard, équilibre qualité/prix\n`;
      response += `• **Marché cible :** Clientèle moyenne\n\n`;
    } else {
      response += `**Segment COMPÉTITIF (${this.formatCurrency(avgUnitCost)}/unité)**\n`;
      response += `• **Marge recommandée :** 25-30%\n`;
      response += `• **Prix de vente suggéré :** ${this.formatCurrency(avgUnitCost * 1.28)}\n`;
      response += `• **Stratégie :** Positionnement compétitif, volume\n`;
      response += `• **Marché cible :** Marché de masse\n\n`;
    }

    // Analyse par article si plusieurs articles
    if (articles.length > 1) {
      response += `**📋 Analyse par article :**\n\n`;
      articles.forEach((article, index) => {
        const unitCost = (article.prixUnitaire || 0) + (article.fretUnitaire || 0) + (article.droitDouaneUnitaire || 0) + (article.tvaUnitaire || 0);
        const suggestedPrice = unitCost * (unitCost > 800000 ? 1.45 : unitCost > 300000 ? 1.33 : 1.28);
        
        response += `${index + 1}. **${article.designation}**\n`;
        response += `   • Coût unitaire : ${this.formatCurrency(unitCost)}\n`;
        response += `   • Prix suggéré : ${this.formatCurrency(suggestedPrice)}\n`;
        response += `   • Marge : ${((suggestedPrice - unitCost) / suggestedPrice * 100).toFixed(1)}%\n\n`;
      });
    }

    response += `**🎯 Facteurs de pricing à considérer :**\n`;
    response += `• **Concurrence locale :** Analyser les prix du marché\n`;
    response += `• **Pouvoir d'achat :** Adapter au niveau économique local\n`;
    response += `• **Positionnement marque :** Premium vs compétitif\n`;
    response += `• **Objectifs volume :** Marge vs rotation\n`;
    response += `• **Coûts opérationnels :** Stockage, distribution, SAV\n`;
    response += `• **Réglementation :** Prix minimum, taxes locales`;

    return response;
  }

  private static generateComparisonResponse(_data: SimulationData, _message: string): string {
    return `## 🔍 Analyse Comparative\n\nPour une comparaison précise, j'ai besoin de plus de détails sur ce que vous souhaitez comparer :

**Options disponibles :**
• Différents fournisseurs
• Diverses options d'incoterms
• Plusieurs modes de transport
• Différentes stratégies de prix
• Alternatives de financement

**Exemple de question :**
"Quelle serait la différence de coût entre FOB et CIF ?"
"Comparer un conteneur 20 pieds vs 40 pieds"

Que souhaitez-vous comparer spécifiquement ?`;
  }

  private static generateGeneralResponse(data: SimulationData, _message: string): string {
    return `Je peux vous aider à analyser votre simulation d'importation. Voici ce que je peux faire :

**📊 Analyses disponibles :**
• Coûts de revient prévisionnels
• Optimisation transport et logistique
• Stratégies d'incoterms
• Gestion des risques
• Recommandations de prix
• Optimisations générales

**💡 Exemples de questions :**
• "Comment réduire mes coûts de transport ?"
• "Mon incoterm est-il optimal ?"
• "Quels sont les risques de cette simulation ?"
• "Comment optimiser ma marge ?"

Que souhaitez-vous savoir sur votre simulation "${data.dossier || 'Import'}" ?`;
  }

  private static generateHelpResponse(): string {
    return `## 🆘 Guide d'Utilisation du Chatbot IA

**Comment poser vos questions :**

**📊 Pour l'analyse des coûts :**
• "Analyser mes coûts"
• "Comment réduire mes frais ?"
• "Mon ratio FOB est-il bon ?"

**🚛 Pour le transport :**
• "Optimiser le transport"
• "Fret trop élevé"
• "Conteneur 20 vs 40 pieds"

**📋 Pour les incoterms :**
• "Mon incoterm est optimal ?"
• "FOB vs CIF"
• "Changer d'incoterm"

**💰 Pour la stratégie de prix :**
• "Quelle marge appliquer ?"
• "Stratégie de prix"
• "Positionnement produit"

**⚠️ Pour les risques :**
• "Quels sont les risques ?"
• "Comment minimiser les risques ?"

**🎯 Pour l'optimisation :**
• "Comment optimiser ?"
• "Améliorer la rentabilité"
• "Recommandations"

Posez votre question naturellement, je comprends le contexte ! 😊`;
  }

  private static generateDefaultResponse(data: SimulationData): string {
    return `Je comprends que vous avez une question sur votre simulation "${data.dossier || 'Import'}".

Basé sur vos données actuelles :
• Coût total : ${this.formatCurrency(data.totalCost || 0)}
• Articles : ${data.articles?.length || 0} produits
• Incoterm : ${data.incoterm || 'N/A'}
• Transport : ${data.modeTransport || 'N/A'}

Pouvez-vous être plus spécifique ? Je peux vous aider avec :
• L'analyse des coûts
• L'optimisation transport
• La stratégie de prix
• La gestion des risques
• Les recommandations générales

Que souhaitez-vous savoir ? 🤔`;
  }
}

export default ChatbotService;
