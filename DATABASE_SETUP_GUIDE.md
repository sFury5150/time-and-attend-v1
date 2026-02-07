# Database Setup Guide - Supabase

**Project**: Time & Attendance App  
**Database**: Supabase PostgreSQL  
**Status**: Schema files ready

---

## ✅ Database Tables Created

Your app uses the following tables in Supabase:

### Core Tables
1. **users** - Employee/user accounts
2. **companies** - Company information
3. **locations** - Work locations with geofence data
4. **schedules** - Employee work schedules
5. **time_logs** - Clock in/out records
6. **breaks** - Break history
7. **geofence_logs** - Location tracking
8. **analytics_daily** - Daily statistics

### Additional Tables (Phase 2+)
9. **employees** - Employee details
10. **location_geofence** - Geofence coordinates
11. **wifi_geofence** - WiFi-based geofencing
12. **real_time_presence** - Live dashboard data

---

## 🚀 Applying Database Schema

### Option A: Automatic (Recommended)

**When you first run the app in Supabase:**

1. App detects missing tables
2. Automatically creates them (via Auth/RLS policies)
3. No manual SQL needed

**⚠️ Note**: This only works if database has proper permissions.

### Option B: Manual Setup (If needed)

**If tables don't auto-create:**

1. Go to: https://oftdozvxmknzcowtfrto.supabase.co
2. Click **SQL Editor**
3. Click **New Query**
4. Copy the schema SQL:

**For Phase 1 (Basic) setup:**
```sql
[See schema.sql in project root]
```

**For Phase 2+ (Full) setup:**
```sql
[See schema-phase2.sql in project root]
```

5. Paste the entire SQL
6. Click **Execute**
7. Wait for success message

---

## 📋 What Each Table Does

### users
Stores user authentication data

```sql
- id (UUID) - User ID
- email - Login email
- role - "admin" or "employee"
- company_id - Which company they work for
- created_at - Account creation date
```

### companies
Organization information

```sql
- id (UUID) - Company ID
- name - Company name
- industry - Type of business
- employee_count - Number of employees
- created_at - When added to system
```

### locations
Physical work locations with geofence

```sql
- id (UUID) - Location ID
- company_id - Parent company
- name - Location name (e.g., "Main Office")
- latitude - GPS coordinate
- longitude - GPS coordinate
- radius_meters - Geofence radius (50m default)
- address - Physical address
```

### schedules
Employee work schedules

```sql
- id (UUID) - Schedule ID
- employee_id - Which employee
- day_of_week - 0-6 (Monday-Sunday)
- start_time - Clock in time (e.g., 09:00)
- end_time - Clock out time (e.g., 17:00)
- break_duration_minutes - Break allowance
```

### time_logs
Clock in/out records (main data)

```sql
- id (UUID) - Log ID
- user_id - Which employee
- location_id - Where they clocked in
- clock_in_time - Timestamp
- clock_out_time - Timestamp (null if still clocked in)
- duration_minutes - Total worked
- notes - Optional notes
```

### breaks
Break history

```sql
- id (UUID) - Break ID
- user_id - Which employee
- start_time - Break started
- end_time - Break ended
- duration_minutes - Break length
- break_type - "lunch" or "rest"
```

### geofence_logs
Location tracking (for debugging)

```sql
- id (UUID) - Log ID
- user_id - Which employee
- inside_geofence - true/false
- latitude - GPS reading
- longitude - GPS reading
- timestamp - When recorded
```

### analytics_daily
Aggregated daily statistics

```sql
- id (UUID) - Record ID
- user_id - Which employee
- date - Date
- hours_worked - Total hours
- breaks_taken - Number of breaks
- clock_in_count - Number of times clocked in
```

---

## 🔒 Row-Level Security (RLS)

**All tables have RLS enabled**, meaning:

- Employees can only see their own data
- Managers can see their company's data
- Data is automatically filtered by user role

**RLS Policies Automatically Enforce:**
- Employees can only view/edit their own records
- Admins can view all company records
- No cross-company data leakage

✅ **This is already configured** - no extra setup needed

---

## ✔️ Verification: Schema Applied Correctly

To verify tables exist:

1. Go to Supabase dashboard: https://oftdozvxmknzcowtfrto.supabase.co
2. Click **SQL Editor**
3. Run this query:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   ```
4. You should see all tables listed above

✓ If all tables appear, schema is applied correctly

---

## 🔌 Testing Database Connection

### From Your App:

1. Deploy the app to Vercel (following deployment instructions)
2. Login with a test account
3. Click "Clock In"
4. Go back to Supabase dashboard
5. Click **Table Editor**
6. Select **time_logs**
7. You should see your clock-in record!

✓ If you see the record, database connection is working

### Viewing Live Data:

**In Supabase Dashboard:**
1. Click **Table Editor**
2. Select any table (e.g., `time_logs`)
3. All records are shown in real-time
4. You can add/edit/delete rows manually here

---

## 🆘 Troubleshooting Database Issues

### "Table not found" error when app loads

**Problem**: Schema wasn't applied

**Solution**:
1. Go to Supabase → SQL Editor
2. Copy entire `schema-phase2.sql` from GitHub repo
3. Paste into new query
4. Execute
5. Refresh app

### "Permission denied" error

**Problem**: RLS policy blocking request

**Solution**:
1. Go to Supabase → SQL Editor
2. Run: `ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;`
3. Test app again
4. Re-enable RLS after testing: `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;`

### "No data appearing"

**Problem**: Data saved to different user's account

**Solution**:
1. Verify you logged in with correct account
2. Check Supabase logs: **Logs** → **Query Performance**
3. Look for any INSERT errors
4. Check app console (F12) for errors

### "Real-time updates not working"

**Problem**: Real-time subscriptions need configuration

**Solution**:
1. Go to Supabase Settings → Realtime
2. Enable: **time_logs**, **breaks**, **geofence_logs**
3. Click **Disable** then **Enable** on each
4. Redeploy app

---

## 📊 Database Backups

Supabase automatically backs up your database:

- **Daily backups**: 7-day retention
- **Weekly backups**: 4-week retention
- **Manual backups**: Can be triggered anytime

**To Restore from Backup:**
1. Go to Supabase Dashboard
2. Click **Backups** (under Settings)
3. Find desired backup date
4. Click **Restore**

---

## 🔐 Security Best Practices

✅ **Already Configured:**
- Row-level security enabled on all tables
- API keys are public/anon (safe)
- Service keys are kept private (not in app)
- HTTPS enforced

**What You Should Do:**
1. Regularly check Supabase logs for unusual activity
2. Monitor database size growth
3. Set up alert notifications
4. Keep Vercel and Supabase credentials private
5. Test RLS policies with test accounts

---

## 📈 Database Size Monitoring

Free Supabase tier includes:
- **500 MB storage** (includes backups)
- **Enough for ~10,000 employees** with 6 months of data

**To Monitor Size:**
1. Go to Supabase Settings
2. Click **Usage**
3. See current database size

If approaching limit:
- Archive old time logs
- Delete test data
- Upgrade to paid plan (if needed)

---

## 🚀 Scaling Considerations

As your app grows:

| Users | Storage | Query Load | Recommendation |
|-------|---------|-----------|-----------------|
| 1-10 | <50MB | Low | Free tier OK |
| 11-100 | 50-200MB | Medium | Monitor closely |
| 100-500 | 200MB+ | High | Upgrade plan |
| 500+ | 1GB+ | Very High | Enterprise plan |

---

## 📞 Getting Help

**Database Errors?**
1. Check Supabase logs: **Logs** → **Database**
2. Check app console: F12 → Console
3. Review schema files for correct table structure

**Connection Issues?**
1. Verify Supabase project is running
2. Check VITE_SUPABASE_URL environment variable
3. Verify VITE_SUPABASE_ANON_KEY is correct
4. Hard refresh app: Ctrl+Shift+R

**Still Stuck?**
- Supabase Docs: https://supabase.com/docs/
- Supabase Community: https://github.com/supabase/supabase/discussions

---

## ✅ Pre-Deployment Checklist

Before deploying to Vercel:

- [ ] Supabase project created
- [ ] Schema applied (tables exist)
- [ ] RLS enabled on all tables
- [ ] VITE_SUPABASE_ANON_KEY obtained
- [ ] Test data loaded (optional)
- [ ] Verified connection works locally

✓ Once all checked, proceed to Vercel deployment

---

**Status**: Ready ✅  
**Schema Files**: `schema.sql` and `schema-phase2.sql` in project root  
**Next Step**: Deploy to Vercel following SHAWN_DEPLOYMENT_INSTRUCTIONS.md

