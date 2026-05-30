'use client';

import React from 'react';
import { Box, Typography, Paper, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

export default function PageContainer({ title, subtitle, children, breadcrumbs }: PageContainerProps) {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Box sx={{ mb: breadcrumbs ? 4 : 0 }}>
        {breadcrumbs && (
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            aria-label="breadcrumb"
            sx={{ mb: 1 }}
          >
            {breadcrumbs.map((crumb, index) => (
              crumb.path ? (
                <Link key={index} underline="hover" color="inherit" href={crumb.path} sx={{ fontSize: '0.85rem' }}>
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={index} color="text.primary" sx={{ fontSize: '0.85rem' }}>
                  {crumb.label}
                </Typography>
              )
            ))}
          </Breadcrumbs>
        )}
      </Box>
      <Box>
        {children}
      </Box>
    </Box>
  );
}
