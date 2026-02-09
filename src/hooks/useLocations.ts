import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type {
  Location,
  GeofenceZone,
  CreateLocationRequest,
  UpdateLocationRequest,
  GeofenceValidationResult,
  GeolocationCoordinates,
} from '@/types'

export interface UseLocationsState {
  locations: Location[]
  selectedLocation: Location | null
  loading: boolean
  error: Error | null
}

const EARTH_RADIUS_METERS = 6371000

/**
 * Calculate distance between two points using Haversine formula (in meters)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180

  const dlat = toRad(lat2 - lat1)
  const dlon = toRad(lon2 - lon1)

  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dlon / 2) *
      Math.sin(dlon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

export const useLocations = (companyId?: string) => {
  const { user } = useAuth()
  const [state, setState] = useState<UseLocationsState>({
    locations: [],
    selectedLocation: null,
    loading: true,
    error: null,
  })

  // Fetch all locations for company
  const fetchLocations = useCallback(async (cId?: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      let query = supabase.from('locations').select('*')

      if (cId) {
        query = query.eq('company_id', cId)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) throw error

      setState((prev) => ({
        ...prev,
        locations: data || [],
        loading: false,
      }))
    } catch (error) {
      const err = error as Error
      setState((prev) => ({
        ...prev,
        error: err,
        loading: false,
      }))
    }
  }, [])

  // Get single location by ID
  const getLocation = useCallback(
    async (locationId: string): Promise<Location | null> => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching location:', error)
        return null
      }
    },
    []
  )

  // Get geofence zones for a location
  const getGeofenceZones = useCallback(
    async (locationId: string): Promise<GeofenceZone[]> => {
      try {
        const { data, error } = await supabase
          .from('geofence_zones')
          .select('*')
          .eq('location_id', locationId)
          .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching geofence zones:', error)
        return []
      }
    },
    []
  )

  // Validate if user is within geofence of location
  const validateGeofence = useCallback(
    async (
      locationId: string,
      userCoordinates: GeolocationCoordinates
    ): Promise<GeofenceValidationResult> => {
      try {
        const location = await getLocation(locationId)
        if (!location) {
          return {
            isValid: false,
            error: 'Location not found',
          }
        }

        // Calculate distance from user to location center
        const distance = calculateDistance(
          userCoordinates.latitude,
          userCoordinates.longitude,
          location.latitude,
          location.longitude
        )

        const isValid = distance <= location.radius_meters

        return {
          isValid,
          distance: Math.round(distance),
          zone: {
            id: location.id,
            location_id: location.id,
            latitude: location.latitude,
            longitude: location.longitude,
            radius_meters: location.radius_meters,
            created_at: location.created_at,
            updated_at: location.updated_at,
          },
          error: isValid
            ? undefined
            : `Outside geofence. Distance: ${Math.round(distance)}m, Allowed: ${location.radius_meters}m`,
        }
      } catch (error) {
        const err = error as Error
        return {
          isValid: false,
          error: `Geofence validation failed: ${err.message}`,
        }
      }
    },
    [getLocation]
  )

  // Create new location
  const createLocation = useCallback(
    async (locationData: CreateLocationRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('locations')
          .insert(locationData)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          locations: [...prev.locations, data],
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Update location
  const updateLocation = useCallback(
    async (locationId: string, updates: UpdateLocationRequest) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('locations')
          .update(updates)
          .eq('id', locationId)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          locations: prev.locations.map((loc) =>
            loc.id === locationId ? data : loc
          ),
        }))

        return { success: true, data }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Delete location
  const deleteLocation = useCallback(
    async (locationId: string) => {
      try {
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { error } = await supabase
          .from('locations')
          .delete()
          .eq('id', locationId)

        if (error) throw error

        setState((prev) => ({
          ...prev,
          locations: prev.locations.filter((loc) => loc.id !== locationId),
        }))

        return { success: true }
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [user]
  )

  // Set up real-time subscription
  useEffect(() => {
    const cId = companyId
    if (cId) {
      fetchLocations(cId)

      const channel = supabase
        .channel(`locations_company_${cId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'locations',
            filter: `company_id=eq.${cId}`,
          },
          () => {
            fetchLocations(cId)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [companyId, fetchLocations])

  return {
    ...state,
    getLocation,
    getGeofenceZones,
    validateGeofence,
    createLocation,
    updateLocation,
    deleteLocation,
    refetch: () => fetchLocations(companyId),
  }
}
