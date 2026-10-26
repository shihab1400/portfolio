import nodemailer, { type Transporter } from 'nodemailer';
import { SMTP_PASS, SMTP_USER } from 'astro:env/server';

/** True when the Gmail SMTP credentials are present in the server environment. */
export const isMailerConfigured = () => Boolean(SMTP_USER && SMTP_PASS);

let transporter: Transporter | undefined;

/** Gmail SMTP transporter, created once per server instance and reused across requests. */
export function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Fail fast instead of hanging the serverless function if Gmail is unreachable.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}
