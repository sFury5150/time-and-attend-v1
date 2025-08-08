import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MapPin, BarChart3, Clock, Building, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome to your workforce management dashboard.
          </p>
        </div>

        {/* Key Metrics with mobile-optimized grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">184.5h</div>
              <p className="text-xs text-muted-foreground">Across all employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">Above target</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions with mobile-optimized grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Tracking
              </CardTitle>
              <CardDescription>
                Track employee work hours and breaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Currently Active:</span>
                  <span className="text-sm font-medium">12 employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">On Break:</span>
                  <span className="text-sm font-medium">3 employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Clocked Out:</span>
                  <span className="text-sm font-medium">8 employees</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                View and manage today's shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Morning Shifts:</span>
                  <span className="text-sm font-medium">8 scheduled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Afternoon Shifts:</span>
                  <span className="text-sm font-medium">12 scheduled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Evening Shifts:</span>
                  <span className="text-sm font-medium">6 scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Overview
              </CardTitle>
              <CardDescription>
                Real-time employee locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Main Office:</span>
                  <span className="text-sm font-medium">15 employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Remote:</span>
                  <span className="text-sm font-medium">6 employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Field Work:</span>
                  <span className="text-sm font-medium">2 employees</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest employee clock-ins, schedule changes, and system updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-3 p-4 md:p-3 border rounded-lg touch-manipulation">
                <div className="w-10 h-10 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 md:w-4 md:h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">John Smith clocked in</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago • Main Office</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 md:p-3 border rounded-lg touch-manipulation">
                <div className="w-10 h-10 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 md:w-4 md:h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Schedule updated for tomorrow</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago • 3 employees affected</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 md:p-3 border rounded-lg touch-manipulation">
                <div className="w-10 h-10 md:w-8 md:h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 md:w-4 md:h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">New employee onboarded</p>
                  <p className="text-xs text-muted-foreground">1 hour ago • Sarah Johnson joined Sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;