import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];

export { type TimeEntry };

export const useTimeTracking = () => {
  const { user } = useAuth();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current active time entry
  const fetchCurrentEntry = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['clocked_in', 'on_break'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current entry:', error);
      return;
    }

    setCurrentEntry(data);
  };

  // Get recent time entries
  const fetchTimeEntries = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching time entries:', error);
      return;
    }

    setTimeEntries(data || []);
  };

  // Clock in
  const clockIn = async (location?: any) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        status: 'clocked_in',
        location_data: location
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setCurrentEntry(data);
    await fetchTimeEntries();
    return { data };
  };

  // Clock out
  const clockOut = async () => {
    if (!user || !currentEntry) return { error: 'No active time entry' };

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        clock_out: new Date().toISOString(),
        status: 'clocked_out'
      })
      .eq('id', currentEntry.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setCurrentEntry(null);
    await fetchTimeEntries();
    return { data };
  };

  // Start break
  const startBreak = async () => {
    if (!user || !currentEntry) return { error: 'No active time entry' };

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        break_start: new Date().toISOString(),
        status: 'on_break'
      })
      .eq('id', currentEntry.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setCurrentEntry(data);
    return { data };
  };

  // End break
  const endBreak = async () => {
    if (!user || !currentEntry) return { error: 'No active time entry' };

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        break_end: new Date().toISOString(),
        status: 'clocked_in'
      })
      .eq('id', currentEntry.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setCurrentEntry(data);
    return { data };
  };

  useEffect(() => {
    if (user) {
      fetchCurrentEntry();
      fetchTimeEntries();
      setLoading(false);

      // Set up real-time subscription
      const channel = supabase
        .channel('time_entries_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'time_entries',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCurrentEntry();
            fetchTimeEntries();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    currentEntry,
    timeEntries,
    loading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refetch: () => {
      fetchCurrentEntry();
      fetchTimeEntries();
    }
  };
};