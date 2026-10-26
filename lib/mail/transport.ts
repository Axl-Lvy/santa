import nodemailer, { type Transporter } from "nodemailer";

import { getConfig } from "../config";

export type Mail = { to: string; subject: string; text: string; html: string };

const holder = globalThis as unknown as { __santaOutbox?: Mail[]; __santaTransport?: Transporter };

/** Mails captured instead of sent when no SMTP relay is configured (development). */
export function devOutbox(): Mail[] {
  holder.__santaOutbox ??= [];
  return holder.__santaOutbox;
}

/** Sends through the Brevo relay, or into the dev outbox without SMTP config. */
export async function sendMail(mail: Mail): Promise<void> {
  const config = getConfig();
  if (!config.smtp) {
    devOutbox().push(mail);
    return;
  }
  holder.__santaTransport ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    requireTLS: true,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });
  await holder.__santaTransport.sendMail({ from: config.mailFrom, ...mail });
}
