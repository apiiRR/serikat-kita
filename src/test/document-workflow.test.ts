import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifySmtpError,
  deliverDocument,
  validateRequest,
  type DeliveryDependencies,
  type EmailJob,
} from "../../supabase/functions/_shared/document-workflow";
import {
  errorResponse,
  preflight,
  readInput,
} from "../../supabase/functions/_shared/http";

const job: EmailJob = {
  request_id: "00000000-0000-4000-8000-000000000001",
  attempt_id: "00000000-0000-4000-8000-000000000002",
  storage_path: "private.pdf",
  document_name: "PKB <2026>",
  requester_name: "<script>alert(1)</script>",
  requester_email: "user@example.com",
};
let deps: DeliveryDependencies;
beforeEach(() => {
  deps = {
    createLink: vi
      .fn()
      .mockResolvedValue("https://example.com/signed?token=secret&download=1"),
    prepare: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    finish: vi.fn().mockResolvedValue(undefined),
    senderDomain: "example.com",
    now: () => Date.parse("2026-09-08T00:00:00Z"),
  };
});
describe("document email workflow", () => {
  it("sends an escaped Indonesian email with a 24-hour expiry and records SMTP acceptance", async () => {
    expect(await deliverDocument(job, deps)).toBe("sent");
    expect(deps.createLink).toHaveBeenCalledWith("private.pdf");
    expect(deps.prepare).toHaveBeenCalledWith(
      "2026-09-09T00:00:00.000Z",
      expect.any(String),
    );
    expect(deps.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        html: expect.stringContaining("&lt;script&gt;"),
        text: expect.stringContaining("24 jam"),
      }),
    );
    expect(vi.mocked(deps.send).mock.calls[0][0].html).not.toContain(
      "<script>",
    );
    expect(deps.finish).toHaveBeenCalledWith(
      "sent",
      "2026-09-09T00:00:00.000Z",
      null,
      expect.any(String),
    );
  });
  it("records a failed attempt without sending when the file is unavailable", async () => {
    vi.mocked(deps.createLink).mockRejectedValue(new Error("missing"));
    expect(await deliverDocument(job, deps)).toBe("failed");
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.finish).toHaveBeenCalledWith(
      "failed",
      null,
      "LINK_OR_CONFIG_FAILED",
      expect.any(String),
    );
  });
  it("does not send until attempt metadata is safely stored", async () => {
    vi.mocked(deps.prepare).mockRejectedValue(new Error("database offline"));
    expect(await deliverDocument(job, deps)).toBe("failed");
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("records definitive SMTP rejection as failed, allowing a later retry", async () => {
    vi.mocked(deps.send).mockRejectedValueOnce({ responseCode: 550 });
    expect(await deliverDocument(job, deps)).toBe("failed");
    expect(
      await deliverDocument({ ...job, attempt_id: "new-attempt" }, deps),
    ).toBe("sent");
    expect(deps.send).toHaveBeenCalledTimes(2);
  });
  it("marks a lost SMTP response unknown and does not automatically retry", async () => {
    vi.mocked(deps.send).mockRejectedValue({
      code: "ETIMEDOUT",
      command: "DATA",
    });
    expect(await deliverDocument(job, deps)).toBe("unknown");
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(deps.finish).toHaveBeenCalledWith(
      "unknown",
      expect.any(String),
      "SMTP_RESULT_UNKNOWN",
      expect.any(String),
    );
  });
  it("never retries a successful send when the result cannot be persisted", async () => {
    vi.mocked(deps.finish).mockRejectedValue(new Error("database offline"));
    await expect(deliverDocument(job, deps)).rejects.toThrow(
      "database offline",
    );
    expect(deps.send).toHaveBeenCalledTimes(1);
  });
  it("classifies authentication/configuration errors as definitive but unknown exceptions conservatively", () => {
    expect(classifySmtpError({ code: "EAUTH" })).toBe("failed");
    expect(classifySmtpError({ code: "ECONFIG" })).toBe("failed");
    expect(classifySmtpError(new Error("connection lost"))).toBe("unknown");
  });
});
describe("public endpoint validation", () => {
  it("normalizes email and accepts a real name", () => {
    expect(
      validateRequest({
        document_id: job.request_id,
        name: "  Rafi  ",
        email: "RAFI@EXAMPLE.COM ",
      }),
    ).toEqual({
      documentId: job.request_id,
      name: "Rafi",
      email: "rafi@example.com",
    });
  });
  it.each([
    { name: "", email: "user@example.com" },
    { name: "A".repeat(121), email: "user@example.com" },
    { name: "A\r\nB", email: "user@example.com" },
    { name: "A", email: "not-an-email" },
    { name: "A", email: "user@example.com\r\nBcc:other@example.com" },
  ])("rejects invalid or injected input: %j", (values) => {
    expect(() =>
      validateRequest({ ...values, document_id: job.request_id }),
    ).toThrow("INVALID_INPUT");
  });
  it("validates the document UUID", () => {
    expect(() =>
      validateRequest({
        name: "A",
        email: "user@example.com",
        document_id: "other",
      }),
    ).toThrow();
  });
  it("handles preflight and rejects unsupported HTTP methods", () => {
    expect(
      preflight(new Request("https://example.com", { method: "OPTIONS" }))
        ?.status,
    ).toBe(200);
    expect(preflight(new Request("https://example.com"))?.status).toBe(405);
  });
  it("rejects excessive and non-object request bodies", async () => {
    await expect(
      readInput(
        new Request("https://example.com", {
          method: "POST",
          body: "x".repeat(4097),
        }),
      ),
    ).rejects.toThrow("INVALID_INPUT");
    await expect(
      readInput(
        new Request("https://example.com", { method: "POST", body: "[]" }),
      ),
    ).rejects.toThrow("INVALID_INPUT");
  });
  it("maps pending duplicates, limits, admin denial and transitions to appropriate responses", async () => {
    expect(errorResponse(new Error("REQUEST_PENDING")).status).toBe(409);
    expect(errorResponse(new Error("RATE_LIMITED")).status).toBe(429);
    expect(errorResponse(new Error("FORBIDDEN")).status).toBe(403);
    expect(errorResponse(new Error("CONFIRM_UNKNOWN_REQUIRED")).status).toBe(
      409,
    );
    const response = await errorResponse(
      new Error("private SMTP credential"),
    ).json();
    expect(JSON.stringify(response)).not.toContain("private SMTP credential");
  });
});

// The review endpoint uses this guard before calling privileged database RPCs.
import { authorizeAdmin } from "../../supabase/functions/_shared/authorize";
describe("server-side admin authorization", () => {
  it("rejects missing and invalid sessions without querying roles", async () => {
    const getUser = vi.fn().mockResolvedValue(null);
    const isAdmin = vi.fn();
    await expect(authorizeAdmin(null, getUser, isAdmin)).rejects.toThrow(
      "UNAUTHORIZED",
    );
    expect(getUser).not.toHaveBeenCalled();
    await expect(
      authorizeAdmin("Bearer forged", getUser, isAdmin),
    ).rejects.toThrow("UNAUTHORIZED");
    expect(isAdmin).not.toHaveBeenCalled();
  });
  it("rejects signed-in non-admins", async () => {
    await expect(
      authorizeAdmin(
        "Bearer user",
        async () => ({ id: "user-id" }),
        async () => false,
      ),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("returns the verified actor ID and never trusts a browser-supplied actor", async () => {
    const isAdmin = vi.fn().mockResolvedValue(true);
    expect(
      await authorizeAdmin(
        "Bearer verified-token",
        async () => ({ id: "verified-admin-id" }),
        isAdmin,
      ),
    ).toBe("verified-admin-id");
    expect(isAdmin).toHaveBeenCalledWith("verified-admin-id");
  });
});
