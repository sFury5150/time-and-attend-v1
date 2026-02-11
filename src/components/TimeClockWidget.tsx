import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, Square, Coffee, MapPin } from 'lucide-react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const TimeClockWidget = () => {
  const { currentEntry, clockIn, clockOut, startBreak, endBreak } = useTimeTracking();
  const { toast } = useToast();
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<any>(null);

  // Fetch employee linked to current user
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setEmployeeId(data.id);
    };
    fetchEmployeeId();
  }, [user]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location if supported
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, []);

  const handleClockIn = async () => {
    if (!employeeId) {
      toast({
        title: "Error",
        description: "No employee record found for your user.",
        variant: "destructive"
      });
      return;
    }
    const { error } = await clockIn(employeeId, location);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Clocked In",
        description: "You have successfully clocked in.",
      });
    }
  };

  const handleClockOut = async () => {
    const { error } = await clockOut();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Clocked Out",
        description: "You have successfully clocked out.",
      });
    }
  };

  const handleStartBreak = async () => {
    const { error } = await startBreak();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Break Started",
        description: "Your break has been recorded.",
      });
    }
  };

  const handleEndBreak = async () => {
    const { error } = await endBreak();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Break Ended",
        description: "You're back on the clock.",
      });
    }
  };

  const getStatusBadge = () => {
    if (!currentEntry) {
      return <Badge variant="secondary">Not Clocked In</Badge>;
    }
    
    switch (currentEntry.status) {
      case 'clocked_in':
        return <Badge className="bg-green-500">Clocked In</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-500">On Break</Badge>;
      default:
        return <Badge variant="secondary">Not Clocked In</Badge>;
    }
  };

  const getWorkingTime = () => {
    if (!currentEntry || !currentEntry.clock_in) return '00:00:00';
    
    const clockInTime = new Date(currentEntry.clock_in);
    const now = new Date();
    let totalMs = now.getTime() - clockInTime.getTime();
    
    // Subtract break time if on break
    if (currentEntry.break_start) {
      const breakStart = new Date(currentEntry.break_start);
      if (currentEntry.status === 'on_break') {
        totalMs -= (now.getTime() - breakStart.getTime());
      } else if (currentEntry.break_end) {
        const breakEnd = new Date(currentEntry.break_end);
        totalMs -= (breakEnd.getTime() - breakStart.getTime());
      }
    }
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mx-auto mb-2">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <CardTitle>Time Clock</CardTitle>
        <CardDescription>
          {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>
        
        {currentEntry && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Clock In:</span>
              <span className="text-sm font-mono">
                {new Date(currentEntry.clock_in).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Working Time:</span>
              <span className="text-lg font-mono font-bold text-primary">
                {getWorkingTime()}
              </span>
            </div>
          </div>
        )}

        {location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>Location tracking enabled</span>
          </div>
        )}

        <div className="space-y-2">
          {!currentEntry ? (
            <Button onClick={handleClockIn} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Clock In
            </Button>
          ) : (
            <div className="space-y-2">
              {currentEntry.status === 'clocked_in' && (
                <>
                  <Button onClick={handleStartBreak} variant="outline" className="w-full">
                    <Coffee className="w-4 h-4 mr-2" />
                    Start Break
                  </Button>
                  <Button onClick={handleClockOut} variant="destructive" className="w-full">
                    <Square className="w-4 h-4 mr-2" />
                    Clock Out
                  </Button>
                </>
              )}
              
              {currentEntry.status === 'on_break' && (
                <>
                  <Button onClick={handleEndBreak} variant="default" className="w-full">
                    <Pause className="w-4 h-4 mr-2" />
                    End Break
                  </Button>
                  <Button onClick={handleClockOut} variant="destructive" className="w-full">
                    <Square className="w-4 h-4 mr-2" />
                    Clock Out
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeClockWidget;