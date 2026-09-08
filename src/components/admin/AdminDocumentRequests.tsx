import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  decisionLabels,
  effectiveEmailStatus,
  emailLabels,
  invokeDocumentFunction,
  type DownloadRequest,
  type EmailAttempt,
} from "@/lib/document-requests";

function AttemptHistory({ requestId }: { requestId: string }) {
  const [attempts, setAttempts] = useState<EmailAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await supabase
        .from("document_email_attempts")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
        .range(page * 10, page * 10 + 10);
      if (result.error) throw result.error;
      setAttempts((result.data || []).slice(0, 10));
      setMore((result.data || []).length > 10);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [requestId, page]);
  useEffect(() => {
    void load();
  }, [load]);
  if (loading) return <p role="status">Memuat riwayat...</p>;
  if (error)
    return (
      <div role="alert">
        Gagal memuat riwayat.{" "}
        <Button variant="outline" onClick={load}>
          Coba lagi
        </Button>
      </div>
    );
  return (
    <div className="space-y-2 text-sm">
      {!attempts.length && <p>Belum ada percobaan pengiriman.</p>}
      {attempts.map((attempt) => (
        <div key={attempt.id} className="border-t pt-2">
          <p>
            {new Date(attempt.created_at).toLocaleString("id-ID")} —{" "}
            {
              emailLabels[
                attempt.status === "sending" &&
                Date.now() - Date.parse(attempt.created_at) > 600000
                  ? "unknown"
                  : attempt.status
              ]
            }
          </p>
          {attempt.error_code && (
            <p className="text-muted-foreground">Kode: {attempt.error_code}</p>
          )}
          {attempt.message_id && (
            <p className="break-all text-muted-foreground">
              ID email: {attempt.message_id}
            </p>
          )}
        </div>
      ))}
      {(page > 0 || more) && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!more}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  );
}
export default function AdminDocumentRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DownloadRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [history, setHistory] = useState<string | null>(null);
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(false);
      try {
        let query = supabase
          .from("document_download_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
        if (filter !== "all")
          query = query.eq("decision", filter as DownloadRequest["decision"]);
        const result = await query.range(page * 20, page * 20 + 20);
        if (result.error) throw result.error;
        setRequests((result.data || []).slice(0, 20));
        setMore((result.data || []).length > 20);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [filter, page],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (busy) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void load(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [load, busy]);

  async function review(
    request: DownloadRequest,
    action: "approve" | "reject" | "retry",
  ) {
    const unknown = effectiveEmailStatus(request) === "unknown";
    if (
      action === "retry" &&
      unknown &&
      !confirm(
        "Hasil pengiriman sebelumnya belum pasti. Periksa log email Google Workspace terlebih dahulu. Kirim ulang? Pemohon mungkin menerima email dua kali.",
      )
    )
      return;
    if (busy) return;
    setBusy(request.id);
    setHistory(null);
    try {
      const result = await invokeDocumentFunction<{
        decision: string;
        email_status?: DownloadRequest["email_status"];
      }>("review-document-request", {
        request_id: request.id,
        action,
        confirm_unknown: action === "retry" && unknown,
      });
      const message =
        result.decision === "rejected"
          ? "Permintaan ditolak tanpa mengirim email."
          : result.email_status === "sent"
            ? "Permintaan disetujui. Email diterima server pengirim."
            : result.email_status === "unknown"
              ? "Persetujuan tersimpan. Hasil pengiriman belum pasti; periksa riwayat sebelum mengirim ulang."
              : "Persetujuan tersimpan, tetapi email gagal dikirim. Anda dapat mencoba lagi.";
      toast({
        title:
          result.email_status === "failed" || result.email_status === "unknown"
            ? "Periksa pengiriman"
            : "Berhasil",
        description: message,
      });
    } catch (error) {
      toast({
        title: "Proses belum selesai",
        description:
          error instanceof Error
            ? error.message
            : "Muat ulang untuk memeriksa status.",
        variant: "destructive",
      });
    } finally {
      await load(true);
      setBusy(null);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-xl font-semibold">Permintaan Download</h2>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter keputusan"
            className="border rounded-md bg-background p-2"
            disabled={!!busy}
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
              setHistory(null);
            }}
          >
            <option value="all">Semua keputusan</option>
            <option value="pending">Menunggu pemeriksaan</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          <Button
            variant="outline"
            disabled={!!busy || loading}
            onClick={() => void load()}
          >
            Muat ulang
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Periksa nama dan email sebelum menyetujui. Link download dikirim melalui
        email dan berlaku 24 jam.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          Gagal memuat permintaan. Klik Muat ulang untuk mencoba lagi.
        </p>
      )}
      {loading ? (
        <p role="status">Memuat permintaan...</p>
      ) : !error && !requests.length ? (
        <p>Belum ada permintaan pada filter ini.</p>
      ) : (
        requests.map((request) => {
          const status = effectiveEmailStatus(request);
          return (
            <Card key={request.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold break-words">
                      {request.document_name}
                    </h3>
                    <p className="break-words">{request.requester_name}</p>
                    <p className="break-all text-sm text-muted-foreground">
                      {request.requester_email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Diajukan:{" "}
                      {new Date(request.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">
                      {decisionLabels[request.decision]}
                    </p>
                    <p>{emailLabels[status]}</p>
                    {request.link_expires_at && (
                      <p className="text-xs">
                        Link berakhir:{" "}
                        {new Date(request.link_expires_at).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {!request.document_id && request.decision === "pending" && (
                  <p className="text-sm text-destructive">
                    Dokumen telah dihapus; permintaan tidak dapat disetujui.
                  </p>
                )}
                {status === "unknown" && (
                  <p className="text-sm text-muted-foreground">
                    Periksa log email Google Workspace sebelum mencoba ulang
                    untuk menghindari email ganda.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {request.decision === "pending" && (
                    <>
                      <Button
                        disabled={!!busy || error || !request.document_id}
                        onClick={() => void review(request, "approve")}
                      >
                        {busy === request.id
                          ? "Memproses..."
                          : "Setujui & Kirim Email"}
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={!!busy || error}
                        onClick={() => void review(request, "reject")}
                      >
                        Tolak
                      </Button>
                    </>
                  )}
                  {request.decision === "approved" &&
                    (status === "failed" || status === "unknown") && (
                      <Button
                        disabled={!!busy || error}
                        onClick={() => void review(request, "retry")}
                      >
                        {busy === request.id ? "Memproses..." : "Coba Lagi"}
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    disabled={!!busy}
                    onClick={() =>
                      setHistory(history === request.id ? null : request.id)
                    }
                  >
                    {history === request.id ? "Tutup riwayat" : "Riwayat email"}
                  </Button>
                </div>
                {history === request.id && (
                  <AttemptHistory requestId={request.id} />
                )}
              </CardContent>
            </Card>
          );
        })
      )}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={page === 0 || loading || !!busy}
          onClick={() => setPage(page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="text-sm">Halaman {page + 1}</span>
        <Button
          variant="outline"
          disabled={!more || loading || !!busy}
          onClick={() => setPage(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
