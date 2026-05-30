'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import {
  History,
  CloudUpload,
  ShowChart,
} from '@mui/icons-material';
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
import { api, BodyMetrics } from '@/lib/api';
import { format, startOfWeek } from 'date-fns';

export default function BodyDataPage() {
  const [metrics, setMetrics] = useState<BodyMetrics[]>([]);
  const [dynamicFields, setDynamicFields] = useState<{ key: string; label: string; type: "number" | "text" }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        api.listMyMetrics(),
        api.getPublicDoctorSettings()
      ]);
      setMetrics(data.metrics);
      setDynamicFields(settings.dynamicMetricFields || []);
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSubmit = async () => {
    if (!weight || !height) return;
    setSubmitting(true);
    try {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const bmi = w / ((h / 100) * (h / 100));
      
      await api.upsertMetrics({
        weekStartDate: startOfWeek(new Date()).toISOString(),
        weight: w,
        height: h,
        bmi: parseFloat(bmi.toFixed(2)),
        extraFields: extraFields,
      });
      
      setWeight('');
      setHeight('');
      setExtraFields({});
      fetchMetrics();
    } catch (err) {
      console.error('Failed to submit metrics', err);
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = [...metrics].reverse().map(m => {
    const dataPoint: any = {
      name: format(new Date(m.weekStartDate), 'MMM dd'),
      weight: m.weight,
      bmi: m.bmi,
    };
    dynamicFields.forEach(field => {
      if (field.type === 'number') {
        dataPoint[field.key] = Number(m.extraFields?.[field.key]) || 0;
      }
    });
    return dataPoint;
  });

  return (
    <Box>
      <PageContainer>
        <Grid container spacing={3}>
          {/* Submission Form */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUpload color="primary" /> This Week's Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Submit your data for the week starting {format(startOfWeek(new Date()), 'MMMM do')}.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Weight (kg)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Height (cm)"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    fullWidth
                  />
                  {dynamicFields.map((field) => (
                    <TextField
                      key={field.key}
                      label={field.label}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={extraFields[field.key] || ''}
                      onChange={(e) => setExtraFields({ ...extraFields, [field.key]: e.target.value })}
                      fullWidth
                    />
                  ))}
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={!weight || !height || submitting}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Weekly Data'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* History Table */}
          <Grid size={{ xs: 12, md: 8 }}>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                <Typography variant="h6">Metric History</Typography>
              </Box>
              <Divider />
              <Table>
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
                  {metrics.map((m) => (
                    <TableRow key={m._id} hover>
                      <TableCell>{format(new Date(m.weekStartDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{m.weight}</TableCell>
                      <TableCell>{m.height}</TableCell>
                      <TableCell>
                        <Chip 
                          label={m.bmi} 
                          size="small" 
                          color={m.bmi > 25 ? 'warning' : 'success'} 
                          variant="outlined" 
                        />
                      </TableCell>
                      {dynamicFields.map((field) => (
                        <TableCell key={field.key}>{String(m.extraFields?.[field.key] ?? '-')}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {metrics.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4 + dynamicFields.length} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">No history found. Start by submitting this week's data.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Charts Section */}
          {metrics.length > 0 && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <ShowChart color="primary" />
                      <Typography variant="h6">Weight Progress (kg)</Typography>
                    </Box>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1a237e" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#1a237e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#666' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#666' }}
                            domain={['dataMin - 2', 'dataMax + 2']}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#1a237e" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorWeight)" 
                            dot={{ r: 4, fill: '#1a237e', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <ShowChart color="secondary" />
                      <Typography variant="h6">BMI Trend</Typography>
                    </Box>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c2185b" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#c2185b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#666' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#666' }}
                            domain={['dataMin - 1', 'dataMax + 1']}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="bmi" 
                            stroke="#c2185b" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorBmi)" 
                            dot={{ r: 4, fill: '#c2185b', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {dynamicFields.filter(f => f.type === 'number').map((field, idx) => {
                const color = ['#00796b', '#f57c00', '#5e35b1', '#d81b60', '#1976d2'][idx % 5];
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={field.key}>
                    <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                          <ShowChart sx={{ color }} />
                          <Typography variant="h6">{field.label}</Typography>
                        </Box>
                        <Box sx={{ height: 300, width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id={`color-${field.key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: '#666' }} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: '#666' }}
                                domain={['dataMin - 1', 'dataMax + 1']}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey={field.key} 
                                stroke={color} 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill={`url(#color-${field.key})`} 
                                dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </>
          )}
        </Grid>
      </PageContainer>
    </Box>
  );
}
