import mongoose from "mongoose";
import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { DeliveryService } from "./services/DeliveryService";
import { startNotificationWorker, stopNotificationWorker } from "./services/NotificationService";

const start = async () => {
  await connectDb();
  try {
    await DeliveryService.verify();
  } catch (error) {
    // Email is optional: its configuration must not block the API or WhatsApp delivery.
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "DELIVERY_ERROR";
    const missing = [!env.smtpHost && "SMTP_HOST", !env.emailFrom && "EMAIL_FROM"].filter(Boolean);
    console.warn(`Email delivery check failed (${code}). ${missing.length ? `Configure ${missing.join(" and ")}.` : "Check SMTP credentials, port, TLS settings and connectivity."} The API will start; email delivery remains unavailable until corrected.`);
    DeliveryService.close();
  }
  const server = app.listen(env.port, () => console.log(`Server running on port ${env.port}`));
  startNotificationWorker();
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const deadline = setTimeout(() => process.exit(1), 45000); deadline.unref();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await stopNotificationWorker();
    DeliveryService.close();
    await mongoose.disconnect();
    clearTimeout(deadline);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
};
start().catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : error instanceof Error ? error.name : "UNKNOWN";
  console.error(`Failed to start server (${code}). Check MONGO_URI, database connectivity and Atlas network access. Delivery configuration is checked after the database connects.`);
  process.exit(1);
});
