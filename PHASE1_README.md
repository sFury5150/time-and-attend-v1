# Time & Attendance App - Phase 1 Documentation

## Overview

This is a security guard workforce management application built with React, Vite, TypeScript, shadcn-ui, Tailwind, and Supabase. Phase 1 implements core time tracking, employee management, location/geofencing, and scheduling features.

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **UI Components**: shadcn-ui + Radix UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (PostgreSQL subscriptions)
- **Geolocation**: Browser Geolocation API
- **State Management**: React Hooks + React Query (optional integration)

### Database Schema

All tables implement Row-Level Security (RLS) for data isolation:

#### 1. **companies**
- Workspace containers owned by users
- One owner per company
- Tracks contact info and basic metadata

#### 2. **employees**
- Guards, supervisors, managers within a company
- Email must be unique within a company
- Status: active, inactive, terminated
- Optional user_id for auth integration

#### 3. **locations**
- Physical work sites with geofence center point
- Company-specific
- Has a default radius_meters (geofence tolerance)

#### 4. **geofence_zones**
- Specific geofence circles within a location
- Allows multiple zones per location
- Each has its own radius

#### 5. **shifts**
- Scheduled work periods
- Links employee → location → time window
- Status: scheduled, in_progress, completed, cancelled

#### 6. **time_entries**
- Clock in/out records per shift
- Captures lat/lng for both clock events
- Geofence validation status
- Total hours and break duration

#### 7. **time_tracking_analytics**
- Weekly aggregates per employee
- Total hours, overtime, attendance %
- Days worked, on-time/late counts

### Row-Level Security (RLS) Policies

All tables have RLS enabled:

- **Companies**: Owner can CRUD. Employees can READ only.
- **Employees**: Company owner can CRUD. Employees see own company's employees.
- **Locations & Geofence Zones**: Company owner can CRUD. Employees can READ.
- **Shifts**: Company owner can CREATE/UPDATE. All can READ (own company).
- **Time Entries**: Employees can INSERT/UPDATE own entries. Company owner can READ all.
- **Analytics**: Company owner and employees can READ their own analytics.

## Setup Instructions

### 1. Run Database Schema

Send `schema.sql` to your Supabase admin. They will:

```sql
-- In Supabase SQL Editor, run:
\i schema.sql
```

This creates:
- All 7 tables with proper relationships
- Indexes for performance
- RLS policies
- Helper functions (Haversine distance, geofence validation)

### 2. Configure Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase project settings → API.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Test Authentication

1. Sign up or sign in
2. Create a company (if owner)
3. Create employees
4. Create locations with geofences
5. Create shifts
6. Test clock in/out (requires geolocation enabled)

## Custom Hooks API Reference

### useAuth()

**Purpose**: Authentication state management

```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth()
```

- `user`: Current authenticated user
- `session`: Active session
- `signIn(email, password)`: Sign in
- `signUp(email, password, firstName?, lastName?)`: Register
- `signOut()`: Logout

### useCompanies()

**Purpose**: Company management (owner-only operations)

```typescript
const {
  companies,
  selectedCompany,
  loading,
  error,
  createCompany,
  updateCompany,
  deleteCompany,
  selectCompany,
  refetch
} = useCompanies()
```

**Methods**:
- `createCompany(data)`: Create company (requires owner_id)
- `updateCompany(id, updates)`: Update (owner only)
- `deleteCompany(id)`: Delete (owner only)

**Type**: `CreateCompanyRequest`
```typescript
{
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  notes?: string
}
```

### useEmployees(companyId)

**Purpose**: Manage employees within a company

```typescript
const {
  employees,
  selectedEmployee,
  loading,
  error,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployee,
  selectEmployee,
  getEmployeeByUserId,
  refetch
} = useEmployees(companyId)
```

**Methods**:
- `createEmployee(data)`: Add employee (manager+ only)
- `updateEmployee(id, updates)`: Update employee
- `deactivateEmployee(id)`: Soft delete
- `getEmployeeByUserId(userId)`: Link auth user to employee

**Type**: `CreateEmployeeRequest`
```typescript
{
  company_id: string
  name: string
  email: string
  phone?: string
  role: 'guard' | 'supervisor' | 'manager'
  hire_date: string
  user_id?: string
}
```

### useLocations(companyId)

**Purpose**: Manage locations and geofence zones

```typescript
const {
  locations,
  selectedLocation,
  loading,
  error,
  getLocation,
  getGeofenceZones,
  validateGeofence,
  createLocation,
  updateLocation,
  deleteLocation,
  refetch
} = useLocations(companyId)
```

**Key Methods**:
- `validateGeofence(locationId, userCoordinates)`: Check if user is within bounds
  - Returns `{ isValid, distance, error, zone }`
- `getGeofenceZones(locationId)`: Get all zones for a location

**Type**: `CreateLocationRequest`
```typescript
{
  company_id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  radius_meters?: number // default 50m
}
```

### useGeolocation()

**Purpose**: Browser geolocation access with error handling

```typescript
const {
  coordinates,
  loading,
  error,
  getLocation,
  watchLocation
} = useGeolocation()
```

**Methods**:
- `getLocation()`: Single location request
  - Returns `Promise<GeolocationCoordinates>`
- `watchLocation(onLocationChange?)`: Continuous tracking
  - Returns cleanup function to stop watching

**Type**: `GeolocationCoordinates`
```typescript
{
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
}
```

### useTimeTracking(companyId)

**Purpose**: Clock in/out with geofence validation

```typescript
const {
  currentEntry,
  recentEntries,
  loading,
  error,
  clockIn,
  clockOut,
  getEntryDetails,
  refetch
} = useTimeTracking(companyId)
```

**Methods**:
- `clockIn(employeeId, options)`: Start shift
  - Validates geofence if shift_id provided
  - Returns `{ success, data?, error? }`
  
- `clockOut(timeEntryId, options)`: End shift
  - Calculates total hours
  - Returns `{ success, data?, error? }`

**Type**: `ClockInRequest`
```typescript
{
  employee_id: string
  shift_id?: string
  notes?: string
  skipGeofenceValidation?: boolean
}
```

**Type**: `TimeEntry`
```typescript
{
  id: string
  employee_id: string
  shift_id?: string
  clock_in_time: string // ISO
  clock_in_lat?: number
  clock_in_lng?: number
  clock_out_time?: string
  clock_out_lat?: number
  clock_out_lng?: number
  status: 'active' | 'clocked_out'
  geofence_validated: boolean
  geofence_error?: string
  total_hours?: number
  break_minutes?: number
  notes?: string
}
```

### useSchedules(companyId)

**Purpose**: Shift creation and management

```typescript
const {
  shifts,
  selectedShift,
  loading,
  error,
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
  refetch
} = useSchedules(companyId)
```

**Methods**:
- `createShift(data)`: Create single shift
- `bulkCreateShifts(data[])`: Create multiple shifts (for recurring patterns)
- `startShift(id)`: Mark as in_progress
- `completeShift(id)`: Mark as completed
- `cancelShift(id, reason?)`: Cancel with optional reason

**Type**: `CreateShiftRequest`
```typescript
{
  company_id: string
  employee_id: string
  location_id: string
  start_time: string // ISO
  end_time: string // ISO
  notes?: string
}
```

### useAnalytics()

**Purpose**: Time tracking metrics and reporting

```typescript
const {
  analytics,
  loading,
  error,
  getEmployeeAnalytics,
  getCompanyAnalytics,
  calculateWeeklyAnalytics,
  updateAnalytics,
  getCompanySummary,
  refetch
} = useAnalytics()
```

**Methods**:
- `getEmployeeAnalytics(employeeId, weekOf?)`: Weekly metrics for employee
- `getCompanySummary(companyId, weekOf?)`: Company-wide aggregates
- `calculateWeeklyAnalytics(employeeId, weekOf)`: Compute from time entries

**Type**: `TimeTrackingAnalytics`
```typescript
{
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
}
```

## Geofence Validation Flow

### Clock In Example

```typescript
import { useTimeTracking } from '@/hooks/useTimeTracking'
import { useGeolocation } from '@/hooks/useGeolocation'

function ClockInButton({ employeeId, shiftId }) {
  const { clockIn } = useTimeTracking()
  
  const handleClockIn = async () => {
    const result = await clockIn(employeeId, {
      shift_id: shiftId,
      notes: 'Regular shift start'
      // skipGeofenceValidation: false (default - validates geofence)
    })
    
    if (result.success) {
      console.log('Clocked in:', result.data)
    } else {
      console.error('Clock in failed:', result.error)
      // E.g., "Outside geofence. Distance: 152m, Allowed: 50m"
    }
  }
  
  return <button onClick={handleClockIn}>Clock In</button>
}
```

### Behind the Scenes

1. **Request Location**: Browser asks user for GPS coordinates
2. **Get Shift Location**: Fetch location_id from shift
3. **Validate Geofence**: Calculate distance using Haversine formula
4. **Store Entry**: If valid, create time_entry with geofence_validated=true
5. **Error Handling**: Return specific error messages (permission, timeout, out of bounds)

## Real-Time Updates

All hooks support real-time subscriptions via Supabase channels:

```typescript
// Automatic subscriptions set up in useEffect
// Updates flow through when:
// - Employees are added/modified in company
// - Shifts change
// - Time entries are clocked in/out
// - Analytics are calculated

// Manual refetch if needed:
const { refetch } = useCompanies()
await refetch()
```

## Error Handling Examples

### Geofence Validation Error

```typescript
const { validateGeofence } = useLocations()

try {
  const result = await validateGeofence(locationId, userCoords)
  
  if (!result.isValid) {
    console.error(result.error)
    // "Outside geofence. Distance: 152m, Allowed: 50m"
  }
} catch (error) {
  console.error('Validation failed:', error.message)
}
```

### Location Permission Error

```typescript
const { clockIn } = useTimeTracking()

const result = await clockIn(employeeId, { shift_id })

if (!result.success) {
  if (result.error.includes('permission denied')) {
    // Prompt user to enable location in browser settings
  } else if (result.error.includes('Outside geofence')) {
    // Show exact distance and tolerance
  }
}
```

### RLS Authorization Error

```typescript
const { createEmployee } = useEmployees(companyId)

const result = await createEmployee({
  name: 'John Doe',
  email: 'john@example.com',
  // ...
})

if (!result.success) {
  // "Unauthorized: You do not own this company"
  // User is not the company owner
}
```

## Type Definitions

All types are exported from `@/types`:

```typescript
import type {
  Company,
  Employee,
  Location,
  Shift,
  TimeEntry,
  TimeTrackingAnalytics,
  GeolocationCoordinates,
  GeofenceValidationResult,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  // ... etc
} from '@/types'
```

## Testing Checklist

- [ ] Auth: Sign up, sign in, sign out
- [ ] Company: Create, update, delete (owner only)
- [ ] Employees: Create, list, update, deactivate
- [ ] Locations: Create with geofence, list, update
- [ ] Shifts: Create, list, update status, delete
- [ ] Clock In: With valid geofence location
- [ ] Clock In: With invalid geofence (outside zone)
- [ ] Clock Out: Calculate hours correctly
- [ ] Analytics: Weekly totals, overtime calculation
- [ ] Real-time: See updates without refresh
- [ ] RLS: Verify employees can't access other companies
- [ ] RLS: Verify non-owners can't create companies

## Common Workflows

### 1. Company Owner Setup

```typescript
// 1. Sign up
await signUp(email, password, 'John', 'Doe')

// 2. Create company
const company = await createCompany({
  name: 'Acme Security',
  email: 'contact@acme.com',
  phone: '555-0000'
})

// 3. Create location
const location = await createLocation({
  company_id: company.data.id,
  name: 'Downtown Office',
  latitude: 40.7128,
  longitude: -74.0060,
  radius_meters: 100
})

// 4. Create employees
const employee1 = await createEmployee({
  company_id: company.data.id,
  name: 'Jane Smith',
  email: 'jane@acme.com',
  role: 'supervisor',
  hire_date: '2025-01-01'
})

// 5. Create shifts
const shift = await createShift({
  company_id: company.data.id,
  employee_id: employee1.data.id,
  location_id: location.data.id,
  start_time: '2025-02-06T08:00:00Z',
  end_time: '2025-02-06T17:00:00Z'
})
```

### 2. Employee Clock In/Out

```typescript
// Employee user signs in
const employee = await getEmployeeByUserId(user.id)

// Clock in (with geofence validation)
const clockInResult = await clockIn(employee.id, {
  shift_id: shiftId
})

if (!clockInResult.success) {
  // Handle geofence error
  alert(`Cannot clock in: ${clockInResult.error}`)
  return
}

// Later... clock out
const clockOutResult = await clockOut(clockInResult.data.id, {
  break_minutes: 30
})

// View weekly analytics
const analytics = await getEmployeeAnalytics(employee.id)
console.log(`Total hours this week: ${analytics[0]?.total_hours}`)
```

### 3. Reporting

```typescript
// Company manager views team metrics
const companySummary = await getCompanySummary(companyId)

console.log(`Team worked ${companySummary.totalHours} hours`)
console.log(`Average attendance: ${companySummary.averageAttendance}%`)

// Drill down to individual
const empAnalytics = await getEmployeeAnalytics(employeeId)
empAnalytics.forEach(week => {
  console.log(`Week of ${week.week_of}: ${week.total_hours}h, ${week.overtime}h OT`)
})
```

## Troubleshooting

### "Location permission denied"
- User denied browser location access
- Solution: Check browser settings → Permissions → Location
- Ensure HTTPS (required for geolocation in production)

### "Outside geofence" on clock in
- User is > radius_meters away from location center
- Check: GPS accuracy, location coordinates
- Solution: Get closer or increase radius_meters

### "User not authenticated"
- User is not logged in
- Solution: Sign in first, verify AuthProvider wraps app

### RLS policy errors on time_entries
- Employee trying to update someone else's entries
- Solution: Employees can only update their own entries (by design)

### Real-time updates not firing
- Channel subscription not active
- Solution: Ensure AuthProvider is loaded, user is authenticated
- Check Supabase project realtime is enabled

## Deployment Checklist

- [ ] Supabase production database with schema.sql applied
- [ ] Environment variables set (.env.production)
- [ ] HTTPS enabled (required for geolocation)
- [ ] Supabase realtime enabled
- [ ] RLS policies tested and verified
- [ ] CORS configured if API calls from different origin
- [ ] Error logging set up (Sentry, LogRocket, etc.)
- [ ] Performance monitoring enabled

## Next Steps (Phase 2)

- [ ] Break management UI
- [ ] Photo/proof capture on clock in/out
- [ ] Geofence radius auto-adjustment
- [ ] Recurring shift patterns
- [ ] Mobile app (React Native)
- [ ] Push notifications for schedule changes
- [ ] PDF report generation
- [ ] Integration with payroll systems
- [ ] Supervisor approval workflow
- [ ] Audit logging

## Support

For issues or questions:
1. Check this README first
2. Review hook TypeScript types in `src/types/index.ts`
3. Check Supabase logs for RLS errors
4. Verify browser console for geolocation errors
5. Test RLS policies in Supabase SQL editor

---

**Schema Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Phase 1 Complete - Ready for Phase 2
