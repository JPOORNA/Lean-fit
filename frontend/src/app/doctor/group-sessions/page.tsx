'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Refresh, VideoCall, Edit } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { api, GroupSessionBooking, GroupSessionSlot } from '@/lib/api';
import { formatInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';

const formatPrice = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

export default function DoctorGroupSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<GroupSessionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createMax, setCreateMax] = useState('');
  const [editingSlot, setEditingSlot] = useState<GroupSessionSlot | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMax, setEditMax] = useState('');
  const [bookingSlot, setBookingSlot] = useState<GroupSessionSlot | null>(null);
  const [bookings, setBookings] = useState<GroupSessionBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listDoctorGroupSessions();
      setSlots(data.slots);
    } catch (err) {
      setError('Unable to load group sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const canJoin = (slot: GroupSessionSlot) => slot.status === 'in_progress';

  const onCreate = async () => {
    if (!createStart || !createEnd || !createPrice || !createMax) {
      setCreateError('Please fill all fields to create a group session slot.');
      return;
    }
    if (new Date(createEnd).getTime() <= new Date(createStart).getTime()) {
      setCreateError('End time must be after start time.');
      return;
    }
    setCreateError('');
    setCreating(true);
    try {
      await api.createGroupSessionSlot({
        startTime: createStart,
        endTime: createEnd,
        pricePaise: Math.round(Number(createPrice) * 100),
        maxPeople: Number(createMax)
      });
      setCreateStart('');
      setCreateEnd('');
      setCreatePrice('');
      setCreateMax('');
      setCreateDialogOpen(false);
      await fetchSlots();
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Unable to create group session.'));
    } finally {
      setCreating(false);
    }
  };

  const onOpenEdit = (slot: GroupSessionSlot) => {
    setEditingSlot(slot);
    setEditPrice(String(slot.pricePaise / 100));
    setEditMax(String(slot.maxPeople));
  };

  const onSaveEdit = async () => {
    if (!editingSlot || !editPrice || !editMax) return;
    try {
      await api.updateGroupSessionSlot(editingSlot._id, {
        pricePaise: Math.round(Number(editPrice) * 100),
        maxPeople: Number(editMax)
      });
      setEditingSlot(null);
      fetchSlots();
    } catch (err) {
      setError('Unable to update group session.');
    }
  };

  const onStart = async (slotId: string) => {
    try {
      await api.startGroupSessionSlot(slotId);
      fetchSlots();
    } catch (err) {
      setError('Unable to start group session.');
    }
  };

  const onEnd = async (slotId: string) => {
    try {
      await api.endGroupSessionSlot(slotId);
      fetchSlots();
    } catch (err) {
      setError('Unable to end group session.');
    }
  };

  const onOpenBookings = async (slot: GroupSessionSlot) => {
    setBookingSlot(slot);
    setBookings([]);
    setBookingsError('');
    setBookingsLoading(true);
    try {
      const data = await api.listGroupSessionBookings(slot._id);
      setBookings(data.bookings);
    } catch (err) {
      setBookingsError('Unable to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  };

  const onUpdateBookingStatus = async (paymentId: string, status: GroupSessionBooking['status']) => {
    try {
      await api.updateGroupSessionPaymentStatus(paymentId, status);
      if (bookingSlot) {
        const data = await api.listGroupSessionBookings(bookingSlot._id);
        setBookings(data.bookings);
      }
    } catch (err) {
      setBookingsError('Unable to update payment status.');
    }
  };

  const filteredSlots = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return slots.filter((slot) => {
      if (dateFilter) {
        return new Date(slot.startTime).toISOString().split('T')[0] === dateFilter;
      }
      return new Date(slot.startTime).getTime() >= todayStart.getTime();
    });
  }, [slots, dateFilter]);

  return (
    <Box>
      <PageContainer>
        {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

        <Paper sx={{ 
          mb: 3, 
          p: 2, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: 2,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <TextField
            size="small"
            type="date"
            label="Filter date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          />
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2, 
            alignItems: { xs: 'stretch', sm: 'center' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              variant="contained"
              onClick={() => {
                setCreateError('');
                setCreateDialogOpen(true);
              }}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Create Slot
            </Button>
            <Button 
              startIcon={<Refresh />} 
              variant="outlined" 
              color="inherit"
              onClick={fetchSlots} 
              disabled={loading}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', width: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seats</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSlots.map((slot) => (
                <TableRow key={slot._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Start: {formatInTimeZone(slot.startTime, user?.timezone, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      End: {formatInTimeZone(slot.endTime, user?.timezone, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatPrice(slot.pricePaise)}</TableCell>
                  <TableCell>
                    <Chip label={`${slot.bookedUserIds.length}/${slot.maxPeople}`} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={slot.status.toUpperCase()} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                      <IconButton size="small" onClick={() => onOpenEdit(slot)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <Button size="small" variant="outlined" onClick={() => onOpenBookings(slot)}>
                        Bookings
                      </Button>
                      {slot.status === 'scheduled' && (
                        <Button size="small" variant="outlined" onClick={() => onStart(slot._id)}>
                          Start
                        </Button>
                      )}
                      {slot.status === 'in_progress' && (
                        <Button size="small" color="error" variant="outlined" onClick={() => onEnd(slot._id)}>
                          End
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VideoCall />}
                        disabled={!canJoin(slot)}
                        onClick={() => router.push(`/meeting/group-${slot._id}`)}
                      >
                        Join
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSlots.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No group sessions created yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>

      <Dialog open={Boolean(editingSlot)} onClose={() => setEditingSlot(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit group session</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            label="Price (INR)"
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">INR</InputAdornment> } }}
          />
          <TextField
            label="Max people"
            type="number"
            value={editMax}
            onChange={(e) => setEditMax(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingSlot(null)}>Cancel</Button>
          <Button variant="contained" onClick={onSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={() => !creating && setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create group session</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          {createError ? <Alert severity="error">{createError}</Alert> : null}
          <TextField
            label="Start"
            type="datetime-local"
            value={createStart}
            onChange={(e) => setCreateStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End"
            type="datetime-local"
            value={createEnd}
            onChange={(e) => setCreateEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Price (INR)"
            type="number"
            value={createPrice}
            onChange={(e) => setCreatePrice(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">INR</InputAdornment> } }}
          />
          <TextField
            label="Max people"
            type="number"
            value={createMax}
            onChange={(e) => setCreateMax(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Slot'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(bookingSlot)} onClose={() => setBookingSlot(null)} maxWidth="md" fullWidth>
        <DialogTitle>Group session bookings</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          {bookingsError ? <Alert severity="error">{bookingsError}</Alert> : null}
          {bookingsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : bookings.length === 0 ? (
            <Typography color="text.secondary">No bookings yet.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {typeof booking.userId === 'object' ? booking.userId.name : booking.userId}
                        </Typography>
                        {typeof booking.userId === 'object' && (
                          <Typography variant="caption" color="text.secondary">
                            {booking.userId.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(booking.amount)}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            label="Status"
                            value={booking.status}
                            onChange={(e) => onUpdateBookingStatus(booking._id, e.target.value as GroupSessionBooking['status'])}
                          >
                            <MenuItem value="created">Created</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBookingSlot(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
