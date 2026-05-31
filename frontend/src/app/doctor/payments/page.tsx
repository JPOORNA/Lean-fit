'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Payments,
  History,
  Undo,
  Info,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, PaymentRecord } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatAppointmentTime } from '@/lib/dateUtils';

export default function DoctorPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    todayGross: 0,
    weeklyGross: 0,
    monthlyGross: 0,
    overallGross: 0,
    totalOrders: 0,
    totalRefunds: 0,
    totalRefundedAmount: 0,
    netProfit: 0
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, typeFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.listAllPayments({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        paymentType: typeFilter || undefined
      });
      setPayments(data.payments);
      setTotal(data.pagination?.total ?? 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, debouncedSearch, statusFilter, typeFilter]);

  const handleOpenRefundConfirm = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setRefundConfirmOpen(true);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    setRefunding(true);
    setError(null);
    try {
      await api.refundPayment(selectedPayment._id);
      await fetchPayments();
      setRefundConfirmOpen(false);
    } catch (err: any) {
      console.error('Refund failed', err);
      setError(err.message || 'Refund failed. Please check the console.');
    } finally {
      setRefunding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'refunded': return 'info';
      case 'failed': return 'error';
      case 'created': return 'warning';
      default: return 'default';
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  return (
    <Box>
      <PageContainer>
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Today's Earning
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                  {formatCurrency(stats.todayGross)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Weekly Earning
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatCurrency(stats.weeklyGross)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Monthly Earning
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatCurrency(stats.monthlyGross)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>
                  Overall Gross
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatCurrency(stats.overallGross)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Secondary Stats */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Orders
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.totalOrders}</Typography>
                </Box>
                <Payments color="action" />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Refunds
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {stats.totalRefunds} ({formatCurrency(stats.totalRefundedAmount)})
                  </Typography>
                </Box>
                <Undo color="error" />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                    Net Profit (Settled)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {formatCurrency(stats.netProfit)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                    Gross - Refunded
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(stats.overallGross)} - {formatCurrency(stats.totalRefundedAmount)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <TextField
            placeholder="Search by client name, email, or ID..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '250px' }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="created">Created</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="type-filter-label">Type</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="appointment">Appointment</MenuItem>
              <MenuItem value="group_session">Group Session</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setTypeFilter('');
            }}
          >
            Reset
          </Button>
          <IconButton onClick={fetchPayments} disabled={loading}>
            <History fontSize="small" />
          </IconButton>
        </Paper>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Transaction Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Appointment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Order / Payment ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : payments.map((p) => {
                const appt = typeof p.appointmentId === 'object' ? p.appointmentId : null;
                const { date: apptDate, time: apptTime } = appt ? formatAppointmentTime(appt.startTime, user?.timezone) : { date: 'N/A', time: '' };
                
                return (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(p.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {typeof p.userId === 'object' ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.userId.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.userId.email}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2">{p.userId}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {appt ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{apptDate}</Typography>
                          <Typography variant="caption" color="text.secondary">{apptTime}</Typography>
                          <Chip 
                            label={appt.type.replace('_', ' ').toUpperCase()} 
                            size="small" 
                            variant="outlined" 
                            sx={{ mt: 0.5, fontSize: '0.6rem', height: 18 }} 
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Manual / Missing</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          O: {p.orderId}
                        </Typography>
                        {p.paymentId && (
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                            P: {p.paymentId}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ₹{(p.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status.toUpperCase()} 
                        size="small" 
                        color={getStatusColor(p.status) as any}
                        variant={p.status === 'paid' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {p.status === 'paid' && (
                        <Tooltip title="Initiate Refund">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleOpenRefundConfirm(p)}
                          >
                            <Undo fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Transaction Details">
                        <IconButton size="small">
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary">No transactions found matching your search.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </PageContainer>

      {/* Refund Confirmation Dialog */}
      <Dialog open={refundConfirmOpen} onClose={() => !refunding && setRefundConfirmOpen(false)}>
        <DialogTitle>Confirm Refund</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to refund <strong>₹{selectedPayment ? (selectedPayment.amount / 100).toFixed(2) : 0}</strong> for order <strong>{selectedPayment?.orderId}</strong>?
          </DialogContentText>
          <DialogContentText variant="body2" color="warning.main">
            This action will initiate a refund via Razorpay and mark the appointment as refunded. This cannot be undone.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRefundConfirmOpen(false)} disabled={refunding}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRefund} 
            disabled={refunding}
            startIcon={refunding ? <CircularProgress size={20} color="inherit" /> : <Undo />}
          >
            {refunding ? 'Processing Refund...' : 'Yes, Refund Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
