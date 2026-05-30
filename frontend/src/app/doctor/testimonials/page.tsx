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
  Rating,
  Skeleton,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import {
  Add,
  Edit,
  Delete,
  Star,
  Image as ImageIcon,
  Close,
  TrendingDown,
} from '@mui/icons-material';
import { api, type Testimonial } from '@/lib/api';

export default function TestimonialsManagePage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [quote, setQuote] = useState('');
  const [weightLost, setWeightLost] = useState('');
  const [duration, setDuration] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.listTestimonialsAdmin();
      setItems(res.testimonials);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setClientName(''); setQuote(''); setWeightLost(''); setDuration('');
    setRating(5); setIsActive(true); setOrder(items.length);
    setBeforeFile(null); setAfterFile(null);
    setBeforePreview(''); setAfterPreview('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setClientName(t.clientName); setQuote(t.quote);
    setWeightLost(t.weightLost); setDuration(t.duration);
    setRating(t.rating); setIsActive(t.isActive); setOrder(t.order);
    setBeforeFile(null); setAfterFile(null);
    setBeforePreview(t.beforeImageUrl); setAfterPreview(t.afterImageUrl);
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!clientName || !quote) { setError('Name and quote are required'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      if (beforeFile) fd.append('beforeImage', beforeFile);
      if (afterFile) fd.append('afterImage', afterFile);
      fd.append('clientName', clientName);
      fd.append('quote', quote);
      fd.append('weightLost', weightLost);
      fd.append('duration', duration);
      fd.append('rating', String(rating));
      fd.append('isActive', String(isActive));
      fd.append('order', String(order));

      if (editing) {
        await api.updateTestimonial(editing._id, fd);
      } else {
        await api.createTestimonial(fd);
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.deleteTestimonial(deleteId); setDeleteId(null); load(); } catch {}
  };

  const ImageUploadBox = ({ preview, onFile, onClear, label }: { preview: string; onFile: (f: File) => void; onClear: () => void; label: string }) => (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
      {preview ? (
        <Box sx={{ position: 'relative', width: 120, height: 120, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box component="img" src={preview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <IconButton onClick={onClear} size="small" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', p: 0.3, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ) : (
        <Button component="label" variant="outlined" startIcon={<ImageIcon />} sx={{ borderRadius: 1.5, textTransform: 'none', borderStyle: 'dashed', py: 2, width: 120, height: 120, flexDirection: 'column', fontSize: '0.75rem', color: 'text.secondary', borderColor: 'divider' }}>
          Upload
          <input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </Button>
      )}
    </Box>
  );

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}>
          Add Testimonial
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}><Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} /></Grid>
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <Paper sx={{ borderRadius: 2, textAlign: 'center', py: 10, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'action.hover', mb: 2 }}>
            <Star sx={{ fontSize: 40, color: 'text.disabled' }} />
          </Box>
          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No testimonials yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {items.map((t) => (
            <Grid key={t._id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider', opacity: t.isActive ? 1 : 0.6, height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' } }}>
                {(t.beforeImageUrl || t.afterImageUrl) && (
                  <Box sx={{ display: 'flex', height: 160, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {t.beforeImageUrl && <Box sx={{ flex: 1, backgroundImage: `url(${t.beforeImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                    {t.afterImageUrl && <Box sx={{ flex: 1, backgroundImage: `url(${t.afterImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderLeft: '1px solid', borderColor: 'divider' }} />}
                  </Box>
                )}
                <CardContent sx={{ flex: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t.clientName}</Typography>
                    <Rating value={t.rating} readOnly size="small" sx={{ color: '#FFB300' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic', lineHeight: 1.6 }}>
                    &ldquo;{t.quote}&rdquo;
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {t.weightLost && <Chip label={t.weightLost} size="small" icon={<TrendingDown sx={{ fontSize: '1rem !important' }} />} sx={{ fontWeight: 700, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#2E7D32', border: 'none' }} />}
                    {t.duration && <Chip label={t.duration} size="small" sx={{ fontWeight: 600 }} variant="outlined" />}
                    {!t.isActive && <Chip label="Hidden" size="small" color="warning" variant="filled" sx={{ fontWeight: 700 }} />}
                  </Box>
                  <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => openEdit(t)} sx={{ color: 'text.secondary' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteId(t._id)} sx={{ color: 'error.light' }}><Delete fontSize="small" /></IconButton>
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
          {editing ? 'Edit Testimonial' : 'Add Testimonial'}
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <ImageUploadBox
              preview={beforePreview}
              label="Before Image"
              onFile={(f) => { setBeforeFile(f); setBeforePreview(URL.createObjectURL(f)); }}
              onClear={() => { setBeforeFile(null); setBeforePreview(''); }}
            />
            <ImageUploadBox
              preview={afterPreview}
              label="After Image"
              onFile={(f) => { setAfterFile(f); setAfterPreview(URL.createObjectURL(f)); }}
              onClear={() => { setAfterFile(null); setAfterPreview(''); }}
            />
          </Box>

          <TextField label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <TextField label="Quote / Testimonial" value={quote} onChange={(e) => setQuote(e.target.value)} fullWidth multiline rows={3} sx={{ mb: 2 }} required />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField label="Weight Lost (e.g. -12kg)" value={weightLost} onChange={(e) => setWeightLost(e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Duration (e.g. 3 months)" value={duration} onChange={(e) => setDuration(e.target.value)} fullWidth />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Rating:</Typography>
            <Rating value={rating} onChange={(_, v) => v && setRating(v)} />
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <TextField label="Order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="primary" />}
                label="Visible"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}>
            {saving ? 'Saving...' : editing ? 'Update Testimonial' : 'Create Testimonial'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Testimonial?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">This will permanently delete this testimonial and its images. This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>Delete Testimonial</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
