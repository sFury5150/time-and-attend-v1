import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RecurringInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  total_amount: number;
  is_recurring: boolean;
  recurring_frequency: string;
  recurring_start_date: string;
  recurring_end_date: string | null;
  next_invoice_date: string;
  status: string;
  created_at: string;
}

export const useRecurringInvoices = () => {
  const { user } = useAuth();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurringInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          customer:customers(first_name, last_name, email),
          total_amount,
          is_recurring,
          recurring_frequency,
          recurring_start_date,
          recurring_end_date,
          next_invoice_date,
          status,
          created_at
        `)
        .eq('created_by', user.id)
        .eq('is_recurring', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRecurringInvoices(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching recurring invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRecurringInvoice = async (invoiceId: string, frequency: string, startDate: string, endDate?: string) => {
    try {
      // Calculate next invoice date based on frequency
      const start = new Date(startDate);
      const nextDate = new Date(start);
      
      switch (frequency) {
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const { error } = await supabase
        .from('invoices')
        .update({
          is_recurring: true,
          recurring_frequency: frequency,
          recurring_start_date: startDate,
          recurring_end_date: endDate || null,
          next_invoice_date: nextDate.toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      await fetchRecurringInvoices();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const generateNextRecurringInvoice = async (templateInvoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-recurring-invoice', {
        body: {
          templateInvoiceId
        }
      });

      if (error) throw error;

      await fetchRecurringInvoices();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const stopRecurringInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          is_recurring: false,
          recurring_end_date: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      await fetchRecurringInvoices();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getRecurringInvoicesData = () => {
    const activeRecurring = recurringInvoices.filter(invoice => 
      !invoice.recurring_end_date || new Date(invoice.recurring_end_date) > new Date()
    );

    const overdueGeneration = recurringInvoices.filter(invoice => 
      new Date(invoice.next_invoice_date) <= new Date() && 
      (!invoice.recurring_end_date || new Date(invoice.recurring_end_date) > new Date())
    );

    return {
      active: activeRecurring,
      overdue: overdueGeneration,
      total: recurringInvoices.length
    };
  };

  useEffect(() => {
    fetchRecurringInvoices();
  }, [user]);

  return {
    recurringInvoices,
    loading,
    error,
    createRecurringInvoice,
    generateNextRecurringInvoice,
    stopRecurringInvoice,
    getRecurringInvoicesData,
    refetch: fetchRecurringInvoices
  };
};