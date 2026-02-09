/**
 * Manager Dashboard
 * Real-time view of employee status, attendance, and geofence violations
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useEmployees } from '@/hooks/useEmployees';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
  BarChart,
  Map,
  Users,
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface EmployeeStatus {
  id: string;
  name: string;
  role: string;
  status: 'on_duty' | 'clocked_out' | 'on_break';
  clockInTime?: string;
  clockOutTime?: string;
  location?: string;
  geofenceStatus: 'in_zone' | 'warning' | 'out_of_zone';
}

interface GeofenceViolation {
  id: string;
  employee: string;
  location: string;
  type: string;
  timestamp: string;
  distance: number;
}

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { companies } = useCompanies();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  const { employees } = useEmployees(companyId);

  // Fetch time entries for all employees
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ['time-entries-all', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .in(
          'employee_id',
          employees.map(e => e.id)
        )
        .order('clock_in_time', { ascending: false });

      if (error) {
        console.error('Error fetching time entries:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!companyId && employees.length > 0,
  });

  // Fetch geofence violations
  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ['geofence-violations', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('geofence_violations_log')
        .select('*, employee_id, location_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching violations:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!companyId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Set company ID from user's company
  useEffect(() => {
    if (companies.length > 0) {
      const userCompany = companies.find(c => c.owner_id === user?.id);
      if (userCompany) {
        setCompanyId(userCompany.id);
      }
    }
  }, [companies, user]);

  // Build employee statuses from time entries
  useEffect(() => {
    const statuses = employees.map(emp => {
      const latestEntry = timeEntries.find(te => te.employee_id === emp.id);
      const status = latestEntry?.status === 'active' ? 'on_duty' : 'clocked_out';

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        status,
        clockInTime: latestEntry?.clock_in_time
          ? new Date(latestEntry.clock_in_time).toLocaleTimeString()
          : undefined,
        clockOutTime: latestEntry?.clock_out_time
          ? new Date(latestEntry.clock_out_time).toLocaleTimeString()
          : undefined,
        geofenceStatus: latestEntry?.geofence_validated ? 'in_zone' : 'out_of_zone',
      };
    });

    setEmployeeStatuses(statuses);
  }, [employees, timeEntries]);

  // Calculate metrics
  const onDutyCount = employeeStatuses.filter(s => s.status === 'on_duty').length;
  const clockedOutCount = employeeStatuses.filter(s => s.status === 'clocked_out').length;
  const violationCount = violations.length;

  const isLoading = timeEntriesLoading || violationsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">Real-time employee monitoring and analytics</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Duty</p>
                <p className="text-3xl font-bold mt-2">{onDutyCount}</p>
              </div>
              <Clock className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clocked Out</p>
                <p className="text-3xl font-bold mt-2">{clockedOutCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Violations</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{violationCount}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-3xl font-bold mt-2">{employees.length}</p>
              </div>
              <Users className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Employee Status</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
            <TabsTrigger value="logs">Activity Log</TabsTrigger>
          </TabsList>

          {/* Employee Status Tab */}
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading employee data...</p>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Geofence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeStatuses.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="capitalize text-sm">{emp.role}</TableCell>
                        <TableCell>
                          <Badge
                            variant={emp.status === 'on_duty' ? 'default' : 'secondary'}
                            className={
                              emp.status === 'on_duty'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-600 hover:bg-gray-700'
                            }
                          >
                            {emp.status === 'on_duty' ? 'ON DUTY' : 'CLOCKED OUT'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {emp.clockInTime || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              emp.geofenceStatus === 'in_zone'
                                ? 'bg-green-50 text-green-700 border-green-300'
                                : 'bg-red-50 text-red-700 border-red-300'
                            }
                          >
                            {emp.geofenceStatus === 'in_zone' ? '✓ In Zone' : '✗ Out'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Violations Tab */}
          <TabsContent value="violations" className="space-y-4">
            {violationCount === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-muted-foreground">No geofence violations recorded</p>
              </Card>
            ) : (
              <Card>
                <div className="p-6">
                  <div className="space-y-4">
                    {violations.slice(0, 10).map(violation => {
                      const employee = employees.find(
                        e => e.id === violation.employee_id
                      );
                      return (
                        <Alert
                          key={violation.id}
                          className="border-l-4 border-l-red-500 bg-red-50"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <span className="font-semibold">{employee?.name}</span> violated
                            geofence at{' '}
                            <span className="font-mono text-sm">
                              {new Date(violation.created_at).toLocaleString()}
                            </span>
                            . Distance: {Math.round(violation.distance_meters)}m
                          </AlertDescription>
                        </Alert>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.slice(0, 20).map(entry => {
                    const employee = employees.find(e => e.id === entry.employee_id);
                    const action = entry.status === 'active' ? 'Clock In' : 'Clock Out';
                    const time = entry.status === 'active'
                      ? new Date(entry.clock_in_time).toLocaleTimeString()
                      : new Date(entry.clock_out_time).toLocaleTimeString();
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{employee?.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={action === 'Clock In' ? 'default' : 'secondary'}
                            className={
                              action === 'Clock In'
                                ? 'bg-green-600'
                                : 'bg-blue-600'
                            }
                          >
                            {action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{time}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.geofence_validated ? '✓ Verified' : '✗ Unverified'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
