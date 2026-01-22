# TODO: Struktur Organisasi Updates

## Task Summary
1. Remove position display from Structure.tsx public view
2. Remove position input from AdminStructure.tsx and use dropdown with predefined department options

## Changes Required

### 1. Structure.tsx
- [x] Remove position field from Member interface
- [x] Remove position display from Ketua Umum card
- [x] Remove position display from Sekretaris & Bendahara cards
- [x] Remove position display from Bidang cards
- [x] Update getDepartmentCategory to use department instead of position

### 2. AdminStructure.tsx
- [x] Remove position field from Member interface
- [x] Remove position field from formData state
- [x] Remove position from resetForm
- [x] Remove position from handleSubmit validation
- [x] Remove position from handleEdit
- [x] Remove position from payload
- [x] Remove position from admin list display
- [x] Add departmentOptions array with predefined options
- [x] Replace Input for "Departemen/Bidang" with Select dropdown

## Predefined Options
- Ketua Umum
- Sekretaris Jenderal
- Sekretaris Umum & Bendahara
- Bidang Hubungan Kerja & PKB
- Bidang Pelatihan & Pengembangan Anggota
- Bidang Advokasi Pekerja & Kebijakan Hukum
- Bidang Komunikasi & Informasi
- Bidang Kesejahteraan Pegawai & Isu Strategis

## Status: ✅ All tasks completed

