BEGIN;
CREATE SEQUENCE public.gallery_photo_order_seq;
ALTER TABLE public.gallery_photos ADD COLUMN sort_order BIGINT;
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at DESC, id DESC) AS position
  FROM public.gallery_photos
)
UPDATE public.gallery_photos p SET sort_order = r.position FROM ranked r WHERE r.id = p.id;
SELECT setval('public.gallery_photo_order_seq', COALESCE(max(sort_order), 1), count(*) > 0) FROM public.gallery_photos;
ALTER TABLE public.gallery_photos ALTER COLUMN sort_order SET DEFAULT nextval('public.gallery_photo_order_seq');
ALTER TABLE public.gallery_photos ALTER COLUMN sort_order SET NOT NULL;
ALTER SEQUENCE public.gallery_photo_order_seq OWNED BY public.gallery_photos.sort_order;
GRANT USAGE ON SEQUENCE public.gallery_photo_order_seq TO authenticated, service_role;
CREATE INDEX gallery_photo_order_idx ON public.gallery_photos(sort_order, id);

CREATE FUNCTION public.save_gallery_order(p_photo_ids UUID[], p_expected_ids UUID[])
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_ids UUID[];
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  -- Serialize with other reorders, uploads, deletes, and metadata updates.
  LOCK TABLE public.gallery_photos IN SHARE ROW EXCLUSIVE MODE;
  SELECT COALESCE(array_agg(id ORDER BY sort_order, created_at DESC, id DESC), ARRAY[]::UUID[])
    INTO current_ids FROM public.gallery_photos;
  IF p_expected_ids IS DISTINCT FROM current_ids THEN RAISE EXCEPTION 'GALLERY_CHANGED'; END IF;
  IF p_photo_ids IS NULL OR cardinality(p_photo_ids) <> cardinality(current_ids)
    OR (SELECT count(DISTINCT id) FROM unnest(p_photo_ids) AS ids(id)) <> cardinality(current_ids)
    OR EXISTS (SELECT 1 FROM unnest(p_photo_ids) AS ids(id) WHERE id IS NULL OR NOT (id = ANY(current_ids))) THEN
    RAISE EXCEPTION 'INVALID_PHOTO_ORDER';
  END IF;
  UPDATE public.gallery_photos p SET sort_order = ordered.position
    FROM unnest(p_photo_ids) WITH ORDINALITY AS ordered(id, position) WHERE p.id = ordered.id;
END $$;
REVOKE ALL ON FUNCTION public.save_gallery_order(UUID[], UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_gallery_order(UUID[], UUID[]) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
