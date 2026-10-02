# 02 — Fungsi & Daftar Aksi

> Semua aksi di bawah ini **terdaftar di `02_AppLogic.gs`** dan punya entri role di
> `01_ConfigAndBridge.gs`. Jumlah per 2026-10-02: **59 aksi**.

---

## 1. Halaman

| Halaman | Berkas | Isi |
|---|---|---|
| **Dashboard** | `V_Dashboard.html` | 2 kartu + 4 chart + 2 panel, semua dihitung di server |
| **Transaksi** | `V_Utama.html` | Daftar & form kegiatan, filter + paginasi server |
| **Laporan** | `V_Laporan.html` | 11 laporan, 2 grup tab |
| **Analisa** | `V_Analisa.html` | 7 analisa, grid satu halaman |
| **Evaluasi** | `V_Evaluasi.html` | 4 evaluasi kualitas data |
| **Master** | `V_Master.html` | CRUD 5 master dimensi |
| **Pengaturan** | `V_Pengaturan.html` | Pemilih tema (admin) |
| **Detail** | `V_Detail.html` | Rincian kegiatan + atribut + lampiran + jejak audit |

Pemisahan berkas: `V_*` = tampilan, `J_*` = perilaku. Semuanya di-`include` dari
`Index.html`.

## 2. Aksi menurut kelompok

### Dashboard & transaksi — 8

| Aksi | Level |
|---|---|
| `get_dashboard` | viewer |
| `get_utama_list` | viewer |
| `save_utama` | user |
| `delete_utama` | user |
| `simpan_kegiatan_tematik` | user |
| `update_kegiatan_tematik` | user |
| `get_kegiatan_detail_tematik` | viewer |
| `get_dimensi_for_form` | viewer |

> `simpan_kegiatan_tematik` **selalu menerbitkan id dan kode baru**. Untuk mengubah data
> gunakan `update_kegiatan_tematik`. Memakai yang salah akan menduplikasi baris.

### Master — 13

`get_master_satelit` (viewer) mengambil keenam master sekaligus — ini yang dipakai
frontend. `get_master_options` (viewer) mengambil unit + fungsi untuk cascade form.

CRUD per dimensi, semuanya level `verifikator`:
`save_kategori`, `delete_kategori`, `save_jenis`, `delete_jenis`, `save_periode`,
`delete_periode`, `save_satuan`, `delete_satuan`, `save_lokasi`, `delete_lokasi`.

Diagnosa: `audit_master` (admin).

### Laporan — 11

| Aksi | Isi |
|---|---|
| `lap_kategori` | Rekap per kategori |
| `lap_jenis` | Rekap per jenis |
| `lap_lokasi` | Rekap per lokasi |
| `lap_periode` | Rekap per periode |
| `lap_pegawai` | Rekap per pegawai |
| `lap_status` | Rekap per status |
| `lap_satuan` | Rekap per satuan |
| `lap_jenis_periode` | Matriks jenis × periode |
| `lap_jenis_lokasi` | Matriks jenis × lokasi |
| `lap_detail_utama` | Daftar rinci kegiatan |
| `lap_lampiran` | Rekap lampiran |

Semua level `viewer`.

### Analisa — 7

`analisa_distribusi_lokasi`, `analisa_distribusi_jenis`, `analisa_top_pegawai`,
`analisa_beban_lokasi`, `analisa_korelasi_jenis_lokasi`, `analisa_tren_periode`,
`analisa_umur_data` — semua `viewer`.

### Evaluasi kualitas data — 4

| Aksi | Memeriksa |
|---|---|
| `evaluasi_kelengkapan` | Kegiatan dengan field wajib kosong |
| `evaluasi_kepatuhan_periode` | Jenis periodik tanpa data di tahun berjalan |
| `evaluasi_kualitas_data` | Anomali nilai |
| `evaluasi_lampiran` | Kegiatan tanpa lampiran |

### Lampiran — 3

`get_lampiran_list` (viewer), `upload_lampiran_tematik` (user), `delete_lampiran` (user).

### Analitik lanjutan — 3

`get_top_pegawai`, `get_leaderboard_unit`, `get_heatmap_bulan_grup` — semua `viewer`,
dipakai Dashboard.

### SIMPEG & sesi — 5

`get_my_profile`, `get_pegawai_list`, `get_unit_list`, `get_jabatan_list` (viewer).
`exchange_platform_ticket` dan `logout` ditangani **CoreLib**, bukan aplikasi ini —
keduanya ada di `actionLevels` tapi tanpa handler lokal. Itu normal.

### Sistem & audit — 5

| Aksi | Level | Catatan |
|---|---|---|
| `get_audit_logs` | viewer | Jejak perubahan |
| `save_theme` | admin | Simpan `THEME_JSON` |
| `ping` | viewer | Health check |
| `save` | admin | Routing CRUD generik — jaring pengaman |
| `delete` | admin | Idem |
| `init_database` | super | Pembuatan sheet awal |

> Lima aksi terakhir **tidak dipanggil frontend** dan sengaja dipertahankan sebagai
> cadangan operasional. Semuanya `admin` ke atas.

## 3. Aturan keras

- **Status kegiatan** mengikuti `STATUS_MAP.T_UTAMA`:
  `draft → diajukan → disetujui/ditolak/direvisi → selesai → arsip`.
  Transisi di luar peta ditolak `CoreLib.validateTransition`.
- **Field wajib** saat simpan kegiatan: `tanggal`, `unit_id`, `fungsi_id`, `kategori_id`,
  `jenis_id`, `periode_id`, `lokasi_id`, `uraian`, `jumlah`, `satuan_id`.
- **Tanggal** memakai `CoreLib.todayIsoLocal()` / `dateKey10()` — WIB, bukan UTC.
- **ID** dibuat otomatis dengan prefix per sheet di `localPreSaveHook_`. Jangan isi manual.
- **Aktor** selalu dari sesi nyata. `systemActor_()` (role `super`) hanya boleh dipakai
  oleh seed yang dijalankan manual dari editor.
