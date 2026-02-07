# Quick Start Guide - Phase 2 Implementation

**For**: Developers implementing Phase 2 features  
**Duration**: ~1 hour to get started  
**Last Updated**: 2026-02-06

---

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd /path/to/time-attend-app
npm install
```

### 2. Apply Database Schema
```sql
-- 1. Go to Supabase Dashboard
-- 2. SQL Editor → New Query
-- 3. Copy and run schema-phase2.sql
```

### 3. Configure Environment
```bash
# Create .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start Development Server
```bash
npm run dev
```

Access app at: `http://localhost:5173`

---

## Common Development Tasks

### 1. Testing Employee Mobile App

```bash
# 1. Start dev server
npm run dev

# 2. Open mobile view in browser
# Chrome DevTools → Device Toolbar → Select Mobile Device

# 3. Visit mobile app
http://localhost:5173/mobile

# 4. Features to test:
# - Clock in/out button (requires GPS)
# - Geofence status indicator
# - Location display
# - Break timer
```

### 2. Testing Manager Dashboard

```bash
# 1. Create test data:
# - Create a company
# - Create 5+ employees
# - Create a location with geofence zone
# - Create some time entries

# 2. Visit dashboard
http://localhost:5173/dashboard/manager

# 3. Features to test:
# - Employee status counts
# - Real-time updates
# - Violation log
# - Activity log
```

### 3. Testing Geofence Validation

```typescript
// In your component
import { useGeofenceTracking } from '@/hooks/useGeofenceTracking';

const { currentLocation, validations, inZones } = useGeofenceTracking(
  employeeId,
  locationId,
  true // enabled
);

// Debug in console
useEffect(() => {
  console.log('Location:', currentLocation);
  console.log('Validations:', Object.fromEntries(validations));
  console.log('In Zones:', inZones);
}, [currentLocation, validations, inZones]);
```

### 4. Testing Rate Limiting

```typescript
import { checkRateLimit, getRateLimitStats } from '@/utils/rateLimiter';

// Check rate limit before clock in
const result = await checkRateLimit(employeeId, 'clock_in');
console.log('Can clock in:', result.allowed);
console.log('Message:', result.message);

// Check stats
console.log('Rate limit stats:', getRateLimitStats());
```

### 5. Testing Break Management

```typescript
import { useBreakManagement } from '@/hooks/useBreakManagement';

const { startBreak, endBreak, elapsedMinutes, isBreakActive } = 
  useBreakManagement(employeeId, timeEntryId);

// Start break
startBreak('lunch');

// Monitor elapsed time
useEffect(() => {
  console.log(`Break duration: ${elapsedMinutes}m`);
}, [elapsedMinutes]);

// End break
endBreak();
```

### 6. Testing Push Notifications

```typescript
import { 
  initializeNotifications, 
  sendTestNotification,
  getNotificationStatus 
} from '@/utils/notifications';

// Initialize on app load
useEffect(() => {
  initializeNotifications().then(() => {
    console.log('Notifications ready');
  });
}, []);

// Check status
const status = getNotificationStatus();
console.log('Notification permissions:', status);

// Send test notification
<Button onClick={() => sendTestNotification()}>
  Test Notification
</Button>
```

---

## File Structure

```
time-attend-app/
├── src/
│   ├── pages/
│   │   ├── EmployeeMobileApp.tsx      ← Mobile interface
│   │   ├── ManagerDashboard.tsx        ← Manager dashboard
│   │   └── ...
│   ├── hooks/
│   │   ├── useGeofenceTracking.ts      ← Geofence hook
│   │   ├── useBreakManagement.ts       ← Break hook
│   │   ├── useUserProfile.ts           ← Profile hook
│   │   └── ...
│   ├── utils/
│   │   ├── rateLimiter.ts              ← Rate limiting
│   │   ├── geofenceValidation.ts       ← GPS validation
│   │   ├── wifiGeofencing.ts           ← WiFi verification
│   │   ├── notifications.ts            ← Push notifications
│   │   ├── reportGenerator.ts          ← PDF reports
│   │   └── ...
│   ├── components/
│   ├── App.tsx                         ← Routes (includes Phase 2)
│   └── ...
├── public/
│   ├── manifest.json                   ← PWA manifest
│   ├── service-worker.js               ← Service worker
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── ...
├── schema.sql                          ← Phase 1 schema
├── schema-phase2.sql                   ← Phase 2 schema
├── PHASE2_FEATURES.md                  ← Feature docs
├── DEPLOYMENT_CHECKLIST.md             ← Deploy guide
└── package.json
```

---

## Quick Code Snippets

### Clock In with Geofence Validation

```typescript
const clockIn = async () => {
  // 1. Get current location
  const location = await getCurrentLocation();
  
  // 2. Check rate limit
  const rateLimitResult = await checkRateLimit(employeeId, 'clock_in');
  if (!rateLimitResult.allowed) {
    showError(rateLimitResult.message);
    return;
  }
  
  // 3. Validate geofence
  const validation = validateGeofence(location, geofenceZone);
  if (!validation.isInZone) {
    showError('You are outside the work zone');
    return;
  }
  
  // 4. Save time entry
  await supabase.from('time_entries').insert({
    employee_id: employeeId,
    clock_in_time: new Date().toISOString(),
    clock_in_lat: location.latitude,
    clock_in_lng: location.longitude,
    geofence_validated: validation.isInZone,
  });
  
  // 5. Send notification
  await notifyClockIn(employeeName, new Date().toLocaleTimeString(), locationName);
  
  showSuccess('Clocked in successfully');
};
```

### Generate Monthly Report

```typescript
import { generateMonthlyReport } from '@/utils/reportGenerator';

const downloadMonthlyReport = async (employeeId: string, monthDate: Date) => {
  try {
    const employee = await getEmployee(employeeId);
    const company = await getCompany(employee.company_id);
    
    // Get data for the month
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const timeEntries = await getTimeEntriesForDateRange(
      employeeId, 
      monthStart, 
      monthEnd
    );
    
    const summary = calculateSummary(timeEntries);
    const violations = await getGeofenceViolations(employeeId, monthStart, monthEnd);
    
    // Generate PDF
    await generateMonthlyReport(
      employee.name,
      company.name,
      monthDate,
      summary,
      { entries: timeEntries },
      undefined,
      { violations }
    );
    
    showSuccess('Report downloaded');
  } catch (error) {
    showError('Failed to generate report');
  }
};
```

### Monitor Employee Real-Time

```typescript
import { useGeofenceTracking } from '@/hooks/useGeofenceTracking';

function EmployeeMonitor({ employeeId, locationId }) {
  const {
    currentLocation,
    validations,
    violations,
    inZones,
    isTracking,
    error,
  } = useGeofenceTracking(employeeId, locationId, true);

  if (error) {
    return <Alert>{error}</Alert>;
  }

  const validation = validations.get(locationId);

  return (
    <div>
      {/* Status */}
      <div>
        Status: {isTracking ? 'Tracking...' : 'Not tracking'}
        Location: {currentLocation?.latitude}, {currentLocation?.longitude}
      </div>

      {/* Geofence */}
      {validation && (
        <div>
          Geofence: {validation.isInZone ? '✓ IN' : '✗ OUT'}
          Distance: {validation.distanceMeters}m
        </div>
      )}

      {/* Violations */}
      {violations.length > 0 && (
        <div>
          Violations:
          {violations.map(v => (
            <div key={v.timestamp}>
              {v.type} - {v.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Debugging Tips

### Enable Verbose Logging

```typescript
// In App.tsx or main.tsx
if (import.meta.env.DEV) {
  // Log geofence updates
  window.DEBUG_GEOFENCE = true;
  
  // Log rate limits
  window.DEBUG_RATE_LIMIT = true;
  
  // Log notifications
  window.DEBUG_NOTIFICATIONS = true;
}
```

### Check Browser Features

```javascript
// In browser console

// Check location support
navigator.geolocation ? 'GPS: Yes' : 'GPS: No'

// Check service worker
'serviceWorker' in navigator ? 'SW: Yes' : 'SW: No'

// Check notifications
'Notification' in window ? 'Notifications: Yes' : 'Notifications: No'

// Check offline support
'onLine' in navigator ? 'Offline: Yes' : 'Offline: No'

// Check IndexedDB
'indexedDB' in window ? 'IndexedDB: Yes' : 'IndexedDB: No'
```

### Database Debugging

```sql
-- Check rate limit entries
SELECT * FROM rate_limit_checks 
ORDER BY attempt_time DESC 
LIMIT 10;

-- Check geofence violations
SELECT * FROM geofence_violations_log 
ORDER BY created_at DESC 
LIMIT 10;

-- Check breaks
SELECT * FROM breaks 
ORDER BY start_time DESC 
LIMIT 10;

-- Check push notifications sent
SELECT * FROM push_notifications_log 
ORDER BY sent_at DESC 
LIMIT 10;
```

---

## Common Issues & Solutions

### Issue: Geofence not validating
**Solution**: 
```typescript
// Verify geofence zones exist
const { data: zones } = await supabase
  .from('geofence_zones')
  .select('*')
  .eq('location_id', locationId);

console.log('Zones:', zones); // Should not be empty
```

### Issue: Service worker not loading
**Solution**:
```bash
# 1. Check if file exists
ls -la public/service-worker.js

# 2. Check browser console for errors
# Chrome DevTools → Console tab

# 3. Check registered service workers
# Chrome DevTools → Application → Service Workers
```

### Issue: Notifications not showing
**Solution**:
```typescript
// Check permissions
const status = getNotificationStatus();
console.log('Status:', status);

if (status.denied) {
  console.log('Permission denied - user blocked notifications');
}
```

### Issue: Offline sync not working
**Solution**:
```javascript
// Check IndexedDB
const db = indexedDB.databases();
console.log('Databases:', db);

// Manually trigger sync
navigator.serviceWorker.ready.then(sw => {
  sw.sync.register('sync-time-entries');
});
```

---

## Next Steps

1. **Read** `PHASE2_FEATURES.md` for detailed documentation
2. **Review** `schema-phase2.sql` to understand database changes
3. **Test** each component in browser with DevTools
4. **Follow** `DEPLOYMENT_CHECKLIST.md` before production
5. **Monitor** performance with Lighthouse audit

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Check code quality
npm run lint --fix       # Auto-fix linting issues

# Git
git log --oneline       # Recent commits
git diff                # Changes since last commit
git status              # Current status
git branch -a           # All branches

# Database
# Use Supabase Dashboard → SQL Editor
```

---

## Resources

- **Phase 2 Features**: Read `PHASE2_FEATURES.md`
- **Deployment**: Read `DEPLOYMENT_CHECKLIST.md`
- **Implementation Plan**: Read `PHASE2_IMPLEMENTATION_PLAN.md`
- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
- **React Router Docs**: https://reactrouter.com

---

## Getting Help

1. Check this quick start guide
2. Review `PHASE2_FEATURES.md`
3. Check browser console for errors
4. Check Supabase logs
5. Review code comments in files
6. Ask the development team

---

**Happy coding! 🚀**

