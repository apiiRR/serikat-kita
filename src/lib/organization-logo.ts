import { supabase } from "@/integrations/supabase/client";
export const organizationLogoKey = ["organization-logo"] as const;
const bucket = "organization-logos";
export function validateLogo(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    return "Gunakan file PNG, JPEG, atau WebP.";
  if (!file.size || file.size > 2 * 1024 * 1024)
    return "Ukuran logo harus antara 1 byte dan 2 MB.";
  return null;
}
export const logoUrl = (path: string) =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
export async function fetchOrganizationLogo() {
  const { data, error } = await supabase
    .from("organization_branding")
    .select("logo_path")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data.logo_path;
}
export async function uploadOrganizationLogo(
  file: File,
  expectedPath: string | null,
) {
  const invalid = validateLogo(file);
  if (invalid) throw new Error(invalid);
  const extension = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  }[file.type];
  const path = `${crypto.randomUUID()}.${extension}`;
  const uploaded = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });
  if (uploaded.error)
    throw new Error("Gagal mengunggah logo. Silakan coba lagi.");
  const saved = await supabase.rpc("set_organization_logo", {
    p_path: path,
    p_expected_path: expectedPath,
  });
  if (saved.error) {
    // A timeout can occur after the update commits. Verify before cleaning up.
    let current: string | null;
    try {
      current = await fetchOrganizationLogo();
    } catch {
      throw new Error(
        "Status penyimpanan belum pasti. Muat ulang pengaturan sebelum mencoba lagi.",
      );
    }
    if (current !== path) {
      await supabase.storage.from(bucket).remove([path]);
      if (saved.error.message.includes("LOGO_CHANGED"))
        throw new Error(
          "Logo telah diubah admin lain. Muat ulang pengaturan lalu coba lagi.",
        );
      throw new Error(
        "Gagal menyimpan logo. Pastikan migrasi logo organisasi sudah diterapkan.",
      );
    }
  }
  // Storage policy also prevents deletion of the currently selected logo.
  if (expectedPath)
    await supabase.storage
      .from(bucket)
      .remove([expectedPath])
      .catch(() => undefined);
  return path;
}
