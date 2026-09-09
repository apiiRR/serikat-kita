import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/lib/gallery", () => ({
  photoUrl: (path: string) => path,
  saveGalleryOrder: mocks.save,
}));
import GalleryOrderEditor from "./GalleryOrderEditor";
import { movePhoto } from "@/lib/gallery-order";
import type { GalleryPhoto } from "@/lib/gallery";
const photos = ["Pertama", "Kedua", "Ketiga"].map((caption, index) => ({
  id: String(index + 1),
  caption,
  storage_path: `/${index}.jpg`,
  sort_order: index + 1,
})) as GalleryPhoto[];
const onSaved = vi.fn().mockResolvedValue(undefined);
const names = () =>
  within(screen.getByRole("list", { name: "Urutan foto" }))
    .getAllByRole("img")
    .map((img) => img.getAttribute("alt"));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.save.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("moves a photo from the last to the first position without mutating its source", () => {
  expect(movePhoto(photos, "3", "1").map((photo) => photo.id)).toEqual([
    "3",
    "1",
    "2",
  ]);
  expect(photos.map((photo) => photo.id)).toEqual(["1", "2", "3"]);
  expect(movePhoto(photos, "missing", "1")).toBe(photos);
});
it("saves the entire sequence and its original snapshot only after explicit save", async () => {
  render(
    <GalleryOrderEditor photos={photos} disabled={false} onSaved={onSaved} />,
  );
  fireEvent.click(screen.getByText("Atur urutan foto"));
  expect(screen.getByText("Simpan urutan")).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Mundurkan foto 1"));
  expect(names()).toEqual(["Kedua", "Pertama", "Ketiga"]);
  expect(mocks.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Simpan urutan"));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(["2", "1", "3"], ["1", "2", "3"]),
  );
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
});
it("supports dragging a handle to the final photo with pointer events", () => {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props);
      this.pointerId = props.pointerId || 1;
    }
  }
  vi.stubGlobal("PointerEvent", TestPointerEvent);
  render(
    <GalleryOrderEditor photos={photos} disabled={false} onSaved={onSaved} />,
  );
  fireEvent.click(screen.getByText("Atur urutan foto"));
  const handle = screen.getByLabelText("Geser foto 1");
  handle.setPointerCapture = vi.fn();
  handle.hasPointerCapture = vi.fn(() => true);
  handle.releasePointerCapture = vi.fn();
  const target = screen.getByAltText("Ketiga");
  Object.defineProperty(document, "elementFromPoint", {
    value: vi.fn(() => target),
    configurable: true,
  });
  fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 100 });
  fireEvent.pointerUp(handle, { pointerId: 1, clientX: 100, clientY: 100 });
  expect(names()).toEqual(["Kedua", "Ketiga", "Pertama"]);
  expect(mocks.save).not.toHaveBeenCalled();
});
it("supports keyboard moves and cancelling a draft", () => {
  render(
    <GalleryOrderEditor photos={photos} disabled={false} onSaved={onSaved} />,
  );
  fireEvent.click(screen.getByText("Atur urutan foto"));
  fireEvent.keyDown(screen.getByLabelText("Geser foto 2"), {
    key: "ArrowLeft",
  });
  expect(names()).toEqual(["Kedua", "Pertama", "Ketiga"]);
  fireEvent.click(screen.getByText("Batal"));
  fireEvent.click(screen.getByText("Atur urutan foto"));
  expect(names()).toEqual(["Pertama", "Kedua", "Ketiga"]);
  expect(mocks.save).not.toHaveBeenCalled();
});
it("preserves the draft after a save failure and permits a retry", async () => {
  mocks.save.mockRejectedValueOnce(new Error("Urutan gagal disimpan."));
  render(
    <GalleryOrderEditor photos={photos} disabled={false} onSaved={onSaved} />,
  );
  fireEvent.click(screen.getByText("Atur urutan foto"));
  fireEvent.click(screen.getByLabelText("Majukan foto 3"));
  fireEvent.click(screen.getByText("Simpan urutan"));
  await screen.findByRole("alert");
  expect(names()).toEqual(["Pertama", "Ketiga", "Kedua"]);
  expect(onSaved).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Simpan urutan"));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
});
it("disables reordering for a gallery with fewer than two photos", () => {
  render(
    <GalleryOrderEditor
      photos={[photos[0]]}
      disabled={false}
      onSaved={onSaved}
    />,
  );
  expect(screen.getByText("Atur urutan foto")).toBeDisabled();
});
