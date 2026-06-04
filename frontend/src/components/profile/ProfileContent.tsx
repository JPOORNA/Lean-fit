'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Avatar,
  Divider,
  Button,
  TextField,
  Card,
  CardContent,
  MenuItem,
} from '@mui/material';
import {
  Person,
  Email,
  Public,
  Security,
  Save,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';

export default function ProfileContent() {
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({ name, timezone, whatsappNumber });
      alert('Profile updated successfully!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      alert('Password cannot be empty');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.changePassword(newPassword);
      alert('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <PageContainer 
      title="My Profile" 
      subtitle="Manage your personal information and account settings."
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2, 
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem' 
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{user.name}</Typography>
              <Typography color="text.secondary" gutterBottom>{user.role.toUpperCase()}</Typography>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{user.email}</Typography>
                </Box>
                {user.whatsappNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
                    <Typography variant="body2">{user.whatsappNumber}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Public fontSize="small" color="action" />
                  <Typography variant="body2">{user.timezone || 'UTC'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security color="primary" fontSize="small" /> Account Details
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Email Address" defaultValue={user.email} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    select
                    label="Timezone" 
                    value={timezone} 
                    onChange={(e) => setTimezone(e.target.value)} 
                    fullWidth 
                  >
                    <MenuItem value="UTC">UTC (Universal Time)</MenuItem>
                    <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST - India)</MenuItem>
                    <MenuItem value="America/New_York">America/New_York (EST/EDT - New York)</MenuItem>
                    <MenuItem value="America/Chicago">America/Chicago (CST/CDT - Chicago)</MenuItem>
                    <MenuItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT - Los Angeles)</MenuItem>
                    <MenuItem value="Europe/London">Europe/London (GMT/BST - London)</MenuItem>
                    <MenuItem value="Europe/Paris">Europe/Paris (CET/CEST - Paris)</MenuItem>
                    <MenuItem value="Asia/Dubai">Asia/Dubai (GST - Dubai)</MenuItem>
                    <MenuItem value="Asia/Singapore">Asia/Singapore (SGT - Singapore)</MenuItem>
                    <MenuItem value="Asia/Hong_Kong">Asia/Hong_Kong (HKT - Hong Kong)</MenuItem>
                    <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST - Tokyo)</MenuItem>
                    <MenuItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT - Sydney)</MenuItem>
                    <MenuItem value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT - Auckland)</MenuItem>
                    <MenuItem value="Africa/Johannesburg">Africa/Johannesburg (SAST - Johannesburg)</MenuItem>
                    <MenuItem value="America/Sao_Paulo">America/Sao_Paulo (BRT/BRST - São Paulo)</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="WhatsApp Number" 
                    value={whatsappNumber} 
                    onChange={(e) => setWhatsappNumber(e.target.value)} 
                    fullWidth 
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 5, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security color="error" fontSize="small" /> Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="New Password" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    fullWidth 
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Confirm Password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    fullWidth 
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={handleUpdatePassword} 
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
