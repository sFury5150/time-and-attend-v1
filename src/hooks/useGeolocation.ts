import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  GeolocationCoordinates,
  LocationPermissionError,
  LocationUnavailableError,
} from '@/types'

interface UseGeolocationState {
  coordinates: GeolocationCoordinates | null
  loading: boolean
  error: Error | null
}

export const useGeolocation = () => {
  const [state, setState] = useState<UseGeolocationState>({
    coordinates: null,
    loading: false,
    error: null,
  })

  const watchIdRef = useRef<number | null>(null)

  // Request user's current location once
  const getLocation = useCallback(async (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser')
        setState((prev) => ({ ...prev, error }))
        reject(error)
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          }

          setState((prev) => ({
            ...prev,
            coordinates,
            loading: false,
            error: null,
          }))

          resolve(coordinates)
        },
        (error) => {
          let appError: Error

          switch (error.code) {
            case error.PERMISSION_DENIED:
              appError = new Error('Location permission denied. Please enable location access in your browser settings.')
              break
            case error.POSITION_UNAVAILABLE:
              appError = new Error('Location information is unavailable. Please ensure GPS is enabled.')
              break
            case error.TIMEOUT:
              appError = new Error('Location request timed out. Please try again.')
              break
            default:
              appError = new Error('An error occurred while retrieving your location.')
          }

          setState((prev) => ({
            ...prev,
            loading: false,
            error: appError,
          }))

          reject(appError)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  // Watch user's location in real-time
  const watchLocation = useCallback((
    onLocationChange?: (coords: GeolocationCoordinates) => void
  ): (() => void) => {
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser')
      setState((prev) => ({ ...prev, error }))
      return () => {}
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        }

        setState((prev) => ({
          ...prev,
          coordinates,
          loading: false,
          error: null,
        }))

        onLocationChange?.(coordinates)
      },
      (error) => {
        let appError: Error

        switch (error.code) {
          case error.PERMISSION_DENIED:
            appError = new Error('Location permission denied.')
            break
          case error.POSITION_UNAVAILABLE:
            appError = new Error('Location information is unavailable.')
            break
          case error.TIMEOUT:
            appError = new Error('Location request timed out.')
            break
          default:
            appError = new Error('An error occurred while retrieving your location.')
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: appError,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Return cleanup function
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    ...state,
    getLocation,
    watchLocation,
  }
}
