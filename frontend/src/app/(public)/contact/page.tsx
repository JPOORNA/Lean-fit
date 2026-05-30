'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email,
  Send,
  Instagram,
  YouTube,
  CheckCircle,
} from '@mui/icons-material';
import { FadeInUp, ScaleIn } from '@/components/public/AnimationWrappers';
import PillBadge from '@/components/public/PillBadge';
import { api } from '@/lib/api';
import { publicContact } from '@/lib/publicContact';

const contactInfo = [
  {
    icon: <Email sx={{ fontSize: 22 }} />,
    label: 'Email',
    value: publicContact.email,
    color: '#42A5F5',
    href: `mailto:${publicContact.email}`,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      await api.submitContact(form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: '#fff',
      '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
      '&:hover fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
      '&.Mui-focused fieldset': { borderColor: '#2E7D32', borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2E7D32' },
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          pt: { xs: 14, md: 16 },
          pb: { xs: 4, md: 5 },
          background: '#ffffff',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <FadeInUp>
            <PillBadge label="Contact" />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                mb: 2,
                letterSpacing: -0.5,
                color: '#2F3E2E',
              }}
            >
              Contact Leanfit
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#6B8F71',
                maxWidth: 480,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Have a question or ready to start your health journey? Send me a
              message and I&apos;ll get back to you within 24 hours.
            </Typography>
          </FadeInUp>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ bgcolor: '#FAFCF8', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {/* Contact Info Side */}
            <Grid size={{ xs: 12, md: 5 }}>
              <FadeInUp>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#2F3E2E',
                    mb: 1,
                    fontSize: '1.3rem',
                  }}
                >
                  Contact Information
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#6B8F71', mb: 4, lineHeight: 1.7 }}
                >
                  Reach out through any of these channels. I&apos;m here to help you
                  on your nutrition journey.
                </Typography>
              </FadeInUp>

              {contactInfo.map((info, i) => (
                <ScaleIn key={i} delay={i * 0.1}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 3,
                      p: 2,
                      bgcolor: '#fff',
                      borderRadius: '14px',
                      border: '1px solid rgba(0,0,0,0.04)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: `${info.color}10`,
                        color: info.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {info.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#9ab89e',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        {info.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: '#2F3E2E' }}
                      >
                        {info.value}
                      </Typography>
                    </Box>
                  </Box>
                </ScaleIn>
              ))}

              {/* Social */}
              <FadeInUp delay={0.3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#9ab89e',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    display: 'block',
                    mt: 4,
                    mb: 1.5,
                  }}
                >
                  Follow Me
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[
                    { icon: <Instagram />, href: publicContact.instagramUrl },
                    { icon: <YouTube />, href: publicContact.youtubeUrl },
                  ].map((s, i) => (
                    <Box
                      key={i}
                      component="a"
                      href={s.href}
                      target="_blank"
                      rel="noopener"
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B8F71',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#4CAF50',
                          borderColor: '#4CAF50',
                          bgcolor: 'rgba(76,175,80,0.05)',
                        },
                      }}
                    >
                      {s.icon}
                    </Box>
                  ))}
                </Box>
              </FadeInUp>
            </Grid>

            {/* Form Side */}
            <Grid size={{ xs: 12, md: 7 }}>
              <FadeInUp delay={0.1}>
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: '20px',
                    border: '1px solid rgba(0,0,0,0.05)',
                    p: { xs: 3, md: 4 },
                  }}
                >
                  {sent ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <CheckCircle
                        sx={{ fontSize: 56, color: '#4CAF50', mb: 2 }}
                      />
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 800, color: '#2F3E2E', mb: 1 }}
                      >
                        Message Sent!
                      </Typography>
                      <Typography sx={{ color: '#6B8F71', mb: 3, lineHeight: 1.7, fontWeight: 600 }}>
                        Thank you for reaching out. I&apos;ll get back to you within 24 hours.
                      </Typography>
                      <Button
                        onClick={() => setSent(false)}
                        sx={{
                          color: '#4CAF50',
                          fontWeight: 700,
                          textTransform: 'none',
                        }}
                      >
                        Send Another Message
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {error && (
                        <Alert
                          severity="error"
                          sx={{ mb: 3, borderRadius: '10px' }}
                          onClose={() => setError('')}
                        >
                          {error}
                        </Alert>
                      )}

                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Full Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            fullWidth
                            sx={inputSx}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            fullWidth
                            sx={inputSx}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Phone (optional)"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            fullWidth
                            sx={inputSx}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Subject"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            required
                            fullWidth
                            sx={inputSx}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Your Message"
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            required
                            fullWidth
                            multiline
                            rows={5}
                            sx={inputSx}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={sending}
                            fullWidth
                            endIcon={
                              sending ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <Send />
                              )
                            }
                            sx={{
                              bgcolor: '#2E7D32',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              borderRadius: '100px',
                              py: 1.5,
                              textTransform: 'none',
                              boxShadow: '0 6px 20px rgba(46, 125, 50, 0.25)',
                              '&:hover': {
                                bgcolor: '#1b5e20',
                                transform: 'translateY(-1px)',
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {sending ? 'Sending...' : 'Send Message'}
                          </Button>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </Box>
              </FadeInUp>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
