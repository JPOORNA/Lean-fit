import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const required = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

export const env = {
  notificationsEnabled: process.env.NOTIFICATIONS_ENABLED === "true",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  emailMessageDomain: process.env.EMAIL_MESSAGE_DOMAIN ?? "lean-fit.in",
  emailFrom: process.env.EMAIL_FROM ?? "",
  whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? "v23.0",
  whatsappLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US",
  whatsappOtpLanguage: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE ?? "en_US",
  localUploads: process.env.LOCAL_UPLOADS === "true",
  localUploadDir: path.resolve(__dirname, "../../../.local-uploads"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGO_URI"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  cookieSecure: (process.env.COOKIE_SECURE ?? "false") === "true",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  razorpayKeyId: required("RAZORPAY_KEY_ID", ""),
  razorpayKeySecret: required("RAZORPAY_KEY_SECRET", ""),
  adminBootstrapKey: process.env.ADMIN_BOOTSTRAP_KEY ?? "",
  baseUrl: process.env.BASE_URL ?? "http://localhost:4000",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3000",
  appointmentFeePaise: Number(process.env.APPOINTMENT_FEE_PAISE ?? 50000),
  jitsiBaseUrl: process.env.JITSI_BASE_URL ?? "https://jitsi.riot.im",
  r2Endpoint: process.env.R2_ENDPOINT ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2BaseUrl: process.env.R2_BASE_URL ?? "",
  turnstileSecretKey: process.env.CF_TURNSTILE_SECRET_KEY ?? "0x4AAAAAADZx1zgNyLMqeKP-Sf4vgWBCtxs"
};
