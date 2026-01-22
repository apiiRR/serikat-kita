# Mengatasi Error SSH saat Deploy

Error yang muncul:

```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

Ini terjadi karena `gh-pages` menggunakan SSH untuk mengakses GitHub.

---

## Solusi: Ubah Remote URL ke HTTPS

Jalankan perintah berikut:

```bash
cd /Users/mobiledeveloperptberdikari/Rafi\ Projects/serikat-kita

# Ubah remote URL dari SSH ke HTTPS
git remote set-url origin https://github.com/apiiRR/serikat-kita.git

# Cek perubahan
git remote -v
# Output harus:
# origin  https://github.com/apiiRR/serikat-kita.git (fetch)
# origin  https://github.com/apiiRR/serikat-kita.git (push)
```

---

## Lalu Jalankan Deploy Lagi

```bash
npm run deply
```

Saat diminta login:

- **Username:** apiiRR
- **Password:** Personal Access Token dari https://github.com/settings/tokens

---

## Cara Buat Personal Access Token

1. Buka https://github.com/settings/tokens
2. Klik **Generate new token (classic)**
3. Note: `gh-pages-deploy`
4. Expiration: No expiration
5. Centang **repo** (full control of private repositories)
6. Klik **Generate token**
7. **SIMPAN TOKEN** - Gunakan sebagai password saat deploy
