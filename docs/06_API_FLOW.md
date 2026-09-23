# 06 — API FLOW SI-DATA Satu Data (v0.3)

> **pin 17** + **@v2.9.1** + **Permendagri 27/2010**.

## 1. Alur

```
Browser --ticket--> si-platform --exchange--> session (APP_SESSION_SIDATA_)
Browser --token--> doPost({action, data}) --> handleAction --> CoreLib.dispatchAction(payload, getAppConfig_()) --> handler --> sheet
```

## 2. getAppConfig_

| Field | Nilai |
|---|---|
| `appCode` | `SIDATA` |
| `masterSsId` | SIMPEG `1HvMX...` |
| `TEMATIK_LIST` | `TRANTIBUM`, `GAKDA`, `DAMKAR` |
| `resources` | `T_UTAMA: {ownerField: 'pegawai_id'}`, `pelaporan: {sheetName: 'T_UTAMA', hooks: {preSave: localPreSaveHook_}}` |
| `statusMap` | `T_UTAMA: draft→diajukan→disetujui/ditolak→selesai→arsip` |
| `actionLevels` | `get_theme: viewer`, `save_theme: admin`, `verifikasi_utama: verifikator` |
| `localHandlers` | `get_theme`, `save_theme`, `dashboard`, `laporan_12`, `analisa_8`, `evaluasi_6`, `rtl_4` |

## 3. Handler PirAmida

- **Laporan 12:** `get_laporan_l1` (TRANTIBUM harian) … `l12` (LPPD rekap) — `dalamPeriode` + `periodeBulan`.
- **Analisa 8:** `get_analisa_a1` … `a8` — agregasi per `kode_tematik`.
- **Evaluasi 6:** `get_evaluasi_e1` … `e6` — hitung `hitungHariKerja`.
- **RTL 4:** `get_rtl_r1` … `r4`, `save_rtl`, `update_rtl_status` — generate dari `E1/E2/E3`.

## 4. Util

- `todayIsoLocal()` (WIB), `periodeBulan(tanggal)` → `2026-09`, `findUnique` cegah dobel `kode`.
