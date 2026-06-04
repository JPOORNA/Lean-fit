'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  Payment,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, AppointmentSlot } from '@/lib/api';
import { format } from 'date-fns';
import { formatInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';
import PolicyLinks from '@/components/public/PolicyLinks';

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => Promise<void>;
  prefill: { name: string; email: string };
  theme: { color: string };
}

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError('');
      setSelectedSlot(null);
      try {
        const data = await api.listAvailableSlots(selectedDate);
        setSlots(data.slots);
      } catch (err: unknown) {
        console.error('Failed to load slots', err);
        setError('Failed to load available slots.');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  const handleBookAndPay = async () => {
    if (!selectedSlot) return;
    if (!acceptedPolicies) {
      setError('Please agree to the policies before booking and paying.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const { appointment } = await api.bookAppointment({
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        type: 'one_off'
      });

      const { order } = await api.createPaymentOrder(appointment._id);

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Leanfit',
        description: 'Appointment Booking Fee',
        order_id: order.id,
        handler: async (response) => {
          await api.verifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          alert('Payment Successful! Appointment confirmed.');
          window.location.href = '/user/appointments';
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#1a237e',
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: RazorpayOptions) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed. Please try again.';
      setError(message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <Box>
      <PageContainer>
        <Grid container spacing={3}>
          {/* Date Selection */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth color="primary" /> Select Date
                </Typography>
                <Divider sx={{ my: 2 }} />
                <TextField
                  type="date"
                  fullWidth
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Slot Selection */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="primary" /> Available Slots
                </Typography>
                <Divider sx={{ my: 2 }} />

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : slots.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
                    No slots available for this date.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {slots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={selectedSlot?.start === slot.start ? 'contained' : 'outlined'}
                        onClick={() => setSelectedSlot(slot)}
                        sx={{ minWidth: 110 }}
                      >
                        {formatInTimeZone(slot.start, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Button>
                    ))}
                  </Box>
                )}

                {selectedSlot ? (
                  <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptedPolicies}
                          onChange={(e) => setAcceptedPolicies(e.target.checked)}
                          sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          I agree to the{' '}
                          <Link href="/terms">Terms of Service</Link>,{' '}
                          {' '}<Link href="/privacy">Privacy Policy</Link>, and{' '}
                          <Link href="/cancellation-refund">Cancellation & Refund Policy</Link> before booking and paying.
                        </Typography>
                      }
                      sx={{ alignItems: 'flex-start' }}
                    />
                    <PolicyLinks />
                  </Box>
                ) : (
                  <Box sx={{ mt: 3 }}>
                    <PolicyLinks showPrefix />
                  </Box>
                )}
              </CardContent>
              {selectedSlot && (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">Selected Slot:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {formatInTimeZone(selectedSlot.start, user?.timezone, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Times shown in {user?.timezone || 'UTC'}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={booking ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                      disabled={booking || !acceptedPolicies}
                      onClick={handleBookAndPay}
                    >
                      Book & Pay Now
                    </Button>
                  </Box>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </PageContainer>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </Box>
  );
}
