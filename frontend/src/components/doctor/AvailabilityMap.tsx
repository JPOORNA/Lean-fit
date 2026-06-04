'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tooltip, 
  CircularProgress,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarViewMonth, 
  CalendarViewWeek,
  Close
} from '@mui/icons-material';
import { api, ClientSessionSchedule, DoctorSettings, Appointment } from '@/lib/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface AvailabilityMapProps {
  doctorTz?: string;
  standalone?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export default function AvailabilityMap({ doctorTz = 'UTC', standalone = false, open, onClose }: AvailabilityMapProps) {
  const [schedules, setSchedules] = useState<ClientSessionSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(dayjs().tz(doctorTz));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schedulesRes, settingsRes, appointmentsRes] = await Promise.all([
          api.listAllClientSessions(),
          api.getDoctorSettings(),
          api.listDoctorAppointments()
        ]);
        setSchedules(schedulesRes.schedules);
        setSettings(settingsRes);
        setAppointments(appointmentsRes.appointments);
      } catch (err) {
        console.error('Failed to fetch availability data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isAvailable = (day: number, hour: number) => {
    if (!settings) return false;
    const daySchedule = settings.weeklyAvailability.find(a => a.dayOfWeek === day);
    if (!daySchedule) return false;
    
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    const nextHourStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

    return daySchedule.workingHours.some(wh => wh.start <= hourStr && wh.end >= nextHourStr);
  };

  const getOccupiedSessions = (day: number, hour: number, refDate: dayjs.Dayjs) => {
    const targetStart = refDate.add(day, 'day').hour(hour).startOf('hour');
    const targetEnd = targetStart.add(1, 'hour');

    return schedules.filter(schedule => {
      const scheduleTz = schedule.timezone || 'UTC';
      return schedule.timeSlots.some(slot => {
        if (slot.dayOfWeek !== day) return false;
        const slotDate = refDate.add(slot.dayOfWeek, 'day').format('YYYY-MM-DD');
        const slotStart = dayjs.tz(`${slotDate} ${slot.startTime}`, 'YYYY-MM-DD HH:mm', scheduleTz).tz(doctorTz);
        const slotEnd = dayjs.tz(`${slotDate} ${slot.endTime}`, 'YYYY-MM-DD HH:mm', scheduleTz).tz(doctorTz);
        return slotStart.isBefore(targetEnd) && slotEnd.isAfter(targetStart);
      });
    });
  };

  const getOneOffAppointments = (day: number, hour: number, refDate: dayjs.Dayjs) => {
    const targetStart = refDate.add(day, 'day').hour(hour).startOf('hour');
    const targetEnd = targetStart.add(1, 'hour');

    return appointments.filter(apt => {
      if (apt.type !== 'one_off') return false;
      const aptStart = dayjs(apt.startTime).tz(doctorTz);
      const aptEnd = dayjs(apt.endTime).tz(doctorTz);
      return aptStart.isBefore(targetEnd) && aptEnd.isAfter(targetStart);
    });
  };

  const renderWeekView = () => {
    const refSunday = currentDate.startOf('week').startOf('day');
    
    return (
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 800, display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 0 }}>
          <Box />
          {DAYS.map((day, i) => (
            <Box key={day} sx={{ p: 1, textAlign: 'center', borderBottom: '2px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{day}</Typography>
              <Typography variant="caption" color="text.secondary">
                {refSunday.add(i, 'day').format('MMM DD')}
              </Typography>
            </Box>
          ))}

          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1, fontSize: '0.75rem', color: 'text.secondary', height: 40 }}>
                {dayjs().hour(hour).startOf('hour').format('hh:mm A')}
              </Box>

              {DAYS.map((_, dayIndex) => {
                const sessions = getOccupiedSessions(dayIndex, hour, refSunday);
                const oneOffs = getOneOffAppointments(dayIndex, hour, refSunday);
                const available = isAvailable(dayIndex, hour);

                let bgColor = 'transparent';
                if (sessions.length > 0) bgColor = '#4caf50';
                else if (oneOffs.length > 0) bgColor = '#d32f2f';
                else if (available) bgColor = '#ffebee';

                const tooltipTitle = sessions.length > 0 
                  ? `Session: ${sessions.map(s => (typeof s.userId === 'object' ? (s.userId as any).name : 'Client')).join(', ')}`
                  : (oneOffs.length > 0 
                      ? `Appointment: ${oneOffs.map(a => (typeof a.userId === 'object' ? (a.userId as any).name : 'Client')).join(', ')}`
                      : (available ? 'Available Slot' : 'Free')
                    );

                return (
                  <Tooltip key={dayIndex} title={tooltipTitle} arrow>
                    <Box sx={{ 
                      height: 40, 
                      bgcolor: bgColor,
                      color: (sessions.length || oneOffs.length) ? 'white' : 'inherit',
                      border: '1px solid',
                      borderColor: 'divider',
                      ml: dayIndex === 0 ? 0 : '-1px',
                      mt: hour === 0 ? 0 : '-1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'default',
                      '&:hover': {
                        bgcolor: sessions.length ? '#388e3c' : (oneOffs.length ? '#b71c1c' : (available ? '#ffcdd2' : 'action.hover')),
                      }
                    }}>
                      {(sessions.length > 0 || oneOffs.length > 0) && (
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', px: 0.5 }}>
                          {sessions.length > 0 
                            ? (sessions.length === 1 ? (typeof sessions[0].userId === 'object' ? (sessions[0].userId as any).name : 'SESSION') : `${sessions.length} SESSIONS`)
                            : (oneOffs.length === 1 ? (typeof oneOffs[0].userId === 'object' ? (oneOffs[0].userId as any).name : 'APP') : `${oneOffs.length} APPS`)
                          }
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDay = startOfMonth.startOf('week');
    const endDay = endOfMonth.endOf('week');

    const calendarDays = [];
    let day = startDay;
    while (day.isBefore(endDay)) {
      calendarDays.push(day);
      day = day.add(1, 'day');
    }

    return (
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <Box sx={{ minWidth: { xs: 650, sm: 'auto' }, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {DAYS.map(d => (
            <Box key={d} sx={{ p: 1, textAlign: 'center', fontWeight: 800, bgcolor: 'background.default', borderRadius: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {d}
            </Box>
          ))}
          {calendarDays.map((date, i) => {
            const isCurrentMonth = date.month() === currentDate.month();
            const dayIndex = date.day();
            
            // Get summary for the day
            const daySessions = schedules.filter(s => s.daysOfWeek.includes(dayIndex));
            const dayOneOffs = appointments.filter(a => a.type === 'one_off' && dayjs(a.startTime).tz(doctorTz).isSame(date, 'day'));
            
            const totalEvents = daySessions.length + dayOneOffs.length;
  
            return (
              <Paper 
                key={i} 
                variant="outlined" 
                sx={{ 
                  minHeight: 100, 
                  p: 1, 
                  opacity: isCurrentMonth ? 1 : 0.3,
                  bgcolor: date.isSame(dayjs(), 'day') ? 'primary.lighter' : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{date.date()}</Typography>
                {daySessions.map((s, idx) => (
                  <Box key={idx} sx={{ bgcolor: '#4caf50', color: 'white', px: 0.5, borderRadius: 0.5, fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                     {typeof s.userId === 'object' ? s.userId.name : 'Session'}
                  </Box>
                ))}
                {dayOneOffs.map((a, idx) => (
                  <Box key={idx} sx={{ bgcolor: '#d32f2f', color: 'white', px: 0.5, borderRadius: 0.5, fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                     {typeof a.userId === 'object' ? a.userId.name : 'App'}
                  </Box>
                ))}
              </Paper>
            );
          })}
        </Box>
      </Box>
    );
  };

  const content = (
    <Box>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' }, 
        gap: 2 
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: 2,
          flexGrow: 1
        }}>
          {!open && (
            <Typography variant="h5" sx={{ fontWeight: 900, textAlign: { xs: 'center', sm: 'left' } }}>
              Availability Map
            </Typography>
          )}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            p: 0.5, 
            border: '1px solid', 
            borderColor: 'divider',
            flexGrow: { xs: 1, sm: 0 }
          }}>
            <IconButton onClick={() => setCurrentDate(currentDate.subtract(1, viewMode))} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography sx={{ px: 2, fontWeight: 700, minWidth: { xs: 'auto', sm: 150 }, flexGrow: 1, textAlign: 'center', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
              {viewMode === 'week' 
                ? `${currentDate.startOf('week').format('MMM DD')} - ${currentDate.endOf('week').format('MMM DD, YYYY')}`
                : currentDate.format('MMMM YYYY')
              }
            </Typography>
            <IconButton onClick={() => setCurrentDate(currentDate.add(1, viewMode))} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          size="small"
          color="primary"
          sx={{ display: 'flex', width: { xs: '100%', md: 'auto' } }}
        >
          <ToggleButton value="week" sx={{ px: 2, flexGrow: { xs: 1, md: 0 } }}>
            <CalendarViewWeek sx={{ mr: 1, fontSize: 20 }} /> Week
          </ToggleButton>
          <ToggleButton value="month" sx={{ px: 2, flexGrow: { xs: 1, md: 0 } }}>
            <CalendarViewMonth sx={{ mr: 1, fontSize: 20 }} /> Month
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        viewMode === 'week' ? renderWeekView() : renderMonthView()
      )}
    </Box>
  );

  if (open) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Availability Map</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return standalone ? content : (
    <Box sx={{ p: 3 }}>
      {content}
    </Box>
  );
}
