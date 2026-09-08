import { serviceClient } from "../_shared/client.ts";
import { errorResponse, json, preflight, readInput } from "../_shared/http.ts";
import { validateRequest } from "../_shared/document-workflow.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  try {
    const { documentId, name, email } = validateRequest(await readInput(req));
    const { error } = await serviceClient().rpc("submit_document_request", {
      p_document_id: documentId,
      p_name: name,
      p_email: email,
    });
    if (error) throw error;
    return json(
      {
        message:
          "Permintaan diterima. Link download akan dikirim ke email Anda setelah disetujui admin.",
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
});
