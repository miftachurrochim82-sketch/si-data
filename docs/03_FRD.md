# 03 — FRD SI-DATA (v0.2)

## FR Utama
- FR-01 `save_utama` (user, guard `kode_tematik` in TEMATIK_LIST).
- FR-02 `get_utama_list` (viewer, filter `kode_tematik`, `scope=mine` → `pegawai_id`).
- FR-03 `verifikasi_utama` (verifikator, validateTransition `draft→diajukan→disetujui`).
- FR-04 `get_dashboard` (viewer) — agregasi per `kode_tematik`.
- FR-05 `get_laporan_12` (viewer) — 12 tab laporan per bidang.
- FR-06 `get_tema`/`save_tema` (admin, theme #065f46).

## Aturan
- `kode_tematik` wajib TRANTIBUM/GAKDA/DAMKAR (Permendagri 27/2010).
- `periode` = `periodeBulan(tanggal)` — konsisten bulanan untuk LPPD.
- Scope Saya = `row.pegawai_id === session.pegawai_id`.
