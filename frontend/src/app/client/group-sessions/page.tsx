'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { AccessTime, Payment } from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, GroupSessionSlot } from '@/lib/api';
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

const formatPrice = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

export default function ClientGroupSessionsPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<GroupSessionSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<GroupSessionSlot | null>(null);
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
        const data = await api.listAvailableGroupSessions();
        setSlots(data.slots);
      } catch (err: unknown) {
        console.error('Failed to load group sessions', err);
        setError('Failed to load available group sessions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, []);

  const handleBookAndPay = async () => {
    if (!selectedSlot) return;
    if (!acceptedPolicies) {
      setError('Please agree to the policies before booking and paying.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const { order } = await api.createGroupSessionOrder(selectedSlot._id);

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Leanfit',
        description: 'Group Session Booking Fee',
        order_id: order.id,
        handler: async (response) => {
          await api.verifyGroupSessionPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          alert('Payment successful! Group session booked.');
          window.location.href = '/client/appointments';
        },
        prefill: {
          name: user?.name ?? '',
          email: user?.email ?? '',
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
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="primary" /> Available Group Sessions
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
                No group sessions available.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {slots.map((slot) => (
                  <Button
                    key={slot._id}
                    variant={selectedSlot?._id === slot._id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedSlot(slot)}
                    sx={{ minWidth: 180, justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <Box sx={{ display: 'grid' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatInTimeZone(slot.startTime, user?.timezone, { month: 'short', day: '2-digit' })} · {formatInTimeZone(slot.startTime, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatPrice(slot.pricePaise)} · {slot.maxPeople - slot.bookedUserIds.length} seats
                      </Typography>
                    </Box>
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
                  <Typography variant="subtitle2">Selected Group Session:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {formatInTimeZone(selectedSlot.startTime, user?.timezone, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatPrice(selectedSlot.pricePaise)} · {selectedSlot.maxPeople - selectedSlot.bookedUserIds.length} seats left
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={booking ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                  disabled={booking || !acceptedPolicies}
                  onClick={handleBookAndPay}
                >
                  Book & Pay
                </Button>
              </Box>
            </Box>
          )}
        </Card>
      </PageContainer>

      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </Box>
  );
}
