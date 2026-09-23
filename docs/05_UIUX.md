# 05 — UIUX SI-DATA Satu Data (v0.3 — CDN v2.9.1)

> **CDN @v2.9.1 1 CSS+9 JS**, Vue 3.5.42, Tailwind TER-COMPILE, tema #065f46 emerald.

## 1. Shell

- `Index.html` — `<?!= getThemeCss() ?>` + 1 CSS+9 JS (`app-core`, `app-components`, `app-modules`, `app-layout`, `app-ui`, `app-forms`, `app-data`, `app-charts`, `app-workflow`) + Vue 3.5.42, Tailwind compiled `A0_Tw` (bukan Play CDN).
- `V_Shell` — `<app-sidebar>` + `<app-header>` + `<app-theme-picker>` di Pengaturan (admin).

## 2. Halaman

| Halaman | Komponen Kit | Filter |
|---|---|---|
| **V_Dashboard** | `app-stat-card` 4, `app-chart-bar` 4, `app-chart-doughnut` 1, `app-panel` 4 | — |
| **V_Master** | `app-crud-table` + `app-pegawai-picker` + `app-filter-bar` | `kode_tematik` |
| **V_Utama** | `app-crud-table` + `app-filter-bar` (5 filter: tematik TRANTIBUM/GAKDA/DAMKAR + tahun + status + search + pegawai adminOnly + `scope Saya/Semua`) + pagination server | `tahun` select, `v-can` gate |
| **V_Laporan** | 12 tab `L1-L12` (badge tematik: TRANTIBUM sky, GAKDA amber, DAMKAR rose) + `app-timeline` | `kode_tematik` |
| **V_Analisa** | 8 tab `A1-A8` + `app-chart-line` |  |
| **V_Evaluasi** | 6 tab `E1-E6` + `app-badge` (selesai/diproses/batal) |  |
| **V_Rtl** | `T_TINDAK_LANJUT` + `app-workflow` FSM |  |

## 3. Aturan UIUX v2

- Nama bukan ID — lookup `pegawai_id→nama`, `pejabat_id→nama` via SIMPEG.
- Tahun/periode = `select` (`tahunOptions`), bukan text bebas.
- Tombol aksi gate `v-can` — fail-closed.
- `min-w` di `th` + `table-scroll`, modal `v-if` + `@close`, tema per app `--primary`.
