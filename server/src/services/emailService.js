import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport(
  process.env.SMTP_URL
    ? process.env.SMTP_URL
    : {
        jsonTransport: true,
      }
);

export async function sendFulfilmentEmail({ to, subject, html, text }) {
  if (!to) {
    throw new Error('Recipient required');
  }
  await transport.sendMail({
    from: process.env.MAIL_FROM || 'Builtattic <noreply@builtattic.com>',
    to,
    subject,
    text,
    html,
  });
}

