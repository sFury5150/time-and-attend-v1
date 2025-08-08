import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];

export const useRealTimePresence = () => {
  const { user } = useAuth();
  const [activeEmployees, setActiveEmployees] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch currently active employees (clocked in)
  const fetchActiveEmployees = async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .in('status', ['clocked_in', 'on_break'])
      .order('clock_in', { ascending: false });

    if (error) {
      console.error('Error fetching active employees:', error);
      return;
    }

    setActiveEmployees(data || []);
    setLoading(false);
  };

  // Track user presence
  const trackPresence = async (status: 'online' | 'offline') => {
    if (!user) return;

    const channel = supabase.channel('presence_tracking');
    
    if (status === 'online') {
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      });
    } else {
      await channel.untrack();
    }
  };

  useEffect(() => {
    fetchActiveEmployees();

    // Set up real-time subscription for time entries
    const timeEntriesChannel = supabase
      .channel('time_entries_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries'
        },
        () => {
          fetchActiveEmployees();
        }
      )
      .subscribe();

    // Track user as online when component mounts
    if (user) {
      trackPresence('online');
    }

    // Track user as offline when page unloads
    const handleBeforeUnload = () => {
      trackPresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      supabase.removeChannel(timeEntriesChannel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user) {
        trackPresence('offline');
      }
    };
  }, [user]);

  return {
    activeEmployees,
    loading,
    refetch: fetchActiveEmployees
  };
};