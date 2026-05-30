"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, roleRoute } from "@/components/auth/AuthProvider";
import { Box, Typography, TextField, Button, Alert, Container, Grid } from "@mui/material";
import { FadeInUp } from "@/components/public/AnimationWrappers";
import { colors, gradientText } from "@/lib/colors";
import { ArrowForward, Email as EmailIcon, Lock as LockIcon } from "@mui/icons-material";
import { PublicOnlyGuard } from "@/components/auth/PublicOnlyGuard";
import PolicyLinks from "@/components/public/PolicyLinks";

export default function LoginPage() {
  return (
    <PublicOnlyGuard>
      <LoginPageContent />
    </PublicOnlyGuard>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(roleRoute(user.role));
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: colors.pageBg, height: { md: '100vh' }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ flex: 1, minHeight: '100%' }}>
        {/* Left Side: Form */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: { xs: 3, md: 8 },
          minHeight: { xs: 'calc(100vh - 64px)', md: 'auto' }
        }}>
          <Container maxWidth="xs" sx={{ p: 0 }}>
            <FadeInUp>
              <Box sx={{ mb: 5 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '2.2rem', md: '2.8rem' }, letterSpacing: -1.5, mb: 1.5 }}>
                  Welcome <Box component="span" sx={gradientText}>Back</Box>
                </Typography>
                <Typography variant="body1" sx={{ color: colors.body, fontSize: '1.05rem', lineHeight: 1.6 }}>
                  Sign in to continue your journey.
                </Typography>
              </Box>

              <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      startAdornment: <EmailIcon sx={{ color: colors.muted, mr: 1.5, fontSize: 20 }} />,
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.02)' } }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      startAdornment: <LockIcon sx={{ color: colors.muted, mr: 1.5, fontSize: 20 }} />,
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.02)' } }}
                />

                {status && (
                  <Alert severity="error" sx={{ borderRadius: '14px', border: '1px solid rgba(211, 47, 47, 0.1)' }}>
                    {status}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ 
                    bgcolor: colors.primary, 
                    color: '#fff', 
                    fontWeight: 700, 
                    py: 2, 
                    borderRadius: '100px', 
                    textTransform: 'none', 
                    fontSize: '1.05rem',
                    boxShadow: `0 10px 30px ${colors.primaryShadow}`,
                    '&:hover': { bgcolor: colors.primaryDark, transform: 'translateY(-2px)' },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: colors.body, fontSize: '0.95rem' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 800 }}>
                      Create one now
                    </Link>
                  </Typography>
                </Box>

                <PolicyLinks showPrefix sx={{ mt: 1.5, textAlign: 'center' }} />
              </Box>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${colors.borderLight}` }}>
                <Button component={Link} href="/" startIcon={<ArrowForward sx={{ transform: 'rotate(180deg)', fontSize: 18 }} />} sx={{ color: colors.muted, textTransform: 'none', fontWeight: 600, '&:hover': { color: colors.primary } }}>
                  Back to homepage
                </Button>
              </Box>
            </FadeInUp>
          </Container>
        </Grid>

        {/* Right Side: Image */}
        <Grid size={{ md: 6, lg: 7 }} sx={{ display: { xs: 'none', md: 'block' }, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <Box 
              component="img" 
              src="/hero-bg.png" 
              alt="Healthy Life" 
              sx={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                filter: 'brightness(0.95)'
              }} 
            />
            {/* Subtle Gradient Overlay */}
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 20%)' }} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
