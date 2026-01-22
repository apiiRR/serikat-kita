# Deploy ke GitHub Pages

Website ini sudah dikonfigurasi untuk di-deploy ke GitHub Pages menggunakan `gh-pages`.

## Cara Deploy

### 1. Setup SSH Key (sekali saja)

Pastikan SSH key Anda sudah ditambahkan ke GitHub:

1. Buka https://github.com/settings/keys
2. Klik **New SSH key**
3. Paste public key Anda (cek `~/.ssh/id_rsa.pub`)

### 2. Deploy dengan Perintah Berikut

Jalankan di terminal:

```bash
cd /Users/mobiledeveloperptberdikari/Rafi\ Projects/serikat-kita
npm run deply
```

### 3. Proses Deployment

1. Perintah akan otomatis:
   - Build project ke folder `dist/`
   - Deploy ke branch `gh-pages`
2. Tunggu hingga selesai (biasanya 1-2 menit)

### 4. Akses Website

Setelah deployment selesai:

- URL: https://apiiRR.github.io/serikat-kita/

## Catatan

- Website akan ter-deploy ke branch `gh-pages` secara otomatis
- Build artifact tersimpan di folder `dist/`
- Untuk deploy ulang, cukup jalankan `npm run deply` lagi
