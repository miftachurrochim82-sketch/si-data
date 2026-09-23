# 02 — PRD SI-DATA (v0.2)

## Modul (P1–P6) — selaras 3 tematik
- **P1 Dashboard Satu Data** — 4 kartu (total laporan per bidang) + 4 chart (tren TRANTIBUM/GAKDA/DAMKAR) + 4 panel (gap validasi).
- **P2 Master** — 5 master: Klasifikasi Tematik, Pejabat Validasi, Template LPPD, Satuan, Periode.
- **P3 Utama** — `T_UTAMA` (CRUD per `kode_tematik`, filter Saya/Semua, tahun select, paginasi server-side).
- **P4 Piramida Laporan 12** — L1-L12 per bidang (L1 Trantibum harian, L2 Gakda, L3 Damkar, ... L12 rekap LPPD).
- **P5 Analisa 8** — A1-A8 korelasi 3 bidang.
- **P6 Evaluasi 6 + RTL 4** — E1-E6 + R1-R4 generate dari gap tematik.

## Story
- Sebagai admin, saya input laporan `kode_tematik=GAKDA` → masuk validasi Kabid Gakda → pimpinan lihat rekap GAKDA di L2/A2/E2.

## Tech
- CoreLib pin 17 + CDN @v2.9.1 + Vue 3.5.42, scope `pegawai_id`, theme emerald #065f46.
