import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Clock, Users, Activity } from 'lucide-react';
import { useRealTimePresence } from '@/hooks/useRealTimePresence';

const LocationTracking = () => {
  const { activeEmployees, loading } = useRealTimePresence();

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-500 text-white">On Break</Badge>;
      default:
        return <Badge variant="secondary">Offline</Badge>;
    }
  };

  const getLocationString = (locationData: any) => {
    if (!locationData) return 'No location data';
    
    if (locationData.latitude && locationData.longitude) {
      return `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
    }
    
    return 'Location unavailable';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Location Tracking</h2>
          <p className="text-muted-foreground">Loading active employees...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Location Tracking</h2>
        <p className="text-muted-foreground">Real-time employee location and status monitoring</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeEmployees.filter(emp => emp.status === 'clocked_in').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {activeEmployees.filter(emp => emp.status === 'on_break').length}
            </div>
            <p className="text-xs text-muted-foreground">Taking a break</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {activeEmployees.length}
            </div>
            <p className="text-xs text-muted-foreground">Employees tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Employees List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Active Employee Locations
          </CardTitle>
          <CardDescription>
            Real-time tracking of employee locations and work status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active employees</p>
                <p className="text-sm">Employees will appear here when they clock in</p>
              </div>
            ) : (
              activeEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {employee.user_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          Employee #{employee.user_id.slice(0, 8)}
                        </h4>
                        {getStatusBadge(employee.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Time Entry • {employee.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium">
                      Clock in: {formatTime(employee.clock_in)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getLocationString(employee.location_data)}
                    </div>
                    {employee.break_start && employee.status === 'on_break' && (
                      <div className="text-xs text-yellow-600">
                        Break since: {formatTime(employee.break_start)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationTracking;