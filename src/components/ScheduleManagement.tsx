import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Plus, Users, CalendarDays, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchedules, Schedule, Profile } from '@/hooks/useSchedules';
import { useToast } from '@/hooks/use-toast';
import ScheduleCalendar from './ScheduleCalendar';

interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
}

const ScheduleManagement = () => {
  const { schedules, employees, createSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      notes: ''
    }
  ]);

  const resetForm = () => {
    setSelectedEmployee('');
    setShifts([
      {
        id: '1',
        title: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: ''
      }
    ]);
  };

  const addShift = () => {
    const newShift: Shift = {
      id: Date.now().toString(),
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      notes: ''
    };
    setShifts([...shifts, newShift]);
  };

  const removeShift = (shiftId: string) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter(shift => shift.id !== shiftId));
    }
  };

  const updateShift = (shiftId: string, field: keyof Shift, value: string) => {
    setShifts(shifts.map(shift => 
      shift.id === shiftId ? { ...shift, [field]: value } : shift
    ));
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee.",
        variant: "destructive"
      });
      return;
    }

    // Validate all shifts
    for (const shift of shifts) {
      if (!shift.title || !shift.startTime || !shift.endTime) {
        toast({
          title: "Error",
          description: "Please fill in all required fields for all shifts.",
          variant: "destructive"
        });
        return;
      }
    }

    // Create all shifts
    try {
      for (const shift of shifts) {
        const { error } = await createSchedule({
          employee_id: selectedEmployee,
          title: shift.title,
          start_time: shift.startTime,
          end_time: shift.endTime,
          location: shift.location || undefined,
          notes: shift.notes || undefined
        });

        if (error) {
          toast({
            title: "Error",
            description: `Failed to create shift "${shift.title}": ${error}`,
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: `Successfully created ${shifts.length} shift${shifts.length > 1 ? 's' : ''}.`,
      });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating schedules.",
        variant: "destructive"
      });
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
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Schedule one or multiple shifts for an employee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-6">
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Shifts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addShift}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Shift
                  </Button>
                </div>

                {shifts.map((shift, index) => (
                  <Card key={shift.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Shift {index + 1}</h4>
                      {shifts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeShift(shift.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Shift Title *</Label>
                        <Input
                          value={shift.title}
                          onChange={(e) => updateShift(shift.id, 'title', e.target.value)}
                          placeholder="e.g., Morning Shift, Sales Floor"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time *</Label>
                          <Input
                            type="datetime-local"
                            value={shift.startTime}
                            onChange={(e) => updateShift(shift.id, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time *</Label>
                          <Input
                            type="datetime-local"
                            value={shift.endTime}
                            onChange={(e) => updateShift(shift.id, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          value={shift.location}
                          onChange={(e) => updateShift(shift.id, 'location', e.target.value)}
                          placeholder="Work location or department"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={shift.notes}
                          onChange={(e) => updateShift(shift.id, 'notes', e.target.value)}
                          placeholder="Additional notes or instructions"
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create {shifts.length} Shift{shifts.length > 1 ? 's' : ''}
                </Button>
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

      {/* Schedule Views */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
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
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-6">
          <ScheduleCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleManagement;