/**
 * useGeofenceTracking Hook
 * Manages real-time geofence tracking and violation detection
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  validateGeofence,
  validateMultipleGeofences,
  detectGeofenceViolation,
  getGeofenceStatus,
  type Location,
  type GeofenceZone,
  type GeofenceValidationResult,
} from '@/utils/geofenceValidation';

export interface GeofenceTrackingState {
  currentLocation: Location | null;
  isTracking: boolean;
  error: string | null;
  validations: Map<string, GeofenceValidationResult>;
  violations: Array<{
    zoneId: string;
    type: 'left_zone' | 'outside_zone' | 'warning_distance';
    message: string;
    timestamp: Date;
  }>;
  inZones: string[];
}

const TRACKING_INTERVAL = 5000; // Update location every 5 seconds

export function useGeofenceTracking(
  employeeId: string | null,
  locationId: string | null,
  enabled: boolean = true
) {
  const [state, setState] = useState<GeofenceTrackingState>({
    currentLocation: null,
    isTracking: false,
    error: null,
    validations: new Map(),
    violations: [],
    inZones: [],
  });

  const trackingRef = useRef<NodeJS.Timer | null>(null);
  const previousLocationRef = useRef<Location | null>(null);

  // Fetch geofence zones for the location
  const { data: geofenceZones = [] } = useQuery({
    queryKey: ['geofence-zones', locationId],
    queryFn: async () => {
      if (!locationId) return [];

      const { data, error } = await supabase
        .from('geofence_zones')
        .select('*')
        .eq('location_id', locationId);

      if (error) {
        console.error('Error fetching geofence zones:', error);
        return [];
      }

      return (data || []).map(zone => ({
        id: zone.id,
        latitude: parseFloat(zone.latitude),
        longitude: parseFloat(zone.longitude),
        radiusMeters: zone.radius_meters,
        wifiBssid: zone.wifi_bssid,
      })) as GeofenceZone[];
    },
    enabled: !!locationId,
  });

  // Get current location
  const getCurrentLocation = async (): Promise<Location | null> => {
    try {
      return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          error => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  // Update location and check geofences
  const updateLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (!location) {
        setState(prev => ({
          ...prev,
          error: 'Unable to get location',
        }));
        return;
      }

      // Validate against all geofence zones
      const { results, inZones, closest } = validateMultipleGeofences(location, geofenceZones);

      // Detect violations
      const newViolations: typeof state.violations = [];
      for (const zone of geofenceZones) {
        const validation = results.get(zone.id);
        if (validation) {
          const violation = detectGeofenceViolation(previousLocationRef.current, location, zone);
          if (violation.violated) {
            newViolations.push({
              zoneId: zone.id,
              type: violation.type!,
              message: violation.message!,
              timestamp: new Date(),
            });

            // Log violation to database
            await logGeofenceViolation(
              employeeId!,
              locationId!,
              violation.type!,
              location,
              zone,
              validation.distanceMeters
            );
          }
        }
      }

      previousLocationRef.current = location;

      setState(prev => ({
        ...prev,
        currentLocation: location,
        validations: results,
        inZones,
        violations: [...(newViolations.length > 0 ? newViolations : prev.violations)],
        error: null,
      }));
    } catch (error) {
      console.error('Error updating location:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  // Log geofence violation to database
  const logGeofenceViolation = async (
    empId: string,
    locId: string,
    violationType: string,
    userLocation: Location,
    zone: GeofenceZone,
    distance: number
  ) => {
    try {
      await supabase.from('geofence_violations_log').insert({
        employee_id: empId,
        location_id: locId,
        violation_type: violationType,
        user_lat: userLocation.latitude,
        user_lng: userLocation.longitude,
        zone_lat: zone.latitude,
        zone_lng: zone.longitude,
        distance_meters: distance,
      });
    } catch (error) {
      console.error('Error logging geofence violation:', error);
    }
  };

  // Start/stop tracking
  useEffect(() => {
    if (!enabled || !employeeId || !locationId || geofenceZones.length === 0) {
      if (trackingRef.current) {
        clearInterval(trackingRef.current);
        trackingRef.current = null;
      }
      setState(prev => ({ ...prev, isTracking: false }));
      return;
    }

    setState(prev => ({ ...prev, isTracking: true }));

    // Initial location update
    updateLocation();

    // Set up interval for periodic updates
    trackingRef.current = setInterval(updateLocation, TRACKING_INTERVAL);

    return () => {
      if (trackingRef.current) {
        clearInterval(trackingRef.current);
        trackingRef.current = null;
      }
    };
  }, [enabled, employeeId, locationId, geofenceZones]);

  return {
    ...state,
    getCurrentLocation,
    updateLocation,
    geofenceZones,
  };
}

export default useGeofenceTracking;
