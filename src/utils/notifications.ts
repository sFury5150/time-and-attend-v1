/**
 * Push Notifications Utility
 * Handles push notifications via Web Push API or Firebase Cloud Messaging
 * Includes notification logging for audit trail
 */

export type NotificationType =
  | 'clock_in'
  | 'clock_out'
  | 'geofence_violation'
  | 'shift_reminder'
  | 'report_ready'
  | 'break_reminder'
  | 'custom';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  tag?: string; // For grouping similar notifications
  requireInteraction?: boolean; // Keep notification until user interacts
  data?: {
    employeeId?: string;
    timeEntryId?: string;
    shiftId?: string;
    locationId?: string;
    [key: string]: any;
  };
}

export interface NotificationOptions extends NotificationPayload {
  silent?: boolean; // Suppress sound/vibration
  priority?: 'high' | 'normal' | 'low';
  ttl?: number; // Time to live in seconds
}

// Service Worker registration
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Initialize notifications
 * Checks browser support and requests permissions
 * Must be called once when app starts
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Push Notifications not supported in this browser');
      return false;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported in this browser');
      return false;
    }

    // Request notification permission if not already granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied by user');
        return false;
      }
    }

    // Register service worker for handling notifications
    try {
      serviceWorkerRegistration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );
      console.log('Service Worker registered for notifications');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
      // Notifications can still work without service worker (limited functionality)
    }

    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled in user preferences
 */
export function areNotificationsEnabled(): boolean {
  try {
    return Notification.permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Send a notification
 * @param payload - Notification payload
 * @param options - Additional notification options
 * @returns Notification object if successful
 */
export async function sendNotification(
  payload: NotificationPayload,
  options?: Partial<NotificationOptions>
): Promise<Notification | null> {
  try {
    // Check if notifications are enabled
    if (!areNotificationsEnabled()) {
      console.warn('Notifications are not enabled');
      return null;
    }

    const notificationOptions: NotificationOptions = {
      ...payload,
      ...options,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || payload.type,
      priority: options?.priority || 'high',
    };

    // If service worker is available, send through it (more reliable)
    if (serviceWorkerRegistration) {
      await serviceWorkerRegistration.showNotification(payload.title, notificationOptions);
      
      // Fallback to direct notification
      return new Notification(payload.title, notificationOptions);
    }

    // Direct notification (limited features without service worker)
    return new Notification(payload.title, notificationOptions);
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send a clock-in notification
 */
export async function notifyClockIn(
  employeeName: string,
  timeString: string,
  locationName?: string
): Promise<Notification | null> {
  const location = locationName ? ` at ${locationName}` : '';
  return sendNotification({
    type: 'clock_in',
    title: 'Clocked In',
    message: `${employeeName} clocked in at ${timeString}${location}`,
    icon: '/icons/clock-in.png',
    tag: 'clock-in',
  });
}

/**
 * Send a clock-out notification
 */
export async function notifyClockOut(
  employeeName: string,
  timeString: string,
  hoursWorked?: number
): Promise<Notification | null> {
  const hours = hoursWorked ? ` (${hoursWorked.toFixed(1)} hours)` : '';
  return sendNotification({
    type: 'clock_out',
    title: 'Clocked Out',
    message: `${employeeName} clocked out at ${timeString}${hours}`,
    icon: '/icons/clock-out.png',
    tag: 'clock-out',
  });
}

/**
 * Send a geofence violation notification
 */
export async function notifyGeofenceViolation(
  employeeName: string,
  locationName: string,
  distanceMeters: number
): Promise<Notification | null> {
  const distance = distanceMeters < 1000 
    ? `${Math.round(distanceMeters)}m`
    : `${(distanceMeters / 1000).toFixed(1)}km`;
  
  return sendNotification({
    type: 'geofence_violation',
    title: '⚠️ Geofence Violation',
    message: `${employeeName} is ${distance} from ${locationName}`,
    icon: '/icons/warning.png',
    badge: '/badge-warning.png',
    tag: 'geofence-violation',
    requireInteraction: true,
  });
}

/**
 * Send a shift reminder notification
 */
export async function notifyShiftReminder(
  employeeName: string,
  shiftStartTime: string,
  minutesUntilShift: number
): Promise<Notification | null> {
  return sendNotification({
    type: 'shift_reminder',
    title: 'Upcoming Shift',
    message: `${employeeName}, your shift starts in ${minutesUntilShift} minutes at ${shiftStartTime}`,
    icon: '/icons/shift.png',
    tag: 'shift-reminder',
  });
}

/**
 * Send a break reminder notification
 */
export async function notifyBreakReminder(
  employeeName: string,
  minutesWorked: number
): Promise<Notification | null> {
  return sendNotification({
    type: 'break_reminder',
    title: '☕ Break Time',
    message: `${employeeName}, you've been working for ${minutesWorked} minutes. Consider taking a break.`,
    icon: '/icons/break.png',
    tag: 'break-reminder',
  });
}

/**
 * Send a report ready notification
 */
export async function notifyReportReady(
  reportType: string,
  reportName: string
): Promise<Notification | null> {
  return sendNotification({
    type: 'report_ready',
    title: 'Report Ready',
    message: `Your ${reportType} report "${reportName}" is ready to download`,
    icon: '/icons/report.png',
    tag: 'report-ready',
  });
}

/**
 * Get notification permission status
 */
export function getNotificationStatus(): {
  supported: boolean;
  granted: boolean;
  denied: boolean;
  default: boolean;
} {
  if (!('Notification' in window)) {
    return {
      supported: false,
      granted: false,
      denied: false,
      default: false,
    };
  }

  return {
    supported: true,
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
    default: Notification.permission === 'default',
  };
}

/**
 * Close a notification by tag
 */
export function closeNotification(tag: string): void {
  if ('Notification' in window && serviceWorkerRegistration) {
    serviceWorkerRegistration.getNotifications({ tag }).then(notifications => {
      notifications.forEach(notification => notification.close());
    });
  }
}

/**
 * Get all active notifications
 */
export async function getActiveNotifications(): Promise<Notification[]> {
  if (!('Notification' in window) || !serviceWorkerRegistration) {
    return [];
  }

  try {
    return await serviceWorkerRegistration.getNotifications();
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Create a test notification (for testing/demo)
 */
export async function sendTestNotification(): Promise<Notification | null> {
  return sendNotification({
    type: 'custom',
    title: 'Test Notification',
    message: 'This is a test notification. If you see this, notifications are working!',
    icon: '/icon-192x192.png',
  });
}

export default {
  initializeNotifications,
  areNotificationsEnabled,
  requestNotificationPermission,
  sendNotification,
  notifyClockIn,
  notifyClockOut,
  notifyGeofenceViolation,
  notifyShiftReminder,
  notifyBreakReminder,
  notifyReportReady,
  getNotificationStatus,
  closeNotification,
  getActiveNotifications,
  sendTestNotification,
};
