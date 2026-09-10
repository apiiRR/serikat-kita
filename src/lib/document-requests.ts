import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type PublicDocument =
  Database["public"]["Functions"]["list_document_catalog"]["Returns"][number];
export type DownloadRequest = Tables<"document_download_requests">;
export type EmailAttempt = Tables<"document_email_attempts">;
export const requestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama harus diisi.")
    .max(120, "Nama maksimal 120 karakter.")
    .refine(
      (value) =>
        !Array.from(value).some(
          (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
        ),
      "Nama tidak valid.",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email terlalu panjang.")
    .email("Alamat email tidak valid."),
});
export async function invokeDocumentFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message =
      "Layanan permintaan dokumen tidak dapat dihubungi. Silakan coba lagi nanti atau hubungi admin.";
    let status: number | undefined;
    if ("context" in error && error.context instanceof Response) {
      status = error.context.status;
      if (status === 404)
        message =
          "Layanan permintaan dokumen belum tersedia. Silakan hubungi admin.";
      else if (status === 401 || status === 403)
        message = "Akses ke layanan dokumen ditolak. Silakan hubungi admin.";
      else if (status === 429)
        message = "Terlalu banyak permintaan. Silakan coba lagi nanti.";
      else if (status >= 500)
        message =
          "Layanan dokumen sedang bermasalah. Silakan coba lagi nanti atau hubungi admin.";
      try {
        const response = await error.context.clone().json();
        // The application functions return a user-facing `error` string. Gateway
        // messages may contain internal details, so use the HTTP fallback for them.
        if (typeof response.error === "string") message = response.error;
      } catch {
        /* Gateway HTML and empty responses use the safe HTTP fallback. */
      }
    }
    // No form contents, credentials, response body, or JWTs in diagnostics.
    console.warn("Document function request failed", {
      function: name,
      status: status ?? "no-http-response",
      errorType: error.name,
    });
    throw new Error(message);
  }
  return data as T;
}
export function effectiveEmailStatus(
  request: DownloadRequest,
  now = Date.now(),
) {
  if (
    request.email_status === "sending" &&
    request.sending_started_at &&
    now - Date.parse(request.sending_started_at) > 10 * 60 * 1000
  )
    return "unknown";
  return request.email_status;
}
export const decisionLabels = {
  pending: "Menunggu pemeriksaan",
  approved: "Disetujui",
  rejected: "Ditolak",
};
export const emailLabels = {
  not_sent: "Belum dikirim",
  sending: "Mengirim",
  sent: "Diterima server email",
  failed: "Gagal dikirim",
  unknown: "Hasil pengiriman belum pasti",
};
