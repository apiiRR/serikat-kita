import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), upload: vi.fn() }));
vi.mock("@/lib/organization-logo", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/organization-logo")>();
  return {
    ...actual,
    fetchOrganizationLogo: mocks.fetch,
    uploadOrganizationLogo: mocks.upload,
    logoUrl: (path: string) => `/logos/${path}`,
  };
});
import AdminOrganizationLogo from "./AdminOrganizationLogo";
import OrganizationLogo from "@/components/OrganizationLogo";
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <OrganizationLogo className="w-8 h-8" />
      <AdminOrganizationLogo />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetch.mockResolvedValue(null);
  mocks.upload.mockResolvedValue("new.png");
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);
it("previews an upload then updates all logo instances after saving", async () => {
  setup();
  await waitFor(() =>
    expect(screen.getByLabelText("Pilih logo baru")).toBeEnabled(),
  );
  const file = new File(["image"], "logo.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Pilih logo baru"), {
    target: { files: [file] },
  });
  const preview = await screen.findByAltText("Preview logo baru");
  expect(screen.getByText("Simpan logo")).toBeDisabled();
  fireEvent.load(preview);
  fireEvent.click(screen.getByText("Simpan logo"));
  await screen.findByText("Logo organisasi berhasil diperbarui.");
  expect(mocks.upload).toHaveBeenCalledWith(file, null);
  expect(
    screen.getAllByAltText("Logo Serikat Pekerja PT Berdikari"),
  ).toHaveLength(2);
  expect(screen.queryByAltText("Preview logo baru")).not.toBeInTheDocument();
});
it("rejects unsupported files and does not save unreadable images", async () => {
  setup();
  await waitFor(() =>
    expect(screen.getByLabelText("Pilih logo baru")).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Pilih logo baru"), {
    target: {
      files: [new File(["svg"], "logo.svg", { type: "image/svg+xml" })],
    },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("PNG, JPEG, atau WebP");
  fireEvent.change(screen.getByLabelText("Pilih logo baru"), {
    target: { files: [new File(["bad"], "logo.png", { type: "image/png" })] },
  });
  fireEvent.error(await screen.findByAltText("Preview logo baru"));
  expect(screen.getByText("Simpan logo")).toBeDisabled();
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("keeps the current logo and preview when saving fails", async () => {
  mocks.fetch.mockResolvedValue("old.png");
  mocks.upload.mockRejectedValue(new Error("Gagal menyimpan"));
  setup();
  await waitFor(() =>
    expect(screen.getByLabelText("Pilih logo baru")).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Pilih logo baru"), {
    target: { files: [new File(["image"], "logo.png", { type: "image/png" })] },
  });
  fireEvent.load(await screen.findByAltText("Preview logo baru"));
  fireEvent.click(screen.getByText("Simpan logo"));
  await screen.findByText("Gagal menyimpan");
  expect(
    screen.getAllByAltText("Logo Serikat Pekerja PT Berdikari")[0],
  ).toHaveAttribute("src", "/logos/old.png");
  expect(screen.getByAltText("Preview logo baru")).toBeInTheDocument();
});
it("keeps a fallback icon and gives setup guidance when migration is missing", async () => {
  mocks.fetch.mockRejectedValue(new Error("missing table"));
  setup();
  await screen.findByRole("alert");
  expect(
    screen.queryByAltText("Logo Serikat Pekerja PT Berdikari"),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Pilih logo baru")).toBeDisabled();
});
