export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
export function preflight(req: Request) {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return json({ error: "Metode tidak didukung." }, 405);
  return null;
}
export async function readInput(
  req: Request,
): Promise<Record<string, unknown>> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("INVALID_INPUT");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      throw new Error("INVALID_INPUT");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data;
  } catch {
    throw new Error("INVALID_INPUT");
  }
}
const errors: Record<string, [number, string]> = {
  INVALID_INPUT: [
    400,
    "Periksa kembali nama, email, dan dokumen yang dipilih.",
  ],
  DOCUMENT_NOT_FOUND: [404, "Dokumen sudah tidak tersedia."],
  REQUEST_NOT_FOUND: [404, "Permintaan tidak ditemukan."],
  REQUEST_PENDING: [
    409,
    "Permintaan untuk email dan dokumen ini masih menunggu pemeriksaan admin.",
  ],
  RATE_LIMITED: [
    429,
    "Maksimal 3 permintaan per email dalam satu jam. Silakan coba lagi nanti.",
  ],
  UNAUTHORIZED: [401, "Sesi tidak valid. Silakan login sebagai admin."],
  FORBIDDEN: [403, "Akses admin diperlukan."],
  INVALID_TRANSITION: [
    409,
    "Permintaan sudah diproses atau email sedang dikirim. Muat ulang daftar.",
  ],
  CONFIRM_UNKNOWN_REQUIRED: [
    409,
    "Konfirmasi pengiriman ulang diperlukan karena hasil pengiriman sebelumnya belum pasti.",
  ],
  INVALID_ACTION: [400, "Tindakan tidak valid."],
};
export function errorResponse(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  const match = errors[message];
  return json(
    {
      error:
        match?.[1] ||
        "Proses gagal. Muat ulang untuk memeriksa status sebelum mencoba lagi.",
    },
    match?.[0] || 500,
  );
}
