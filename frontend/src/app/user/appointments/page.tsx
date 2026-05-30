'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  VideoCall,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { api, Appointment, GroupSessionBookingItem } from '@/lib/api';
import { isAfter, isBefore, subMinutes } from 'date-fns';
import { formatInTimeZone, getDateKeyInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';
import PolicyLinks from '@/components/public/PolicyLinks';

export default function UserAppointmentsPage() {
  const formatPrice = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupSessions, setGroupSessions] = useState<GroupSessionBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [appointmentRes, groupRes] = await Promise.all([
        api.listMyAppointments(),
        api.listMyGroupSessions()
      ]);
      setAppointments(appointmentRes.appointments);
      const tz = user?.timezone || 'UTC';
      const todayStr = getDateKeyInTimeZone(new Date(), tz);
      setGroupSessions(groupRes.bookings.filter((booking) => getDateKeyInTimeZone(booking.slot.startTime, tz) >= todayStr));
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchAppointments());
  }, []);

  const canJoin = (appointment: Appointment) => {
    if (appointment.sessionStatus !== 'in_progress') return false;
    const now = new Date();
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    return isAfter(now, subMinutes(start, 5)) && isBefore(now, end);
  };

  const canJoinGroup = (slot: GroupSessionBookingItem['slot']) => slot.status === 'in_progress';

  const handleJoin = (roomName?: string) => {
    if (roomName) router.push(`/meeting/${roomName}`);
  };

  return (
    <Box>
      <PageContainer>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            startIcon={<Refresh />} 
            onClick={fetchAppointments}
            disabled={loading}
          >
            Refresh List
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatInTimeZone(apt.startTime, user?.timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatInTimeZone(apt.startTime, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })} - {formatInTimeZone(apt.endTime, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={apt.type.replace('_', ' ').toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={apt.paymentStatus.toUpperCase()} 
                        size="small" 
                        color={
                          apt.paymentStatus === 'paid' ? 'success' : 
                          apt.paymentStatus === 'failed' ? 'error' : 
                          'warning'
                        }
                      />
                      {apt.paymentStatus !== 'paid' && (
                        <IconButton size="small" onClick={async () => {
                          try {
                            await api.refreshPaymentStatus(apt._id);
                            fetchAppointments();
                          } catch {
                            alert('Failed to refresh payment');
                          }
                        }}>
                          <Refresh fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={apt.sessionStatus.toUpperCase()} 
                      size="small" 
                      color={
                        apt.sessionStatus === 'completed' ? 'success' : 
                        apt.sessionStatus === 'in_progress' ? 'info' : 
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    {canJoin(apt) ? (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<VideoCall />}
                        onClick={() => handleJoin(apt.jitsiRoom)}
                      >
                        Join Now
                      </Button>
                    ) : (
                      <Tooltip title="Join button will be available 5 minutes before the start time.">
                        <span>
                          <Button variant="outlined" disabled startIcon={<VideoCall />}>
                            Join
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">You have no appointments scheduled.</Typography>
                    <Button 
                      variant="text" 
                      sx={{ mt: 1 }} 
                      onClick={() => window.location.href = '/user/book'}
                    >
                      Book your first session
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Group Sessions</Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Seats</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupSessions.map(({ slot, payment }) => (
                  <TableRow key={slot._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatInTimeZone(slot.startTime, user?.timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatInTimeZone(slot.startTime, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })} - {formatInTimeZone(slot.endTime, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatPrice(payment.amount)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={`${slot.bookedUserIds.length}/${slot.maxPeople}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              await api.refreshGroupSessionPaymentStatus(slot._id);
                              fetchAppointments();
                            } catch {
                              alert('Failed to refresh payment');
                            }
                          }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                        {canJoinGroup(slot) ? (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<VideoCall />}
                            onClick={() => router.push(`/meeting/group-${slot._id}`)}
                          >
                            Join Now
                          </Button>
                        ) : (
                          <Tooltip title="Join button will be available once the session starts.">
                            <span>
                              <Button variant="outlined" disabled startIcon={<VideoCall />}>
                                Join
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {groupSessions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">You have no group sessions booked.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mt: 3, px: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Appointment timing, payment status, and service terms are governed by the policies linked below.
          </Typography>
          <PolicyLinks showPrefix />
        </Box>
      </PageContainer>
    </Box>
  );
}

