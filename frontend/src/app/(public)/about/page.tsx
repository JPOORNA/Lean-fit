'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Avatar,
  Button,
  Dialog,
  IconButton,
} from '@mui/material';
import {
  School,
  WorkspacePremium,
  Favorite,
  ArrowForward,
  EmojiEvents,
  MenuBook,
  Groups,
  FitnessCenter,
  Close,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';
import {
  FadeInUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/public/AnimationWrappers';
import PillBadge from '@/components/public/PillBadge';

const snaps = [
  '/snaps/snap (2).webp',
  '/snaps/snap (3).webp',
  '/snaps/snap (4).webp',
  '/snaps/snap (5).webp',
  '/snaps/snap (6).webp',
  '/snaps/snap (9).webp',
];

const values = [
  {
    icon: <MenuBook sx={{ fontSize: 28 }} />,
    title: 'Science-First Approach',
    desc: 'Every recommendation is grounded in nutrition science and proven training methodologies. No fads, no trends — just results.',
    color: '#4CAF50',
  },
  {
    icon: <Favorite sx={{ fontSize: 28 }} />,
    title: 'Daily Tracking',
    desc: 'Consistent progress requires daily accountability. I track your metrics every step of the way to ensure you stay on path.',
    color: '#EC407A',
  },
  {
    icon: <Groups sx={{ fontSize: 28 }} />,
    title: 'Sustainable Habits',
    desc: 'Quick fixes don\'t last. I focus on building habits and training routines that become a natural part of your lifestyle.',
    color: '#7E57C2',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 28 }} />,
    title: 'Performance Growth',
    desc: 'Whether it\'s strength training or lean muscle mass, I provide the structure you need to constantly improve.',
    color: '#FF7043',
  },
];

export default function AboutPage() {
  const [activeImage, setActiveImage] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImage === null) return;
      if (e.key === 'ArrowLeft') {
        setActiveImage((prev) => (prev !== null ? (prev - 1 + snaps.length) % snaps.length : null));
      } else if (e.key === 'ArrowRight') {
        setActiveImage((prev) => (prev !== null ? (prev + 1) % snaps.length : null));
      } else if (e.key === 'Escape') {
        setActiveImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage]);

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
            <PillBadge label="Founder" />
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
              About Vishnu
            </Typography>
          </FadeInUp>
        </Container>
      </Box>

      {/* Bio Section */}
      <Box sx={{ bgcolor: '#fff', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <ScaleIn>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    aspectRatio: { xs: '4/3', md: '3/4' },
                    boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 20px 48px rgba(46, 125, 50, 0.2)',
                    },
                  }}
                >
                  <Image
                    src="/vishnu.webp"
                    alt="Vishnu"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 40vw"
                    style={{
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </ScaleIn>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <FadeInUp>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: '#2F3E2E',
                    mb: 2,
                    fontSize: { xs: '1.8rem', md: '2.4rem' },
                    letterSpacing: -0.5,
                  }}
                >
                  ISSA Certified Nutritionist 
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#6B8F71', lineHeight: 1.8, mb: 3 }}

                >
                   ISSA CPR/AED Certified 
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#6B8F71', lineHeight: 1.8, mb: 3 }}
                  >
                  Hello, I'm Vishnu. As an ISSA Certified Nutritionist with a passion for fitness and body transformation, I help individuals achieve their goals through science-backed nutrition and structured training.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#6B8F71', lineHeight: 1.8, mb: 2 }}
                >
                  I specialize in fat loss, muscle gaining, and strength training. My approach combines meticulous daily tracking with personalized nutrition plans to ensure every client sees real, measurable progress. No guesswork — just data-driven coaching.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#6B8F71', lineHeight: 1.8, mb: 3 }}
                >
                  Whether you're looking for a basic fat loss program or want to maximize lean muscle mass, I provide the roadmap and accountability needed to reach your peak physique.
                </Typography>

                {/* Credential chips */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {[
                    { icon: <WorkspacePremium sx={{ fontSize: 16 }} />, label: 'ISSA Certified' },
                    { icon: <FitnessCenter sx={{ fontSize: 16 }} />, label: 'Strength Coach' },
                    { icon: <EmojiEvents sx={{ fontSize: 16 }} />, label: 'Sports Nutrition' },
                  ].map((cred, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.8,
                        bgcolor: 'rgba(76,175,80,0.08)',
                        color: '#4CAF50',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        px: 1.5,
                        py: 0.6,
                        borderRadius: '10px',
                      }}
                    >
                      {cred.icon}
                      {cred.label}
                    </Box>
                  ))}
                </Box>
              </FadeInUp>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Philosophy / Values */}
      <Box sx={{ bgcolor: '#FAFCF8', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl">
          <FadeInUp>
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#4CAF50',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: 3,
                  mb: 1,
                  display: 'block',
                }}
              >
                Philosophy
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#2F3E2E',
                  fontSize: { xs: '1.8rem', md: '2.4rem' },
                  letterSpacing: -0.5,
                }}
              >
                What I Believe In
              </Typography>
            </Box>
          </FadeInUp>

          <StaggerContainer staggerDelay={0.1}>
            <Grid container spacing={3}>
              {values.map((val, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                  <StaggerItem>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 3,
                        bgcolor: '#fff',
                        borderRadius: '18px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 52,
                          height: 52,
                          bgcolor: `${val.color}10`,
                          color: val.color,
                          mx: 'auto',
                          mb: 2,
                          borderRadius: '14px',
                        }}
                        variant="rounded"
                      >
                        {val.icon}
                      </Avatar>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: '#2F3E2E',
                          mb: 1,
                          fontSize: '0.95rem',
                        }}
                      >
                        {val.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#6B8F71', lineHeight: 1.7, fontSize: '0.84rem' }}
                      >
                        {val.desc}
                      </Typography>
                    </Box>
                  </StaggerItem>
                </Grid>
              ))}
            </Grid>
          </StaggerContainer>
        </Container>
      </Box>

      {/* Gallery Section */}
      <Box sx={{ bgcolor: '#fff', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl">
          <FadeInUp>
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#4CAF50',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: 3,
                  mb: 1,
                  display: 'block',
                }}
              >
                Gallery
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#2F3E2E',
                  fontSize: { xs: '1.8rem', md: '2.4rem' },
                  letterSpacing: -0.5,
                }}
              >
                Snapshots & Transformations
              </Typography>
            </Box>
          </FadeInUp>

          <StaggerContainer staggerDelay={0.08}>
            <Grid container spacing={3}>
              {snaps.map((snap, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <StaggerItem>
                    <Box
                      onClick={() => setActiveImage(i)}
                      sx={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        aspectRatio: '1/1',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.03) translateY(-4px)',
                          boxShadow: '0 12px 30px rgba(46, 125, 50, 0.15)',
                          '& .snap-overlay': {
                            opacity: 1,
                          },
                          '& .snap-img': {
                            transform: 'scale(1.08)',
                          }
                        },
                      }}
                    >
                      <Image
                        src={snap}
                        alt={`Snapshot ${i + 1}`}
                        fill
                        className="snap-img"
                        sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                        style={{
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                      {/* Subtle hover overlay with icon/gradient */}
                      <Box
                        className="snap-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to top, rgba(47, 62, 46, 0.6) 0%, rgba(47, 62, 46, 0) 100%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          p: 3,
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#fff',
                            fontWeight: 700,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                          }}
                        >
                          View Full Image
                        </Typography>
                      </Box>
                    </Box>
                  </StaggerItem>
                </Grid>
              ))}
            </Grid>
          </StaggerContainer>
        </Container>
      </Box>

      {/* Lightbox Dialog */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={activeImage !== null}
        onClose={() => setActiveImage(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              m: 0,
              maxWidth: '95vw',
              maxHeight: '95vh',
            },
          },
        }}
      >
        {activeImage !== null && (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={() => setActiveImage(null)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: '#fff',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                zIndex: 10,
              }}
            >
              <Close />
            </IconButton>

            {/* Navigation - Previous */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage((prev) => (prev !== null ? (prev - 1 + snaps.length) % snaps.length : null));
              }}
              sx={{
                position: 'absolute',
                left: 16,
                color: '#fff',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                zIndex: 10,
              }}
            >
              <NavigateBefore />
            </IconButton>

            {/* Image Container */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                bgcolor: 'rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src={snaps[activeImage]}
                alt="Snapshot full view"
                fill
                sizes="90vw"
                style={{
                  objectFit: 'contain',
                }}
              />
            </Box>

            {/* Navigation - Next */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage((prev) => (prev !== null ? (prev + 1) % snaps.length : null));
              }}
              sx={{
                position: 'absolute',
                right: 16,
                color: '#fff',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                zIndex: 10,
              }}
            >
              <NavigateNext />
            </IconButton>
          </Box>
        )}
      </Dialog>

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
              variant="h4"
              sx={{
                color: '#2F3E2E',
                fontWeight: 900,
                mb: 2,
                fontSize: { xs: '1.5rem', md: '2rem' },
                letterSpacing: -0.5,
              }}
            >
              Let&apos;s Work Together
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#6B8F71', mb: 4, lineHeight: 1.7 }}
            >
              Ready to transform your relationship with food and achieve your
              health goals? I&apos;d love to hear from you.
            </Typography>
            <Button
              component={Link}
              href="/contact"
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
              Get in Touch
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
