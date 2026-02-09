# Phase 2 Features Documentation

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Complete

---

## Table of Contents

1. [New Database Schema](#new-database-schema)
2. [Employee Mobile Interface](#employee-mobile-interface)
3. [Manager Dashboard](#manager-dashboard)
4. [Advanced Features](#advanced-features)
5. [PWA Configuration](#pwa-configuration)
6. [API Reference](#api-reference)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

---

## New Database Schema

### Overview

Phase 2 adds 5 new tables and extends existing ones to support advanced features:

- `user_profiles` - Separate user profile management
- `breaks` - Detailed break tracking
- `geofence_violations_log` - Geofence violation audit trail
- `push_notifications_log` - Push notification history
- `rate_limit_checks` - Rate limiting enforcement

### New Tables

#### user_profiles

Stores detailed user profile information separate from Supabase auth.users.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE (references auth.users),
  company_id UUID (references companies),
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  profile_photo_url TEXT,
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  notes TEXT,
  preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Usage**: Manage comprehensive employee profiles with emergency contact info and preferences.

#### breaks

Tracks individual breaks during shifts for accurate break management.

```sql
CREATE TABLE breaks (
  id UUID PRIMARY KEY,
  time_entry_id UUID (references time_entries),
  employee_id UUID (references employees),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes NUMERIC,
  break_type TEXT ('lunch', 'break', 'other'),
  status TEXT ('active', 'completed'),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Usage**: Log and track breaks. Calculate total break time automatically.

#### geofence_violations_log

Audit trail of all geofence violations for compliance and monitoring.

```sql
CREATE TABLE geofence_violations_log (
  id UUID PRIMARY KEY,
  employee_id UUID (references employees),
  time_entry_id UUID (references time_entries),
  location_id UUID (references locations),
  violation_type TEXT ('left_zone', 'outside_zone', 'warning_distance'),
  user_lat NUMERIC,
  user_lng NUMERIC,
  zone_lat NUMERIC,
  zone_lng NUMERIC,
  distance_meters NUMERIC,
  created_at TIMESTAMP
);
```

**Usage**: Track where and when employees left geofence zones for audit purposes.

#### push_notifications_log

History of all push notifications sent to employees.

```sql
CREATE TABLE push_notifications_log (
  id UUID PRIMARY KEY,
  employee_id UUID (references employees),
  notification_type TEXT ('clock_in', 'clock_out', 'geofence_violation', 'shift_reminder', 'report_ready'),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  status TEXT ('sent', 'failed', 'clicked'),
  created_at TIMESTAMP
);
```

**Usage**: Audit trail of notifications and employee engagement tracking.

#### rate_limit_checks

Tracks rate limiting checks for clock in/out actions.

```sql
CREATE TABLE rate_limit_checks (
  id UUID PRIMARY KEY,
  employee_id UUID (references employees),
  action_type TEXT ('clock_in', 'clock_out'),
  attempt_time TIMESTAMP NOT NULL,
  allowed BOOLEAN,
  reason TEXT,
  created_at TIMESTAMP
);
```

**Usage**: Prevent duplicate clock in/out events within 30-second window.

### Enhanced Columns on Existing Tables

#### time_entries (extensions)

```sql
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS
  wifi_bssid TEXT,                    -- WiFi network BSSID
  photo_proof_url TEXT,               -- Photo evidence
  accuracy_meters NUMERIC,            -- GPS accuracy
  rate_limit_passed BOOLEAN,          -- Rate limit validation
  offline_sync_pending BOOLEAN;       -- Offline sync flag
```

---

## Employee Mobile Interface

### Overview

The Employee Mobile App provides a mobile-first interface for security guards to:
- Clock in/out with geofence validation
- View current location and geofence status
- Manage breaks
- Check daily schedule
- Receive notifications

### Route

**URL**: `/mobile`

### Features

#### 1. Clock In/Out Button

Large, obvious button for clock actions:

```typescript
<Button 
  size="lg"
  onClick={() => (isClockingIn ? clockOut() : clockIn(gpsLocation))}
  disabled={!isInZone}
  className="w-full py-8 text-xl font-bold"
>
  {isClockingIn ? "CLOCK OUT" : "CLOCK IN"}
</Button>
```

**Requirements**:
- Must be within geofence zone
- GPS location must be available
- Rate limit must allow action (max 1 per 30 seconds)

#### 2. Current Location Display

Shows GPS coordinates and accuracy:

```typescript
<div>
  <p className="text-lg font-mono">
    {gpsLocation.latitude}, {gpsLocation.longitude}
  </p>
  <p className="text-sm">Accuracy: ±{Math.round(accuracy)}m</p>
</div>
```

**Accuracy Considerations**:
- ±5-10m: Excellent
- ±10-30m: Good
- ±30-100m: Fair
- >100m: Poor

#### 3. Geofence Status Indicator

Visual indicator showing geofence status:

```
IN ZONE ✓ (50m from boundary)
WARNING ⚠ (15m from boundary)
OUT OF ZONE ✗ (150m away)
```

#### 4. Break Timer

Timer for tracking break duration:

```typescript
<div>
  <p className="text-2xl font-bold">{elapsedMinutes}m</p>
  <Button onClick={() => endBreak()}>End Break</Button>
</div>
```

**Features**:
- Start/end break tracking
- Add notes to breaks
- Automatic break type selection (lunch, break, other)

#### 5. Quick Shift Info

Display current shift information:

```typescript
<div>
  <p>Shift: 8:00 AM - 5:00 PM</p>
  <p>Location: Main Office</p>
  <p>Time Remaining: 4h 30m</p>
</div>
```

#### 6. Today's Schedule Summary

Quick overview of today's shifts and schedule.

### Mobile Optimization

The app is optimized for mobile devices:

- **Responsive Design**: Works on all screen sizes (320px - 2560px)
- **Touch-Friendly**: Buttons and inputs are 48px+ for easy tapping
- **Fast Loading**: Service worker caching for offline support
- **Optimized Typography**: Large, readable fonts
- **Dark Mode**: Easy on eyes in bright sunlight

### Code Example: Using the Mobile App

```typescript
import EmployeeMobileApp from './pages/EmployeeMobileApp';

// Route configuration
<Route path="/mobile" element={<EmployeeMobileApp />} />

// Access via: http://localhost:5173/mobile
```

---

## Manager Dashboard

### Overview

The Manager Dashboard provides real-time monitoring of employee status, attendance, and geofence violations.

### Route

**URL**: `/dashboard/manager`

### Key Metrics

**Displayed on dashboard**:
- On Duty Count: Employees currently clocked in
- Clocked Out Count: Employees not working
- Violation Count: Recent geofence violations
- Total Employees: Total workforce count

### Sections

#### 1. Employee Status Table

Real-time view of all employees:

| Employee | Role | Status | Clock In | Geofence |
|----------|------|--------|----------|----------|
| John Doe | Guard | ON DUTY | 08:00 AM | ✓ In Zone |
| Jane Smith | Supervisor | CLOCKED OUT | 05:30 PM | - |

**Status Indicators**:
- `ON DUTY` (Green): Currently clocked in
- `CLOCKED OUT` (Gray): Not working
- `ON BREAK` (Blue): Taking a break

#### 2. Geofence Violations Log

Recent violations with details:

```
⚠ John Doe violated geofence at 2:45 PM. Distance: 156m
⚠ Jane Smith violated geofence at 2:30 PM. Distance: 89m
```

**Violation Types**:
- `left_zone`: Employee left the geofence zone
- `warning_distance`: Employee is near zone boundary
- `outside_zone`: Employee is outside zone during shift

#### 3. Activity Log

Chronological log of clock in/out events:

| Employee | Action | Time | Details |
|----------|--------|------|---------|
| John Doe | Clock In | 08:00 AM | ✓ Verified |
| Jane Smith | Clock Out | 05:30 PM | ✓ Verified |

**Verification Status**:
- `✓ Verified`: GPS and geofence validated
- `✗ Unverified`: No geofence validation

#### 4. Real-Time Updates

Dashboard updates in real-time:

```typescript
const { data: violations } = useQuery({
  queryKey: ['geofence-violations', companyId],
  refetchInterval: 10000, // Update every 10 seconds
});
```

### Code Example: Accessing Manager Dashboard

```typescript
// Route configuration
<Route path="/dashboard/manager" element={<ManagerDashboard />} />

// Access via: http://localhost:5173/dashboard/manager
```

---

## Advanced Features

### 1. Rate Limiting

**Purpose**: Prevent duplicate clock in/out events

**Implementation**:

```typescript
import { checkRateLimit } from '@/utils/rateLimiter';

// Check before clocking in
const result = await checkRateLimit(employeeId, 'clock_in');

if (result.allowed) {
  // Process clock in
} else {
  // Show error: "Wait {timeRemaining} seconds"
}
```

**Configuration**:
- Max 1 clock in/out per 30 seconds per employee
- Cached in-memory for low latency
- Automatically cleans up expired entries

**Usage**:

```typescript
// Clock in function
const clockIn = async (location?: Location) => {
  const rateLimitCheck = await checkRateLimit(employeeId, 'clock_in');
  
  if (!rateLimitCheck.allowed) {
    showError(`${rateLimitCheck.message}`);
    return;
  }
  
  // Proceed with clock in
};
```

### 2. WiFi BSSID Geofencing

**Purpose**: Optional secondary geofence validation using WiFi networks

**Implementation**:

```typescript
import { verifyWiFiBSSID, hashBSSID } from '@/utils/wifiGeofencing';

// Verify WiFi network matches expected BSSID
const result = await verifyWiFiBSSID(currentNetwork, expectedBSSIDs, strictMode);

if (result.matches) {
  // WiFi verified, proceed
} else {
  // WiFi mismatch, show warning or block
}
```

**Features**:
- Store BSSID hashes for privacy
- Support multiple WiFi networks per location
- Assess WiFi signal quality
- Strict/lenient mode options

**Usage**:

```typescript
// During geofence validation
const validateLocation = async (gpsLocation: Location) => {
  // Check GPS geofence
  const gpsValid = validateGeofence(gpsLocation, zone);
  
  // Check WiFi geofence (optional)
  const wifiValid = await verifyWiFiBSSID(
    currentNetwork,
    zone.expectedBSSIDs,
    zone.strictMode
  );
  
  return gpsValid && (!zone.requireWiFi || wifiValid);
};
```

### 3. Photo Proof on Clock-In

**Purpose**: Capture photo evidence when clocking in

**Implementation**:

```typescript
import { capturePhoto } from '@/utils/photoCapture';

// Capture photo when clocking in
const photo = await capturePhoto();

// Upload to Supabase Storage
const photoUrl = await uploadPhotoProof(photo, employeeId);

// Store URL in time_entries
await updateTimeEntry({
  photo_proof_url: photoUrl,
});
```

**Requirements**:
- Browser must support Camera API
- User must grant camera permissions
- Photo stored in Supabase Storage

### 4. Break Management

**Purpose**: Track breaks with detailed logging

**Implementation**:

```typescript
import { useBreakManagement } from '@/hooks/useBreakManagement';

const {
  startBreak,
  endBreak,
  currentBreak,
  isBreakActive,
  elapsedMinutes,
  totalBreakTime,
} = useBreakManagement(employeeId, timeEntryId);

// Start a break
startBreak('lunch'); // or 'break', 'other'

// End break after some time
endBreak();

// Get total break time for the shift
console.log(`Total break time: ${totalBreakTime} minutes`);
```

**Break Types**:
- `lunch`: Lunch break (typically 30-60 minutes)
- `break`: Short break (typically 15 minutes)
- `other`: Custom break

**Features**:
- Automatic duration calculation
- Add notes to breaks
- Validate break duration doesn't exceed max (8 hours)
- Break logging for compliance

### 5. Push Notifications

**Purpose**: Notify employees and managers of important events

**Implementation**:

```typescript
import {
  initializeNotifications,
  notifyClockIn,
  notifyGeofenceViolation,
} from '@/utils/notifications';

// Initialize on app start
await initializeNotifications();

// Send clock-in notification
await notifyClockIn(employeeName, '08:00 AM', locationName);

// Send geofence violation notification
await notifyGeofenceViolation(
  employeeName,
  locationName,
  distanceMeters
);
```

**Notification Types**:
- `clock_in`: Employee clocked in
- `clock_out`: Employee clocked out
- `geofence_violation`: Employee left zone
- `shift_reminder`: Upcoming shift reminder
- `break_reminder`: Time to take break
- `report_ready`: Report is ready to download

**Features**:
- Web Push API integration
- Service worker handling
- Click-to-focus window
- Local notification fallback

### 6. PDF Report Generation

**Purpose**: Generate downloadable attendance reports

**Implementation**:

```typescript
import { generateMonthlyReport } from '@/utils/reportGenerator';

// Generate monthly report
const pdf = await generateMonthlyReport(
  employeeName,
  companyName,
  monthDate,
  summaryData,
  timeEntriesData,
  analyticsData,
  violationsData
);

// PDF is auto-downloaded as monthly-report-2026-02-01.pdf
```

**Report Types**:
- **Daily Report**: Single day attendance and breaks
- **Weekly Report**: Week summary with analytics
- **Monthly Report**: Full month with violations and metrics

**Report Contents**:
- Header with employee and company info
- Summary statistics (hours, attendance %, breaks)
- Time entry table with clock in/out times
- Break summary
- Analytics charts and metrics
- Geofence violations list
- Footer with page numbers

**Example Daily Report**:

```
═══════════════════════════════════════
   DAILY ATTENDANCE REPORT
   Friday, February 6, 2026
───────────────────────────────────────
Employee: John Doe
Company: Security Inc.
Period: February 6, 2026 - February 6, 2026

SUMMARY
───────────────────────────────────────
Total Hours: 8.5h
Total Days: 1
Avg Hours/Day: 8.5h
Break Time: 0.5h
Attendance: 100%

TIME ENTRIES
───────────────────────────────────────
Date        | Clock In  | Clock Out | Duration
2026-02-06  | 08:00 AM  | 05:00 PM  | 8.5h
═══════════════════════════════════════
```

---

## PWA Configuration

### Overview

The app is configured as a Progressive Web App (PWA) for:
- Installation on mobile home screen
- Offline functionality
- Push notifications
- Fast loading

### Files

#### manifest.json

Configures app appearance and metadata:

```json
{
  "name": "Time & Attendance - Security Guard Workforce Management",
  "short_name": "Time & Attendance",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192" },
    { "src": "/icon-512x512.png", "sizes": "512x512" }
  ]
}
```

#### service-worker.js

Handles offline functionality and background sync:

```javascript
// Cache-first strategy for static assets
// Network-first strategy for API calls
// Push notification handling
// Background sync for offline actions
```

**Features**:
- Offline cache management
- Push notification listening
- Background sync for time entries
- Service worker lifecycle management

#### index.html Updates

Added PWA meta tags:

```html
<meta name="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1e293b" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Installation

#### On Desktop (Chrome)

1. Click "Install" button in address bar
2. App will be installed
3. Accessed from app drawer or desktop shortcut

#### On iOS (Safari)

1. Click "Share" button
2. Select "Add to Home Screen"
3. App will be installed
4. Accessed from home screen

#### On Android (Chrome)

1. Click "Install" button in address bar
2. Or long-press app and select "Add to home screen"
3. App will be installed

### Offline Mode

**Automatic offline support**:

```typescript
// Service worker caches API responses
// Offline requests stored in IndexedDB
// Automatic sync when back online
```

**How to use offline clock in**:

1. Clock in while offline
2. Action stored locally in IndexedDB
3. When online, background sync automatically uploads
4. Manager dashboard shows clock in event

---

## API Reference

### useGeofenceTracking Hook

Manages real-time geofence tracking.

```typescript
import { useGeofenceTracking } from '@/hooks/useGeofenceTracking';

const {
  currentLocation,      // { latitude, longitude, accuracy }
  isTracking,          // boolean
  error,               // string | null
  validations,         // Map<zoneId, GeofenceValidationResult>
  violations,          // Array of violations
  inZones,             // Array of zone IDs user is in
  getCurrentLocation,  // () => Promise<Location>
  updateLocation,      // () => Promise<void>
  geofenceZones,       // Array of zone data
} = useGeofenceTracking(employeeId, locationId, enabled);
```

### useBreakManagement Hook

Manages break tracking and timing.

```typescript
import { useBreakManagement } from '@/hooks/useBreakManagement';

const {
  currentBreak,        // Break object or null
  breaks,              // Array of all breaks
  isBreakActive,       // boolean
  elapsedMinutes,      // number
  totalBreakTime,      // number in minutes
  startBreak,          // (type: string) => void
  endBreak,            // () => void
  updateBreakNotes,    // (notes: string) => void
} = useBreakManagement(employeeId, timeEntryId);
```

### useUserProfile Hook

Manages user profile data.

```typescript
import { useUserProfile } from '@/hooks/useUserProfile';

const {
  profile,              // UserProfile object or null
  isLoading,            // boolean
  error,                // string | null
  createProfile,        // (data) => void
  updateProfile,        // (data) => void
  updatePreferences,    // (prefs) => void
} = useUserProfile(userId);
```

### Geofence Validation Functions

```typescript
import {
  calculateDistance,      // (lat1, lon1, lat2, lon2) => number
  validateGeofence,       // (location, zone) => result
  validateMultipleGeofences,  // (location, zones) => results
  detectGeofenceViolation,    // (prevLoc, currLoc, zone) => result
  getGeofenceStatus,      // (validation) => string
} from '@/utils/geofenceValidation';
```

### Rate Limiter Functions

```typescript
import {
  checkRateLimit,        // (empId, action) => result
  getRateLimitStatus,    // (empId, action) => seconds
  clearRateLimit,        // (empId, action?) => void
} from '@/utils/rateLimiter';
```

### Notification Functions

```typescript
import {
  initializeNotifications,    // () => Promise<boolean>
  sendNotification,           // (payload) => Promise<Notification>
  notifyClockIn,             // (empName, time, location) => Promise
  notifyClockOut,            // (empName, time, hours) => Promise
  notifyGeofenceViolation,   // (empName, location, distance) => Promise
  getNotificationStatus,     // () => status object
} from '@/utils/notifications';
```

### Report Generation Functions

```typescript
import {
  generatePDFReport,      // (data, filename) => Promise<Blob>
  generateDailyReport,    // (empName, company, date, summary, entries) => Promise<Blob>
  generateWeeklyReport,   // (empName, company, weekStart, weekEnd, ...) => Promise<Blob>
  generateMonthlyReport,  // (empName, company, monthDate, ...) => Promise<Blob>
} from '@/utils/reportGenerator';
```

---

## Deployment Guide

### Prerequisites

- Node.js 18+ installed
- Supabase project created with Phase 1 + Phase 2 schema
- Service Worker and Manifest files in public/
- GitHub repository configured (optional)

### Step 1: Apply Database Schema

```bash
# Apply Phase 2 schema to Supabase
# 1. Go to Supabase Dashboard
# 2. SQL Editor
# 3. Create new query
# 4. Copy contents of schema-phase2.sql
# 5. Run query
```

### Step 2: Install Dependencies

```bash
cd time-attend-app
npm install
```

### Step 3: Configure Environment

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Step 5: Deploy

**Option A: Vercel (Recommended)**

```bash
npm install -g vercel
vercel --prod
```

**Option B: Netlify**

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Option C: Self-hosted**

```bash
# Copy dist/ to web server
scp -r dist/* user@server:/var/www/app
```

### Step 6: Verify Deployment

1. Access app at deployed URL
2. Test mobile app at `/mobile`
3. Test manager dashboard at `/dashboard/manager`
4. Verify push notifications work
5. Test offline functionality

### Step 7: Configure PWA

1. Ensure manifest.json is accessible
2. Verify service worker loads correctly
3. Test app installation
4. Verify offline mode works

### Deployment Checklist

- [ ] Database schema applied (Phase 1 + Phase 2)
- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Service worker loads correctly
- [ ] Manifest.json accessible
- [ ] Icons uploaded to public/
- [ ] HTTPS enabled (required for PWA)
- [ ] Rate limiting working
- [ ] Geofence validation working
- [ ] Push notifications configured
- [ ] Offline sync tested
- [ ] Mobile responsive tested
- [ ] All routes accessible
- [ ] Error logging configured
- [ ] Analytics configured (optional)

---

## Troubleshooting

### Geofence Not Validating

**Problem**: Employees can clock in even when out of zone.

**Solutions**:
1. Check GPS accuracy (must be <100m)
2. Verify geofence radius is correct
3. Check browser permissions for location access
4. Restart app and try again

```typescript
// Debug geofence
const location = await useGeofenceTracking(...).getCurrentLocation();
console.log('Location:', location);
console.log('Validation:', validations);
```

### Rate Limiting Not Working

**Problem**: Multiple clock in/outs happening within 30 seconds.

**Solutions**:
1. Verify rate limiter is initialized: `initializeRateLimitCleanup()`
2. Check rate limit cache: `getRateLimitStats()`
3. Clear cache if needed: `clearRateLimit(employeeId)`

```typescript
// Check rate limit status
const status = getRateLimitStatus(employeeId, 'clock_in');
console.log('Seconds remaining:', status);
```

### Service Worker Not Loading

**Problem**: Service worker fails to register.

**Solutions**:
1. Ensure HTTPS is enabled (required for SW)
2. Check service-worker.js is in public/
3. Verify manifest.json path in index.html
4. Check browser console for errors

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(reg => {
  console.log('Service Workers:', reg);
});
```

### Push Notifications Not Working

**Problem**: Notifications not appearing on device.

**Solutions**:
1. Initialize notifications: `initializeNotifications()`
2. Check browser notification permissions
3. Verify service worker is active
4. Test with: `sendTestNotification()`

```typescript
// Check notification status
const status = getNotificationStatus();
console.log('Notifications:', status);

// Request permission
if (status.default) {
  await requestNotificationPermission();
}
```

### Offline Sync Not Working

**Problem**: Clocked in time entries not syncing when back online.

**Solutions**:
1. Check IndexedDB is working
2. Verify service worker background sync is registered
3. Check for network errors in console
4. Manually trigger sync: `navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-time-entries'))`

### Break Timer Not Updating

**Problem**: Break timer shows incorrect elapsed time.

**Solutions**:
1. Verify useBreakManagement hook is properly mounted
2. Check that currentBreak is set
3. Verify timer interval is running (1 second)
4. Check browser console for errors

```typescript
// Debug break timer
useEffect(() => {
  console.log('Current break:', currentBreak);
  console.log('Elapsed minutes:', elapsedMinutes);
  console.log('Is active:', isBreakActive);
}, [currentBreak, elapsedMinutes, isBreakActive]);
```

### Mobile App Not Responsive

**Problem**: App doesn't look good on mobile devices.

**Solutions**:
1. Verify viewport meta tag in index.html
2. Test on actual device (not just browser DevTools)
3. Clear browser cache
4. Check media queries are working
5. Verify Tailwind CSS is compiled

```html
<!-- Verify in index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Performance Issues

**Problem**: App is slow, especially on first load.

**Solutions**:
1. Check bundle size: `npm run build`
2. Verify service worker caching is working
3. Check for large images or assets
4. Enable browser caching headers
5. Use Lighthouse in DevTools for audit

```bash
# Check bundle size
npm run build
ls -lh dist/
```

---

## Support & Contact

For issues or questions:

1. Check this documentation
2. Review code comments
3. Check browser console for errors
4. Review Supabase logs
5. Contact development team

---

## Version History

### v1.0.0 (2026-02-06)
- Initial Phase 2 release
- Employee mobile interface
- Manager dashboard
- Geofence tracking
- Break management
- Rate limiting
- Push notifications
- PDF reports
- PWA support
- Offline sync

---

## License

Proprietary - All Rights Reserved

