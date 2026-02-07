/**
 * Employee Mobile App
 * Mobile-first interface for security guards to clock in/out with geofencing
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useGeofenceTracking } from '@/hooks/useGeofenceTracking';
import { useBreakManagement } from '@/hooks/useBreakManagement';
import { useLocations } from '@/hooks/useLocations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Clock,
  AlertTriangle,
  Coffee,
  Info,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const EmployeeMobileApp = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Fetch employee data
  const { employees, isLoading: employeesLoading } = useEmployees(companyId);
  const currentEmployee = employees.find(e => e.user_id === user?.id);

  // Fetch locations
  const { locations, isLoading: locationsLoading } = useLocations(companyId);
  const currentLocation = locations[0]; // Use first location for now

  // Time tracking
  const { clockIn, clockOut, currentTimeEntry, isLoading: trackingLoading } = useTimeTracking(
    currentEmployee?.id
  );

  // Geofence tracking
  const { currentLocation: gpsLocation, inZones, validations } = useGeofenceTracking(
    currentEmployee?.id,
    currentLocation?.id,
    !!currentTimeEntry
  );

  // Break management
  const {
    startBreak,
    endBreak,
    currentBreak,
    isBreakActive,
    elapsedMinutes,
  } = useBreakManagement(currentEmployee?.id, currentTimeEntry?.id);

  useEffect(() => {
    // Set company ID from first employee
    if (currentEmployee?.company_id) {
      setCompanyId(currentEmployee.company_id);
    }
  }, [currentEmployee]);

  if (employeesLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md mx-4 p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">No Employee Found</h1>
          <p className="text-gray-600 mb-4">
            Your user account is not linked to an employee record.
          </p>
          <p className="text-sm text-gray-500">Please contact your administrator.</p>
        </Card>
      </div>
    );
  }

  const isClockingIn = currentTimeEntry?.status === 'active' && !currentTimeEntry?.clock_out_time;
  const geofenceStatus = currentLocation
    ? validations.get(currentLocation.id)
    : null;
  const isInZone = inZones.length > 0;
  const isWarning = geofenceStatus?.isWarningDistance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-lg p-4 border border-slate-700">
          <h1 className="text-2xl font-bold mb-1">{currentEmployee.name}</h1>
          <p className="text-slate-400 text-sm">{currentEmployee.role.toUpperCase()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto space-y-4">
        {/* Clock In/Out Section */}
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          <div className="p-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {isClockingIn ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">CLOCKED IN</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">CLOCKED OUT</span>
                  </>
                )}
              </div>
              {currentTimeEntry?.clock_in_time && (
                <span className="text-xs text-slate-400">
                  {new Date(currentTimeEntry.clock_in_time).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Main Clock Button */}
            <Button
              size="lg"
              onClick={() => (isClockingIn ? clockOut() : clockIn(gpsLocation || undefined))}
              disabled={trackingLoading || !isInZone}
              className={`w-full py-8 mb-4 text-xl font-bold ${
                isClockingIn
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {trackingLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Processing...
                </>
              ) : isClockingIn ? (
                <>
                  <Clock className="w-6 h-6 mr-2" />
                  CLOCK OUT
                </>
              ) : (
                <>
                  <Clock className="w-6 h-6 mr-2" />
                  CLOCK IN
                </>
              )}
            </Button>

            {/* Geofence Warning */}
            {!isInZone && (
              <Alert className="bg-red-900 border-red-700 mb-4">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200">
                  You are outside the designated work zone. Clock in/out is disabled.
                </AlertDescription>
              </Alert>
            )}

            {isInZone && isWarning && (
              <Alert className="bg-yellow-900 border-yellow-700 mb-4">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  Warning: You are near the zone boundary.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="location" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="location" className="text-xs sm:text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </TabsTrigger>
            <TabsTrigger value="break" className="text-xs sm:text-sm">
              <Coffee className="w-4 h-4 mr-1" />
              Break
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs sm:text-sm">
              <Info className="w-4 h-4 mr-1" />
              Info
            </TabsTrigger>
          </TabsList>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Current Location</p>
                  {gpsLocation ? (
                    <>
                      <p className="text-lg font-mono">
                        {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                      </p>
                      {gpsLocation.accuracy && (
                        <p className="text-sm text-slate-400 mt-1">
                          Accuracy: ±{Math.round(gpsLocation.accuracy)}m
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500">Getting location...</p>
                  )}
                </div>

                {currentLocation && geofenceStatus && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Geofence Status</p>
                    <div className="flex items-center gap-2">
                      {isInZone ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {isInZone
                          ? `In zone (${geofenceStatus.distanceMeters}m from boundary)`
                          : `Outside zone (${geofenceStatus.distanceMeters}m away)`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Break Tab */}
          <TabsContent value="break" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="space-y-4">
                {isClockingIn ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Break Status</p>
                      {isBreakActive ? (
                        <>
                          <p className="text-2xl font-bold text-blue-400">{elapsedMinutes}m</p>
                          <p className="text-sm text-slate-400">Break in progress</p>
                        </>
                      ) : (
                        <p className="text-slate-500">No active break</p>
                      )}
                    </div>

                    <Button
                      onClick={() => (isBreakActive ? endBreak() : startBreak('break'))}
                      variant={isBreakActive ? 'destructive' : 'default'}
                      className="w-full"
                    >
                      <Coffee className="w-4 h-4 mr-2" />
                      {isBreakActive ? 'End Break' : 'Start Break'}
                    </Button>
                  </>
                ) : (
                  <Alert className="bg-blue-900 border-blue-700">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-200">
                      Clock in first to manage breaks.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Employee ID</p>
                  <p className="font-mono text-xs text-slate-300">{currentEmployee.id}</p>
                </div>
                <div>
                  <p className="text-slate-400">Company</p>
                  <p className="text-slate-300">{currentEmployee.company_id}</p>
                </div>
                {currentLocation && (
                  <div>
                    <p className="text-slate-400">Work Location</p>
                    <p className="text-slate-300">{currentLocation.name}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 py-4">
          <p>Time & Attendance System</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMobileApp;
