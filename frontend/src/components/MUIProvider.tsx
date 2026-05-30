'use client';

import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { useTheme } from '@/components/ThemeProvider';

export default function MUIProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const muiTheme = useMemo(() => createAppTheme(theme), [theme]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
