import { notificationEmailHtml } from "../utils/notificationLinks";
import { WhatsAppTemplateService } from "./WhatsAppTemplateService";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

let transport: ReturnType<typeof nodemailer.createTransport> | undefined;
const smtp = () => {
  if (!env.smtpHost || !env.emailFrom) throw new AppError("SMTP is not configured", 503, "DELIVERY_UNAVAILABLE");
  if (!transport) transport = nodemailer.createTransport({
    pool: true, host: env.smtpHost, port: env.smtpPort, secure: env.smtpSecure,
    requireTLS: !env.smtpSecure, maxConnections: 3, maxMessages: 100,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 30000,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true }
  });
  return transport;
};
export const DeliveryService = {
  async verify() { if (env.notificationsEnabled && env.smtpHost) await smtp().verify(); },
  close() { transport?.close(); transport = undefined; },
  async send(channel: "email" | "whatsapp", to: string, subject: string, text: string, key: string, otp?: string, event?: string) {
    if (!env.notificationsEnabled) throw new AppError("Notification delivery is disabled in this environment", 503, "DELIVERY_DISABLED");
    if (!to) throw new AppError("Contact details missing", 400, "CONTACT_MISSING");
    if (channel === "email") {
      const result = await smtp().sendMail({ from: env.emailFrom, to, subject, text, html: notificationEmailHtml(subject, text),
        messageId: `<${key.replace(/[^a-zA-Z0-9.-]/g, "-")}@${env.emailMessageDomain}>` });
      if (!result.accepted?.length) throw new Error("SMTP recipient rejected");
      return;
    }
    if (!env.whatsappToken || !env.whatsappPhoneId) throw new AppError("WhatsApp is not configured", 503, "DELIVERY_UNAVAILABLE");
    const template = await WhatsAppTemplateService.resolve(otp ? "otp" : event ?? "");
    if (!template) throw new AppError("WhatsApp template missing", 503, "TEMPLATE_MISSING");
    const language = otp ? env.whatsappOtpLanguage : env.whatsappLanguage;
    const components: object[] = [{ type: "body", parameters: [{ type: "text", text: otp ?? text }] }];
    if (otp) components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: otp }] });
    const response = await fetch(`https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneId}/messages`, {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.whatsappToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/\D/g, ""), type: "template",
        template: { name: template, language: { code: language }, components } })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { code?: number } } | null;
      const code = body?.error?.code;
      const reason = code === 132001
        ? `Template "${template}" is not available in language "${language}". Check its approved name and language in Meta.`
        : code === 132000 || code === 132012
          ? `Template "${template}" has different parameters from this notification. Check its body and button parameters in Meta.`
          : code === 190
            ? "The WhatsApp access token is invalid or expired. Update WHATSAPP_ACCESS_TOKEN."
            : code === 131030
              ? "The recipient is not allowed for this WhatsApp test sender. Add the recipient in Meta or use a production sender."
              : "Check the WhatsApp sender ID, access permissions, approved template name and language.";
      throw new AppError(`WhatsApp delivery failed (HTTP ${response.status}${code ? `, Meta ${code}` : ""}). ${reason}`, 502, "WHATSAPP_DELIVERY_FAILED");
    }
  }
};
