'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  Divider,
  Paper,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import {
  Add,
  Edit,
  Delete,
  Image as ImageIcon,
  Close,
  Check,
  MonitorWeight,
  FitnessCenter,
  LocalHospital,
  Spa,
  SelfImprovement,
  PregnantWoman,
} from '@mui/icons-material';
import { api, type Service } from '@/lib/api';

const ICON_OPTIONS = [
  { name: 'MonitorWeight', icon: <MonitorWeight /> },
  { name: 'FitnessCenter', icon: <FitnessCenter /> },
  { name: 'LocalHospital', icon: <LocalHospital /> },
  { name: 'Spa', icon: <Spa /> },
  { name: 'SelfImprovement', icon: <SelfImprovement /> },
  { name: 'PregnantWoman', icon: <PregnantWoman /> },
];

const getIcon = (name: string) => {
  const option = ICON_OPTIONS.find(o => o.name === name);
  return option ? option.icon : <Check />;
};

export default function ServicesManagePage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [iconName, setIconName] = useState('MonitorWeight');
  const [color, setColor] = useState('#4CAF50');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.listServicesAdmin();
      setItems(res.services);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle(''); setDescription(''); setBenefitsText('');
    setIconName('MonitorWeight'); setColor('#4CAF50');
    setIsActive(true); setOrder(items.length + 1);
    setFile(null); setPreview('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setTitle(s.title); setDescription(s.description);
    setBenefitsText(s.benefits.join('\n'));
    setIconName(s.iconName); setColor(s.color);
    setIsActive(s.isActive); setOrder(s.order);
    setFile(null); setPreview(s.imageUrl);
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!title || !description) { setError('Title and description are required'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      if (file) fd.append('image', file);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('benefits', JSON.stringify(benefitsText.split('\n').filter(b => b.trim())));
      fd.append('iconName', iconName);
      fd.append('color', color);
      fd.append('isActive', String(isActive));
      fd.append('order', String(order));

      if (editing) {
        await api.updateService(editing._id, fd);
      } else {
        await api.createService(fd);
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.deleteService(deleteId); setDeleteId(null); load(); } catch {}
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Manage Services</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}>
          Add Service
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} /></Grid>
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <Paper sx={{ borderRadius: 2, textAlign: 'center', py: 10, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'action.hover', mb: 2 }}>
            <MonitorWeight sx={{ fontSize: 40, color: 'text.disabled' }} />
          </Box>
          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No services yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {items.map((s) => (
            <Grid key={s._id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider', opacity: s.isActive ? 1 : 0.6, height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', '&:hover': { borderColor: s.color, transform: 'translateY(-2px)' } }}>
                <Box sx={{ position: 'relative', height: 160, backgroundImage: `url(${s.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
                    <Avatar
                        variant="rounded"
                        sx={{
                            position: 'absolute',
                            bottom: 12,
                            left: 12,
                            width: 40,
                            height: 40,
                            bgcolor: '#fff',
                            color: s.color,
                            borderRadius: '10px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        }}
                    >
                        {getIcon(s.iconName)}
                    </Avatar>
                </Box>
                <CardContent sx={{ flex: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{s.title}</Typography>
                    <Chip label={`#${s.order}`} size="small" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                    {s.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {s.benefits.slice(0, 3).map((b, i) => (
                        <Chip key={i} label={b} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 500 }} />
                    ))}
                    {s.benefits.length > 3 && <Typography variant="caption">+{s.benefits.length - 3} more</Typography>}
                  </Box>
                  <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => openEdit(s)} sx={{ color: 'text.secondary' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteId(s._id)} sx={{ color: 'error.light' }}><Delete fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editing ? 'Edit Service' : 'Add Service'}
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>Thumbnail</Typography>
              {preview ? (
                <Box sx={{ position: 'relative', width: 120, height: 120, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <Box component="img" src={preview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton onClick={() => { setFile(null); setPreview(''); }} size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ) : (
                <Button component="label" variant="outlined" sx={{ borderRadius: 2, borderStyle: 'dashed', width: 120, height: 120, flexDirection: 'column', gap: 1 }}>
                  <ImageIcon />
                  <Typography variant="caption">Upload</Typography>
                  <input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
                </Button>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Icon</InputLabel>
                <Select value={iconName} label="Icon" onChange={(e) => setIconName(e.target.value)}>
                  {ICON_OPTIONS.map(opt => (
                    <MenuItem key={opt.name} value={opt.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {opt.icon} {opt.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField 
                label="Brand Color (Hex)" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                fullWidth 
                slotProps={{ 
                  input: { 
                    endAdornment: <Box sx={{ width: 24, height: 24, bgcolor: color, borderRadius: 1 }} /> 
                  } 
                }} 
              />
            </Box>
          </Box>

          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} sx={{ mb: 2 }} required />
          <TextField label="Benefits (One per line)" value={benefitsText} onChange={(e) => setBenefitsText(e.target.value)} fullWidth multiline rows={4} sx={{ mb: 2 }} placeholder="Custom meal planning\nWeekly check-ins" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField label="Display Order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="primary" />}
                label="Active / Visible"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ fontWeight: 700, px: 4 }}>
            {saving ? 'Saving...' : editing ? 'Update Service' : 'Create Service'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Service?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Are you sure you want to delete this service? This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
