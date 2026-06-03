'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import {
  Email,
  MarkEmailRead,
  Delete,
  Close,
  Phone,
  AccessTime,
  Circle,
} from '@mui/icons-material';
import { api, type ContactMessage } from '@/lib/api';
import { format } from 'date-fns';

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listMessages();
      setMessages(res.messages);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.isRead) {
      try {
        await api.markMessageRead(msg._id);
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m))
        );
      } catch {}
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteMessage(deleteId);
      setDeleteId(null);
      if (selected?._id === deleteId) setSelected(null);
      load();
    } catch {}
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <PageContainer>
      {unreadCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`${unreadCount} new messages`}
            size="small"
            color="primary"
            sx={{
              fontWeight: 700,
              height: 24,
              fontSize: '0.75rem',
              px: 0.5
            }}
          />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : messages.length === 0 ? (
        <Paper sx={{ borderRadius: 2, textAlign: 'center', py: 10, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'action.hover', mb: 2 }}>
            <Email sx={{ fontSize: 40, color: 'text.disabled' }} />
          </Box>
          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No messages yet</Typography>
          <Typography variant="body2" color="text.disabled">Messages from your contact form will appear here.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.map((msg) => (
            <Card
              key={msg._id}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 'none',
                border: '1px solid',
                borderColor: msg.isRead ? 'divider' : 'primary.light',
                bgcolor: msg.isRead ? 'background.paper' : 'rgba(76, 175, 80, 0.04)',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', transform: 'translateX(4px)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CardActionArea onClick={() => handleOpen(msg)} sx={{ flex: 1 }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        {!msg.isRead && (
                          <Circle sx={{ fontSize: 10, color: 'primary.main' }} />
                        )}
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: msg.isRead ? 600 : 800,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: msg.isRead ? 'text.primary' : 'primary.main'
                          }}
                        >
                          {msg.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ flexShrink: 0, fontSize: '0.75rem', ml: 'auto', fontWeight: 500 }}
                        >
                          {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: msg.isRead ? 500 : 700,
                          color: 'text.primary',
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.5
                        }}
                      >
                        {msg.subject}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          fontSize: '0.8rem'
                        }}
                      >
                        {msg.message}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
                <IconButton
                  onClick={(e) => { e.stopPropagation(); setDeleteId(msg._id); }}
                  size="small"
                  sx={{ mr: 2, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              {selected.subject}
              <IconButton onClick={() => setSelected(null)} size="small"><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Email sx={{ fontSize: 14 }} />}
                  label={selected.email}
                  size="small"
                  sx={{ height: 26, fontWeight: 600, fontSize: '0.78rem' }}
                />
                {selected.phone && (
                  <Chip
                    icon={<Phone sx={{ fontSize: 14 }} />}
                    label={selected.phone}
                    size="small"
                    sx={{ height: 26, fontWeight: 600, fontSize: '0.78rem' }}
                  />
                )}
                <Chip
                  icon={<AccessTime sx={{ fontSize: 14 }} />}
                  label={format(new Date(selected.createdAt), 'PPpp')}
                  size="small"
                  variant="outlined"
                  sx={{ height: 26, fontSize: '0.72rem' }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                From: {selected.name}
              </Typography>

              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
              >
                {selected.message}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
              <Button
                startIcon={<Delete />}
                color="error"
                onClick={() => { setDeleteId(selected._id); setSelected(null); }}
                sx={{ textTransform: 'none', mr: 'auto', fontWeight: 600 }}
              >
                Delete
              </Button>
              <Button
                component="a"
                href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                startIcon={<MarkEmailRead />}
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}
              >
                Reply via Email
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Message?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">This message will be permanently deleted. This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>Delete Message</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
