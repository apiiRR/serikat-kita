import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AdminDocumentRequests from "./AdminDocumentRequests";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  name: string;
  description: string | null;
  storage_path: string;
  file_type: string;
  created_at: string;
}

const AdminDocuments = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat dokumen",
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setSelectedFile(null);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(null);
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Error",
          description: "Hanya file PDF yang diperbolehkan",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.replace(".pdf", "") });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama dokumen harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!editingId && !selectedFile) {
      toast({
        title: "Error",
        description: "Pilih file PDF untuk diupload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let storagePath = "";

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        storagePath = fileName;
      }

      if (editingId) {
        const updateData: {
          name: string;
          description: string;
          storage_path?: string;
        } = {
          name: formData.name,
          description: formData.description,
        };

        if (storagePath) {
          updateData.storage_path = storagePath;
        }

        const { error } = await supabase
          .from("documents")
          .update(updateData)
          .eq("id", editingId)
          .select("id")
          .single();

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Dokumen berhasil diperbarui",
        });
      } else {
        const { error } = await supabase.from("documents").insert({
          name: formData.name,
          description: formData.description,
          storage_path: storagePath,
          file_type: "pdf",
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Dokumen berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan dokumen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (doc: Document) => {
    setFormData({
      name: doc.name,
      description: doc.description || "",
    });
    setEditingId(doc.id);
    setIsDialogOpen(true);
  };

  const viewDocument = async (doc: Document) => {
    const popup = window.open("", "_blank");
    if (popup) popup.opener = null;
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 300);
      if (error) throw error;
      if (popup) popup.location.href = data.signedUrl;
      else
        toast({
          title: "Popup diblokir",
          description: "Izinkan popup untuk melihat dokumen.",
        });
    } catch {
      popup?.close();
      toast({
        title: "Gagal",
        description: "Dokumen tidak dapat dibuka. Coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Hapus dokumen dari daftar? Link yang sudah dikirim tetap berlaku sampai kedaluwarsa.",
      )
    )
      return;

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus dokumen",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Dokumen berhasil dihapus",
      });
      fetchDocuments();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat...</div>;
  }

  return (
    <Tabs defaultValue="files">
      <TabsList className="mb-6">
        <TabsTrigger value="files">Kelola Dokumen</TabsTrigger>
        <TabsTrigger value="requests">Permintaan Download</TabsTrigger>
      </TabsList>
      <TabsContent value="requests">
        <AdminDocumentRequests />
      </TabsContent>
      <TabsContent value="files">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dokumen PKB</h2>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Dokumen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Dokumen" : "Upload Dokumen Baru"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Dokumen</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: PKB 2024-2026"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Deskripsi dokumen (opsional)"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    File PDF{" "}
                    {editingId && "(Kosongkan jika tidak ingin mengganti)"}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      File: {selectedFile.name}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Mengupload...
                    </>
                  ) : editingId ? (
                    "Simpan Perubahan"
                  ) : (
                    "Upload Dokumen"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada dokumen. Klik tombol "Upload Dokumen" untuk memulai.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{doc.name}</h4>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(doc.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void viewDocument(doc)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(doc)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AdminDocuments;
