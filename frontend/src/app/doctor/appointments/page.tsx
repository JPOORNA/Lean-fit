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
  IconButton,
  Typography,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import {
  Check,
  Close,
  Event,
  Refresh,
  VideoCall,
  Search,
} from '@mui/icons-material';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import { api, Appointment } from '@/lib/api';
import { format } from 'date-fns';
import { formatAppointmentTime } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<{ _id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('paid');
  const [sessionFilter, setSessionFilter] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Debounce search inputs to avoid redundant API hits while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page index on filter updates
  useEffect(() => {
    setPage(0);
  }, [dateFilter, paymentFilter, sessionFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [apptsRes, { doctors }] = await Promise.all([
        api.listDoctorAppointments({
          page: page + 1,
          limit: rowsPerPage,
          type: 'one_off',
          search: debouncedSearch,
          date: dateFilter || undefined,
          paymentStatus: paymentFilter || undefined,
          sessionStatus: sessionFilter || undefined,
        }),
        api.listDoctors()
      ]);
      setAppointments(apptsRes.appointments);
      setTotal(apptsRes.pagination?.total ?? 0);
      setDoctors(doctors);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, rowsPerPage, debouncedSearch, dateFilter, paymentFilter, sessionFilter]);

  return (
    <Box>
      <PageContainer>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            size="small"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentFilter}
              label="Payment"
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <MenuItem value="">All Payments</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Session</InputLabel>
            <Select
              value={sessionFilter}
              label="Session"
              onChange={(e) => setSessionFilter(e.target.value)}
            >
              <MenuItem value="">All Sessions</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              setSearch('');
              setDateFilter('');
              setPaymentFilter('paid');
              setSessionFilter('');
            }}
          >
            Reset
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button startIcon={<Refresh />} onClick={fetchAppointments}>Refresh</Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned Doctor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Session Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((apt) => {
                const { date, time } = formatAppointmentTime(apt.startTime, user?.timezone);
                const currentDoctorId = typeof apt.doctorId === 'object' ? apt.doctorId._id : apt.doctorId;
                return (
                  <TableRow key={apt._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {typeof apt.userId === 'object' ? apt.userId.name : apt.userId}
                        </Typography>
                        {typeof apt.userId === 'object' && (
                          <Typography variant="caption" color="text.secondary">
                            {apt.userId.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {date}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <select 
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', width: '100%' }}
                        value={currentDoctorId}
                        onChange={async (e) => {
                          try {
                            await api.assignAppointment(apt._id, e.target.value);
                            fetchAppointments();
                          } catch (err) {
                            alert('Failed to reassign doctor');
                          }
                        }}
                      >
                        {doctors.map(d => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={apt.paymentStatus.toUpperCase()} 
                          color={apt.paymentStatus === 'paid' ? 'success' : apt.paymentStatus === 'failed' ? 'error' : 'warning'} 
                          size="small"
                        />
                        <IconButton size="small" onClick={async () => {
                          try {
                            await api.refreshPaymentStatus(apt._id);
                            fetchAppointments();
                          } catch (err) {
                            alert('Failed to refresh payment');
                          }
                        }}>
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={apt.sessionStatus.toUpperCase()} 
                        color={apt.sessionStatus === 'completed' ? 'success' : apt.sessionStatus === 'in_progress' ? 'info' : 'default'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select 
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
                          value={apt.paymentStatus}
                          onChange={async (e) => {
                            try {
                              await api.updatePaymentStatus(apt._id, e.target.value);
                              fetchAppointments();
                            } catch (err) {
                              alert('Failed to update payment status');
                            }
                          }}
                        >
                          <option value="pending">Pending Payment</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>

                        {apt.sessionStatus === 'scheduled' && (
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small" 
                            onClick={async () => {
                              try {
                                await api.updateSessionStatus(apt._id, 'in_progress');
                                fetchAppointments();
                              } catch (err) {
                                alert('Failed to start session');
                              }
                            }}
                          >
                            Start Session
                          </Button>
                        )}

                        {apt.sessionStatus === 'in_progress' && (
                          <>
                            {apt.jitsiRoom && (
                              <Button 
                                variant="outlined" 
                                color="success" 
                                size="small" 
                                component={Link}
                                href={`/meeting/${apt.jitsiRoom}`}
                                startIcon={<VideoCall />}
                              >
                                Join Call
                              </Button>
                            )}
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small" 
                              onClick={async () => {
                                try {
                                  await api.updateSessionStatus(apt._id, 'completed');
                                  fetchAppointments();
                                } catch (err) {
                                  alert('Failed to end session');
                                }
                              }}
                            >
                              End Session
                            </Button>
                          </>
                        )}
                        
                        {apt.sessionStatus !== 'cancelled' && apt.sessionStatus !== 'completed' && (
                           <Button 
                             variant="text" 
                             color="error" 
                             size="small" 
                             onClick={async () => {
                               try {
                                 await api.updateSessionStatus(apt._id, 'cancelled');
                                 fetchAppointments();
                               } catch (err) {
                                 alert('Failed to cancel');
                               }
                             }}
                           >
                             Cancel
                           </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {appointments.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No appointment requests found matching your filters.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </PageContainer>
    </Box>
  );
}
