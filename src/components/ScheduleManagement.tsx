import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Plus, Users } from 'lucide-react';
import { useSchedules, Schedule, Profile } from '@/hooks/useSchedules';
import { useToast } from '@/hooks/use-toast';

const ScheduleManagement = () => {
  const { schedules, employees, createSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSelectedEmployee('');
    setTitle('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setNotes('');
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !title || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await createSchedule({
      employee_id: selectedEmployee,
      title,
      start_time: startTime,
      end_time: endTime,
      location: location || undefined,
      notes: notes || undefined
    });

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Schedule created successfully.",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.user_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getStatusBadge = (status: Schedule['status']) => {
    const statusColors = {
      scheduled: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      no_show: 'bg-orange-500'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${statusColors[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schedule Management</h2>
          <p className="text-muted-foreground">Create and manage employee work schedules</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Schedule work hours for an employee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={employee.user_id}>
                        {employee.first_name} {employee.last_name} - {employee.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Shift Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning Shift, Sales Floor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time *</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Work location or department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or instructions"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => {
                const today = new Date().toDateString();
                return new Date(s.start_time).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date();
                weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
                const scheduleDate = new Date(s.start_time);
                return scheduleDate >= weekStart && scheduleDate <= weekEnd;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Schedules</CardTitle>
          <CardDescription>
            View and manage all scheduled shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No schedules found</p>
                <p className="text-sm">Create your first schedule to get started</p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{schedule.title}</h4>
                      {getStatusBadge(schedule.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{getEmployeeName(schedule.employee_id)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(schedule.start_time)} - {formatDateTime(schedule.end_time)}
                      </span>
                      {schedule.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {schedule.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatDuration(schedule.start_time, schedule.end_time)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(schedule.start_time).toLocaleDateString()}
                    </div>
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

export default ScheduleManagement;