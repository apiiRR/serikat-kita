import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrganizationLogo from "@/components/OrganizationLogo";
import { useOrganizationLogo } from "@/hooks/useOrganizationLogo";
import {
  organizationLogoKey,
  uploadOrganizationLogo,
  validateLogo,
} from "@/lib/organization-logo";
export default function AdminOrganizationLogo() {
  const queryClient = useQueryClient();
  const logo = useOrganizationLogo();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validImage, setValidImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function save() {
    if (!file || saving || !validImage || logo.isError || logo.isPending)
      return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const path = await uploadOrganizationLogo(file, logo.data ?? null);
      queryClient.setQueryData(organizationLogoKey, path);
      setFile(null);
      setValidImage(false);
      setSuccess("Logo organisasi berhasil diperbarui.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menyimpan logo.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Logo Organisasi</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Logo ini tampil pada halaman utama, navbar, footer, dan header admin.
        </p>
      </div>
      {logo.isPending ? (
        <p role="status">Memuat logo...</p>
      ) : logo.isError ? (
        <p role="alert" className="text-destructive">
          Pengaturan logo belum dapat dimuat. Pastikan migrasi logo organisasi
          sudah diterapkan pada Supabase.
        </p>
      ) : null}
      <div className="rounded-lg border p-5 space-y-4">
        <p className="font-medium">Logo saat ini</p>
        <div className="bg-secondary rounded-lg w-32 h-32 p-3 flex items-center justify-center">
          <OrganizationLogo className="w-full h-full" />
        </div>
        <Button
          variant="outline"
          disabled={saving || logo.isFetching}
          onClick={() => {
            setError("");
            void logo.refetch();
          }}
        >
          Muat ulang pengaturan
        </Button>
      </div>
      <div className="space-y-3">
        <Label htmlFor="organization-logo-file">Pilih logo baru</Label>
        <p className="text-sm text-muted-foreground">
          PNG, JPEG, atau WebP, maksimal 2 MB. PNG transparan disarankan. Logo
          ditampilkan utuh tanpa dipotong.
        </p>
        <Input
          id="organization-logo-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={saving || logo.isPending || logo.isError}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = "";
            setError("");
            setSuccess("");
            setValidImage(false);
            setFile(null);
            if (!selected) return;
            const invalid = validateLogo(selected);
            if (invalid) {
              setError(invalid);
              return;
            }
            setFile(selected);
          }}
        />
        {preview && (
          <div className="space-y-2">
            <p className="font-medium">Preview logo baru</p>
            <div className="bg-secondary rounded-lg w-40 h-40 p-3">
              <img
                key={preview}
                src={preview}
                alt="Preview logo baru"
                className="w-full h-full object-contain"
                onLoad={() => setValidImage(true)}
                onError={() => {
                  setValidImage(false);
                  setError(
                    "File tidak dapat dibaca sebagai gambar. Pilih file lain.",
                  );
                }}
              />
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm text-green-700">
            {success}
          </p>
        )}
        <Button
          disabled={
            !file || !validImage || saving || logo.isPending || logo.isError
          }
          onClick={() => void save()}
        >
          {saving ? "Menyimpan..." : "Simpan logo"}
        </Button>
      </div>
    </div>
  );
}
