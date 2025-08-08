import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface InvoiceAnalytics {
  id: string;
  month_year: string;
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  average_days_to_payment: number;
  created_at: string;
  updated_at: string;
}

interface AnalyticsSummary {
  totalInvoices: number;
  totalRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
  averageDaysToPayment: number;
  paymentRate: number;
  monthlyTrend: InvoiceAnalytics[];
}

export const useInvoiceAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<InvoiceAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('invoice_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('month_year', { ascending: false })
        .limit(12);

      if (analyticsError) throw analyticsError;

      setAnalytics(analyticsData || []);

      // Calculate summary statistics
      if (analyticsData && analyticsData.length > 0) {
        const totalInvoices = analyticsData.reduce((sum, item) => sum + item.total_invoices, 0);
        const totalRevenue = analyticsData.reduce((sum, item) => sum + parseFloat(item.total_amount.toString()), 0);
        const paidAmount = analyticsData.reduce((sum, item) => sum + parseFloat(item.paid_amount.toString()), 0);
        const outstandingAmount = analyticsData.reduce((sum, item) => sum + parseFloat(item.outstanding_amount.toString()), 0);
        
        const weightedSum = analyticsData.reduce((sum, item) => 
          sum + (parseFloat(item.average_days_to_payment.toString()) * item.total_invoices), 0);
        const averageDaysToPayment = totalInvoices > 0 ? weightedSum / totalInvoices : 0;
        
        const paymentRate = totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;

        setSummary({
          totalInvoices,
          totalRevenue,
          paidAmount,
          outstandingAmount,
          averageDaysToPayment,
          paymentRate,
          monthlyTrend: analyticsData
        });
      } else {
        setSummary({
          totalInvoices: 0,
          totalRevenue: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          averageDaysToPayment: 0,
          paymentRate: 0,
          monthlyTrend: []
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    if (!user) return;

    try {
      // Simply refetch data - analytics are updated automatically via triggers
      await fetchAnalytics();
    } catch (err: any) {
      setError(err.message);
      console.error('Error refreshing analytics:', err);
    }
  };

  const sendPaymentReminder = async (invoiceId: string, reminderType: 'first' | 'second' | 'final') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          invoiceId,
          reminderType
        }
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return {
    analytics,
    summary,
    loading,
    error,
    refreshAnalytics,
    sendPaymentReminder
  };
};