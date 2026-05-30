'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Skeleton, Chip, Card, CardContent } from '@mui/material';
import { Instagram, PlayCircleOutlined } from '@mui/icons-material';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/public/AnimationWrappers';
import { api, type InstagramPost } from '@/lib/api';
import { colors } from '@/lib/colors';

export default function InstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'post' | 'reel'>('all');

  useEffect(() => {
    api.fetchInstagramPosts().then((r) => setPosts(r.posts)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ pt: { xs: 14, md: 16 }, pb: { xs: 4, md: 5 }, background: colors.heroBg, textAlign: 'center' }}>
        <Container maxWidth="md">
          <FadeInUp>
            <Instagram sx={{ fontSize: 48, mb: 2, color: colors.primary }} />
            <Typography variant="h2" sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, mb: 2, letterSpacing: -0.5, color: colors.heading }}>Follow the Journey</Typography>
            <Typography variant="body1" sx={{ color: colors.body, maxWidth: 500, mx: 'auto', lineHeight: 1.7 }}>
              Daily tips, recipes & inspiration.
            </Typography>
          </FadeInUp>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ bgcolor: colors.sectionAlt, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          {/* Filter chips */}
          <FadeInUp>
            <Box sx={{ display: 'flex', gap: 1, mb: 4, justifyContent: 'center' }}>
              {(['all', 'post', 'reel'] as const).map((f) => (
                <Chip key={f} label={f === 'all' ? 'All' : f === 'post' ? 'Posts' : 'Reels'} onClick={() => setFilter(f)}
                  sx={{ fontWeight: 700, fontSize: '0.85rem', px: 1, bgcolor: filter === f ? colors.primary : colors.borderLight, color: filter === f ? '#fff' : colors.heading, '&:hover': { bgcolor: filter === f ? colors.primaryDark : colors.border } }} />
              ))}
            </Box>
          </FadeInUp>

          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '1', borderRadius: '14px' }} height="auto" />
              ))}
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Instagram sx={{ fontSize: 64, color: colors.border, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colors.body, fontWeight: 600 }}>No posts yet</Typography>
              <Typography variant="body2" sx={{ color: colors.muted }}>Check back soon for new content!</Typography>
            </Box>
          ) : (
            <StaggerContainer staggerDelay={0.06}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                {filtered.map((post) => (
                  <StaggerItem key={post._id}>
                    <Card
                      component="a"
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener"
                      sx={{
                        textDecoration: 'none',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `1px solid ${colors.borderLight}`,
                        boxShadow: 'none',
                        transition: 'all 0.35s ease',
                        display: 'block',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' },
                        '&:hover .ig-img': { transform: 'scale(1.06)' },
                      }}
                    >
                      {/* Image */}
                      <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '1' }}>
                        <Box className="ig-img" component="img" src={post.thumbnailUrl} alt={post.caption || 'Instagram post'} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />

                        {post.type === 'reel' && (
                          <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, px: 1, py: 0.4, borderRadius: '8px' }}>
                            <PlayCircleOutlined sx={{ fontSize: 14 }} /> REEL
                          </Box>
                        )}
                      </Box>

                      {/* Text card at bottom */}
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{
                          color: colors.heading,
                          fontWeight: 500,
                          lineHeight: 1.5,
                          fontSize: '0.82rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 38,
                        }}>
                          {post.caption || 'View on Instagram →'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: colors.primary }}>
                          <Instagram sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: colors.primary, fontSize: '0.7rem' }}>View Post</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </Box>
            </StaggerContainer>
          )}
        </Container>
      </Box>
    </Box>
  );
}
