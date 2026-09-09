import type { GalleryPhoto } from "./gallery";

export function movePhoto(
  photos: GalleryPhoto[],
  fromId: string,
  toId: string,
) {
  const from = photos.findIndex((photo) => photo.id === fromId);
  const to = photos.findIndex((photo) => photo.id === toId);
  if (from < 0 || to < 0 || from === to) return photos;
  const next = [...photos];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
