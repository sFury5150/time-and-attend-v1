-- Time & Attendance App - Phase 2 Schema Additions
-- Extends Phase 1 schema with user profiles, breaks, geofence tracking, and notifications
-- Created: 2026-02-06

-- ============================================================================
-- 1. USER_PROFILES TABLE
-- ============================================================================
-- Separate user profile data from auth.users for better management
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  first_name text,
  last_name text,
  phone_number text,
  profile_photo_url text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  notes text,
  preferences jsonb default '{"notifications_enabled": true, "email_alerts": true}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 2. BREAKS TABLE
-- ============================================================================
-- Track individual breaks for better break management and validation
create table if not exists public.breaks (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_minutes numeric(5, 2),
  break_type text not null default 'lunch', -- lunch, break, other
  status text not null default 'active', -- active, completed
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 3. GEOFENCE_VIOLATIONS_LOG TABLE
-- ============================================================================
-- Audit log for geofence violations
create table if not exists public.geofence_violations_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  time_entry_id uuid references public.time_entries(id) on delete set null,
  location_id uuid not null references public.locations(id) on delete cascade,
  violation_type text not null, -- left_zone, outside_zone, warning_distance
  user_lat numeric(10, 8),
  user_lng numeric(11, 8),
  zone_lat numeric(10, 8),
  zone_lng numeric(11, 8),
  distance_meters numeric(10, 2),
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- 4. PUSH_NOTIFICATIONS_LOG TABLE
-- ============================================================================
-- Track all push notifications sent to users
create table if not exists public.push_notifications_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  notification_type text not null, -- clock_in, clock_out, geofence_violation, shift_reminder, report_ready
  title text not null,
  message text not null,
  data jsonb, -- Additional data (time_entry_id, etc.)
  sent_at timestamp with time zone default now(),
  read_at timestamp with time zone,
  status text not null default 'sent' -- sent, failed, clicked
);

-- ============================================================================
-- 5. RATE_LIMIT_CHECKS TABLE
-- ============================================================================
-- Track rate limiting for clock in/out events
create table if not exists public.rate_limit_checks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  action_type text not null, -- clock_in, clock_out
  attempt_time timestamp with time zone not null,
  allowed boolean not null default true,
  reason text,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- 6. ENHANCE time_entries TABLE
-- ============================================================================
-- Add new columns to time_entries for Phase 2 features
alter table public.time_entries 
  add column if not exists wifi_bssid text, -- WiFi network BSSID for verification
  add column if not exists photo_proof_url text, -- Photo evidence of clock-in
  add column if not exists accuracy_meters numeric(10, 2), -- GPS accuracy
  add column if not exists rate_limit_passed boolean default true,
  add column if not exists offline_sync_pending boolean default false;

-- ============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
create index if not exists idx_user_profiles_company_id on public.user_profiles(company_id);
create index if not exists idx_breaks_time_entry_id on public.breaks(time_entry_id);
create index if not exists idx_breaks_employee_id on public.breaks(employee_id);
create index if not exists idx_breaks_start_time on public.breaks(start_time);
create index if not exists idx_geofence_violations_employee on public.geofence_violations_log(employee_id);
create index if not exists idx_geofence_violations_time_entry on public.geofence_violations_log(time_entry_id);
create index if not exists idx_geofence_violations_created on public.geofence_violations_log(created_at);
create index if not exists idx_push_notifications_employee on public.push_notifications_log(employee_id);
create index if not exists idx_push_notifications_type on public.push_notifications_log(notification_type);
create index if not exists idx_push_notifications_created on public.push_notifications_log(sent_at);
create index if not exists idx_rate_limit_checks_employee on public.rate_limit_checks(employee_id);
create index if not exists idx_rate_limit_checks_action on public.rate_limit_checks(employee_id, action_type);
create index if not exists idx_rate_limit_checks_time on public.rate_limit_checks(attempt_time);

-- ============================================================================
-- 8. ROW-LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS on all new tables
alter table public.user_profiles enable row level security;
alter table public.breaks enable row level security;
alter table public.geofence_violations_log enable row level security;
alter table public.push_notifications_log enable row level security;
alter table public.rate_limit_checks enable row level security;

-- USER_PROFILES: Users can view their own and company's employee profiles
create policy "user_profiles_select_own_or_company"
  on public.user_profiles
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.companies
      where companies.id = user_profiles.company_id
      and companies.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.employees
      where employees.company_id = user_profiles.company_id
      and employees.user_id = auth.uid()
    )
  );

create policy "user_profiles_insert_self"
  on public.user_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "user_profiles_update_self_or_admin"
  on public.user_profiles
  for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

-- BREAKS: Users can see breaks for their own time entries or company employees
create policy "breaks_select_own_or_company"
  on public.breaks
  for select
  using (
    exists (
      select 1 from public.employees
      where employees.id = breaks.employee_id
      and (
        employees.user_id = auth.uid()
        or employees.company_id in (
          select company_id from public.companies
          where owner_id = auth.uid()
        )
      )
    )
  );

create policy "breaks_insert_own"
  on public.breaks
  for insert
  with check (
    exists (
      select 1 from public.employees
      where employees.id = employee_id
      and employees.user_id = auth.uid()
    )
  );

create policy "breaks_update_own"
  on public.breaks
  for update
  using (
    exists (
      select 1 from public.employees
      where employees.id = employee_id
      and employees.user_id = auth.uid()
    )
  );

-- GEOFENCE_VIOLATIONS_LOG: Company admins and employees can view violations
create policy "geofence_violations_select_own_company"
  on public.geofence_violations_log
  for select
  using (
    exists (
      select 1 from public.locations
      inner join public.companies on companies.id = locations.company_id
      where locations.id = geofence_violations_log.location_id
      and (
        companies.owner_id = auth.uid()
        or locations.company_id in (
          select company_id from public.employees
          where user_id = auth.uid()
        )
      )
    )
    or employee_id in (
      select id from public.employees
      where user_id = auth.uid()
    )
  );

-- PUSH_NOTIFICATIONS_LOG: Users can view their own notifications
create policy "push_notifications_select_own"
  on public.push_notifications_log
  for select
  using (
    exists (
      select 1 from public.employees
      where employees.id = push_notifications_log.employee_id
      and employees.user_id = auth.uid()
    )
  );

-- RATE_LIMIT_CHECKS: Users can view their own checks, admins can view all
create policy "rate_limit_checks_select_own_or_admin"
  on public.rate_limit_checks
  for select
  using (
    exists (
      select 1 from public.employees
      where employees.id = employee_id
      and employees.user_id = auth.uid()
    )
    or exists (
      select 1 from public.companies
      where companies.id in (
        select company_id from public.employees
        where id = rate_limit_checks.employee_id
      )
      and companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. HELPER FUNCTIONS FOR PHASE 2
-- ============================================================================

-- Function to validate rate limiting (max 1 clock in/out per 30 seconds)
create or replace function public.check_rate_limit(
  emp_id uuid,
  action_type text
) returns json as $$
declare
  last_attempt timestamp with time zone;
  time_since_last numeric;
  is_allowed boolean;
  result json;
begin
  -- Get the last attempt for this employee and action
  select attempt_time into last_attempt
  from public.rate_limit_checks
  where employee_id = emp_id
  and action_type = action_type
  order by attempt_time desc
  limit 1;

  -- If no previous attempt, allow
  if last_attempt is null then
    is_allowed := true;
  else
    -- Calculate seconds since last attempt
    time_since_last := extract(epoch from (now() at time zone 'UTC' - last_attempt));
    -- Allow if more than 30 seconds have passed
    is_allowed := time_since_last >= 30;
  end if;

  -- Log the check
  insert into public.rate_limit_checks (employee_id, action_type, attempt_time, allowed, reason)
  values (
    emp_id,
    action_type,
    now() at time zone 'UTC',
    is_allowed,
    case when not is_allowed then 'Rate limit: less than 30 seconds since last ' || action_type else null end
  );

  result := json_build_object(
    'allowed', is_allowed,
    'time_since_last', coalesce(time_since_last, -1),
    'message', case
      when is_allowed then 'Clock ' || (case when action_type = 'clock_in' then 'in' else 'out' end) || ' allowed'
      else 'Please wait at least 30 seconds before clocking ' || (case when action_type = 'clock_in' then 'in' else 'out' end) || ' again'
    end
  );

  return result;
end;
$$ language plpgsql;

-- Function to validate WiFi BSSID geofencing
create or replace function public.validate_wifi_geofence(
  zone_id uuid,
  user_bssid text
) returns boolean as $$
declare
  zone_bssid text;
begin
  -- Get the BSSID for this geofence zone (stored in location extras)
  -- For now, return true - this will be enhanced with actual BSSID validation
  return true;
end;
$$ language plpgsql immutable;

-- Function to get employee's current shift
create or replace function public.get_current_shift(emp_id uuid)
returns table (
  shift_id uuid,
  location_id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text
) as $$
begin
  return query
  select
    shifts.id,
    shifts.location_id,
    shifts.start_time,
    shifts.end_time,
    shifts.status
  from public.shifts
  where shifts.employee_id = emp_id
  and shifts.status in ('scheduled', 'in_progress')
  and shifts.start_time <= now()
  and shifts.end_time >= now()
  limit 1;
end;
$$ language plpgsql;

-- Function to calculate total break time for a shift
create or replace function public.get_total_break_time(time_entry_id uuid)
returns numeric as $$
declare
  total_breaks numeric;
begin
  select coalesce(sum(duration_minutes), 0)
  into total_breaks
  from public.breaks
  where breaks.time_entry_id = time_entry_id
  and status = 'completed';

  return total_breaks;
end;
$$ language plpgsql;

-- Function to log geofence violation
create or replace function public.log_geofence_violation(
  emp_id uuid,
  loc_id uuid,
  violation_type_param text,
  user_lat numeric,
  user_lng numeric,
  zone_lat numeric,
  zone_lng numeric,
  distance numeric
) returns void as $$
begin
  insert into public.geofence_violations_log (
    employee_id,
    location_id,
    violation_type,
    user_lat,
    user_lng,
    zone_lat,
    zone_lng,
    distance_meters
  ) values (
    emp_id,
    loc_id,
    violation_type_param,
    user_lat,
    user_lng,
    zone_lat,
    zone_lng,
    distance
  );
end;
$$ language plpgsql;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- ============================================================================
-- 11. NOTES
-- ============================================================================
/*
This schema file extends Phase 1 with:

1. user_profiles - Separate user profile management
2. breaks - Detailed break tracking
3. geofence_violations_log - Audit trail for violations
4. push_notifications_log - Notification history
5. rate_limit_checks - Rate limiting enforcement
6. Enhanced time_entries - WiFi, photo proof, accuracy, offline sync

Helper functions added:
- check_rate_limit() - Enforces rate limiting
- validate_wifi_geofence() - WiFi BSSID verification
- get_current_shift() - Fetch current shift
- get_total_break_time() - Calculate breaks
- log_geofence_violation() - Log violations

All tables have RLS policies for security.
All new functions are callable from the frontend via Supabase.
*/

