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

        // Get user's current location (optional)
        let lat: number | null = null
        let lng: number | null = null
        
        if (!options.skipGeofenceValidation) {
          try {
            const coordinates = await getLocation()
            lat = coordinates.latitude
            lng = coordinates.longitude
          } catch (error) {
            console.warn('Failed to get location, continuing without it:', error)
            // Don't fail if geolocation is unavailable
          }
        }

        // Create time entry
        const { data, error } = await supabase
          .from('time_entries')
          .insert({
            employee_id: employeeId,
            shift_id: options.shift_id || null,
            clock_in_time: new Date().toISOString(),
            clock_in_lat: lat,
            clock_in_lng: lng,
            status: 'active',
            geofence_validated: false,
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
    [user, getLocation, fetchRecentEntries]
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

  // Set up polling (fallback instead of real-time subscription which can hang)
  useEffect(() => {
    if (!user) return

    let pollInterval: NodeJS.Timeout | null = null
    let isMounted = true

    // Get current employee ID from user's profile
    supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (isMounted && data && data.length > 0) {
          const employeeId = data[0].id
          
          // Initial fetch
          fetchCurrentEntry(employeeId)
          fetchRecentEntries(employeeId)

          // Poll for updates every 10 seconds (increased interval to avoid thrashing)
          pollInterval = setInterval(() => {
            if (isMounted) {
              fetchCurrentEntry(employeeId)
              fetchRecentEntries(employeeId)
            }
          }, 10000)
        }
      })
      .catch((error) => {
        console.error('Error fetching employee ID:', error)
      })

    return () => {
      isMounted = false
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [user, fetchCurrentEntry, fetchRecentEntries])

  // Start break
  const startBreak = useCallback(async () => {
    try {
      if (!state.currentEntry) {
        throw new Error('No active time entry')
      }

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          status: 'on_break',
          break_start: new Date().toISOString(),
        })
        .eq('id', state.currentEntry.id)
        .select()
        .single()

      if (error) throw error

      setState((prev) => ({
        ...prev,
        currentEntry: data,
      }))

      return { success: true, data }
    } catch (error) {
      const err = error as Error
      setState((prev) => ({
        ...prev,
        error: err,
      }))
      return { success: false, error: err.message }
    }
  }, [state.currentEntry])

  // End break
  const endBreak = useCallback(async () => {
    try {
      if (!state.currentEntry) {
        throw new Error('No active time entry')
      }

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          status: 'active',
          break_end: new Date().toISOString(),
        })
        .eq('id', state.currentEntry.id)
        .select()
        .single()

      if (error) throw error

      setState((prev) => ({
        ...prev,
        currentEntry: data,
      }))

      return { success: true, data }
    } catch (error) {
      const err = error as Error
      setState((prev) => ({
        ...prev,
        error: err,
      }))
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
