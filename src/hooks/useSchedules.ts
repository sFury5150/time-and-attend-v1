import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export { type Schedule, type Profile };

export const useSchedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch schedules based on user role
  const fetchSchedules = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      return;
    }

    setSchedules(data || []);
  };

  // Fetch all employees (for managers)
  const fetchEmployees = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  // Create a new schedule
  const createSchedule = async (scheduleData: {
    employee_id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    notes?: string;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('schedules')
      .insert({
        ...scheduleData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    await fetchSchedules();
    return { data };
  };

  // Update schedule
  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    await fetchSchedules();
    return { data };
  };

  // Delete schedule
  const deleteSchedule = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    await fetchSchedules();
    return { success: true };
  };

  useEffect(() => {
    if (user) {
      fetchSchedules();
      fetchEmployees();
      setLoading(false);

      // Set up real-time subscription
      const channel = supabase
        .channel('schedules_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedules'
          },
          () => {
            fetchSchedules();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    schedules,
    employees,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refetch: () => {
      fetchSchedules();
      fetchEmployees();
    }
  };
};