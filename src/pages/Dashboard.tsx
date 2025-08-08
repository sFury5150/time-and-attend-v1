import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import TimeClockWidget from '@/components/TimeClockWidget';
import TimeEntryHistory from '@/components/TimeEntryHistory';
import ScheduleManagement from '@/components/ScheduleManagement';
import EmployeeManagement from '@/components/EmployeeManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, MapPin, BarChart3, Clock, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('employee');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch user profile to determine role
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data?.role) {
          setUserRole(data.role);
        }
      };
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isManager = ['manager', 'supervisor', 'admin'].includes(userRole);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Track your time and manage your workforce efficiently.
          </p>
        </div>

        <Tabs defaultValue="time-tracking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="time-tracking" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Tracking
            </TabsTrigger>
            {isManager && (
              <>
                <TabsTrigger value="schedules" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedules
                </TabsTrigger>
                <TabsTrigger value="employees" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Employees
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Reports
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="time-tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Time Clock Widget */}
              <div className="lg:col-span-1">
                <TimeClockWidget />
              </div>

              {/* Time Entry History */}
              <div className="lg:col-span-2">
                <TimeEntryHistory />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Currently clocked in</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7.5h</div>
                  <p className="text-xs text-muted-foreground">Total team hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Active work sites</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productivity</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98%</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isManager && (
            <>
              <TabsContent value="schedules">
                <ScheduleManagement />
              </TabsContent>

              <TabsContent value="employees">
                <EmployeeManagement />
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Reports & Analytics
                    </CardTitle>
                    <CardDescription>
                      View comprehensive workforce analytics and reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Reports feature coming soon</p>
                      <p className="text-sm">Advanced analytics and reporting tools will be available here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;