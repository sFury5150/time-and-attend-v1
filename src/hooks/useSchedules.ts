import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type {
  Shift,
  CreateShiftRequest,
  UpdateShiftRequest,
  ShiftFilter,
} from '@/types'

export interface UseSchedulesState {
  shifts: Shift[]
  selectedShift: Shift | null
  loading: boolean
  error: Error | null
}

export const useSchedules = (companyId?: string) => {
  const { user } = useAuth()
  const [state, setState] = useState<UseSchedulesState>({
    shifts: [],
    selectedShift: null,
    loading: true,
    error: null,
  })

  // Fetch shifts
  const fetchShifts = useCallback(
    async (cId?: string, filters?: ShiftFilter) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        let query = supabase.from('shifts').select('*')

        // Filter by company
        if (cId) {
          query = query.eq('company_id', cId)
        } else if (filters?.company_id) {
          query = query.eq('company_id', filters.company_id)
        }

        // Apply additional filters
        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id)
        }

        if (filters?.location_id) {
          query = query.eq('location_id', filters.location_id)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        // Date range filters
        if (filters?.date_from) {
          query = query.gte('start_time', filters.date_from)
        }

        if (filters?.date_to) {
          query = query.lte('end_time', filters.date_to)
        }

        const { data, error } = await query.order('start_time', {
          ascending: true,
        })

        if (error) throw error

        setState((prev) => ({
          ...prev,
          shifts: data || [],
          loading: false,
        }))

        return data || []
      } catch (error) {
        const err = error as Error
        setState((prev) => ({
          ...prev,
          error: err,
          loading: false,
        }))
        return []
      }
    },
    []
  )

  // Get single shift
  const getShift = useCallback(
    async (shiftId: string): Promise<Shift | null> => {
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .eq('id', shiftId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching shift:', error)
        return null
      }
    },
    []
  )

  // Get employee's shifts
  const getEmployeeShifts = useCallback(
    async (employeeId: string, filters?: { status?: Shift['status'] }) => {
      try {
        let query = supabase
          .from('shifts')
          .select('*')
          .eq('employee_id', employeeId)

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query.order('start_time', {
          ascending: true,
        })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching employee shifts:', error)
        return []
      }
    },
    []
  )

  // Create shift
  const createShift = useCallback(
    async (shiftData: CreateShiftRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Verify user owns the company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('owner_id')
          .eq('id', shiftData.company_id)
          .single()

        if (companyError || company?.owner_id !== user.id) {
          throw new Error('Unauthorized: You do not own this company')
        }

        const { data, error } = await supabase
          .from('shifts')
          .insert(shiftData)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          shifts: [...prev.shifts, data],
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Update shift
  const updateShift = useCallback(
    async (shiftId: string, updates: UpdateShiftRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('shifts')
          .update(updates)
          .eq('id', shiftId)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          shifts: prev.shifts.map((shift) =>
            shift.id === shiftId ? data : shift
          ),
          selectedShift:
            prev.selectedShift?.id === shiftId ? data : prev.selectedShift,
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Mark shift as in progress
  const startShift = useCallback(
    async (shiftId: string) => {
      return updateShift(shiftId, { status: 'in_progress' })
    },
    [updateShift]
  )

  // Mark shift as completed
  const completeShift = useCallback(
    async (shiftId: string) => {
      return updateShift(shiftId, { status: 'completed' })
    },
    [updateShift]
  )

  // Cancel shift
  const cancelShift = useCallback(
    async (shiftId: string, reason?: string) => {
      return updateShift(shiftId, {
        status: 'cancelled',
        notes: reason,
      })
    },
    [updateShift]
  )

  // Delete shift
  const deleteShift = useCallback(
    async (shiftId: string) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', shiftId)

        if (error) throw error

        setState((prev) => ({
          ...prev,
          shifts: prev.shifts.filter((shift) => shift.id !== shiftId),
          selectedShift:
            prev.selectedShift?.id === shiftId ? null : prev.selectedShift,
        }))

        return { success: true }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Select shift
  const selectShift = useCallback((shift: Shift | null) => {
    setState((prev) => ({
      ...prev,
      selectedShift: shift,
    }))
  }, [])

  // Bulk create shifts (for recurring schedules)
  const bulkCreateShifts = useCallback(
    async (shiftsData: CreateShiftRequest[]) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('shifts')
          .insert(shiftsData)
          .select()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          shifts: [...prev.shifts, ...(data || [])],
        }))

        return { success: true, data, count: (data || []).length }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Set up real-time subscription
  useEffect(() => {
    if (companyId) {
      fetchShifts(companyId)

      const channel = supabase
        .channel(`shifts_company_${companyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shifts',
            filter: `company_id=eq.${companyId}`,
          },
          () => {
            fetchShifts(companyId)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [companyId, fetchShifts])

  return {
    ...state,
    getShift,
    getEmployeeShifts,
    createShift,
    updateShift,
    startShift,
    completeShift,
    cancelShift,
    deleteShift,
    selectShift,
    bulkCreateShifts,
    refetch: () => fetchShifts(companyId),
  }
}
