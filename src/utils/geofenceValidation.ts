/**
 * Geofence Validation Utility
 * Validates user location against geofence zones using GPS and optional WiFi BSSID
 */

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number; // Accuracy in meters
}

export interface GeofenceZone {
  id: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  wifiBssid?: string; // Optional WiFi BSSID for verification
}

export interface GeofenceValidationResult {
  isInZone: boolean;
  isWarningDistance: boolean; // Within 50% of radius
  distanceMeters: number;
  warningThreshold: number;
  violations?: string[];
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate if a user location is within a geofence zone
 * @param userLocation - Current user location
 * @param zone - Geofence zone to validate against
 * @returns Validation result with details
 */
export function validateGeofence(
  userLocation: Location,
  zone: GeofenceZone
): GeofenceValidationResult {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    zone.latitude,
    zone.longitude
  );

  const warningThreshold = zone.radiusMeters * 0.5; // 50% of radius is warning distance
  const isInZone = distance <= zone.radiusMeters;
  const isWarningDistance = distance <= zone.radiusMeters && distance > warningThreshold;

  const violations: string[] = [];

  // Check GPS accuracy if available
  if (userLocation.accuracy && userLocation.accuracy > zone.radiusMeters) {
    violations.push(
      `GPS accuracy (${Math.round(userLocation.accuracy)}m) exceeds zone radius (${Math.round(zone.radiusMeters)}m)`
    );
  }

  return {
    isInZone,
    isWarningDistance,
    distanceMeters: Math.round(distance),
    warningThreshold: Math.round(warningThreshold),
    violations: violations.length > 0 ? violations : undefined,
  };
}

/**
 * Validate multiple geofence zones and return the closest one
 * @param userLocation - Current user location
 * @param zones - Array of geofence zones
 * @returns Validation results for all zones and closest match
 */
export function validateMultipleGeofences(
  userLocation: Location,
  zones: GeofenceZone[]
): {
  results: Map<string, GeofenceValidationResult>;
  closest: {
    zoneId: string;
    distance: number;
    validation: GeofenceValidationResult;
  } | null;
  inZones: string[]; // Zone IDs that user is currently in
} {
  const results = new Map<string, GeofenceValidationResult>();
  let closest = null;
  let closestDistance = Infinity;
  const inZones: string[] = [];

  for (const zone of zones) {
    const validation = validateGeofence(userLocation, zone);
    results.set(zone.id, validation);

    // Track closest zone
    if (validation.distanceMeters < closestDistance) {
      closestDistance = validation.distanceMeters;
      closest = {
        zoneId: zone.id,
        distance: validation.distanceMeters,
        validation,
      };
    }

    // Track zones user is in
    if (validation.isInZone) {
      inZones.push(zone.id);
    }
  }

  return {
    results,
    closest,
    inZones,
  };
}

/**
 * Check if geofence violation occurred (left zone while clocked in)
 * @param previousLocation - Last known location
 * @param currentLocation - Current location
 * @param zone - Geofence zone
 * @returns Violation details
 */
export function detectGeofenceViolation(
  previousLocation: Location | null,
  currentLocation: Location,
  zone: GeofenceZone
): {
  violated: boolean;
  type?: 'left_zone' | 'outside_zone' | 'warning_distance';
  message?: string;
} {
  const currentValidation = validateGeofence(currentLocation, zone);

  // No previous location = first check, no violation
  if (!previousLocation) {
    return { violated: false };
  }

  const previousValidation = validateGeofence(previousLocation, zone);

  // Check if user left the zone
  if (previousValidation.isInZone && !currentValidation.isInZone) {
    return {
      violated: true,
      type: 'left_zone',
      message: `Left geofence zone: now ${currentValidation.distanceMeters}m away`,
    };
  }

  // Check if user is now at warning distance
  if (previousValidation.isInZone && currentValidation.isWarningDistance) {
    return {
      violated: true,
      type: 'warning_distance',
      message: `Warning: ${currentValidation.distanceMeters}m from zone boundary`,
    };
  }

  return { violated: false };
}

/**
 * Get human-readable zone status
 * @param validation - Geofence validation result
 * @returns Status string
 */
export function getGeofenceStatus(validation: GeofenceValidationResult): string {
  if (validation.isInZone) {
    if (validation.isWarningDistance) {
      return `In zone (warning: ${validation.distanceMeters}m from boundary)`;
    }
    return 'In zone';
  }

  if (validation.distanceMeters < 1000) {
    return `Out of zone (${validation.distanceMeters}m away)`;
  }

  // Convert to km if distance is large
  const distanceKm = (validation.distanceMeters / 1000).toFixed(1);
  return `Out of zone (${distanceKm}km away)`;
}

/**
 * Simulate geofence zone for testing
 * @returns Test zone in San Francisco
 */
export function getTestGeofenceZone(): GeofenceZone {
  return {
    id: 'test-zone-sf',
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 100,
  };
}

/**
 * Get warning distance for a zone
 * Warning distance is 50% of the zone radius
 */
export function getWarningDistance(radiusMeters: number): number {
  return radiusMeters * 0.5;
}

export default {
  calculateDistance,
  validateGeofence,
  validateMultipleGeofences,
  detectGeofenceViolation,
  getGeofenceStatus,
  getTestGeofenceZone,
  getWarningDistance,
};
