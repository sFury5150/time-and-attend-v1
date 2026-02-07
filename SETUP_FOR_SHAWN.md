# Supabase Setup Instructions for Shawn

## Quick Start - Database Schema Setup

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: `https://app.supabase.com/`
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New Query**

### Step 2: Run the Schema

1. Open the file: `schema.sql` (in this project)
2. Copy the entire SQL content
3. Paste into the Supabase SQL Editor
4. Click **Run** (or Cmd+Enter)

**Expected Result**: No errors, all tables created

### Step 3: Verify Tables Were Created

In Supabase, go to **Table Editor** and verify these tables exist:

- ✅ companies
- ✅ employees
- ✅ locations
- ✅ geofence_zones
- ✅ shifts
- ✅ time_entries
- ✅ time_tracking_analytics

### Step 4: Verify RLS Is Enabled

1. Click on each table in Table Editor
2. Click **Auth** tab
3. Verify **RLS is enabled** (blue toggle)

All tables should have RLS enabled automatically by the schema script.

### Step 5: Test a Query

Run this in SQL Editor to verify basic setup:

```sql
-- Test: Insert a company
insert into public.companies (name, owner_id, email)
values (
  'Test Company',
  'test-user-id-here', 
  'contact@test.com'
);

-- Test: Query companies
select * from public.companies;
```

If this works, the schema is set up correctly.

## What the Schema Creates

### Tables (7 total)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| companies | Workspace containers | id, name, owner_id, email, phone |
| employees | Guards/supervisors | id, company_id, name, email, role |
| locations | Work sites with geofence | id, company_id, name, latitude, longitude, radius_meters |
| geofence_zones | Geofence circles | id, location_id, latitude, longitude, radius_meters |
| shifts | Scheduled work periods | id, company_id, employee_id, location_id, start_time, end_time |
| time_entries | Clock in/out records | id, employee_id, shift_id, clock_in_time, clock_out_time |
| time_tracking_analytics | Weekly aggregates | id, employee_id, week_of, total_hours, overtime |

### Indexes (11 total)

For performance on large datasets. Automatically created by schema.

### RLS Policies

Automatically enables Row-Level Security so:
- Users only see their own company data
- Employees can't access other companies
- Only owners can create/delete companies

### Helper Functions

1. **haversine_distance()** - Calculate distance between GPS coordinates
2. **is_within_geofence()** - Check if point is within geofence
3. **calculate_total_hours()** - Calculate work hours minus breaks
4. **get_week_of()** - Get week start date

## Important Notes

### ⚠️ First Time Only

**Do NOT** uncomment the DROP TABLE statements at the top of schema.sql. They're there for development resets only.

### 🔐 Row-Level Security (RLS)

All tables have RLS policies. This means:
- Unauthenticated users can't access any data
- Users only see data they own or are associated with
- The app enforces all access control via RLS

### 📍 Geofencing

- Each location has a `radius_meters` (default 50m)
- Multiple geofence zones can exist per location
- Distance calculated using Haversine formula (accurate for Earth coordinates)

### 🔄 Real-Time Subscriptions

Supabase will automatically push updates when:
- Shifts are created/modified
- Employees clock in/out
- Analytics are calculated

Make sure **Realtime** is enabled in your project settings.

## Troubleshooting

### Error: "Permission denied for schema public"

Make sure you're logged in with admin access in Supabase, not limited API credentials.

### Error: "Function already exists"

If running schema.sql twice, comment out or drop the existing functions first:

```sql
drop function if exists public.haversine_distance cascade;
drop function if exists public.is_within_geofence cascade;
drop function if exists public.calculate_total_hours cascade;
drop function if exists public.get_week_of cascade;
```

Then run schema.sql again.

### Error: "RLS not being applied"

Verify in table editor:
1. Click table
2. Click **Auth** tab
3. Toggle **RLS** to ON
4. Verify policies are listed

### Tables created but data not visible

This is normal - RLS policies restrict data visibility:
- You need to be logged in as a user
- User must be either:
  - Company owner (to see that company's data)
  - Employee in that company (to see company data)

Test with your app's auth system to see actual data.

## Production Considerations

### ✅ Before Going Live

1. **Backup**: Take a snapshot of your Supabase database
2. **Test RLS**: Verify policies work with real users
3. **Monitor**: Set up query performance monitoring
4. **Logs**: Enable query/request logging
5. **Backups**: Enable automated backups (Supabase Pro plan)

### 🔑 API Key Security

- **Anon Key**: Public, use in frontend (RLS enforced)
- **Service Role Key**: Secret, use in backend only
- Never commit API keys to git - use .env files

### 📊 Performance Tips

Once you have real data:
- Monitor slow queries in Supabase Dashboard
- The schema includes indexes - should be good for 10k+ users
- For very large datasets, consider partitioning time_entries table

## Support

If issues occur:

1. **Check Supabase status**: https://status.supabase.com
2. **Review SQL Editor output**: Look for actual error messages
3. **Test authentication**: Verify users can auth before testing data access
4. **Check RLS policies**: Make sure they match your auth user structure

## Next Steps

Once schema is set up:

1. ✅ Provide frontend dev with:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   
2. ✅ Frontend dev will:
   - Update .env.local
   - npm install
   - npm run dev
   - Test complete flow

3. ✅ Create test users in Authentication tab

That's it! The app will handle everything else via the hooks.
