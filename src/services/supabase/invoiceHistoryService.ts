import { supabase } from '@/integrations/supabase/client';

export interface InvoiceHistory {
  id: string;
  userId: string;
  simulationId?: string;
  invoiceNumber: string;
  invoiceData: any; // JSONB
  pdfUrl?: string;
  createdAt: Date;
}

export const invoiceHistoryService = {
  /**
   * Récupérer l'historique des factures d'un utilisateur
   */
  async getInvoiceHistoryByUser(userId: string): Promise<InvoiceHistory[]> {
    const { data, error } = await supabase
      .from('invoice_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapToInvoiceHistory);
  },

  /**
   * Récupérer l'historique d'une simulation
   */
  async getInvoiceHistoryBySimulation(simulationId: string): Promise<InvoiceHistory[]> {
    const { data, error } = await supabase
      .from('invoice_history')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapToInvoiceHistory);
  },

  /**
   * Récupérer une facture par numéro
   */
  async getInvoiceByNumber(invoiceNumber: string, userId: string): Promise<InvoiceHistory | null> {
    const { data, error } = await supabase
      .from('invoice_history')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapToInvoiceHistory(data) : null;
  },

  /**
   * Créer une entrée dans l'historique
   */
  async createInvoiceHistory(
    userId: string,
    invoice: Omit<InvoiceHistory, 'id' | 'userId' | 'createdAt'>
  ): Promise<InvoiceHistory> {
    const { data, error } = await supabase
      .from('invoice_history')
      .insert({
        user_id: userId,
        simulation_id: invoice.simulationId,
        invoice_number: invoice.invoiceNumber,
        invoice_data: invoice.invoiceData,
        pdf_url: invoice.pdfUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToInvoiceHistory(data);
  },

  /**
   * Mettre à jour une entrée dans l'historique
   */
  async updateInvoiceHistory(
    id: string,
    updates: Partial<Omit<InvoiceHistory, 'id' | 'userId' | 'createdAt'>>
  ): Promise<InvoiceHistory> {
    const { data, error } = await supabase
      .from('invoice_history')
      .update({
        simulation_id: updates.simulationId,
        invoice_number: updates.invoiceNumber,
        invoice_data: updates.invoiceData,
        pdf_url: updates.pdfUrl,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToInvoiceHistory(data);
  },

  /**
   * Supprimer une entrée de l'historique
   */
  async deleteInvoiceHistory(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  mapToInvoiceHistory(data: any): InvoiceHistory {
    return {
      id: data.id,
      userId: data.user_id,
      simulationId: data.simulation_id,
      invoiceNumber: data.invoice_number,
      invoiceData: data.invoice_data,
      pdfUrl: data.pdf_url,
      createdAt: new Date(data.created_at),
    };
  },
};

