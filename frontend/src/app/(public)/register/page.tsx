"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Box, Typography, TextField, Button, Alert, Container, Grid, Checkbox, FormControlLabel, MenuItem } from "@mui/material";
import { FadeInUp } from "@/components/public/AnimationWrappers";
import { colors, gradientText } from "@/lib/colors";
import { ArrowForward, Person as PersonIcon, Email as EmailIcon, Lock as LockIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import { PublicOnlyGuard } from "@/components/auth/PublicOnlyGuard";
import PolicyLinks from "@/components/public/PolicyLinks";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

const COUNTRY_CODES = [
  { code: "+1", label: "US / CA / Caribbean (+1)" },
  { code: "+7", label: "RU / KZ (+7)" },
  { code: "+20", label: "EG (+20)" },
  { code: "+27", label: "ZA (+27)" },
  { code: "+30", label: "GR (+30)" },
  { code: "+31", label: "NL (+31)" },
  { code: "+32", label: "BE (+32)" },
  { code: "+33", label: "FR (+33)" },
  { code: "+34", label: "ES (+34)" },
  { code: "+36", label: "HU (+36)" },
  { code: "+39", label: "IT (+39)" },
  { code: "+40", label: "RO (+40)" },
  { code: "+41", label: "CH (+41)" },
  { code: "+43", label: "AT (+43)" },
  { code: "+44", label: "GB / UK (+44)" },
  { code: "+45", label: "DK (+45)" },
  { code: "+46", label: "SE (+46)" },
  { code: "+47", label: "NO (+47)" },
  { code: "+48", label: "PL (+48)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+51", label: "PE (+51)" },
  { code: "+52", label: "MX (+52)" },
  { code: "+53", label: "CU (+53)" },
  { code: "+54", label: "AR (+54)" },
  { code: "+55", label: "BR (+55)" },
  { code: "+56", label: "CL (+56)" },
  { code: "+57", label: "CO (+57)" },
  { code: "+58", label: "VE (+58)" },
  { code: "+60", label: "MY (+60)" },
  { code: "+61", label: "AU / CX / CC (+61)" },
  { code: "+62", label: "ID (+62)" },
  { code: "+63", label: "PH (+63)" },
  { code: "+64", label: "NZ (+64)" },
  { code: "+65", label: "SG (+65)" },
  { code: "+66", label: "TH (+66)" },
  { code: "+81", label: "JP (+81)" },
  { code: "+82", label: "KR (+82)" },
  { code: "+84", label: "VN (+84)" },
  { code: "+86", label: "CN (+86)" },
  { code: "+90", label: "TR (+90)" },
  { code: "+91", label: "IN (+91)" },
  { code: "+92", label: "PK (+92)" },
  { code: "+93", label: "AF (+93)" },
  { code: "+94", label: "LK (+94)" },
  { code: "+95", label: "MM (+95)" },
  { code: "+98", label: "IR (+98)" },
  { code: "+211", label: "SS (+211)" },
  { code: "+212", label: "MA (+212)" },
  { code: "+213", label: "DZ (+213)" },
  { code: "+216", label: "TN (+216)" },
  { code: "+218", label: "LY (+218)" },
  { code: "+220", label: "GM (+220)" },
  { code: "+221", label: "SN (+221)" },
  { code: "+222", label: "MR (+222)" },
  { code: "+223", label: "ML (+223)" },
  { code: "+224", label: "GN (+224)" },
  { code: "+225", label: "CI (+225)" },
  { code: "+226", label: "BF (+226)" },
  { code: "+227", label: "NE (+227)" },
  { code: "+228", label: "TG (+228)" },
  { code: "+229", label: "BJ (+229)" },
  { code: "+230", label: "MU (+230)" },
  { code: "+231", label: "LR (+231)" },
  { code: "+232", label: "SL (+232)" },
  { code: "+233", label: "GH (+233)" },
  { code: "+234", label: "NG (+234)" },
  { code: "+235", label: "TD (+235)" },
  { code: "+236", label: "CF (+236)" },
  { code: "+237", label: "CM (+237)" },
  { code: "+238", label: "CV (+238)" },
  { code: "+239", label: "ST (+239)" },
  { code: "+240", label: "GQ (+240)" },
  { code: "+241", label: "GA (+241)" },
  { code: "+242", label: "CG (+242)" },
  { code: "+243", label: "CD (+243)" },
  { code: "+244", label: "AO (+244)" },
  { code: "+245", label: "GW (+245)" },
  { code: "+248", label: "SC (+248)" },
  { code: "+249", label: "SD (+249)" },
  { code: "+250", label: "RW (+250)" },
  { code: "+251", label: "ET (+251)" },
  { code: "+252", label: "SO (+252)" },
  { code: "+253", label: "DJ (+253)" },
  { code: "+254", label: "KE (+254)" },
  { code: "+255", label: "TZ (+255)" },
  { code: "+256", label: "UG (+256)" },
  { code: "+257", label: "BI (+257)" },
  { code: "+258", label: "MZ (+258)" },
  { code: "+260", label: "ZM (+260)" },
  { code: "+261", label: "MG (+261)" },
  { code: "+262", label: "RE / YT (+262)" },
  { code: "+263", label: "ZW (+263)" },
  { code: "+264", label: "NA (+264)" },
  { code: "+265", label: "MW (+265)" },
  { code: "+266", label: "LS (+266)" },
  { code: "+267", label: "BW (+267)" },
  { code: "+268", label: "SZ (+268)" },
  { code: "+269", label: "KM (+269)" },
  { code: "+290", label: "SH (+290)" },
  { code: "+291", label: "ER (+291)" },
  { code: "+297", label: "AW (+297)" },
  { code: "+298", label: "FO (+298)" },
  { code: "+299", label: "GL (+299)" },
  { code: "+350", label: "GI (+350)" },
  { code: "+351", label: "PT (+351)" },
  { code: "+352", label: "LU (+352)" },
  { code: "+353", label: "IE (+353)" },
  { code: "+354", label: "IS (+354)" },
  { code: "+355", label: "AL (+355)" },
  { code: "+356", label: "MT (+356)" },
  { code: "+357", label: "CY (+357)" },
  { code: "+358", label: "FI (+358)" },
  { code: "+359", label: "BG (+359)" },
  { code: "+370", label: "LT (+370)" },
  { code: "+371", label: "LV (+371)" },
  { code: "+372", label: "EE (+372)" },
  { code: "+373", label: "MD (+373)" },
  { code: "+374", label: "AM (+374)" },
  { code: "+375", label: "BY (+375)" },
  { code: "+376", label: "AD (+376)" },
  { code: "+377", label: "MC (+377)" },
  { code: "+378", label: "SM (+378)" },
  { code: "+379", label: "VA (+379)" },
  { code: "+380", label: "UA (+380)" },
  { code: "+381", label: "RS (+381)" },
  { code: "+382", label: "ME (+382)" },
  { code: "+385", label: "HR (+385)" },
  { code: "+386", label: "SI (+386)" },
  { code: "+387", label: "BA (+387)" },
  { code: "+389", label: "MK (+389)" },
  { code: "+420", label: "CZ (+420)" },
  { code: "+421", label: "SK (+421)" },
  { code: "+423", label: "LI (+423)" },
  { code: "+500", label: "FK (+500)" },
  { code: "+501", label: "BZ (+501)" },
  { code: "+502", label: "GT (+502)" },
  { code: "+503", label: "SV (+503)" },
  { code: "+504", label: "HN (+504)" },
  { code: "+505", label: "NI (+505)" },
  { code: "+506", label: "CR (+506)" },
  { code: "+507", label: "PA (+507)" },
  { code: "+508", label: "PM (+508)" },
  { code: "+509", label: "HT (+509)" },
  { code: "+590", label: "GP / BL / MF (+590)" },
  { code: "+591", label: "BO (+591)" },
  { code: "+592", label: "GY (+592)" },
  { code: "+593", label: "EC (+593)" },
  { code: "+594", label: "GF (+594)" },
  { code: "+595", label: "PY (+595)" },
  { code: "+596", label: "MQ (+596)" },
  { code: "+597", label: "SR (+597)" },
  { code: "+598", label: "UY (+598)" },
  { code: "+599", label: "CW / BQ (+599)" },
  { code: "+670", label: "TL (+670)" },
  { code: "+672", label: "NF / AQ (+672)" },
  { code: "+673", label: "BN (+673)" },
  { code: "+674", label: "NR (+674)" },
  { code: "+675", label: "PG (+675)" },
  { code: "+676", label: "TO (+676)" },
  { code: "+677", label: "SB (+677)" },
  { code: "+678", label: "VU (+678)" },
  { code: "+679", label: "FJ (+679)" },
  { code: "+680", label: "PW (+680)" },
  { code: "+681", label: "WF (+681)" },
  { code: "+682", label: "CK (+682)" },
  { code: "+683", label: "NU (+683)" },
  { code: "+685", label: "WS (+685)" },
  { code: "+686", label: "KI (+686)" },
  { code: "+687", label: "NC (+687)" },
  { code: "+688", label: "TV (+688)" },
  { code: "+689", label: "PF (+689)" },
  { code: "+690", label: "TK (+690)" },
  { code: "+691", label: "FM (+691)" },
  { code: "+692", label: "MH (+692)" },
  { code: "+850", label: "KP (+850)" },
  { code: "+852", label: "HK (+852)" },
  { code: "+853", label: "MO (+853)" },
  { code: "+855", label: "KH (+855)" },
  { code: "+856", label: "LA (+856)" },
  { code: "+880", label: "BD (+880)" },
  { code: "+886", label: "TW (+886)" },
  { code: "+960", label: "MV (+960)" },
  { code: "+961", label: "LB (+961)" },
  { code: "+962", label: "JO (+962)" },
  { code: "+963", label: "SY (+963)" },
  { code: "+964", label: "IQ (+964)" },
  { code: "+965", label: "KW (+965)" },
  { code: "+966", label: "SA (+966)" },
  { code: "+967", label: "YE (+967)" },
  { code: "+968", label: "OM (+968)" },
  { code: "+970", label: "PS (+970)" },
  { code: "+971", label: "AE (+971)" },
  { code: "+972", label: "IL (+972)" },
  { code: "+973", label: "BH (+973)" },
  { code: "+974", label: "QA (+974)" },
  { code: "+975", label: "BT (+975)" },
  { code: "+976", label: "MN (+976)" },
  { code: "+977", label: "NP (+977)" },
  { code: "+992", label: "TJ (+992)" },
  { code: "+993", label: "TM (+993)" },
  { code: "+994", label: "AZ (+994)" },
  { code: "+995", label: "GE (+995)" },
  { code: "+996", label: "KG (+996)" },
  { code: "+998", label: "UZ (+998)" }
];

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
    password: "",
    whatsappCountryCode: "+91",
    whatsappPhoneNumber: ""
  });
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [resetTrigger, setResetTrigger] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!acceptedPolicies) {
      setStatus('Please agree to the policies before creating your account.');
      return;
    }
    if (!form.whatsappPhoneNumber) {
      setStatus('WhatsApp Number is required.');
      return;
    }
    if (!captchaToken) {
      setStatus('Please complete the CAPTCHA challenge.');
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const mergedWhatsappNumber = `${form.whatsappCountryCode}${form.whatsappPhoneNumber}`;
      await api.register({
        name: form.name,
        email: form.email,
        password: form.password,
        whatsappNumber: mergedWhatsappNumber,
        role: "user",
        timezone,
        captchaToken
      });
      router.push("/login");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Registration failed. Verify the details and try again.");
      setCaptchaToken("");
      setResetTrigger((prev) => prev + 1);
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

                <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                  <TextField
                    select
                    label="Code"
                    value={form.whatsappCountryCode}
                    onChange={(e) => setForm({ ...form, whatsappCountryCode: e.target.value })}
                    required
                    slotProps={{
                      select: {
                        renderValue: (value: any) => value
                      }
                    }}
                    sx={{
                      width: '90px',
                      '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <MenuItem key={`${c.code}-${c.label}`} value={c.code}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="WhatsApp Number"
                    type="tel"
                    variant="outlined"
                    value={form.whatsappPhoneNumber}
                    onChange={(e) => setForm({ ...form, whatsappPhoneNumber: e.target.value.replace(/\D/g, '') })}
                    required
                    placeholder="98765 43210"
                    slotProps={{
                      input: {
                        startAdornment: <WhatsAppIcon sx={{ color: '#25D366', mr: 1.5, fontSize: 20 }} />,
                      }
                    }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.02)' } }}
                  />
                </Box>

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

                <TurnstileWidget 
                  onVerify={(token) => setCaptchaToken(token)} 
                  onExpire={() => setCaptchaToken("")} 
                  resetTrigger={resetTrigger}
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
