-- Time & Attendance App - Phase 1 Schema
-- For security guard workforce management
-- Created: 2026-02-06

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. DROP EXISTING TABLES (if needed - comment out after first run)
-- ============================================================================
-- drop table if exists time_tracking_analytics cascade;
-- drop table if exists time_entries cascade;
-- drop table if exists shifts cascade;
-- drop table if exists geofence_zones cascade;
-- drop table if exists locations cascade;
-- drop table if exists employees cascade;
-- drop table if exists companies cascade;

-- ============================================================================
-- 3. COMPANIES TABLE
-- ============================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text,
  phone text,
  address text,
  website text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(name)
);

-- ============================================================================
-- 4. EMPLOYEES TABLE
-- ============================================================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'guard', -- guard, supervisor, manager
  hire_date date not null,
  status text not null default 'active', -- active, inactive, terminated
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint employees_company_email unique(company_id, email)
);

-- ============================================================================
-- 5. LOCATIONS TABLE
-- ============================================================================
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address text,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  radius_meters numeric(10, 2) not null default 50.0, -- default geofence radius
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint locations_company_name unique(company_id, name)
);

-- ============================================================================
-- 6. GEOFENCE_ZONES TABLE
-- ============================================================================
create table if not exists public.geofence_zones (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  radius_meters numeric(10, 2) not null default 50.0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 7. SHIFTS TABLE
-- ============================================================================
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'scheduled', -- scheduled, in_progress, completed, cancelled
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 8. TIME_ENTRIES TABLE
-- ============================================================================
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  clock_in_time timestamp with time zone not null,
  clock_in_lat numeric(10, 8),
  clock_in_lng numeric(11, 8),
  clock_out_time timestamp with time zone,
  clock_out_lat numeric(10, 8),
  clock_out_lng numeric(11, 8),
  status text not null default 'active', -- active, clocked_out
  geofence_validated boolean default false,
  geofence_error text,
  total_hours numeric(5, 2),
  break_minutes numeric(5, 2) default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 9. TIME_TRACKING_ANALYTICS TABLE
-- ============================================================================
create table if not exists public.time_tracking_analytics (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  week_of date not null,
  total_hours numeric(5, 2) not null default 0,
  overtime numeric(5, 2) not null default 0,
  attendance_percentage numeric(5, 2) not null default 0,
  days_worked numeric(3, 0) not null default 0,
  on_time_count numeric(3, 0) not null default 0,
  late_count numeric(3, 0) not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint analytics_unique unique(employee_id, week_of)
);

-- ============================================================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
create index idx_employees_company_id on public.employees(company_id);
create index idx_employees_user_id on public.employees(user_id);
create index idx_locations_company_id on public.locations(company_id);
create index idx_geofence_zones_location_id on public.geofence_zones(location_id);
create index idx_shifts_company_id on public.shifts(company_id);
create index idx_shifts_employee_id on public.shifts(employee_id);
create index idx_shifts_location_id on public.shifts(location_id);
create index idx_time_entries_employee_id on public.time_entries(employee_id);
create index idx_time_entries_shift_id on public.time_entries(shift_id);
create index idx_time_entries_clock_in on public.time_entries(clock_in_time);
create index idx_analytics_employee_week on public.time_tracking_analytics(employee_id, week_of);
create index idx_analytics_company_week on public.time_tracking_analytics(company_id, week_of);

-- ============================================================================
-- 11. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.companies enable row level security;
alter table public.employees enable row level security;
alter table public.locations enable row level security;
alter table public.geofence_zones enable row level security;
alter table public.shifts enable row level security;
alter table public.time_entries enable row level security;
alter table public.time_tracking_analytics enable row level security;

-- COMPANIES: Users can only see companies they own or are employed in
create policy "companies_select_own_or_employed"
  on public.companies
  for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.employees
      where employees.company_id = companies.id
      and employees.user_id = auth.uid()
    )
  );

create policy "companies_insert_self_owned"
  on public.companies
  for insert
  with check (auth.uid() = owner_id);

create policy "companies_update_self_owned"
  on public.companies
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "companies_delete_self_owned"
  on public.companies
  for delete
  using (auth.uid() = owner_id);

-- EMPLOYEES: Users can see employees in their company
create policy "employees_select_own_company"
  on public.employees
  for select
  using (
    exists (
      select 1 from public.companies
      where companies.id = employees.company_id
      and (
        companies.owner_id = auth.uid()
        or employees.company_id in (
          select company_id from public.employees
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "employees_insert_own_company"
  on public.employees
  for insert
  with check (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "employees_update_own_company"
  on public.employees
  for update
  using (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "employees_delete_own_company"
  on public.employees
  for delete
  using (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

-- LOCATIONS: Users can see locations in their company
create policy "locations_select_own_company"
  on public.locations
  for select
  using (
    exists (
      select 1 from public.companies
      where companies.id = locations.company_id
      and (
        companies.owner_id = auth.uid()
        or locations.company_id in (
          select company_id from public.employees
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "locations_insert_own_company"
  on public.locations
  for insert
  with check (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "locations_update_own_company"
  on public.locations
  for update
  using (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

-- GEOFENCE_ZONES: Users can see zones for locations in their company
create policy "geofence_zones_select_own_company"
  on public.geofence_zones
  for select
  using (
    exists (
      select 1 from public.locations
      inner join public.companies on companies.id = locations.company_id
      where locations.id = location_id
      and (
        companies.owner_id = auth.uid()
        or locations.company_id in (
          select company_id from public.employees
          where user_id = auth.uid()
        )
      )
    )
  );

-- SHIFTS: Users can see shifts in their company
create policy "shifts_select_own_company"
  on public.shifts
  for select
  using (
    exists (
      select 1 from public.companies
      where companies.id = shifts.company_id
      and (
        companies.owner_id = auth.uid()
        or shifts.company_id in (
          select company_id from public.employees
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "shifts_insert_own_company"
  on public.shifts
  for insert
  with check (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
  );

-- TIME_ENTRIES: Users can see their own time entries
create policy "time_entries_select_own"
  on public.time_entries
  for select
  using (
    exists (
      select 1 from public.employees
      where employees.id = time_entries.employee_id
      and (
        employees.user_id = auth.uid()
        or exists (
          select 1 from public.companies
          where companies.id = employees.company_id
          and companies.owner_id = auth.uid()
        )
      )
    )
  );

create policy "time_entries_insert_own"
  on public.time_entries
  for insert
  with check (
    exists (
      select 1 from public.employees
      where employees.id = employee_id
      and employees.user_id = auth.uid()
    )
  );

create policy "time_entries_update_own"
  on public.time_entries
  for update
  using (
    exists (
      select 1 from public.employees
      where employees.id = employee_id
      and employees.user_id = auth.uid()
    )
  );

-- TIME_TRACKING_ANALYTICS: Users can see analytics for their company/employees
create policy "analytics_select_own"
  on public.time_tracking_analytics
  for select
  using (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.employees
      where employees.id = employee_id
      and employees.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 12. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate distance between two points (Haversine formula)
create or replace function public.haversine_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
) returns numeric as $$
declare
  R numeric := 6371000; -- Earth radius in meters
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
begin
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  return R * c;
end;
$$ language plpgsql immutable;

-- Function to check if point is within geofence
create or replace function public.is_within_geofence(
  user_lat numeric,
  user_lon numeric,
  fence_lat numeric,
  fence_lon numeric,
  radius_meters numeric
) returns boolean as $$
declare
  distance numeric;
begin
  distance := public.haversine_distance(user_lat, user_lon, fence_lat, fence_lon);
  return distance <= radius_meters;
end;
$$ language plpgsql immutable;

-- Function to calculate total hours worked
create or replace function public.calculate_total_hours(
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  break_minutes numeric
) returns numeric as $$
declare
  total_minutes numeric;
  total_hours numeric;
begin
  if clock_out is null then
    return null;
  end if;
  
  total_minutes := extract(epoch from (clock_out - clock_in)) / 60;
  total_hours := (total_minutes - coalesce(break_minutes, 0)) / 60;
  return round(total_hours::numeric, 2);
end;
$$ language plpgsql immutable;

-- Function to get week start date
create or replace function public.get_week_of(date_value timestamp with time zone)
returns date as $$
begin
  return date_trunc('week', date_value)::date;
end;
$$ language plpgsql immutable;

-- ============================================================================
-- 13. GRANT PERMISSIONS
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- ============================================================================
-- 14. SEED DATA (OPTIONAL - comment out if not needed)
-- ============================================================================

-- Uncomment after schema is created and you have a valid user ID to test with
-- insert into public.companies (name, owner_id, email, phone)
-- values ('Test Security Company', 'YOUR_USER_ID_HERE', 'contact@test.com', '555-0000');
