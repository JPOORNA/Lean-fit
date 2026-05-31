'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MonitorWeight,
  FitnessCenter,
  LocalHospital,
  Spa,
  SelfImprovement,
  PregnantWoman,
  Check,
  ArrowForward,
  EmojiEvents,
} from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';
import { colors } from '@/lib/colors';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/public/AnimationWrappers';
import PillBadge from '@/components/public/PillBadge';
import { api, type Service } from '@/lib/api';

const ICON_MAP: Record<string, React.ReactNode> = {
  MonitorWeight: <MonitorWeight sx={{ fontSize: 32 }} />,
  FitnessCenter: <FitnessCenter sx={{ fontSize: 32 }} />,
  EmojiEvents: <EmojiEvents sx={{ fontSize: 32 }} />,
  LocalHospital: <LocalHospital sx={{ fontSize: 32 }} />,
  Spa: <Spa sx={{ fontSize: 32 }} />,
  SelfImprovement: <SelfImprovement sx={{ fontSize: 32 }} />,
  PregnantWoman: <PregnantWoman sx={{ fontSize: 32 }} />,
};

const process_steps = [
  { step: '01', title: 'Initial Consultation', desc: 'We discuss your goals, training history, and lifestyle in a detailed 30-minute session.' },
  { step: '02', title: 'Custom Program Design', desc: 'I create a personalized nutrition and training plan based on your unique goals.' },
  { step: '03', title: 'Implementation', desc: 'You follow the program with my guidance, with daily tracking to ensure progress.' },
  { step: '04', title: 'Track & Optimize', desc: 'Daily monitoring and weekly check-ins to refine your plan and maximize results.' },
];

export default function ServicesPage() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await api.fetchServices();
        setServices(res.services);
      } catch (err) {
        console.error('Failed to fetch services', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;
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
            <PillBadge label="Programs" />
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
              Fitness & Nutrition Programs
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.body,
                maxWidth: 520,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Science-backed programs for fat loss, muscle building, and strength.
            </Typography>
          </FadeInUp>
        </Container>
      </Box>

      {/* Services Grid */}
      <Box sx={{ bgcolor: '#FAFCF8', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          <StaggerContainer staggerDelay={0.08}>
            <Grid container spacing={3}>
              {services.map((svc, i) => (
                <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
                  <StaggerItem>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: '24px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: 'none',
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          transform: 'translateY(-10px)',
                          boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                          borderColor: svc.color,
                        },
                        '&:hover .card-media': {
                          transform: 'scale(1.08)',
                        }
                      }}
                    >
                      {/* Thumbnail Image */}
                      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                        <Image 
                          className="card-media" 
                          src={svc.imageUrl} 
                          alt={svc.title} 
                          fill 
                          style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }} 
                          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                          unoptimized
                        />
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
                        
                        {/* Floating Icon */}
                        <Avatar
                          variant="rounded"
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            width: 48,
                            height: 48,
                            bgcolor: '#fff',
                            color: svc.color,
                            borderRadius: '12px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                            zIndex: 2
                          }}
                        >
                          {ICON_MAP[svc.iconName]}
                        </Avatar>
                      </Box>

                      <CardContent sx={{ p: { xs: 3, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 900,
                            color: '#2F3E2E',
                            fontSize: '1.25rem',
                            mb: 1.5,
                            letterSpacing: -0.5
                          }}
                        >
                          {svc.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#6B8F71', lineHeight: 1.7, mb: 3, flex: 1 }}
                        >
                          {svc.description}
                        </Typography>

                        <Typography variant="overline" sx={{ color: svc.color, fontWeight: 900, letterSpacing: 1, mb: 1.5, display: 'block' }}>
                          What's Included
                        </Typography>

                        <List dense disablePadding sx={{ mb: 3 }}>
                          {svc.benefits.map((b, j) => (
                            <ListItem key={j} disablePadding sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <Check
                                  sx={{
                                    fontSize: 18,
                                    color: svc.color,
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={b}
                                slotProps={{
                                  primary: {
                                    sx: {
                                      fontSize: '0.9rem',
                                      color: '#4a4a4a',
                                      fontWeight: 500
                                    },
                                  },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Button 
                          component={Link} 
                          href="/register"
                          variant="outlined" 
                          fullWidth
                          sx={{ 
                            mt: 'auto',
                            borderColor: 'rgba(0,0,0,0.1)',
                            color: '#2F3E2E',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '12px',
                            py: 1.2,
                            '&:hover': {
                              borderColor: svc.color,
                              bgcolor: `${svc.color}08`,
                              color: svc.color
                            }
                          }}
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </Grid>
              ))}
            </Grid>
          </StaggerContainer>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ bgcolor: '#fff', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <FadeInUp>
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
                <PillBadge label="Process" />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: '#2F3E2E',
                  fontSize: { xs: '1.8rem', md: '2.4rem' },
                  letterSpacing: -0.5,
                }}
              >
                How It Works
              </Typography>
            </Box>
          </FadeInUp>

          <StaggerContainer staggerDelay={0.12}>
            {process_steps.map((step, i) => (
              <StaggerItem key={i}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 2, md: 3 },
                    mb: 4,
                    alignItems: 'flex-start',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '2.5rem',
                      color: 'rgba(76,175,80,0.15)',
                      lineHeight: 1,
                      minWidth: 50,
                      flexShrink: 0,
                    }}
                  >
                    {step.step}
                  </Typography>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: '#2F3E2E',
                        fontSize: '1.05rem',
                        mb: 0.5,
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#6B8F71', lineHeight: 1.7 }}
                    >
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          background: '#ffffff',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <FadeInUp>
            <Typography
              variant="h2"
              sx={{
                color: '#2F3E2E',
                fontWeight: 900,
                mb: 2,
                fontSize: { xs: '1.5rem', md: '2rem' },
                letterSpacing: -0.5,
              }}
            >
              Ready to Get Started?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#6B8F71', mb: 4, lineHeight: 1.7 }}
            >
              Book your free initial consultation and let&apos;s discuss which
              program is right for you.
            </Typography>
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#2E7D32',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '100px',
                pl: 4,
                pr: 1,
                py: 1,
                textTransform: 'none',
                boxShadow: '0 8px 30px rgba(46, 125, 50, 0.15)',
                '&:hover': {
                  bgcolor: '#1b5e20',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              Book Consultation
              <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowForward sx={{ fontSize: 16, color: '#2E7D32' }} />
              </Box>
            </Button>
          </FadeInUp>
        </Container>
      </Box>
    </Box>
  );
}
