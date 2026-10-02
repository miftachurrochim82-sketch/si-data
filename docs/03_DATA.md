# 03 — Struktur Data

> Sumber kebenaran: `ALL_SHEET_HEADERS` dan `LOCAL_SHEETS` di `01_ConfigAndBridge.gs`.
> Kolom audit `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`
> ada di hampir semua sheet dan tidak diulang di tabel bawah.

---

## 1. Tabel inti

### `T_UTAMA` — satu baris = satu kegiatan

| Kolom | Keterangan |
|---|---|
| `id` | PK, dibuat otomatis |
| `kode` | Kode kegiatan, dibuat dari periode |
| `tanggal` | Tanggal kegiatan (WIB) |
| `unit_id` | FK unit kerja (SIMPEG) |
| `fungsi_id` | FK `M_FUNGSI` |
| `kategori_id` | FK `M_KATEGORI` |
| `jenis_id` | FK `M_JENIS` |
| `periode_id` | FK `M_PERIODE` |
| `lokasi_id` | FK `M_LOKASI` |
| `uraian` | Deskripsi kegiatan |
| `jumlah` | Volume |
| `satuan_id` | FK `M_SATUAN` |
| `anggaran` | Nilai rupiah |
| `status` | `draft` … `arsip`, lihat `STATUS_MAP` |
| `keterangan` | Catatan bebas |
| `status_aktif` | Penanda aktif |

> **Catatan penting.** `T_UTAMA` **tidak punya kolom `kode_tematik`**. Dokumen rancangan
> versi lama menyebutnya sebagai kunci wajib; itu tidak pernah terpasang.

### `T_ATRIBUT` — atribut dinamis per kegiatan

`id`, `kegiatan_id`, `dimensi_id`, `nilai_id`, `nilai_text`, `nilai_number`,
`nilai_date`, `keterangan`, `status_aktif`

Inilah mekanisme kolom tambahan: setiap `M_FUNGSI` boleh punya `M_DIMENSI` sendiri,
nilainya disimpan di sini tanpa mengubah skema `T_UTAMA`.

### `T_LAMPIRAN`

`id`, `kegiatan_id`, `nama_file`, `tipe`, `file_url` (Drive), `deskripsi`, `status_aktif`

### `T_PESERTA`

`id`, `kegiatan_id`, `pegawai_id`, `peran`, `status_aktif`

### `T_LOGBOOK`

`id`, `tanggal`, `pegawai_id`, `kegiatan_id`, `uraian`, `status_aktif`

### `AUDIT_LOGS`

`id`, `timestamp`, `user`, `aksi`, `tabel`, `record_id`, `data_lama`, `data_baru`,
`keterangan`, `status` — dikelola CoreLib.

---

## 2. Master dimensi — 5, dikelola lewat UI

| Sheet | Kolom khas |
|---|---|
| `M_KATEGORI` | `kode`, `nama`, `parent_id` (hierarki), `urutan`, `deskripsi` |
| `M_JENIS` | `kode`, `nama`, `kategori_id`, `periode` (Tahunan/Bulanan/Periodik) |
| `M_PERIODE` | `kode`, `label`, `tahun`, `bulan` |
| `M_SATUAN` | `kode`, `nama`, `simbol`, `keterangan` |
| `M_LOKASI` | `kode`, `nama`, `alamat`, `keterangan` |

## 3. Master fungsi & tematik — dikelola langsung di sheet

| Sheet | Kolom khas | Peran |
|---|---|---|
| `M_FUNGSI` | `kode`, `nama`, `parent_id`, `unit_id`, `level`, `urutan` | Pohon fungsi per unit |
| `M_DIMENSI` | `kode`, `nama`, `jenis_input`, `fungsi_id`, `urutan` | Definisi atribut dinamis |
| `M_NILAI_DIMENSI` | `dimensi_id`, `kode`, `nama`, `urutan` | Pilihan nilai untuk dimensi |
| `M_TARGET` | `kode`, `nama_target`, `fungsi_id`, `periode_id`, `unit_id`, `target_kegiatan`, `target_anggaran`, `target_volume` | Target capaian |

## 4. Sheet warisan — ada tapi tidak dipakai

| Sheet | Keadaan |
|---|---|
| `M_KLASIFIKASI` | Ditulis `07_SeedSatuData.gs`, **tidak pernah dibaca** logika bisnis |
| `M_PEJABAT` | Idem |
| `M_TEMPLATE` | Idem |
| `T_ITEM` | Ditandai "legacy" di kode; nol aksi, nol UI |

Keempatnya masih punya definisi skema sehingga `init_database` tetap membuatnya.
**Kandidat dihapus** — belum dieksekusi karena perlu keputusan apakah data di dalamnya
masih bernilai.

## 5. Peta status

Hanya `T_UTAMA` yang punya mesin status:

```
draft     → diajukan, arsip
diajukan  → disetujui, ditolak, direvisi
direvisi  → diajukan, arsip
disetujui → selesai, arsip
ditolak   → diajukan, arsip
selesai   → arsip
arsip     → (akhir)
```

Ditegakkan `CoreLib.validateTransition` lewat `localPreSaveHook_`.

## 6. Aturan penulisan

- `id` dibuat otomatis dengan prefix per sheet. Mengisi manual berisiko menimpa data.
- Penghapusan bersifat **soft delete** (`deleted_at` diisi), bukan hapus baris.
- `status_aktif` menandai aktif/nonaktif, berbeda dari `deleted_at`.
- Penyimpanan melalui `CoreLib.apiSave` dengan daftar kolom `ALL_SHEET_HEADERS` sebagai
  whitelist — field di luar daftar diabaikan, termasuk `_cacheBust` dari frontend.
