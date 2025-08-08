import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useSchedules } from '@/hooks/useSchedules';

const TimeTrackingAnalytics = () => {
  const { timeEntries } = useTimeTracking();
  const { schedules, employees } = useSchedules();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const getTimeRangeData = () => {
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setMonth(now.getMonth() - 3);
    }

    return timeEntries.filter(entry => 
      new Date(entry.created_at) >= startDate
    );
  };

  const filteredEntries = getTimeRangeData();

  const analytics = useMemo(() => {
    const totalHours = filteredEntries.reduce((sum, entry) => 
      sum + (entry.total_hours || 0), 0
    );

    const totalBreakHours = filteredEntries.reduce((sum, entry) => 
      sum + (entry.break_duration || 0), 0
    );

    const activeEmployees = new Set(filteredEntries.map(entry => entry.user_id)).size;

    const averageHoursPerDay = totalHours / 7; // Weekly average

    const overdueTimeEntries = filteredEntries.filter(entry => 
      entry.status === 'clocked_in' && 
      new Date(entry.clock_in).getTime() < Date.now() - (12 * 60 * 60 * 1000) // 12 hours
    ).length;

    return {
      totalHours: totalHours.toFixed(1),
      totalBreakHours: totalBreakHours.toFixed(1),
      activeEmployees,
      averageHoursPerDay: averageHoursPerDay.toFixed(1),
      overdueTimeEntries,
      productivityScore: Math.min(100, Math.round((totalHours / (activeEmployees * 40)) * 100)) // Assuming 40h work week
    };
  }, [filteredEntries]);

  const dailyHoursData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({
      day,
      hours: 0,
      employees: 0
    }));

    filteredEntries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      if (data[dayIndex]) {
        data[dayIndex].hours += entry.total_hours || 0;
        data[dayIndex].employees += 1;
      }
    });

    return data;
  }, [filteredEntries]);

  const statusData = useMemo(() => {
    const statuses = ['clocked_in', 'on_break', 'clocked_out'];
    return statuses.map(status => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: filteredEntries.filter(entry => entry.status === status).length,
      color: status === 'clocked_in' ? '#10b981' : 
             status === 'on_break' ? '#f59e0b' : '#6b7280'
    }));
  }, [filteredEntries]);

  const getEmployeeName = (userId: string) => {
    const employee = employees.find(emp => emp.user_id === userId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

  const topPerformers = useMemo(() => {
    const employeeHours = filteredEntries.reduce((acc, entry) => {
      const userId = entry.user_id;
      if (!acc[userId]) {
        acc[userId] = { hours: 0, entries: 0 };
      }
      acc[userId].hours += entry.total_hours || 0;
      acc[userId].entries += 1;
      return acc;
    }, {} as Record<string, { hours: number; entries: number }>);

    return Object.entries(employeeHours)
      .map(([userId, data]) => ({
        name: getEmployeeName(userId),
        hours: data.hours.toFixed(1),
        entries: data.entries
      }))
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
      .slice(0, 5);
  }, [filteredEntries, employees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Time Tracking Analytics</h2>
          <p className="text-muted-foreground">Monitor workforce productivity and attendance</p>
        </div>
        <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter') => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageHoursPerDay}h avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {employees.length} total employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.productivityScore}%</div>
            <Progress value={analytics.productivityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.overdueTimeEntries}</div>
            <p className="text-xs text-muted-foreground">Overdue clock-outs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Hours Breakdown</CardTitle>
            <CardDescription>Hours worked by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Status</CardTitle>
            <CardDescription>Current time tracking status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Employees with highest hours this {timeRange}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{performer.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{performer.hours}h</div>
                  <div className="text-xs text-muted-foreground">
                    {performer.entries} sessions
                  </div>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time tracking data available</p>
                <p className="text-sm">Start tracking time to see analytics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTrackingAnalytics;