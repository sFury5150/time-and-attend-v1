import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useSchedules } from '@/hooks/useSchedules';

const ScheduleCalendar = () => {
  const { schedules, employees } = useSchedules();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.user_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return schedules.filter(schedule => 
      new Date(schedule.start_time).toDateString() === dateStr
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Schedule Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {monthYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const daySchedules = getSchedulesForDate(day);
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-1 border border-border/50 
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                  ${isToday ? 'ring-2 ring-primary' : ''}
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                  ${isToday ? 'text-primary font-bold' : ''}
                `}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map(schedule => (
                    <div
                      key={schedule.id}
                      className="text-xs p-1 rounded text-white truncate"
                      style={{ backgroundColor: getStatusColor(schedule.status) }}
                      title={`${schedule.title} - ${getEmployeeName(schedule.employee_id)}`}
                    >
                      <div className="font-medium truncate">{schedule.title}</div>
                      <div className="truncate opacity-90">
                        {getEmployeeName(schedule.employee_id)}
                      </div>
                    </div>
                  ))}
                  
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{daySchedules.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>No Show</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCalendar;