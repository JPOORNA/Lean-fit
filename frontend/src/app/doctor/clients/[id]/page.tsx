'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import {
  Edit,
  Restaurant,
  FitnessCenter,
  CloudUpload,
  PictureAsPdf,
  ArrowBack,
  Assignment,
  CalendarViewMonth,
  ShowChart,
  Delete,
} from '@mui/icons-material';
import Image from 'next/image';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import PageContainer from '@/components/layout/PageContainer';
import { api, User, Role, MealLog, BodyMetrics, WorkoutLog, Appointment, DietPlan, WorkoutPlan, ClientSessionSchedule } from '@/lib/api';
import { formatInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClientDetailView() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState<User | null>(null);
  const [history, setHistory] = useState<{
    meals: MealLog[];
    metrics: BodyMetrics[];
    workouts: WorkoutLog[];
    appointments: Appointment[];
    dietPlans: DietPlan[];
    workoutPlans: WorkoutPlan[];
  } | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'current' | 'all'>('current');
  
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role>('user');
  const [editExpiry, setEditExpiry] = useState('');
  const [purgeData, setPurgeData] = useState(false);

  const [sessionSchedule, setSessionSchedule] = useState<ClientSessionSchedule | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionDays, setSessionDays] = useState<number[]>([]);
  const [sessionSlots, setSessionSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [sessionStart, setSessionStart] = useState('');

  const [dietPlanOpen, setDietPlanOpen] = useState(false);
  const [dietPlanName, setDietPlanName] = useState('');
  const [dietPlanDesc, setDietPlanDesc] = useState('');
  const [dietPlanFile, setDietPlanFile] = useState<File | null>(null);

  const [workoutPlanOpen, setWorkoutPlanOpen] = useState(false);
  const [workoutPlanName, setWorkoutPlanName] = useState('');
  const [workoutPlanDesc, setWorkoutPlanDesc] = useState('');
  const [workoutPlanFile, setWorkoutPlanFile] = useState<File | null>(null);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [dynamicFields, setDynamicFields] = useState<{ key: string; label: string; type: "number" | "text" }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, settings] = await Promise.all([
          api.listClients(),
          api.getDoctorSettings().catch(() => null)
        ]);
        if (settings) {
          setDynamicFields(settings.dynamicMetricFields || []);
        }
        const found = clientsData.clients.find(c => c._id === id);
        if (found) {
          setClient(found);
          setEditRole(found.role);
          setEditExpiry(found.clientExpiresAt ? new Date(found.clientExpiresAt).toISOString().split('T')[0] : '');
        }
        
        const historyData = await api.listClientHistory(id as string);
        setHistory(historyData);
        
        try {
          const sessionsRes = await api.listClientSessionsByClient(id as string);
          if (sessionsRes.schedules && sessionsRes.schedules.length > 0) {
            const activeSchedule = sessionsRes.schedules.find(s => s.active) || sessionsRes.schedules[0];
            setSessionSchedule(activeSchedule);
            setSessionDays(activeSchedule.daysOfWeek);
            setSessionSlots(activeSchedule.timeSlots);
            setSessionStart(activeSchedule.startDate.split('T')[0]);
          } else if (found) {
            const tz = found.timezone || user?.timezone || 'UTC';
            const today = dayjs().tz(tz).format('YYYY-MM-DD');
            setSessionStart(today);
          }
        } catch (err) {
          console.error('Failed to fetch sessions', err);
        }
      } catch (err) {
        console.error('Failed to fetch client detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateRole = async () => {
    if (editRole === 'client' && !editExpiry) {
      alert('Subscription Expiry is required for the Client role.');
      return;
    }

    try {
      const expiry = editExpiry ? new Date(editExpiry).toISOString() : undefined;
      await api.updateRole(id as string, editRole, expiry, purgeData);
      setEditOpen(false);
      window.location.reload(); 
    } catch (err) {
      console.error('Failed to update role', err);
      alert('Failed to update role. Please check the console.');
    }
  };

  const handleSaveSessions = async () => {
    try {
      if (sessionDays.length !== 3) {
        alert("Must select exactly 3 days");
        return;
      }
      if (!sessionStart) {
        alert("Start Date is required");
        return;
      }
      const payload = {
        userId: id as string,
        daysOfWeek: sessionDays,
        timeSlots: sessionSlots,
        startDate: new Date(sessionStart).toISOString()
      };
      if (sessionSchedule) {
        await api.updateClientSessionSchedule(sessionSchedule._id, payload);
      } else {
        await api.createClientSessionSchedule(payload);
      }
      setSessionOpen(false);
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to save session schedule');
    }
  };

  const handleAssignDietPlan = async () => {
    if (!dietPlanFile && !editingPlanId) {
      alert("Please select a PDF file.");
      return;
    }
    try {
      const formData = new FormData();
      if (dietPlanFile) formData.append('pdf', dietPlanFile);
      if (dietPlanName) formData.append('name', dietPlanName);
      if (dietPlanDesc) formData.append('description', dietPlanDesc);

      if (editingPlanId) {
        await api.updateDietPlan(editingPlanId, formData);
      } else {
        await api.assignDietPlan(id as string, formData);
      }
      setDietPlanOpen(false);
      setEditingPlanId(null);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to assign diet plan');
    }
  };

  const handleAssignWorkoutPlan = async () => {
    if (!workoutPlanFile && !editingPlanId) {
      alert("Please select a PDF file.");
      return;
    }
    try {
      const formData = new FormData();
      if (workoutPlanFile) formData.append('pdf', workoutPlanFile);
      if (workoutPlanName) formData.append('name', workoutPlanName);
      if (workoutPlanDesc) formData.append('description', workoutPlanDesc);

      if (editingPlanId) {
        await api.updateWorkoutPlan(editingPlanId, formData);
      } else {
        await api.assignWorkoutPlan(id as string, formData);
      }
      setWorkoutPlanOpen(false);
      setEditingPlanId(null);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to assign workout plan');
    }
  };

  const handleDeleteDietPlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this diet plan?")) return;
    try {
      await api.deleteDietPlan(planId);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleDeleteWorkoutPlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this workout plan?")) return;
    try {
      await api.deleteWorkoutPlan(planId);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete plan');
    }
  };

  const openEditDietPlan = (plan: DietPlan) => {
    setEditingPlanId(plan._id);
    setDietPlanName(plan.name || '');
    setDietPlanDesc(plan.description || '');
    setDietPlanFile(null);
    setDietPlanOpen(true);
  };

  const openEditWorkoutPlan = (plan: WorkoutPlan) => {
    setEditingPlanId(plan._id);
    setWorkoutPlanName(plan.name || '');
    setWorkoutPlanDesc(plan.description || '');
    setWorkoutPlanFile(null);
    setWorkoutPlanOpen(true);
  };

  if (loading) return null;
  if (!client) return <Typography>Client not found</Typography>;

  const clientTz = client.timezone || 'UTC';
  const doctorTz = user?.timezone || 'UTC';

  const todayStr = formatInTimeZone(new Date().toISOString(), clientTz, { year: 'numeric', month: '2-digit', day: '2-digit' });

  const filteredMeals = history?.meals.filter(meal => {
    if (timeFilter === 'all') return true;
    return formatInTimeZone(meal.takenAt, clientTz, { year: 'numeric', month: '2-digit', day: '2-digit' }) === todayStr;
  }) || [];

  const filteredWorkouts = history?.workouts.filter(w => {
    if (timeFilter === 'all') return true;
    return formatInTimeZone(w.date, clientTz, { year: 'numeric', month: '2-digit', day: '2-digit' }) === todayStr;
  }) || [];

  const filteredAppointments = history?.appointments.filter(a => {
    if (timeFilter === 'all') return true;
    return formatInTimeZone(a.startTime, clientTz, { year: 'numeric', month: '2-digit', day: '2-digit' }) === todayStr;
  }) || [];

  const filteredMetrics = history?.metrics.filter(m => {
    if (timeFilter === 'all') return true;
    const weekStartMs = new Date(m.weekStartDate).getTime();
    const nowMs = Date.now();
    return nowMs >= weekStartMs && nowMs < weekStartMs + 7 * 24 * 60 * 60 * 1000;
  }) || [];

  const chartData = [...(history?.metrics || [])].sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()).map(m => ({
    name: formatInTimeZone(m.weekStartDate, clientTz, { month: 'short', day: '2-digit' }),
    weight: m.weight,
    bmi: m.bmi,
  }));

  return (
    <Box>
      <PageContainer 
        breadcrumbs={[
          { label: 'Clients', path: '/doctor/clients' },
          { label: client.name }
        ]}
      >
        <Grid container spacing={3}>
          {/* Sidebar Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: '2rem' }}>
                  {client.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{client.name}</Typography>
                <Typography color="text.secondary" gutterBottom>{client.email}</Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Chip label={client.role.toUpperCase()} color="primary" size="small" />
                  <Chip label={client.isActive ? 'Active' : 'Inactive'} color={client.isActive ? 'success' : 'default'} size="small" />
                </Box>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Subscription Ends:</strong> {client.clientExpiresAt ? new Date(client.clientExpiresAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>WhatsApp:</strong> {client.whatsappNumber || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Timezone:</strong> {client.timezone || 'UTC'}
                  </Typography>
                </Box>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<Edit />} 
                  sx={{ mt: 3 }}
                  onClick={() => setEditOpen(true)}
                >
                  Manage Role & Access
                </Button>
                {client.role === 'client' && (
                  <>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="secondary"
                      startIcon={<CalendarViewMonth />} 
                      sx={{ mt: 1 }}
                      onClick={() => setSessionOpen(true)}
                    >
                      Manage Sessions
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="info"
                      startIcon={<Restaurant />} 
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setEditingPlanId(null);
                        setDietPlanName('');
                        setDietPlanDesc('');
                        setDietPlanFile(null);
                        setDietPlanOpen(true);
                      }}
                    >
                      Manage Diet Plan
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="warning"
                      startIcon={<FitnessCenter />} 
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setEditingPlanId(null);
                        setWorkoutPlanName('');
                        setWorkoutPlanDesc('');
                        setWorkoutPlanFile(null);
                        setWorkoutPlanOpen(true);
                      }}
                    >
                      Manage Workout Plan
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content Tabs */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ width: '100%', mb: 2, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography variant="h6" sx={{ fontWeight: 700 }}>Client Records</Typography>
               <TextField
                 select
                 size="small"
                 value={timeFilter}
                 onChange={(e) => setTimeFilter(e.target.value as 'current' | 'all')}
               >
                 <MenuItem value="current">Current (Day/Week)</MenuItem>
                 <MenuItem value="all">All Time</MenuItem>
               </TextField>
            </Paper>
            <Paper sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="scrollable" 
                scrollButtons="auto"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                  '& .MuiTab-root': {
                    minHeight: 80,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.4rem',
                      mb: 0.5
                    }
                  }
                }}
              >
                <Tab icon={<Restaurant />} label="Meals" iconPosition="top" />
                <Tab icon={<CloudUpload />} label="Body Data" iconPosition="top" />
                <Tab icon={<FitnessCenter />} label="Workouts" iconPosition="top" />
                <Tab icon={<CalendarViewMonth />} label="Appointments" iconPosition="top" />
                <Tab icon={<Assignment />} label="Sessions" iconPosition="top" />
                <Tab icon={<PictureAsPdf />} label="Diet Plans" iconPosition="top" />
                <Tab icon={<PictureAsPdf />} label="Workout Plans" iconPosition="top" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Meal Submissions</Typography>
                {filteredMeals.length ? (
                  <Grid container spacing={2}>
                    {filteredMeals.map((meal) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={meal._id}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <Box sx={{ height: 180, bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {meal.imageUrl ? (
                               <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
                                 <Image 
                                   src={meal.imageUrl} 
                                   alt="Meal" 
                                   fill 
                                   style={{ objectFit: 'cover' }} 
                                   sizes="(max-width: 900px) 100vw, 33vw"
                                   unoptimized
                                 />
                               </Box>
                            ) : (
                              <Restaurant color="disabled" sx={{ fontSize: 40 }} />
                            )}
                          </Box>
                          <CardContent>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                              Client: {formatInTimeZone(meal.takenAt, clientTz, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} ({clientTz})
                              {' • '}Doctor: {formatInTimeZone(meal.takenAt, doctorTz, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} ({doctorTz})
                            </Typography>
                            <Typography variant="body2">{meal.notes || 'No notes provided'}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No meal logs found.</Typography>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Body Metrics History</Typography>
                {filteredMetrics.length ? (
                  <>
                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Week Starting</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Weight (kg)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Height (cm)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>BMI</TableCell>
                            {dynamicFields.map((field) => (
                              <TableCell key={field.key} sx={{ fontWeight: 700 }}>{field.label}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMetrics.map((m) => (
                            <TableRow key={m._id} hover>
                              <TableCell>
                                {formatInTimeZone(m.weekStartDate, clientTz, { month: 'short', day: '2-digit', year: 'numeric' })}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Doctor: {formatInTimeZone(m.weekStartDate, doctorTz, { month: 'short', day: '2-digit', year: 'numeric' })}
                                </Typography>
                              </TableCell>
                              <TableCell>{m.weight}</TableCell>
                              <TableCell>{m.height}</TableCell>
                              <TableCell>
                                <Chip label={m.bmi} size="small" color={m.bmi > 25 ? "warning" : "success"} variant="outlined" />
                              </TableCell>
                              {dynamicFields.map((field) => (
                                <TableCell key={field.key}>{String(m.extraFields?.[field.key] ?? '-')}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>

                    {chartData.length > 0 && (
                      <Grid container spacing={2} sx={{ mt: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ShowChart fontSize="small" color="primary" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Weight Trend (kg)</Typography>
                              </Box>
                              <Box sx={{ height: 200, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData}>
                                    <defs>
                                      <linearGradient id="doctorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1a237e" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#1a237e" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="weight" stroke="#1a237e" strokeWidth={2} fillOpacity={1} fill="url(#doctorWeight)" dot={{ r: 3 }} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ShowChart fontSize="small" color="secondary" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>BMI Trend</Typography>
                              </Box>
                              <Box sx={{ height: 200, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData}>
                                    <defs>
                                      <linearGradient id="doctorBmi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c2185b" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#c2185b" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="bmi" stroke="#c2185b" strokeWidth={2} fillOpacity={1} fill="url(#doctorBmi)" dot={{ r: 3 }} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}
                  </>
                ) : (
                  <Typography color="text.secondary">No metrics recorded.</Typography>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Workout Attendance</Typography>
                {filteredWorkouts.length ? (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {filteredWorkouts.map((w, idx) => (
                      <React.Fragment key={w._id}>
                        <ListItem sx={{ py: 1.5 }}>
                          <ListItemText 
                            primary={formatInTimeZone(w.date, clientTz, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            secondary={`Doctor: ${formatInTimeZone(w.date, doctorTz, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${w.notes ? ` • ${w.notes}` : ''}`}
                          />
                          <Chip 
                            label={w.attended ? "ATTENDED" : "MISSED"} 
                            color={w.attended ? "success" : "error"} 
                            size="small" 
                            variant="filled"
                          />
                        </ListItem>
                        {idx < filteredWorkouts.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No workout logs found.</Typography>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Appointments</Typography>
                {filteredAppointments.length ? (
                  <List>
                    {filteredAppointments.map((a, idx) => (
                      <React.Fragment key={a._id}>
                        <ListItem sx={{ py: 2 }}>
                          <ListItemText 
                            primary={`Client: ${formatInTimeZone(a.startTime, clientTz, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} (${clientTz})`}
                            secondary={`Doctor: ${formatInTimeZone(a.startTime, doctorTz, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} (${doctorTz}) • ${a.type.replace('_', ' ').toUpperCase()}`}
                          />
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Chip 
                              label={`Payment: ${a.paymentStatus.toUpperCase()}`} 
                              color={a.paymentStatus === 'paid' ? 'success' : 'default'} 
                              size="small"
                            />
                            <Chip 
                              label={`Session: ${a.sessionStatus.toUpperCase()}`} 
                              color={a.sessionStatus === 'completed' ? 'success' : 'default'} 
                              size="small"
                            />
                          </Box>
                        </ListItem>
                        {idx < filteredAppointments.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No appointments found.</Typography>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={4}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Client Session Schedule</Typography>
                {sessionSchedule ? (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Active Schedule</Typography>
                          <Typography variant="body2" color="text.secondary">Started on {new Date(sessionSchedule.startDate).toLocaleDateString()}</Typography>
                        </Box>
                        <Chip 
                          label={sessionSchedule.active ? "ACTIVE" : "INACTIVE"} 
                          color={sessionSchedule.active ? "success" : "default"} 
                          size="small" 
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      
                      <Grid container spacing={1}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                          const isScheduled = sessionSchedule.daysOfWeek.includes(i);
                          const slot = sessionSchedule.timeSlots.find(s => s.dayOfWeek === i);
                          return (
                            <Grid size={{ xs: 4, sm: 3, md: 1.7 }} key={i}>
                              <Box sx={{ 
                                p: 1, 
                                borderRadius: 1, 
                                border: '1px solid', 
                                borderColor: isScheduled ? 'primary.light' : 'divider',
                                bgcolor: isScheduled ? 'primary.light' : 'transparent',
                                opacity: isScheduled ? 1 : 0.5,
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: isScheduled ? 'primary.main' : 'text.disabled' }}>
                                  {day.toUpperCase()}
                                </Typography>
                                {isScheduled && slot ? (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.2, display: 'block', fontSize: '0.75rem' }}>
                                      {slot.startTime} (Dr)
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>
                                      {(() => {
                                        const today = dayjs().format('YYYY-MM-DD');
                                        const drTime = dayjs.tz(`${today} ${slot.startTime}`, 'YYYY-MM-DD HH:mm', doctorTz);
                                        return drTime.tz(clientTz).format('HH:mm');
                                      })()} (Cl)
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.2, display: 'block' }}>
                                    -
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                      
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Sessions are automatically generated based on this schedule. Total of 3 sessions per week.
                        </Typography>
                      </Box>
                      
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Edit />} 
                        sx={{ mt: 2 }}
                        onClick={() => setSessionOpen(true)}
                      >
                        Modify Schedule
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" gutterBottom>No active session schedule found for this client.</Typography>
                    <Button variant="contained" onClick={() => setSessionOpen(true)} sx={{ mt: 2 }}>
                      Setup Sessions
                    </Button>
                  </Box>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={5}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Diet Plans</Typography>
                {history?.dietPlans.length ? (
                  <Grid container spacing={2}>
                    {history.dietPlans.map((p) => (
                      <Grid size={{ xs: 12 }} key={p._id}>
                        <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2 }}>
                          <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 1, mr: 2, color: 'white' }}>
                            <PictureAsPdf />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.name || 'Untitled Plan'}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.description || 'No description'}</Typography>
                          </Box>
                          <Button size="small" variant="text" href={p.fileUrl} target="_blank">Download</Button>
                          <IconButton onClick={() => openEditDietPlan(p)} color="primary"><Edit /></IconButton>
                          <IconButton onClick={() => handleDeleteDietPlan(p._id)} color="error"><Delete /></IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No diet plans assigned.</Typography>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Workout Plans</Typography>
                {history?.workoutPlans.length ? (
                  <Grid container spacing={2}>
                    {history.workoutPlans.map((p) => (
                      <Grid size={{ xs: 12 }} key={p._id}>
                        <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2 }}>
                          <Box sx={{ p: 2, bgcolor: 'secondary.main', borderRadius: 1, mr: 2, color: 'white' }}>
                            <PictureAsPdf />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.name || 'Untitled Plan'}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.description || 'No description'}</Typography>
                          </Box>
                          <Button size="small" variant="text" href={p.fileUrl} target="_blank">Download</Button>
                          <IconButton onClick={() => openEditWorkoutPlan(p)} color="primary"><Edit /></IconButton>
                          <IconButton onClick={() => handleDeleteWorkoutPlan(p._id)} color="error"><Delete /></IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No workout plans assigned.</Typography>
                )}
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* Edit Access Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
          <DialogTitle>Manage Access: {client.name}</DialogTitle>
          <DialogContent sx={{ minWidth: 400, pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <TextField
                select
                label="User Role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
                fullWidth
              >
                <MenuItem value="user">Normal User</MenuItem>
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="doctor">Admin</MenuItem>
              </TextField>
              
              <TextField
                label="Subscription Expiry"
                type="date"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {client.role === 'client' && editRole === 'user' && (
                <Box sx={{ mt: 1 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Downgrading from Client to User will deactivate their session schedule and cancel future appointments.
                  </Alert>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={purgeData} 
                        onChange={(e) => setPurgeData(e.target.checked)} 
                        color="error"
                      />
                    }
                    label={
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                        Purge all client data (Meal logs, Body data, Workouts)
                      </Typography>
                    }
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateRole}>Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* Manage Sessions Dialog */}
        <Dialog open={sessionOpen} onClose={() => setSessionOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Manage Client Sessions
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
              Select exactly 3 days for weekly sessions.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <Chip 
                  key={i} 
                  label={d} 
                  clickable 
                  color={sessionDays.includes(i) ? 'primary' : 'default'}
                  onClick={() => {
                    let newDays = [...sessionDays];
                    if (newDays.includes(i)) {
                      newDays = newDays.filter(x => x !== i);
                    } else if (newDays.length < 3) {
                      newDays.push(i);
                    }
                    setSessionDays(newDays);
                    
                    if (!newDays.includes(i)) {
                      setSessionSlots(sessionSlots.filter(s => s.dayOfWeek !== i));
                    } else {
                      setSessionSlots([...sessionSlots, { dayOfWeek: i, startTime: "09:00", endTime: "10:00" }]);
                    }
                  }} 
                />
              ))}
            </Box>
            
            {sessionDays.map(day => {
              const slot = sessionSlots.find(s => s.dayOfWeek === day) || { dayOfWeek: day, startTime: "09:00", endTime: "10:00" };
              return (
                <Box key={day} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <Typography sx={{ width: 40, fontWeight: 600 }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <TextField type="time" label="Start Time (Doctor)" value={slot.startTime} onChange={(e) => {
                      const hourPart = e.target.value.split(':')[0] || '09';
                      const newStart = `${hourPart}:00`;
                      const newEnd = dayjs(`2026-01-01 ${newStart}`, 'YYYY-MM-DD HH:mm').add(1, 'hour').format('HH:mm');
                      const newSlots = [...sessionSlots];
                      const idx = newSlots.findIndex(s => s.dayOfWeek === day);
                      if (idx >= 0) {
                        newSlots[idx].startTime = newStart;
                        newSlots[idx].endTime = newEnd;
                      } else {
                        newSlots.push({ dayOfWeek: day, startTime: newStart, endTime: newEnd });
                      }
                      setSessionSlots(newSlots);
                    }} size="small" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                      Client: {(() => {
                        const today = dayjs().format('YYYY-MM-DD');
                        const drTime = dayjs.tz(`${today} ${slot.startTime}`, 'YYYY-MM-DD HH:mm', doctorTz);
                        return drTime.tz(clientTz).format('HH:mm');
                      })()} ({clientTz})
                    </Typography>
                  </Box>
                  <TextField type="time" label="End Time" value={slot.endTime} disabled size="small" slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 120 }} />
                </Box>
              );
            })}
            
            <TextField
              label="Start Date"
              type="date"
              value={sessionStart}
              onChange={(e) => setSessionStart(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSessionOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveSessions}>Save Sessions</Button>
          </DialogActions>
        </Dialog>

        {/* Manage Diet Plan Dialog */}
        <Dialog open={dietPlanOpen} onClose={() => setDietPlanOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingPlanId ? 'Edit Diet Plan' : 'Assign Diet Plan'}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {editingPlanId 
                ? 'Update the diet plan details. You can also upload a new PDF to replace the old one.' 
                : 'Upload a new diet plan PDF. Max 3 active plans allowed.'}
            </Typography>
            <TextField 
              label="Plan Name" 
              value={dietPlanName} 
              onChange={e => setDietPlanName(e.target.value)} 
              fullWidth 
            />
            <TextField 
              label="Description (Optional)" 
              value={dietPlanDesc} 
              onChange={e => setDietPlanDesc(e.target.value)} 
              fullWidth 
              multiline
              rows={2}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<PictureAsPdf />}
              fullWidth
              color={dietPlanFile ? "success" : "primary"}
            >
              {dietPlanFile ? dietPlanFile.name : 'Upload PDF'}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDietPlanFile(e.target.files[0]);
                  }
                }}
              />
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDietPlanOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignDietPlan} disabled={!dietPlanFile}>Assign Plan</Button>
          </DialogActions>
        </Dialog>

        {/* Manage Workout Plan Dialog */}
        <Dialog open={workoutPlanOpen} onClose={() => setWorkoutPlanOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingPlanId ? 'Edit Workout Plan' : 'Assign Workout Plan'}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {editingPlanId 
                ? 'Update the workout plan details. You can also upload a new PDF to replace the old one.' 
                : 'Upload a new workout plan PDF. Max 3 active plans allowed.'}
            </Typography>
            <TextField 
              label="Plan Name" 
              value={workoutPlanName} 
              onChange={e => setWorkoutPlanName(e.target.value)} 
              fullWidth 
            />
            <TextField 
              label="Description (Optional)" 
              value={workoutPlanDesc} 
              onChange={e => setWorkoutPlanDesc(e.target.value)} 
              fullWidth 
              multiline
              rows={2}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<PictureAsPdf />}
              fullWidth
              color={workoutPlanFile ? "success" : "primary"}
            >
              {workoutPlanFile ? workoutPlanFile.name : 'Upload PDF'}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setWorkoutPlanFile(e.target.files[0]);
                  }
                }}
              />
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWorkoutPlanOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignWorkoutPlan} disabled={!workoutPlanFile}>Assign Plan</Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </Box>
  );
}
