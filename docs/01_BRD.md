# 01 — BRD SI-DATA Satu Data (v0.2 — 2026-09-23)

> **Satu Data Satpol PP & Damkar Kab. Trenggalek** — admin Satu Data untuk pimpinan.

## Dasar Hukum
- **Permendagri No. 27 Tahun 2010** — Pedoman Penyusunan LPPD (definisi & periode seragam).
- Permendagri 86/2017 (perencanaan), Satu Data Indonesia (Perpres 39/2019).

## 3 Data Tematik (Ruang Lingkup)

| Bidang | Contoh | Sumber Sheet |
|---|---|---|
| **1. Ketertiban Umum** | Patroli, operasi trantibum, pengamanan event, gangguan ketertiban | `T_UTAMA` where `kode_tematik=TRANTIBUM` |
| **2. Penegakan Perda** | Penyelidikan PPNS, penindakan Perda/Perkada, Tipiring | `T_UTAMA` where `kode_tematik=GAKDA` |
| **3. Damkar & Penyelamatan Non-Kebakaran** | Kebakaran, evakuasi, banjir, pohon tumbang, sarpras Damkar | `T_UTAMA` where `kode_tematik=DAMKAR` |

## Pengguna
- **Admin Satu Data** (operator) — input & validasi.
- **Verifikator** (Kabid) — verifikasi per bidang.
- **Pimpinan** (Kasatpol) — baca dashboard piramida.

## Ekosistem
- Login `si-platform` SSO, master `SIMPEG` (pegawai/unit/jabatan), **CoreLib pin 17**, **CDN @v2.9.1**.

## Ukuran Sukses
- 3 bidang terdata harian → bulanan, tanpa dobel kode, siap ekspor LPPD.
