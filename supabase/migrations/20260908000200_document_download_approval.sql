BEGIN;

-- Resolve existing public URLs before revoking public access. Abort without partial changes
-- if a URL is external, encoded differently, or points to a missing object.
ALTER TABLE public.documents ADD COLUMN storage_path TEXT;
UPDATE public.documents d
SET storage_path = o.name
FROM storage.objects o
WHERE o.bucket_id = 'documents'
  AND d.file_url ~ '^https?://[^/]+/storage/v1/object/public/documents/'
  AND o.name = regexp_replace(d.file_url, '^https?://[^/]+/storage/v1/object/public/documents/', '');
DO $$
DECLARE missing TEXT;
BEGIN
  SELECT string_agg(id::text, ', ') INTO missing FROM public.documents WHERE storage_path IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot map document URLs to storage objects. Repair these document IDs first: %', missing;
  END IF;
END $$;
ALTER TABLE public.documents ALTER COLUMN storage_path SET NOT NULL;
ALTER TABLE public.documents DROP COLUMN file_url;

UPDATE storage.buckets SET public = false WHERE id = 'documents';
DROP POLICY "Anyone can view documents in storage" ON storage.objects;
CREATE POLICY "Admins can read private documents" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'documents' AND public.is_admin());
-- Files are immutable to application users. Replacements use new paths and old files
-- remain private, preserving signed links and approved requests (including retries).
DROP POLICY "Admins can update documents" ON storage.objects;
DROP POLICY "Admins can delete documents" ON storage.objects;
DROP POLICY "Anyone can view documents" ON public.documents;
REVOKE ALL ON public.documents FROM anon;

CREATE FUNCTION public.list_document_catalog()
RETURNS TABLE (id UUID, name TEXT, description TEXT, file_type TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id, name, description, file_type, created_at
  FROM public.documents ORDER BY created_at DESC, id DESC;
$$;
REVOKE ALL ON FUNCTION public.list_document_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_document_catalog() TO anon, authenticated;

CREATE TABLE public.document_download_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  requester_name TEXT NOT NULL CHECK (length(trim(requester_name)) BETWEEN 1 AND 120),
  requester_email TEXT NOT NULL CHECK (length(requester_email) <= 254 AND requester_email = lower(trim(requester_email))),
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'rejected')),
  email_status TEXT NOT NULL DEFAULT 'not_sent' CHECK (email_status IN ('not_sent', 'sending', 'sent', 'failed', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_storage_path TEXT,
  approved_document_name TEXT,
  current_attempt_id UUID,
  sending_started_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  link_expires_at TIMESTAMPTZ,
  last_error TEXT
);
CREATE UNIQUE INDEX document_request_pending_unique ON public.document_download_requests(document_id, requester_email) WHERE decision = 'pending';
CREATE INDEX document_request_email_time ON public.document_download_requests(requester_email, created_at DESC);
CREATE INDEX document_request_created ON public.document_download_requests(created_at DESC);

CREATE TABLE public.document_email_attempts (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.document_download_requests(id),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  link_expires_at TIMESTAMPTZ,
  message_id TEXT,
  error_code TEXT
);
ALTER TABLE public.document_download_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_email_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_download_requests, public.document_email_attempts FROM anon, authenticated;
GRANT SELECT ON public.document_download_requests, public.document_email_attempts TO authenticated;
GRANT ALL ON public.document_download_requests, public.document_email_attempts TO service_role;
CREATE POLICY "Admin read download requests" ON public.document_download_requests FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin read email attempts" ON public.document_email_attempts FOR SELECT TO authenticated USING (public.is_admin());

-- Only Edge Functions using service_role can invoke mutation RPCs. Browser callers
-- cannot spoof the actor or bypass validation, limits, and transition locks.
CREATE FUNCTION public.submit_document_request(p_document_id UUID, p_name TEXT, p_email TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE title TEXT; new_id UUID; normalized_email TEXT := lower(trim(p_email));
BEGIN
  IF p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 1 AND 120
     OR p_name ~ '[[:cntrl:]]' OR normalized_email IS NULL
     OR length(normalized_email) > 254
     OR normalized_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_email, 0));
  SELECT name INTO title FROM public.documents WHERE id = p_document_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'DOCUMENT_NOT_FOUND'; END IF;
  IF EXISTS (SELECT 1 FROM public.document_download_requests WHERE document_id = p_document_id AND requester_email = normalized_email AND decision = 'pending') THEN
    RAISE EXCEPTION 'REQUEST_PENDING';
  END IF;
  IF (SELECT count(*) FROM public.document_download_requests WHERE requester_email = normalized_email AND created_at > now() - interval '1 hour') >= 3 THEN
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;
  INSERT INTO public.document_download_requests(document_id, document_name, requester_name, requester_email)
    VALUES (p_document_id, title, trim(p_name), normalized_email) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE FUNCTION public.claim_document_review(p_request_id UUID, p_actor UUID, p_action TEXT, p_confirm_unknown BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r public.document_download_requests%ROWTYPE; doc public.documents%ROWTYPE; attempt UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT * INTO r FROM public.document_download_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
  IF p_action = 'reject' THEN
    IF r.decision <> 'pending' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
    UPDATE public.document_download_requests SET decision = 'rejected', reviewed_by = p_actor, reviewed_at = now() WHERE id = r.id;
    RETURN jsonb_build_object('decision', 'rejected');
  ELSIF p_action = 'approve' THEN
    IF r.decision <> 'pending' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
    SELECT * INTO doc FROM public.documents WHERE id = r.document_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DOCUMENT_NOT_FOUND'; END IF;
    r.approved_storage_path := doc.storage_path;
    r.approved_document_name := doc.name;
    UPDATE public.document_download_requests SET decision = 'approved', reviewed_by = p_actor, reviewed_at = now(),
      approved_storage_path = doc.storage_path, approved_document_name = doc.name WHERE id = r.id;
  ELSIF p_action = 'retry' THEN
    IF r.decision <> 'approved' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
    IF r.email_status = 'sending' AND r.sending_started_at < now() - interval '10 minutes' THEN
      r.email_status := 'unknown';
    END IF;
    IF r.email_status NOT IN ('failed', 'unknown') THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
    IF r.email_status = 'unknown' AND NOT p_confirm_unknown THEN RAISE EXCEPTION 'CONFIRM_UNKNOWN_REQUIRED'; END IF;
    UPDATE public.document_email_attempts SET status = 'unknown', finished_at = now(), error_code = 'PROCESS_INTERRUPTED'
      WHERE id = r.current_attempt_id AND status = 'sending';
  ELSE
    RAISE EXCEPTION 'INVALID_ACTION';
  END IF;
  INSERT INTO public.document_email_attempts(id, request_id, actor_id) VALUES (attempt, r.id, p_actor);
  UPDATE public.document_download_requests SET email_status = 'sending', sending_started_at = now(),
    current_attempt_id = attempt, last_error = NULL WHERE id = r.id;
  RETURN jsonb_build_object('decision', 'approved', 'request_id', r.id, 'attempt_id', attempt,
    'storage_path', r.approved_storage_path, 'document_name', r.approved_document_name,
    'requester_name', r.requester_name, 'requester_email', r.requester_email);
END $$;

CREATE FUNCTION public.finish_document_email(p_request_id UUID, p_attempt_id UUID, p_status TEXT, p_expires_at TIMESTAMPTZ DEFAULT NULL, p_error TEXT DEFAULT NULL, p_message_id TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_status NOT IN ('sent', 'failed', 'unknown') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  PERFORM 1 FROM public.document_download_requests WHERE id = p_request_id AND current_attempt_id = p_attempt_id AND email_status = 'sending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_ATTEMPT'; END IF;
  UPDATE public.document_email_attempts SET status = p_status, finished_at = now(), link_expires_at = p_expires_at,
    error_code = p_error, message_id = p_message_id WHERE id = p_attempt_id;
  UPDATE public.document_download_requests SET email_status = p_status, last_error = p_error,
    link_expires_at = p_expires_at, sent_at = CASE WHEN p_status = 'sent' THEN now() ELSE sent_at END WHERE id = p_request_id;
END $$;

REVOKE ALL ON FUNCTION public.submit_document_request(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_document_review(UUID, UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_document_email(UUID, UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_document_request(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_document_review(UUID, UUID, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_document_email(UUID, UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO service_role;
COMMIT;
