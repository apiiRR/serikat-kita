import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));
import { invokeDocumentFunction } from "./document-requests";
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
it("explains an unavailable function even when gateway returns a message instead of error", async () => {
  mocks.invoke.mockResolvedValue({
    error: {
      name: "FunctionsHttpError",
      context: new Response(JSON.stringify({ message: "Function not found" }), {
        status: 404,
      }),
    },
  });
  await expect(
    invokeDocumentFunction("request-document-download", {}),
  ).rejects.toThrow("belum tersedia");
});
it("preserves application validation feedback", async () => {
  mocks.invoke.mockResolvedValue({
    error: {
      name: "FunctionsHttpError",
      context: new Response(
        JSON.stringify({
          error: "Permintaan masih menunggu pemeriksaan admin.",
        }),
        { status: 409 },
      ),
    },
  });
  await expect(
    invokeDocumentFunction("request-document-download", {}),
  ).rejects.toThrow("masih menunggu");
});
it("handles HTML gateway failures without exposing the response", async () => {
  mocks.invoke.mockResolvedValue({
    error: {
      name: "FunctionsHttpError",
      context: new Response("<html>internal proxy details</html>", {
        status: 502,
      }),
    },
  });
  await expect(
    invokeDocumentFunction("request-document-download", {}),
  ).rejects.toThrow("sedang bermasalah");
});
it("reports network/CORS failures without logging the submitted identity", async () => {
  mocks.invoke.mockResolvedValue({ error: { name: "FunctionsFetchError" } });
  await expect(
    invokeDocumentFunction("request-document-download", {
      name: "Private name",
      email: "private@example.com",
    }),
  ).rejects.toThrow("tidak dapat dihubungi");
  expect(console.warn).toHaveBeenCalledWith(
    "Document function request failed",
    {
      function: "request-document-download",
      status: "no-http-response",
      errorType: "FunctionsFetchError",
    },
  );
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
    "private@example.com",
  );
});
