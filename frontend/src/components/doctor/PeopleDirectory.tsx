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
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  Typography,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import {
  Person,
  AssignmentInd,
  Search,
  Visibility,
  MoreVert,
  Refresh,
  Delete
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

type DirectoryRole = 'all' | 'client' | 'user' | 'doctor';

export default function PeopleDirectory({ clientsOnly = false }: { clientsOnly?: boolean }) {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<DirectoryRole>('user');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [refundAllOnDelete, setRefundAllOnDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loadError, setLoadError] = useState('');
  const effectiveRole = clientsOnly ? 'client' : roleFilter;
  const title = clientsOnly ? 'Clients' : 'Users';
  const refresh = () => { setLoading(true); setRefreshVersion(version => version + 1); };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeletingUser(true);
    setDeleteUserError('');
    try {
      await api.deleteClient(selectedUser._id, refundAllOnDelete);
      setDeleteUserDialogOpen(false);
      setSelectedUser(null);
      setRefundAllOnDelete(false);
      refresh();
    } catch (err) {
      setDeleteUserError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setDeletingUser(false);
    }
  };

  useEffect(() => {
    if (search === debouncedSearch) return;
    const handler = setTimeout(() => {
      setLoading(true);
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    api.listClients({
      page: page + 1,
      limit: rowsPerPage,
      role: effectiveRole !== 'all' ? effectiveRole : undefined,
      search: debouncedSearch || undefined,
    }).then(data => {
      if (cancelled) return;
      const nextTotal = data.pagination?.total ?? data.clients.length;
      const lastPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);
      if (page > lastPage) { setPage(lastPage); return; }
      setClients(data.clients);
      setTotal(nextTotal);
      setLoadError('');
      setLoading(false);
    }).catch(error => {
      if (cancelled) return;
      setLoadError(error instanceof Error ? error.message : 'Could not load accounts. Please try again.');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page, rowsPerPage, debouncedSearch, effectiveRole, refreshVersion]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleCloseMenu = (event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleAction = (path: string) => {
    router.push(path);
    handleCloseMenu();
  };

  return (
    <Box>
      <PageContainer>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75 }}>{title}</Typography>
          <Typography color="text.secondary">{clientsOnly ? 'Manage your coaching clients and their subscriptions.' : 'Manage accounts across all roles. Use the filter to view clients, users or admins.'}</Typography>
        </Box>
        {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
        <Paper sx={{ 
          mb: 3, 
          p: 2, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2, 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          boxShadow: 'none', 
          border: '1px solid', 
          borderColor: 'divider' 
        }}>
          <TextField
            size="small"
            placeholder={clientsOnly ? 'Search clients...' : 'Search users...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
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
          {!clientsOnly && <TextField
            select
            size="small"
            value={roleFilter}
            label="Account role"
            onChange={(e) => { setLoading(true); setPage(0); setRoleFilter(e.target.value as DirectoryRole); }}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
            slotProps={{
              select: {
                displayEmpty: true
              }
            }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="user">Users</MenuItem>
            <MenuItem value="doctor">Admin</MenuItem>
          </TextField>}
          <Button 
            startIcon={<Refresh />} 
            variant="outlined" 
            color="inherit"
            onClick={refresh}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Refresh
          </Button>
        </Paper>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflowX: 'auto', width: '100%' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700 }}>Person</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Timezone</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Loading {title.toLowerCase()}…</TableCell></TableRow>}
              {!loading && !loadError && clients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {client.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {client.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={client.role === 'doctor' ? <AssignmentInd sx={{ fontSize: '0.8rem !important' }} /> : client.role === 'client' ? <AssignmentInd sx={{ fontSize: '0.8rem !important' }} /> : <Person sx={{ fontSize: '0.8rem !important' }} />}
                      label={client.role === 'doctor' ? 'ADMIN' : client.role.toUpperCase()} 
                      size="small" 
                      color={client.role === 'doctor' ? 'secondary' : client.role === 'client' ? 'primary' : 'default'}
                      variant="filled"
                      sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={client.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={client.isActive ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {client.clientExpiresAt ? new Date(client.clientExpiresAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{client.timezone || 'UTC'}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/doctor/clients/${client._id}`);
                      }}
                      color="primary"
                      size="small"
                      title="View Details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={(e) => handleOpenMenu(e, client)} 
                      size="small"
                      title="More Actions"
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && !loading && !loadError && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No {title.toLowerCase()} found matching your filters.</Typography>
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
          onPageChange={(_, newPage) => { setLoading(true); setPage(newPage); }}
          onRowsPerPageChange={(e) => {
            setLoading(true);
            setPage(0);
            setRowsPerPage(parseInt(e.target.value, 10));
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </PageContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleCloseMenu()}
        disableScrollLock
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: { minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
          }
        }}
      >
        <MenuItem onClick={() => selectedUser && handleAction(`/doctor/clients/${selectedUser._id}`)}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteUserDialogOpen(true);
            setAnchorEl(null);
          }} 
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete User" />
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteUserDialogOpen}
        onClose={() => !deletingUser && setDeleteUserDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {deleteUserError && <Alert severity="error" sx={{ mb: 2 }}>{deleteUserError}</Alert>}
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will purge all their logs (meals, workouts, metrics) and any assigned plans. This action cannot be undone.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={refundAllOnDelete}
                onChange={(e) => setRefundAllOnDelete(e.target.checked)}
                color="primary"
              />
            }
            label="Refund all paid payments for this user"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteUserDialogOpen(false)} disabled={deletingUser}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={deletingUser}
          >
            {deletingUser ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
