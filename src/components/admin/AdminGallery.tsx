import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { deletePhoto, fetchGallery, photoUrl, uploadPhoto, validatePhoto, type GalleryAlbum, type GalleryPhoto } from '@/lib/gallery';

type PendingPhoto = { id: string; file: File; preview: string; caption: string; status: 'pending' | 'uploading' | 'success' | 'error'; error?: string; };
function AlbumSelect({ albums, value, onChange, label, disabled }: { albums: GalleryAlbum[]; value: string; onChange: (value: string) => void; label: string; disabled?: boolean; }) {
  return <select aria-label={label} disabled={disabled} className="w-full border rounded-md bg-background p-2" value={value} onChange={e => onChange(e.target.value)}>
    <option value="">Tanpa album</option>{albums.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}</select>;
}
function PhotoEditor({ photo, albums, busy, onSave, onDelete }: { photo: GalleryPhoto; albums: GalleryAlbum[]; busy: boolean; onSave: (caption: string, album: string) => void; onDelete: () => void; }) {
  const [caption, setCaption] = useState(photo.caption);
  const [album, setAlbum] = useState(photo.album_id || '');
  useEffect(() => { setCaption(photo.caption); setAlbum(photo.album_id || ''); }, [photo]);
  return <Card>
    <CardContent className="p-4 space-y-3">
      <img src={photoUrl(photo.storage_path)} alt={photo.caption || 'Foto kegiatan'} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-md" />
      <Input aria-label="Keterangan foto" value={caption} disabled={busy} onChange={e => setCaption(e.target.value)} />
      <AlbumSelect albums={albums} value={album} onChange={setAlbum} label="Album foto" disabled={busy} />
      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => onSave(caption, album)}>Simpan</Button>
        <Button variant="destructive" disabled={busy} onClick={onDelete}>Hapus foto</Button>
      </div>
    </CardContent>
  </Card>;
}
export default function AdminGallery() {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<string | null>(null);
  const [uploadAlbum, setUploadAlbum] = useState('');
  const [queue, setQueue] = useState<PendingPhoto[]>([]);
  const previews = useRef(new Set<string>());
  useEffect(() => { const urls = previews.current; return () => urls.forEach(url => URL.revokeObjectURL(url)); }, []);
  async function load() {
    setLoading(true); setError(false);
    try { const data = await fetchGallery(); setAlbums(data.albums); setPhotos(data.photos); }
    catch { setError(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function mutate(action: () => Promise<void>, message: string) {
    setBusy(true);
    try { await action(); toast({ title: 'Berhasil', description: message }); await load(); }
    catch { toast({ title: 'Gagal', description: 'Perubahan gagal disimpan. Silakan coba lagi.', variant: 'destructive' }); }
    finally { setBusy(false); }
  }
  function chooseFiles(files: FileList | null) {
    const additions: PendingPhoto[] = [];
    for (const file of Array.from(files || [])) {
      const invalid = validatePhoto(file);
      if (invalid) { toast({ title: file.name, description: invalid, variant: 'destructive' }); continue; }
      const preview = URL.createObjectURL(file); previews.current.add(preview);
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
      additions.push({ id: `${crypto.randomUUID()}.${extension}`, file, preview, caption: '', status: 'pending' });
    }
    setQueue(current => [...current, ...additions]);
  }
  function removePending(item: PendingPhoto) { URL.revokeObjectURL(item.preview); previews.current.delete(item.preview); setQueue(current => current.filter(entry => entry.id !== item.id)); }
  async function upload() {
    setBusy(true);
    const update = (id: string, changes: Partial<PendingPhoto>) => setQueue(current => current.map(item => item.id === id ? { ...item, ...changes } : item));
    for (const item of queue.filter(item => item.status === 'pending' || item.status === 'error')) {
      update(item.id, { status: 'uploading', error: undefined });
      try { await uploadPhoto(item.file, item.caption, uploadAlbum || null, item.id); update(item.id, { status: 'success' }); }
      catch (cause) { update(item.id, { status: 'error', error: cause instanceof Error ? cause.message : 'Upload gagal. Silakan coba lagi.' }); }
    }
    await load(); setBusy(false);
  }
  return <div className="space-y-8">
    <h2 className="text-2xl font-bold">Galeri Kegiatan</h2>
    {error && <div role="alert">Gagal memuat galeri. <Button variant="outline" disabled={busy} onClick={load}>Coba lagi</Button>
    </div>}
    <fieldset disabled={busy || loading || error} className="space-y-4 border rounded-lg p-4">
      <legend className="px-2 font-semibold">Kelola Album</legend>
      <form className="flex flex-wrap gap-2" onSubmit={e => {
        e.preventDefault(); if (!albumName.trim()) return;
        void mutate(async () => {
          const result = editingAlbum ? await supabase.from('gallery_albums').update({ name: albumName.trim() }).eq('id', editingAlbum) : await supabase.from('gallery_albums').insert({ name: albumName.trim() });
          if (result.error) throw result.error;
          setAlbumName(''); setEditingAlbum(null);
        }, 'Album berhasil disimpan.');
      }}>
        <Input className="flex-1 min-w-40" aria-label="Nama album" placeholder="Nama kegiatan / album" required value={albumName} onChange={e => setAlbumName(e.target.value)} />
        <Button type="submit">{editingAlbum ? 'Simpan nama' : 'Tambah album'}</Button>{editingAlbum && <Button type="button" variant="outline" onClick={() => { setEditingAlbum(null); setAlbumName(''); }}>Batal</Button>}</form>
      <div className="space-y-2">{albums.map(album => <div key={album.id} className="flex flex-wrap items-center gap-2 border rounded p-3">
        <span className="flex-1 break-words min-w-0">{album.name}</span>
        <Button variant="outline" size="sm" onClick={() => { setEditingAlbum(album.id); setAlbumName(album.name); }}>Ubah nama</Button>
        <Button variant="destructive" size="sm" onClick={() => {
          if (!confirm(`Hapus album “${album.name}”? Foto tetap tersimpan tanpa album.`)) return;
          void mutate(async () => { const result = await supabase.from('gallery_albums').delete().eq('id', album.id); if (result.error) throw result.error; if (uploadAlbum === album.id) setUploadAlbum(''); if (editingAlbum === album.id) { setEditingAlbum(null); setAlbumName(''); } }, 'Album dihapus; foto tetap tersimpan.');
        }}>Hapus album</Button>
      </div>)}</div>
    </fieldset>
    <fieldset disabled={busy || loading || error} className="space-y-4 border rounded-lg p-4">
      <legend className="px-2 font-semibold">Tambah Foto</legend>
      <p className="text-sm text-muted-foreground">JPEG, PNG, atau WebP, maksimal 5 MB per foto. Foto langsung tampil di website setelah berhasil diunggah.</p>
      <AlbumSelect albums={albums} value={uploadAlbum} onChange={setUploadAlbum} label="Album tujuan upload" />
      <Input type="file" aria-label="Pilih foto" multiple accept="image/jpeg,image/png,image/webp" onChange={e => { chooseFiles(e.target.files); e.target.value = ''; }} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{queue.map(item => <div key={item.id} className="border rounded-lg p-3 space-y-2">
        <img src={item.preview} alt={`Preview ${item.file.name}`} className="w-full aspect-[4/3] object-cover rounded" />
        <p className="text-sm break-all">{item.file.name}</p>
        <Input aria-label={`Keterangan ${item.file.name}`} placeholder="Keterangan foto (opsional)" disabled={item.status === 'success'} value={item.caption} onChange={e => setQueue(current => current.map(entry => entry.id === item.id ? { ...entry, caption: e.target.value } : entry))} />
        <p role="status" className="text-sm">{{ pending: 'Siap diunggah', uploading: 'Mengunggah...', success: 'Berhasil diunggah', error: 'Gagal diunggah' }[item.status]}</p>{item.error && <p role="alert" className="text-sm text-destructive">{item.error}</p>}<Button variant="outline" size="sm" onClick={() => removePending(item)}>{item.status === 'success' ? 'Tutup preview' : 'Keluarkan dari antrean'}</Button>
      </div>)}</div>
      <Button onClick={upload} disabled={busy || !queue.some(item => item.status === 'pending' || item.status === 'error')}>{busy ? 'Memproses...' : 'Unggah / coba ulang foto gagal'}</Button>
    </fieldset>
    <div>
      <h3 className="text-xl font-semibold mb-4">Foto tersimpan ({photos.length})</h3>{loading ? <p role="status">Memuat...</p> : !error && !photos.length ? <p className="text-muted-foreground">Belum ada foto. Tambahkan foto untuk memulai.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map(photo => <PhotoEditor key={photo.id} photo={photo} albums={albums} busy={busy || error} onSave={(caption, album) => void mutate(async () => { const result = await supabase.from('gallery_photos').update({ caption, album_id: album || null }).eq('id', photo.id); if (result.error) throw result.error; }, 'Foto berhasil diperbarui.')} onDelete={() => { if (confirm('Hapus foto ini secara permanen?')) void mutate(() => deletePhoto(photo), 'Foto berhasil dihapus.'); }} />)}</div>}</div>
  </div>;
}
