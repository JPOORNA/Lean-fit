import { User } from "../models/User";
import { AppError } from "../utils/errors";
import { normalizePhone } from "./OtpService";

export const ContactIdentityService = {
  async assertPhoneAvailable(whatsappNumber: string, ownerId?: string) {
    const conflict = await User.exists({
      whatsappNumber: normalizePhone(whatsappNumber),
      ...(ownerId ? { _id: { $ne: ownerId } } : {})
    });
    if (conflict) throw new AppError("This WhatsApp number is already linked to another account. Use its existing email or contact support.", 409, "WHATSAPP_EXISTS");
  }
};
