import nodemailer from 'nodemailer';

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/**
 * Sends an email using the SMTP settings in the environment. When SMTP is not
 * configured during local development, the message is printed to the server
 * console instead so the flow can still be tested end to end.
 */
export async function sendMail(message: MailMessage) {
  const transport = getTransporter();

  if (!transport) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP_HOST is not configured; cannot send email in production.');
    }
    console.info(`\n[mail:dev] To: ${message.to}\n[mail:dev] Subject: ${message.subject}\n${message.text}\n`);
    return;
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM ?? 'TUT Labs <no-reply@tut4life.ac.za>',
    ...message,
  });
}
