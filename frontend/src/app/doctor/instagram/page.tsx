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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  Paper,
} from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import {
  Add,
  Edit,
  Delete,
  Instagram,
  PlayCircle,
  Image as ImageIcon,
  Close,
} from '@mui/icons-material';
import { api, type InstagramPost } from '@/lib/api';

export default function InstagramManagePage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstagramPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [postUrl, setPostUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [type, setType] = useState<'post' | 'reel'>('post');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.listInstagramAdmin();
      setPosts(res.posts);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setPostUrl('');
    setCaption('');
    setType('post');
    setIsActive(true);
    setOrder(posts.length);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (post: InstagramPost) => {
    setEditing(post);
    setPostUrl(post.postUrl);
    setCaption(post.caption);
    setType(post.type);
    setIsActive(post.isActive);
    setOrder(post.order);
    setThumbnailFile(null);
    setThumbnailPreview(post.thumbnailUrl);
    setError('');
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setError('');
    if (!postUrl) { setError('Post URL is required'); return; }
    if (!thumbnailFile && !thumbnailPreview) { setError('Thumbnail is required'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
      fd.append('postUrl', postUrl);
      fd.append('caption', caption);
      fd.append('type', type);
      fd.append('isActive', String(isActive));
      fd.append('order', String(order));

      if (editing) {
        await api.updateInstagramPost(editing._id, fd);
      } else {
        await api.createInstagramPost(fd);
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteInstagramPost(deleteId);
      setDeleteId(null);
      load();
    } catch {}
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreate}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
          }}
        >
          Add Post
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
              <Skeleton variant="rounded" sx={{ aspectRatio: '1', borderRadius: 2 }} height="auto" />
            </Grid>
          ))}
        </Grid>
      ) : posts.length === 0 ? (
        <Paper sx={{ borderRadius: 2, textAlign: 'center', py: 10, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'action.hover', mb: 2 }}>
            <Instagram sx={{ fontSize: 40, color: 'text.disabled' }} />
          </Box>
          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No posts yet. Add your first Instagram post.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {posts.map((post) => (
            <Grid key={post._id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  opacity: post.isActive ? 1 : 0.6,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
                  '&:hover .post-actions': { opacity: 1 },
                }}
              >
                <Box sx={{ aspectRatio: '1', position: 'relative', bgcolor: 'background.default' }}>
                  <Box
                    component="img"
                    src={post.thumbnailUrl}
                    alt={post.caption}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {post.type === 'reel' && (
                    <PlayCircle
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        color: '#fff',
                        fontSize: 24,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                      }}
                    />
                  )}
                  {!post.isActive && (
                    <Chip
                      label="Hidden"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontWeight: 700,
                        height: 20,
                        fontSize: '0.6rem',
                        border: 'none'
                      }}
                    />
                  )}
                  {/* Actions overlay */}
                  <Box
                    className="post-actions"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <IconButton
                      onClick={() => openEdit(post)}
                      sx={{ bgcolor: '#fff', color: 'text.primary', '&:hover': { bgcolor: '#f5f5f5' }, width: 36, height: 36 }}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteId(post._id)}
                      sx={{ bgcolor: '#fff', color: 'error.main', '&:hover': { bgcolor: '#f5f5f5' }, width: 36, height: 36 }}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}
                  >
                    {post.caption || 'No caption'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editing ? 'Edit Post' : 'Add Instagram Post'}
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Thumbnail upload */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
              Thumbnail
            </Typography>
            {thumbnailPreview ? (
              <Box sx={{ position: 'relative', width: 160, height: 160, borderRadius: '12px', overflow: 'hidden' }}>
                <Box component="img" src={thumbnailPreview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton
                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
                  size="small"
                  sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageIcon />}
                sx={{ borderRadius: 1.5, textTransform: 'none', borderStyle: 'dashed', py: 4, width: '100%', color: 'text.secondary', borderColor: 'divider' }}
              >
                Upload Thumbnail
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
            )}
          </Box>

          <TextField
            label="Instagram Post/Reel URL"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={type} label="Type" onChange={(e) => setType(e.target.value as any)}>
                  <MenuItem value="post">Post</MenuItem>
                  <MenuItem value="reel">Reel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="primary" />}
            label="Visible on website"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}
          >
            {saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Post?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete this post and its thumbnail. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Delete Post
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
