import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AdminWebsiteStats from "./AdminWebsiteStats";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
const data = { total: 1234, today: 12, last7: 123, last30: 456, first_view_at: null, updated_at: "2026-09-10T03:00:00Z" };
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AdminWebsiteStats /></QueryClientProvider>);
}
beforeEach(() => rpc.mockReset());
afterEach(cleanup);
it("shows loading and formatted server totals", async () => {
  rpc.mockResolvedValue({ data, error: null });
  mount();
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(await screen.findByText("1.234")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("123")).toBeInTheDocument();
  expect(screen.getByText("456")).toBeInTheDocument();
});
it("shows an error instead of a false zero, then allows retry", async () => {
  rpc.mockResolvedValueOnce({ data: null, error: { message: "missing migration" } }).mockResolvedValue({ data: { ...data, total: 0, today: 0, last7: 0, last30: 0 }, error: null });
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent("Gagal memuat statistik");
  fireEvent.click(screen.getByText("Coba lagi"));
  expect(await screen.findByText("Belum ada tayangan beranda yang tercatat.")).toBeInTheDocument();
});
