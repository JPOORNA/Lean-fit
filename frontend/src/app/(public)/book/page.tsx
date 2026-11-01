'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Alert, Box, Button, Card, CardContent, Checkbox, Container, FormControlLabel, TextField, Typography } from '@mui/material';
import { api, AppointmentSlot } from '@/lib/api';
import { colors } from '@/lib/colors';
import { publicContact } from '@/lib/publicContact';
import { useAuth } from '@/components/auth/AuthProvider';

type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type CheckoutOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email: string; contact: string }; theme: { color: string };
  handler: (response: CheckoutResponse) => Promise<void>; modal: { ondismiss: () => void };
};

export default function DirectBookingPage() {
  const { user } = useAuth();
  const [detailsDraft, setDetails] = useState<{ name: string; email: string; whatsappNumber: string } | null>(null);
  const details = detailsDraft ?? { name: user?.name ?? '', email: user?.email ?? '', whatsappNumber: user?.whatsappNumber ?? '' };
  const [date, setDate] = useState('');
  const [firstDate, setFirstDate] = useState('');
  const [fee, setFee] = useState<number | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [doctorTimezone, setDoctorTimezone] = useState('Asia/Kolkata');
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selected, setSelected] = useState<AppointmentSlot | null>(null);
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [scriptReady, setScriptReady] = useState(false);
  const [paid, setPaid] = useState(false);
  const [checkout, setCheckout] = useState<Awaited<ReturnType<typeof api.guestBook>> | null>(null);
  useEffect(() => {
    api.guestSettings().then(settings => {
      setFee(settings.appointmentFeePaise);
      const zone = settings.timezone || 'Asia/Kolkata';
      setDoctorTimezone(zone);
      setFirstDate(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
    }).catch(() => setError('Could not load booking settings. Please reload to try again.')).finally(() => setSettingsLoading(false));
  }, []);
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    api.guestSlots(date).then(result => { if (!cancelled) setSlots(result.slots); }).catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);
  const sendCode = async () => {
    if (!/^\+[1-9]\d{7,14}$/.test(details.whatsappNumber)) { setError('Enter your WhatsApp number with country code first.'); return; }
    setBusy(true); setError('');
    try { const result = await api.requestOtp(details.whatsappNumber, 'whatsapp', 'booking'); setChallengeId(result.challengeId); setMessage('Check WhatsApp for a 6-digit code. You can book without creating an account.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not send code.'); }
    finally { setBusy(false); }
  };
  const pay = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !accepted || (!challengeId && !checkout)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const session = checkout ?? await api.guestBook({ ...details, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, challengeId, code, startTime: selected.start, endTime: selected.end, acceptedPolicies: accepted });
      setCheckout(session);
      const Razorpay = (window as unknown as { Razorpay: new (options: CheckoutOptions) => { open: () => void } }).Razorpay;
      if (!Razorpay) throw new Error('Payment checkout has not loaded. Please try again.');
      new Razorpay({ key: session.keyId, amount: session.order.amount, currency: session.order.currency,
        name: 'Leanfit', description: 'Consultation booking', order_id: session.order.id,
        prefill: { ...details, contact: details.whatsappNumber }, theme: { color: colors.primary },
        modal: { ondismiss: () => { setBusy(false); setMessage('Payment was closed. You can retry the same booking below.'); } },
        handler: async response => {
          try {
            const result = await api.guestVerify({ bookingToken: session.bookingToken, orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
            setPaid(true); setMessage(result.message);
          } catch (err) { setError(err instanceof Error ? err.message : 'Payment verification failed. Contact support with your payment reference.'); }
          finally { setBusy(false); }
        }
      }).open();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not book. Please try again.'); setBusy(false); }
  };
  const feeLabel = fee === null ? (settingsLoading ? 'Loading…' : 'Currently unavailable') : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fee / 100);
  const timeZoneLabel = doctorTimezone === 'Asia/Kolkata' ? 'Indian Standard Time (IST)' : doctorTimezone;
  const cardSx = { minWidth: 0, border: '1px solid #e4e7e2', borderRadius: '8px', boxShadow: '0 4px 20px rgba(36, 51, 35, 0.035)', bgcolor: '#fff' };
  const labelSx = { display: 'block', fontSize: 13, fontWeight: 500, color: colors.body, mb: 0.75 };

  return <Box sx={{ bgcolor: '#fafbf9', pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 10 }, minHeight: '100vh' }}>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} onError={() => setError('Payment checkout could not load. Please reload to try again.')} />
    <Container maxWidth="lg">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: { xs: 2.5, md: 3.5 }, alignItems: 'start' }}>
        <Card component="aside" sx={cardSx}>
          <CardContent sx={{ p: { xs: 3, md: 3.5 }, '&:last-child': { pb: 3.5 } }}>
            <Typography component="h1" sx={{ fontSize: 23, fontWeight: 650, color: colors.heading, mb: 2 }}>Procedure Details</Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: 'text.secondary' }}>
              Schedule an online consultation call to get expert guidance, clarify doubts, and discuss suitable training options in detail.{' '}
              <Box component="span" sx={{ color: '#b14b40', fontWeight: 600 }}>Please note: No personalized diet or workout plans are shared in this call.</Box>
            </Typography>
            <Box component="ul" sx={{ pl: 2.25, mb: 0, mt: 2, color: 'text.secondary', fontSize: 14, lineHeight: 1.65, '& li': { pl: 0.25, mb: 1.5 }, '& strong': { fontWeight: 600, color: colors.body } }}>
              <li><strong>Consultation Duration:</strong> 30–45 minutes</li>
              <li><strong>Fee:</strong> {feeLabel} (Non-refundable)</li>
              <li><strong>Rescheduling:</strong> Contact us in advance if you need to change your slot. Requests are subject to our <Link href="/cancellation-refund" style={{ color: colors.primary }}>Cancellation & Refund Policy</Link>.</li>
              <li><strong>Confidentiality:</strong> All information shared will remain confidential.</li>
              <li><strong>All time slots are in:</strong> {timeZoneLabel}</li>
              <li><strong>Important:</strong> Each consultation call is strictly for one individual only. Group or couple calls are not permitted.</li>
            </Box>
            <Box component="section" sx={{ mt: 3, pt: 3, borderTop: '1px solid #e4e7e2' }}>
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, color: colors.heading, mb: 1 }}>Booking Confirmation</Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: 'text.secondary' }}>
                Your consultation slot will be confirmed after successful payment and completion of the booking process. Please keep your registered contact details active for updates.
              </Typography>
            </Box>
            <Box component="section" sx={{ mt: 3 }}>
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, color: colors.heading, mb: 1 }}>Customer Support</Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: 'text.secondary', mb: 1 }}>
                For booking assistance, rescheduling requests, or other queries, contact us at:
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.body, mb: 0.5 }}>Email:</Typography>
              {publicContact.emails.map(email => (
                <Box key={email} component="a" href={`mailto:${email}`} sx={{ display: 'block', color: colors.primary, fontSize: 14, lineHeight: 1.8, overflowWrap: 'anywhere', textUnderlineOffset: 3 }}>{email}</Box>
              ))}
            </Box>
            <Typography component="p" sx={{ mt: 3, mb: 0, p: 2, borderRadius: '8px', bgcolor: colors.primaryFaint, borderLeft: `4px solid ${colors.primary}`, color: colors.heading, fontSize: { xs: 18, md: 20 }, fontWeight: 800, lineHeight: 1.5 }}>
              We look forward to helping you take the next step towards your fitness goals!
            </Typography>
          </CardContent>
        </Card>
        <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 3, md: 3.5 }, '&:last-child': { pb: 3.5 } }}>
              <Typography component="h2" sx={{ textAlign: 'center', fontSize: 23, fontWeight: 650, color: colors.heading, mb: 3 }}>Book Consultation</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {message && <Alert severity={paid ? 'success' : 'info'} sx={{ mb: 2 }}>{message}</Alert>}
              {paid ? <Box>
                <Typography variant="h6" gutterBottom>Your consultation is confirmed</Typography>
                <Typography sx={{ mb: 2 }}>Your booking is linked to {details.email}. Use the same email when signing in or registering to find your bookings.</Typography>
                <Button component={Link} href="/register" variant="contained">Create an account</Button> <Button component={Link} href="/login">Sign in</Button>
              </Box> : <Box component="form" onSubmit={pay} sx={{ display: 'grid', gap: 2.25, '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#fff', fontSize: 14 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dce1d9' }, '& .MuiFormLabel-asterisk': { color: '#b14b40' } }}>
                <Box>
                  <Box component="label" htmlFor="booking-name" sx={labelSx}>Name <Box component="span" sx={{ color: '#b14b40' }}>*</Box></Box>
                  <TextField id="booking-name" size="small" fullWidth required disabled={!!checkout} placeholder="Enter your name" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} slotProps={{ htmlInput: { minLength: 2, maxLength: 100, autoComplete: 'name' } }} />
                </Box>
                <Box>
                  <Box component="label" htmlFor="booking-whatsapp" sx={labelSx}>WhatsApp Number <Box component="span" sx={{ color: '#b14b40' }}>*</Box></Box>
                  <TextField id="booking-whatsapp" size="small" fullWidth required disabled={!!checkout} type="tel" placeholder="+91  Enter your mobile number" value={details.whatsappNumber} onChange={e => { setDetails({ ...details, whatsappNumber: e.target.value.replace(/[\s()-]/g, '') }); setChallengeId(''); setCode(''); }} helperText="Include your country code, e.g. +919876543210" slotProps={{ htmlInput: { pattern: '\\+[1-9][0-9]{7,14}', autoComplete: 'tel' } }} />
                </Box>
                <Box>
                  <Box component="label" htmlFor="booking-email" sx={labelSx}>Email <Box component="span" sx={{ color: '#b14b40' }}>*</Box></Box>
                  <TextField id="booking-email" size="small" fullWidth required disabled={!!checkout} type="email" placeholder="Enter your email" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} slotProps={{ htmlInput: { autoComplete: 'email' } }} />
                </Box>
                <Box>
                  <Box component="label" htmlFor="booking-date" sx={labelSx}>Date <Box component="span" sx={{ color: '#b14b40' }}>*</Box></Box>
                  <TextField id="booking-date" type="date" size="small" fullWidth required disabled={!!checkout || !firstDate} value={date} onChange={e => { setDate(e.target.value); setSelected(null); setSlots([]); setLoading(true); setError(''); }} slotProps={{ htmlInput: { min: firstDate } }} />
                </Box>
                <Box>
                  <Box component="label" htmlFor="booking-time" sx={labelSx}>Time <Box component="span" sx={{ color: '#b14b40' }}>*</Box></Box>
                  <TextField select size="small" fullWidth required disabled={!!checkout || !date || loading || !slots.length} value={selected?.start ?? ''} onChange={e => setSelected(slots.find(slot => slot.start === e.target.value) ?? null)} slotProps={{ select: { native: true }, htmlInput: { id: 'booking-time' } }} helperText={date && !loading && !slots.length ? 'No appointments available. Please choose another date.' : `All times are in ${timeZoneLabel}.`}>
                    <option value="" disabled>{loading ? 'Loading available times…' : 'Select a time'}</option>
                    {slots.map(slot => <option key={slot.start} value={slot.start}>{new Date(slot.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: doctorTimezone })} – {new Date(slot.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: doctorTimezone })}</option>)}
                  </TextField>
                </Box>
                {!checkout && <>
                  <Button variant="outlined" onClick={sendCode} disabled={busy || !details.whatsappNumber} sx={{ textTransform: 'none', borderRadius: '6px' }}>{challengeId ? 'Resend WhatsApp code' : 'Verify WhatsApp to book'}</Button>
                  {challengeId && <TextField size="small" required label="WhatsApp verification code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}', autoComplete: 'one-time-code' } }} />}
                </>}
                <FormControlLabel sx={{ alignItems: 'flex-start', m: 0, '& .MuiCheckbox-root': { p: 0, mr: 1, mt: 0.25 } }} control={<Checkbox required disabled={!!checkout} size="small" checked={accepted} onChange={e => setAccepted(e.target.checked)} />} label={<Typography sx={{ fontSize: 12, lineHeight: 1.65, color: 'text.secondary', '& a': { color: colors.primary } }}>I agree to the <Link href="/terms">Terms</Link>, <Link href="/privacy">Privacy Policy</Link> and <Link href="/cancellation-refund">Cancellation & Refund Policy</Link>, and to receive booking updates by email and WhatsApp.</Typography>} />
                <Button type="submit" variant="contained" size="large" disableElevation disabled={busy || !selected || !accepted || (!checkout && (!challengeId || code.length !== 6)) || !scriptReady} sx={{ bgcolor: colors.primaryLight, '&:hover': { bgcolor: colors.primary }, borderRadius: '6px', textTransform: 'none', fontWeight: 650 }}>{busy ? 'Processing…' : checkout ? 'Retry payment' : 'Pay & Book'}</Button>
              </Box>}
            </CardContent>
          </Card>
          <Card sx={cardSx}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Button component={Link} href="/" fullWidth sx={{ bgcolor: '#f5e9e5', color: '#795c51', border: '1px solid #ead9d2', borderRadius: '6px', textTransform: 'none', '&:hover': { bgcolor: '#efdfd9' } }}>‹&nbsp; Back to home</Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  </Box>;
}
