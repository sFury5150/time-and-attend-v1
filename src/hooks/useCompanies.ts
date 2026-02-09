import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '@/types'

export interface UseCompaniesState {
  companies: Company[]
  selectedCompany: Company | null
  loading: boolean
  error: Error | null
}

export const useCompanies = () => {
  const { user } = useAuth()
  const [state, setState] = useState<UseCompaniesState>({
    companies: [],
    selectedCompany: null,
    loading: true,
    error: null,
  })

  // Fetch companies (only those owned by user or user is employee in)
  const fetchCompanies = useCallback(async () => {
    if (!user) return

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // Get companies where user is the owner
      const { data: ownedCompanies, error: ownedError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .order('name', { ascending: true })

      if (ownedError) throw ownedError

      // Get companies where user is an employee
      const { data: employeeCompanies, error: employeeError } = await supabase
        .from('employees')
        .select('company_id')
        .eq('user_id', user.id)

      if (employeeError && employeeError.code !== 'PGRST116')
        throw employeeError

      let companyIds: string[] = []
      if (employeeCompanies && employeeCompanies.length > 0) {
        companyIds = employeeCompanies.map((ec) => ec.company_id)
      }

      let employedInCompanies: Company[] = []
      if (companyIds.length > 0) {
        const { data: empData, error: empError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
          .order('name', { ascending: true })

        if (empError) throw empError
        employedInCompanies = empData || []
      }

      // Merge and deduplicate
      const allCompanies = [
        ...(ownedCompanies || []),
        ...employedInCompanies,
      ].filter(
        (company, index, self) =>
          index === self.findIndex((c) => c.id === company.id)
      )

      setState((prev) => ({
        ...prev,
        companies: allCompanies,
        loading: false,
      }))

      return allCompanies
    } catch (error) {
      const err = error as Error
      setState((prev) => ({
        ...prev,
        error: err,
        loading: false,
      }))
      return []
    }
  }, [user])

  // Get single company
  const getCompany = useCallback(
    async (companyId: string): Promise<Company | null> => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching company:', error)
        return null
      }
    },
    []
  )

  // Create company
  const createCompany = useCallback(
    async (companyData: CreateCompanyRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            owner_id: user.id,
          })
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          companies: [...prev.companies, data],
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Update company (only if owner)
  const updateCompany = useCallback(
    async (companyId: string, updates: UpdateCompanyRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Verify user owns the company
        const company = await getCompany(companyId)
        if (!company || company.owner_id !== user.id) {
          throw new Error('Unauthorized: You do not own this company')
        }

        const { data, error } = await supabase
          .from('companies')
          .update(updates)
          .eq('id', companyId)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          companies: prev.companies.map((c) =>
            c.id === companyId ? data : c
          ),
          selectedCompany:
            prev.selectedCompany?.id === companyId
              ? data
              : prev.selectedCompany,
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user, getCompany]
  )

  // Delete company (only if owner)
  const deleteCompany = useCallback(
    async (companyId: string) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Verify user owns the company
        const company = await getCompany(companyId)
        if (!company || company.owner_id !== user.id) {
          throw new Error('Unauthorized: You do not own this company')
        }

        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', companyId)

        if (error) throw error

        setState((prev) => ({
          ...prev,
          companies: prev.companies.filter((c) => c.id !== companyId),
          selectedCompany:
            prev.selectedCompany?.id === companyId
              ? null
              : prev.selectedCompany,
        }))

        return { success: true }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user, getCompany]
  )

  // Select company
  const selectCompany = useCallback((company: Company | null) => {
    setState((prev) => ({
      ...prev,
      selectedCompany: company,
    }))
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    if (user) {
      fetchCompanies()

      // Subscribe to owned companies changes
      const channelOwned = supabase
        .channel(`companies_owned_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'companies',
            filter: `owner_id=eq.${user.id}`,
          },
          () => {
            fetchCompanies()
          }
        )
        .subscribe()

      // Subscribe to employees table changes to detect new company associations
      const channelEmployees = supabase
        .channel(`employees_user_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCompanies()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channelOwned)
        supabase.removeChannel(channelEmployees)
      }
    }
  }, [user, fetchCompanies])

  return {
    ...state,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    selectCompany,
    refetch: fetchCompanies,
  }
}
