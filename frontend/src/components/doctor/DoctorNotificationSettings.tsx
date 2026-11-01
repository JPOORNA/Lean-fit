'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControlLabel, IconButton, Switch, TextField, Typography } from '@mui/material';
import { Add, DeleteOutlined } from '@mui/icons-material';
import { api, DoctorNotificationRouting, DoctorNotificationRule, DoctorNotificationDelivery, NotificationEvent } from '@/lib/api';

const events: { key: NotificationEvent; label: string }[] = [
  { key: 'bookingConfirmation', label: 'Booking confirmations' },
  { key: 'bookingReminder', label: 'Booking reminders' },
  { key: 'subscriptionExpiry', label: 'Subscription expiry' },
  { key: 'mealUpload', label: 'Meal photo uploads' },
];

export default function DoctorNotificationSettings() {
  const [routing, setRouting] = useState<DoctorNotificationRouting | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DoctorNotificationDelivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    api.getDoctorNotificationRouting().then(result => { if (!cancelled) { setRouting(result.routing); setDeliveryStatus(result.deliveryStatus ?? []); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load notification recipients.'); });
    return () => { cancelled = true; };
  }, []);
  const refreshDeliveryStatus = async () => {
    setRefreshing(true); setError('');
    try { const result = await api.getDoctorNotificationRouting(); setDeliveryStatus(result.deliveryStatus ?? []); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not refresh delivery status.'); }
    finally { setRefreshing(false); }
  };
  const updateRule = (event: NotificationEvent, update: Partial<DoctorNotificationRule>) => {
    setMessage(''); setError('');
    setRouting(current => current && ({ ...current, events: { ...current.events, [event]: { ...current.events[event], ...update } } }));
  };
  const save = async () => {
    if (!routing) return;
    setError(''); setMessage('');
    const cleaned: DoctorNotificationRouting = { ...routing, events: { ...routing.events } };
    for (const event of events) {
      const rule = routing.events[event.key];
      const emails = [...new Set(rule.emails.map(value => value.trim().toLowerCase()).filter(Boolean))];
      const whatsappNumbers = [...new Set(rule.whatsappNumbers.map(value => value.trim().replace(/[\s()-]/g, '')).filter(Boolean))];
      if (emails.some(value => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) { setError(`${event.label}: enter a valid email address for every recipient.`); return; }
      if (whatsappNumbers.some(value => !/^\+[1-9]\d{7,14}$/.test(value))) { setError(`${event.label}: include the country code for every WhatsApp number, e.g. +919876543210.`); return; }
      if (rule.enabled && !emails.length && !whatsappNumbers.length) { setError(`${event.label}: add at least one recipient or turn this notification off.`); return; }
      cleaned.events[event.key] = { ...rule, emails, whatsappNumbers };
    }
    if (!Number.isInteger(cleaned.bookingReminderMinutes) || cleaned.bookingReminderMinutes < 5 || cleaned.bookingReminderMinutes > 10080) { setError('Set booking reminders between 5 and 10,080 minutes before the appointment.'); return; }
    if (!Number.isInteger(cleaned.subscriptionReminderDays) || cleaned.subscriptionReminderDays < 0 || cleaned.subscriptionReminderDays > 30) { setError('Set subscription reminders between 0 and 30 days before expiry.'); return; }
    setSaving(true);
    try { const result = await api.saveDoctorNotificationRouting(cleaned); setRouting(result.routing); setMessage('Notification recipients saved.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save notification recipients.'); }
    finally { setSaving(false); }
  };

  return <Card id="notification-recipients" sx={{ mb: 3, scrollMarginTop: 90 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
    <Typography variant="h6" gutterBottom>Notification settings</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {!routing && !error && <CircularProgress size={24} aria-label="Loading notification recipients" />}
    {routing && <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        {events.map(event => {
          const rule = routing.events[event.key];
          return <Box key={event.key} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 2.5 }}>
            <FormControlLabel sx={{ m: 0, mb: 2, width: '100%', justifyContent: 'space-between' }} labelPlacement="start" label={<Typography sx={{ fontWeight: 700 }}>{event.label}</Typography>} control={<Switch checked={rule.enabled} disabled={saving} onChange={e => updateRule(event.key, { enabled: e.target.checked })} />} />
            {deliveryStatus.filter(attempt => attempt.event === event.key).map(attempt => <Alert key={attempt.channel} severity={attempt.lastError && (attempt.status === 'failed' || attempt.status === 'pending') ? 'error' : 'info'} sx={{ mb: 1.5 }}>
              Latest {attempt.channel === 'email' ? 'email' : 'WhatsApp'} attempt: {attempt.status === 'sent' ? 'accepted by provider' : attempt.status === 'pending' ? attempt.attempts ? 'retry pending' : 'queued' : attempt.status}.
              {attempt.lastError && attempt.status !== 'sent' && <Box component="span" sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>{attempt.lastError}</Box>}
            </Alert>)}
            {(['emails', 'whatsappNumbers'] as const).map(channel => <Box key={channel} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{channel === 'emails' ? 'Email recipients' : 'WhatsApp recipients'}</Typography>
              {rule[channel].map((address, index) => <Box key={index} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
                <TextField fullWidth size="small" disabled={saving || !rule.enabled} type={channel === 'emails' ? 'email' : 'tel'} label={`${channel === 'emails' ? 'Email' : 'WhatsApp number'} ${index + 1}`} placeholder={channel === 'emails' ? 'name@example.com' : '+919876543210'} value={address} onChange={e => updateRule(event.key, { [channel]: rule[channel].map((value, position) => position === index ? e.target.value : value) })} />
                <IconButton disabled={saving || !rule.enabled} aria-label={`Remove ${event.label.toLowerCase()} ${channel === 'emails' ? 'email' : 'WhatsApp number'} ${index + 1}`} onClick={() => updateRule(event.key, { [channel]: rule[channel].filter((_, position) => position !== index) })}><DeleteOutlined /></IconButton>
              </Box>)}
              <Button size="small" startIcon={<Add />} disabled={saving || !rule.enabled} onClick={() => updateRule(event.key, { [channel]: [...rule[channel], ''] })} sx={{ display: 'flex', mt: 0.75 }}>Add {channel === 'emails' ? 'email' : 'WhatsApp number'}</Button>
            </Box>)}
          </Box>;
        })}
      </Box>
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="label" htmlFor="doctor-booking-reminder" variant="body2" sx={{ display: 'block', fontWeight: 500, mb: 1, whiteSpace: 'normal' }}>Booking reminder (minutes before)</Typography>
          <TextField type="number" disabled={saving} id="doctor-booking-reminder" fullWidth value={routing.bookingReminderMinutes} onChange={e => { setMessage(''); setRouting({ ...routing, bookingReminderMinutes: Number(e.target.value) }); }} slotProps={{ htmlInput: { min: 5, max: 10080 } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="label" htmlFor="doctor-subscription-reminder" variant="body2" sx={{ display: 'block', fontWeight: 500, mb: 1, whiteSpace: 'normal' }}>Subscription reminder (days before)</Typography>
          <TextField type="number" disabled={saving} id="doctor-subscription-reminder" fullWidth value={routing.subscriptionReminderDays} onChange={e => { setMessage(''); setRouting({ ...routing, subscriptionReminderDays: Number(e.target.value) }); }} slotProps={{ htmlInput: { min: 0, max: 30 } }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save notification recipients'}</Button>
        <Button variant="outlined" disabled={refreshing} onClick={refreshDeliveryStatus}>{refreshing ? 'Refreshing…' : 'Refresh delivery status'}</Button>
      </Box>
    </>}
  </CardContent></Card>;
}
