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
  Divider,
  TablePagination,
} from '@mui/material';
import {
  Person,
  AssignmentInd,
  Search,
  Visibility,
  MoreVert,
  Refresh
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'user' | 'doctor'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Debounce search input to avoid redundant API hits while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page index on filter updates
  useEffect(() => {
    setPage(0);
  }, [roleFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await api.listClients({
        page: page + 1,
        limit: rowsPerPage,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setClients(data.clients);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, rowsPerPage, debouncedSearch, roleFilter]);

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
            placeholder="Search clients..."
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
          <TextField
            select
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
            slotProps={{
              select: {
                displayEmpty: true
              }
            }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="user">Normal User</MenuItem>
            <MenuItem value="doctor">Admin</MenuItem>
          </TextField>
          <Button 
            startIcon={<Refresh />} 
            variant="outlined" 
            color="inherit"
            onClick={fetchClients}
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
              {clients.map((client) => (
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
              {clients.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No clients found matching your filters.</Typography>
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
      </Menu>
    </Box>
  );
}
