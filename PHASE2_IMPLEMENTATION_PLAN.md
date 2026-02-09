# Phase 2 Implementation Plan - Time & Attendance App

**Status**: In Progress  
**Start Date**: 2026-02-06  
**Timeline**: 2-3 weeks

## Overview
Phase 2 builds upon the Phase 1 foundation (7 tables with RLS policies) to deliver a complete security guard workforce management solution with mobile-first interfaces, real-time tracking, and advanced analytics.

---

## 1. DATABASE SCHEMA UPDATES

### 1.1 New Tables & Modifications

#### user_profiles Table (NEW)
Separate user profile data from auth.users for better data management.

```sql
-- Schema will be added to schema-phase2.sql
```

#### Enhanced time_entries with Rate Limiting
- Add `rate_limit_check` boolean field
- Add `wifi_bssid` field for optional WiFi verification
- Add `photo_proof_url` for optional photo proof

#### breaks Table (NEW)
For detailed break tracking and validation

#### push_notifications_log Table (NEW)
For tracking sent notifications

#### geofence_violations_log Table (NEW)
For auditing geofence violations

---

## 2. NEW COMPONENTS & PAGES

### 2.1 Employee Mobile Interface

**File**: `src/pages/EmployeeMobile.tsx`
- Large, obvious clock in/out button
- Current location display with GPS accuracy
- Geofence status indicator (in zone / out of zone / warning)
- Break timer
- Quick shift information
- Today's schedule summary
- Mobile-optimized layout

**New Components**:
- `src/components/ClockInButton.tsx` - Large CTA for clock in/out
- `src/components/LocationDisplay.tsx` - Current location with accuracy
- `src/components/GeofenceStatus.tsx` - Visual geofence indicator
- `src/components/BreakTimer.tsx` - Break tracking
- `src/components/ShiftInfo.tsx` - Current shift details
- `src/components/TodaySchedule.tsx` - Daily schedule summary

### 2.2 Manager Dashboard

**File**: `src/pages/ManagerDashboard.tsx`
- Real-time employee map
- Clock-in/out log with timestamps
- Geofence violations log
- Employee status list (on duty, clocked out, on break)
- Attendance metrics
- Quick actions

**New Components**:
- `src/components/EmployeeMap.tsx` - Real-time map with Leaflet
- `src/components/AttendanceLog.tsx` - Clock in/out history
- `src/components/EmployeeStatusList.tsx` - Current status of all employees
- `src/components/GeofenceViolationsLog.tsx` - Violation audit log
- `src/components/DashboardMetrics.tsx` - Key metrics and KPIs

### 2.3 Enhanced Admin Settings

**File**: `src/pages/AdminSettings.tsx` (updates)
- Create/edit employees
- Create/edit locations with geofence zones
- Create/manage shifts
- User role assignment (guard, supervisor, manager, admin)
- Company settings
- Rate limiting configuration
- Notification preferences

**New Components**:
- `src/components/EmployeeEditor.tsx` - Create/edit employees
- `src/components/LocationEditor.tsx` - Manage locations and geofences
- `src/components/ShiftEditor.tsx` - Create/manage shifts
- `src/components/RoleManagement.tsx` - User roles
- `src/components/NotificationSettings.tsx` - Push notification config

---

## 3. ADVANCED FEATURES

### 3.1 Rate Limiting Middleware

**File**: `src/utils/rateLimiter.ts`
- Maximum 1 clock in/out per 30 seconds per employee
- Redis or in-memory cache implementation
- Prevent duplicate clock events

### 3.2 WiFi BSSID Geofencing

**File**: `src/utils/wifiGeofencing.ts`
- Optional BSSID validation layer
- Combine GPS + WiFi for better accuracy
- Store BSSID hashes in geofence_zones table

### 3.3 Photo Proof on Clock-In

**File**: `src/utils/photoCapture.ts`
- Capture photo on clock-in (optional)
- Use device camera API
- Store in Supabase Storage
- Display in audit log

### 3.4 Push Notifications

**File**: `src/utils/notifications.ts`
- Firebase Cloud Messaging or Web Push API
- Send on clock-in/out events
- Send on geofence violations
- Store notification log for audit

### 3.5 PDF Report Generation

**File**: `src/utils/reportGenerator.ts`
- Daily/weekly/monthly attendance reports
- Employee summaries
- Geofence violation reports
- Use jsPDF and html2canvas

---

## 4. MOBILE RESPONSIVENESS & PWA

### 4.1 PWA Configuration

**Files**:
- `public/manifest.json` - Web app manifest
- `public/service-worker.ts` - Service worker for offline support
- `public/icons/` - App icons (192x192, 512x512)

**Features**:
- Installable on mobile home screen
- Offline sync for clock in/out events
- Background sync API
- Local caching strategy

### 4.2 Mobile-First UI Updates

**Updates to existing components**:
- Touch-friendly tap targets (48px minimum)
- Responsive grid layouts
- Optimized for small screens
- Accessible forms and inputs

---

## 5. NEW HOOKS & UTILITIES

### 5.1 Data Management Hooks

- `src/hooks/useUserProfile.ts` - User profile management
- `src/hooks/useGeofenceTracking.ts` - Real-time geofence tracking
- `src/hooks/useBreakManagement.ts` - Break tracking
- `src/hooks/useRateLimiting.ts` - Rate limit checks
- `src/hooks/usePushNotifications.ts` - Notification management

### 5.2 Utility Functions

- `src/utils/geolocation.ts` - GPS and location services
- `src/utils/geofenceValidation.ts` - Geofence calculations
- `src/utils/offlineSync.ts` - Offline data synchronization
- `src/utils/authentication.ts` - Auth helpers

---

## 6. TESTING & DOCUMENTATION

### 6.1 Test Coverage

- Unit tests for utility functions
- Component tests for UI components
- Integration tests for data flows
- End-to-end tests for key workflows

### 6.2 Documentation

- API documentation
- Component storybook
- User guides (employee, manager, admin)
- Deployment checklist
- Troubleshooting guide

---

## 7. IMPLEMENTATION TIMELINE

### Week 1
- [ ] Database schema updates (user_profiles, breaks, geofence_violations_log)
- [ ] User profile management hooks
- [ ] Basic employee mobile interface (clock in/out)
- [ ] Location display and accuracy

### Week 2
- [ ] Geofence tracking and validation
- [ ] Break timer and break management
- [ ] Manager dashboard basic layout
- [ ] Employee status list
- [ ] Rate limiting middleware

### Week 3
- [ ] Real-time employee map
- [ ] PDF report generation
- [ ] Push notifications setup
- [ ] PWA configuration
- [ ] WiFi BSSID geofencing
- [ ] Photo proof capture

### Week 4 (Polish & Deploy)
- [ ] Comprehensive testing
- [ ] Mobile responsiveness polish
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Deployment checklist review

---

## 8. DELIVERABLES CHECKLIST

### Code
- [ ] Updated schema.sql with new tables
- [ ] All new React components and pages
- [ ] All new custom hooks
- [ ] Utility functions and middleware
- [ ] Service worker and PWA config
- [ ] TypeScript types and interfaces

### Documentation
- [ ] Phase 2 Feature Documentation
- [ ] API Reference
- [ ] Component Library
- [ ] User Guides
- [ ] Deployment Checklist
- [ ] Testing Checklist

### Testing
- [ ] Unit tests for core functions
- [ ] Component tests for UI
- [ ] Integration tests
- [ ] Mobile device testing
- [ ] Offline sync testing
- [ ] Geofence accuracy testing

---

## 9. SUCCESS CRITERIA

- [ ] Employees can clock in/out from mobile with geofence validation
- [ ] Managers can see real-time employee locations on map
- [ ] All time entries are logged with location and timestamp
- [ ] Geofence violations are tracked and reported
- [ ] Rate limiting prevents duplicate clock events
- [ ] PDF reports can be generated on-demand
- [ ] App works offline and syncs when online
- [ ] App is installable as PWA
- [ ] All features work on mobile devices
- [ ] Full TypeScript coverage
- [ ] Comprehensive error handling

---

## 10. KNOWN BLOCKERS / CONSIDERATIONS

- Firebase Cloud Messaging requires backend setup
- Real-time map requires Leaflet or MapBox integration
- Offline sync requires careful state management
- WiFi BSSID geofencing may not work in all locations
- Photo capture requires camera permissions
- Rate limiting may need backend support for accuracy

---

## 11. PHASE 3 READINESS

After Phase 2 completion, the following will be ready for Phase 3 (Deployment):
- Complete feature-rich application
- Production-ready database schema
- Mobile-responsive PWA
- Comprehensive documentation
- Test coverage
- Performance optimization
- Deployment checklist

