# 01 — BRD SI-DATA Satu Data Satpol PP & Damkar Kab. Trenggalek

> **Versi:** v0.3 (Gate 0 — Matang) — 2026-09-23  
> **Dasar hukum:** Permendagri No. 27 Tahun 2010 (LPPD), Perpres No. 39/2019 (Satu Data Indonesia), Perbup Trenggalek (SOTK Satpol PP & Damkar)  
> **Pemilik proses:** Admin Satu Data — Satpol PP & Damkar Kab. Trenggalek

---

## 1. Latar Belakang & Masalah

Satpol PP & Damkar Trenggalek mengelola **3 rumpun data tematik** yang selama ini tercatat terpisah di buku, Excel, dan grup WA:

| Tematik | Contoh yang sering dobel/tidak seragam |
|---|---|
| **TRANTIBUM — Ketertiban Umum** | Patroli, operasi penertiban PKL/bangunan, pengamanan event — tanggal & lokasi sering beda format |
| **GAKDA — Penegakan Perda** | Penyelidikan PPNS, penindakan Perda/Perkada, Tipiring — kode pelanggaran tidak baku |
| **DAMKAR — Kebakaran & Penyelamatan Non-Kebakaran** | Kebakaran, evakuasi, banjir, pohon tumbang, sarpras Damkar — response time tidak terukur |

**Akibat bila tidak ada Satu Data:** pimpinan sulit tarik rekap LPPD (Permendagri 27/2010), laporan dobel, definisi `jenis_laporan` beda antar bidang, dan rekap bulanan manual.

## 2. Tujuan Satu Data

1. **Satu definisi** — `kode_tematik` TRANTIBUM/GAKDA/DAMKAR baku di semua laporan.
2. **Satu kode & periode** — `periode = periodeBulan(tanggal)` seragam bulanan untuk LPPD.
3. **Satu pintu** — Admin Satu Data kelola, Kabid verifikasi per bidang, Kasatpol baca dashboard piramida.
4. **Audit & trace** — setiap perubahan tercatat `created_by/updated_by` + `T_LOGBOOK`.

## 3. Pengguna (Aktor)

| Aktor | Peran di CoreLib | Tugas |
|---|---|---|
| **Admin Satu Data** (operator) | `user` | Input/edit `T_UTAMA` + `T_ITEM` + upload `T_LAMPIRAN` |
| **Kabid Trantibum / Gakda / Damkar** | `verifikator` | Verifikasi `draft→diajukan→disetujui/ditolak` per `kode_tematik` |
| **Kasatpol / Sekdin** | `admin` | Lihat semua + `save_theme`, `generate` rekap LPPD |
| **Viewer** | `viewer` | Baca dashboard & laporan (scope `mine` vs `all`) |

Semua login via **si-platform SSO** (`ticket` 5 menit), master **SIMPEG** (PEGAWAI/UNIT_KERJA/JABATAN) otomatis.

## 4. Batas (Scope) & Di Luar Scope

**Masuk (v0.3):**
- 3 tematik di atas, piramida **Laporan 12 → Analisa 8 → Evaluasi 6 → RTL 4**, dashboard 4+4+4.
- Master 5 + tabel 5 (baseline starter-kit 10 sheet) — fleksibel tambah/kurangi.
- Ekspor PDF/Excel LPPD.

**Di luar v0.3 (backlog):**
- Integrasi SIPD / e-LPPD provinsi (fase 2).
- Peta GIS kejadian (butuh koordinat).
- Notifikasi WA otomatis.

## 5. Ekosistem & Dependensi

| Paket | Versi | Catatan |
|---|---|---|
| **CoreLib** | **v2.4.0 pin 17** PASS 47 | `todayIsoLocal`, `periodeBulan`, `validateTransition`, `getThemeConfig` |
| **Frontend CDN** | **@v2.9.1 1 CSS+9 JS** | `app-*` kit, `AppCore.getMyScope()`, `<app-theme-picker>` |
| **Starter-kit** | **v2.12.0** | 86 handler, 30 output piramida, 22 file |
| **Vue** | **3.5.42** |  |
| **Skor** | `TEMATIK_LIST` | `TRANTIBUM`, `GAKDA`, `DAMKAR` di `T_UTAMA.kode_tematik` |

## 6. Asumsi & Risiko

- **Asumsi:** SIMPEG master sudah isi pegawai Satpol PP & Damkar. `si-platform` sudah daftarkan `SIDATA`.
- **Risiko:** Definisi `jenis_laporan` berubah → mitigasi: `M_KLASIFIKASI` master kelola admin.
- **Risiko:** Data dobel → mitigasi: `findUnique` + `kode_tematik + tanggal + pegawai_id` unik.

## 7. Ukuran Sukses (KPI)

- 100% laporan harian masuk dengan `kode_tematik` benar (< 1% reject).
- Rekap LPPD bulanan (`L12`) ter-generate < 5 detik.
- Dashboard piramida 12-8-6-4 bisa difilter per bidang dalam 1 klik.
