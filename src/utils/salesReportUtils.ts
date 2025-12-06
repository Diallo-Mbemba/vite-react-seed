import { PaymentRecord, CashierSession } from '../types/payment';
import { Order } from '../types/order';
import { getAllPayments } from './paymentUtils';
import { getAllOrders } from './orderUtils';

export interface SalesReportData {
  period: {
    startDate: Date;
    endDate: Date;
    type: 'day' | 'period';
  };
  summary: {
    totalAmount: number;
    totalTransactions: number;
    totalOrders: number;
    totalValidatedOrders: number;
  };
  payments: PaymentRecord[];
  orders: Order[];
  cashierSessions: CashierSession[];
}

export interface SalesReportFilters {
  startDate?: Date;
  endDate?: Date;
  cashierId?: string;
  paymentMethod?: string;
  status?: string;
}

// Générer un rapport de ventes pour une période donnée
export const generateSalesReport = (filters: SalesReportFilters = {}): SalesReportData => {
  const allPayments = getAllPayments();
  const allOrders = getAllOrders();
  
  // Récupérer les sessions de caissier depuis le localStorage
  const sessionsData = localStorage.getItem('cashierSessions');
  const allSessions: CashierSession[] = sessionsData ? JSON.parse(sessionsData) : [];
  
  let filteredPayments = allPayments;
  let filteredOrders = allOrders;
  let filteredSessions = allSessions;
  
  // Appliquer les filtres de date
  if (filters.startDate || filters.endDate) {
    const startDate = filters.startDate || new Date(0);
    const endDate = filters.endDate || new Date();
    
    filteredPayments = allPayments.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    filteredSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }
  
  // Appliquer les autres filtres
  if (filters.cashierId) {
    filteredPayments = filteredPayments.filter(payment => payment.cashierId === filters.cashierId);
  }
  
  if (filters.paymentMethod) {
    filteredPayments = filteredPayments.filter(payment => payment.paymentMethod === filters.paymentMethod);
  }
  
  if (filters.status) {
    filteredPayments = filteredPayments.filter(payment => payment.status === filters.status);
  }
  
  // Calculer les statistiques
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalTransactions = filteredPayments.length;
  const totalOrders = filteredOrders.length;
  const totalValidatedOrders = filteredOrders.filter(order => order.status === 'validated' || order.status === 'authorized').length;
  
  return {
    period: {
      startDate: filters.startDate || new Date(),
      endDate: filters.endDate || new Date(),
      type: filters.startDate && filters.endDate ? 'period' : 'day'
    },
    summary: {
      totalAmount,
      totalTransactions,
      totalOrders,
      totalValidatedOrders
    },
    payments: filteredPayments,
    orders: filteredOrders,
    cashierSessions: filteredSessions
  };
};

// Générer un rapport de ventes du jour
export const generateDailySalesReport = (date?: Date): SalesReportData => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return generateSalesReport({
    startDate: startOfDay,
    endDate: endOfDay
  });
};

// Générer un rapport de ventes pour une période
export const generatePeriodSalesReport = (startDate: Date, endDate: Date): SalesReportData => {
  return generateSalesReport({
    startDate,
    endDate
  });
};

// Formater la monnaie
export const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Formater la date
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR');
};

// Formater la date et l'heure
export const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('fr-FR');
};

// Générer le contenu HTML du rapport pour l'impression
export const generateSalesReportHTML = (reportData: SalesReportData): string => {
  const { period, summary, payments, orders, cashierSessions } = reportData;
  
  const isDaily = period.type === 'day';
  const periodTitle = isDaily 
    ? `Rapport des ventes du ${formatDate(period.startDate)}`
    : `Rapport des ventes du ${formatDate(period.startDate)} au ${formatDate(period.endDate)}`;
  
  let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${periodTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #f97316;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #f97316;
          margin-bottom: 10px;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .date {
          color: #666;
          font-size: 14px;
        }
        .summary {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #f97316;
          margin-bottom: 5px;
        }
        .summary-label {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-paid {
          background-color: #d1ecf1;
          color: #0c5460;
        }
        .status-validated {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">KPRAGUE</div>
        <div class="title">${periodTitle}</div>
        <div class="date">Généré le ${formatDateTime(new Date())}</div>
      </div>
      
      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${formatCurrency(summary.totalAmount)}</div>
            <div class="summary-label">Chiffre d'affaires total</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${summary.totalTransactions}</div>
            <div class="summary-label">Transactions</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${summary.totalOrders}</div>
            <div class="summary-label">Commandes</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${summary.totalValidatedOrders}</div>
            <div class="summary-label">Commandes validées</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Détail des Paiements</div>
        <table>
          <thead>
            <tr>
              <th>Reçu</th>
              <th>Inscription</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  payments.forEach(payment => {
    const statusClass = `status-${payment.status}`;
    html += `
      <tr>
        <td>${payment.receiptNumber}</td>
        <td>${payment.inscriptionNumber}</td>
        <td>${formatCurrency(payment.amount)}</td>
        <td>${payment.paymentMethod}</td>
        <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
        <td>${formatDateTime(payment.createdAt)}</td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Détail des Commandes</div>
        <table>
          <thead>
            <tr>
              <th>Commande</th>
              <th>Utilisateur</th>
              <th>Plan</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  orders.forEach(order => {
    const statusClass = `status-${order.status}`;
    html += `
      <tr>
        <td>${order.orderNumber}</td>
        <td>${order.userName}<br><small>${order.userEmail}</small></td>
        <td>${order.planName}<br><small>${order.planCredits} crédits</small></td>
        <td>${formatCurrency(order.amount)}</td>
        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
        <td>${formatDateTime(order.createdAt)}</td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </div>
      
      ${cashierSessions.length > 0 ? `
      <div class="section">
        <div class="section-title">Sessions de Caisse</div>
        <table>
          <thead>
            <tr>
              <th>Caissier</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Transactions</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
      ` : ''}
  
  ${cashierSessions.map(session => `
    <tr>
      <td>${session.cashierName}</td>
      <td>${formatDateTime(session.startTime)}</td>
      <td>${session.endTime ? formatDateTime(session.endTime) : 'En cours'}</td>
      <td>${session.totalTransactions}</td>
      <td>${formatCurrency(session.totalAmount)}</td>
    </tr>
  `).join('')}
  
  ${cashierSessions.length > 0 ? `
          </tbody>
        </table>
      </div>
  ` : ''}
      
      <div class="footer">
        <p>Rapport généré automatiquement par le système KPRAGUE</p>
        <p>© ${new Date().getFullYear()} KPRAGUE - Tous droits réservés</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// Imprimer le rapport
export const printSalesReport = (reportData: SalesReportData): void => {
  const html = generateSalesReportHTML(reportData);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
};

// Télécharger le rapport en HTML
export const downloadSalesReport = (reportData: SalesReportData): void => {
  const html = generateSalesReportHTML(reportData);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-ventes-${formatDate(reportData.period.startDate)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

