import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, Users, Calendar } from 'lucide-react';

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive workforce analytics and reporting tools.
          </p>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">324.5h</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">+2.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hours/Employee</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">40.6h</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled vs Actual</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.1%</div>
              <p className="text-xs text-muted-foreground">Schedule adherence</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Reports
              </CardTitle>
              <CardDescription>
                Detailed time tracking and attendance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Daily Time Summary</h4>
                  <p className="text-sm text-muted-foreground">Employee hours by day</p>
                </div>
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Weekly Timesheet</h4>
                  <p className="text-sm text-muted-foreground">Detailed weekly breakdown</p>
                </div>
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Overtime Analysis</h4>
                  <p className="text-sm text-muted-foreground">Overtime trends and costs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Reports
              </CardTitle>
              <CardDescription>
                Schedule adherence and planning analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Schedule Compliance</h4>
                  <p className="text-sm text-muted-foreground">Adherence to planned schedules</p>
                </div>
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">No-Show Analysis</h4>
                  <p className="text-sm text-muted-foreground">Missed shifts tracking</p>
                </div>
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Schedule Efficiency</h4>
                  <p className="text-sm text-muted-foreground">Optimal scheduling insights</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Reports
              </CardTitle>
              <CardDescription>
                Employee performance and productivity metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Productivity Metrics</h4>
                  <p className="text-sm text-muted-foreground">Work efficiency analysis</p>
                </div>
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Department Summary</h4>
                  <p className="text-sm text-muted-foreground">Team performance overview</p>
                </div>
                <div className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <h4 className="font-medium">Trend Analysis</h4>
                  <p className="text-sm text-muted-foreground">Historical performance trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Advanced Reporting Coming Soon</h3>
              <p className="text-sm max-w-md mx-auto">
                We're building comprehensive reporting tools with charts, exports, and custom date ranges. 
                Stay tuned for detailed analytics and insights.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;