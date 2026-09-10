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

## Approval Download Dokumen dan SMTP Google Workspace

Perubahan ini membutuhkan migrasi database dan Edge Functions; deploy frontend saja belum mengaktifkan pengajuan dan email. SMTP pada menu **Authentication** Supabase hanya mengatur email autentikasi. Email approval dikirim oleh Edge Function menggunakan SMTP Google Workspace sendiri.

### 1. Siapkan pengirim

- Aktifkan verifikasi dua langkah pada akun Google Workspace pengirim dan buat **App Password** (sesuai izin admin Workspace).
- Gunakan `smtp.gmail.com`, port `465`, SSL/TLS. Password yang dipakai adalah App Password, bukan password login Google. Port 25 dan 587 tidak digunakan karena diblokir oleh hosted Supabase Edge Functions.
- Salin `supabase/functions/.env.example` ke `supabase/.env.smtp.local`, kemudian isi `SMTP_USER` dan `SMTP_PASSWORD` secara lokal. `SMTP_FROM` boleh kosong untuk memakai alamat `SMTP_USER`; jika diisi, gunakan alamat pengirim/alias yang diizinkan Workspace. File `.local` sudah diabaikan Git.
- Jangan memasukkan SMTP password atau service-role key ke `.env` frontend, variabel `VITE_*`, source code, atau chat.

### 2. Periksa dan migrasikan dokumen

Backup database sebelum migrasi. Pada SQL Editor project yang dipakai oleh `VITE_SUPABASE_URL`, jalankan pemeriksaan berikut terlebih dahulu:

```sql
SELECT d.id, d.name,
  EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'documents'
      AND d.file_url ~ '^https?://[^/]+/storage/v1/object/public/documents/'
      AND o.name = regexp_replace(d.file_url,
        '^https?://[^/]+/storage/v1/object/public/documents/', '')
  ) AS dapat_dimigrasikan
FROM public.documents d;
```

Semua baris harus bernilai `true`. Jika ada URL eksternal, URL dengan encoding khusus, atau file hilang, upload PDF ke bucket `documents` dan perbaiki URL baris itu dahulu. Jangan mengabaikan kegagalan pemeriksaan.

Jalankan `supabase/migrations/20260908000200_document_download_approval.sql` melalui SQL Editor, atau `supabase db push` setelah memastikan project terhubung dan memeriksa migrasi tertunda. Migrasi bersifat transaksional dan berhenti jika URL tidak dapat dipetakan. Jika gagal di SQL Editor, lakukan `ROLLBACK` sebelum memperbaiki data dan mencoba lagi.

Migrasi mengganti `documents.file_url` dengan `storage_path`, menjadikan bucket dokumen privat, menyediakan katalog metadata publik, serta menambahkan permintaan dan riwayat email. Frontend lama yang memakai `file_url` tidak kompatibel, jadi lakukan migrasi dan deployment baru dalam satu jadwal pemeliharaan. Jangan mengembalikan bucket menjadi publik saat rollback; itu melewati approval.

File storage bersifat immutable bagi aplikasi: upload pengganti menggunakan nama baru, sedangkan hapus dokumen hanya menghapusnya dari daftar. File lama tetap privat dan tidak dibersihkan otomatis, agar link aktif serta retry permintaan yang sudah approved tetap berfungsi. Pembersihan storage manual harus memperhitungkan seluruh referensi dokumen, snapshot approval, dan link yang belum kedaluwarsa.

### 3. Konfigurasi dan deploy Edge Functions

Untuk Supabase hosted dengan CLI yang sudah terhubung ke project yang tepat:

```bash
supabase secrets set --env-file supabase/.env.smtp.local
supabase functions deploy request-document-download
supabase functions deploy review-document-request
```

Alternatif: isi variabel SMTP di **Edge Functions → Secrets** pada dashboard lalu deploy functions melalui mekanisme project Anda. `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tersedia otomatis pada hosted Edge Functions; keduanya hanya digunakan di server.

Konfigurasi `verify_jwt = false` untuk kedua fungsi sudah ada di `supabase/config.toml`: pengajuan memang publik; endpoint review tetap memverifikasi bearer token dengan `auth.getUser()` dan role admin sebelum memanggil RPC istimewa. Jangan menghapus pemeriksaan ini. RPC mutasi hanya dapat dijalankan oleh `service_role`, bukan langsung dari browser.

Jika project memakai Supabase self-hosted, pasang functions dan secrets di runtime Edge Functions deployment tersebut, sesuai URL backend website. Konfigurasi CLI hosted bukan pengganti deployment server self-hosted.

### 4. Verifikasi sebelum rilis

```bash
npm test
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

Di database pengujian terisolasi/staging setelah migrasi, jalankan `supabase/tests/document_download_approval.sql` sebagai postgres menggunakan SQL Editor atau `psql` dengan `ON_ERROR_STOP=1`. Skrip membuat fixture sementara dalam transaksi lalu `ROLLBACK`, menguji akses anon/non-admin/admin, validasi transisi, duplikasi, batas pengajuan, versi dokumen, serta retry. Skrip ini menguji database; objek fixture tidak berisi file PDF nyata.

Uji integrasi berikut dengan file dan alamat email pengujian:

1. Pengunjung melihat kartu tanpa preview; tombol Download meminta nama dan email. Pengajuan menjadi pending tanpa mengirim email.
2. Nama kosong/email tidak valid ditolak. Pengajuan pending ganda ditolak; maksimal 3 pengajuan berhasil per email dalam satu jam.
3. Tanpa login, URL publik lama tidak membuka PDF, data permintaan tidak dapat dibaca, dan endpoint approval menolak akses. Pengguna biasa juga tidak dapat menyetujui.
4. Admin menyetujui: satu email diterima berisi link download 24 jam. Coba klik approval dari dua sesi admin bersamaan; hanya satu proses yang mendapat hak mengirim. Uji pengajuan bersamaan untuk email/dokumen sama; hanya satu pending dibuat.
5. Admin menolak: status berubah tanpa email. Dokumen yang dihapus sebelum approval tidak dapat disetujui.
6. Uji password SMTP salah: approval tetap tersimpan dan email berstatus gagal. Setelah memperbaiki secrets, Coba Lagi mengirim tanpa approval ulang.
7. Jika SMTP timeout atau proses terputus, jangan langsung retry. Pengiriman aktif lebih dari 10 menit tampil sebagai hasil belum pasti; periksa Google Workspace Email Log Search menggunakan ID email di riwayat. Retry memerlukan konfirmasi karena penerima bisa mendapat email ganda.
8. Jika server SMTP sudah menerima email tetapi penyimpanan status gagal, status sementara tetap Mengirim dan kemudian dianggap belum pasti. Tidak ada retry otomatis.
9. Ganti/hapus dokumen dari daftar setelah email terkirim; link lama tetap berfungsi sampai kedaluwarsa. Pastikan link yang sudah berumur lebih dari 24 jam ditolak Storage.
10. Periksa desktop dan HP: pembatas hero datar, kartu tidak terpotong, formulir dan tab Permintaan Download dapat digunakan.

Status **Diterima server email** berarti SMTP menerima pesan; periksa inbox/spam dan log Workspace untuk memastikan delivery. Alamat pengirim, kebijakan Workspace, kuota SMTP, dan jaringan runtime perlu valid sebelum email produksi diaktifkan.

Setelah verifikasi, deploy frontend menggunakan langkah GitHub Pages di atas. Jika ada masalah, batasi akses fitur sementara dan periksa riwayat pengiriman tanpa membuka akses publik file kembali.

Referensi: [SMTP Google Workspace](https://support.google.com/a/answer/176600?hl=en), [App Password Google](https://support.google.com/accounts/answer/185833?hl=en), [batasan Edge Functions Supabase](https://supabase.com/docs/guides/functions/limits), [SMTP Nodemailer](https://nodemailer.com/smtp).

## Mengatur Urutan Carousel Galeri

1. Jalankan `supabase/migrations/20260909000100_gallery_photo_order.sql` di SQL Editor backend yang benar-benar digunakan website (lihat `VITE_SUPABASE_URL`). Migrasi ini membutuhkan tabel galeri dari migrasi sebelumnya. Ini hanya perlu dijalankan sekali sebelum fitur pengurutan dipakai.
2. Deploy frontend. Buka **Admin → Galeri → Foto tersimpan → Atur urutan foto**.
3. Tarik pegangan foto ke foto tujuan untuk mengubah posisinya. Urutan dihitung dari kiri ke kanan lalu baris berikutnya. Di HP gunakan pegangan; area gambar tetap dapat digunakan untuk scroll. Tombol panah dan keyboard kiri/kanan juga tersedia.
4. Klik **Simpan urutan** untuk menerapkan perubahan; **Batal** membuang draft. Urutan berlaku pada carousel Semua dan urutan relatif setiap album. Foto baru ditambahkan di akhir.
5. Jika admin lain mengubah urutan atau menambah/menghapus foto sebelum penyimpanan, sistem menolak snapshot lama. Tutup pengaturan dan refresh halaman sebelum mengatur kembali.

Migrasi mempertahankan urutan foto lama (terbaru dahulu) sebagai urutan awal. Penyimpanan seluruh posisi dilakukan dalam satu transaksi dan hanya admin dapat menjalankan fungsi pengurutan. Galeri publik tetap bisa dimuat dengan urutan lama jika frontend terpasang sebelum migrasi; penyimpanan urutan memerlukan migrasi.

Verifikasi SQL tersedia di `supabase/tests/gallery_photo_order.sql` untuk database pengujian terisolasi setelah migrasi: urutan tersimpan, penolakan non-admin/duplikasi/snapshot lama, dan foto baru di akhir. Fixture di-rollback; sequence tetap bertambah sebagaimana perilaku PostgreSQL. Uji drag di desktop/HP dan dua sesi admin bersamaan sebelum rilis produksi.

## Upload Logo Organisasi

1. Jalankan `supabase/migrations/20260909000200_organization_logo.sql` di SQL Editor backend yang digunakan website. Migrasi menambahkan pengaturan logo tunggal, bucket publik `organization-logos`, dan fungsi simpan yang hanya dapat digunakan admin. Migrasi ini tidak bergantung pada migrasi dokumen atau galeri, tetapi membutuhkan fungsi `public.is_admin()` dari skema awal.
2. Deploy frontend, lalu buka **Admin → Logo Organisasi**. Pilih PNG/JPEG/WebP maksimal 2 MB, periksa preview, lalu klik **Simpan logo**. PNG transparan disarankan.
3. Logo digunakan pada hero, navbar, footer, dan header admin. Gambar ditampilkan utuh dengan proporsi asli. Perubahan langsung memperbarui logo pada sesi admin dan tampil pada kunjungan/refetch berikutnya di beranda.
4. Jika migrasi belum diterapkan atau gambar gagal dimuat, halaman publik tetap menggunakan ikon pengganti. Panel admin menampilkan petunjuk dan tombol muat ulang. Logo baru tidak mengganti logo aktif sebelum penyimpanan berhasil.

Verifikasi di staging: pengunjung dapat membaca logo tetapi tidak dapat upload/mengganti/menghapusnya; hanya admin dapat menyimpan; file logo aktif tidak dapat dihapus melalui Storage API. Uji dua admin mengganti logo bersamaan: perubahan dari snapshot lama harus ditolak. Logo lama dibersihkan setelah logo baru berhasil disimpan; kegagalan pembersihan tidak membatalkan logo baru.

## Error `InvalidWorkerCreation: could not find an appropriate entrypoint`

Error ini terjadi sebelum kode formulir dijalankan: runtime menerima nama function tetapi tidak menemukan entrypoint yang dapat dibaca pada direktori function yang dipakainya. Periksa deployment file dan volume mount, bukan data nama/email atau SMTP.

Pada server Supabase self-hosted, direktori functions yang dimount ke container harus berisi struktur berikut (contoh lokasi host standar `volumes/functions`):

```text
volumes/functions/
├── main/                         # Dispatcher bawaan server: pertahankan
├── request-document-download/
│   └── index.ts
├── review-document-request/
│   └── index.ts
└── _shared/
    ├── authorize.ts
    ├── client.ts
    ├── document-workflow.ts
    ├── http.ts
    └── smtp.ts
```

Salin **tiga direktori** dari `supabase/functions` di repository: `request-document-download`, `review-document-request`, dan `_shared`. Letakkan langsung di direktori functions server; jangan membuat lapisan tambahan seperti `volumes/functions/supabase/functions`. Jangan mengganti dispatcher `main/index.ts` milik server.

Periksa mount aktual container melalui konfigurasi deployment. Path di dalam container berbeda antarversi; gunakan lokasi yang ditunjuk dispatcher/runtime, bukan mengasumsikan selalu `/home/deno/functions` atau `/app/edge-functions`. File `request-document-download/index.ts` harus ada dan dapat dibaca **di dalam container**, bukan hanya pada filesystem host.

Untuk instalasi Docker Compose standar dengan service bernama `functions`, setelah file disalin, jalankan dari direktori Compose server:

```bash
docker compose restart functions
docker compose logs --tail=80 functions
```

Jika nama service berbeda atau memakai panel deployment, restart service Edge Functions yang sesuai. Deploy ulang GitHub Pages hanya memperbarui frontend dan tidak memasang file pada server Supabase. `supabase functions deploy` yang terhubung ke project cloud juga tidak menyalin file ke instalasi self-hosted ini.

Setelah restart, coba kembali pengajuan. Jika error entrypoint tetap muncul, periksa tujuan mount, nama folder (harus persis `request-document-download`), file `index.ts`, dan konfigurasi path dispatcher. Jika error berubah menjadi import/module yang hilang, pastikan `_shared` ikut disalin dan runtime dapat mengunduh dependensi npm yang digunakan.

Referensi: [deployment Edge Functions self-hosted](https://supabase.com/docs/guides/self-hosting/self-hosted-functions).

## Statistik tayangan website

Sebelum deployment frontend, jalankan isi `supabase/migrations/20260910000100_website_views.sql` melalui SQL Editor pada **server Supabase yang dipakai website**. Fitur ini memakai RPC database, sehingga tidak memerlukan Edge Function atau secret tambahan.

Setelah frontend diperbarui, buka beranda lalu masuk ke admin → **Statistik** → **Perbarui**. Tersedia total tayangan, hari ini, 7 hari terakhir, dan 30 hari terakhir (kalender WIB, termasuk hari ini). Setiap pembukaan beranda atau refresh dihitung satu tayangan; halaman login/admin tidak dihitung. Ini bukan pengunjung unik. Data historis sebelum pemasangan tidak bisa diisi kembali. Kegagalan jaringan/pemblokiran request dapat menyebabkan tayangan tidak tercatat; endpoint publik tidak memfilter bot dan bukan metrik audit.

Tabel hanya menyimpan ID peristiwa acak dan waktu server, tanpa nama/email/IP. Akses langsung tabel ditutup untuk pengunjung dan pengguna biasa; RPC statistik memverifikasi `public.is_admin()`. RPC pencatatan hanya menerima UUID dan mengabaikan ID duplikat. Pengunjung tidak dapat menentukan waktu atau mengubah tayangan yang sudah tercatat.

Verifikasi di server pengujian: buka beranda dua kali (total bertambah dua), berpindah section tanpa refresh (tidak bertambah), lalu buka admin/login (tidak bertambah). Pastikan pengguna anonim/non-admin tidak dapat menjalankan `get_website_view_stats` atau membaca/mengubah tabel `website_page_views`. Jika muncul pesan gagal memuat statistik, periksa migrasi dan role admin. Pengujian frontend menggunakan mock RPC; pengujian akses database tetap perlu dijalankan pada server.
