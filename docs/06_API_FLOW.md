# 06 — API FLOW SI-DATA (v0.2)

- `doGet` → `HtmlService.createTemplateFromFile('Index')` → SSO ticket `si-platform`.
- `doPost` → `handleAction` → `CoreLib.dispatchAction(payload, getAppConfig_())`.
- `getAppConfig_`: pin 17, `TEMATIK_LIST`, `T_UTAMA.kode_tematik`, resources per tematik, `statusMap`, `periodeBulan`, `get_theme/save_theme`.
- Handler: 86 total — 12 Laporan (L1 TRANTIBUM, L2 GAKDA, L3 DAMKAR, ...), 8 Analisa, 6 Evaluasi, 4 RTL.
- CDN @v2.9.1, Vue 3.5.42, SIMPEG read-only.
