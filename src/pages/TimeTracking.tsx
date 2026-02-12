import DashboardLayout from '@/components/DashboardLayout';
import TimeClockWidget from '@/components/TimeClockWidget';
import TimeEntryHistory from '@/components/TimeEntryHistory';
import TimeTrackingAnalytics from '@/components/TimeTrackingAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, BarChart3, History } from 'lucide-react';

const TimeTracking = () => {
  console.log('🦊 TimeTracking page loaded');
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
          <p className="text-muted-foreground">Track work hours and monitor productivity</p>
        </div>

        <Tabs defaultValue="clock" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clock" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Clock
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clock" className="mt-6">
            <TimeClockWidget />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <TimeEntryHistory />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <TimeTrackingAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TimeTracking;