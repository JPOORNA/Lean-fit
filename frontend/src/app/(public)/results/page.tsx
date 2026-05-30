'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Rating,
  Skeleton,
  Chip,
} from '@mui/material';
import { FormatQuote, TrendingDown } from '@mui/icons-material';
import {
  FadeInUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
} from '@/components/public/AnimationWrappers';
import PillBadge from '@/components/public/PillBadge';
import { api, type Testimonial } from '@/lib/api';

export default function ResultsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchTestimonials()
      .then((r) => setTestimonials(r.testimonials))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
            <PillBadge label="Results" />
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
              Real Results, Real People
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#6B8F71',
                maxWidth: 520,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Real stories, real transformations.
            </Typography>
          </FadeInUp>
        </Container>
      </Box>

      {/* Stats */}
      <Box sx={{ bgcolor: '#fff', py: { xs: 5, md: 6 }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Container maxWidth="md">
          <Grid container spacing={3}>
            {[
              { value: 500, suffix: '+', label: 'Clients Transformed' },
              { value: 95, suffix: '%', label: 'Success Rate' },
              { value: 1500, suffix: '+', label: 'Total Weight Transformed (kg)' },
            ].map((stat, i) => (
              <Grid key={i} size={{ xs: 4 }}>
                <ScaleIn delay={i * 0.1}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 900,
                        color: '#4CAF50',
                        fontSize: { xs: '1.5rem', md: '2rem' },
                      }}
                    >
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#6B8F71', fontWeight: 600 }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </ScaleIn>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Grid */}
      <Box sx={{ bgcolor: '#FAFCF8', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          {loading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, md: 6 }}>
                  <Skeleton
                    variant="rounded"
                    height={320}
                    sx={{ borderRadius: '16px' }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : testimonials.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <TrendingDown sx={{ fontSize: 64, color: 'rgba(0,0,0,0.08)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6B8F71', fontWeight: 600 }}>
                Testimonials coming soon
              </Typography>
            </Box>
          ) : (
            <StaggerContainer staggerDelay={0.08}>
              <Grid container spacing={3}>
                {testimonials.map((t) => (
                  <Grid key={t._id} size={{ xs: 12, md: 6 }}>
                    <StaggerItem>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: '18px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: 'none',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
                          },
                        }}
                      >
                        {/* Before / After */}
                        {(t.beforeImageUrl || t.afterImageUrl) && (
                          <Box
                            sx={{
                              display: 'flex',
                              height: { xs: 200, md: 240 },
                              position: 'relative',
                            }}
                          >
                            {t.beforeImageUrl && (
                              <Box
                                sx={{
                                  flex: 1,
                                  backgroundImage: `url(${t.beforeImageUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center top',
                                  position: 'relative',
                                  '&::after': {
                                    content: '"Before"',
                                    position: 'absolute',
                                    bottom: 12,
                                    left: 12,
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    px: 1.5,
                                    py: 0.4,
                                    borderRadius: '8px',
                                    letterSpacing: 0.5,
                                  },
                                }}
                              />
                            )}
                            {t.afterImageUrl && (
                              <Box
                                sx={{
                                  flex: 1,
                                  backgroundImage: `url(${t.afterImageUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center top',
                                  position: 'relative',
                                  '&::after': {
                                    content: '"After"',
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 12,
                                    bgcolor: 'rgba(76,175,80,0.85)',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    px: 1.5,
                                    py: 0.4,
                                    borderRadius: '8px',
                                    letterSpacing: 0.5,
                                  },
                                }}
                              />
                            )}
                            {/* Center divider line */}
                            {t.beforeImageUrl && t.afterImageUrl && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: '50%',
                                  top: 0,
                                  bottom: 0,
                                  width: 2,
                                  bgcolor: '#fff',
                                  transform: 'translateX(-50%)',
                                }}
                              />
                            )}
                          </Box>
                        )}

                        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Rating
                              value={t.rating}
                              readOnly
                              size="small"
                              sx={{ color: '#FFCC80' }}
                            />
                            {t.weightLost && (
                              <Chip
                                icon={<TrendingDown sx={{ fontSize: 14 }} />}
                                label={t.weightLost}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(76,175,80,0.1)',
                                  color: '#4CAF50',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 26,
                                }}
                              />
                            )}
                            {t.duration && (
                              <Chip
                                label={t.duration}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(0,0,0,0.04)',
                                  color: '#6B8F71',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 26,
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ position: 'relative', pl: 2.5, mb: 2 }}>
                            <FormatQuote
                              sx={{
                                position: 'absolute',
                                left: -4,
                                top: -4,
                                fontSize: 28,
                                color: 'rgba(76,175,80,0.2)',
                                transform: 'rotate(180deg)',
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#4a4a4a',
                                fontStyle: 'italic',
                                lineHeight: 1.7,
                              }}
                            >
                              {t.quote}
                            </Typography>
                          </Box>

                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: '#2F3E2E' }}
                          >
                            — {t.clientName}
                          </Typography>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  </Grid>
                ))}
              </Grid>
            </StaggerContainer>
          )}
        </Container>
      </Box>
    </Box>
  );
}
