# 06 — Pengujian & Daftar Gap

---

## Bagian A — Pengujian

Tidak ada kerangka uji otomatis. Verifikasi dilakukan dengan **pemeriksaan statis** dan
**uji manual**.

### A.1 Pemeriksaan statis — dijalankan sebelum tiap commit

| # | Pemeriksaan | Cara |
|---|---|---|
| S1 | Sintaks `.gs` | Salin `*.gs` → `*.js`, `node --check` |
| S2 | Sintaks `<script>` di HTML | Ekstrak blok (lewati yang mengandung `<?`), `node --check` |
| S3 | Setiap aksi punya level | Bandingkan kunci `h['...']` dengan `actionLevels` |
| S4 | Tidak ada helper yatim | Fungsi `^function (\w+_)\s*\(` yang muncul ≤1 kali |
| S5 | Tidak ada aksi hilang | Semua aksi di `callServer` + `SK_MAPS` punya handler |

Hasil per 2026-10-02: **S1–S5 semuanya lulus.** 59 aksi, 61 entri `actionLevels`
(2 selisih = `exchange_platform_ticket` dan `logout`, milik CoreLib — normal).

> Jebakan yang sudah terbukti: deteksi "fungsi tidak terdefinisi" lewat regex
> menghasilkan positif palsu dari literal regex (`/atr_(\d+)/`), metode pustaka
> (`CoreLib.checkRole_`), dan fungsi bersarang terindentasi. Selalu `grep` sebelum
> menyimpulkan kerusakan.

### A.2 Uji manual

| # | Skenario | Diharapkan |
|---|---|---|
| T1 | Login lewat si-platform | Masuk dashboard dengan role benar |
| T2 | Simpan kegiatan baru | Baris baru, id + kode otomatis, tercatat di audit |
| T3 | Ubah kegiatan lewat `update_kegiatan_tematik` | Baris **ter-update**, bukan terduplikasi |
| T4 | Field wajib dikosongkan | Ditolak dengan pesan jelas |
| T5 | Transisi status di luar `STATUS_MAP` | Ditolak |
| T6 | `viewer` mencoba `save_utama` | Ditolak sebelum handler jalan |
| T7 | `user` mencoba `save_kategori` | Ditolak (butuh `verifikator`) |
| T8 | Aksi tidak dikenal | Ditolak fail-closed |
| T9 | Unggah lampiran | Berkas di Drive, baris di `T_LAMPIRAN` |
| T10 | Hapus kegiatan | Soft delete, hilang dari daftar, tetap di sheet |
| T11 | Buka tiap halaman | 11 laporan + 7 analisa + 4 evaluasi terisi tanpa galat |
| T12 | Ganti tema sebagai admin | Tersimpan dan bertahan setelah muat ulang |
| T13 | Dimensi dinamis per fungsi | Form menampilkan atribut sesuai `M_DIMENSI` |
| T14 | Paginasi transaksi | Halaman berpindah tanpa menarik seluruh sheet |

---

## Bagian B — Gap

### B.1 Gap yang sudah ditutup

| # | Gap | Penutup |
|---|---|---|
| G01 | Dua permukaan API; 39 fungsi global tanpa penjaga | `11f971f` — `09_BridgeFrontend.gs` dihapus |
| G02 | Tailwind Play CDN + aset tak terkunci | Migrasi `frontend-cdn` v3.0.1 |
| G03 | Modul Peta tak terpakai + dependensi Leaflet | `95a78c7` |
| G04 | Modul RTL dengan skema tak cocok | `95a78c7` |
| G05 | Alur approval yang tak pernah dipakai | `fdcd2e2` |
| G06 | 36 aksi mati + 21 helper yatim (346 baris) | `14b8093` |

Dampak kumulatif: **32 → 28 berkas**, **8.361 → 6.021 baris (−28%)**,
**117 → 59 aksi**, **2 → 1 permukaan API**, **39 → 0 fungsi tanpa penjaga**.

### B.2 Gap terbuka

| # | Gap | Dampak | Usul |
|---|---|---|---|
| **G07** | **Dokumen rancangan lama menyimpang total dari implementasi** | Spesifikasi menyesatkan selama pengembangan | **Ditutup dokumen ini** — lihat B.3 |
| G08 | `appsscript.json` `ANYONE_ANONYMOUS` + `executeAs USER_DEPLOYING` | Halaman terbuka publik; kuota deployer terbebani | Pindah ke `ANYONE` setelah alur SSO CoreLib dipastikan |
| G09 | 4 sheet warisan tak terpakai (`M_KLASIFIKASI`, `M_PEJABAT`, `M_TEMPLATE`, `T_ITEM`) | Seed menulis data yang tak pernah dibaca | Hapus skema + seed bila datanya memang tak bernilai |
| G10 | `04_CrudTematik.gs` memakai literal `'prd_'` / `'atr_'` (baris 18, 47, 55) | Pecah bila prefix diubah | Rujuk `idPrefix` dari `getAppConfig_()` |
| G11 | Tanpa uji otomatis | Regresi hanya tertangkap manual | Pertahankan S1–S5 sebagai gerbang minimum |
| G12 | Aksesibilitas belum diaudit | Tidak diketahui | Audit keyboard + ARIA |
| G13 | Belum ada ekspor LPPD / integrasi SIPD | Rekap akhir masih manual | Rancang setelah format resmi dipastikan |

### B.3 Catatan — mengapa dokumen ini ditulis ulang

Delapan dokumen SDLC sebelumnya (`01_BRD` … `08_GAP_LIST`, 375 baris) ditulis **sebelum**
implementasi dan tidak pernah direkonsiliasi. Uji silang dokumen-vs-kode menemukan:

| Klaim dokumen lama | Kenyataan di `src/` |
|---|---|
| `T_UTAMA.kode_tematik` "kunci Satu Data", wajib | Kolom tidak ada |
| `TRANTIBUM` / `GAKDA` / `DAMKAR` di semua laporan | Nol sebutan di 18 berkas `.html` |
| Master `M_KLASIFIKASI`, `M_PEJABAT`, `M_TEMPLATE` aktif | Hanya skema + seed; nol CRUD, nol UI |
| 62 FR (`get_laporan_l1`…`l12`, `get_analisa_a1`…`a8`, `get_rtl_r1`…`r4`, `verifikasi_utama`, `export_laporan`) | **Nol** dari semuanya ada |
| Piramida "L1 Trantibum harian / L12 Rekap LPPD" | Yang ada: laporan per dimensi generik |
| 10 sheet termasuk `T_TINDAK_LANJUT` | RTL sudah dihapus |
| G02/G04/G05 "✅ TUTUP" | Ditutup untuk hal yang tak pernah dibangun |

Karena penyimpangan bersifat menyeluruh — bukan sekadar angka basi — menggabungkan 8
dokumen menjadi 6 hanya akan menghasilkan 6 dokumen yang tetap keliru. Keenam dokumen
sekarang ditulis ulang dari `src/`.

**Aturan ke depan: `src/` adalah satu-satunya sumber kebenaran.** Dasar hukum
Permendagri 27/2010 dan Perpres 39/2019 dipertahankan di `01_KONTEKS.md` sebagai konteks
dan arah, bukan sebagai klaim fitur terpasang.
