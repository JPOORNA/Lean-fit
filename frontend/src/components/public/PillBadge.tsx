'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Spa } from '@mui/icons-material';
import { colors } from '@/lib/colors';

interface PillBadgeProps {
  label: string;
  sx?: any;
}

export default function PillBadge({ label, sx }: PillBadgeProps) {
  return (
    <Box 
      sx={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 1.2, 
        bgcolor: colors.primaryFaint, 
        borderRadius: '100px', 
        pr: 2.2, 
        pl: 0.6, 
        py: 0.6,
        mb: 2,
        ...sx
      }}
    >
      <Box 
        sx={{ 
          width: 28, 
          height: 28, 
          borderRadius: '50%', 
          bgcolor: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)'
        }}
      >
        <Spa sx={{ fontSize: 16, color: colors.primary }} />
      </Box>
      <Typography 
        sx={{ 
          color: colors.primary, 
          fontWeight: 800, 
          fontSize: '0.72rem', 
          letterSpacing: 1.5, 
          textTransform: 'uppercase' 
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
