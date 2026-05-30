'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Container,
} from '@mui/material';
import { Menu as MenuIcon, Close, KeyboardArrowDown, ExpandLess, ExpandMore } from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, MenuItem, Collapse } from '@mui/material';
import Image from 'next/image';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Instagram', href: '/instagram' },
  { label: 'Services', href: '/services' },
  { label: 'Results', href: '/results' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/cancellation-refund' },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [legalAnchorEl, setLegalAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileLegalOpen, setMobileLegalOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLegalOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLegalAnchorEl(event.currentTarget);
  };

  const handleLegalClose = () => {
    timeoutRef.current = setTimeout(() => {
      setLegalAnchorEl(null);
    }, 150);
  };

  const isLegalActive = legalLinks.some(link => pathname === link.href);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: scrolled
            ? 'rgba(255, 255, 255, 0.92)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#2F3E2E',
          boxShadow: 'none',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}
          >
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                color: 'inherit',
                mr: 'auto',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 54,
                  height: 54,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <Image
                  src="/leanfit.webp"
                  alt="Leanfit logo"
                  fill
                  sizes="54px"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -0.75,
                  fontSize: '1.75rem',
                }}
              >
                Leanfit
              </Typography>
            </Box>

            {/* Desktop Nav */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  sx={{
                    color: 'inherit',
                    fontWeight: isActive(link.href) ? 700 : 500,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: '10px',
                    position: 'relative',
                    '&::after': isActive(link.href)
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 4,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: '#2E7D32',
                        }
                      : {},
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}

              {/* Legal Hover Menu */}
              <Box
                onMouseEnter={handleLegalOpen}
                onMouseLeave={handleLegalClose}
              >
                <Button
                  endIcon={<KeyboardArrowDown sx={{ 
                    transform: legalAnchorEl ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease'
                  }} />}
                  sx={{
                    color: 'inherit',
                    fontWeight: isLegalActive ? 700 : 500,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: '10px',
                    position: 'relative',
                    textTransform: 'none',
                    '&::after': isLegalActive
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 4,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: '#2E7D32',
                        }
                      : {},
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    },
                  }}
                >
                  Legal
                </Button>
                <Menu
                  anchorEl={legalAnchorEl}
                  open={Boolean(legalAnchorEl)}
                  onClose={handleLegalClose}
                  slotProps={{
                    list: {
                      onMouseEnter: () => {
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                      },
                      onMouseLeave: handleLegalClose,
                    }
                  }}
                  elevation={0}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  sx={{
                    '& .MuiPaper-root': {
                      mt: 1,
                      borderRadius: '12px',
                      minWidth: 180,
                      border: '1px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      overflow: 'visible',
                      '&::before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        zIndex: 0,
                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                      },
                    },
                  }}
                >
                  {legalLinks.map((link) => (
                    <MenuItem
                      key={link.href}
                      component={Link}
                      href={link.href}
                      onClick={handleLegalClose}
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: pathname === link.href ? 700 : 500,
                        color: pathname === link.href ? '#2E7D32' : '#2F3E2E',
                        borderRadius: '8px',
                        mx: 1,
                        my: 0.5,
                        py: 1,
                        '&:hover': {
                          bgcolor: 'rgba(46, 125, 50, 0.04)',
                          color: '#2E7D32',
                        },
                      }}
                    >
                      {link.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                sx={{
                  ml: 1,
                  bgcolor: '#2E7D32',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    bgcolor: '#1b5e20',
                    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Login
              </Button>
            </Box>

            {/* Mobile Hamburger */}
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="open navigation menu"
              sx={{ color: 'inherit', display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: '#fff',
              borderLeft: 'none',
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                position: 'relative',
                width: 46,
                height: 46,
                borderRadius: '12px',
                overflow: 'hidden',
                bgcolor: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            >
              <Image
                src="/leanfit.webp"
                alt="Leanfit logo"
                fill
                sizes="46px"
                style={{ objectFit: 'contain' }}
              />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#2F3E2E', letterSpacing: -0.5 }}>
              Leanfit
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setDrawerOpen(false)}
            aria-label="close navigation menu"
          >
            <Close />
          </IconButton>
        </Box>
        <List sx={{ px: 1 }}>
          {navLinks.map((link) => (
            <ListItem key={link.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive(link.href) ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
                }}
              >
                <ListItemText
                  primary={link.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: isActive(link.href) ? 700 : 500,
                        color: isActive(link.href) ? '#2E7D32' : '#2F3E2E',
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Mobile Legal Links */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => setMobileLegalOpen(!mobileLegalOpen)}
              sx={{
                borderRadius: 2,
                bgcolor: isLegalActive ? 'rgba(46, 125, 50, 0.05)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
              }}
            >
              <ListItemText
                primary="Legal"
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: isLegalActive ? 700 : 500,
                      color: isLegalActive ? '#2E7D32' : '#2F3E2E',
                    },
                  },
                }}
              />
              {mobileLegalOpen ? <ExpandLess sx={{ color: '#2E7D32' }} /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={mobileLegalOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {legalLinks.map((link) => (
                <ListItem key={link.href} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: pathname === link.href ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
                    }}
                  >
                    <ListItemText
                      primary={link.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight: pathname === link.href ? 700 : 500,
                            color: pathname === link.href ? '#2E7D32' : '#2F3E2E',
                            fontSize: '0.9rem',
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
          <ListItem disablePadding sx={{ mt: 2, px: 1 }}>
            <Button
              component={Link}
              href="/login"
              fullWidth
              variant="contained"
              onClick={() => setDrawerOpen(false)}
              sx={{
                bgcolor: '#2E7D32',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '10px',
                py: 1.2,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)',
                '&:hover': { bgcolor: '#1b5e20' },
              }}
            >
              Login
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
