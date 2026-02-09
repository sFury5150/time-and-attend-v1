/**
 * useBreakManagement Hook
 * Manages break tracking, timing, and validation
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Break {
  id: string;
  timeEntryId: string;
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  breakType: 'lunch' | 'break' | 'other';
  status: 'active' | 'completed';
  notes?: string;
}

export interface BreakManagementState {
  currentBreak: Break | null;
  breaks: Break[];
  isBreakActive: boolean;
  elapsedMinutes: number;
  totalBreakTime: number;
  error: string | null;
}

const MAX_BREAK_DURATION = 480; // 8 hours
const BREAK_TIMER_INTERVAL = 1000; // Update every 1 second

export function useBreakManagement(
  employeeId: string | null,
  timeEntryId: string | null
) {
  const [state, setState] = useState<BreakManagementState>({
    currentBreak: null,
    breaks: [],
    isBreakActive: false,
    elapsedMinutes: 0,
    totalBreakTime: 0,
    error: null,
  });

  const timerRef = useRef<NodeJS.Timer | null>(null);
  const queryClient = useQueryClient();

  // Fetch breaks for the time entry
  const { data: breaks = [] } = useQuery({
    queryKey: ['breaks', timeEntryId],
    queryFn: async () => {
      if (!timeEntryId) return [];

      const { data, error } = await supabase
        .from('breaks')
        .select('*')
        .eq('time_entry_id', timeEntryId)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching breaks:', error);
        return [];
      }

      return (data || []).map(brk => ({
        id: brk.id,
        timeEntryId: brk.time_entry_id,
        employeeId: brk.employee_id,
        startTime: new Date(brk.start_time),
        endTime: brk.end_time ? new Date(brk.end_time) : undefined,
        durationMinutes: brk.duration_minutes,
        breakType: brk.break_type,
        status: brk.status,
        notes: brk.notes,
      })) as Break[];
    },
    enabled: !!timeEntryId,
  });

  // Start break mutation
  const startBreakMutation = useMutation({
    mutationFn: async (breakType: Break['breakType']) => {
      if (!employeeId || !timeEntryId) {
        throw new Error('Employee ID and Time Entry ID required');
      }

      const { data, error } = await supabase
        .from('breaks')
        .insert({
          time_entry_id: timeEntryId,
          employee_id: employeeId,
          start_time: new Date().toISOString(),
          break_type: breakType,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        timeEntryId: data.time_entry_id,
        employeeId: data.employee_id,
        startTime: new Date(data.start_time),
        endTime: undefined,
        breakType: data.break_type,
        status: 'active',
      } as Break;
    },
    onSuccess: (newBreak) => {
      setState(prev => ({
        ...prev,
        currentBreak: newBreak,
        isBreakActive: true,
        elapsedMinutes: 0,
      }));
      queryClient.invalidateQueries({ queryKey: ['breaks', timeEntryId] });
    },
  });

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: async () => {
      if (!state.currentBreak) {
        throw new Error('No active break');
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - state.currentBreak.startTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      const { data, error } = await supabase
        .from('breaks')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          status: 'completed',
        })
        .eq('id', state.currentBreak.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        timeEntryId: data.time_entry_id,
        employeeId: data.employee_id,
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        durationMinutes: data.duration_minutes,
        breakType: data.break_type,
        status: 'completed',
      } as Break;
    },
    onSuccess: () => {
      setState(prev => ({
        ...prev,
        currentBreak: null,
        isBreakActive: false,
        elapsedMinutes: 0,
      }));
      queryClient.invalidateQueries({ queryKey: ['breaks', timeEntryId] });
    },
  });

  // Update break notes mutation
  const updateBreakNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!state.currentBreak) {
        throw new Error('No break selected');
      }

      const { error } = await supabase
        .from('breaks')
        .update({ notes })
        .eq('id', state.currentBreak.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaks', timeEntryId] });
    },
  });

  // Update elapsed time
  useEffect(() => {
    if (!state.isBreakActive || !state.currentBreak) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - state.currentBreak!.startTime.getTime();
      const elapsedMin = Math.floor(elapsedMs / 60000);

      // Check if break duration exceeds max
      if (elapsedMin > MAX_BREAK_DURATION) {
        setState(prev => ({
          ...prev,
          error: `Break duration exceeded ${MAX_BREAK_DURATION} minutes`,
        }));
        endBreakMutation.mutate();
        return;
      }

      setState(prev => ({
        ...prev,
        elapsedMinutes: elapsedMin,
      }));
    }, BREAK_TIMER_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isBreakActive, state.currentBreak]);

  // Calculate total break time
  useEffect(() => {
    const total = breaks.reduce((sum, brk) => {
      return sum + (brk.durationMinutes || 0);
    }, 0);

    setState(prev => ({
      ...prev,
      breaks,
      totalBreakTime: total,
    }));
  }, [breaks]);

  return {
    ...state,
    startBreak: (breakType: Break['breakType']) => startBreakMutation.mutate(breakType),
    endBreak: () => endBreakMutation.mutate(),
    updateBreakNotes: (notes: string) => updateBreakNotesMutation.mutate(notes),
    isStartingBreak: startBreakMutation.isPending,
    isEndingBreak: endBreakMutation.isPending,
    isUpdatingNotes: updateBreakNotesMutation.isPending,
  };
}

export default useBreakManagement;
