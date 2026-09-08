# Step-by-Step Deploy ke GitHub Pages

Ikuti langkah-langkah berikut secara berurutan:

---

## Langkah 1: Push Perubahan ke GitHub

Jalankan perintah berikut di terminal:

```bash
cd /Users/mobiledeveloperptberdikari/Rafi\ Projects/serikat-kita
git push origin main
```

> **Catatan:** Jika gagal karena SSH, jalankan ini dulu:
>
> ```bash
> git remote set-url origin https://github.com/apiiRR/serikat-kita.git
> git push origin main
> ```
>
> Saat diminta password, gunakan Personal Access Token dari https://github.com/settings/tokens

---

## Langkah 2: Enable GitHub Pages di Repository

1. Buka https://github.com/apiiRR/serikat-kita
2. Klik tab **Settings**
3. Di sidebar kiri, klik **Pages**
4. Di bagian **Build and deployment**:
   - Source: **Deploy from a branch**
5. Di bagian **Branch**:
   - Branch: **gh-pages**
   - Folder: **/ (root)**
6. Klik **Save**
7. Tunggu beberapa menit, refresh halaman

---

## Langkah 3: Deploy dengan Perintah

Jalankan:

```bash
cd /Users/mobiledeveloperptberdikari/Rafi\ Projects/serikat-kita
npm run deply
```

---

## Langkah 4: Cek Status Deployment

1. Buka https://github.com/apiiRR/serikat-kita/actions
2. Akan ada workflow "pages build and deployment" yang berjalan
3. Tunggu hingga selesai (biasanya 1-2 menit)

---

## Langkah 5: Akses Website

Buka browser dan akses:

```
https://apiiRR.github.io/serikat-kita
```

---

## Jika Ingin Deploy Ulang

Cukup jalankan:

```bash
npm run deply
```

## Migrasi Galeri (sebelum deploy frontend)

1. Pada project Supabase yang digunakan website, jalankan isi file `supabase/migrations/20260908000100_add_gallery.sql` melalui SQL Editor. Alternatif untuk project yang sudah terhubung ke Supabase CLI: jalankan `supabase db push` setelah memeriksa migrasi tertunda.
2. Pastikan tabel `gallery_albums`, `gallery_photos`, dan bucket publik `gallery` berhasil dibuat. Migrasi membutuhkan fungsi `public.is_admin()` dari migrasi awal. Bucket membatasi JPEG/PNG/WebP maksimal 5 MB per file.
3. Verifikasi melalui sesi pengunjung bahwa data/foto bisa dibaca. Melalui sesi pengguna non-admin, pastikan insert/update/delete tabel, upload, dan delete file ditolak. Melalui akun admin, uji tambah album, unggah foto, edit, dan hapus.
4. Jalankan `npm run build`, lalu deploy frontend mengikuti langkah di atas. Tidak diperlukan service-role key di frontend.
5. Buka panel admin → Galeri. Buat album bila diperlukan, pilih beberapa foto, isi keterangan, lalu unggah. Foto berhasil langsung publik; tombol coba ulang hanya memproses foto tertunda/gagal. Menghapus album tidak menghapus foto.

Jika upload gagal sebagian, pertahankan antrean dan coba ulang. Jika hapus file berhasil tetapi hapus metadata gagal, coba hapus foto yang sama lagi. Jika migrasi belum diterapkan, galeri menampilkan kegagalan memuat; terapkan migrasi kemudian pilih Coba lagi.
