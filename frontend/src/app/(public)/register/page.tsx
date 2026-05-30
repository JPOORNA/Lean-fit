"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Box, Typography, TextField, Button, Alert, Container, Grid, Checkbox, FormControlLabel } from "@mui/material";
import { FadeInUp } from "@/components/public/AnimationWrappers";
import { colors, gradientText } from "@/lib/colors";
import { ArrowForward, Person as PersonIcon, Email as EmailIcon, Lock as LockIcon } from "@mui/icons-material";
import { PublicOnlyGuard } from "@/components/auth/PublicOnlyGuard";
import PolicyLinks from "@/components/public/PolicyLinks";

export default function RegisterPage() {
  return (
    <PublicOnlyGuard>
      <RegisterPageContent />
    </PublicOnlyGuard>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!acceptedPolicies) {
      setStatus('Please agree to the policies before creating your account.');
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await api.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "user",
        timezone
      });
      router.push("/login");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Registration failed. Verify the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: colors.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ flex: 1, minHeight: '100%' }}>
        {/* Left Side: Form */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: { xs: 3, md: 8 },
          py: { xs: 10, md: 8 }, // Add some vertical padding for longer form
          minHeight: { xs: 'calc(100vh - 64px)', md: 'auto' }
        }}>
          <Container maxWidth="xs" sx={{ p: 0 }}>
            <FadeInUp>
              <Box sx={{ mb: 5 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: colors.heading, fontSize: { xs: '2.2rem', md: '2.8rem' }, letterSpacing: -1.5, mb: 1.5 }}>
                  Join <Box component="span" sx={gradientText}>Us</Box> Today
                </Typography>
                <Typography variant="body1" sx={{ color: colors.body, fontSize: '1.05rem', lineHeight: 1.6 }}>
                  Start your professional health journey.
                </Typography>
              </Box>

              <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Leanfit"
                  slotProps={{
                    input: {
                      startAdornment: <PersonIcon sx={{ color: colors.muted, mr: 1.5, fontSize: 20 }} />,
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.02)' } }}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@example.com"
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
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="At least 8 characters"
                  slotProps={{
                    input: {
                      startAdornment: <LockIcon sx={{ color: colors.muted, mr: 1.5, fontSize: 20 }} />,
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.02)' } }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedPolicies}
                      onChange={(e) => setAcceptedPolicies(e.target.checked)}
                      sx={{ color: colors.primary, '&.Mui-checked': { color: colors.primary } }}
                    />
                  }
                  label={(
                    <Typography variant="body2" sx={{ color: colors.body, lineHeight: 1.6 }}>
                      I agree to the{' '}
                      <Link href="/terms" style={{ color: colors.primary, fontWeight: 700, textDecoration: 'none' }}>Terms of Service</Link>,{' '}
                      <Link href="/privacy" style={{ color: colors.primary, fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>, and{' '}
                      <Link href="/cancellation-refund" style={{ color: colors.primary, fontWeight: 700, textDecoration: 'none' }}>Cancellation & Refund Policy</Link>.
                    </Typography>
                  )}
                  sx={{ alignItems: 'flex-start', mt: 0.5 }}
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
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: colors.body, fontSize: '0.95rem' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 800 }}>
                      Sign in here
                    </Link>
                  </Typography>
                </Box>

                <PolicyLinks showPrefix sx={{ mt: 0.5, textAlign: 'center' }} />
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
