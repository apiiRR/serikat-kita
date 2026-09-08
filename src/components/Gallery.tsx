import { useEffect, useState } from 'react';
import { Images, Pause, Play } from 'lucide-react';
import { fetchGallery, photoUrl, type GalleryAlbum, type GalleryPhoto } from '@/lib/gallery';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function Gallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [album, setAlbum] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const visible = photos.filter(photo => !album || photo.album_id === album);
  async function load() {
    setLoading(true); setError(false);
    try { const data = await fetchGallery(); setAlbums(data.albums); setPhotos(data.photos); }
    catch { setError(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    update(); media.addEventListener('change', update); document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => { api?.scrollTo(0, true); }, [album, api]);
  useEffect(() => {
    if (!api || paused || hovered || focused || reduced || hidden || selected || visible.length < 2) return;
    const timer = window.setInterval(() => { if (api.canScrollNext()) api.scrollNext(); else api.scrollTo(0); }, 5000);
    return () => window.clearInterval(timer);
  }, [api, paused, hovered, focused, reduced, hidden, selected, visible.length, album]);
  return <section id="galeri" className="py-20 bg-muted/30 scroll-mt-16">
    <div className="container px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Images className="w-4 h-4" />Dokumentasi Kegiatan</div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Galeri Kegiatan</h2>
        <p className="text-muted-foreground">Momen kebersamaan Serikat Pekerja PT Berdikari</p>
      </div>
      {loading ? <p role="status" className="text-center py-12">Memuat galeri...</p> : error ? <div role="alert" className="text-center py-12">
        <p>Gagal memuat galeri.</p>
        <Button onClick={load} className="mt-4">Coba lagi</Button>
      </div> : <>
        <div className="flex justify-center mb-8">
          <label className="flex items-center gap-3">Album<select aria-label="Filter album" className="border rounded-md bg-background p-2 max-w-64" value={album} onChange={e => setAlbum(e.target.value)}>
            <option value="">Semua</option>{albums.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </label>
        </div>
        {!visible.length ? <p className="text-center text-muted-foreground py-12">Belum ada foto kegiatan{album ? ' dalam album ini' : ''}.</p> : <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}>
          <Carousel key={album} setApi={setApi} opts={{ align: 'start' }} aria-label="Foto kegiatan" className="pb-16">
            <CarouselContent>{visible.map(photo => <CarouselItem key={photo.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="rounded-xl overflow-hidden bg-card border shadow-card">
                <button className="block w-full focus-visible:outline-primary" onClick={() => setSelected(photo)} aria-label={`Perbesar foto: ${photo.caption || 'Kegiatan serikat pekerja'}`}>
                  <img src={photoUrl(photo.storage_path)} alt={photo.caption || 'Kegiatan serikat pekerja'} loading="lazy" className="w-full aspect-[4/3] object-cover" />
                </button>{photo.caption && <p className="p-4 text-sm break-words">{photo.caption}</p>}</div>
            </CarouselItem>)}</CarouselContent>
            <CarouselPrevious className="left-0 top-auto bottom-0 translate-y-0" aria-label="Foto sebelumnya" />
            <CarouselNext className="right-0 top-auto bottom-0 translate-y-0" aria-label="Foto berikutnya" />
            {visible.length > 1 && <Button variant="outline" className="absolute bottom-0 left-1/2 -translate-x-1/2" disabled={reduced} onClick={() => setPaused(!paused)}>{paused || reduced ? <Play className="mr-2 w-4 h-4" /> : <Pause className="mr-2 w-4 h-4" />}{reduced ? 'Animasi dinonaktifkan' : paused ? 'Putar otomatis' : 'Jeda otomatis'}</Button>}
          </Carousel>
        </div>}
      </>}
    </div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Foto Kegiatan</DialogTitle>
          <DialogDescription>{selected?.caption || 'Dokumentasi Serikat Pekerja PT Berdikari'}</DialogDescription>
        </DialogHeader>{selected && <img src={photoUrl(selected.storage_path)} alt={selected.caption || 'Kegiatan serikat pekerja'} className="max-h-[75vh] w-full object-contain" />}</DialogContent>
    </Dialog>
  </section>;
}
