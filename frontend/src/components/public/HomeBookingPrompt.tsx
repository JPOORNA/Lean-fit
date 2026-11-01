'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Close } from '@mui/icons-material';
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useAuth } from '@/components/auth/AuthProvider';
import { colors } from '@/lib/colors';

const PROMPT_DELAY_MS = 15_000;
const SESSION_KEY = 'leanfit_home_booking_prompt_seen';

export default function HomeBookingPrompt() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch { /* The invitation still works when browser storage is unavailable. */ }
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* Storage is optional. */ }
      setOpen(true);
    }, PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loading, user]);

  const close = () => setOpen(false);

  return (
    <Dialog
      open={open && !user}
      onClose={close}
      aria-labelledby="home-booking-prompt-title"
      aria-describedby="home-booking-prompt-description"
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(20, 35, 23, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } },
        paper: { sx: { m: 2, width: 'calc(100% - 32px)', borderRadius: '16px', bgcolor: colors.cardBg, overflow: 'hidden', boxShadow: '0 24px 90px rgba(0, 0, 0, 0.22)' } },
      }}
    >
      <IconButton aria-label="Close booking invitation" onClick={close} sx={{ position: 'absolute', right: 8, top: 8, color: colors.muted }}>
        <Close fontSize="small" />
      </IconButton>
      <DialogTitle id="home-booking-prompt-title" sx={{ color: colors.heading, textAlign: 'center', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.3, px: 4, pt: 4, pb: 1 }}>
        Ready to transform?
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', px: 3, pb: 3 }}>
        <Typography id="home-booking-prompt-description" sx={{ color: colors.body, fontSize: 15, lineHeight: 1.6, mb: 2.5 }}>
          Book a consultation and take the first step towards your fitness goals.
        </Typography>
        <Button autoFocus component={Link} href="/book" onClick={close} variant="contained" fullWidth disableElevation sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: colors.primaryDark }, borderRadius: '8px', py: 1.25, fontWeight: 700, textTransform: 'none' }}>
          Book now
        </Button>
      </DialogContent>
    </Dialog>
  );
}
