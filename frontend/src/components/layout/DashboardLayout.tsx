'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme as useMuiTheme,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  FitnessCenter,
  Person,
  Logout,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { alpha } from '@mui/material/styles';
import { getRoleNavItems, NavItem } from '@/components/layout/navItems';
import { Collapse } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

const drawerWidth = 240;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleSubMenu = (text: string) => {
    setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    router.replace('/login');
  };

  const filteredNavItems = getRoleNavItems(user?.role);

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = pathname === item.path || (hasChildren && item.children?.some(child => child.path === pathname));
    const isOpen = openMenus[item.text] || (hasChildren && item.children?.some(child => child.path === pathname));

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleSubMenu(item.text);
              } else {
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }
            }}
            selected={pathname === item.path}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: (pathname === item.path || (hasChildren && isSelected)) ? 'inherit' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              slotProps={{
                primary: {
                  sx: {
                    fontWeight: pathname === item.path ? 700 : 500,
                    fontSize: '0.9rem'
                  }
                }
              }}
            />
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              {item.children?.map((child) => (
                <ListItem key={child.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      router.push(child.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    selected={pathname === child.path}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        backgroundColor: alpha(muiTheme.palette.primary.main, 0.15),
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: alpha(muiTheme.palette.primary.main, 0.25),
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: pathname === child.path ? 'primary.main' : 'text.secondary' }}>
                      {child.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={child.text}
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight: pathname === child.path ? 700 : 500,
                            fontSize: '0.85rem'
                          }
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', px: 2, py: 3 }}>
        <Box 
          component={Link}
          href="/"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 48,
              height: 48,
              borderRadius: '12px',
              overflow: 'hidden',
              bgcolor: '#fff',
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Image
              src="/leanfit.webp"
              alt="Leanfit logo"
              fill
              sizes="48px"
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: 'text.primary',
              letterSpacing: -0.5,
              fontSize: '1.6rem',
              background: `linear-gradient(120deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Leanfit
          </Typography>
        </Box>
      </Toolbar>
      <List sx={{
        flex: 1,
        px: 2,
        py: 1,
        overflowY: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
      }}>
        {filteredNavItems.map(renderNavItem)}
      </List>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.lighter',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '0.9rem' } } }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <AuthGuard role={user?.role as Role}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: alpha(muiTheme.palette.background.paper, 0.9),
            backdropFilter: 'blur(12px)',
            color: 'text.primary',
            borderBottom: `1px solid ${muiTheme.palette.divider}`,
            boxShadow: 'none',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo and Brand Name in Navbar */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: { xs: 'flex', md: 'none' }, // Only visible on mobile/tablet when the side drawer is hidden
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
                  width: 46,
                  height: 46,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  border: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  fontSize: '1.5rem',
                }}
              >
                Leanfit
              </Typography>
            </Box>

            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 600,
                display: { xs: 'none', md: 'block' } // Only visible on desktop when sidebar has the logo
              }}
            >
              {[...filteredNavItems]
                .sort((a, b) => b.path.length - a.path.length)
                .find(item => pathname.startsWith(item.path))?.text || 'Dashboard'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ThemeToggle />
              <Tooltip title="Account settings">
                <Box
                  onClick={handleMenuOpen}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    p: 0.75,
                    pl: { xs: 0.75, sm: 2 },
                    borderRadius: 3,
                    transition: 'all 0.2s ease-in-out',
                    border: '1px solid',
                    borderColor: 'transparent',
                    '&:hover': {
                      bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                      borderColor: alpha(muiTheme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1, mb: 0.5 }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                      {user?.role === 'doctor' ? 'Admin' : user?.role}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      fontSize: '0.875rem', 
                      fontWeight: 700,
                      boxShadow: `0 2px 8px ${alpha(muiTheme.palette.primary.main, 0.25)}`
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => { handleMenuClose(); router.push(`/${user?.role}/profile`); }}>
                  <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid',
                borderColor: 'divider'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            minWidth: 0,
            mt: '64px',
            bgcolor: 'background.default',
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
