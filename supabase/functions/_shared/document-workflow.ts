export type EmailStatus = "sent" | "failed" | "unknown";
export interface EmailJob {
  request_id: string;
  attempt_id: string;
  storage_path: string;
  document_name: string;
  requester_name: string;
  requester_email: string;
}
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
}
export interface DeliveryDependencies {
  createLink: (path: string) => Promise<string>;
  prepare: (expiresAt: string, messageId: string) => Promise<void>;
  send: (message: MailMessage) => Promise<void>;
  finish: (
    status: EmailStatus,
    expiresAt: string | null,
    error: string | null,
    messageId: string,
  ) => Promise<void>;
  senderDomain: string;
  now?: () => number;
}
export const emailPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateRequest(input: Record<string, unknown>) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const documentId =
    typeof input.document_id === "string" ? input.document_id : "";
  if (
    !name ||
    name.length > 120 ||
    Array.from(name).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    ) ||
    email.length > 254 ||
    !emailPattern.test(email) ||
    !uuidPattern.test(documentId)
  ) {
    throw new Error("INVALID_INPUT");
  }
  return { name, email, documentId };
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function classifySmtpError(error: unknown): EmailStatus {
  if (typeof error !== "object" || !error) return "unknown";
  const details = error as { responseCode?: number; code?: string };
  // A negative SMTP reply or failure before message submission is definitive.
  // Lost responses / timeouts may happen after SMTP accepted DATA: never blind-retry.
  if (
    (details.responseCode && details.responseCode >= 400) ||
    ["EAUTH", "EENVELOPE", "ECONFIG", "EDNS", "ECONNECTION"].includes(
      details.code || "",
    )
  )
    return "failed";
  return "unknown";
}
export async function deliverDocument(
  job: EmailJob,
  deps: DeliveryDependencies,
) {
  const messageId = `<document-${job.attempt_id}@${deps.senderDomain}>`;
  let expiresAt: string | null = null;
  let smtpStarted = false;
  let status: EmailStatus = "failed";
  let errorCode: string | null = null;
  try {
    const issuedAt = (deps.now || Date.now)();
    const url = await deps.createLink(job.storage_path);
    expiresAt = new Date(issuedAt + 24 * 60 * 60 * 1000).toISOString();
    await deps.prepare(expiresAt, messageId);
    const expiry = new Date(expiresAt).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });
    const text = `Halo ${job.requester_name},\n\nPermintaan Anda untuk dokumen ${job.document_name} telah disetujui.\n\nDownload dokumen: ${url}\n\nLink berlaku 24 jam, hingga ${expiry} WIB. Jika sudah kedaluwarsa, ajukan permintaan baru melalui website.\n\nSerikat Pekerja PT Berdikari`;
    smtpStarted = true;
    await deps.send({
      to: job.requester_email,
      subject: `Permintaan Dokumen Disetujui — ${job.document_name.replace(/[\r\n]/g, " ").slice(0, 150)}`,
      messageId,
      text,
      html: `<p>Halo ${escapeHtml(job.requester_name)},</p><p>Permintaan Anda untuk dokumen <strong>${escapeHtml(job.document_name)}</strong> telah disetujui.</p><p><a href="${escapeHtml(url)}">Download dokumen</a></p><p>Link berlaku 24 jam, hingga ${escapeHtml(expiry)} WIB. Jika sudah kedaluwarsa, ajukan permintaan baru melalui website.</p><p>Serikat Pekerja PT Berdikari</p>`,
    });
    status = "sent";
  } catch (error) {
    status = smtpStarted ? classifySmtpError(error) : "failed";
    errorCode = smtpStarted
      ? status === "unknown"
        ? "SMTP_RESULT_UNKNOWN"
        : "SMTP_REJECTED"
      : "LINK_OR_CONFIG_FAILED";
  }
  // If persisting the result fails, leave the lease in 'sending'. The UI will treat
  // it as unknown after ten minutes; it must not automatically send another email.
  await deps.finish(status, expiresAt, errorCode, messageId);
  return status;
}
