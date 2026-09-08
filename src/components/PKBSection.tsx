import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  invokeDocumentFunction,
  requestSchema,
  type PublicDocument,
} from "@/lib/document-requests";

export default function PKBSection() {
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<PublicDocument | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase.rpc("list_document_catalog");
      if (error) throw error;
      setDocuments(data || []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function openRequest(doc: PublicDocument) {
    setName("");
    setEmail("");
    setError("");
    setSuccess(false);
    setSelected(doc);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || submitting) return;
    const parsed = requestSchema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await invokeDocumentFunction("request-document-download", {
        document_id: selected.id,
        ...parsed.data,
      });
      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Permintaan gagal dikirim.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="pkb" className="py-20 bg-muted/30 scroll-mt-16">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            Dokumen Resmi
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perjanjian Kerja Bersama
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dokumen Perjanjian Kerja Bersama (PKB) antara Serikat Pekerja dan
            Manajemen PT Berdikari
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {loading ? (
            <p role="status" className="text-center">
              Memuat dokumen...
            </p>
          ) : loadError ? (
            <div role="alert" className="text-center space-y-3">
              <p>Gagal memuat dokumen.</p>
              <Button onClick={load}>Coba lagi</Button>
            </div>
          ) : !documents.length ? (
            <p className="text-center text-muted-foreground">
              Belum ada dokumen tersedia.
            </p>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id} className="shadow-card">
                <CardContent className="p-6 flex flex-wrap items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg break-words">
                      {doc.name}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {doc.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Diupload:{" "}
                      {new Date(doc.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => openRequest(doc)}
                    aria-label={`Download ${doc.name}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !submitting) setSelected(null);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Permintaan Download Dokumen</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>
          {success ? (
            <div className="space-y-4">
              <p role="status">
                Permintaan diterima dan menunggu pemeriksaan admin. Jika
                disetujui, link download akan dikirim ke email Anda dan berlaku
                selama 24 jam.
              </p>
              <Button onClick={() => setSelected(null)}>Selesai</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Isi nama dan email untuk diperiksa admin. Link download dikirim
                setelah permintaan disetujui.
              </p>
              <div className="space-y-2">
                <Label htmlFor="document-request-name">Nama lengkap</Label>
                <Input
                  id="document-request-name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  disabled={submitting}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-request-email">Email</Label>
                <Input
                  id="document-request-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  disabled={submitting}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Mengirim permintaan..." : "Kirim Permintaan"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
