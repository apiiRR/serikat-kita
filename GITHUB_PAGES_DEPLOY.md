# Deploy ke GitHub Pages

Website ini sudah dikonfigurasi untuk di-deploy ke GitHub Pages secara otomatis.

## Langkah-langkah Setup

### 1. Enable GitHub Pages di Repository

1. Buka repository di GitHub: https://github.com/apiiRR/serikat-kita
2. Klik tab **Settings**
3. Di sidebar kiri, klik **Pages**
4. Di bagian **Build and deployment**:
   - Source: **GitHub Actions**
5. Klik **Save**

### 2. Push Perubahan ke GitHub

Jalankan perintah berikut di terminal:

```bash
cd /Users/mobiledeveloperptberdikari/Rafi\ Projects/serikat-kita
git add .
git commit -m "Add GitHub Pages deployment configuration"
git push origin main
```

### 3. Proses Deployment Otomatis

Setelah push, GitHub Actions akan otomatis berjalan:

1. Buka https://github.com/apiiRR/serikat-kita/actions
2. Anda akan melihat workflow **Deploy to GitHub Pages** berjalan
3. Tunggu hingga selesai (biasanya 1-2 menit)
4. Klik workflow tersebut untuk melihat progress

### 4. Akses Website

Setelah deployment selesai:

- URL: https://apiiRR.github.io/serikat-kita/
- Akan muncul di tab **Pages** settings dengan status "Deploy successful"

## Catatan

- Website akan otomatis ter-deploy setiap kali ada push ke branch `main`
- Build artifact tersimpan di folder `dist/`
- Konfigurasi base path sudah diset ke `/serikat-kita/` karena nama repository
