import { jsPDF } from 'jspdf';
import { getActorById } from '../data/actors';
import { findTECArticleByCode } from '../data/tec';
import type { SimulationResult } from '../types';

export const generatePDFReport = async (result: any, chartCanvas: HTMLCanvasElement | null) => {
  try {
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF n\'est pas disponible. Veuillez vérifier l\'installation.');
    }
    
    const pdf = new jsPDF('p', 'mm', 'a4'); // Orientation portrait pour plus d'espace
    
    // Configuration des couleurs professionnelles avec meilleur contraste
    const colors = {
      primary: [0, 0, 0],        // Noir
      secondary: [75, 75, 75],   // Gris foncé amélioré
      accent: [100, 100, 100],   // Gris moyen amélioré
      lightGray: [248, 250, 252], // Gris très clair pour fond
      border: [209, 213, 219],   // Gris bordure plus visible
      white: [255, 255, 255],    // Blanc
      orange: [245, 101, 101],   // Orange pour les taxes
      blue: [59, 130, 246],      // Bleu pour les frais annexes
      green: [34, 197, 94],      // Vert pour le total
      darkBlue: [30, 58, 138],   // Bleu foncé pour les titres
      darkGreen: [21, 128, 61]   // Vert foncé pour les totaux
    };
    
    // Configuration des dimensions (portrait)
    const margin = 15;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - 2 * margin;
    
    let yPosition = margin;
    
    // Fonction pour ajouter du texte avec style
    const addText = (text: string | number, x: number, y: number, options: any = {}) => {
      const { 
        fontSize = 10, 
        fontStyle = 'normal', 
        color = colors.primary, 
        align = 'left',
        maxWidth = contentWidth 
      } = options;
      
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      
      if (fontStyle === 'bold') {
        pdf.setFont('helvetica', 'bold');
      } else if (fontStyle === 'italic') {
        pdf.setFont('helvetica', 'italic');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      const textString = String(text);
      pdf.text(textString, x, y, { align, maxWidth });
      return y + fontSize * 0.4;
    };
    
    // Fonction pour ajouter un rectangle avec bordure arrondie esthétique
    const addRect = (x: number, y: number, width: number, height: number, options: any = {}) => {
      const { fillColor, strokeColor, lineWidth = 1.0, rounded = false, radius = 2 } = options;
      
      if (fillColor) {
        pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      }
      if (strokeColor) {
        pdf.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
      }
      pdf.setLineWidth(lineWidth);
      
      // Pour simuler des bordures arrondies, on utilise une approche avec des cercles aux coins
      if (rounded) {
        // Dessiner le rectangle principal avec remplissage
        if (fillColor) {
          pdf.rect(x, y, width, height, 'F');
        }
        
        // Dessiner les coins arrondis avec des cercles
        const cornerRadius = Math.min(radius, Math.min(width, height) / 2);
        
        // Coin supérieur gauche
        pdf.circle(x + cornerRadius, y + cornerRadius, cornerRadius, fillColor ? 'F' : 'S');
        
        // Coin supérieur droit
        pdf.circle(x + width - cornerRadius, y + cornerRadius, cornerRadius, fillColor ? 'F' : 'S');
        
        // Coin inférieur gauche
        pdf.circle(x + cornerRadius, y + height - cornerRadius, cornerRadius, fillColor ? 'F' : 'S');
        
        // Coin inférieur droit
        pdf.circle(x + width - cornerRadius, y + height - cornerRadius, cornerRadius, fillColor ? 'F' : 'S');
        
        // Dessiner les bordures droites entre les coins
        if (strokeColor) {
          // Bordure supérieure
          pdf.line(x + cornerRadius, y, x + width - cornerRadius, y);
          // Bordure inférieure
          pdf.line(x + cornerRadius, y + height, x + width - cornerRadius, y + height);
          // Bordure gauche
          pdf.line(x, y + cornerRadius, x, y + height - cornerRadius);
          // Bordure droite
          pdf.line(x + width, y + cornerRadius, x + width, y + height - cornerRadius);
        }
      } else {
        // Rectangle normal sans bordures arrondies
        pdf.rect(x, y, width, height, fillColor ? 'FD' : 'S');
      }
    };
    
    // Fonction pour formater la monnaie
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
      }).format(amount).replace(/\s/g, ' ');
    };
    
    // === EN-TÊTE ===
    // Logo stylisé (cercle simple)
    addRect(margin, yPosition, 8, 8, { fillColor: colors.primary });
    addText('KPRAGUE', margin + 12, yPosition + 6, {
      fontSize: 16,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    // Titre principal
    addText('RAPPORT DE COÛT DE REVIENT MARITIME', margin + 80, yPosition + 6, {
      fontSize: 14,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    // Date d'impression
    addText(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPosition + 6, {
      fontSize: 10,
      color: colors.secondary,
      align: 'right'
    });
    
    yPosition += 20;
    
    // === EN-TÊTE AVEC COÛT TOTAL ===
    addRect(margin, yPosition, contentWidth, 25, { fillColor: colors.lightGray, strokeColor: colors.border, lineWidth: 1.5, rounded: true, radius: 3 });
    addText(formatCurrency(result.totalCost || 0), pageWidth / 2, yPosition + 12, {
      fontSize: 24,
      fontStyle: 'bold',
      color: colors.darkGreen,
      align: 'center'
    });
    addText('(Coût de revient total selon formules douanières)', pageWidth / 2, yPosition + 20, {
      fontSize: 10, 
      color: colors.secondary,
      align: 'center'
    });
    
    yPosition += 30;
    
    // === INFORMATIONS GÉNÉRALES ET ACTEURS ===
    const leftColumnWidth = contentWidth * 0.48;
    const rightColumnWidth = contentWidth * 0.48;
    const gap = contentWidth * 0.04;
    
    // Informations Générales (Étape 2)
    addRect(margin, yPosition, leftColumnWidth, 60, { fillColor: colors.white, strokeColor: colors.border, lineWidth: 1.2, rounded: true, radius: 3 });
    addText('INFORMATIONS GÉNÉRALES (ÉTAPE 2)', margin + 5, yPosition + 8, { fontSize: 11, fontStyle: 'bold', color: colors.darkBlue });
    
    const generalInfo = [
      ['Dossier:', result.dossier || 'Non spécifié'],
      ['N° Facture:', result.numeroFacture || 'Non spécifié'],
      ['Date Facture:', result.dateFacture || 'Non spécifiée'],
      ['Date Transaction:', result.dateTransaction || 'Non spécifiée'],
      ['Montant Facture:', `${formatCurrency(result.montantFacture || 0)} ${result.devise || 'EUR'}`],
      ['Taux de Change:', result.tauxChange || 655.957],
      ['Incoterm:', result.incoterm || 'Non spécifié'],
      ['Régime Douanier:', result.regimeDouanier || 'Non spécifié'],
      ['Mode de Paiement:', result.modePaiement || 'Non spécifié']
    ];
    
    generalInfo.forEach(([label, value], index) => {
      const y = yPosition + 15 + (index * 5);
      addText(String(label), margin + 5, y, { fontSize: 8, color: colors.secondary });
      addText(String(value), margin + 45, y, { fontSize: 8, fontStyle: 'bold', color: colors.darkBlue });
    });
    
    // Acteurs Commerciaux (Étape 3)
    addRect(margin + leftColumnWidth + gap, yPosition, rightColumnWidth, 60, { fillColor: colors.white, strokeColor: colors.border, lineWidth: 1.2, rounded: true, radius: 3 });
    addText('ACTEURS COMMERCIAUX (ÉTAPE 3)', margin + leftColumnWidth + gap + 5, yPosition + 8, { fontSize: 11, fontStyle: 'bold', color: colors.darkBlue });
    
    const actors = [
      ['Importateur:', getActorById(result.selectedActors?.importateur)?.nom || 'Non spécifié'],
      ['Fournisseur:', getActorById(result.selectedActors?.fournisseur)?.nom || 'Non spécifié'],
      ['Transitaire:', getActorById(result.selectedActors?.transitaire)?.nom || 'Non spécifié']
    ];
    
    actors.forEach(([label, value], index) => {
      const y = yPosition + 15 + (index * 8);
      addText(String(label), margin + leftColumnWidth + gap + 5, y, { fontSize: 8, color: colors.secondary });
      addText(String(value), margin + leftColumnWidth + gap + 35, y, { fontSize: 8, fontStyle: 'bold', color: colors.darkBlue, maxWidth: rightColumnWidth - 40 });
    });
    
    yPosition += 65;
    
    // === TRANSPORT ET LOGISTIQUE (ÉTAPE 4) ===
    addRect(margin, yPosition, contentWidth, 35, { fillColor: colors.white, strokeColor: colors.border, lineWidth: 1.2, rounded: true, radius: 3 });
    addText('TRANSPORT ET LOGISTIQUE (ÉTAPE 4)', margin + 5, yPosition + 8, { fontSize: 11, fontStyle: 'bold', color: colors.darkBlue });
    
    const transportInfo = [
      ['Mode de Transport:', result.transport?.mode || 'Non spécifié'],
      ['Route:', result.transport?.route || 'Non spécifiée'],
      ['Type de Conteneur:', result.transport?.typeConteneur || 'Non spécifié'],
      ['Nombre de Conteneurs:', result.transport?.nombreConteneurs || 1],
      ['Poids Total:', result.transport?.poidsTotalTonnes ? `${result.transport.poidsTotalTonnes} tonnes (${parseFloat(result.transport.poidsTotalTonnes) * 1000} kg)` : 'Non spécifié'],
      ['Inclure Transitaire:', result.includeTransitaire ? 'Oui' : 'Non'],
      ['Inclure TVA:', result.includeTVA ? 'Oui' : 'Non'],
      ['Marchandises Dangereuses:', result.isDangerous ? 'Oui' : 'Non']
    ];
    
    transportInfo.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = margin + 5 + (col * contentWidth / 2);
      const y = yPosition + 15 + (row * 6);
      
      addText(String(label), x, y, { fontSize: 8, color: colors.secondary });
      addText(String(value), x + 50, y, { fontSize: 8, fontStyle: 'bold', color: colors.darkBlue });
    });
    
    yPosition += 40;
    
    // === DÉTAIL DES COÛTS ===
    addRect(margin, yPosition, leftColumnWidth, 120, { fillColor: colors.white, strokeColor: colors.border, lineWidth: 1.2, rounded: true, radius: 3 });
    addText('DÉTAIL DES COÛTS ESTIMÉS GLOBAUX:', margin + 5, yPosition + 8, { fontSize: 11, fontStyle: 'bold', color: colors.darkBlue });
    
    let costY = yPosition + 15;
    
    // Coûts de base
    const baseCosts = [
      ['Valeur FOB (marchandises en devise locale):', result.fob || 0],
      ['Frais de transport:', result.fret || 0],
      ['Assurance:', result.assurance || 0]
    ];
    
    baseCosts.forEach(([label, amount]) => {
      addText(String(label), margin + 5, costY, { fontSize: 8, color: colors.secondary });
      addText(formatCurrency(amount), margin + leftColumnWidth - 10, costY, { fontSize: 8, fontStyle: 'bold', color: colors.darkBlue, align: 'right' });
      costY += 5;
    });
    
    costY += 3;
    
    // Taxes Douanières
    addRect(margin + 2, costY, leftColumnWidth - 4, 20, { fillColor: [255, 237, 213], strokeColor: colors.orange, lineWidth: 1.0, rounded: true, radius: 2 });
    addText('Taxes Douanières:', margin + 5, costY + 5, { fontSize: 9, fontStyle: 'bold', color: colors.orange });
    addText(`DD: ${formatCurrency((result.droitDouane || 0) * 0.7)}`, margin + 5, costY + 10, { fontSize: 7, color: colors.secondary });
    addText(`+ TVA: ${formatCurrency((result.droitDouane || 0) * 0.3)}`, margin + 5, costY + 15, { fontSize: 7, color: colors.secondary });
    addText(`Total Taxes: ${formatCurrency(result.droitDouane || 0)}`, margin + leftColumnWidth - 10, costY + 15, { fontSize: 8, fontStyle: 'bold', color: colors.orange, align: 'right' });
    
    costY += 25;
    
    // Frais Annexes
    addRect(margin + 2, costY, leftColumnWidth - 4, 50, { fillColor: [219, 234, 254], strokeColor: colors.blue, lineWidth: 1.0, rounded: true, radius: 2 });
    addText('Frais Annexes:', margin + 5, costY + 5, { fontSize: 9, fontStyle: 'bold', color: colors.blue });
    
    const additionalCosts = [
      ['RPI:', result.rpi || 0],
      ['COC:', result.coc || 0],
      ['Frais Financiers:', result.fraisFinanciers || 0],
      ['Frais de Transitaire:', result.prestationTransitaire || 0],
      ['Frais BSC (Sécurité Container):', result.bsc || 0],
      ['Crédit d\'enlèvement:', result.creditEnlevement || 0],
      ['Avance de fonds:', result.avanceFonds || 0],
      ['Redevance de Régularisation (RRR):', result.rrr || 0],
      ['Redevance Contrôle des Prix (RCP):', result.rcp || 0],
      ['TS Douane:', result.tsDouane || 0]
    ];
    
    additionalCosts.forEach(([label, amount], index) => {
      const y = costY + 10 + (index * 3);
      addText(`• ${label}`, margin + 5, y, { fontSize: 6, color: colors.secondary });
      addText(formatCurrency(amount), margin + leftColumnWidth - 10, y, { fontSize: 6, fontStyle: 'bold', color: colors.primary, align: 'right' });
    });
    
    const totalAdditionalCosts = (result.rpi || 0) + (result.coc || 0) + (result.fraisFinanciers || 0) + (result.prestationTransitaire || 0) + (result.bsc || 0) + (result.creditEnlevement || 0) + (result.avanceFonds || 0) + (result.rrr || 0) + (result.rcp || 0) + (result.tsDouane || 0);
    addText('Total Frais Annexes:', margin + 5, costY + 40, { fontSize: 8, fontStyle: 'bold', color: colors.secondary });
    addText(formatCurrency(totalAdditionalCosts), margin + leftColumnWidth - 10, costY + 40, { fontSize: 8, fontStyle: 'bold', color: colors.primary, align: 'right' });
    
    // Résumé du coût total
    addRect(margin + leftColumnWidth + gap, yPosition, rightColumnWidth, 40, { fillColor: [220, 252, 231], strokeColor: colors.green, lineWidth: 1.5, rounded: true, radius: 3 });
    addText('Coût de revient total:', margin + leftColumnWidth + gap + 5, yPosition + 10, { fontSize: 12, fontStyle: 'bold', color: colors.darkGreen });
    addText(formatCurrency(result.totalCost || 0), margin + leftColumnWidth + gap + 5, yPosition + 20, { fontSize: 16, fontStyle: 'bold', color: colors.darkGreen });
    addText('Coût de revient unitaire moyen (pour 15 unités):', margin + leftColumnWidth + gap + 5, yPosition + 30, { fontSize: 8, color: colors.secondary });
    addText(formatCurrency((result.totalCost || 0) / 15), margin + leftColumnWidth + gap + 5, yPosition + 35, { fontSize: 10, fontStyle: 'bold', color: colors.darkBlue });
    
    yPosition += 125;
    
    // === GRAPHIQUE EN CAMEMBERT ===
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }
    
    addRect(margin, yPosition, contentWidth, 60, { fillColor: colors.white, strokeColor: colors.border, lineWidth: 1.2, rounded: true, radius: 3 });
    addText('RÉPARTITION DES COÛTS', margin + 5, yPosition + 8, { fontSize: 11, fontStyle: 'bold', color: colors.darkBlue, align: 'center' });
    
    // Ajouter le graphique en camembert si disponible
    if (chartCanvas) {
      try {
        const chartImage = chartCanvas.toDataURL('image/png');
        const imgWidth = 60; // Réduire la taille
        const imgHeight = 60; // Réduire la taille
        const imgX = margin + 10;
        const imgY = yPosition + 15;
        
        // Vérifier que l'image reste dans les limites de la page
        if (imgY + imgHeight < pageHeight - margin) {
          pdf.addImage(chartImage, 'PNG', imgX, imgY, imgWidth, imgHeight);
        }
      } catch (error) {
        console.warn('Impossible d\'ajouter le graphique:', error);
      }
    }
    
    // Données du graphique à côté
    const chartData = [
      { label: 'Marchandises (HT)', value: result.fob || 0, color: '#3B82F6' },
      { label: 'Fret', value: result.fret || 0, color: '#10B981' },
      { label: 'Assurance', value: result.assurance || 0, color: '#F59E0B' },
      { label: 'Droits et Taxes', value: result.droitDouane || 0, color: '#EF4444' },
      { label: 'Prestation Transitaire', value: result.prestationTransitaire || 0, color: '#8B5CF6' },
      { label: 'Frais Annexes', value: totalAdditionalCosts, color: '#6B7280' }
    ].filter(item => item.value > 0);
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    
    // Légendes à droite du graphique
    const legendX = margin + 80; // Ajuster pour la nouvelle taille du graphique
    const legendY = yPosition + 15;
    
    chartData.forEach((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const y = legendY + (index * 8);
      
      // Carré de couleur avec bordures arrondies
      addRect(legendX, y - 1, 3, 3, { fillColor: [parseInt(item.color.slice(1, 3), 16), parseInt(item.color.slice(3, 5), 16), parseInt(item.color.slice(5, 7), 16)], rounded: true, radius: 0.5 });
      
      addText(`${item.label}:`, legendX + 8, y, { fontSize: 7, color: colors.secondary });
      addText(`${percentage.toFixed(1)}%`, legendX + 80, y, { fontSize: 7, fontStyle: 'bold', color: colors.darkBlue, align: 'right' });
      addText(formatCurrency(item.value), legendX + 110, y, { fontSize: 7, fontStyle: 'bold', color: colors.darkBlue, align: 'right' });
    });
    
    // Numéro de page
    addText('1/1', pageWidth - margin, pageHeight - 10, { fontSize: 10, color: colors.secondary, align: 'right' });
    
    // Sauvegarder le PDF
    const fileName = `rapport_cout_revient_${result.numeroFacture || result.dossier || 'kprague'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Nouveau: Générer un récapitulatif PDF regroupé par Code SH avec colonnes de droits/taxes
export const generateGroupedByCodeSHPDF = async (result: SimulationResult) => {
  if (typeof jsPDF === 'undefined') {
    throw new Error("jsPDF n'est pas disponible. Veuillez vérifier l'installation.");
  }

  const pdf = new jsPDF('l', 'mm', 'a4'); // Format paysage
  const margin = 12;
  const pageWidth = 297; // Largeur en paysage
  const pageHeight = 210; // Hauteur en paysage
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addText = (text: string, x: number, yPos: number, size = 9, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.text(String(text), x, yPos);
  };

  const addHeader = () => {
    addText('Récapitulatif par Code SH - Droits & Taxes', margin, y, 14, 'bold');
    y += 6;
    addText(`Facture: ${result.numeroFacture || ''} • Dossier: ${result.dossier || ''}`, margin, y, 9);
    y += 6;
    addText(`Date: ${result.dateFacture || ''}`, margin, y, 9);
    y += 6;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // Calculer les totaux pour répartitions unitaires (même logique que le modal)
  const totalQuantity = (result.items || []).reduce((sum: number, item: any) => sum + (item.quantite || 1), 0) || 1;
  const totalWeightKg = (result.items || []).reduce((sum: number, item: any) => sum + ((item.poids || 0) * (item.quantite || 1)), 0);
  const totalFOB = (result.items || []).reduce((sum: number, item: any) => sum + (item.prixTotal || ((item.prixUnitaire || 0) * (item.quantite || 1))), 0);

  // Calculer les données des produits avec les mêmes calculs que le modal
  const productData = (result.items || []).map((article: any) => {
    const quantite = article.quantite || 1;
    const poids = article.poids || 0;
    const codeHS = article.codeHS;
    const tec = codeHS ? findTECArticleByCode(codeHS) : null;
    
    // Prix unitaire FOB
    const prixUnitaireFOB = article.prixUnitaire || 0;
    const prixTotalFOB = article.prixTotal || (prixUnitaireFOB * quantite);
    
    // Répartition du fret au prorata du poids
    const poidsTotalArticle = poids * quantite;
    const partFret = totalWeightKg > 0 ? (poidsTotalArticle / totalWeightKg) : 0;
    const fretUnitaire = (result.fret * partFret) / quantite;
    
    // Répartition de l'assurance au prorata du FOB
    const partAssurance = totalFOB > 0 ? (prixTotalFOB / totalFOB) : 0;
    const assuranceUnitaire = (result.assurance * partAssurance) / quantite;
    
    // Calculer CAF pour cet article (FOB + Fret + Assurance)
    const cafArticle = prixTotalFOB + (result.fret * partFret) + (result.assurance * partAssurance);
    
    // Calcul des droits et taxes spécifiques à l'article via TEC
    let droitDouaneUnitaire = 0;
    let tvaUnitaire = 0;
    let tsbUnitaire = 0;
    let tabUnitaire = 0;
    let rstaUnitaire = 0;
    let pcsUnitaire = 0;
    let puaUnitaire = 0;
    let pccUnitaire = 0;
    let rrrUnitaire = 0;
    let rcpUnitaire = 0;
    
    if (tec && prixTotalFOB > 0) {
      // DD (Droits de Douane) : Calculé sur CAF avec taux cumulé TEC
      const tauxCumule = tec.cumulAvecTVA || tec.cumulSansTVA || tec.dd || 0;
      droitDouaneUnitaire = (cafArticle * tauxCumule / 100) / quantite;
      
      // RSTA (Redevance Statistique) : Calculé sur FOB
      const rstaRate = tec.rsta || 0;
      rstaUnitaire = (prixTotalFOB * rstaRate / 100) / quantite;
      
      // PCS (Prélèvement Communautaire de Solidarité) : Calculé sur FOB
      const pcsRate = tec.pcs || 0;
      pcsUnitaire = (prixTotalFOB * pcsRate / 100) / quantite;
      
      // PUA (Prélèvement Unitaire d'Accompagnement) : Calculé sur FOB
      const puaRate = tec.pua || 0;
      puaUnitaire = (prixTotalFOB * puaRate / 100) / quantite;
      
      // PCC (Prélèvement Communautaire de Compétitivité) : Calculé sur FOB
      const pccRate = tec.pcc || 0;
      pccUnitaire = (prixTotalFOB * pccRate / 100) / quantite;
      
      // RRR (Redevance de Régularisation) : Calculé sur CAF
      const rrrRate = tec.rrr || 0;
      rrrUnitaire = (cafArticle * rrrRate / 100) / quantite;
      
      // RCP (Redevance Contrôle des Prix) : Calculé sur CAF
      const rcpRate = tec.rcp || 0;
      rcpUnitaire = (cafArticle * rcpRate / 100) / quantite;
      
      // TVA (Taxe sur la Valeur Ajoutée) : Calculée sur CAF
      const tvaRate = tec.tva || 0;
      tvaUnitaire = (cafArticle * tvaRate / 100) / quantite;
      
      // TSB (Taxe Spéciale sur les Boissons) : Calculée sur CAF (généralement)
      const tsbRate = tec.tsb || 0;
      tsbUnitaire = (cafArticle * tsbRate / 100) / quantite;
      
      // TAB (Taxe d'Abattage) : Calculée sur CAF (généralement)
      const tabRate = tec.tab || 0;
      tabUnitaire = (cafArticle * tabRate / 100) / quantite;
    }
    
    return {
      id: article.id,
      codeHS: codeHS,
      designation: article.designation,
      quantite: quantite,
      poids: poids,
      prixUnitaireFOB: prixUnitaireFOB,
      fretUnitaire: fretUnitaire,
      assuranceUnitaire: assuranceUnitaire,
      droitDouaneUnitaire: droitDouaneUnitaire,
      rstaUnitaire: rstaUnitaire,
      pcsUnitaire: pcsUnitaire,
      puaUnitaire: puaUnitaire,
      pccUnitaire: pccUnitaire,
      rrrUnitaire: rrrUnitaire,
      rcpUnitaire: rcpUnitaire,
      tvaUnitaire: tvaUnitaire,
      tsbUnitaire: tsbUnitaire,
      tabUnitaire: tabUnitaire
    };
  });

  // Regrouper par code HS
  const groups: Record<string, typeof productData> = {};
  for (const product of productData) {
    const code = product.codeHS || 'N/A';
    if (!groups[code]) groups[code] = [];
    groups[code].push(product);
  }

  addHeader();

  // En-tête colonnes (ajusté pour le format paysage)
  const columns = [
    { key: 'code', label: 'Code SH', width: 25 },
    { key: 'designation', label: 'Désignation', width: 60 },
    { key: 'dd', label: 'DD', width: 15 },
    { key: 'rsta', label: 'RSTA', width: 15 },
    { key: 'pcs', label: 'PCS', width: 15 },
    { key: 'pua', label: 'PUA', width: 15 },
    { key: 'pcc', label: 'PCC', width: 15 },
    { key: 'rrr', label: 'RRR', width: 15 },
    { key: 'rcp', label: 'RCP', width: 15 },
    { key: 'tva', label: 'TVA', width: 15 },
    { key: 'tsb', label: 'TSB', width: 15 },
    { key: 'tab', label: 'TAB', width: 15 },
  ];

  const drawHeaderRow = () => {
    let x = margin;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin - 1, y - 5, contentWidth + 2, 8, 'F');
    for (const c of columns) {
      addText(c.label, x, y, 8, 'bold');
      x += c.width;
    }
    y += 5;
  };

  drawHeaderRow();

  // Lignes par groupe - utiliser les calculs du modal
  const totals = { dd: 0, rsta: 0, pcs: 0, pua: 0, pcc: 0, rrr: 0, rcp: 0, tva: 0, tsb: 0, tab: 0 } as Record<string, number>;

  for (const code of Object.keys(groups)) {
    const groupProducts = groups[code];
    const tec = findTECArticleByCode(code);
    
    // Calculer les totaux par groupe (somme des montants unitaires × quantités)
    const groupAmounts = {
      dd: groupProducts.reduce((sum, product) => sum + (product.droitDouaneUnitaire * product.quantite), 0),
      rsta: groupProducts.reduce((sum, product) => sum + (product.rstaUnitaire * product.quantite), 0),
      pcs: groupProducts.reduce((sum, product) => sum + (product.pcsUnitaire * product.quantite), 0),
      pua: groupProducts.reduce((sum, product) => sum + (product.puaUnitaire * product.quantite), 0),
      pcc: groupProducts.reduce((sum, product) => sum + (product.pccUnitaire * product.quantite), 0),
      rrr: groupProducts.reduce((sum, product) => sum + (product.rrrUnitaire * product.quantite), 0),
      rcp: groupProducts.reduce((sum, product) => sum + (product.rcpUnitaire * product.quantite), 0),
      tva: groupProducts.reduce((sum, product) => sum + (product.tvaUnitaire * product.quantite), 0),
      tsb: groupProducts.reduce((sum, product) => sum + (product.tsbUnitaire * product.quantite), 0),
      tab: groupProducts.reduce((sum, product) => sum + (product.tabUnitaire * product.quantite), 0),
    };

    // Ajouter aux totaux globaux
    for (const k of Object.keys(totals)) totals[k] += groupAmounts[k as keyof typeof groupAmounts] || 0;

    ensureSpace(8);
    let x = margin;
    const designation = tec?.designation || (groupProducts[0]?.designation || '');
    const cells = [
      code,
      designation.substring(0, 40),
      Math.round(groupAmounts.dd).toLocaleString('fr-FR'),
      Math.round(groupAmounts.rsta).toLocaleString('fr-FR'),
      Math.round(groupAmounts.pcs).toLocaleString('fr-FR'),
      Math.round(groupAmounts.pua).toLocaleString('fr-FR'),
      Math.round(groupAmounts.pcc).toLocaleString('fr-FR'),
      Math.round(groupAmounts.rrr).toLocaleString('fr-FR'),
      Math.round(groupAmounts.rcp).toLocaleString('fr-FR'),
      Math.round(groupAmounts.tva).toLocaleString('fr-FR'),
      Math.round(groupAmounts.tsb).toLocaleString('fr-FR'),
      Math.round(groupAmounts.tab).toLocaleString('fr-FR'),
    ];
    for (let i = 0; i < columns.length; i++) {
      addText(String(cells[i]), x, y, 8);
      x += columns[i].width;
    }
    y += 5;
  }

  // Totaux
  ensureSpace(10);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 6;
  addText('Totaux', margin, y, 10, 'bold');
  y += 5;

  const totalsColumns = [
    { label: 'DD', key: 'dd' },
    { label: 'RSTA', key: 'rsta' },
    { label: 'PCS', key: 'pcs' },
    { label: 'PUA', key: 'pua' },
    { label: 'PCC', key: 'pcc' },
    { label: 'RRR', key: 'rrr' },
    { label: 'RCP', key: 'rcp' },
    { label: 'TVA', key: 'tva' },
    { label: 'TSB', key: 'tsb' },
    { label: 'TAB', key: 'tab' },
  ];

  let x = margin;
  for (const col of totalsColumns) {
    addText(`${col.label}: ${Math.round(totals[col.key]).toLocaleString('fr-FR')} XOF`, x, y, 9);
    x += 50; // Plus d'espace en paysage
    if (x > margin + contentWidth - 50) {
      y += 5;
      x = margin;
    }
  }

  pdf.save(`recap_codes_sh_${result.numeroFacture || 'facture'}.pdf`);
};

// Nouveau: Générer une synthèse minute avec totaux des droits et taxes
export const generateSyntheseMinutePDF = async (result: SimulationResult) => {
  if (typeof jsPDF === 'undefined') {
    throw new Error("jsPDF n'est pas disponible. Veuillez vérifier l'installation.");
  }

  const pdf = new jsPDF('l', 'mm', 'a4'); // Format paysage
  const margin = 15;
  const pageWidth = 297; // Largeur en paysage
  const pageHeight = 210; // Hauteur en paysage
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addText = (text: string, x: number, yPos: number, size = 10, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.text(String(text), x, yPos, { align });
  };

  const addRect = (x: number, y: number, width: number, height: number, fillColor?: number[], strokeColor?: number[]) => {
    if (fillColor) {
      pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    }
    if (strokeColor) {
      pdf.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
    }
    pdf.rect(x, y, width, height, fillColor ? 'FD' : 'S');
  };

  // En-tête
  addText('SYNTHÈSE MINUTE - DROITS ET TAXES', pageWidth / 2, y, 16, 'bold', 'center');
  y += 8;
  addText(`Facture: ${result.numeroFacture || ''} • Dossier: ${result.dossier || ''}`, pageWidth / 2, y, 12, 'normal', 'center');
  y += 6;
  addText(`Date: ${result.dateFacture || ''} • Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, 10, 'normal', 'center');
  y += 15;

  // Calculer les totaux (même logique que le modal)
  const totalQuantity = (result.items || []).reduce((sum: number, item: any) => sum + (item.quantite || 1), 0) || 1;
  const totalWeightKg = (result.items || []).reduce((sum: number, item: any) => sum + ((item.poids || 0) * (item.quantite || 1)), 0);
  const totalFOB = (result.items || []).reduce((sum: number, item: any) => sum + (item.prixTotal || ((item.prixUnitaire || 0) * (item.quantite || 1))), 0);

  // Calculer les totaux de tous les droits et taxes
  let totalDD = 0;
  let totalRSTA = 0;
  let totalPCS = 0;
  let totalPUA = 0;
  let totalPCC = 0;
  let totalRRR = 0;
  let totalRCP = 0;
  let totalTVA = 0;
  let totalTSB = 0;
  let totalTAB = 0;

  for (const article of result.items || []) {
    const quantite = article.quantite || 1;
    const codeHS = article.codeHS;
    const tec = codeHS ? findTECArticleByCode(codeHS) : null;
    
    const prixTotalFOB = article.prixTotal || ((article.prixUnitaire || 0) * quantite);
    
    // Calculer la part de CAF pour cet article (proportionnelle au FOB)
    const partFOB = totalFOB > 0 ? prixTotalFOB / totalFOB : 0;
    const cafArticle = prixTotalFOB + (result.fret * partFOB) + (result.assurance * partFOB);
    
    if (tec && prixTotalFOB > 0) {
      // Calculer les montants totaux pour cet article
      // DD : Utiliser le taux cumulé TEC sur CAF
      const tauxCumule = tec.cumulAvecTVA || tec.cumulSansTVA || tec.dd || 0;
      const ddTotal = (cafArticle * tauxCumule / 100);
      
      // RSTA, PCS, PUA, PCC : Calculés sur FOB
      const rstaTotal = (prixTotalFOB * (tec.rsta || 0) / 100);
      const pcsTotal = (prixTotalFOB * (tec.pcs || 0) / 100);
      const puaTotal = (prixTotalFOB * (tec.pua || 0) / 100);
      const pccTotal = (prixTotalFOB * (tec.pcc || 0) / 100);
      
      // RRR, RCP, TVA, TSB, TAB : Calculés sur CAF
      const rrrTotal = (cafArticle * (tec.rrr || 0) / 100);
      const rcpTotal = (cafArticle * (tec.rcp || 0) / 100);
      const tvaTotal = (cafArticle * (tec.tva || 0) / 100);
      const tsbTotal = (cafArticle * (tec.tsb || 0) / 100);
      const tabTotal = (cafArticle * (tec.tab || 0) / 100);
      
      // Ajouter aux totaux globaux
      totalDD += ddTotal;
      totalRSTA += rstaTotal;
      totalPCS += pcsTotal;
      totalPUA += puaTotal;
      totalPCC += pccTotal;
      totalRRR += rrrTotal;
      totalRCP += rcpTotal;
      totalTVA += tvaTotal;
      totalTSB += tsbTotal;
      totalTAB += tabTotal;
    }
  }

  // Tableau des totaux
  const totalTaxes = totalDD + totalRSTA + totalPCS + totalPUA + totalPCC + totalRRR + totalRCP + totalTVA + totalTSB + totalTAB;

  // En-tête du tableau
  addRect(margin, y, contentWidth, 12, [240, 240, 240], [0, 0, 0]);
  addText('DROITS ET TAXES', pageWidth / 2, y + 8, 12, 'bold', 'center');
  y += 15;

  // Colonnes du tableau
  const columns = [
    { label: 'DD', value: totalDD, description: 'Droits de Douane' },
    { label: 'RSTA', value: totalRSTA, description: 'Redevance Statistique' },
    { label: 'PCS', value: totalPCS, description: 'Prélèvement Communautaire de Solidarité' },
    { label: 'PUA', value: totalPUA, description: 'Prélèvement Unitaire d\'Accompagnement' },
    { label: 'PCC', value: totalPCC, description: 'Prélèvement Communautaire de Compétitivité' },
    { label: 'RRR', value: totalRRR, description: 'Redevance de Régularisation' },
    { label: 'RCP', value: totalRCP, description: 'Redevance Contrôle des Prix' },
    { label: 'TVA', value: totalTVA, description: 'Taxe sur la Valeur Ajoutée' },
    { label: 'TSB', value: totalTSB, description: 'Taxe Spéciale sur les Boissons' },
    { label: 'TAB', value: totalTAB, description: 'Taxe d\'Abattage' }
  ];

  // Affichage en grille 2x5
  const colWidth = (contentWidth - 20) / 2;
  const rowHeight = 25;
  const leftColX = margin + 10;
  const rightColX = margin + 10 + colWidth + 20;

  columns.forEach((col, index) => {
    const isLeftColumn = index % 2 === 0;
    const row = Math.floor(index / 2);
    const x = isLeftColumn ? leftColX : rightColX;
    const yPos = y + (row * rowHeight);

    // Fond alterné
    if (row % 2 === 0) {
      addRect(x - 5, yPos - 3, colWidth, rowHeight - 2, [250, 250, 250]);
    }

    // Code et montant
    addText(col.label, x, yPos + 5, 14, 'bold');
    addText(`${Math.round(col.value).toLocaleString('fr-FR')} XOF`, x, yPos + 12, 12, 'bold');
    
    // Description
    addText(col.description, x, yPos + 18, 8, 'normal');
  });

  y += (Math.ceil(columns.length / 2) * rowHeight) + 15;

  // Ligne de séparation
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 10;

  // Total général
  addRect(margin, y, contentWidth, 20, [220, 252, 231], [34, 197, 94]);
  addText('TOTAL GÉNÉRAL DES DROITS ET TAXES', pageWidth / 2, y + 8, 14, 'bold', 'center');
  addText(`${Math.round(totalTaxes).toLocaleString('fr-FR')} XOF`, pageWidth / 2, y + 15, 16, 'bold', 'center');

  y += 25;

  // Informations complémentaires
  addText('Informations de base:', margin, y, 10, 'bold');
  y += 8;
  addText(`• Valeur FOB totale: ${Math.round(totalFOB).toLocaleString('fr-FR')} XOF`, margin + 10, y, 9);
  y += 5;
  addText(`• Poids total: ${totalWeightKg.toFixed(2)} kg`, margin + 10, y, 9);
  y += 5;
  addText(`• Nombre d'articles: ${totalQuantity}`, margin + 10, y, 9);
  y += 5;
  addText(`• Pourcentage moyen des taxes: ${totalFOB > 0 ? ((totalTaxes / totalFOB) * 100).toFixed(2) : 0}%`, margin + 10, y, 9);

  // Pied de page
  y = pageHeight - 15;
  addText('Généré par Kprague - Sysanev', pageWidth / 2, y, 8, 'normal', 'center');

  pdf.save(`synthese_minute_${result.numeroFacture || 'facture'}.pdf`);
};
