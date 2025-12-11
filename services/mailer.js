const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = 'no-reply@olymp.local'
} = process.env;

let transporter = null;

if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: false,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('[mailer] SMTP non configuré, email non envoyé:', { to, subject });
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendMail };
