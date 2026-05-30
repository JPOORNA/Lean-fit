'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Avatar, Rating, Skeleton } from '@mui/material';
import { ArrowForward, MonitorWeight, FitnessCenter, SelfImprovement, LocalHospital, Spa, PregnantWoman, Instagram, Star, Person, EmojiEvents, Email as EmailIcon } from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FadeInUp, ScaleIn, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/public/AnimationWrappers';
import PillBadge from '@/components/public/PillBadge';
import { api, type InstagramPost, type Testimonial, type Service } from '@/lib/api';
import { colors, gradientText } from '@/lib/colors';

const pageCards = [
  { title: 'Our Programs', desc: 'Tailored plans for every goal - nutrition + training', href: '/services', icon: <FitnessCenter sx={{ fontSize: 28 }} />, color: colors.primary, image: '/meal-prep.png' },
  { title: 'Instagram', desc: 'Daily tips, recipes and inspiration from our feed', href: '/instagram', icon: <Instagram sx={{ fontSize: 28 }} />, color: colors.accent.instagram, image: '/healthy-bowl.png' },
  { title: 'Client Results', desc: 'Real transformations, real stories', href: '/results', icon: <EmojiEvents sx={{ fontSize: 28 }} />, color: colors.accent.orange, image: '/smoothie.png' },
  { title: 'About Vishnu', desc: "Vishnu's story, approach and credentials", href: '/about', icon: <Person sx={{ fontSize: 28 }} />, color: colors.accent.purple, image: '/vishnu.webp' },
  { title: 'Get in Touch', desc: 'Book a consult or send a quick question', href: '/contact', icon: <EmailIcon sx={{ fontSize: 28 }} />, color: colors.accent.blue, image: '/contact.webp' },
];



const stats = [
  { value: 500, suffix: '+', label: 'Happy Clients' },
  { value: 30, suffix: 'kg+', label: 'Kgs Transformed' },
  { value: 4.9, suffix: '★', label: 'Average Rating' },
  
];

const ICON_MAP: Record<string, React.ReactNode> = {
  MonitorWeight: <MonitorWeight sx={{ fontSize: 20 }} />,
  FitnessCenter: <FitnessCenter sx={{ fontSize: 20 }} />,
  EmojiEvents: <EmojiEvents sx={{ fontSize: 20 }} />,
  LocalHospital: <LocalHospital sx={{ fontSize: 20 }} />,
  Spa: <Spa sx={{ fontSize: 20 }} />,
  SelfImprovement: <SelfImprovement sx={{ fontSize: 20 }} />,
  PregnantWoman: <PregnantWoman sx={{ fontSize: 20 }} />,
};

export default function LandingPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    api.fetchInstagramPosts()
      .then((r) => setPosts(r.posts.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
      
    api.fetchTestimonials()
      .then((r) => setTestimonials(r.testimonials.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingTestimonials(false));

    api.fetchServices()
      .then((r) => setServices(r.services.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  return (
    <Box>
      {/* HERO */}
      <Box sx={{ position: 'relative', minHeight: { xs: 'auto', md: '100vh' }, display: 'flex', alignItems: 'center', overflow: 'hidden', bgcolor: colors.pageBg, pt: { xs: 12, md: 0 }, pb: { xs: 6, md: 0 } }}>
        {/* Soft gradient blobs */}
        <Box sx={{ position: 'absolute', top: -120, left: -120, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${colors.primaryFaint} 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 3, md: 6 }} sx={{ alignItems: 'center' }}>
            {/* Text column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FadeInUp>
                <PillBadge label="ISSA Certified Nutritionist & Fitness Coach" sx={{ mb: 3 }} />
              </FadeInUp>
              <FadeInUp delay={0.1}>
                <Typography variant="h1" sx={{ color: colors.heading, fontWeight: 900, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' }, lineHeight: 1.1, mb: 1, letterSpacing: -1.5 }}>
                  Nourish Your Body.{' '}
                  <Box component="span" sx={gradientText}>Transform</Box>{' '}
                  Your Life.
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, color: colors.primary, mb: 3, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                  Vishnu, ISSA Certified Nutritionist
                </Typography>
              </FadeInUp>
              <FadeInUp delay={0.2}>
                <Typography variant="body1" sx={{ color: colors.body, fontWeight: 400, fontSize: { xs: '0.95rem', md: '1.1rem' }, lineHeight: 1.7, mb: 3.5, maxWidth: 480 }}>
                  Science-backed nutrition plans crafted for your lifestyle. No fads - real food, real results, lasting change.
                </Typography>
              </FadeInUp>
              <FadeInUp delay={0.3}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button 
                    component={Link} 
                    href="/register" 
                    variant="contained" 
                    size="large" 
                    sx={{ 
                      bgcolor: '#2E7D32', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: '0.95rem', 
                      borderRadius: '100px', 
                      pl: 4, 
                      pr: 1, 
                      py: 1, 
                      textTransform: 'none', 
                      boxShadow: '0 8px 30px rgba(46, 125, 50, 0.15)',
                      '&:hover': { bgcolor: '#1b5e20', transform: 'translateY(-2px)' }, 
                      transition: 'all 0.3s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    Book Your Consultant Now 
                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowForward sx={{ fontSize: 16, color: '#2E7D32' }} />
                    </Box>
                  </Button>
                  <Button 
                    component={Link} 
                    href="/services" 
                    variant="outlined" 
                    size="large" 
                    startIcon={<Spa sx={{ fontSize: 20 }} />}
                    sx={{ 
                      color: '#2E7D32', 
                      borderColor: 'rgba(0,0,0,0.1)', 
                      fontWeight: 700, 
                      fontSize: '0.95rem', 
                      borderRadius: '100px', 
                      px: 4, 
                      py: 1.5, 
                      textTransform: 'none', 
                      '&:hover': { borderColor: '#2E7D32', bgcolor: 'rgba(46, 125, 50, 0.05)' } 
                    }}
                  >
                    Explore Programs
                  </Button>
                </Box>
              </FadeInUp>
            </Grid>

            {/* Hero image column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <Box sx={{ position: 'relative' }}>
                  {/* Main hero image */}
                  <Box sx={{ position: 'relative', width: '100%', borderRadius: '24px', overflow: 'hidden', aspectRatio: { xs: '16/10', md: '4/3' }, boxShadow: '0 24px 80px rgba(0,0,0,0.08)' }}>
                    <Image 
                      src="/hero-bg.png" 
                      alt="Healthy nutrition" 
                      fill 
                      priority 
                      style={{ objectFit: 'cover' }} 
                      sizes="(max-width: 900px) 100vw, 50vw"
                    />
                  </Box>

                  {/* Floating small images */}
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: -20, right: -16, zIndex: 2 }}>
                    <Box sx={{ position: 'relative', width: { xs: 80, md: 110 }, height: { xs: 80, md: 110 }, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '3px solid #fff', display: { xs: 'none', sm: 'block' } }}>
                      <Image 
                        src="/healthy-bowl.png" 
                        alt="" 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        sizes="(max-width: 900px) 80px, 110px"
                      />
                    </Box>
                  </motion.div>

                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', bottom: -16, left: -16, zIndex: 2 }}>
                    <Box sx={{ position: 'relative', width: { xs: 70, md: 100 }, height: { xs: 70, md: 100 }, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '3px solid #fff', display: { xs: 'none', sm: 'block' }, bgcolor: '#fff' }}>
                      <Image 
                        src="/leanfit.webp" 
                        alt="Leanfit logo" 
                        fill 
                        style={{ objectFit: 'contain', padding: 12 }} 
                        sizes="(max-width: 900px) 70px, 100px"
                      />
                    </Box>
                  </motion.div>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── STATS ─── */}
      <Box sx={{ bgcolor: colors.cardBg, py: { xs: 5, md: 6 }, borderBottom: `1px solid ${colors.border}` }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {stats.map((stat, i) => (
              <Grid key={i} size={{ xs: 12, sm: 4 }}>
                <ScaleIn delay={i * 0.1}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: -1 }}>
                      {stat.value % 1 !== 0 ? <>{stat.value}{stat.suffix}</> : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.body, fontWeight: 600, mt: 0.5, fontSize: '0.85rem' }}>{stat.label}</Typography>
                  </Box>
                </ScaleIn>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── EXPLORE PAGES ─── */}
      <Box sx={{ bgcolor: colors.pageBg, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="xl">
              <FadeInUp>
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
                  <PillBadge label="Explore" />
                  <Typography variant="h2" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: -0.5 }}>Discover Our Best Programs</Typography>
                </Box>
              </FadeInUp>

          <StaggerContainer staggerDelay={0.08}>
            <Grid container spacing={3}>
              {pageCards.map((card, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: i < 2 ? 6 : 4 }}>
                  <StaggerItem>
                    <Card component={Link} href={card.href} sx={{ textDecoration: 'none', height: '100%', borderRadius: '20px', border: `1px solid ${colors.borderLight}`, boxShadow: 'none', overflow: 'hidden', transition: 'all 0.4s ease', cursor: 'pointer', display: 'flex', flexDirection: 'column', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }, '&:hover .card-img': { transform: 'scale(1.08)' } }}>
                      <Box sx={{ height: { xs: 160, md: i < 2 ? 220 : 180 }, overflow: 'hidden', position: 'relative' }}>
                        <Image 
                          className="card-img" 
                          src={card.image} 
                          alt={card.title} 
                          fill 
                          style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }} 
                          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                        />
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }} />
                      </Box>
                      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: `${card.color}12`, color: card.color, borderRadius: '10px' }}>{card.icon}</Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.heading, fontSize: '1.05rem' }}>{card.title}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: colors.body, lineHeight: 1.6, flex: 1 }}>{card.desc}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2, color: card.color, fontWeight: 700, fontSize: '0.85rem' }}>Learn More <ArrowForward sx={{ fontSize: 16 }} /></Box>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </Grid>
              ))}
            </Grid>
          </StaggerContainer>
        </Container>
      </Box>

      {/* ─── IMAGE GALLERY STRIP ─── */}
      <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: colors.cardBg, overflow: 'hidden' }}>
        <motion.div initial={{ x: 0 }} animate={{ x: [0, -600, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex', gap: 16, width: 'max-content' }}>
          {[
            '/snaps/snap (1).webp',
            '/snaps/snap (2).webp',
            '/snaps/snap (3).webp',
            '/snaps/snap (5).webp',
            '/snaps/snap (6).webp',
            '/snaps/snap (8).webp',
            '/snaps/snap (9).webp',
            '/snaps/snap (1).webp',
            '/snaps/snap (2).webp',
            '/snaps/snap (3).webp',
            '/snaps/snap (5).webp',
            '/snaps/snap (6).webp',
            '/snaps/snap (8).webp',
            '/snaps/snap (9).webp',
          ].map((src, i) => (
            <Box 
              key={i} 
              sx={{ 
                position: 'relative',
                height: { xs: 240, md: 380 }, 
                width: { xs: 170, md: 270 }, 
                borderRadius: '16px', 
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  transform: `scale(1.1) rotate(${i % 2 === 0 ? 3 : -3}deg)`,
                  zIndex: 10,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }
              }} 
            >
              <Image 
                src={src} 
                alt="" 
                fill 
                style={{ objectFit: 'cover' }} 
                sizes="(max-width: 900px) 170px, 270px"
              />
            </Box>
          ))}
        </motion.div>
      </Box>

      {/* ─── SERVICES PREVIEW ─── */}
      <Box sx={{ bgcolor: colors.pageBg, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="xl">
          <FadeInUp>
            <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
              <Typography variant="h2" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: -0.5 }}>Services Tailored For You</Typography>
            </Box>
          </FadeInUp>
          <StaggerContainer>
            <Grid container spacing={2.5}>
              {loadingServices ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '24px' }} />
                  </Grid>
                ))
              ) : services.length > 0 ? (
                services.map((svc, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
                    <StaggerItem>
                      <Card sx={{ 
                        height: '100%', 
                        borderRadius: '24px', 
                        border: `1px solid ${colors.borderLight}`, 
                        boxShadow: 'none', 
                        bgcolor: '#fff',
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        '&:hover': { 
                          transform: 'translateY(-6px)', 
                          boxShadow: `0 20px 40px rgba(0,0,0,0.06)`,
                          borderColor: svc.color
                        },
                        '&:hover .svc-img': {
                          transform: 'scale(1.1)',
                        }
                      }}>
                        {/* Thumbnail Image Left */}
                        {svc.imageUrl && (
                          <Box sx={{ position: 'relative', width: { xs: 100, sm: 120 }, flexShrink: 0, overflow: 'hidden' }}>
                            <Image 
                              className="svc-img" 
                              src={svc.imageUrl} 
                              alt={svc.title} 
                              fill 
                              style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }} 
                              sizes="(max-width: 600px) 100px, 120px"
                            />
                            {/* Overlay with icon */}
                            <Box sx={{ 
                              position: 'absolute', 
                              inset: 0, 
                              bgcolor: `${svc.color}dd`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.1,
                              transition: 'opacity 0.3s ease',
                              '&:hover': { opacity: 0.2 }
                            }} />
                          </Box>
                        )}

                        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: `${svc.color}12`,
                                color: svc.color,
                                borderRadius: '8px',
                              }}
                            >
                              {ICON_MAP[svc.iconName] || <FitnessCenter sx={{ fontSize: 20 }} />}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: colors.heading, fontSize: '1rem', letterSpacing: -0.3 }}>{svc.title}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: colors.body, lineHeight: 1.5, fontSize: '0.85rem' }}>{svc.description}</Typography>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  </Grid>
                ))
              ) : (
                <Grid size={12}>
                  <Typography variant="body2" sx={{ textAlign: 'center', color: colors.body, py: 4 }}>
                    No featured programs available at the moment.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </StaggerContainer>
          <FadeInUp delay={0.3}>
            <Box sx={{ textAlign: 'center', mt: 5 }}>
              <Button component={Link} href="/services" endIcon={<ArrowForward />} sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none', '&:hover': { bgcolor: colors.primaryFaint } }}>See All Programs</Button>
            </Box>
          </FadeInUp>
        </Container>
      </Box>

      {/* ─── TESTIMONIALS ─── */}
      <Box sx={{ bgcolor: colors.cardBg, py: { xs: 6, md: 8 }, minHeight: 300 }}>
        <Container maxWidth="xl">
          <FadeInUp>
            <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
              <Typography variant="h2" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: -0.5 }}>Real People. Real Results.</Typography>
            </Box>
          </FadeInUp>
          
          {loadingTestimonials ? (
            <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
              {[1, 2, 3].map((i) => (
                <Grid key={i} size={{ xs: 12, md: 4 }}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '18px' }} />
                </Grid>
              ))}
            </Grid>
          ) : testimonials.length > 0 ? (
            <>
              <StaggerContainer>
                <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
                  {testimonials.map((t) => (
                    <Grid key={t._id} size={{ xs: 12, md: 4 }}>
                      <StaggerItem>
                        <Card sx={{ height: '100%', borderRadius: '18px', border: `1px solid ${colors.borderLight}`, boxShadow: 'none', overflow: 'hidden' }}>
                          {(t.beforeImageUrl || t.afterImageUrl) && (
                            <Box sx={{ display: 'flex', height: 180, position: 'relative' }}>
                              {t.beforeImageUrl && (
                                <Box sx={{ flex: 1, position: 'relative', '&::after': { content: '"Before"', position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: '6px', zIndex: 1 } }}>
                                  <Image src={t.beforeImageUrl} alt="Before" fill style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 50vw, 16vw" />
                                </Box>
                              )}
                              {t.afterImageUrl && (
                                <Box sx={{ flex: 1, position: 'relative', '&::after': { content: '"After"', position: 'absolute', bottom: 8, right: 8, bgcolor: `${colors.primary}d9`, color: '#fff', fontSize: '0.65rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: '6px', zIndex: 1 } }}>
                                  <Image src={t.afterImageUrl} alt="After" fill style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 50vw, 16vw" />
                                </Box>
                              )}
                            </Box>
                          )}
                          <CardContent sx={{ p: 3 }}>
                            <Rating value={t.rating} readOnly size="small" sx={{ mb: 1.5, color: colors.ratingGold }} />
                            <Typography variant="body2" sx={{ color: colors.dark, fontStyle: 'italic', lineHeight: 1.7, mb: 2, minHeight: 60 }}>&ldquo;{t.quote}&rdquo;</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.heading }}>{t.clientName}</Typography>
                              {t.weightLost && <Typography variant="caption" sx={{ bgcolor: colors.primaryFaint, color: colors.primary, fontWeight: 700, px: 1.5, py: 0.4, borderRadius: '8px' }}>{t.weightLost}</Typography>}
                            </Box>
                          </CardContent>
                        </Card>
                      </StaggerItem>
                    </Grid>
                  ))}
                </Grid>
              </StaggerContainer>
              <FadeInUp delay={0.3}>
                <Box sx={{ textAlign: 'center', mt: 5 }}>
                  <Button component={Link} href="/results" endIcon={<ArrowForward />} sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none' }}>View All Results</Button>
                </Box>
              </FadeInUp>
            </>
          ) : null}
        </Container>
      </Box>

      {/* ─── INSTAGRAM PREVIEW ─── */}
      <Box sx={{ bgcolor: colors.pageBg, py: { xs: 6, md: 8 }, minHeight: 200 }}>
        <Container maxWidth="xl">
          <FadeInUp>
            <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
              <Typography variant="h2" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: -0.5 }}>Fresh From Instagram</Typography>
            </Box>
          </FadeInUp>
          
          {loadingPosts ? (
            <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid key={i} size={{ xs: 6, sm: 4, md: 2 }}>
                  <Skeleton variant="rectangular" sx={{ aspectRatio: '1', borderRadius: '14px' }} />
                </Grid>
              ))}
            </Grid>
          ) : posts.length > 0 ? (
            <>
              <StaggerContainer>
                <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
                  {posts.map((post) => (
                    <Grid key={post._id} size={{ xs: 6, sm: 4, md: 2 }}>
                      <StaggerItem>
                        <Box component="a" href={post.postUrl} target="_blank" rel="noopener" sx={{ display: 'block', position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '1', '&:hover .ig-overlay': { opacity: 1 }, '&:hover img': { transform: 'scale(1.06)' } }}>
                          <Image src={post.thumbnailUrl} alt={post.caption} fill style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }} sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 16vw" />
                          <Box className="ig-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s ease' }}>
                            <Instagram sx={{ color: '#fff', fontSize: 28 }} />
                          </Box>
                          {post.type === 'reel' && <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: '6px' }}>REEL</Box>}
                        </Box>
                      </StaggerItem>
                    </Grid>
                  ))}
                </Grid>
              </StaggerContainer>
              <FadeInUp delay={0.3}>
                <Box sx={{ textAlign: 'center', mt: 5 }}>
                  <Button component={Link} href="/instagram" startIcon={<Instagram />} sx={{ color: colors.primary, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none' }}>See All Posts</Button>
                </Box>
              </FadeInUp>
            </>
          ) : null}
        </Container>
      </Box>

      {/* ─── CTA ─── */}
      <Box sx={{ background: colors.ctaBg, py: { xs: 8, md: 10 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', bgcolor: colors.primaryFaint }} />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <FadeInUp>
            <Typography variant="h2" sx={{ color: colors.heading, fontWeight: 900, fontSize: { xs: '1.8rem', md: '2.4rem' }, mb: 2, letterSpacing: -0.5 }}>Ready for Real Change?</Typography>
            <Typography variant="body1" sx={{ color: colors.body, mb: 4, lineHeight: 1.7 }}>Take the first step to a healthier, more vibrant you. Book a free consultation and we'll craft a plan that fits your life.</Typography>
            <Button component={Link} href="/register" variant="contained" size="large" endIcon={<ArrowForward />} sx={{ bgcolor: colors.primary, color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: '14px', px: 5, py: 1.5, textTransform: 'none', boxShadow: `0 8px 30px ${colors.primaryShadow}`, '&:hover': { bgcolor: colors.primaryDark, transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}>
              Get Started
            </Button>
          </FadeInUp>
        </Container>
      </Box>
    </Box>
  );
}
