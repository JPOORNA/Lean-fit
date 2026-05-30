'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, User } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format, startOfWeek } from 'date-fns';

export default function DoctorBodyDataPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, boolean>>({});
  const [lastSubmitted, setLastSubmitted] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { clients } = await api.listClients("client");
        setClients(clients);
        
        const today = new Date().toISOString().split('T')[0];
        const { metricsStatus, lastMetricsDate } = await api.getClientsDailyStatus(today);
        setSubmissionStatus(metricsStatus);
        setLastSubmitted(lastMetricsDate);
      } catch (err) {
        console.error('Failed to fetch submission status', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const submittedCount = Object.values(submissionStatus).filter(Boolean).length;
  const pendingCount = clients.length - submittedCount;

  return (
    <Box>
      <PageContainer>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      opacity: 0.8
                    }}
                  >
                    <CheckCircle />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{submittedCount}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Submitted This Week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'grey.100',
                      color: 'grey.500',
                    }}
                  >
                    <Cancel />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{pendingCount}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Pending Submission
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Submitted</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>{client.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {format(weekStart, 'MMM dd')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={submissionStatus[client._id] ? 'Submitted' : 'Pending'} 
                      color={submissionStatus[client._id] ? 'success' : 'default'} 
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lastSubmitted[client._id] 
                        ? format(new Date(lastSubmitted[client._id]), 'MMM dd, yyyy') 
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => router.push(`/doctor/clients/${client._id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </Box>
  );
}
