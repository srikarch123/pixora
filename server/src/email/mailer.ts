import nodemailer from "nodemailer";

const makeTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

export const sendVerificationEmail = async (to: string, name: string, token: string): Promise<void> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured — skipping verification email.");
    return;
  }
  const serverUrl = process.env.SERVER_URL ?? "http://localhost:3000";
  const link = `${serverUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await makeTransport().sendMail({
    from: process.env.SMTP_FROM ?? `"Pixora" <noreply@pixora.app>`,
    to,
    subject: "Verify your Pixora account",
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px 16px;background:#0b0f11;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
    <tr><td style="padding-bottom:24px;">
      <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
        <rect width="36" height="36" rx="10" fill="#4afa7c"/>
        <path d="M9 27 L18 9 L27 27 Z" fill="#050d08"/>
      </svg>
    </td></tr>
    <tr><td>
      <h1 style="color:#dff0e8;font-size:22px;font-weight:700;margin:0 0 8px;">Hi ${name}, confirm your email</h1>
      <p style="color:#6b8a78;font-size:15px;line-height:1.6;margin:0 0 28px;">
        Click the button below to verify your email address and activate your Pixora account.
      </p>
      <a href="${link}" style="display:inline-block;background:#4afa7c;color:#050d08;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">
        Verify email address
      </a>
      <p style="color:#3a5246;font-size:13px;margin:28px 0 0;line-height:1.5;">
        This link expires in 24 hours. If you didn't sign up for Pixora, you can safely ignore this email.
      </p>
    </td></tr>
  </table>
</body>
</html>`
  });
};
