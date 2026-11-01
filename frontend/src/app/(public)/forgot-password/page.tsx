'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Container, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';

type FieldErrors = Partial<Record<'identifier' | 'code' | 'password' | 'confirm', string>>;
const contactHint = 'Enter your account email or WhatsApp number with country code, e.g. +919876543210.';
const contactError = (value: string) => {
  if (!value.trim()) return 'Enter your account email address or WhatsApp number.';
  if (value.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address, e.g. name@example.com.';
  return /^\+[1-9]\d{7,14}$/.test(value.trim().replace(/[\s()-]/g, '')) ? '' : 'Enter a valid WhatsApp number with country code, e.g. +919876543210.';
};
const readableError = (err: unknown, fallback: string) => err instanceof Error && err.message !== 'Validation error' ? err.message : fallback;

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const request = async () => {
    setError(''); setMessage('');
    const invalidContact = contactError(identifier);
    if (invalidContact) { setFieldErrors({ identifier: invalidContact }); return; }
    setFieldErrors({}); setBusy(true);
    try {
      const result = await api.requestOtp(identifier.trim(), channel, 'reset');
      setChallengeId(result.challengeId); setCode('');
      setMessage(`If these details match an account, a verification code has been sent to its saved ${channel === 'email' ? 'email address' : 'WhatsApp number'}. Check ${channel === 'email' ? 'your inbox and spam folder' : 'WhatsApp'}.`);
    } catch (err) { setError(readableError(err, 'Check your email address or WhatsApp number, including the country code, and try again.')); }
    finally { setBusy(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!challengeId) return request();
    setError('');
    const errors: FieldErrors = {};
    if (!/^\d{6}$/.test(code)) errors.code = 'Enter the 6-digit verification code sent to you.';
    if (password.length < 8) errors.password = 'Your new password must contain at least 8 characters.';
    else if (password.length > 128) errors.password = 'Your new password must contain no more than 128 characters.';
    if (password !== confirm) errors.confirm = 'Passwords do not match. Enter the same password again.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true); setMessage('');
    try { const result = await api.resetPassword(challengeId, code, password); setMessage(result.message); setDone(true); }
    catch (err) { setError(readableError(err, 'Check your 6-digit code and new password. Request a new code if the previous one has expired.')); }
    finally { setBusy(false); }
  };
  return <Box sx={{ bgcolor: colors.pageBg, py: { xs: 12, md: 18 }, minHeight: '100vh' }}><Container maxWidth="sm">
    <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>Reset your password</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Enter your account email or WhatsApp number and choose where to receive a verification code.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity={done ? 'success' : 'info'} sx={{ mb: 2 }}>{message}</Alert>}
      {!done && <Box component="form" noValidate onSubmit={submit} sx={{ display: 'grid', gap: 2.5 }}>
        <TextField required disabled={busy} type="text" label="Email or WhatsApp number" value={identifier} error={!!fieldErrors.identifier} onChange={e => { setIdentifier(e.target.value); setChallengeId(''); setCode(''); setMessage(''); setError(''); setFieldErrors({}); }} helperText={fieldErrors.identifier || contactHint} slotProps={{ htmlInput: { autoComplete: 'username' } }} />
        <TextField select disabled={busy} label="Send code to" value={channel} onChange={e => { setChannel(e.target.value as 'email' | 'whatsapp'); setChallengeId(''); setCode(''); setMessage(''); setError(''); setFieldErrors({}); }} helperText="The code goes to the selected email or WhatsApp number saved on your account.">
          <MenuItem value="email">Email</MenuItem><MenuItem value="whatsapp">WhatsApp</MenuItem>
        </TextField>
        {challengeId && <>
          <TextField required disabled={busy} label="6-digit verification code" value={code} error={!!fieldErrors.code} helperText={fieldErrors.code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors(previous => ({ ...previous, code: undefined })); setError(''); }} slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '[0-9]{6}' } }} />
          <TextField required disabled={busy} label="New password" type="password" value={password} error={!!fieldErrors.password} helperText={fieldErrors.password || 'Use between 8 and 128 characters.'} onChange={e => { setPassword(e.target.value); setFieldErrors(previous => ({ ...previous, password: undefined, confirm: undefined })); setError(''); }} slotProps={{ htmlInput: { minLength: 8, maxLength: 128, autoComplete: 'new-password' } }} />
          <TextField required disabled={busy} label="Confirm new password" type="password" value={confirm} error={!!fieldErrors.confirm} helperText={fieldErrors.confirm} onChange={e => { setConfirm(e.target.value); setFieldErrors(previous => ({ ...previous, confirm: undefined })); setError(''); }} slotProps={{ htmlInput: { autoComplete: 'new-password' } }} />
          <Button onClick={request} disabled={busy}>Resend code</Button>
        </>}
        <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Please wait…' : challengeId ? 'Reset password' : 'Send verification code'}</Button>
      </Box>}
      <Button component={Link} href="/login" sx={{ mt: 2 }}>Back to sign in</Button>
    </Paper>
  </Container></Box>;
}
