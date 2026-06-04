'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { colors } from '@/lib/colors';

type PolicyLinksProps = {
  variant?: 'row' | 'stack';
  showPrefix?: boolean;
  sx?: Record<string, unknown>;
};

const links = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cancellation & Refund Policy', href: '/cancellation-refund' },
];

export default function PolicyLinks({ variant = 'row', showPrefix = false, sx }: PolicyLinksProps) {
  return (
    <Box sx={sx}>
      {showPrefix ? (
        <Typography variant="caption" sx={{ color: colors.muted, display: 'block', mb: 0.75 }}>
          By continuing, you agree to our policies.
        </Typography>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: variant === 'stack' ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: variant === 'stack' ? 0.75 : 1.5,
          alignItems: variant === 'stack' ? 'flex-start' : 'center',
        }}
      >
        {links.map((link, index) => (
          <Box key={link.href} sx={{ display: 'flex', alignItems: 'center', gap: variant === 'stack' ? 0 : 0.9 }}>
            <Typography
              component={Link}
              href={link.href}
              variant="caption"
              sx={{
                color: colors.primary,
                textDecoration: 'none',
                fontWeight: 700,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {link.label}
            </Typography>
            {variant === 'row' && index < links.length - 1 ? (
              <Typography variant="caption" sx={{ color: colors.muted }}>
                ·
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}