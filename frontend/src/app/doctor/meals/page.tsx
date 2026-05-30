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
  Restaurant,
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, User, MealLog } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DoctorMealsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [mealStatus, setMealStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { clients } = await api.listClients("client");
        setClients(clients);
        
        const today = new Date().toISOString().split('T')[0];
        const { mealStatus } = await api.getClientsDailyStatus(today);
        setMealStatus(mealStatus);
      } catch (err) {
        console.error('Failed to fetch meal status', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const submittedCount = Object.values(mealStatus).filter(Boolean).length;
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
                      bgcolor: 'success.light',
                      color: 'success.main',
                      opacity: 0.8
                    }}
                  >
                    <CheckCircle />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{submittedCount}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Submitted Today
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
                      bgcolor: 'warning.light',
                      color: 'warning.main',
                      opacity: 0.8
                    }}
                  >
                    <Cancel />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{pendingCount}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Pending Upload
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
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>{client.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={mealStatus[client._id] ? <CheckCircle /> : <Cancel />}
                      label={mealStatus[client._id] ? 'Submitted' : 'Pending'} 
                      color={mealStatus[client._id] ? 'success' : 'warning'} 
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => router.push(`/doctor/clients/${client._id}`)}>
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

