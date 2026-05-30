'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Restaurant,
  CloudUpload,
  CalendarMonth,
  PictureAsPdf,
  FitnessCenter,
  ArrowForward,
  Download,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, User, DietPlan } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getDateKeyInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mealsToday: 0,
    bodyDataThisWeek: false,
    upcomingAppointments: 0,
  });
  const [latestPlan, setLatestPlan] = useState<DietPlan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await api.getClientStats();
        const plans = await api.listMyDietPlans();
        
        setStats({
          mealsToday: statsData.mealsToday,
          bodyDataThisWeek: statsData.bodyDataThisWeek,
          upcomingAppointments: statsData.upcomingAppointments,
        });
        
        if (plans.plans.length > 0) {
          setLatestPlan(plans.plans[0]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      <PageContainer>
        <Grid container spacing={3}>
          {/* Status Cards */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Today's Nutrition
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.mealsToday} <Typography component="span" variant="body2" color="text.secondary">Meals logged</Typography>
                  </Typography>
                  <Restaurant color="primary" />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={(stats.mealsToday / 4) * 100} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Button 
                  fullWidth 
                  size="small"
                  variant="text" 
                  endIcon={<ArrowForward fontSize="small" />} 
                  sx={{ mt: 1 }}
                  onClick={() => router.push('/client/meals')}
                >
                  Log a meal
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Weekly Body Data
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.bodyDataThisWeek ? 'Submitted' : 'Pending'}
                  </Typography>
                  <CloudUpload color="secondary" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Submit your metrics every Sunday.
                </Typography>
                <Button 
                  fullWidth 
                  size="small"
                  variant="text" 
                  endIcon={<ArrowForward fontSize="small" />} 
                  sx={{ mt: 1 }}
                  onClick={() => router.push('/client/body-data')}
                >
                  Update metrics
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Appointments
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.upcomingAppointments} <Typography component="span" variant="body2" color="text.secondary">Upcoming</Typography>
                  </Typography>
                  <CalendarMonth color="success" />
                </Box>
                <Button 
                  fullWidth 
                  size="small"
                  variant="text" 
                  endIcon={<ArrowForward fontSize="small" />} 
                  sx={{ mt: 1 }}
                  onClick={() => router.push('/client/appointments')}
                >
                  View schedule
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Diet Plan Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 0, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                  <PictureAsPdf /> Current Diet Plan
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {latestPlan ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>{latestPlan.name || 'Personalized Nutrition Plan'}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {latestPlan.description || 'Your custom diet plan assigned by your doctor.'}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Button 
                      variant="contained" 
                      startIcon={<Download />}
                      href={latestPlan.fileUrl}
                      target="_blank"
                    >
                      Download PDF
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">No diet plan assigned yet.</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Quick Actions</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<FitnessCenter />} 
                    sx={{ py: 2 }}
                    onClick={() => router.push('/client/workouts')}
                  >
                    Log Workout
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<CalendarMonth />} 
                    sx={{ py: 2 }}
                    onClick={() => router.push('/client/appointments')}
                  >
                    View Schedule
                  </Button>
                </Grid>
                {/* More buttons as needed */}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </PageContainer>
    </Box>
  );
}
