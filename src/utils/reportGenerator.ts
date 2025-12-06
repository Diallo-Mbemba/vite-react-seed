import { SimulationResult } from '../types';

export const generateCompleteReport = (result: SimulationResult): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
  };

  let report = '';

  // En-tête du rapport
  report += '='.repeat(80) + '\n';
  report += 'RAPPORT COMPLET DE COÛT DE REVIENT PRÉVISIONNEL\n';
  report += '='.repeat(80) + '\n\n';

  // Informations générales
  report += 'INFORMATIONS GÉNÉRALES\n';
  report += '-'.repeat(40) + '\n';
  report += `Dossier: ${result.dossier || 'Non spécifié'}\n`;
  report += `Numéro de facture: ${result.numeroFacture || 'Non spécifié'}\n`;
  report += `Date de facture: ${result.dateFacture ? formatDate(result.dateFacture) : 'Non spécifiée'}\n`;
  report += `Date de transaction: ${result.dateTransaction ? formatDate(result.dateTransaction) : 'Non spécifiée'}\n`;
  report += `Devise: ${result.devise}\n`;
  report += `Taux de change: ${result.tauxChange} FCFA/${result.devise}\n`;
  report += `Incoterm: ${result.incoterm}\n`;
  report += `Régime douanier: ${result.regimeDouanier || 'Non spécifié'}\n`;
  report += `Mode de paiement: ${result.modePaiement || 'Non spécifié'}\n\n`;

  // Informations de transport
  if (result.transport) {
    report += 'INFORMATIONS DE TRANSPORT\n';
    report += '-'.repeat(40) + '\n';
    report += `Mode de transport: ${result.transport.mode}\n`;
    report += `Route: ${result.transport.route || 'Non spécifiée'}\n`;
    report += `Type de conteneur: ${result.transport.typeConteneur || 'Non spécifié'}\n`;
    report += `Nombre de conteneurs: ${result.transport.nombreConteneurs}\n`;
    report += `Poids total: ${result.transport.poidsTotalTonnes} tonnes\n\n`;
  }

  // Acteurs
  if (result.selectedActors) {
    report += 'ACTEURS\n';
    report += '-'.repeat(40) + '\n';
    if (result.selectedActors.importateur) {
      const importateur = result.actors?.find((a: any) => a?.id === result.selectedActors.importateur);
      report += `Importateur: ${importateur?.nom || 'Non spécifié'}\n`;
    }
    if (result.selectedActors.fournisseur) {
      const fournisseur = result.actors?.find((a: any) => a?.id === result.selectedActors.fournisseur);
      report += `Fournisseur: ${fournisseur?.nom || 'Non spécifié'}\n`;
    }
    if (result.selectedActors.transitaire) {
      const transitaire = result.actors?.find((a: any) => a?.id === result.selectedActors.transitaire);
      report += `Transitaire: ${transitaire?.nom || 'Non spécifié'}\n`;
    }
    report += '\n';
  }

  // Articles
  if (result.items && result.items.length > 0) {
    report += 'ARTICLES\n';
    report += '-'.repeat(40) + '\n';
    report += `${'Code SH'.padEnd(15)} ${'Désignation'.padEnd(40)} ${'Qté'.padEnd(8)} ${'Prix unit.'.padEnd(12)} ${'Prix total'.padEnd(12)} ${'Poids'.padEnd(8)}\n`;
    report += '-'.repeat(95) + '\n';
    
    result.items.forEach((item: any, index: number) => {
      report += `${item.codeHS.padEnd(15)} ${item.designation.substring(0, 38).padEnd(40)} ${item.quantite.toString().padEnd(8)} ${formatCurrency(item.prixUnitaire).padEnd(12)} ${formatCurrency(item.prixTotal).padEnd(12)} ${item.poids.toString().padEnd(8)}\n`;
    });
    report += '\n';
  }

  // Détail des coûts de revient prévisionnels
  report += 'DÉTAIL DES COÛTS DE REVIENT PRÉVISIONNELS\n';
  report += '-'.repeat(50) + '\n';
  report += `${'Composant'.padEnd(30)} ${'Montant'.padEnd(15)} ${'Pourcentage'.padEnd(12)}\n`;
  report += '-'.repeat(57) + '\n';
  
  const costs = [
    { name: 'FOB', value: result.fob },
    { name: 'Fret', value: result.fret },
    { name: 'Assurance', value: result.assurance },
    { name: 'Droits de douane', value: result.droitDouane },
    { name: 'Frais financiers', value: result.fraisFinanciers },
    { name: 'Prestation transitaire', value: result.prestationTransitaire },
    { name: 'RPI', value: result.rpi },
    { name: 'COC', value: result.coc },
    { name: 'BSC', value: result.bsc },
    { name: 'Crédit d\'enlèvement', value: result.creditEnlevement },
    { name: 'RRR', value: result.rrr },
    { name: 'RCP', value: result.rcp },
    { name: 'TS Douane', value: result.tsDouane },
    { name: 'Avance de fonds', value: result.avanceFonds }
  ];

  costs.forEach(cost => {
    if (cost.value > 0) {
      const percentage = calculatePercentage(cost.value, result.totalCost);
      report += `${cost.name.padEnd(30)} ${formatCurrency(cost.value).padEnd(15)} ${percentage.padEnd(12)}%\n`;
    }
  });

  report += '-'.repeat(57) + '\n';
  report += `${'TOTAL COÛT DE REVIENT PRÉVISIONNEL'.padEnd(30)} ${formatCurrency(result.totalCost).padEnd(15)} 100.00%\n\n`;

  // Analyse des coûts
  report += 'ANALYSE DES COÛTS DE REVIENT PRÉVISIONNELS\n';
  report += '-'.repeat(50) + '\n';
  
  const fobPercentage = calculatePercentage(result.fob, result.totalCost);
  const transportPercentage = calculatePercentage(result.fret + result.assurance, result.totalCost);
  const customsPercentage = calculatePercentage(result.droitDouane + result.rpi + result.coc + result.bsc, result.totalCost);
  const servicesPercentage = calculatePercentage(result.prestationTransitaire + result.fraisFinanciers, result.totalCost);

  report += `FOB: ${fobPercentage}% du coût total\n`;
  report += `Transport (fret + assurance): ${transportPercentage}% du coût total\n`;
  report += `Douane (droits + RPI + COC + BSC): ${customsPercentage}% du coût total\n`;
  report += `Services (transitaire + frais financiers): ${servicesPercentage}% du coût total\n\n`;

  // Recommandations
  report += 'RECOMMANDATIONS\n';
  report += '-'.repeat(40) + '\n';
  
  if (parseFloat(transportPercentage) > 25) {
    report += '• Les coûts de transport sont élevés. Envisagez le groupage de commandes.\n';
  }
  
  if (parseFloat(customsPercentage) > 15) {
    report += '• Les droits de douane sont significatifs. Vérifiez les codes SH pour optimiser.\n';
  }
  
  if (parseFloat(servicesPercentage) > 20) {
    report += '• Les services représentent une part importante. Négociez les tarifs transitaire.\n';
  }
  
  if (result.items && result.items.length > 0) {
    const avgUnitCost = result.totalCost / result.items.length;
    if (avgUnitCost > 500000) {
      report += '• Le coût unitaire est élevé. Envisagez d\'augmenter le volume.\n';
    }
  }
  
  report += '\n';

  // Informations techniques
  report += 'INFORMATIONS TECHNIQUES\n';
  report += '-'.repeat(40) + '\n';
  report += `Date de génération: ${new Date().toLocaleString('fr-FR')}\n`;
  report += `Version du système: KPRAGUE - SYSANEV\n`;
  report += `Type de rapport: Coût de revient prévisionnel\n`;
  report += `Inclusion TVA: ${result.includeTVA ? 'Oui' : 'Non'}\n`;
  report += `Produits dangereux: ${result.isDangerous ? 'Oui' : 'Non'}\n`;
  report += `Inclusion transitaire: ${result.includeTransitaire ? 'Oui' : 'Non'}\n\n`;

  // Pied de page
  report += '='.repeat(80) + '\n';
  report += 'FIN DU RAPPORT\n';
  report += 'Ce rapport a été généré automatiquement par le système KPRAGUE - SYSANEV\n';
  report += 'Pour toute question, contactez notre équipe de support.\n';
  report += '='.repeat(80) + '\n';

  return report;
};

export const downloadReport = (result: SimulationResult) => {
  const report = generateCompleteReport(result);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport_cout_revient_previsionnel_${result.dossier || 'simulation'}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 
