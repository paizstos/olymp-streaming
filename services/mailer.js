const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

const DEFAULT_FROM = SMTP_FROM || 'OLYMP <contact@olympdm.com>';

let transporter = null;

if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    service: SMTP_HOST.includes('gmail') ? 'gmail' : undefined,
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: false, // STARTTLS sur 587
    requireTLS: false,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('[mailer] SMTP non configuré, email non envoyé:', { to, subject });
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
    console.error('[mailer] sendMail error:', err);
    throw err;
  }
}

module.exports = { sendMail };
