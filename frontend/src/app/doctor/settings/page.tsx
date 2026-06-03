'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  useTheme,
  alpha,
  Fade,
  Zoom
} from '@mui/material';
import {
  Save,
  AccessTime,
  Payments,
  Public,
  Delete,
  Add,
  History,
  Assignment,
  Schedule,
  EventBusy
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, DoctorSettings as DoctorSettingsType } from '@/lib/api';
import { formatDateTimeInputInTimeZone } from '@/lib/dateUtils';



export default function DoctorSettingsPage() {
  const [settings, setSettings] = useState<DoctorSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getDoctorSettings();
        setSettings(data || {
          timezone: 'UTC',
          defaultSlotDurationMinutes: 30,
          appointmentFeePaise: 0,
          weeklyAvailability: [],
          breaks: [],
          holidays: [],
          blockedSlots: [],
          dynamicMetricFields: []
        });
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    try {
      const updated = await api.updateDoctorSettings(settings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof DoctorSettingsType, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleAddAvailability = (dayOfWeek: number) => {
    if (!settings) return;
    const newAvail = [...settings.weeklyAvailability];
    const existing = newAvail.find(a => a.dayOfWeek === dayOfWeek);
    if (existing) {
      existing.workingHours.push({ start: '09:00', end: '17:00' });
    } else {
      newAvail.push({ dayOfWeek, workingHours: [{ start: '09:00', end: '17:00' }] });
    }
    updateField('weeklyAvailability', newAvail);
  };

  const handleRemoveAvailability = (dayIdx: number, hourIdx: number) => {
    if (!settings) return;
    const newAvail = [...settings.weeklyAvailability];
    newAvail[dayIdx].workingHours.splice(hourIdx, 1);
    if (newAvail[dayIdx].workingHours.length === 0) {
      newAvail.splice(dayIdx, 1);
    }
    updateField('weeklyAvailability', newAvail);
  };

  const handleUpdateAvailability = (dayIdx: number, hourIdx: number, field: 'start' | 'end', value: string) => {
    if (!settings) return;
    const newAvail = [...settings.weeklyAvailability];
    newAvail[dayIdx].workingHours[hourIdx][field] = value;
    setSettings({ ...settings, weeklyAvailability: newAvail });
  };

  const handleAddBreak = () => {
    if (!settings) return;
    updateField('breaks', [...(settings.breaks || []), { dayOfWeek: 1, start: '13:00', end: '14:00' }]);
  };

  const handleRemoveBreak = (idx: number) => {
    if (!settings) return;
    const newBreaks = [...settings.breaks];
    newBreaks.splice(idx, 1);
    updateField('breaks', newBreaks);
  };

  const handleUpdateBreak = (idx: number, field: string, value: any) => {
    if (!settings) return;
    const newBreaks = [...settings.breaks];
    (newBreaks[idx] as any)[field] = value;
    updateField('breaks', newBreaks);
  };

  const handleAddHoliday = () => {
    if (!settings) return;
    updateField('holidays', [...(settings.holidays || []), { date: new Date().toISOString().split('T')[0], isFullDay: true, note: '' }]);
  };

  const handleRemoveHoliday = (idx: number) => {
    if (!settings) return;
    const newHolidays = [...settings.holidays];
    newHolidays.splice(idx, 1);
    updateField('holidays', newHolidays);
  };

  const handleUpdateHoliday = (idx: number, field: string, value: any) => {
    if (!settings) return;
    const newHolidays = [...settings.holidays];
    (newHolidays[idx] as any)[field] = value;
    updateField('holidays', newHolidays);
  };

  const handleAddMetric = () => {
    if (!settings) return;
    updateField('dynamicMetricFields', [...(settings.dynamicMetricFields || []), { key: '', label: '', type: 'number' }]);
  };

  const handleRemoveMetric = (idx: number) => {
    if (!settings) return;
    const newMetrics = [...settings.dynamicMetricFields];
    newMetrics.splice(idx, 1);
    updateField('dynamicMetricFields', newMetrics);
  };

  const handleUpdateMetric = (idx: number, field: string, value: any) => {
    if (!settings) return;
    const newMetrics = [...settings.dynamicMetricFields];
    (newMetrics[idx] as any)[field] = value;
    updateField('dynamicMetricFields', newMetrics);
  };

  const handleAddBlock = () => {
    if (!settings) return;
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    const tz = settings.timezone || 'UTC';
    updateField('blockedSlots', [...(settings.blockedSlots || []), { 
      start: formatDateTimeInputInTimeZone(now, tz), 
      end: formatDateTimeInputInTimeZone(oneHourLater, tz), 
      reason: '' 
    }]);
  };

  const handleRemoveBlock = (idx: number) => {
    if (!settings) return;
    const newBlocks = [...settings.blockedSlots];
    newBlocks.splice(idx, 1);
    updateField('blockedSlots', newBlocks);
  };

  const handleUpdateBlock = (idx: number, field: string, value: any) => {
    if (!settings) return;
    const newBlocks = [...settings.blockedSlots];
    (newBlocks[idx] as any)[field] = value;
    updateField('blockedSlots', newBlocks);
  };

  const toDateTimeInputValue = (value: string) => {
    if (!settings) return value.slice(0, 16);
    if (value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value)) {
      return formatDateTimeInputInTimeZone(value, settings.timezone || 'UTC');
    }
    return value.slice(0, 16);
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) return null;
  

  return (
    <Box>
      <PageContainer>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: 2,
          mb: 3 
        }}>
          <Typography variant="body2" color="text.secondary">
            Manage your practice availability and configurations.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{ px: 4, width: { xs: '100%', sm: 'auto' } }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

        {success && (
          <Fade in={success}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Settings saved successfully!
            </Alert>
          </Fade>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* General Settings */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Public color="primary" fontSize="small" /> General Configuration
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Timezone</InputLabel>
                        <Select
                          value={settings?.timezone || 'UTC'}
                          label="Timezone"
                          onChange={(e) => updateField('timezone', e.target.value)}
                        >
                          <MenuItem value="UTC">UTC (Universal Time)</MenuItem>
                          <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST - India)</MenuItem>
                          <MenuItem value="America/New_York">America/New_York (EST/EDT - New York)</MenuItem>
                          <MenuItem value="America/Chicago">America/Chicago (CST/CDT - Chicago)</MenuItem>
                          <MenuItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT - Los Angeles)</MenuItem>
                          <MenuItem value="Europe/London">Europe/London (GMT/BST - London)</MenuItem>
                          <MenuItem value="Europe/Paris">Europe/Paris (CET/CEST - Paris)</MenuItem>
                          <MenuItem value="Asia/Dubai">Asia/Dubai (GST - Dubai)</MenuItem>
                          <MenuItem value="Asia/Singapore">Asia/Singapore (SGT - Singapore)</MenuItem>
                          <MenuItem value="Asia/Hong_Kong">Asia/Hong_Kong (HKT - Hong Kong)</MenuItem>
                          <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST - Tokyo)</MenuItem>
                          <MenuItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT - Sydney)</MenuItem>
                          <MenuItem value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT - Auckland)</MenuItem>
                          <MenuItem value="Africa/Johannesburg">Africa/Johannesburg (SAST - Johannesburg)</MenuItem>
                          <MenuItem value="America/Sao_Paulo">America/Sao_Paulo (BRT/BRST - São Paulo)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Slot Duration (Minutes)"
                        type="number"
                        value={settings?.defaultSlotDurationMinutes || 30}
                        onChange={(e) => updateField('defaultSlotDurationMinutes', parseInt(e.target.value))}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payments color="primary" fontSize="small" /> Billing & Fees
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Appointment Fee (in Paise)"
                        type="number"
                        value={settings?.appointmentFeePaise || 0}
                        onChange={(e) => updateField('appointmentFeePaise', parseInt(e.target.value))}
                        fullWidth
                        helperText="100 paise = 1 INR"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

               {/* Availability Settings */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime color="primary" fontSize="small" /> Weekly Availability
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure your working hours for each day of the week.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {DAYS.map((day, idx) => (
                      <Chip 
                        key={idx} 
                        label={day} 
                        onClick={() => handleAddAvailability(idx)}
                        color={settings?.weeklyAvailability?.some(a => a.dayOfWeek === idx) ? 'primary' : 'default'}
                        variant={settings?.weeklyAvailability?.some(a => a.dayOfWeek === idx) ? 'filled' : 'outlined'}
                        icon={<Add />}
                      />
                    ))}
                  </Box>

                  {settings?.weeklyAvailability?.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((avail, dayIdx) => (
                    <Box key={avail.dayOfWeek} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>{DAYS[avail.dayOfWeek]}</Typography>
                      {avail.workingHours.map((hours, hourIdx) => (
                        <Box key={hourIdx} sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2, 
                          alignItems: { xs: 'stretch', sm: 'center' }, 
                          mb: 2 
                        }}>
                          <TextField
                            label="Start"
                            type="time"
                            size="small"
                            value={hours.start}
                            onChange={(e) => handleUpdateAvailability(dayIdx, hourIdx, 'start', e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                          />
                          <TextField
                            label="End"
                            type="time"
                            size="small"
                            value={hours.end}
                            onChange={(e) => handleUpdateAvailability(dayIdx, hourIdx, 'end', e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                          />
                          <IconButton size="small" color="error" onClick={() => handleRemoveAvailability(dayIdx, hourIdx)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button size="small" startIcon={<Add />} onClick={() => handleAddAvailability(avail.dayOfWeek)}>
                        Add Hours
                      </Button>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Breaks Settings */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History color="primary" fontSize="small" /> Daily Breaks
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {settings?.breaks?.map((brk, idx) => (
                    <Box key={idx} sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2, 
                      alignItems: { xs: 'stretch', sm: 'center' }, 
                      mb: 3,
                      p: { xs: 2, sm: 0 },
                      border: { xs: '1px dashed', sm: 'none' },
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                        <InputLabel>Day</InputLabel>
                        <Select
                          value={brk.dayOfWeek}
                          label="Day"
                          onChange={(e) => handleUpdateBreak(idx, 'dayOfWeek', e.target.value)}
                        >
                          {DAYS.map((day, dIdx) => <MenuItem key={dIdx} value={dIdx}>{day}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Start"
                        type="time"
                        size="small"
                        value={brk.start}
                        onChange={(e) => handleUpdateBreak(idx, 'start', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                      />
                      <TextField
                        label="End"
                        type="time"
                        size="small"
                        value={brk.end}
                        onChange={(e) => handleUpdateBreak(idx, 'end', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                      />
                      <IconButton size="small" color="error" onClick={() => handleRemoveBreak(idx)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} onClick={handleAddBreak}>Add Break</Button>
                </CardContent>
              </Card>

              {/* Holidays Settings */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Public color="primary" fontSize="small" /> Holidays & Time Off
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {settings?.holidays?.map((h, idx) => (
                    <Box key={idx} sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2, 
                      alignItems: { xs: 'stretch', sm: 'center' }, 
                      mb: 3,
                      p: { xs: 2, sm: 0 },
                      border: { xs: '1px dashed', sm: 'none' },
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <TextField
                        label="Date"
                        type="date"
                        size="small"
                        value={h.date}
                        onChange={(e) => handleUpdateHoliday(idx, 'date', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                      />
                      <TextField
                        label="Note"
                        size="small"
                        value={h.note}
                        onChange={(e) => handleUpdateHoliday(idx, 'note', e.target.value)}
                        placeholder="Public Holiday, Personal, etc."
                        fullWidth
                      />
                      <IconButton size="small" color="error" onClick={() => handleRemoveHoliday(idx)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} onClick={handleAddHoliday}>Add Holiday</Button>
                </CardContent>
              </Card>

              {/* Dynamic Metrics */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment color="primary" fontSize="small" /> Custom Client Metrics
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Define custom fields that you want to track for your clients (e.g., Blood Sugar, Sleep Hours).
                  </Typography>
                  {settings?.dynamicMetricFields?.map((m, idx) => (
                    <Box key={idx} sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2, 
                      alignItems: { xs: 'stretch', sm: 'center' }, 
                      mb: 3,
                      p: { xs: 2, sm: 0 },
                      border: { xs: '1px dashed', sm: 'none' },
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <TextField
                        label="Label"
                        size="small"
                        value={m.label}
                        onChange={(e) => handleUpdateMetric(idx, 'label', e.target.value)}
                        onBlur={(e) => handleUpdateMetric(idx, 'key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        placeholder="e.g. Blood Pressure"
                        fullWidth
                      />
                      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={m.type}
                          label="Type"
                          onChange={(e) => handleUpdateMetric(idx, 'type', e.target.value)}
                        >
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="text">Text</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton size="small" color="error" onClick={() => handleRemoveMetric(idx)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} onClick={handleAddMetric}>Add Metric Field</Button>
                </CardContent>
              </Card>

              {/* Blocked Slots */}
              <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History color="primary" fontSize="small" /> Blocked Time Slots
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Prevent any bookings during specific date/time ranges.
                  </Typography>
                  {settings?.blockedSlots?.map((b, idx) => (
                    <Box key={idx} sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2, 
                      alignItems: { xs: 'stretch', sm: 'center' }, 
                      mb: 3,
                      p: { xs: 2, sm: 0 },
                      border: { xs: '1px dashed', sm: 'none' },
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <TextField
                        label="Start"
                        type="datetime-local"
                        size="small"
                        value={toDateTimeInputValue(b.start)}
                        onChange={(e) => handleUpdateBlock(idx, 'start', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                      />
                      <TextField
                        label="End"
                        type="datetime-local"
                        size="small"
                        value={toDateTimeInputValue(b.end)}
                        onChange={(e) => handleUpdateBlock(idx, 'end', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                      />
                      <TextField
                        label="Reason"
                        size="small"
                        value={b.reason}
                        onChange={(e) => handleUpdateBlock(idx, 'reason', e.target.value)}
                        placeholder="e.g. Surgery"
                        fullWidth
                      />
                      <IconButton size="small" color="error" onClick={() => handleRemoveBlock(idx)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} onClick={handleAddBlock}>Block a Slot</Button>
                </CardContent>
              </Card>
            </Box>
      </PageContainer>
    </Box>
  );
}
