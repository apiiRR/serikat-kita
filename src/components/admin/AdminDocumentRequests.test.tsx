import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  range: vi.fn(),
  invoke: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@/integrations/supabase/client", () => {
  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    range: mocks.range,
  };
  return {
    supabase: { from: () => query, functions: { invoke: mocks.invoke } },
  };
});
import AdminDocumentRequests from "./AdminDocumentRequests";
import {
  effectiveEmailStatus,
  type DownloadRequest,
} from "@/lib/document-requests";
const request = {
  id: "request-1",
  document_id: "doc-1",
  document_name: "PKB 2026",
  requester_name: "Rafi",
  requester_email: "rafi@example.com",
  decision: "pending",
  email_status: "not_sent",
  created_at: "2026-09-08T00:00:00Z",
} as DownloadRequest;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.range.mockResolvedValue({ data: [request], error: null });
  mocks.invoke.mockResolvedValue({
    data: { decision: "approved", email_status: "sent" },
    error: null,
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("sends an approval action for the selected request", async () => {
  render(<AdminDocumentRequests />);
  fireEvent.click(await screen.findByText("Setujui & Kirim Email"));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("review-document-request", {
      body: {
        request_id: "request-1",
        action: "approve",
        confirm_unknown: false,
      },
    }),
  );
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("diterima server"),
      }),
    ),
  );
});
it("rejects a request and reports that no email is sent", async () => {
  mocks.invoke.mockResolvedValue({
    data: { decision: "rejected" },
    error: null,
  });
  render(<AdminDocumentRequests />);
  fireEvent.click(await screen.findByText("Tolak"));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("review-document-request", {
      body: {
        request_id: "request-1",
        action: "reject",
        confirm_unknown: false,
      },
    }),
  );
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("tanpa mengirim email"),
      }),
    ),
  );
});
it("requires explicit confirmation before retrying an unknown SMTP outcome", async () => {
  mocks.range.mockResolvedValue({
    data: [{ ...request, decision: "approved", email_status: "unknown" }],
    error: null,
  });
  vi.mocked(window.confirm)
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  render(<AdminDocumentRequests />);
  fireEvent.click(await screen.findByText("Coba Lagi"));
  expect(mocks.invoke).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Coba Lagi"));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("review-document-request", {
      body: { request_id: "request-1", action: "retry", confirm_unknown: true },
    }),
  );
});
it("allows failed email retries without another approval or uncertainty confirmation", async () => {
  mocks.range.mockResolvedValue({
    data: [{ ...request, decision: "approved", email_status: "failed" }],
    error: null,
  });
  render(<AdminDocumentRequests />);
  fireEvent.click(await screen.findByText("Coba Lagi"));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("review-document-request", {
      body: {
        request_id: "request-1",
        action: "retry",
        confirm_unknown: false,
      },
    }),
  );
  expect(window.confirm).not.toHaveBeenCalled();
});
it("blocks approval of a removed document", async () => {
  mocks.range.mockResolvedValue({
    data: [{ ...request, document_id: null }],
    error: null,
  });
  render(<AdminDocumentRequests />);
  expect(await screen.findByText("Setujui & Kirim Email")).toBeDisabled();
  expect(screen.getByText("Tolak")).toBeEnabled();
});
it("treats expired sending leases as unknown rather than safe to retry", () => {
  expect(
    effectiveEmailStatus(
      {
        ...request,
        email_status: "sending",
        sending_started_at: "2026-09-08T00:00:00Z",
      },
      Date.parse("2026-09-08T00:11:00Z"),
    ),
  ).toBe("unknown");
  expect(
    effectiveEmailStatus(
      {
        ...request,
        email_status: "sending",
        sending_started_at: "2026-09-08T00:00:00Z",
      },
      Date.parse("2026-09-08T00:05:00Z"),
    ),
  ).toBe("sending");
});
