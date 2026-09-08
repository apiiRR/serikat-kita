CREATE TABLE public.gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  caption TEXT NOT NULL DEFAULT '',
  album_id UUID REFERENCES public.gallery_albums(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gallery_photos_album_idx ON public.gallery_photos(album_id);
CREATE INDEX gallery_photos_created_idx ON public.gallery_photos(created_at DESC, id DESC);
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public gallery albums" ON public.gallery_albums FOR SELECT USING (true);
CREATE POLICY "Admin gallery albums" ON public.gallery_albums FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public gallery photos" ON public.gallery_photos FOR SELECT USING (true);
CREATE POLICY "Admin gallery photos" ON public.gallery_photos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
CREATE POLICY "Public gallery files" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admin gallery upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND public.is_admin());
CREATE POLICY "Admin gallery delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND public.is_admin());
