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
import { api, User, DietPlan, WorkoutPlan } from '@/lib/api';
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
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

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
        const workoutPlansData = await api.listMyWorkoutPlans();
        
        setDietPlans(plans.plans);
        setWorkoutPlans(workoutPlansData.plans);
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
            <Paper sx={{ p: 0, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                  <PictureAsPdf /> Assigned Diet Plans
                </Typography>
                <Button size="small" color="inherit" onClick={() => router.push('/client/diet-plan')}>View Details</Button>
              </Box>
              <Box sx={{ p: 3 }}>
                {dietPlans.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dietPlans.map((plan, index) => (
                      <Box key={plan._id}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{plan.name || `Personalized Nutrition Plan ${index + 1}`}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {plan.description || 'Your custom diet plan assigned by your doctor.'}
                        </Typography>
                        <Button 
                          size="small"
                          variant="outlined" 
                          startIcon={<Download />}
                          href={plan.fileUrl}
                          target="_blank"
                          sx={{ mt: 1 }}
                        >
                          Download PDF
                        </Button>
                        {index < dietPlans.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">No diet plan assigned yet.</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Workout Plan Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 0, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'secondary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                  <PictureAsPdf /> Assigned Workout Plans
                </Typography>
                <Button size="small" color="inherit" onClick={() => router.push('/client/workout-plan')}>View Details</Button>
              </Box>
              <Box sx={{ p: 3 }}>
                {workoutPlans.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {workoutPlans.map((plan, index) => (
                      <Box key={plan._id}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{plan.name || `Personalized Workout Plan ${index + 1}`}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {plan.description || 'Your custom workout plan assigned by your doctor.'}
                        </Typography>
                        <Button 
                          size="small"
                          variant="outlined" 
                          startIcon={<Download />}
                          href={plan.fileUrl}
                          target="_blank"
                          sx={{ mt: 1 }}
                        >
                          Download PDF
                        </Button>
                        {index < workoutPlans.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">No workout plan assigned yet.</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 12 }}>
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
