/**
 * Centralized color palette for the public website.
 * Update values here to change colors across all pages.
 */

export const colors = {
  /* ── Primary brand ── */
  primary: '#2E7D32',
  primaryDark: '#1b5e20',
  primaryLight: '#4CAF50',
  primaryFaint: 'rgba(46, 125, 50, 0.08)',
  primaryShadow: 'rgba(46, 125, 50, 0.25)',

  /* ── Text ── */
  heading: '#2F3E2E',
  body: '#384D3B',
  muted: '#4A674D',
  dark: '#4a4a4a',

  /* ── Backgrounds ── */
  pageBg: '#ffffff',
  cardBg: '#ffffff',
  sectionAlt: '#ffffff',
  heroBg: '#ffffff',
  ctaBg: '#ffffff',

  /* ── Borders ── */
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.04)',

  /* ── Accent colors for services / cards ── */
  accent: {
    orange: '#FF7043',
    purple: '#7E57C2',
    pink: '#EC407A',
    blue: '#42A5F5',
    violet: '#AB47BC',
    instagram: '#E1306C',
  },

  /* ── Rating / UI ── */
  ratingGold: '#FFCC80',

  /* ── Footer ── */
  footerBg: '#ffffff',
  footerText: '#384D3B',
  footerHeading: '#2F3E2E',
  footerBorder: 'rgba(0,0,0,0.06)',
} as const;

/** Handy gradient text style */
export const gradientText = {
  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
} as const;
