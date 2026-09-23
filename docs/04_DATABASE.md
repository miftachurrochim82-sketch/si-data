# 04 — DATABASE SI-DATA Satu Data (v0.3 — 10 sheet + 3 tematik)

> **Baseline starter-kit 10 sheet** — fleksibel tambah/kurangi. **Kunci Satu Data:** `T_UTAMA.kode_tematik`.

## 1. Sheet & Kolom

### M_KLASIFIKASI — master klasifikasi per tematik

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | text pk | `KLS_<seq>` |
| `kode` | text unik | `TRANTIBUM_PATROLI`, `GAKDA_TIPIRING`, `DAMKAR_KEBAKARAN` |
| `nama_tematik` | enum | TRANTIBUM / GAKDA / DAMKAR |
| `nama` | text | Nama klasifikasi |
| `status` | enum | aktif/nonaktif |
| + audit | | `created_at` … `deleted_at` |

### M_PEJABAT — pejabat validasi per bidang

| Kolom | Tipe |
|---|---|
| `id`, `nama`, `nip`, `bidang` (TRANTIBUM/GAKDA/DAMKAR), `jabatan`, `status` + audit |

### M_TEMPLATE — template LPPD per tematik

| Kolom | Tipe |
|---|---|
| `id`, `kode_tematik`, `nama_template`, `format` (pdf/excel), `status` + audit |

### M_PERIODE — periode pelaporan

| Kolom | Tipe |
|---|---|
| `id`, `tahun` (number), `bulan` (01-12), `label` (2026-09), `status` + audit |

### M_SATUAN — satuan

| Kolom | Tipe |
|---|---|
| `id`, `kode`, `nama` (orang, kejadian, paket, jam) + audit |

### T_UTAMA — transaksi inti Satu Data (1 baris = 1 laporan tematik)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | text pk | `UTM_<tahun>_<seq>` |
| `pegawai_id` | text fk SIMPEG | pemilik (RLS) |
| `tanggal` | date | `todayIsoLocal()` WIB |
| `kode_tematik` | enum **wajib** | TRANTIBUM / GAKDA / DAMKAR |
| `klasifikasi_id` | fk M_KLASIFIKASI |  |
| `pejabat_id` | fk M_PEJABAT | verifikator bidang |
| `uraian` | text | Deskripsi kejadian/laporan |
| `nilai` | number | Kuantitas |
| `satuan_id` | fk M_SATUAN |  |
| `periode` | text | `2026-09` via `periodeBulan(tanggal)` |
| `status` | enum | draft/diajukan/disetujui/ditolak/direvisi/selesai/arsip |
| + audit | |  |

### T_ITEM — rincian per T_UTAMA

| Kolom | Tipe |
|---|---|
| `id`, `utama_id` (fk T_UTAMA), `uraian`, `nilai`, `status` + audit |

### T_LAMPIRAN — bukti foto/dokumen

| Kolom | Tipe |
|---|---|
| `id`, `utama_id`, `file_url` (Drive), `nama_file`, `tipe` + audit |

### T_TINDAK_LANJUT — RTL

| Kolom | Tipe |
|---|---|
| `id`, `evaluasi_id`, `kode_tematik`, `uraian`, `target_selesai`, `status` (baru/proses/selesai/batal), `penanggung_jawab` + audit |

### T_LOGBOOK — log perubahan

| Kolom | Tipe |
|---|---|
| `id`, `utama_id`, `aksi`, `actor`, `waktu`, `detail` + audit |

## 2. Contoh Data

| T_UTAMA | tanggal | kode_tematik | uraian | status |
|---|---|---|---|---|
| UTM_2026_001 | 2026-09-23 | TRANTIBUM | Patroli Jl. Pahlawan — 2 PKL ditertibkan | disetujui |
| UTM_2026_002 | 2026-09-23 | GAKDA | Tipiring Perda No.5 — 1 pelanggar | diajukan |
| UTM_2026_003 | 2026-09-23 | DAMKAR | Kebakaran lahan 2ha — response 12 menit | draft |

## 3. Aturan

- `kode_tematik` wajib TEMATIK_LIST — selain itu reject di `localPreSaveHook_`.
- `periode` auto-isi `periodeBulan(tanggal)` — jangan input manual.
- `pegawai_id` auto-isi `session.pegawai_id` — untuk RLS `mine`.
