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
