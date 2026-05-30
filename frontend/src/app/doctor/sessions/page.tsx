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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import {
  VideoCall,
  Refresh,
  Search,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, Appointment } from '@/lib/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ClientSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);
  useEffect(() => {
    setPage(0);
  }, [dateFilter, sessionFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [sessionsRes, { doctors }] = await Promise.all([
        api.listDoctorAppointments({
          page: page + 1,
          limit: rowsPerPage,
          type: 'client_session',
          search: debouncedSearch,
          date: dateFilter || undefined,
          sessionStatus: sessionFilter || undefined,
        }),
        api.listDoctors()
      ]);
      setSessions(sessionsRes.appointments);
      setTotal(sessionsRes.pagination?.total ?? 0);
      setDoctors(doctors);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, rowsPerPage, debouncedSearch, dateFilter, sessionFilter]);

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
              setSessionFilter('');
            }}
          >
            Reset
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button startIcon={<Refresh />} onClick={fetchSessions}>Refresh</Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned Doctor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Session Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => {
                const currentDoctorId = typeof session.doctorId === 'object' ? session.doctorId._id : session.doctorId;
                return (
                  <TableRow key={session._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {typeof session.userId === 'object' ? session.userId.name : session.userId}
                          </Typography>
                          {typeof session.userId === 'object' && (
                            <Typography variant="caption" color="text.secondary">
                              {session.userId.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(session.startTime), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(session.startTime), 'hh:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <select 
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', width: '100%' }}
                        value={currentDoctorId}
                        onChange={async (e) => {
                          try {
                            await api.assignAppointment(session._id, e.target.value);
                            fetchSessions();
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
                      <Chip 
                        label={session.sessionStatus.toUpperCase()} 
                        color={session.sessionStatus === 'completed' ? 'success' : session.sessionStatus === 'in_progress' ? 'info' : 'default'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>

                        {session.sessionStatus === 'scheduled' && (
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small" 
                            onClick={async () => {
                              try {
                                await api.updateSessionStatus(session._id, 'in_progress');
                                fetchSessions();
                              } catch (err) {
                                alert('Failed to start session');
                              }
                            }}
                          >
                            Start Session
                          </Button>
                        )}

                        {session.sessionStatus === 'in_progress' && (
                          <>
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small" 
                              startIcon={<VideoCall />}
                              onClick={() => session.jitsiRoom && router.push(`/meeting/${session.jitsiRoom}`)}
                            >
                              Join Call
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small" 
                              onClick={async () => {
                                try {
                                  await api.updateSessionStatus(session._id, 'completed');
                                  fetchSessions();
                                } catch (err) {
                                  alert('Failed to end session');
                                }
                              }}
                            >
                              End Session
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sessions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No client sessions found matching your filters.</Typography>
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
