# 07 — TESTCASE SI-DATA Satu Data (v0.3)

> **CoreLib v2.4.0 pin 17** — `runLibraryTests()` **PASS 47 / FAIL 0 / SKIP 1**.

## 1. Library

| TC | Aksi | Harapan |
|---|---|---|
| TC-01 | `runLibraryTests()` | PASS 47 |
| TC-02 | `todayIsoLocal()` WIB | `2026-09-23` bukan `2026-09-22` (UTC) |

## 2. Domain Satu Data

| TC | Aksi | Harapan |
|---|---|---|
| TC-03 | `save_utama` `kode_tematik=TRANTIBUM` | sukses |
| TC-04 | `save_utama` `kode_tematik=SALAH` | reject `kode_tematik tidak valid` |
| TC-05 | `save_utama` dobel `pegawai_id+tanggal+judul` | reject `findUnique` |
| TC-06 | `periodeBulan('2026-09-23')` | `2026-09` |
| TC-07 | `validateTransition` `draft→selesai` | reject |
| TC-08 | `filterByScope_` `scope=mine` | hanya milik sendiri |
| TC-09 | `get_laporan_l12` LPPD bulanan | agregasi 3 bidang benar |
| TC-10 | `save_theme` non-admin | reject `admin` |

## 3. Piramida

| TC | Aksi | Harapan |
|---|---|---|
| TC-11 | `get_analisa_a1` Trantibum | hitung tren benar |
| TC-12 | `get_evaluasi_e1` + `generate_rtl` | RTL ter-generate dari E1 |

