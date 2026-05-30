'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  CheckCircleOutlined,
  Security,
  ShieldOutlined,
  Schedule,
} from '@mui/icons-material';
import Link from 'next/link';
import { FadeInUp, ScaleIn, StaggerContainer, StaggerItem } from '@/components/public/AnimationWrappers';
import PillBadge from '@/components/public/PillBadge';
import { colors, gradientText } from '@/lib/colors';

export type PolicySection = { 
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPolicyPageProps = {
  badgeLabel: string;
  title: string;
  intro: string;
  effectiveDate: string;
  summaryTitle: string;
  summaryPoints: string[];
  contactTitle: string;
  contactDescription: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  sections: PolicySection[];
};

const summaryIcons = [Security, ShieldOutlined, Schedule, CheckCircleOutlined];

export default function LegalPolicyPage({
  badgeLabel, 
  title,
  intro,
  effectiveDate,
  summaryTitle,
  summaryPoints,
  contactTitle,
  contactDescription,
  contactEmail,
  contactPhone,
  contactAddress,
  sections,
}: LegalPolicyPageProps) {
  return (
    <Box sx={{ bgcolor: colors.pageBg }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 12, md: 16 },
          pb: { xs: 6, md: 8 },
          bgcolor: colors.pageBg,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(46,125,50,0.05) 0%, rgba(255,255,255,0) 55%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -140,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primaryFaint} 0%, transparent 68%)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -180,
            left: -140,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 204, 128, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }} sx={{ alignItems: 'center' }}>
              <FadeInUp>
                <PillBadge label={badgeLabel} sx={{ mb: 2.5 }} />
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    color: colors.heading,
                    fontSize: { xs: '2.35rem', sm: '2.9rem', md: '4rem' },
                    lineHeight: 1.05,
                    letterSpacing: -1.8,
                    mb: 2,
                    maxWidth: 820,
                  }}
                >
                  {title.split(' ').slice(0, -1).join(' ')}{' '}
                  <Box component="span" sx={gradientText}>
                    {title.split(' ').slice(-1).join(' ')}
                  </Box>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: colors.body,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.75,
                    maxWidth: 760,
                    mb: 3,
                  }}
                >
                  {intro}
                </Typography>
              </FadeInUp>

              <StaggerContainer staggerDelay={0.08}>
                <Grid container spacing={2} sx={{ mb: 3, alignItems: 'stretch' }}>
                  {summaryPoints.map((point, index) => {
                    const Icon = summaryIcons[index % summaryIcons.length];
                    return (
                      <Grid key={point} size={{ xs: 12, sm: 6 }}>
                        <StaggerItem>
                          <Card
                            sx={{
                              height: '100%',
                              borderRadius: '18px',
                              border: `1px solid ${colors.borderLight}`,
                              boxShadow: 'none',
                            }}
                          >
                            <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 2.2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '12px',
                                  bgcolor: colors.primaryFaint,
                                  color: colors.primary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Icon sx={{ fontSize: 20 }} />
                              </Box>
                              <Typography sx={{ color: colors.heading, fontWeight: 700, lineHeight: 1.55 }}>
                                {point}
                              </Typography>
                            </CardContent>
                          </Card>
                        </StaggerItem>
                      </Grid>
                    );
                  })}
                </Grid>
              </StaggerContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <ScaleIn>
                <Card
                  sx={{
                    borderRadius: '24px',
                    border: `1px solid ${colors.borderLight}`,
                    boxShadow: '0 24px 70px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'linear-gradient(180deg, #fff 0%, #fbfdf9 100%)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.primary,
                        fontWeight: 800,
                        letterSpacing: 2,
                        fontSize: '0.72rem',
                      }}
                    >
                      {summaryTitle}
                    </Typography>
                    <Typography variant="h5" sx={{ color: colors.heading, fontWeight: 900, mt: 1, mb: 2 }}>
                      What to know
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.2, m: 0, color: colors.dark }}>
                      {summaryPoints.map((point) => (
                        <Box component="li" key={point} sx={{ mb: 1.3, lineHeight: 1.7 }}>
                          {point}
                        </Box>
                      ))}
                    </Box>

                    <Divider sx={{ my: 3, borderColor: colors.border }} />

                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: '18px',
                        bgcolor: colors.primaryFaint,
                        border: `1px solid rgba(46,125,50,0.12)`,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.8rem', color: colors.primary, fontWeight: 800, mb: 0.5 }}>
                        Effective date
                      </Typography>
                      <Typography sx={{ color: colors.heading, fontWeight: 800 }}>{effectiveDate}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </ScaleIn>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ bgcolor: colors.pageBg, py: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'flex-start' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                sx={{
                  borderRadius: '24px',
                  border: `1px solid ${colors.borderLight}`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                  <StaggerContainer staggerDelay={0.05}>
                    {sections.map((section, index) => (
                      <StaggerItem key={section.id}>
                        <Box id={section.id} sx={{ scrollMarginTop: 120, ...(index > 0 ? { mt: 4 } : {}) }}>
                          <Typography
                            variant="h4"
                            sx={{
                              color: colors.heading,
                              fontWeight: 900,
                              fontSize: { xs: '1.45rem', md: '1.8rem' },
                              letterSpacing: -0.7,
                              mb: 2,
                            }}
                          >
                            {section.title}
                          </Typography>

                          {section.paragraphs.map((paragraph) => (
                            <Typography
                              key={paragraph}
                              variant="body1"
                              sx={{ color: colors.dark, lineHeight: 1.85, mb: 2 }}
                            >
                              {paragraph}
                            </Typography>
                          ))}

                          {section.bullets && section.bullets.length > 0 ? (
                            <Box component="ul" sx={{ pl: 2.4, mt: 1, mb: 0, color: colors.dark }}>
                              {section.bullets.map((bullet) => (
                                <Box component="li" key={bullet} sx={{ mb: 1.1, lineHeight: 1.75 }}>
                                  {bullet}
                                </Box>
                              ))}
                            </Box>
                          ) : null}
                        </Box>

                        {index < sections.length - 1 ? (
                          <Divider sx={{ mt: 4, borderColor: colors.border }} />
                        ) : null}
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 110 } }}>
                <Card
                  sx={{
                    borderRadius: '22px',
                    border: `1px solid ${colors.borderLight}`,
                    boxShadow: '0 18px 50px rgba(0,0,0,0.05)',
                    mb: 3,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.primary,
                        fontWeight: 800,
                        letterSpacing: 2,
                        fontSize: '0.72rem',
                      }}
                    >
                      On this page
                    </Typography>
                    <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
                      {sections.map((section) => (
                        <Typography
                          key={section.id}
                          component="a"
                          href={`#${section.id}`}
                          sx={{
                            color: colors.dark,
                            textDecoration: 'none',
                            fontWeight: 600,
                            py: 0.5,
                            transition: 'color 0.2s ease',
                            '&:hover': { color: colors.primary },
                          }}
                        >
                          {section.title}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    borderRadius: '22px',
                    border: `1px solid ${colors.borderLight}`,
                    boxShadow: '0 18px 50px rgba(0,0,0,0.05)',
                    background: 'linear-gradient(180deg, rgba(46,125,50,0.05) 0%, #ffffff 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: colors.primary,
                        fontWeight: 800,
                        letterSpacing: 2,
                        fontSize: '0.72rem',
                      }}
                    >
                      {contactTitle}
                    </Typography>
                    <Typography variant="h6" sx={{ color: colors.heading, fontWeight: 900, mt: 1, mb: 1.5 }}>
                      Need help?
                    </Typography>
                    <Typography sx={{ color: colors.dark, lineHeight: 1.75, mb: 2.5 }}>
                      {contactDescription}
                    </Typography>

                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.muted, fontWeight: 800, letterSpacing: 1.4 }}>
                          Email
                        </Typography>
                        <Typography sx={{ color: colors.heading, fontWeight: 700 }}>{contactEmail}</Typography>
                      </Box>
                      {contactPhone ? (
                        <Box>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.muted, fontWeight: 800, letterSpacing: 1.4 }}>
                            Phone
                          </Typography>
                          <Typography sx={{ color: colors.heading, fontWeight: 700 }}>{contactPhone}</Typography>
                        </Box>
                      ) : null}
                      {contactAddress ? (
                        <Box>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.muted, fontWeight: 800, letterSpacing: 1.4 }}>
                            Location
                          </Typography>
                          <Typography sx={{ color: colors.heading, fontWeight: 700 }}>{contactAddress}</Typography>
                        </Box>
                      ) : null}
                    </Box>

                    <Box
                      component={Link}
                      href="/contact"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 3,
                        color: colors.primary,
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        '&:hover': {
                          color: colors.primaryDark,
                        }
                      }}
                    >
                      Contact us
                      <ArrowForward sx={{ fontSize: 16 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}