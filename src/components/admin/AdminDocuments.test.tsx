import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  order: vi.fn(),
  signed: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("./AdminDocumentRequests", () => ({
  default: () => <div>Daftar permintaan</div>,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ order: mocks.order }) }),
    storage: { from: () => ({ createSignedUrl: mocks.signed }) },
  },
}));
import AdminDocuments from "./AdminDocuments";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.order.mockResolvedValue({
    data: [
      {
        id: "1",
        name: "PKB privat",
        storage_path: "private-file.pdf",
        created_at: "2026-09-08",
        file_type: "pdf",
      },
    ],
    error: null,
  });
  mocks.signed.mockResolvedValue({
    data: { signedUrl: "https://example.com/signed-private" },
    error: null,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("opens a short-lived signed URL for authenticated admin viewing", async () => {
  const popup = { opener: {}, location: { href: "" }, close: vi.fn() };
  vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  render(<AdminDocuments />);
  fireEvent.click(await screen.findByText("Lihat"));
  await waitFor(() =>
    expect(mocks.signed).toHaveBeenCalledWith("private-file.pdf", 300),
  );
  expect(popup.opener).toBeNull();
  expect(popup.location.href).toBe("https://example.com/signed-private");
});
it("closes the blank window and explains a failed private-file lookup", async () => {
  const popup = { opener: {}, location: { href: "" }, close: vi.fn() };
  vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  mocks.signed.mockResolvedValue({ error: new Error("missing") });
  render(<AdminDocuments />);
  fireEvent.click(await screen.findByText("Lihat"));
  await waitFor(() => expect(popup.close).toHaveBeenCalled());
  expect(mocks.toast).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Gagal" }),
  );
});
