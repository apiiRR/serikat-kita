import { movePhoto } from "@/lib/gallery-order";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { photoUrl, saveGalleryOrder, type GalleryPhoto } from "@/lib/gallery";

export default function GalleryOrderEditor({
  photos,
  disabled,
  onSaved,
}: {
  photos: GalleryPhoto[];
  disabled: boolean;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GalleryPhoto[]>([]);
  const [baseline, setBaseline] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const drag = useRef<{
    id: string;
    pointerId: number;
    over: string | null;
  } | null>(null);
  const grid = useRef<HTMLOListElement>(null);
  const changed = draft.some((photo, index) => photo.id !== baseline[index]);

  function resetDrag() {
    drag.current = null;
    setDragging(null);
    setOver(null);
  }
  function move(fromId: string, toId: string) {
    setDraft((current) => {
      const next = movePhoto(current, fromId, toId);
      return next;
    });
    setAnnouncement(
      "Posisi foto diubah. Tekan Simpan urutan untuk menerapkan.",
    );
  }
  function targetAt(x: number, y: number) {
    const target = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-order-id]");
    return target && grid.current?.contains(target)
      ? target.dataset.orderId || null
      : null;
  }
  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const target = targetAt(event.clientX, event.clientY);
    drag.current.over = target;
    setOver(target);
    // Keep long galleries usable while dragging from the dedicated handle.
    const container = grid.current;
    if (container) {
      const bounds = container.getBoundingClientRect();
      if (event.clientY < bounds.top + 48) container.scrollTop -= 24;
      else if (event.clientY > bounds.bottom - 48) container.scrollTop += 24;
    }
  }
  async function save() {
    if (saving || !changed) return;
    setSaving(true);
    setError("");
    try {
      await saveGalleryOrder(
        draft.map((photo) => photo.id),
        baseline,
      );
      await onSaved();
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Urutan gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Button
        variant="outline"
        disabled={disabled || photos.length < 2}
        onClick={() => {
          setDraft([...photos]);
          setBaseline(photos.map((photo) => photo.id));
          setError("");
          setAnnouncement("");
          resetDrag();
          setOpen(true);
        }}
      >
        <GripVertical className="w-4 h-4 mr-2" />
        Atur urutan foto
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) {
            resetDrag();
            setOpen(value);
          }
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90dvh] flex flex-col overflow-hidden"
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
            else if (drag.current) {
              event.preventDefault();
              resetDrag();
            }
          }}
          onPointerDownOutside={(event) => {
            if (saving || drag.current) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Atur urutan carousel</DialogTitle>
            <DialogDescription>
              Tarik pegangan foto ke posisi yang diinginkan, atau gunakan tombol
              maju/mundur. Urutan dibaca dari kiri ke kanan, lalu ke baris
              berikutnya, dan berlaku untuk Semua serta setiap album.
            </DialogDescription>
          </DialogHeader>
          <ol
            ref={grid}
            aria-label="Urutan foto"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto min-h-0 p-1"
          >
            {draft.map((photo, index) => (
              <li
                key={photo.id}
                data-order-id={photo.id}
                className={`border rounded-lg p-2 space-y-2 ${dragging === photo.id ? "opacity-50" : ""} ${over === photo.id && over !== dragging ? "ring-2 ring-primary bg-primary/10" : "bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Foto {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={saving}
                    aria-label={`Geser foto ${index + 1}`}
                    aria-describedby="gallery-order-help"
                    className="touch-none select-none cursor-grab active:cursor-grabbing"
                    onPointerDown={(event) => {
                      if (saving || event.button !== 0 || drag.current) return;
                      event.preventDefault();
                      event.currentTarget.focus();
                      drag.current = {
                        id: photo.id,
                        pointerId: event.pointerId,
                        over: photo.id,
                      };
                      setDragging(photo.id);
                      setOver(photo.id);
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={pointerMove}
                    onPointerUp={(event) => {
                      const active = drag.current;
                      if (!active || active.pointerId !== event.pointerId)
                        return;
                      const target = targetAt(event.clientX, event.clientY);
                      resetDrag();
                      if (
                        event.currentTarget.hasPointerCapture(event.pointerId)
                      )
                        event.currentTarget.releasePointerCapture(
                          event.pointerId,
                        );
                      if (target) move(active.id, target);
                    }}
                    onPointerCancel={resetDrag}
                    onLostPointerCapture={resetDrag}
                    onKeyDown={(event) => {
                      if (
                        event.key !== "ArrowLeft" &&
                        event.key !== "ArrowRight"
                      )
                        return;
                      event.preventDefault();
                      const target =
                        draft[index + (event.key === "ArrowLeft" ? -1 : 1)];
                      if (target) move(photo.id, target.id);
                    }}
                  >
                    <GripVertical className="w-4 h-4" />
                  </Button>
                </div>
                <img
                  draggable={false}
                  src={photoUrl(photo.storage_path)}
                  alt={photo.caption || `Foto kegiatan ${index + 1}`}
                  className="w-full aspect-[4/3] object-cover rounded"
                />
                <p className="text-xs truncate">
                  {photo.caption || "Tanpa keterangan"}
                </p>
                <div className="flex justify-between gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={saving || index === 0}
                    aria-label={`Majukan foto ${index + 1}`}
                    onClick={() => move(photo.id, draft[index - 1].id)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={saving || index === draft.length - 1}
                    aria-label={`Mundurkan foto ${index + 1}`}
                    onClick={() => move(photo.id, draft[index + 1].id)}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          <p id="gallery-order-help" className="text-xs text-muted-foreground">
            Di HP, tarik pegangan untuk memindahkan foto. Geser area foto untuk
            menggulir. Keyboard: gunakan panah kiri/kanan pada pegangan.
          </p>
          <p role="status" className="sr-only">
            {announcement}
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              disabled={saving || !changed || !!dragging}
              onClick={() => void save()}
            >
              {saving ? "Menyimpan..." : "Simpan urutan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
