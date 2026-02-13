import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useLocations } from '@/hooks/useLocations'
import type {
  TimeEntry,
  ClockInRequest,
  ClockOutRequest,
  GeolocationCoordinates,
} from '@/types'

export interface UseTimeTrackingState {
  currentEntry: TimeEntry | null
  recentEntries: TimeEntry[]
  loading: boolean
  error: Error | null
}

export interface ClockInOptions {
  shift_id?: string
  notes?: string
  skipGeofenceValidation?: boolean
}

export interface ClockOutOptions {
  break_minutes?: number
  notes?: string
  skipGeofenceValidation?: boolean
}

export const useTimeTracking = (companyId?: string) => {
  const { user } = useAuth()
  const { getLocation } = useGeolocation()
  const { validateGeofence } = useLocations(companyId)

  const [state, setState] = useState<UseTimeTrackingState>({
    currentEntry: null,
    recentEntries: [],
    loading: true,
    error: null,
  })

  // Get current active time entry
  const fetchCurrentEntry = useCallback(async (employeeId?: string) => {
    if (!user && !employeeId) return

    try {
      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('status', 'active')

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      const { data, error } = await query
        .order('clock_in_time', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      setState((prev) => ({
        ...prev,
        currentEntry: data,
      }))

      return data
    } catch (error) {
      console.error('Error fetching current entry:', error)
      return null
    }
  }, [user])

  // Get recent time entries
  const fetchRecentEntries = useCallback(
    async (employeeId?: string, limit = 20) => {
      if (!user && !employeeId) return

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        let query = supabase.from('time_entries').select('*')

        if (employeeId) {
          query = query.eq('employee_id', employeeId)
        }

        const { data, error } = await query
          .order('clock_in_time', { ascending: false })
          .limit(limit)

        if (error) throw error

        setState((prev) => ({
          ...prev,
          recentEntries: data || [],
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
    [user]
  )

  // Clock in
  const clockIn = useCallback(
    async (employeeId: string, options: ClockInOptions = {}) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Get user's current location
        let coordinates: GeolocationCoordinates
        try {
          coordinates = await getLocation()
        } catch (error) {
          throw new Error(
            `Failed to get location: ${(error as Error).message}`
          )
        }

        // Validate geofence if shift is provided
        if (options.shift_id && !options.skipGeofenceValidation) {
          try {
            const shift = await supabase
              .from('shifts')
              .select('location_id')
              .eq('id', options.shift_id)
              .single()

            if (shift.data) {
              const validation = await validateGeofence(
                shift.data.location_id,
                coordinates
              )

              if (!validation.isValid) {
                throw new Error(
                  validation.error ||
                    'User is outside geofence for this location'
                )
              }
            }
          } catch (error) {
            const err = error as Error
            throw new Error(`Geofence validation failed: ${err.message}`)
          }
        }

        // Create time entry
        const { data, error } = await supabase
          .from('time_entries')
          .insert({
            employee_id: employeeId,
            shift_id: options.shift_id || null,
            clock_in_time: new Date().toISOString(),
            clock_in_lat: coordinates.latitude,
            clock_in_lng: coordinates.longitude,
            status: 'active',
            geofence_validated: !options.skipGeofenceValidation,
          })
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          currentEntry: data,
        }))

        await fetchRecentEntries(employeeId)

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        setState((prev) => ({
          ...prev,
          error: err,
        }))
        return { success: false, error: err.message }
      }
    },
    [user, getLocation, validateGeofence, fetchRecentEntries]
  )

  // Clock out
  const clockOut = useCallback(
    async (
      timeEntryId: string,
      options: ClockOutOptions = {}
    ) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        if (!timeEntryId) {
          throw new Error('No active time entry')
        }

        // Get user's current location
        let coordinates: GeolocationCoordinates
        try {
          coordinates = await getLocation()
        } catch (error) {
          throw new Error(
            `Failed to get location: ${(error as Error).message}`
          )
        }

        // Get current entry to validate
        const { data: currentEntry } = await supabase
          .from('time_entries')
          .select('*')
          .eq('id', timeEntryId)
          .single()

        if (!currentEntry) {
          throw new Error('Time entry not found')
        }

        // Calculate total hours
        const clockOutTime = new Date().toISOString()
        const clockInTime = new Date(currentEntry.clock_in_time).getTime()
        const clockOutTimeMs = new Date(clockOutTime).getTime()
        const totalMinutes = (clockOutTimeMs - clockInTime) / (1000 * 60)
        const breakMinutes = options.break_minutes || 0
        const totalHours = (totalMinutes - breakMinutes) / 60

        // Update time entry
        const { data, error } = await supabase
          .from('time_entries')
          .update({
            clock_out_time: clockOutTime,
            clock_out_lat: coordinates.latitude,
            clock_out_lng: coordinates.longitude,
            status: 'clocked_out',
            total_hours: Math.round(totalHours * 100) / 100,
          })
          .eq('id', timeEntryId)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          currentEntry: null,
        }))

        await fetchRecentEntries(currentEntry.employee_id)

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        setState((prev) => ({
          ...prev,
          error: err,
        }))
        return { success: false, error: err.message }
      }
    },
    [user, getLocation, fetchRecentEntries]
  )

  // Get entry details
  const getEntryDetails = useCallback(
    async (timeEntryId: string): Promise<TimeEntry | null> => {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('id', timeEntryId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching entry details:', error)
        return null
      }
    },
    []
  )

  // Set up real-time subscription
  useEffect(() => {
    if (user) {
      // Get current employee ID from user's profile
      supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const employeeId = data[0].id
            fetchCurrentEntry(employeeId)
            fetchRecentEntries(employeeId)

            // Set up real-time subscription
            const channel = supabase
              .channel(`time_entries_employee_${employeeId}`)
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'time_entries',
                  filter: `employee_id=eq.${employeeId}`,
                },
                () => {
                  fetchCurrentEntry(employeeId)
                  fetchRecentEntries(employeeId)
                }
              )
              .subscribe()

            return () => {
              supabase.removeChannel(channel)
            }
          }
        })
    }
  }, [user, fetchCurrentEntry, fetchRecentEntries])

  // Start break
  const startBreak = useCallback(async () => {
    try {
      if (!state.currentEntry) {
        throw new Error('No active time entry')
      }

      // Break functionality requires break_start/break_end columns in database
      return { success: false, error: 'Break functionality not yet implemented' }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message }
    }
  }, [state.currentEntry])

  // End break
  const endBreak = useCallback(async () => {
    try {
      if (!state.currentEntry) {
        throw new Error('No active time entry')
      }

      // Break functionality requires break_start/break_end columns in database
      return { success: false, error: 'Break functionality not yet implemented' }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message }
    }
  }, [state.currentEntry])

  return {
    ...state,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    getEntryDetails,
    refetch: () => {
      fetchCurrentEntry()
      fetchRecentEntries()
    },
  }
}
