import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  single: vi.fn(),
  upload: vi.fn(),
  rpc: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }),
    rpc: mocks.rpc,
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  },
}));
import { uploadOrganizationLogo, validateLogo } from "./organization-logo";
const file = new File(["image"], "logo.png", { type: "image/png" });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
});
it("validates file type and 2 MB limit", () => {
  expect(validateLogo(file)).toBeNull();
  expect(
    validateLogo(new File([], "empty.png", { type: "image/png" })),
  ).toBeTruthy();
  expect(
    validateLogo(
      new File([new Uint8Array(2097153)], "big.png", { type: "image/png" }),
    ),
  ).toBeTruthy();
  expect(
    validateLogo(new File(["svg"], "logo.svg", { type: "image/svg+xml" })),
  ).toBeTruthy();
});
it("replaces the logo via admin RPC before cleaning the old file", async () => {
  const path = await uploadOrganizationLogo(file, "old.png");
  expect(mocks.rpc).toHaveBeenCalledWith("set_organization_logo", {
    p_path: path,
    p_expected_path: "old.png",
  });
  expect(mocks.remove).toHaveBeenCalledWith(["old.png"]);
  expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.remove.mock.invocationCallOrder[0],
  );
});
it("preserves the active file after a metadata failure", async () => {
  mocks.rpc.mockResolvedValue({ error: { message: "LOGO_CHANGED" } });
  mocks.single.mockResolvedValue({
    data: { logo_path: "current.png" },
    error: null,
  });
  await expect(uploadOrganizationLogo(file, "old.png")).rejects.toThrow(
    "admin lain",
  );
  expect(mocks.remove).not.toHaveBeenCalledWith(["old.png"]);
  expect(mocks.remove).not.toHaveBeenCalledWith(["current.png"]);
});
it("treats an uncertain response as success if the new logo was saved", async () => {
  mocks.rpc.mockImplementation(async (_, args) => {
    mocks.single.mockResolvedValue({
      data: { logo_path: args.p_path },
      error: null,
    });
    return { error: { message: "timeout" } };
  });
  await expect(uploadOrganizationLogo(file, null)).resolves.toMatch(/\.png$/);
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("does not change metadata when upload fails", async () => {
  mocks.upload.mockResolvedValue({ error: new Error("offline") });
  await expect(uploadOrganizationLogo(file, "old.png")).rejects.toThrow(
    "mengunggah",
  );
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("keeps a successful replacement when old-file cleanup fails", async () => {
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.remove.mockRejectedValue(new Error("offline"));
  await expect(uploadOrganizationLogo(file, "old.png")).resolves.toMatch(
    /\.png$/,
  );
});
