import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeFilter,
} from '@/types'

export interface UseEmployeesState {
  employees: Employee[]
  selectedEmployee: Employee | null
  loading: boolean
  error: Error | null
}

export const useEmployees = (companyId?: string) => {
  const { user } = useAuth()
  const [state, setState] = useState<UseEmployeesState>({
    employees: [],
    selectedEmployee: null,
    loading: true,
    error: null,
  })

  // Fetch employees
  const fetchEmployees = useCallback(
    async (cId?: string, filters?: EmployeeFilter) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        let query = supabase.from('employees').select('*')

        // Filter by company
        if (cId) {
          query = query.eq('company_id', cId)
        } else if (filters?.company_id) {
          query = query.eq('company_id', filters.company_id)
        }

        // Apply additional filters
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        if (filters?.role) {
          query = query.eq('role', filters.role)
        }

        if (filters?.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
          )
        }

        const { data, error } = await query.order('name', { ascending: true })

        if (error) throw error

        setState((prev) => ({
          ...prev,
          employees: data || [],
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

  // Get single employee
  const getEmployee = useCallback(
    async (employeeId: string): Promise<Employee | null> => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching employee:', error)
        return null
      }
    },
    []
  )

  // Create employee
  const createEmployee = useCallback(
    async (employeeData: CreateEmployeeRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Verify user owns the company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('owner_id')
          .eq('id', employeeData.company_id)
          .single()

        if (companyError || company?.owner_id !== user.id) {
          throw new Error('Unauthorized: You do not own this company')
        }

        const { data, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          employees: [...prev.employees, data],
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Update employee
  const updateEmployee = useCallback(
    async (employeeId: string, updates: UpdateEmployeeRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', employeeId)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          employees: prev.employees.map((emp) =>
            emp.id === employeeId ? data : emp
          ),
          selectedEmployee:
            prev.selectedEmployee?.id === employeeId
              ? data
              : prev.selectedEmployee,
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Deactivate employee
  const deactivateEmployee = useCallback(
    async (employeeId: string) => {
      return updateEmployee(employeeId, { status: 'inactive' })
    },
    [updateEmployee]
  )

  // Reactivate employee
  const reactivateEmployee = useCallback(
    async (employeeId: string) => {
      return updateEmployee(employeeId, { status: 'active' })
    },
    [updateEmployee]
  )

  // Delete employee
  const deleteEmployee = useCallback(
    async (employeeId: string) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId)

        if (error) throw error

        setState((prev) => ({
          ...prev,
          employees: prev.employees.filter((emp) => emp.id !== employeeId),
          selectedEmployee:
            prev.selectedEmployee?.id === employeeId
              ? null
              : prev.selectedEmployee,
        }))

        return { success: true }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Select employee
  const selectEmployee = useCallback((employee: Employee | null) => {
    setState((prev) => ({
      ...prev,
      selectedEmployee: employee,
    }))
  }, [])

  // Get employee by user ID
  const getEmployeeByUserId = useCallback(
    async (userId: string): Promise<Employee | null> => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching employee by user ID:', error)
        return null
      }
    },
    []
  )

  // Set up real-time subscription
  useEffect(() => {
    if (companyId) {
      fetchEmployees(companyId)

      const channel = supabase
        .channel(`employees_company_${companyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees',
            filter: `company_id=eq.${companyId}`,
          },
          () => {
            fetchEmployees(companyId)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [companyId, fetchEmployees])

  return {
    ...state,
    getEmployee,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    deleteEmployee,
    selectEmployee,
    getEmployeeByUserId,
    refetch: () => fetchEmployees(companyId),
  }
}
