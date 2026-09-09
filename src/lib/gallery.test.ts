import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  exists: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  deleteEq: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
    storage: {
      from: () => ({
        upload: mocks.upload,
        exists: mocks.exists,
        remove: mocks.remove,
      }),
    },
  },
}));
import {
  deletePhoto,
  uploadPhoto,
  validatePhoto,
  sortGalleryPhotos,
  saveGalleryOrder,
  type GalleryPhoto,
} from "./gallery";
const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
    insert: mocks.insert,
    delete: () => ({ eq: mocks.deleteEq }),
  });
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.exists.mockResolvedValue({ data: false, error: null });
  for (const fn of [mocks.upload, mocks.remove, mocks.insert, mocks.deleteEq])
    fn.mockResolvedValue({ error: null });
});
describe("gallery storage lifecycle", () => {
  it("accepts JPEG PNG WebP and rejects unsupported, empty and oversized files", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"])
      expect(validatePhoto(new File(["x"], "photo", { type }))).toBeNull();
    expect(
      validatePhoto(new File(["x"], "x.svg", { type: "image/svg+xml" })),
    ).toBeTruthy();
    expect(
      validatePhoto(new File([], "empty.jpg", { type: "image/jpeg" })),
    ).toBeTruthy();
    expect(
      validatePhoto(
        new File([new Uint8Array(5242881)], "big.jpg", { type: "image/jpeg" }),
      ),
    ).toBeTruthy();
  });
  it("saves caption and optional album after upload", async () => {
    await uploadPhoto(file, "Kegiatan", "album-1", "path.jpg");
    expect(mocks.insert).toHaveBeenCalledWith({
      storage_path: "path.jpg",
      caption: "Kegiatan",
      album_id: "album-1",
    });
  });
  it("does not duplicate a successful upload when retried", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "existing" },
      error: null,
    });
    await uploadPhoto(file, "", null, "same.jpg");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not insert metadata on storage failure", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "network" } });
    await expect(uploadPhoto(file, "", null, "x.jpg")).rejects.toBeTruthy();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("cleans storage when metadata fails, and retries a leftover file", async () => {
    mocks.insert.mockResolvedValueOnce({ error: { message: "failed" } });
    await expect(uploadPhoto(file, "", null, "x.jpg")).rejects.toBeTruthy();
    expect(mocks.remove).toHaveBeenCalledWith(["x.jpg"]);
    mocks.upload.mockResolvedValueOnce({ error: { statusCode: "409" } });
    mocks.exists.mockResolvedValueOnce({ data: true, error: null });
    await expect(uploadPhoto(file, "", null, "x.jpg")).resolves.toBeUndefined();
  });
  it("preserves a committed photo when insert response is uncertain", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "timeout" } });
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { id: "saved" } });
    await uploadPhoto(file, "", null, "x.jpg");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("keeps metadata on deletion failure, allowing another attempt", async () => {
    const photo = { id: "id", storage_path: "x.jpg" } as GalleryPhoto;
    mocks.remove.mockResolvedValueOnce({ error: { message: "failed" } });
    await expect(deletePhoto(photo)).rejects.toBeTruthy();
    expect(mocks.deleteEq).not.toHaveBeenCalled();
    await deletePhoto(photo);
    expect(mocks.deleteEq).toHaveBeenCalledWith("id", "id");
  });
});

describe("gallery ordering", () => {
  const photos = [
    { id: "1", sort_order: 2, created_at: "2026-09-09", album_id: "a" },
    { id: "2", sort_order: 3, created_at: "2026-09-08", album_id: null },
    { id: "3", sort_order: 1, created_at: "2026-09-07", album_id: "a" },
  ] as GalleryPhoto[];
  it("uses the saved order for all photos and preserves it when filtering an album", () => {
    const ordered = sortGalleryPhotos(photos);
    expect(ordered.map((photo) => photo.id)).toEqual(["3", "1", "2"]);
    expect(
      ordered
        .filter((photo) => photo.album_id === "a")
        .map((photo) => photo.id),
    ).toEqual(["3", "1"]);
  });
  it("retains newest-first behavior before the migration is installed", () => {
    expect(
      sortGalleryPhotos(
        photos.map((photo) => ({ ...photo, sort_order: undefined })),
      ).map((photo) => photo.id),
    ).toEqual(["1", "2", "3"]);
  });
  it("submits the full order and expected snapshot through the atomic RPC", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    await saveGalleryOrder(["3", "1", "2"], ["1", "2", "3"]);
    expect(mocks.rpc).toHaveBeenCalledWith("save_gallery_order", {
      p_photo_ids: ["3", "1", "2"],
      p_expected_ids: ["1", "2", "3"],
    });
  });
  it("explains a missing migration and rejects stale gallery snapshots", async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { code: "PGRST202", message: "Missing function" },
    });
    await expect(saveGalleryOrder([], [])).rejects.toThrow("migrasi");
    mocks.rpc.mockResolvedValueOnce({ error: { message: "GALLERY_CHANGED" } });
    await expect(saveGalleryOrder([], [])).rejects.toThrow(
      "Galeri telah berubah",
    );
  });
});
