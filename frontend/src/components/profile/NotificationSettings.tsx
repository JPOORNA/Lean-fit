'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { api, NotificationPreferences } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user?.role === 'doctor') return; api.getNotificationPreferences().then(data => setPreferences(data.preferences)).catch(err => setError(err.message)); }, [user?.role]);
  const save = async () => {
    if (!preferences) return;
    setSaving(true); setMessage(''); setError('');
    try { await api.saveNotificationPreferences(preferences); setMessage('Notification preferences saved.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save preferences.'); }
    finally { setSaving(false); }
  };
  const toggles: [keyof NotificationPreferences, string][] = [
    ['email', 'Email notifications'], ['whatsapp', 'WhatsApp notifications'], ['bookingConfirmation', 'Booking confirmations'],
    ['bookingReminder', 'Booking reminders'], ['subscriptionExpiry', 'Subscription expiry reminders'],
    ...(user?.role === 'doctor' ? [['mealUpload', 'New meal photo uploads'] as [keyof NotificationPreferences, string]] : [])
  ];
  if (user?.role === 'doctor') return <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Doctor notifications</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Choose recipients and turn notification types on or off in doctor settings.</Typography>
    <Button component={Link} href="/doctor/settings#notification-recipients" variant="outlined">Manage notification recipients</Button>
  </CardContent></Card>;
  return <Card sx={{ mt: 3 }}><CardContent sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Notification settings</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Choose how and when Leanfit contacts you. Verification codes are sent to the channel you request.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {preferences && <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {toggles.map(([key, label]) => <FormControlLabel key={key} label={label} control={<Switch checked={Boolean(preferences[key])} onChange={e => setPreferences({ ...preferences, [key]: e.target.checked })} />} />)}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, my: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="label" htmlFor="profile-booking-reminder" variant="body2" sx={{ display: 'block', fontWeight: 500, mb: 1, whiteSpace: 'normal' }}>Booking reminder (minutes before)</Typography>
          <TextField type="number" id="profile-booking-reminder" fullWidth value={preferences.bookingReminderMinutes} onChange={e => setPreferences({ ...preferences, bookingReminderMinutes: Number(e.target.value) })} slotProps={{ htmlInput: { min: 5, max: 10080 } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="label" htmlFor="profile-subscription-reminder" variant="body2" sx={{ display: 'block', fontWeight: 500, mb: 1, whiteSpace: 'normal' }}>Subscription reminder (days before)</Typography>
          <TextField type="number" id="profile-subscription-reminder" fullWidth value={preferences.subscriptionReminderDays} onChange={e => setPreferences({ ...preferences, subscriptionReminderDays: Number(e.target.value) })} slotProps={{ htmlInput: { min: 0, max: 30 } }} />
        </Box>
      </Box>
      <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save notification settings'}</Button>
    </>}
  </CardContent></Card>;
}
