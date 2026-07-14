const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const {
  RESEND_API_KEY,
  RESEND_FROM,
  RESEND_REPLY_TO,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

const DEFAULT_FROM = RESEND_FROM || SMTP_FROM || 'OLYMP <contact@olympdm.com>';

let resend = null;
let transporter = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

if (!resend && SMTP_HOST) {
  transporter = nodemailer.createTransport({
    service: SMTP_HOST.includes('gmail') ? 'gmail' : undefined,
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: false,
    requireTLS: false,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!to) {
    console.log('[mailer] destinataire manquant, email non envoye:', { subject });
    return;
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject,
        text,
        html,
        replyTo: RESEND_REPLY_TO || undefined
      });
      return;
    } catch (err) {
      console.error('[mailer] Resend sendMail error:', err);
      throw err;
    }
  }

  if (!transporter) {
    console.log('[mailer] Resend/SMTP non configure, email non envoye:', { to, subject });
    return;
  }

  try {
    await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text,
      html
    });
  } catch (err) {
    console.error('[mailer] SMTP sendMail error:', err);
    throw err;
  }
}

module.exports = { sendMail };
