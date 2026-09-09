-- Run as postgres on an isolated test Supabase after applying the gallery migrations.
-- psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/gallery_photo_order.sql
-- Fixtures roll back. Sequence increments (as in PostgreSQL generally) do not.
BEGIN;
CREATE FUNCTION pg_temp.assert_gallery(value BOOLEAN) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN IF value IS NOT TRUE THEN RAISE EXCEPTION 'Gallery order assertion failed'; END IF; END $$;
INSERT INTO auth.users(id, email) VALUES
('e0000000-0000-4000-8000-000000000001', 'gallery-admin@example.invalid'),
('e0000000-0000-4000-8000-000000000002', 'gallery-user@example.invalid');
INSERT INTO public.user_roles(user_id, role) VALUES ('e0000000-0000-4000-8000-000000000001', 'admin');
INSERT INTO public.gallery_photos(id, storage_path, caption) VALUES
('e1000000-0000-4000-8000-000000000001', 'order-test-1.jpg', 'Order test 1'),
('e1000000-0000-4000-8000-000000000002', 'order-test-2.jpg', 'Order test 2');
SELECT set_config('request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  BEGIN
    PERFORM public.save_gallery_order(ARRAY[]::uuid[], ARRAY[]::uuid[]);
    RAISE EXCEPTION 'Non-admin must be rejected';
  EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'FORBIDDEN' THEN RAISE; END IF; END;
END $$;
SELECT set_config('request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000001', true);
DO $$
DECLARE original UUID[]; reordered UUID[]; after_save UUID[]; new_position BIGINT;
BEGIN
  SELECT array_agg(id ORDER BY sort_order, created_at DESC, id DESC) INTO original FROM public.gallery_photos;
  SELECT array_agg(id ORDER BY sort_order DESC, created_at, id) INTO reordered FROM public.gallery_photos;
  PERFORM public.save_gallery_order(reordered, original);
  SELECT array_agg(id ORDER BY sort_order, created_at DESC, id DESC) INTO after_save FROM public.gallery_photos;
  PERFORM pg_temp.assert_gallery(after_save = reordered);
  BEGIN
    PERFORM public.save_gallery_order(original, original);
    RAISE EXCEPTION 'Stale snapshot must be rejected';
  EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'GALLERY_CHANGED' THEN RAISE; END IF; END;
  BEGIN
    PERFORM public.save_gallery_order(ARRAY[reordered[1], reordered[1]], reordered);
    RAISE EXCEPTION 'Duplicates must be rejected';
  EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'INVALID_PHOTO_ORDER' THEN RAISE; END IF; END;
  PERFORM pg_temp.assert_gallery((SELECT array_agg(id ORDER BY sort_order) = reordered FROM public.gallery_photos));
  INSERT INTO public.gallery_photos(storage_path, caption) VALUES ('order-test-new.jpg', 'New photo') RETURNING sort_order INTO new_position;
  PERFORM pg_temp.assert_gallery(new_position > cardinality(reordered));
END $$;
SET LOCAL ROLE anon;
SELECT pg_temp.assert_gallery(NOT has_function_privilege(current_user, 'public.save_gallery_order(uuid[],uuid[])', 'EXECUTE'));
SELECT pg_temp.assert_gallery((SELECT count(*) > 0 FROM public.gallery_photos));
RESET ROLE;
ROLLBACK;
