import 'server-only';
import { createTransport, type Transporter } from 'nodemailer';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let transport: Transporter | undefined;

function getTransport() {
  transport ??= createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return transport;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const COPY = {
  verify: {
    subject: 'Verify your Certify email',
    heading: 'Confirm your email address',
    body: 'Click the button below to verify this address and activate your Certify account. Anything you made as a guest will be saved to it.',
    button: 'Verify my email',
  },
} as const;

/** The shared email card: the Certify name, a heading, a paragraph, then the content and a small footer. */
function emailHtml(heading: string, body: string, content: string, footer: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#f6f5f1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1b18">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border:1px solid #e3e0d6;border-radius:16px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;font-family:Georgia,serif">Certify</p>
          <p style="margin:24px 0 8px;font-size:16px;font-weight:600">${heading}</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#6b6860">${body}</p>
          ${content}
          <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#9a968b">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Sends through Gmail SMTP. Without Gmail credentials in development, the
 * message is printed to the server console instead.
 */
async function send(to: string, subject: string, text: string, html: string) {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD)');
    console.info(`\n[dev] ${subject} → ${to}:\n${text}\n`);
    return;
  }
  await getTransport().sendMail({ from: `Certify <${process.env.GMAIL_USER}>`, to, subject, text, html });
}

/** Sends an account verification link. */
export async function sendAuthEmail(to: string, link: string, kind: keyof typeof COPY) {
  const copy = COPY[kind];
  const footer = "This link expires in 30 minutes and works once. If you didn't request it, you can ignore this email.";
  const button = `<a href="${escapeHtml(link)}" style="display:inline-block;background:#3346d3;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px">${copy.button}</a>`;
  await send(to, copy.subject, `${copy.heading}\n\n${copy.body}\n\n${link}\n\n${footer}`, emailHtml(copy.heading, copy.body, button, footer));
}

/** Sends a 6-digit password-reset code. */
export async function sendResetCode(to: string, code: string) {
  const subject = `${code} is your Certify password reset code`;
  const heading = 'Reset your password';
  const body = 'Enter this code on the Certify page where you asked to reset your password.';
  const footer = "The code expires in 30 minutes and works once. If you didn't ask for it, you can ignore this email. Your password hasn't changed.";
  const box = `<p style="margin:0;font-size:32px;font-weight:700;letter-spacing:8px;font-family:Menlo,Consolas,monospace">${code}</p>`;
  await send(to, subject, `${heading}\n\n${body}\n\n${code}\n\n${footer}`, emailHtml(heading, body, box, footer));
}
