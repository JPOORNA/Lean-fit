import { DoctorSettings, whatsappTemplateKeys, WhatsAppTemplateNames } from "../models/DoctorSettings";

const environmentKeys: Record<keyof WhatsAppTemplateNames, string> = {
  otp: "WHATSAPP_OTP_TEMPLATE",
  bookingConfirmation: "WHATSAPP_TEMPLATE_BOOKINGCONFIRMATION",
  bookingReminder: "WHATSAPP_TEMPLATE_BOOKINGREMINDER",
  subscriptionExpiry: "WHATSAPP_TEMPLATE_SUBSCRIPTIONEXPIRY",
  mealUpload: "WHATSAPP_TEMPLATE_MEALUPLOAD"
};

export const WhatsAppTemplateService = {
  async getConfig() {
    const settings = await DoctorSettings.findOne().select("whatsappTemplates").lean();
    const templates = {} as WhatsAppTemplateNames;
    const defaults = {} as WhatsAppTemplateNames;
    for (const key of whatsappTemplateKeys) {
      templates[key] = settings?.whatsappTemplates?.[key] ?? "";
      defaults[key] = process.env[environmentKeys[key]]?.trim() ?? "";
    }
    return { templates, defaults };
  },
  async resolve(key: string) {
    if (!whatsappTemplateKeys.includes(key as keyof WhatsAppTemplateNames)) return undefined;
    const { templates, defaults } = await this.getConfig();
    return templates[key as keyof WhatsAppTemplateNames] || defaults[key as keyof WhatsAppTemplateNames] || undefined;
  }
};
