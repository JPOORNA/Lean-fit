'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  TextField,
  Divider,
} from '@mui/material';
import {
  FitnessCenter,
  History,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, WorkoutLog } from '@/lib/api';
import { formatInTimeZone, getDateKeyInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.listMyWorkouts();
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch workout logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleMarkAttendance = async (attended: boolean) => {
    setSubmitting(true);
    try {
      const tz = user?.timezone || 'UTC';
      await api.upsertWorkout({
        date: getDateKeyInTimeZone(new Date(), tz),
        attended,
        notes,
      });
      setNotes('');
      fetchLogs();
    } catch (err) {
      console.error('Failed to mark attendance', err);
    } finally {
      setSubmitting(false);
    }
  };

  const todayKey = getDateKeyInTimeZone(new Date(), user?.timezone || 'UTC');
  const todayLog = logs.find(log => 
    getDateKeyInTimeZone(log.date, user?.timezone || 'UTC') === todayKey
  );

  return (
    <Box>
      <PageContainer>
        <Grid container spacing={3}>
          {/* Mark Attendance */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FitnessCenter color="primary" /> Today's Workout
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {todayLog ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    {todayLog.attended ? (
                      <>
                        <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6">Great job!</Typography>
                        <Typography color="text.secondary">You've marked your workout as attended.</Typography>
                      </>
                    ) : (
                      <>
                        <Cancel color="error" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6">Rest Day / Missed</Typography>
                        <Typography color="text.secondary">You've marked your workout as missed.</Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      label="Workout Notes"
                      placeholder="What did you do today?"
                      multiline
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button 
                        variant="contained" 
                        color="success"
                        onClick={() => handleMarkAttendance(true)}
                        disabled={submitting}
                        fullWidth
                        sx={{ py: 1.5, fontWeight: 700 }}
                      >
                        Attended
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleMarkAttendance(false)}
                        disabled={submitting}
                        fullWidth
                        sx={{ py: 1.5, fontWeight: 700 }}
                      >
                        Missed
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* History */}
          <Grid size={{ xs: 12, md: 8 }}>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                <Typography variant="h6">Workout History</Typography>
              </Box>
              <Divider />
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.sort((a, b) => b.date.localeCompare(a.date)).map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell>
                        {formatInTimeZone(log.date, user?.timezone, { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.attended ? 'Attended' : 'Missed'} 
                          size="small" 
                          color={log.attended ? 'success' : 'error'} 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{log.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">No workout history found. Log your first session today!</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </PageContainer>
    </Box>
  );
}

import { Grid } from '@mui/material';

