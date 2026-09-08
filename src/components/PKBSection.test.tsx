import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc, functions: { invoke: mocks.invoke } },
}));
import PKBSection from "./PKBSection";
const document = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "PKB 2026",
  description: "Dokumen resmi",
  created_at: "2026-09-08T00:00:00Z",
  file_type: "pdf",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: [document], error: null });
  mocks.invoke.mockResolvedValue({ data: { message: "ok" }, error: null });
});
afterEach(cleanup);
it("shows a metadata card without previews or direct file links", async () => {
  const { container } = render(<PKBSection />);
  await screen.findByText("PKB 2026");
  expect(mocks.rpc).toHaveBeenCalledWith("list_document_catalog");
  expect(container.querySelector("iframe")).toBeNull();
  expect(container.querySelector("a")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Download PKB 2026" }),
  ).toBeInTheDocument();
});
it("submits the selected document with a name and normalized email", async () => {
  render(<PKBSection />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Download PKB 2026" }),
  );
  fireEvent.change(screen.getByLabelText("Nama lengkap"), {
    target: { value: "  Rafi  " },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "RAFI@EXAMPLE.COM" },
  });
  fireEvent.click(screen.getByText("Kirim Permintaan"));
  expect(
    await screen.findByText(/Permintaan diterima dan menunggu/),
  ).toBeInTheDocument();
  expect(mocks.invoke).toHaveBeenCalledWith("request-document-download", {
    body: { document_id: document.id, name: "Rafi", email: "rafi@example.com" },
  });
});
it("retains the form after an API failure and allows another attempt", async () => {
  mocks.invoke.mockResolvedValueOnce({ error: new Error("offline") });
  render(<PKBSection />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Download PKB 2026" }),
  );
  fireEvent.change(screen.getByLabelText("Nama lengkap"), {
    target: { value: "Rafi" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "user@example.com" },
  });
  fireEvent.click(screen.getByText("Kirim Permintaan"));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Nama lengkap")).toHaveValue("Rafi");
  fireEvent.click(screen.getByText("Kirim Permintaan"));
  await screen.findByText(/Permintaan diterima dan menunggu/);
  expect(mocks.invoke).toHaveBeenCalledTimes(2);
});
it("retries failed catalog loads", async () => {
  mocks.rpc.mockResolvedValueOnce({ error: new Error("offline") });
  render(<PKBSection />);
  fireEvent.click(await screen.findByText("Coba lagi"));
  await screen.findByText("PKB 2026");
});
