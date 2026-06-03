'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Typography,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { VideoCall, Refresh } from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, Appointment, GroupSessionBookingItem } from '@/lib/api';
import { formatInTimeZone, getDateKeyInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ClientAppointmentsPage() {
  const formatPrice = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupSessions, setGroupSessions] = useState<GroupSessionBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const [appointmentRes, groupRes] = await Promise.all([
          api.listMyAppointments(),
          api.listMyGroupSessions()
        ]);
        const tz = user?.timezone || 'UTC';
        const todayStr = getDateKeyInTimeZone(new Date(), tz);
        setAppointments(appointmentRes.appointments.filter(a => getDateKeyInTimeZone(a.startTime, tz) >= todayStr));
        setGroupSessions(groupRes.bookings.filter((booking) => getDateKeyInTimeZone(booking.slot.startTime, tz) >= todayStr));
      } catch (err) {
        console.error('Failed to fetch appointments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user?.timezone]);

  const canJoinGroup = (slot: GroupSessionBookingItem['slot']) => slot.status === 'in_progress';

  return (
    <Box>
      <PageContainer>
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
                      {formatInTimeZone(apt.startTime, user?.timezone, { month: 'short', day: '2-digit', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatInTimeZone(apt.startTime, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {apt.type.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={apt.paymentStatus.toUpperCase()} 
                        color={apt.paymentStatus === 'paid' ? 'success' : apt.paymentStatus === 'failed' ? 'error' : 'warning'} 
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={apt.sessionStatus.toUpperCase()} 
                      color={apt.sessionStatus === 'completed' ? 'success' : apt.sessionStatus === 'in_progress' ? 'info' : 'default'} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<VideoCall />}
                      disabled={!apt.jitsiRoom || apt.sessionStatus !== 'in_progress'}
                      onClick={() => apt.jitsiRoom && router.push(`/meeting/${apt.jitsiRoom}`)}
                    >
                      Join Call
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No upcoming appointments found.</Typography>
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
                        {formatInTimeZone(slot.startTime, user?.timezone, { month: 'short', day: '2-digit', year: 'numeric' })}
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
                              const [appointmentRes, groupRes] = await Promise.all([
                                api.listMyAppointments(),
                                api.listMyGroupSessions()
                              ]);
                              const tz = user?.timezone || 'UTC';
                              const todayStr = getDateKeyInTimeZone(new Date(), tz);
                              setAppointments(appointmentRes.appointments.filter(a => getDateKeyInTimeZone(a.startTime, tz) >= todayStr));
                              setGroupSessions(groupRes.bookings.filter((s) => getDateKeyInTimeZone(s.slot.startTime, tz) >= todayStr));
                            } catch {
                              alert('Failed to refresh payment');
                            }
                          }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                        <Button 
                          variant="contained" 
                          size="small" 
                          startIcon={<VideoCall />}
                          disabled={!canJoinGroup(slot)}
                          onClick={() => router.push(`/meeting/group-${slot._id}`)}
                        >
                          Join Call
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {groupSessions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">No upcoming group sessions found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </PageContainer>
    </Box>
  );
}

