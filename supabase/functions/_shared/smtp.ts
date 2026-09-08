import nodemailer from "npm:nodemailer@10.0.0";
import { emailPattern, type MailMessage } from "./document-workflow.ts";

export function createSmtpSender() {
  const host = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(Deno.env.get("SMTP_PORT") || "465");
  const user = Deno.env.get("SMTP_USER") || "";
  const password = (Deno.env.get("SMTP_PASSWORD") || "").replace(/\s/g, "");
  const from = Deno.env.get("SMTP_FROM") || user;
  if (
    host !== "smtp.gmail.com" ||
    port !== 465 ||
    !emailPattern.test(user) ||
    !emailPattern.test(from) ||
    !password
  ) {
    throw Object.assign(new Error("SMTP configuration missing or invalid"), {
      code: "ECONFIG",
    });
  }
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass: password },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    dnsTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
  return {
    async send(message: MailMessage) {
      try {
        const result = await transport.sendMail({
          ...message,
          from: { name: "Serikat Pekerja PT Berdikari", address: from },
        });
        if (!result.accepted?.length)
          throw Object.assign(new Error("Recipient rejected"), {
            code: "EENVELOPE",
          });
      } finally {
        transport.close();
      }
    },
  };
}
