import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { TimeTrackingAnalytics, TimeEntry } from '@/types'

export interface AnalyticsFilter {
  employee_id?: string
  company_id?: string
  week_of?: string
  month_of?: string
}

export interface UseAnalyticsState {
  analytics: TimeTrackingAnalytics[]
  loading: boolean
  error: Error | null
}

export const useAnalytics = () => {
  const { user } = useAuth()
  const [state, setState] = useState<UseAnalyticsState>({
    analytics: [],
    loading: true,
    error: null,
  })

  // Fetch analytics
  const fetchAnalytics = useCallback(
    async (filters?: AnalyticsFilter) => {
      if (!user) return

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        let query = supabase.from('time_tracking_analytics').select('*')

        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id)
        }

        if (filters?.company_id) {
          query = query.eq('company_id', filters.company_id)
        }

        if (filters?.week_of) {
          query = query.eq('week_of', filters.week_of)
        }

        const { data, error } = await query.order('week_of', {
          ascending: false,
        })

        if (error) throw error

        setState((prev) => ({
          ...prev,
          analytics: data || [],
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

  // Get analytics for employee
  const getEmployeeAnalytics = useCallback(
    async (employeeId: string, weekOf?: string) => {
      try {
        let query = supabase
          .from('time_tracking_analytics')
          .select('*')
          .eq('employee_id', employeeId)

        if (weekOf) {
          query = query.eq('week_of', weekOf)
        }

        const { data, error } = await query.order('week_of', {
          ascending: false,
        })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching employee analytics:', error)
        return []
      }
    },
    []
  )

  // Get company analytics
  const getCompanyAnalytics = useCallback(
    async (companyId: string, weekOf?: string) => {
      try {
        let query = supabase
          .from('time_tracking_analytics')
          .select('*')
          .eq('company_id', companyId)

        if (weekOf) {
          query = query.eq('week_of', weekOf)
        }

        const { data, error } = await query.order('week_of', {
          ascending: false,
        })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching company analytics:', error)
        return []
      }
    },
    []
  )

  // Calculate analytics from time entries (helper function)
  const calculateWeeklyAnalytics = useCallback(
    async (employeeId: string, weekOf: string) => {
      try {
        // Get all time entries for the week
        const weekStart = new Date(weekOf)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const { data: timeEntries, error: entriesError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('status', 'clocked_out')
          .gte('clock_in_time', weekStart.toISOString())
          .lt('clock_in_time', weekEnd.toISOString())

        if (entriesError) throw entriesError

        // Calculate totals
        let totalHours = 0
        let daysWorked = 0
        const daysSet = new Set<string>()

        timeEntries?.forEach((entry) => {
          if (entry.total_hours) {
            totalHours += entry.total_hours
          }

          const entryDate = new Date(entry.clock_in_time)
            .toISOString()
            .split('T')[0]
          daysSet.add(entryDate)
        })

        daysWorked = daysSet.size

        // Calculate overtime (anything over 40 hours per week)
        const standardHours = 40
        const overtime = Math.max(0, totalHours - standardHours)

        // Calculate attendance percentage
        const expectedDays = 5 // Assuming 5-day work week
        const attendancePercentage = (daysWorked / expectedDays) * 100

        return {
          total_hours: Math.round(totalHours * 100) / 100,
          overtime: Math.round(overtime * 100) / 100,
          attendance_percentage: Math.round(attendancePercentage * 100) / 100,
          days_worked: daysWorked,
          on_time_count: daysWorked, // Would need shift comparison for accurate calculation
          late_count: 0,
        }
      } catch (error) {
        console.error('Error calculating analytics:', error)
        return null
      }
    },
    []
  )

  // Update or create analytics record
  const updateAnalytics = useCallback(
    async (
      employeeId: string,
      companyId: string,
      weekOf: string,
      analyticsData: Partial<TimeTrackingAnalytics>
    ) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Check if record exists
        const { data: existing } = await supabase
          .from('time_tracking_analytics')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('week_of', weekOf)
          .single()

        let result

        if (existing) {
          // Update existing
          const { data, error } = await supabase
            .from('time_tracking_analytics')
            .update(analyticsData)
            .eq('employee_id', employeeId)
            .eq('week_of', weekOf)
            .select()
            .single()

          if (error) throw error
          result = data
        } else {
          // Create new
          const { data, error } = await supabase
            .from('time_tracking_analytics')
            .insert({
              employee_id: employeeId,
              company_id: companyId,
              week_of: weekOf,
              ...analyticsData,
            })
            .select()
            .single()

          if (error) throw error
          result = data
        }

        setState((prev) => ({
          ...prev,
          analytics: prev.analytics.map((a) =>
            a.employee_id === employeeId && a.week_of === weekOf
              ? result
              : a
          ),
        }))

        return { success: true, data: result }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Get summary stats for company
  const getCompanySummary = useCallback(
    async (companyId: string, weekOf?: string) => {
      try {
        const analytics = await getCompanyAnalytics(companyId, weekOf)

        if (!analytics.length) {
          return {
            totalEmployees: 0,
            totalHours: 0,
            averageHours: 0,
            overtimeHours: 0,
            averageAttendance: 0,
          }
        }

        const totalHours = analytics.reduce((sum, a) => sum + a.total_hours, 0)
        const totalOvertime = analytics.reduce(
          (sum, a) => sum + a.overtime,
          0
        )
        const avgAttendance =
          analytics.reduce((sum, a) => sum + a.attendance_percentage, 0) /
          analytics.length

        return {
          totalEmployees: analytics.length,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHours: Math.round((totalHours / analytics.length) * 100) / 100,
          overtimeHours: Math.round(totalOvertime * 100) / 100,
          averageAttendance: Math.round(avgAttendance * 100) / 100,
        }
      } catch (error) {
        console.error('Error getting company summary:', error)
        return null
      }
    },
    [getCompanyAnalytics]
  )

  return {
    ...state,
    fetchAnalytics,
    getEmployeeAnalytics,
    getCompanyAnalytics,
    calculateWeeklyAnalytics,
    updateAnalytics,
    getCompanySummary,
    refetch: fetchAnalytics,
  }
}
