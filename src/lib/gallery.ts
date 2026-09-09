import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
export type GalleryAlbum = Tables<"gallery_albums">;
export type GalleryPhoto = Tables<"gallery_photos">;
export const photoUrl = (path: string) =>
  supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
export function validatePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Gunakan JPEG, PNG, atau WebP.";
  if (!file.size || file.size > 5 * 1024 * 1024)
    return "Ukuran foto harus antara 1 byte dan 5 MB.";
  return null;
}
export function sortGalleryPhotos(photos: GalleryPhoto[]) {
  return [...photos].sort((a, b) => {
    if (
      a.sort_order != null &&
      b.sort_order != null &&
      a.sort_order !== b.sort_order
    )
      return a.sort_order - b.sort_order;
    return b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id);
  });
}
export async function fetchGallery() {
  const [albums, photos] = await Promise.all([
    supabase.from("gallery_albums").select("*").order("name"),
    fetchAllGalleryPhotos(),
  ]);
  if (albums.error) throw albums.error;
  return { albums: albums.data, photos: sortGalleryPhotos(photos) };
}
async function fetchAllGalleryPhotos() {
  const photos: GalleryPhoto[] = [];
  // Read existing columns so a frontend rollout before the migration does not
  // break the public gallery. Sorting falls back to the previous newest-first order.
  const pageSize = 100;
  for (let start = 0; ; start += pageSize) {
    const result = await supabase
      .from("gallery_photos")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + pageSize - 1);
    if (result.error) throw result.error;
    photos.push(...result.data);
    if (result.data.length < pageSize) return photos;
  }
}
export async function saveGalleryOrder(
  photoIds: string[],
  expectedIds: string[],
) {
  const { error } = await supabase.rpc("save_gallery_order", {
    p_photo_ids: photoIds,
    p_expected_ids: expectedIds,
  });
  if (!error) return;
  if (error.message.includes("GALLERY_CHANGED"))
    throw new Error(
      "Galeri telah berubah. Tutup pengaturan, muat ulang halaman, lalu atur kembali urutannya.",
    );
  if (error.code === "PGRST202" || error.code === "42883")
    throw new Error(
      "Pengaturan urutan belum diaktifkan. Jalankan migrasi galeri terbaru pada Supabase terlebih dahulu.",
    );
  throw new Error("Urutan gagal disimpan. Silakan coba lagi.");
}
export async function uploadPhoto(
  file: File,
  caption: string,
  albumId: string | null,
  path: string,
) {
  const invalid = validatePhoto(file);
  if (invalid) throw new Error(invalid);
  // A retry reuses the same path, so an uncertain response cannot create duplicate photos.
  const existing = await supabase
    .from("gallery_photos")
    .select("id")
    .eq("storage_path", path)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return;
  const upload = await supabase.storage.from("gallery").upload(path, file);
  if (upload.error) {
    const stored = await supabase.storage.from("gallery").exists(path);
    if (stored.error || !stored.data) throw upload.error;
  }
  const saved = await supabase
    .from("gallery_photos")
    .insert({ storage_path: path, caption, album_id: albumId });
  if (saved.error) {
    const verified = await supabase
      .from("gallery_photos")
      .select("id")
      .eq("storage_path", path)
      .maybeSingle();
    if (verified.error)
      throw new Error(
        "Status penyimpanan belum dapat dipastikan. Coba ulang foto ini.",
      );
    if (verified.data) return;
    const cleanup = await supabase.storage.from("gallery").remove([path]);
    if (cleanup.error)
      throw new Error(
        "Gagal menyimpan data dan membersihkan file. Coba ulang foto ini.",
      );
    throw saved.error;
  }
}
export async function deletePhoto(photo: GalleryPhoto) {
  // Keep metadata until storage deletion succeeds, allowing a failed deletion to be retried.
  const file = await supabase.storage
    .from("gallery")
    .remove([photo.storage_path]);
  if (file.error) throw file.error;
  const row = await supabase.from("gallery_photos").delete().eq("id", photo.id);
  if (row.error) throw row.error;
}
