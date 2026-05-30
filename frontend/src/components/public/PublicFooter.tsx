'use client';

import React from 'react';
import { Box, Container, Typography, Grid, IconButton, Divider } from '@mui/material';
import { Instagram, YouTube, Email } from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';
import { colors } from '@/lib/colors';
import PolicyLinks from '@/components/public/PolicyLinks';
import { publicContact } from '@/lib/publicContact';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Results', href: '/results' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Instagram', href: '/instagram' },
];

const services = ['Fat Loss Program', 'Muscle Gaining', 'Strength Training', 'Weight Management', 'Lean Muscle Mass', 'Daily Tracking'];

export default function PublicFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: colors.footerBg, borderTop: `1px solid ${colors.footerBorder}`, pt: { xs: 6, md: 8 }, pb: 3 }}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {/* Brand */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  border: `1px solid ${colors.border}`,
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/leanfit.webp"
                  alt="Leanfit logo"
                  fill
                  sizes="40px"
                  style={{ objectFit: 'contain', padding: 4 }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5, color: colors.footerHeading }}>Leanfit</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: colors.footerText, lineHeight: 1.8, mb: 3, maxWidth: 300 }}>
              Vishnu is an ISSA Certified Nutritionist & Fitness Coach brand focused on science-backed nutrition plans tailored to your unique body and lifestyle.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { icon: <Instagram />, label: 'Instagram', href: publicContact.instagramUrl },
                { icon: <YouTube />, label: 'YouTube', href: publicContact.youtubeUrl },
              ].map((s, i) => (
                <IconButton 
                  key={i} 
                  component="a" 
                  href={s.href} 
                  target="_blank" 
                  rel="noopener" 
                  aria-label={`Follow on ${s.label}`}
                  sx={{ color: colors.footerText, border: `1px solid ${colors.border}`, borderRadius: '10px', width: 40, height: 40, '&:hover': { color: colors.primary, borderColor: colors.primary, bgcolor: colors.primaryFaint }, transition: 'all 0.2s ease' }}
                >
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="overline" sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.7rem', letterSpacing: 2, mb: 2, display: 'block' }}>Quick Links</Typography>
            {quickLinks.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2" sx={{ display: 'block', color: colors.footerText, textDecoration: 'none', py: 0.5, '&:hover': { color: colors.primary }, transition: 'color 0.2s' }}>
                {link.label}
              </Typography>
            ))}

            <Typography variant="overline" sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.7rem', letterSpacing: 2, mt: 3, mb: 1.5, display: 'block' }}>
              Legal
            </Typography>
            <PolicyLinks variant="stack" />
          </Grid>

          {/* Services */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="overline" sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.7rem', letterSpacing: 2, mb: 2, display: 'block' }}>Services</Typography>
            {services.map((s) => (
              <Typography key={s} variant="body2" sx={{ color: colors.footerText, py: 0.5 }}>{s}</Typography>
            ))}
          </Grid>

          {/* Contact */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="overline" sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.7rem', letterSpacing: 2, mb: 2, display: 'block' }}>Get in Touch</Typography>
            {[
              { icon: <Email sx={{ fontSize: 18 }} />, text: publicContact.email, href: `mailto:${publicContact.email}` },
            ].map((item, i) => (
              <Box key={i} component={item.href ? 'a' : 'div'} href={item.href} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.7, color: colors.footerText, textDecoration: 'none', '&:hover': item.href ? { color: colors.primary } : undefined }}>
                <Box sx={{ color: colors.primary }}>{item.icon}</Box>
                <Typography variant="body2">{item.text}</Typography>
              </Box>
            ))}
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: colors.footerBorder, my: 4 }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" sx={{ color: colors.muted, textAlign: 'center' }}>
            © {new Date().getFullYear()} Leanfit. All rights reserved.
          </Typography>
          
          <Typography variant="caption" sx={{ color: colors.muted, textAlign: 'center' }}>
            ISSA Certified Nutritionist & Fitness Coach
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
