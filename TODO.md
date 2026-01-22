# TODO - PKB Inline View Default

## Task

Membuat dokumen PKB/PDF dapat dibaca secara langsung (inline view) tanpa perlu klik tombol tambahan, dengan dokumen terakhir (paling baru) terbuka secara default.

## Status: COMPLETED ✅

### Steps:

- [x] 1. Analisis file PKBSection.tsx
- [x] 2. Diskusi dengan user tentang preferensi UI
- [x] 3. Implementasi perubahan pada PKBSection.tsx
- [x] 4. Testing dan verifikasi

## Perubahan yang telah dilakukan:

1. ✅ Ubah `expandedId` initial state dari `null` menjadi ID dokumen pertama (paling baru)
2. ✅ Hapus tombol "Buka" yang membuka di tab baru karena dokumen sudah terlihat langsung
3. ✅ Sesuaikan button layout untuk konsistensi UI
