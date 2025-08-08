import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type CustomerInteraction = Database['public']['Tables']['customer_interactions']['Row'];
type CustomerInteractionInsert = Database['public']['Tables']['customer_interactions']['Insert'];
type CustomerInteractionUpdate = Database['public']['Tables']['customer_interactions']['Update'];

export const useCustomerInteractions = () => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_interactions')
        .select('*')
        .order('interaction_date', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInteraction = async (interactionData: Omit<CustomerInteractionInsert, 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('customer_interactions')
        .insert({
          ...interactionData,
          created_by: user?.id || ''
        })
        .select()
        .single();

      if (error) throw error;
      await fetchInteractions();
      return data;
    } catch (error) {
      console.error('Error creating interaction:', error);
      throw error;
    }
  };

  const updateInteraction = async (id: string, updates: CustomerInteractionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('customer_interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchInteractions();
      return data;
    } catch (error) {
      console.error('Error updating interaction:', error);
      throw error;
    }
  };

  const deleteInteraction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInteractions();
    } catch (error) {
      console.error('Error deleting interaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchInteractions();

      const channel = supabase
        .channel('customer_interactions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customer_interactions'
          },
          () => fetchInteractions()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    interactions,
    loading,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    refetch: fetchInteractions
  };
};