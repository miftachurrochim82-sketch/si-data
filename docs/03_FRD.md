# 03 — FRD SI-DATA Satu Data (v0.3 — Matang)

> **Tematik:** TRANTIBUM / GAKDA / DAMKAR — `kode_tematik` wajib. **CoreLib pin 17** + **CDN @v2.9.1**.

## 1. FR Master (15) — 5 master × 3 aksi

| FR | Aksi | Level | Aturan |
|---|---|---|---|
| FR-01 | `get_klasifikasi_list` | `viewer` | Filter `kode_tematik`, `isActive` |
| FR-02 | `save_klasifikasi` | `verifikator` | `kode` unik via `findUnique`, `nama` wajib |
| FR-03 | `delete_klasifikasi` | `verifikator` | Soft delete, cek dipakai `T_UTAMA` |
| FR-04 | `get_pejabat_list` | `viewer` | Filter `bidang` TRANTIBUM/GAKDA/DAMKAR |
| FR-05 | `save_pejabat` | `verifikator` | `nip` unik |
| FR-06 | `delete_pejabat` | `verifikator` |  |
| FR-07 | `get_template_list` | `viewer` |  |
| FR-08 | `save_template` | `verifikator` |  |
| FR-09 | `delete_template` | `verifikator` |  |
| FR-10 | `get_periode_list` | `viewer` | `tahun` select |
| FR-11 | `save_periode` | `verifikator` |  |
| FR-12 | `delete_periode` | `verifikator` |  |
| FR-13 | `get_satuan_list` | `viewer` |  |
| FR-14 | `save_satuan` | `verifikator` | `kode` unik |
| FR-15 | `delete_satuan` | `verifikator` |  |

## 2. FR Transaksi Utama (8)

| FR | Aksi | Level | Aturan |
|---|---|---|---|
| FR-16 | `get_utama_list` | `viewer` | Filter `kode_tematik`, `tahun`, `status`, `search`, `scope=mine` → `pegawai_id` |
| FR-17 | `save_utama` | `user` | `kode_tematik` in TEMATIK_LIST, `tanggal` → `periodeBulan`, `findUnique` cegah dobel |
| FR-18 | `delete_utama` | `user` | `assertOwnership` (bukan `admin` bisa hapus milik orang) |
| FR-19 | `get_item_list` | `viewer` | `utama_id` |
| FR-20 | `save_item` | `user` |  |
| FR-21 | `delete_item` | `user` |  |
| FR-22 | `get_lampiran_list` | `viewer` |  |
| FR-23 | `save_lampiran` | `user` | `file_url` wajib Drive |

## 3. FR Validasi & Piramida (30)

| Tingkat | FR | Aksi | Level |
|---|---|---|---|
| **Approval** | FR-24 | `verifikasi_utama` | `verifikator` | `draft→diajukan→disetujui/ditolak` via `validateTransition` |
| **Laporan 12** | FR-25–36 | `get_laporan_l1` … `l12` | `viewer` | L1 TRANTIBUM, L2 GAKDA, L3 DAMKAR, … L12 LPPD |
| **Analisa 8** | FR-37–44 | `get_analisa_a1` … `a8` | `viewer` | A1-A8 tren/korelasi |
| **Evaluasi 6** | FR-45–50 | `get_evaluasi_e1` … `e6` | `viewer` | E1-E6 capaian/gap |
| **RTL 4** | FR-51–54 | `get_rtl_r1` … `r4`, `save_rtl`, `update_rtl_status` | `admin` | R1 Trantibum, R2 Gakda, R3 Damkar, R4 Lintas |

## 4. FR Sistem (8)

| FR | Aksi | Level |
|---|---|---|
| FR-55 | `get_dashboard` | `viewer` | 4+4+4 server-side |
| FR-56 | `get_my_profile` | `viewer` |  |
| FR-57 | `save_my_profile` | `viewer` |  |
| FR-58 | `get_config` | `admin` |  |
| FR-59 | `get_theme` | `viewer` | `DEFAULT_THEME` #065f46 |
| FR-60 | `save_theme` | `admin` | `THEME_JSON` |
| FR-61 | `export_laporan` | `viewer` | PDF/Excel |
| FR-62 | `runLibraryTests` | `admin` | PASS 47 |

**Total 62 FR** + 2 native CoreLib = **64 aksi** (starter-kit 86 disesuaikan ke 3 tematik — lebih ramping).

## 5. Aturan Keras

- `kode_tematik` wajib TRANTIBUM/GAKDA/DAMKAR — reject selain itu.
- `periode` = `periodeBulan(tanggal)` — 1 sumber.
- `scope=mine` → `filterByScope_(rows, 'mine', session)` where `row.pegawai_id === session.pegawai_id`.
- `status` FSM: `draft→diajukan→disetujui/ditolak→selesai→arsip` — illegal transition ditolak `validateTransition`.
