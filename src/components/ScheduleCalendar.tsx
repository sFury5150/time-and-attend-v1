import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchedules } from '@/hooks/useSchedules';

const ScheduleCalendar = () => {
  const { schedules, employees } = useSchedules();
  const calendarRef = useRef<FullCalendar>(null);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.user_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const events = schedules.map(schedule => ({
    id: schedule.id,
    title: `${schedule.title} - ${getEmployeeName(schedule.employee_id)}`,
    start: schedule.start_time,
    end: schedule.end_time,
    backgroundColor: schedule.status === 'scheduled' ? '#3b82f6' : 
                    schedule.status === 'completed' ? '#10b981' : 
                    schedule.status === 'cancelled' ? '#ef4444' : '#f59e0b',
    borderColor: 'transparent',
    textColor: 'white',
    extendedProps: {
      location: schedule.location,
      notes: schedule.notes,
      status: schedule.status,
      employeeName: getEmployeeName(schedule.employee_id)
    }
  }));

  const handleEventClick = (clickInfo: any) => {
    const { event } = clickInfo;
    const props = event.extendedProps;
    
    alert(`
Schedule: ${event.title}
Time: ${event.start?.toLocaleString()} - ${event.end?.toLocaleString()}
Location: ${props.location || 'Not specified'}
Status: ${props.status}
Notes: ${props.notes || 'None'}
    `);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            weekends={true}
            editable={false}
            selectable={false}
            selectMirror={true}
            dayHeaders={true}
            weekNumbers={false}
            navLinks={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '09:00',
              endTime: '17:00',
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCalendar;