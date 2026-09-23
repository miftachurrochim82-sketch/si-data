# 02 — PRD SI-DATA Satu Data (v0.3 — Matang)

> **Sumber:** Permendagri 27/2010 + Perpres 39/2019. **Ekosistem:** pin 17 @v2.9.1 Vue 3.5.42.

## 1. Peta Modul (P1–P6) — selaras 3 tematik

| Modul | Halaman | Deskripsi | Aktor |
|---|---|---|---|
| **P1 Dashboard Satu Data** | `V_Dashboard` | 4 kartu (total TRANTIBUM/GAKDA/DAMKAR + belum verifikasi) + 4 chart (tren bulanan per bidang + pie sebaran) + 4 panel (validasi, gap, RTL terbaru, aktivitas) — server-side | `viewer` |
| **P2 Master** | `V_Master` | 5 master: M_KLASIFIKASI (tematik), M_PEJABAT (validasi per bidang), M_TEMPLATE (LPPD), M_PERIODE, M_SATUAN — CRUD + `kode` unik | `admin` |
| **P3 Utama (Transaksi)** | `V_Utama` | `T_UTAMA` + `T_ITEM` — input `kode_tematik` TRANTIBUM/GAKDA/DAMKAR, filter 5 (tematik+tahun+status+search+pegawai adminOnly), scope `Saya/Semua`, tahun select, paginasi server | `user` |
| **P4 Piramida Laporan 12** | `V_Laporan` | L1 Trantibum harian, L2 Gakda harian, L3 Damkar harian, L4 Rekap mingguan, L5 Penindakan Perda, L6 Kejadian kebakaran, L7 Penyelamatan, L8 Patroli, L9 Pengamanan event, L10 Sarpras, L11 Rekap bulanan, **L12 Rekap LPPD Permendagri 27/2010** | `viewer` |
| **P5 Analisa 8** | `V_Analisa` | A1 Tren Trantibum, A2 Tren Gakda, A3 Tren Damkar, A4 Korelasi 3 bidang, A5 Response time Damkar, A6 Beban per bidang, A7 SLA penindakan, A8 Sebaran wilayah | `viewer` |
| **P6 Evaluasi 6 + RTL 4** | `V_Evaluasi` + `V_Rtl` | E1 Capaian Trantibum, E2 Gakda, E3 Damkar, E4 Gap terbesar, E5 Kepatuhan LPPD, E6 Rekomendasi → R1-R4 generate dari E1/E2/E3 + manual + FSM `baru→proses→selesai` | `verifikator` → `admin` |

## 2. User Story (inti)

- **US-01** Sebagai **Admin Satu Data**, saya input laporan `TRANTIBUM` (patroli 2026-09-23) → `draft` → `diajukan` (1 klik) agar Kabid Trantibum bisa verifikasi.
  - AC: `kode_tematik` wajib TRANTIBUM/GAKDA/DAMKAR, `tanggal` pakai `todayIsoLocal()`, `periode` auto `2026-09`, validasi `findUnique` cegah dobel `pegawai_id+tanggal+judul`.

- **US-02** Sebagai **Kabid Gakda**, saya filter Laporan `GAKDA` + `status=diajukan` → verifikasi `disetujui/ditolak` dengan catatan.
  - AC: `validateTransition` cegah `draft→selesai` langsung, hanya `diajukan→disetujui/ditolak`.

- **US-03** Sebagai **Kasatpol**, saya buka Dashboard → lihat 4 kartu per bidang + chart tren Gakda naik 12% → klik `L12` rekap LPPD bulanan → export Excel.
  - AC: Dashboard hitung server-side `periodeBulan`, chart `@v2.9.1` `app-chart-bar`.

- **US-04** Sebagai **Viewer**, saya toggle **Saya/Semua** → `Saya` hanya lihat `pegawai_id` saya (RLS `SCOPE_OWNER_FIELD`), `Semua` lihat semua bila `admin`.
  - AC: `AppCore.getMyScope()` → `filterByScope_`.

## 3. Tech & Aturan

- **CoreLib pin 17** + **CDN @v2.9.1 1 CSS+9 JS** + **Vue 3.5.42**.
- **Tema:** `<?!= getThemeCss() ?>` #065f46 emerald + `<app-theme-picker>` di Pengaturan (admin).
- **Tanggal:** `todayIsoLocal()` / `dateKey10()` (WIB), jangan `todayIso()` UTC.
- **Keamanan:** `checkAuth` fail-closed, `v-can` gate tombol, `assertOwnership` di handler.
