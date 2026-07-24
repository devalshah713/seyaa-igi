import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html?: string };

let transport: nodemailer.Transporter | null = null;

function getTransport() {
  if (transport) return transport;
  if (!process.env.SMTP_HOST) return null; // dev fallback: log instead of send
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

export async function sendMail({ to, subject, text, html }: Mail) {
  const t = getTransport();
  const from = process.env.MAIL_FROM || "Seyaa Solitaire <no-reply@seyaasolitaire.com>";
  if (!t) {
    // No SMTP configured — log so local/dev flows still work.
    console.info(`[mail:dev] to=${to} subject="${subject}"\n${text}`);
    return { queued: false, dev: true };
  }
  await t.sendMail({ from, to, subject, text, html: html || `<pre>${text}</pre>` });
  return { queued: true };
}

export const adminEmail = () => process.env.ADMIN_EMAIL || "admin@seyaasolitaire.com";
