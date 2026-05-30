'use client';
import { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import {
  People,
  Restaurant,
  FitnessCenter,
  CloudUpload,
  CalendarMonth,
  ChevronRight,
} from '@mui/icons-material';
import { api, Appointment } from '@/lib/api';
import { formatAppointmentTime, formatInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import React from 'react';
import { endOfWeek } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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
            bgcolor: `${color}20`, // Slightly darker tint
            color: color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

interface DashboardStats {
  totalClients: number;
  mealsToday: number;
  workoutsToday: number;
  weeklyMetrics: number;
  upcomingAppointments: number;
}

interface ActivityItem {
  type: 'meal' | 'workout' | 'metrics';
  date: string;
  user: { _id: string; name: string };
  data: unknown;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activitiesData, apptsData] = await Promise.all([
          api.getDoctorStats(),
          api.getRecentActivities(),
          api.listDoctorAppointments()
        ]);
        setStats(statsData);
        setActivities(activitiesData.activities);
        const now = new Date();
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        // Show all upcoming appointments up to this week's end.
        setAppointments(apptsData.appointments
          .filter(a => {
            const start = new Date(a.startTime).getTime();
            return start >= now.getTime() && start <= weekEnd.getTime();
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)
        );
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { title: 'Total Clients', value: stats?.totalClients ?? 0, icon: <People />, color: '#1a237e' },
    { title: "Today's Meals", value: stats?.mealsToday ?? 0, icon: <Restaurant />, color: '#c2185b' },
    { title: "Today's Workouts", value: stats?.workoutsToday ?? 0, icon: <FitnessCenter />, color: '#2e7d32' },
    { title: 'Weekly Submissions', value: stats?.weeklyMetrics ?? 0, icon: <CloudUpload />, color: '#ed6c02' },
    { title: 'Upcoming Appts', value: stats?.upcomingAppointments ?? 0, icon: <CalendarMonth />, color: '#0288d1' },
  ];

  return (
    <PageContainer>
      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 6, sm: 4, md: 4, lg: 2.4 }} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
        
        {/* Upcoming Appointments */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Upcoming Appointments</Typography>
              <Link href="/doctor/appointments" style={{ textDecoration: 'none' }}>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  VIEW ALL <ChevronRight fontSize="inherit" />
                </Typography>
              </Link>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1 }}>
              {appointments.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No upcoming appointments.</Typography>
                </Box>
              ) : (
                appointments.map((appt, idx) => {
                  const { date, time } = formatAppointmentTime(appt.startTime, user?.timezone);
                  return (
                    <React.Fragment key={appt._id}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText 
                          primary={date}
                          secondary={time}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip 
                            label={appt.type.replace('_', ' ').toUpperCase()} 
                            size="small" 
                            variant="outlined" 
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {appt.sessionStatus.toUpperCase()}
                          </Typography>
                        </Box>
                      </ListItem>
                      {idx < appointments.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Recent Activities</Typography>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, maxHeight: 400, overflowY: 'auto' }}>
              {activities.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No recent activities.</Typography>
                </Box>
              ) : (
                activities.map((activity, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 
                          activity.type === 'meal' ? '#c2185b' : 
                          activity.type === 'workout' ? '#2e7d32' : '#ed6c02',
                          width: 32, height: 32
                        }}>
                          {activity.type === 'meal' ? <Restaurant fontSize="small" /> : 
                           activity.type === 'workout' ? <FitnessCenter fontSize="small" /> : 
                           <CloudUpload fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {activity.user?.name || 'Unknown User'} <span style={{ fontWeight: 400, color: 'text.secondary' }}>uploaded a {activity.type}</span>
                          </Typography>
                        }
                        secondary={formatInTimeZone(activity.date, user?.timezone, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      />
                    </ListItem>
                    {idx < activities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
