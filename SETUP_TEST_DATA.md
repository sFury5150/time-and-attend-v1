# Setup Test Data for Time & Attendance App

**Status:** Ready to Execute  
**Environment:** Supabase Project `cjpyypjmtjghtspvmjld`  
**Estimated Time:** 5-10 minutes  
**Prerequisite:** Authentication must be working first

---

## Overview

This guide walks through creating test data in Supabase to enable full feature testing:

1. **Test User** - Login account (schoi@proliantservices.com)
2. **Test Company** - Proliant Security
3. **Test Employees** - 3 sample employees
4. **Test Location** - Location with geofence coordinates
5. **Test Shift** - Work schedule for testing

---

## Step 1: Create Test User via Signup

### In Browser:
1. Go to: https://time-and-attend-v1.vercel.app/auth
2. Click "Sign Up" tab
3. Fill in:
   - **First Name:** Shawn
   - **Last Name:** Choi
   - **Email:** schoi@proliantservices.com
   - **Password:** ProliantSecure2026!
4. Click "Sign Up" button
5. **Check email** (schoi@proliantservices.com) for confirmation link
6. Click confirmation link in email
7. Return to app and login with credentials

### In Supabase (Alternative - if email not working):
If email confirmation is slow or not working, you can create the user directly in Supabase:

1. Go to: https://app.supabase.com
2. Select project: `cjpyypjmtjghtspvmjld`
3. Go to: **Authentication > Users**
4. Click "Add user" (or invite user)
5. Enter:
   - Email: schoi@proliantservices.com
   - Password: ProliantSecure2026!
6. Click "Create user"
7. Mark email as verified (toggle the verified checkmark)

---

## Step 2: Create Test Company

Once logged in to the app:

1. Go to: `/dashboard/companies`
2. Click "New Company" or "Create Company" button
3. Fill in:
   - **Company Name:** Proliant Security
   - **Email:** hello@proliantsecurity.com
   - **Phone:** (555) 123-4567
   - **Address:** 123 Security Lane, San Francisco, CA 94105
   - **Website:** www.proliantsecurity.com
4. Click "Create" or "Save"
5. **Record the Company ID** (shown in response or list)

### Alternative - Via SQL:

In Supabase SQL Editor:

```sql
-- Get the current user ID first:
-- (This will be the user ID from authentication step)
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from auth.users

INSERT INTO public.companies (id, name, owner_id, email, phone, address, website)
VALUES (
  gen_random_uuid(),
  'Proliant Security',
  'YOUR_USER_ID_HERE',  -- Get this from Supabase Auth > Users > Copy user ID
  'hello@proliantsecurity.com',
  '(555) 123-4567',
  '123 Security Lane, San Francisco, CA 94105',
  'www.proliantsecurity.com'
);

-- Note the inserted company ID for the next steps
-- You can find it with:
SELECT id, name FROM public.companies WHERE name = 'Proliant Security' LIMIT 1;
```

---

## Step 3: Create Test Location with Geofence

### In App:
1. Go to: `/dashboard/locations`
2. Click "New Location" button
3. Fill in:
   - **Location Name:** Headquarters
   - **Address:** 123 Security Lane, San Francisco, CA 94105
   - **Latitude:** 37.7749
   - **Longitude:** -122.4194
   - **Geofence Radius:** 50 meters
4. Click "Create" or "Save"
5. **Record the Location ID**

### Via SQL:

```sql
-- Get your company ID first (from step 2)
-- Replace 'YOUR_COMPANY_ID' with actual UUID

INSERT INTO public.locations (id, company_id, name, address, latitude, longitude, radius_meters)
VALUES (
  gen_random_uuid(),
  'YOUR_COMPANY_ID',
  'Headquarters',
  '123 Security Lane, San Francisco, CA 94105',
  37.7749,
  -122.4194,
  50.0
);

-- Verify it was created:
SELECT id, name, latitude, longitude FROM public.locations 
WHERE company_id = 'YOUR_COMPANY_ID';
```

**San Francisco Office Coordinates:**
- Latitude: 37.7749
- Longitude: -122.4194
- Radius: 50 meters (covers ~half a city block)

**Alternative Locations (for testing different geofences):**
- **Los Angeles:** 34.0522, -118.2437
- **New York:** 40.7128, -74.0060
- **Seattle:** 47.6062, -122.3321

---

## Step 4: Create Test Employees

### Via App:
1. Go to: `/dashboard/employees`
2. Click "Add Employee" button
3. Create 3 employees:

#### Employee 1:
- **Name:** John Smith
- **Email:** john.smith@proliantsecurity.com
- **Phone:** (555) 123-4568
- **Role:** Guard
- **Hire Date:** 2025-01-15
- **Status:** Active

#### Employee 2:
- **Name:** Maria Garcia
- **Email:** maria.garcia@proliantsecurity.com
- **Phone:** (555) 123-4569
- **Role:** Guard
- **Hire Date:** 2025-06-01
- **Status:** Active

#### Employee 3:
- **Name:** Michael Chen
- **Email:** michael.chen@proliantsecurity.com
- **Phone:** (555) 123-4570
- **Role:** Supervisor
- **Hire Date:** 2024-11-20
- **Status:** Active

### Via SQL:

```sql
-- Get your company ID from step 2
-- Replace 'YOUR_COMPANY_ID' with actual UUID

-- Employee 1
INSERT INTO public.employees (id, company_id, name, email, phone, role, hire_date, status)
VALUES (
  gen_random_uuid(),
  'YOUR_COMPANY_ID',
  'John Smith',
  'john.smith@proliantsecurity.com',
  '(555) 123-4568',
  'guard',
  '2025-01-15',
  'active'
);

-- Employee 2
INSERT INTO public.employees (id, company_id, name, email, phone, role, hire_date, status)
VALUES (
  gen_random_uuid(),
  'YOUR_COMPANY_ID',
  'Maria Garcia',
  'maria.garcia@proliantsecurity.com',
  '(555) 123-4569',
  'guard',
  '2025-06-01',
  'active'
);

-- Employee 3
INSERT INTO public.employees (id, company_id, name, email, phone, role, hire_date, status)
VALUES (
  gen_random_uuid(),
  'YOUR_COMPANY_ID',
  'Michael Chen',
  'michael.chen@proliantsecurity.com',
  '(555) 123-4570',
  'supervisor',
  '2024-11-20',
  'active'
);

-- Verify:
SELECT id, name, email, role FROM public.employees 
WHERE company_id = 'YOUR_COMPANY_ID';
```

---

## Step 5: Create Test Shift

This creates a work schedule for an employee.

### Via App:
1. Go to: `/dashboard/schedules`
2. Click "Create Shift" button
3. Fill in:
   - **Employee:** John Smith
   - **Location:** Headquarters
   - **Start Time:** Today at 8:00 AM
   - **End Time:** Today at 5:00 PM
   - **Status:** Scheduled
4. Click "Create"

### Via SQL:

```sql
-- Get your company ID, employee ID (John Smith), and location ID from previous steps
-- Replace 'YOUR_*_ID' with actual UUIDs

INSERT INTO public.shifts (id, company_id, employee_id, location_id, start_time, end_time, status, notes)
VALUES (
  gen_random_uuid(),
  'YOUR_COMPANY_ID',
  'YOUR_EMPLOYEE_ID_JOHN',
  'YOUR_LOCATION_ID',
  now() + INTERVAL '1 day',  -- Tomorrow at 8 AM
  now() + INTERVAL '1 day 9 hours',  -- Tomorrow at 5 PM
  'scheduled',
  'Morning shift - Headquarters'
);

-- Verify:
SELECT id, employee_id, start_time, end_time, status FROM public.shifts 
WHERE company_id = 'YOUR_COMPANY_ID';
```

---

## Step 6: Create Sample Time Entries (Clock In/Out)

This simulates actual clock-in and clock-out records.

```sql
-- Get your employee ID, location ID, and shift ID from previous steps

-- Clock In entry
INSERT INTO public.time_logs (id, employee_id, shift_id, location_id, event_type, timestamp, latitude, longitude, event_notes)
VALUES (
  gen_random_uuid(),
  'YOUR_EMPLOYEE_ID_JOHN',
  'YOUR_SHIFT_ID',
  'YOUR_LOCATION_ID',
  'clock_in',
  now(),
  37.7749,  -- Same as location
  -122.4194,  -- Same as location
  'Clocked in at headquarters'
);

-- Clock Out entry (9 hours later)
INSERT INTO public.time_logs (id, employee_id, shift_id, location_id, event_type, timestamp, latitude, longitude, event_notes)
VALUES (
  gen_random_uuid(),
  'YOUR_EMPLOYEE_ID_JOHN',
  'YOUR_SHIFT_ID',
  'YOUR_LOCATION_ID',
  'clock_out',
  now() + INTERVAL '9 hours',
  37.7749,
  -122.4194,
  'Clocked out at headquarters'
);

-- View time logs:
SELECT employee_id, event_type, timestamp FROM public.time_logs 
WHERE employee_id = 'YOUR_EMPLOYEE_ID_JOHN'
ORDER BY timestamp DESC;
```

---

## Quick SQL Bulk Setup

If you want to set everything up with SQL at once, run this in Supabase SQL Editor:

```sql
-- 1. Get the authenticated user's ID
-- (Run this separately first to get the user ID, then update the INSERT below)
-- SELECT id FROM auth.users WHERE email = 'schoi@proliantservices.com' LIMIT 1;

-- 2. Set the user ID variable (replace with actual UUID from above)
-- This will be used for all subsequent inserts
\set user_id 'YOUR_ACTUAL_USER_ID_UUID'

-- 3. Create company
WITH company_insert AS (
  INSERT INTO public.companies (id, name, owner_id, email, phone, address, website)
  VALUES (
    gen_random_uuid(),
    'Proliant Security',
    :'user_id',
    'hello@proliantsecurity.com',
    '(555) 123-4567',
    '123 Security Lane, San Francisco, CA 94105',
    'www.proliantsecurity.com'
  )
  RETURNING id as company_id
),

-- 4. Create location
location_insert AS (
  INSERT INTO public.locations (id, company_id, name, address, latitude, longitude, radius_meters)
  SELECT
    gen_random_uuid(),
    company_id,
    'Headquarters',
    '123 Security Lane, San Francisco, CA 94105',
    37.7749,
    -122.4194,
    50.0
  FROM company_insert
  RETURNING id as location_id, company_id
),

-- 5. Create employees
employee_insert AS (
  INSERT INTO public.employees (id, company_id, name, email, phone, role, hire_date, status)
  SELECT
    gen_random_uuid(),
    location_insert.company_id,
    'John Smith',
    'john.smith@proliantsecurity.com',
    '(555) 123-4568',
    'guard',
    '2025-01-15'::date,
    'active'
  FROM location_insert
  
  UNION ALL
  
  SELECT
    gen_random_uuid(),
    location_insert.company_id,
    'Maria Garcia',
    'maria.garcia@proliantsecurity.com',
    '(555) 123-4569',
    'guard',
    '2025-06-01'::date,
    'active'
  FROM location_insert
  
  UNION ALL
  
  SELECT
    gen_random_uuid(),
    location_insert.company_id,
    'Michael Chen',
    'michael.chen@proliantsecurity.com',
    '(555) 123-4570',
    'supervisor',
    '2024-11-20'::date,
    'active'
  FROM location_insert
  RETURNING id, company_id
)

SELECT 'Setup complete!' as status;
```

**Note:** The CTE approach requires PostgreSQL 9.1+. If it fails, run each INSERT separately.

---

## Verification Checklist

After running the setup:

- [ ] **User Created:** Check in Supabase Auth > Users
  - Email: schoi@proliantservices.com
  - Status: Should be verified

- [ ] **Company Created:** Check in Supabase > companies table
  - Name: Proliant Security
  - Has owner_id set

- [ ] **Location Created:** Check in Supabase > locations table
  - Name: Headquarters
  - Has valid latitude/longitude

- [ ] **Employees Created:** Check in Supabase > employees table
  - 3 employees total
  - John Smith, Maria Garcia, Michael Chen
  - All have company_id and hire_date

- [ ] **Shift Created:** Check in Supabase > shifts table
  - Has employee_id, location_id, start_time, end_time

- [ ] **App Still Works:**
  - Can still login: https://time-and-attend-v1.vercel.app/auth
  - Can see Company: https://time-and-attend-v1.vercel.app/dashboard/companies
  - Can see Employees: https://time-and-attend-v1.vercel.app/dashboard/employees
  - Can see Locations: https://time-and-attend-v1.vercel.app/dashboard/locations

---

## Testing the Features

### Test 1: Clock In/Out
1. Go to `/mobile/clock-in` (or `/dashboard/time`)
2. Select location: Headquarters
3. Click "Clock In"
4. System should show location confirmation
5. Click "Clock Out" to end shift

### Test 2: Manager Dashboard
1. Go to `/dashboard/manager`
2. Should see real-time employee status
3. Should see clock-in/out times
4. Should see geofence validation

### Test 3: Reports & Analytics
1. Go to `/dashboard/reports`
2. Should see time tracking data
3. Should see hours worked per employee
4. Should see location utilization

---

## Troubleshooting

### "Company not found" when trying to create shifts
- Make sure company_id is correctly set in the shift table
- Verify company exists: `SELECT * FROM public.companies;`

### "Employee not appearing in dropdown"
- Make sure employee.company_id matches the selected company
- Check that employee record has all required fields

### Geofence not working
- Verify location has valid latitude/longitude (between -90/90 and -180/180)
- Test with coordinates from the Quick Locations list above
- Check geofence radius is > 0

### Can't create time logs
- Make sure shift exists and has start_time < end_time
- Verify employee_id exists
- Check location_id is valid

---

## Sample Data Quick Reference

| Field | Value |
|-------|-------|
| **User Email** | schoi@proliantservices.com |
| **User Password** | ProliantSecure2026! |
| **Company** | Proliant Security |
| **Location** | Headquarters (San Francisco) |
| **Latitude** | 37.7749 |
| **Longitude** | -122.4194 |
| **Geofence Radius** | 50 meters |
| **Employee 1** | John Smith (Guard) |
| **Employee 2** | Maria Garcia (Guard) |
| **Employee 3** | Michael Chen (Supervisor) |

---

**Status:** ✅ Ready to Setup Test Data  
**Next Step:** Follow the steps above and verify all data is created correctly  
**Timeline:** 5-10 minutes to complete
