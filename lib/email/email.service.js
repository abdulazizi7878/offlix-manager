import { Resend } from "resend";
import { verificationOtpTemplate } from "./templates/verification-otp";

const resend = new Resend(process.env.RESEND_API_KEY);

const EmailService = {
  async sendVerificationOtp({
    to,
    name,
    otp,
    expiresInMinutes,
  }) {
    const template = verificationOtpTemplate({
      name,
      otp,
      expiresInMinutes,
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });
  },
};

export default EmailService;