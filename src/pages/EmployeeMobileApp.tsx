/**
 * Employee Mobile App
 * Mobile-first interface for security guards to clock in/out with geofencing
 */

import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, AlertTriangle, Coffee, Info } from 'lucide-react';
import { useState } from 'react';

const EmployeeMobileApp = () => {
  const { user } = useAuth();
  const [isClocked, setIsClocked] = useState(false);
  const [onBreak, setOnBreak] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md mx-4 p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">
            Please sign in to access the mobile app.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Mobile Time Tracking</h1>
          <p className="text-slate-400">Clock in/out with geofencing verification</p>
        </div>

        {/* Main Status Card */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="text-center space-y-4">
            <div className="text-5xl font-bold text-blue-400">
              {isClocked ? <Clock className="w-16 h-16 mx-auto" /> : <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500" />}
            </div>
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className="text-2xl font-bold">{isClocked ? 'CLOCKED IN' : 'CLOCKED OUT'}</p>
            </div>
            {isClocked && <p className="text-slate-400">Time elapsed: 2h 45m</p>}
          </div>
        </Card>

        {/* Location Status */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm text-slate-400">Location Status</p>
              <p className="text-green-400 font-medium">In approved zone</p>
              <p className="text-xs text-slate-500">Main Office - 12m away</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => setIsClocked(!isClocked)}
            className={`w-full h-16 text-lg font-bold ${
              isClocked 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isClocked ? 'Clock Out' : 'Clock In'}
          </Button>
          
          {isClocked && (
            <Button 
              onClick={() => setOnBreak(!onBreak)}
              variant="secondary"
              className="w-full h-12"
            >
              <Coffee className="w-5 h-5 mr-2" />
              {onBreak ? 'End Break' : 'Take Break'}
            </Button>
          )}
        </div>

        {/* Break Status */}
        {onBreak && (
          <Alert className="bg-blue-900 border-blue-700">
            <Coffee className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              You are currently on break. Elapsed: 12 minutes
            </AlertDescription>
          </Alert>
        )}

        {/* Info Section */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">User</span>
              <span className="text-slate-200">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">App Version</span>
              <span className="text-slate-200">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Sync</span>
              <span className="text-slate-200">Just now</span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 py-4 border-t border-slate-700">
          <p>Time & Attendance System</p>
          <p>Mobile Edition</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMobileApp;
