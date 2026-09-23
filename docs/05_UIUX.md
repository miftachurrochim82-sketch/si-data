# 05 — UIUX SI-DATA (v0.2 — CDN v2.9.1)

- Shell: `Index.html` 1 CSS+9 JS @v2.9.1, Tailwind TER-COMPILE, `<?!= getThemeCss() ?>` emerald #065f46, `<app-theme-picker>`.
- Filter: `<app-filter-bar>` 5 filter (kode_tematik TRANTIBUM/GAKDA/DAMKAR + tahun + status + search + pegawai adminOnly).
- Tabel: `V_Utama` — nama bukan ID, min-w th, pagination server-side, badge `kode_tematik` (TRANTIBUM sky, GAKDA amber, DAMKAR rose).
- Dashboard: 4 kartu (total per bidang) + 4 chart (tren 3 bidang) + 4 panel (validasi, gap, RTL).
- Modal: `v-if` + `@close`, tema per app `--primary`, role gate `v-can`.
