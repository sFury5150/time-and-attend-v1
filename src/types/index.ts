/**
 * Type definitions for Time & Attendance App
 * Generated from Supabase schema - Phase 1
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type Company = {
  id: string
  name: string
  owner_id: string
  email?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type Employee = {
  id: string
  company_id: string
  name: string
  email: string
  phone?: string | null
  role: 'guard' | 'supervisor' | 'manager'
  hire_date: string // date
  status: 'active' | 'inactive' | 'terminated'
  user_id?: string | null
  created_at: string
  updated_at: string
}

export type Location = {
  id: string
  company_id: string
  name: string
  address?: string | null
  latitude: number
  longitude: number
  radius_meters: number
  created_at: string
  updated_at: string
}

export type GeofenceZone = {
  id: string
  location_id: string
  latitude: number
  longitude: number
  radius_meters: number
  created_at: string
  updated_at: string
}

export type Shift = {
  id: string
  company_id: string
  employee_id: string
  location_id: string
  start_time: string // timestamp with time zone
  end_time: string // timestamp with time zone
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string | null
  created_at: string
  updated_at: string
}

export type TimeEntry = {
  id: string
  employee_id: string
  shift_id?: string | null
  clock_in_time: string // timestamp with time zone
  clock_in_lat?: number | null
  clock_in_lng?: number | null
  clock_out_time?: string | null
  clock_out_lat?: number | null
  clock_out_lng?: number | null
  status: 'active' | 'clocked_out'
  geofence_validated: boolean
  geofence_error?: string | null
  total_hours?: number | null
  break_minutes?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type TimeTrackingAnalytics = {
  id: string
  employee_id: string
  company_id: string
  week_of: string // date
  total_hours: number
  overtime: number
  attendance_percentage: number
  days_worked: number
  on_time_count: number
  late_count: number
  created_at: string
  updated_at: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    code?: string
  }
  success: boolean
}

export type ListResponse<T> = {
  data: T[]
  count: number
  error?: {
    message: string
  }
}

// ============================================================================
// GEOLOCATION TYPES
// ============================================================================

export type GeolocationCoordinates = {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
}

export type GeofenceValidationResult = {
  isValid: boolean
  distance?: number
  error?: string
  zone?: GeofenceZone
}

// ============================================================================
// FORM REQUEST TYPES
// ============================================================================

export type CreateCompanyRequest = {
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  notes?: string
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>

export type CreateEmployeeRequest = {
  company_id: string
  name: string
  email: string
  phone?: string
  role: 'guard' | 'supervisor' | 'manager'
  hire_date: string
  user_id?: string
}

export type UpdateEmployeeRequest = Partial<
  Omit<CreateEmployeeRequest, 'company_id'> & { status?: 'active' | 'inactive' | 'terminated' }
>

export type CreateLocationRequest = {
  company_id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  radius_meters?: number
}

export type UpdateLocationRequest = Partial<
  Omit<CreateLocationRequest, 'company_id'>
>

export type CreateShiftRequest = {
  company_id: string
  employee_id: string
  location_id: string
  start_time: string
  end_time: string
  notes?: string
}

export type UpdateShiftRequest = Partial<
  Omit<CreateShiftRequest, 'company_id'> & {
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  }
>

export type ClockInRequest = {
  employee_id: string
  shift_id?: string
  latitude: number
  longitude: number
  notes?: string
}

export type ClockOutRequest = {
  time_entry_id: string
  latitude: number
  longitude: number
  break_minutes?: number
  notes?: string
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export type EmployeeFilter = {
  company_id?: string
  status?: 'active' | 'inactive' | 'terminated'
  role?: 'guard' | 'supervisor' | 'manager'
  search?: string
}

export type TimeEntryFilter = {
  employee_id?: string
  shift_id?: string
  status?: 'active' | 'clocked_out'
  date_from?: string
  date_to?: string
}

export type ShiftFilter = {
  company_id?: string
  employee_id?: string
  location_id?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  date_from?: string
  date_to?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class GeofenceValidationError extends Error {
  constructor(
    message: string,
    public distance: number,
    public tolerance: number
  ) {
    super(message)
    this.name = 'GeofenceValidationError'
  }
}

export class LocationPermissionError extends Error {
  constructor(message: string = 'Location permission denied') {
    super(message)
    this.name = 'LocationPermissionError'
  }
}

export class LocationUnavailableError extends Error {
  constructor(message: string = 'Location service unavailable') {
    super(message)
    this.name = 'LocationUnavailableError'
  }
}
