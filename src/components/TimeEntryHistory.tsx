import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { useTimeTracking, TimeEntry } from '@/hooks/useTimeTracking';

const TimeEntryHistory = () => {
  const { timeEntries, loading } = useTimeTracking();

  const formatDuration = (hours: number | null) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: TimeEntry['status']) => {
    switch (status) {
      case 'clocked_in':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-500">On Break</Badge>;
      case 'clocked_out':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateWeeklyHours = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return timeEntries
      .filter(entry => new Date(entry.created_at) >= oneWeekAgo)
      .reduce((total, entry) => total + (entry.total_hours || 0), 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Entry History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Summary
          </CardTitle>
          <CardDescription>Your time tracking for this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatDuration(calculateWeeklyHours())}
          </div>
          <p className="text-sm text-muted-foreground">Total hours worked</p>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Time Entries
          </CardTitle>
          <CardDescription>Your latest clock in/out activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time entries found</p>
                <p className="text-sm">Clock in to start tracking your time</p>
              </div>
            ) : (
              timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatDate(entry.clock_in)}</span>
                      {getStatusBadge(entry.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>In: {formatTime(entry.clock_in)}</span>
                      {entry.clock_out && (
                        <span> • Out: {formatTime(entry.clock_out)}</span>
                      )}
                    </div>
                    {entry.break_start && entry.break_end && (
                      <div className="text-xs text-muted-foreground">
                        Break: {formatDuration(entry.break_duration)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatDuration(entry.total_hours)}
                    </div>
                    {entry.status === 'clocked_in' && (
                      <div className="text-xs text-green-600">In Progress</div>
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

export default TimeEntryHistory;