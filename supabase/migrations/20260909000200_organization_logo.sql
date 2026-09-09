BEGIN;
CREATE TABLE public.organization_branding (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  logo_path TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.organization_branding(id) VALUES (true);
ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_branding FROM anon, authenticated;
GRANT SELECT ON public.organization_branding TO anon, authenticated;
CREATE POLICY "Public organization branding" ON public.organization_branding FOR SELECT USING (true);
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('organization-logos', 'organization-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']);
CREATE POLICY "Public organization logos" ON storage.objects FOR SELECT USING (bucket_id = 'organization-logos');
CREATE POLICY "Admin upload organization logo" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'organization-logos' AND public.is_admin());
CREATE POLICY "Admin delete unused organization logos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'organization-logos' AND public.is_admin()
  AND NOT EXISTS (SELECT 1 FROM public.organization_branding b WHERE b.logo_path = name));
CREATE FUNCTION public.set_organization_logo(p_path TEXT, p_expected_path TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_path TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT logo_path INTO current_path FROM public.organization_branding WHERE id = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BRANDING_NOT_FOUND'; END IF;
  IF current_path IS DISTINCT FROM p_expected_path THEN RAISE EXCEPTION 'LOGO_CHANGED'; END IF;
  IF p_path IS NULL OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'organization-logos' AND name = p_path) THEN
    RAISE EXCEPTION 'LOGO_NOT_FOUND';
  END IF;
  UPDATE public.organization_branding SET logo_path = p_path, updated_at = now() WHERE id = true;
END $$;
REVOKE ALL ON FUNCTION public.set_organization_logo(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_organization_logo(TEXT, TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
