# 01 — Konteks & Ruang Lingkup

> **Status:** v1.0 — 2026-10-02. Dokumen ini menggambarkan **sistem yang benar-benar
> terpasang**, bukan rancangan. Setiap klaim di sini dapat ditelusuri ke kode di `src/`.

---

## 1. Apa ini

Aplikasi pencatatan dan pelaporan kegiatan untuk Satpol PP & Damkar Kab. Trenggalek,
berjalan di Google Apps Script dengan Google Spreadsheet sebagai basis data.

**Satu kalimat:** mencatat kegiatan beserta dimensinya, lalu menyajikannya kembali sebagai
laporan, analisa, dan evaluasi kualitas data.

## 2. Masalah yang disasar

Pencatatan kegiatan tersebar di buku, Excel, dan grup WA. Akibatnya rekap bulanan
dikerjakan manual, definisi antar bidang tidak seragam, dan tidak ada jejak perubahan.

Semangat **Satu Data Indonesia** (Perpres 39/2019) dan kebutuhan rekap **LPPD**
(Permendagri 27/2010) menjadi latar belakang. Keduanya **konteks dan arah**, bukan fitur
yang sudah terpasang — lihat catatan di `06_UJI_DAN_GAP.md`.

## 3. Pengguna & peran

Login lewat **si-platform SSO** (tiket berumur pendek). Master kepegawaian diambil dari
**SIMPEG** (`PEGAWAI`, `UNIT_KERJA`, `JABATAN`).

| Peran | Hak |
|---|---|
| `viewer` | Baca dashboard, laporan, analisa, evaluasi |
| `user` | Tambah/ubah/hapus kegiatan dan lampiran miliknya |
| `verifikator` | `user` + kelola 5 master dimensi |
| `admin` | Semua + simpan tema + diagnosa master |
| `super` | Semua + `init_database` |

Penjagaan bersifat **fail-closed**: aksi yang tidak terdaftar di `actionLevels` ditolak.
Definisinya ada di `01_ConfigAndBridge.gs` → `getAppConfig_().actionLevels`.

## 4. Ruang lingkup

**Yang ada sekarang**

- Pencatatan kegiatan (`T_UTAMA`) dengan 7 dimensi: unit, fungsi, kategori, jenis,
  periode, lokasi, satuan.
- Atribut dinamis per fungsi (`M_DIMENSI` → `T_ATRIBUT`) — kolom tambahan yang bisa
  diatur tanpa mengubah skema.
- Lampiran berkas ke Google Drive.
- Dashboard 2 kartu + 4 chart + 2 panel.
- 11 laporan, 7 analisa, 4 evaluasi kualitas data.
- Tema yang bisa diganti admin.

**Yang sengaja tidak ada**

| Dibuang | Alasan |
|---|---|
| Peta GIS | Tidak dipakai; menghapus satu dependensi eksternal (Leaflet) |
| RTL / Tindak Lanjut | Skema dan kode tidak pernah cocok — modul tak pernah berfungsi |
| Approval / verifikasi berjenjang | Aplikasi dipakai satu analis; tidak perlu persetujuan |

Riwayat lengkap ada di `AUDIT_SIDATA.md` dan `TITIK_MASUK_MATI.md` di akar repo.

**Belum ada**

- Ekspor LPPD sesuai format Permendagri 27/2010.
- Integrasi SIPD / e-LPPD provinsi.
- Notifikasi otomatis.

## 5. Ekosistem

| Komponen | Versi | Catatan |
|---|---|---|
| **CoreLib** | pin **17** | Pustaka GAS bersama: sesi, dispatcher, CRUD sheet, audit |
| **frontend-cdn** | **v3.0.1** | 1 CSS + 1 JS dari jsDelivr |
| **Vue** | 3.5.42 | dari jsDelivr |
| **Font Awesome** | 6.5.2 | dari jsDelivr |

Hanya tiga dependensi eksternal. Tailwind sudah ter-compile ke dalam berkas CDN, bukan
Play CDN.

## 6. Risiko yang diketahui

| Risiko | Keadaan |
|---|---|
| **`appsscript.json` memakai `ANYONE_ANONYMOUS` + `executeAs: USER_DEPLOYING`** | Semua aksi kini bergating role dan tidak ada lagi fungsi global tanpa penjaga, tapi halaman tetap terbuka ke publik dan setiap eksekusi memakai kuota akun deployer. **Belum diputuskan.** |
| Spreadsheet sebagai basis data | Batas kuota GAS; belum diuji pada volume besar |
| Tiga sheet warisan (`M_KLASIFIKASI`, `M_PEJABAT`, `M_TEMPLATE`) | Ditulis oleh seed tapi tidak pernah dibaca logika bisnis. Kandidat dihapus. |

## 7. Ukuran sukses

- Satu kegiatan tercatat sekali, dengan dimensi lengkap.
- Rekap per dimensi tersedia tanpa olah manual.
- Setiap perubahan punya jejak di `AUDIT_LOGS`.
