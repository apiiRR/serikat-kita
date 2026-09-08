-- Run AFTER migrations on an isolated/staging Supabase database as postgres.
-- All fixture data and changes are rolled back, even on assertion failure via psql.
-- psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/document_download_approval.sql
BEGIN;
CREATE FUNCTION pg_temp.assert_true(value BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN IF value IS NOT TRUE THEN RAISE EXCEPTION 'Assertion failed: %', label; END IF; END $$;
CREATE FUNCTION pg_temp.assert_error(statement TEXT, expected TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%' || expected || '%' THEN RETURN; END IF;
    RAISE;
  END;
  RAISE EXCEPTION 'Expected error: %', expected;
END $$;

INSERT INTO auth.users(id, email) VALUES
('d0000000-0000-4000-8000-000000000001', 'document-test-admin@example.invalid'),
('d0000000-0000-4000-8000-000000000002', 'document-test-user@example.invalid');
INSERT INTO public.user_roles(user_id, role) VALUES ('d0000000-0000-4000-8000-000000000001', 'admin');
INSERT INTO storage.objects(bucket_id, name) VALUES ('documents', 'approval-test-original.pdf'), ('documents', 'approval-test-replacement.pdf');
INSERT INTO public.documents(id, name, storage_path) VALUES
('d1000000-0000-4000-8000-000000000001', 'Approval Test 1', 'approval-test-original.pdf'),
('d1000000-0000-4000-8000-000000000002', 'Approval Test 2', 'approval-test-original.pdf'),
('d1000000-0000-4000-8000-000000000003', 'Approval Test 3', 'approval-test-original.pdf'),
('d1000000-0000-4000-8000-000000000004', 'Approval Test 4', 'approval-test-original.pdf');
SELECT pg_temp.assert_true((SELECT NOT public FROM storage.buckets WHERE id = 'documents'), 'documents bucket is private');

SET LOCAL ROLE anon;
SELECT pg_temp.assert_true((SELECT count(*) = 4 FROM public.list_document_catalog() WHERE name LIKE 'Approval Test %'), 'anonymous metadata catalog');
SELECT pg_temp.assert_error('SELECT * FROM public.documents', 'permission denied');
SELECT pg_temp.assert_error('SELECT * FROM public.document_download_requests', 'permission denied');
SELECT pg_temp.assert_error('SELECT public.submit_document_request(NULL, NULL, NULL)', 'permission denied');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM storage.objects WHERE bucket_id = 'documents' AND name LIKE 'approval-test-%'), 'anonymous storage denied');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000002', true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.documents), 'non-admin cannot read private document rows');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.document_download_requests), 'non-admin cannot read requests');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM storage.objects WHERE bucket_id = 'documents' AND name LIKE 'approval-test-%'), 'non-admin storage denied');
SELECT pg_temp.assert_error('SELECT public.claim_document_review(NULL, NULL, ''approve'', false)', 'permission denied');
SELECT pg_temp.assert_error('UPDATE public.document_download_requests SET decision = ''approved''', 'permission denied');
RESET ROLE;

DO $$
DECLARE r UUID; rejected UUID; removed UUID; job JSONB; retry_job JSONB;
BEGIN
  r := public.submit_document_request('d1000000-0000-4000-8000-000000000001', '  Test User  ', 'TEST-DOWNLOAD@EXAMPLE.INVALID');
  PERFORM pg_temp.assert_true((SELECT requester_email = 'test-download@example.invalid' AND requester_name = 'Test User' FROM public.document_download_requests WHERE id = r), 'normalization');
  PERFORM pg_temp.assert_error($q$SELECT public.submit_document_request('d1000000-0000-4000-8000-000000000001', 'Other Name', 'test-download@example.invalid')$q$, 'REQUEST_PENDING');
  PERFORM public.submit_document_request('d1000000-0000-4000-8000-000000000002', 'Test', 'test-download@example.invalid');
  PERFORM public.submit_document_request('d1000000-0000-4000-8000-000000000003', 'Test', 'test-download@example.invalid');
  PERFORM pg_temp.assert_error($q$SELECT public.submit_document_request('d1000000-0000-4000-8000-000000000004', 'Test', 'test-download@example.invalid')$q$, 'RATE_LIMITED');
  PERFORM pg_temp.assert_error(format('SELECT public.claim_document_review(%L, %L, ''approve'', false)', r, 'd0000000-0000-4000-8000-000000000002'), 'FORBIDDEN');

  -- Approval pins the current version, not the file present at submission time.
  UPDATE public.documents SET storage_path = 'approval-test-replacement.pdf' WHERE id = 'd1000000-0000-4000-8000-000000000001';
  job := public.claim_document_review(r, 'd0000000-0000-4000-8000-000000000001', 'approve', false);
  PERFORM pg_temp.assert_true(job->>'storage_path' = 'approval-test-replacement.pdf', 'snapshot at approval');
  PERFORM pg_temp.assert_error(format('SELECT public.claim_document_review(%L, %L, ''approve'', false)', r, 'd0000000-0000-4000-8000-000000000001'), 'INVALID_TRANSITION');
  PERFORM pg_temp.assert_error(format('SELECT public.claim_document_review(%L, %L, ''retry'', false)', r, 'd0000000-0000-4000-8000-000000000001'), 'INVALID_TRANSITION');

  PERFORM public.finish_document_email(r, (job->>'attempt_id')::uuid, 'failed', NULL, 'SMTP_REJECTED', NULL);
  retry_job := public.claim_document_review(r, 'd0000000-0000-4000-8000-000000000001', 'retry', false);
  PERFORM pg_temp.assert_true(job->>'attempt_id' <> retry_job->>'attempt_id', 'retry gets its own history');
  PERFORM public.finish_document_email(r, (retry_job->>'attempt_id')::uuid, 'unknown', now() + interval '24 hours', 'SMTP_RESULT_UNKNOWN', 'test-message');
  PERFORM pg_temp.assert_error(format('SELECT public.claim_document_review(%L, %L, ''retry'', false)', r, 'd0000000-0000-4000-8000-000000000001'), 'CONFIRM_UNKNOWN_REQUIRED');
  retry_job := public.claim_document_review(r, 'd0000000-0000-4000-8000-000000000001', 'retry', true);
  PERFORM pg_temp.assert_error(format('SELECT public.finish_document_email(%L, %L, ''sent'')', r, job->>'attempt_id'), 'STALE_ATTEMPT');

  -- An interrupted worker may have sent the email. Expired leases need confirmation.
  UPDATE public.document_download_requests SET sending_started_at = now() - interval '11 minutes' WHERE id = r;
  PERFORM pg_temp.assert_error(format('SELECT public.claim_document_review(%L, %L, ''retry'', false)', r, 'd0000000-0000-4000-8000-000000000001'), 'CONFIRM_UNKNOWN_REQUIRED');
  retry_job := public.claim_document_review(r, 'd0000000-0000-4000-8000-000000000001', 'retry', true);
  PERFORM public.finish_document_email(r, (retry_job->>'attempt_id')::uuid, 'sent', now() + interval '24 hours', NULL, 'accepted-message');
  PERFORM pg_temp.assert_true((SELECT decision = 'approved' AND email_status = 'sent' AND link_expires_at > now() FROM public.document_download_requests WHERE id = r), 'approval and email outcomes persisted');

  DELETE FROM public.documents WHERE id = 'd1000000-0000-4000-8000-000000000001';
  PERFORM pg_temp.assert_true((SELECT document_id IS NULL AND approved_storage_path = 'approval-test-replacement.pdf' FROM public.document_download_requests WHERE id = r), 'deleted document retains approved snapshot');
  PERFORM pg_temp.assert_true(EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id = 'documents' AND name = 'approval-test-replacement.pdf'), 'file retained');

  rejected := public.submit_document_request('d1000000-0000-4000-8000-000000000002', 'Rejected', 'reject@example.invalid');
  PERFORM public.claim_document_review(rejected, 'd0000000-0000-4000-8000-000000000001', 'reject', false);
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.document_email_attempts WHERE request_id = rejected), 'rejection has no email attempt');
  removed := public.submit_document_request('d1000000-0000-4000-8000-000000000004', 'Removed', 'removed@example.invalid');
  DELETE FROM public.documents WHERE id = 'd1000000-0000-4000-8000-000000000004';
  PERFORM pg_temp.assert_error(format('SELECT public.claim_document_review(%L, %L, ''approve'', false)', removed, 'd0000000-0000-4000-8000-000000000001'), 'DOCUMENT_NOT_FOUND');
END $$;

SELECT set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_true((SELECT count(*) > 0 FROM public.document_download_requests), 'admin can read requests');
SELECT pg_temp.assert_error('SELECT public.claim_document_review(NULL, NULL, ''approve'', false)', 'permission denied');
-- Existing objects cannot be overwritten or deleted by the application admin.
WITH removed AS (DELETE FROM storage.objects WHERE bucket_id = 'documents' AND name = 'approval-test-replacement.pdf' RETURNING id)
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM removed), 'immutable approved files');
RESET ROLE;
ROLLBACK;
