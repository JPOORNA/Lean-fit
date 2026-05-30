import { createTheme, alpha } from '@mui/material/styles';
import { colors } from '@/lib/colors';

/* ─── Palette tokens ─── */
const lightPalette = {
  primary:    { main: colors.primary, light: colors.primaryLight, dark: colors.primaryDark, contrastText: '#fff' },
  secondary:  { main: colors.primaryLight, contrastText: '#fff' },
  background: { default: colors.pageBg, paper: colors.cardBg },
  text:       { primary: colors.heading, secondary: colors.body },
  divider:    colors.border,
  accent:     colors.ratingGold,
};

const darkPalette = {
  primary:    { main: '#4CAF50', light: '#81C784', dark: '#1b5e20', contrastText: '#071620' },
  secondary:  { main: '#8fd49f', contrastText: '#071620' },
  background: { default: '#071620', paper: '#0f2320' },
  text:       { primary: '#eaf7ee', secondary: '#9fc9a9' },
  divider:    'rgba(255,255,255,0.06)',
  accent:     '#ffb74d',
};

export const createAppTheme = (mode: 'light' | 'dark') => {
  const p = mode === 'light' ? lightPalette : darkPalette;

  return createTheme({
    palette: { mode, ...p },

    typography: {
      fontFamily: '"DM Sans", "Inter", "Roboto", sans-serif',
      h1: { fontWeight: 800, letterSpacing: -1 },
      h2: { fontWeight: 800, letterSpacing: -0.5 },
      h3: { fontWeight: 800 },
      h4: { fontWeight: 800 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none' as const, fontWeight: 600 },
      body2: { fontSize: '0.875rem' },
      caption: { fontSize: '0.75rem' },
    },

    shape: { borderRadius: 12 },

    components: {
      /* ── Buttons ── */
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            '&:hover': { boxShadow: 'none' },
          },
        },
      },

      /* ── Paper / Card ── */
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: 'none', border: `1px solid ${p.divider}` },
          elevation1: { boxShadow: 'none' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 14, boxShadow: 'none', border: `1px solid ${p.divider}` },
        },
      },

      /* ── AppBar ── */
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(p.background.paper, 0.9),
            backdropFilter: 'blur(12px)',
            color: p.text.primary,
            borderBottom: `1px solid ${p.divider}`,
            boxShadow: 'none',
          },
        },
      },

      /* ── Drawer ── */
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: p.background.paper,
            borderRight: `1px solid ${p.divider}`,
          },
        },
      },

      /* ── Tables ── */
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: mode === 'light' ? alpha(p.primary.main, 0.08) : alpha(p.background.default, 0.5),
            color: p.text.primary,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          },
          root: {
            borderColor: p.divider,
          },
        },
      },

      /* ── Inputs ── */
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: p.divider },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(p.primary.main, 0.3) },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: p.primary.main, borderWidth: 1.5 },
          },
        },
      },

      /* ── Chip ── */
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
        },
      },

      /* ── Dialogs ── */
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, border: 'none' },
        },
      },

      /* ── Tabs ── */
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none' as const, fontWeight: 600, minHeight: 44 },
        },
      },

      /* ── Scrollbars ── */
      MuiCssBaseline: {
        styleOverrides: {
          '*': { scrollbarWidth: 'thin' as const, scrollbarColor: `${alpha(p.primary.main, 0.3)} transparent` },
          '*::-webkit-scrollbar': { width: '6px', height: '6px' },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(p.primary.main, 0.3),
            borderRadius: '20px',
            '&:hover': { backgroundColor: alpha(p.primary.main, 0.5) },
          },
        },
      },
    },
  });
};

const theme = createAppTheme('light');
export default theme;
