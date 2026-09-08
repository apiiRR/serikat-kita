import { serviceClient } from "../_shared/client.ts";
import { errorResponse, json, preflight, readInput } from "../_shared/http.ts";
import {
  deliverDocument,
  uuidPattern,
  type EmailJob,
} from "../_shared/document-workflow.ts";
import { authorizeAdmin } from "../_shared/authorize.ts";
import { createSmtpSender } from "../_shared/smtp.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  try {
    const client = serviceClient();
    const actorId = await authorizeAdmin(
      req.headers.get("Authorization"),
      async (token) => {
        const { data, error } = await client.auth.getUser(token);
        return error ? null : data.user;
      },
      async (userId) => {
        const { data, error } = await client
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (error) throw error;
        return !!data;
      },
    );
    const body = await readInput(req);
    if (
      typeof body.request_id !== "string" ||
      !uuidPattern.test(body.request_id) ||
      !["approve", "reject", "retry"].includes(String(body.action))
    )
      throw new Error("INVALID_INPUT");
    const { data, error } = await client.rpc("claim_document_review", {
      p_request_id: body.request_id,
      p_actor: actorId,
      p_action: body.action,
      p_confirm_unknown: body.confirm_unknown === true,
    });
    if (error) throw error;
    if (data.decision === "rejected") return json({ decision: "rejected" });
    const job = data as EmailJob;
    // Resolve SMTP configuration only inside the workflow so configuration errors
    // become a failed email attempt without losing the approval.
    const status = await deliverDocument(job, {
      senderDomain: (
        Deno.env.get("SMTP_FROM") ||
        Deno.env.get("SMTP_USER") ||
        "localhost"
      )
        .split("@")
        .pop()!,
      createLink: async (path) => {
        const exists = await client.storage.from("documents").exists(path);
        if (exists.error || !exists.data) throw new Error("DOCUMENT_NOT_FOUND");
        const signed = await client.storage
          .from("documents")
          .createSignedUrl(path, 86400, { download: true });
        if (signed.error) throw signed.error;
        return signed.data.signedUrl;
      },
      prepare: async (expiresAt, messageId) => {
        const result = await client
          .from("document_email_attempts")
          .update({ link_expires_at: expiresAt, message_id: messageId })
          .eq("id", job.attempt_id);
        if (result.error) throw result.error;
      },
      send: async (message) => {
        await createSmtpSender().send(message);
      },
      finish: async (emailStatus, expiresAt, errorCode, messageId) => {
        const result = await client.rpc("finish_document_email", {
          p_request_id: job.request_id,
          p_attempt_id: job.attempt_id,
          p_status: emailStatus,
          p_expires_at: expiresAt,
          p_error: errorCode,
          p_message_id: messageId,
        });
        if (result.error) throw result.error;
      },
    });
    return json({ decision: "approved", email_status: status });
  } catch (error) {
    return errorResponse(error);
  }
});
