import { jsPDF } from 'jspdf';
import { PaymentRecord, CashierSession } from '../types/payment';

interface InvoiceData {
  payment: PaymentRecord;
  cashierSession: CashierSession | null;
  customerName?: string;
  customerEmail?: string;
}

/**
 * Génère une facture A4 pour la caisse OIC avec en-tête et pied de page
 */
export const generateOICInvoice = async (data: InvoiceData): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    let yPosition = margin;
    
    // Couleurs
    const colors = {
      primary: [30, 64, 175],      // Bleu OIC
      secondary: [255, 140, 0],    // Orange Côte d'Ivoire
      accent: [0, 166, 81],        // Vert Côte d'Ivoire
      dark: [0, 0, 0],
      gray: [75, 85, 99],
      lightGray: [243, 244, 246],
      border: [209, 213, 219]
    };
    
    // Fonction pour ajouter du texte
    const addText = (text: string | number, x: number, y: number, options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: number[];
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {}) => {
      const { fontSize = 10, fontStyle = 'normal', color = colors.dark, align = 'left', maxWidth = contentWidth } = options;
      
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      
      if (fontStyle === 'bold') {
        pdf.setFont('helvetica', 'bold');
      } else if (fontStyle === 'italic') {
        pdf.setFont('helvetica', 'italic');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(String(text), x, y, { align, maxWidth });
      return y + fontSize * 0.4;
    };
    
    // Fonction pour ajouter une ligne
    const addLine = (x1: number, y1: number, x2: number, y2: number, color: number[] = colors.border, width: number = 0.5) => {
      pdf.setDrawColor(color[0], color[1], color[2]);
      pdf.setLineWidth(width);
      pdf.line(x1, y1, x2, y2);
    };
    
    // ========== EN-TÊTE ==========
    // Rectangle d'en-tête avec fond
    pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.rect(margin, margin, contentWidth, 50, 'F');
    
    // Bordure supérieure
    addLine(margin, margin, margin + contentWidth, margin, colors.primary, 2);
    
    // Logo OIC (texte stylisé)
    yPosition = margin + 10;
    addText('OFFICE IVOIRIEN DES CHARGEURS', margin + 10, yPosition, {
      fontSize: 16,
      fontStyle: 'bold',
      color: colors.primary,
      align: 'left'
    });
    
    yPosition += 6;
    addText('OIC', margin + 10, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.secondary,
      align: 'left'
    });
    
    yPosition += 5;
    addText('Système de Gestion des Paiements', margin + 10, yPosition, {
      fontSize: 9,
      color: colors.gray,
      align: 'left'
    });
    
    // Informations de contact à droite
    yPosition = margin + 10;
    addText('Abidjan, Côte d\'Ivoire', margin + contentWidth - 10, yPosition, {
      fontSize: 9,
      color: colors.gray,
      align: 'right'
    });
    
    yPosition += 5;
    addText('Tél: +225 XX XX XX XX XX', margin + contentWidth - 10, yPosition, {
      fontSize: 9,
      color: colors.gray,
      align: 'right'
    });
    
    yPosition += 5;
    addText('Email: contact@oic.ci', margin + contentWidth - 10, yPosition, {
      fontSize: 9,
      color: colors.gray,
      align: 'right'
    });
    
    // Ligne de séparation
    yPosition = margin + 55;
    addLine(margin, yPosition, margin + contentWidth, yPosition, colors.border, 1);
    yPosition += 10;
    
    // ========== TITRE FACTURE ==========
    addText('FACTURE', margin + contentWidth / 2, yPosition, {
      fontSize: 20,
      fontStyle: 'bold',
      color: colors.primary,
      align: 'center'
    });
    
    yPosition += 8;
    addLine(margin, yPosition, margin + contentWidth, yPosition, colors.primary, 1);
    yPosition += 10;
    
    // ========== INFORMATIONS CLIENT ==========
    addText('INFORMATIONS CLIENT', margin, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    yPosition += 6;
    
    // Rectangle pour les infos client
    pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.rect(margin, yPosition, contentWidth, 35, 'F');
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, contentWidth, 35, 'S');
    
    const clientYStart = yPosition + 5;
    let clientY = clientYStart;
    
    if (data.customerName) {
      clientY = addText(`Nom: ${data.customerName}`, margin + 5, clientY, { fontSize: 10 });
      clientY += 5;
    }
    
    if (data.customerEmail) {
      clientY = addText(`Email: ${data.customerEmail}`, margin + 5, clientY, { fontSize: 10 });
      clientY += 5;
    }
    
    clientY = addText(`Numéro d'inscription: ${data.payment.inscriptionNumber}`, margin + 5, clientY, {
      fontSize: 10,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    yPosition += 40;
    
    // ========== INFORMATIONS CAISSIER ==========
    addText('INFORMATIONS CAISSIER', margin, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    yPosition += 6;
    
    // Rectangle pour les infos caissier
    pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.rect(margin, yPosition, contentWidth, 25, 'F');
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, contentWidth, 25, 'S');
    
    const cashierYStart = yPosition + 5;
    let cashierY = cashierYStart;
    
    if (data.cashierSession) {
      cashierY = addText(`Caissier/Caissière: ${data.cashierSession.cashierName}`, margin + 5, cashierY, {
        fontSize: 10,
        fontStyle: 'bold'
      });
      cashierY += 5;
      cashierY = addText(`ID Session: ${data.cashierSession.cashierId}`, margin + 5, cashierY, { fontSize: 10 });
    }
    
    yPosition += 30;
    
    // ========== DÉTAILS DU PAIEMENT ==========
    addText('DÉTAILS DU PAIEMENT', margin, yPosition, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    yPosition += 6;
    
    // Tableau des détails
    const tableYStart = yPosition;
    const rowHeight = 8;
    const col1Width = 80;
    const col2Width = contentWidth - col1Width;
    
    // En-tête du tableau
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');
    addText('Description', margin + 5, yPosition + 5, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [255, 255, 255]
    });
    addText('Montant', margin + col1Width + 5, yPosition + 5, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [255, 255, 255],
      align: 'right'
    });
    yPosition += rowHeight;
    
    // Ligne de description
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.rect(margin, yPosition, contentWidth, rowHeight, 'S');
    addText(data.payment.description || 'Paiement pack simulation', margin + 5, yPosition + 5, { fontSize: 10 });
    addText(formatCurrency(data.payment.amount, data.payment.currency), margin + col1Width + 5, yPosition + 5, {
      fontSize: 10,
      fontStyle: 'bold',
      align: 'right'
    });
    yPosition += rowHeight;
    
    // Ligne de total
    pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.rect(margin, yPosition, contentWidth, rowHeight + 2, 'F');
    pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setLineWidth(1.5);
    pdf.rect(margin, yPosition, contentWidth, rowHeight + 2, 'S');
    addText('TOTAL', margin + 5, yPosition + 6, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    addText(formatCurrency(data.payment.amount, data.payment.currency), margin + col1Width + 5, yPosition + 6, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary,
      align: 'right'
    });
    yPosition += rowHeight + 5;
    
    // Informations supplémentaires
    yPosition += 5;
    addText(`Numéro de reçu: ${data.payment.receiptNumber}`, margin, yPosition, { fontSize: 9, color: colors.gray });
    yPosition += 5;
    addText(`Date de paiement: ${new Date(data.payment.paidAt || data.payment.createdAt).toLocaleString('fr-FR')}`, margin, yPosition, {
      fontSize: 9,
      color: colors.gray
    });
    yPosition += 5;
    addText(`Méthode de paiement: ${getPaymentMethodText(data.payment.paymentMethod)}`, margin, yPosition, {
      fontSize: 9,
      color: colors.gray
    });
    yPosition += 5;
    addText(`Statut: ${getStatusText(data.payment.status)}`, margin, yPosition, {
      fontSize: 9,
      color: colors.gray
    });
    
    // ========== PIED DE PAGE ==========
    const footerY = pageHeight - 50;
    
    // Ligne de séparation
    addLine(margin, footerY, margin + contentWidth, footerY, colors.border, 1);
    
    // Logo OIC en bas
    yPosition = footerY + 5;
    addText('OFFICE IVOIRIEN DES CHARGEURS', margin + contentWidth / 2, yPosition, {
      fontSize: 10,
      fontStyle: 'bold',
      color: colors.primary,
      align: 'center'
    });
    
    yPosition += 5;
    addText('OIC - Système de Gestion des Paiements', margin + contentWidth / 2, yPosition, {
      fontSize: 8,
      color: colors.gray,
      align: 'center'
    });
    
    yPosition += 5;
    addText('Abidjan, Côte d\'Ivoire | Tél: +225 XX XX XX XX XX | Email: contact@oic.ci', margin + contentWidth / 2, yPosition, {
      fontSize: 7,
      color: colors.gray,
      align: 'center'
    });
    
    yPosition += 5;
    addText(`Facture générée le ${new Date().toLocaleString('fr-FR')}`, margin + contentWidth / 2, yPosition, {
      fontSize: 7,
      color: colors.gray,
      align: 'center'
    });
    
    // Télécharger le PDF
    const fileName = `Facture_OIC_${data.payment.receiptNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Erreur lors de la génération de la facture:', error);
    throw error;
  }
};

/**
 * Formate un montant en devise
 */
const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'XOF' ? 'XOF' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Retourne le texte du mode de paiement
 */
const getPaymentMethodText = (method: string): string => {
  const methods: { [key: string]: string } = {
    'caisse_oic': 'Caisse OIC',
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Virement bancaire',
    'credit_card': 'Carte de crédit'
  };
  return methods[method] || method;
};

/**
 * Retourne le texte du statut
 */
const getStatusText = (status: string): string => {
  const statuses: { [key: string]: string } = {
    'pending': 'En attente',
    'paid': 'Payé',
    'validated': 'Validé',
    'cancelled': 'Annulé'
  };
  return statuses[status] || status;
};

