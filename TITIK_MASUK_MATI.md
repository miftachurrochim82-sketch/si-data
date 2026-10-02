# 45 Titik Masuk Mati — Rincian & Rekomendasi

> ⚠️ **Sudah dieksekusi.** Dokumen ini adalah analisis yang mendahului commit `fdcd2e2`
> dan `14b8093`. Rekomendasinya kini **sudah dijalankan**; angka di badan dokumen adalah
> keadaan sebelum eksekusi dan dibiarkan utuh sebagai riwayat. **Hasil akhirnya ada di
> bagian "Hasil Eksekusi" di paling bawah.**

Dibuat 2026-10-02, setelah commit `11f971f`.

> **Koreksi.** Angka "78" yang saya sebut sebelumnya **salah**. Itu sisa audit lama
> yang diperbarui secara mekanis saat `09_BridgeFrontend.gs` masih ada. Setelah
> bridge dihapus, hitungan sebenarnya adalah **45 dari 102 aksi**.

---

## Apa artinya "titik masuk mati"

Setiap aksi terdaftar di `02_AppLogic.gs` sebagai `h['nama_aksi'] = function(d,u){...}`
dan punya entri role di `actionLevels` (`01_ConfigAndBridge.gs`). Itu membuatnya bisa
dipanggil siapa pun yang berhak lewat `callServer('nama_aksi', …)`.

Sebuah aksi disebut **mati** bila tidak ada satu pun pemanggil di seluruh sistem.
Untuk memastikan, empat jalur dipindai — melewatkan satu saja akan menghasilkan vonis
yang salah:

1. `callServer('literal')` di 18 berkas `.html` → 16 aksi
2. Pemanggilan dinamis lewat tabel `window.SK_MAPS` (`callServer(aksi, …)`) → 35 aksi
3. **Aksi yang dipanggil pustaka CDN sendiri** (`app-core.js`) → 4 aksi
4. Aksi yang dipilih runtime di `J_Actions.html:52` → 2 aksi

Gabungan tanpa duplikat: **57 hidup, 45 mati.**

Jalur ketiga penting. `AppCore` memanggil `exchange_platform_ticket`, `logout`,
`get_my_profile`, dan beberapa aksi master SIMPEG tanpa perantara kode si-data.
Kalau hanya memindai berkas si-data, keempatnya akan divonis mati padahal menopang
alur login.

**Mati ≠ rusak.** Aplikasi berjalan normal. Masalahnya ada tiga:
setiap aksi adalah permukaan serangan yang harus diberi role dan dirawat;
duplikat membuat perubahan harus dilakukan di dua tempat dan mudah tidak sinkron;
dan kode mati menyamarkan fitur yang sebenarnya belum selesai.

---

## A. Punya kembaran identik — 6

Badan handler **sama persis** dengan aksi lain. Murni duplikasi penamaan.

| Hapus | Kembarannya | Status kembaran |
|---|---|---|
| `dashboard` | `get_dashboard` | hidup |
| `get_heatmap` | `get_heatmap_bulan_grup` | hidup |
| `get_config_list` | `get_config` | mati juga (lihat B) |
| `save_config_item` | `save_config` | mati juga |
| `delete_config_item` | `delete_config` | mati juga |
| `get_cross_tab_tematik` | `get_cross_tab_per_grup` | mati juga |

Risiko penghapusan: **nol**.

---

## B. Fitur yang tidak pernah dibangun UI-nya — 14

Backend lengkap, frontend tidak ada sama sekali.

**T_ITEM (4)** — `get_item_list`, `get_item_detail`, `save_item`, `delete_item`
Tabel `T_ITEM` ditandai "legacy — tetap ada" di `01_ConfigAndBridge.gs:237`.

**T_APPROVAL (4)** — `get_approval_list`, `save_approval`, `delete_approval`,
`verifikasi_approval`

> ⚠ **Ini bukan sekadar kode mati, ini fitur yang hilang separuh.**
> Dashboard menampilkan kartu "Menunggu Verifikasi" dan panel daftar approval,
> dan `lap_approval` dipakai halaman Laporan — jadi datanya **ditampilkan**.
> Tapi tidak ada satu pun tombol untuk benar-benar memverifikasi.
> `actionLevels` bahkan sudah menyiapkan role `verifikator` khusus untuknya.
> Menghapus ini berarti memutuskan alur verifikasi memang tidak diperlukan.
> **Perlu keputusan Anda, bukan penghapusan otomatis.**

**Config (3)** — `get_config`, `save_config`, `delete_config`
Tidak ada halaman konfigurasi. `V_Pengaturan.html` hanya mengatur tema.

**Lain (3)** — `get_theme`, `save_my_profile`, `save_lampiran`
`get_theme` tidak terpakai karena tema dibaca lewat scriptlet
`<?!= getThemeCss() ?>` saat render, bukan lewat aksi. `save_lampiran` tumpang tindih
dengan `upload_lampiran_tematik` yang hidup.

---

## C. Digantikan satu aksi gabungan — 6

`get_jenis_list`, `get_kategori_list`, `get_lokasi_list`, `get_periode_list`,
`get_satuan_list`, `get_periode_list_simple`

Semua digantikan `get_master_satelit` yang mengambil keenam master sekaligus dalam
satu panggilan (`J_Api.html:101`). Peninggalan desain lama satu-aksi-per-dimensi.
Risiko penghapusan: **nol**.

---

## D. Tematik generasi lama — 14

`get_ringkasan`, `get_trend_bulanan`, `get_per_fungsi`, `get_per_grup`, `get_per_unit`,
`get_per_lokasi`, `get_kegiatan_list`, `get_perbandingan`, `get_filter_options`,
`get_atribut_detail`, `get_target_list`, `get_target_evaluasi`,
`get_cross_tab_per_grup`, `get_utama_detail`

Berasal dari adopsi "sumber 7 file" (v2.14.0-tematik). Frontend akhirnya memakai jalur
lain: `get_dashboard` untuk ringkasan, `lap_*` untuk laporan, `analisa_*` untuk analisa.

Catatan: menghapus aksi ini **juga** membuat helper di baliknya menjadi yatim
(`getRingkasan_`, `getTrendBulanan_`, `getDataPerFungsi_`, dll). Itulah sumber
penghematan baris yang sesungguhnya — bukan satu baris registrasi per aksi.

---

## E. Generik & sistem — 5: **SARAN SAYA JANGAN DIHAPUS**

| Aksi | Alasan dipertahankan |
|---|---|
| `save` | Routing generik — jaring pengaman CRUD lewat `SK_MAPS` |
| `delete` | Sama |
| `ping` | Health check; murah dan berguna saat diagnosa |
| `init_database` | Dibutuhkan saat penyiapan awal spreadsheet |
| `audit_master` | Diagnosa integritas master; dipanggil manual |

Semuanya `admin`-only di `actionLevels`, jadi permukaan risikonya kecil.

---

## Ringkasan & urutan yang saya sarankan

| Kelompok | Jumlah | Risiko | Saran |
|---|---|---|---|
| A. Kembaran identik | 6 | nol | **hapus** |
| C. Digantikan aksi gabungan | 6 | nol | **hapus** |
| D. Tematik generasi lama | 14 | rendah | **hapus** + helper yatimnya |
| B. Config + T_ITEM + lain-lain | 10 | rendah | **hapus** |
| B. T_APPROVAL | 4 | — | **putuskan dulu**: bangun UI-nya atau buang alurnya |
| E. Generik & sistem | 5 | — | **pertahankan** |

Bila A + C + D + B(non-approval) dihapus: **36 aksi**, menyisakan 66 aksi — dan
helper yatim yang ikut terbuang jauh lebih besar dari 36 baris registrasi.

T_APPROVAL ditahan karena menyangkut fitur, bukan kerapian.

---

# Hasil Eksekusi — 2026-10-02

## Keputusan T_APPROVAL

Pertanyaan "bangun UI-nya atau buang alurnya" **dijawab: buang.** Aplikasi dipakai satu
analis; persetujuan berjenjang tidak diperlukan. Commit `fdcd2e2` mencabut 4 aksi
approval beserta L12, A8, E2, kartu "Menunggu Verifikasi", dan panel daftar approval di
Dashboard. Nol sisa `approval` di seluruh `src/`.

## Penghitungan ulang

Setelah approval dibuang, hitungan diulang dari nol dengan pemindaian **4 jalur**:
literal `callServer`, peta `SK_MAPS`, 9 aksi yang di-dispatch CDN sendiri, dan pasangan
`update`/`simpan_kegiatan_tematik`.

Hasil: **95 aksi → 54 hidup, 41 mati.** Dari 41, sebanyak **36 dihapus** dan 5 kelompok
E dipertahankan.

> Pelajaran: memindai hanya `callServer` menghasilkan positif palsu. Sembilan aksi
> (`exchange_platform_ticket`, `get_jabatan_list`, `get_master_jabatan`,
> `get_master_pegawai`, `get_master_unit`, `get_my_profile`, `get_pegawai_list`,
> `get_unit_list`, `logout`) dipanggil CDN secara internal dan **bukan aksi mati**.

## 36 aksi yang dihapus — commit `14b8093`

**6 kembaran identik** — `dashboard`, `get_heatmap`, `get_config_list`,
`save_config_item`, `delete_config_item`, `get_cross_tab_tematik`

**6 digantikan `get_master_satelit`** — `get_jenis_list`, `get_kategori_list`,
`get_lokasi_list`, `get_periode_list`, `get_satuan_list`, `get_periode_list_simple`

**14 tematik generasi lama** — `get_ringkasan`, `get_trend_bulanan`, `get_per_fungsi`,
`get_per_grup`, `get_per_unit`, `get_per_lokasi`, `get_kegiatan_list`,
`get_perbandingan`, `get_filter_options`, `get_atribut_detail`, `get_target_list`,
`get_target_evaluasi`, `get_cross_tab_per_grup`, `get_utama_detail`

**10 fitur tanpa UI** — T_ITEM (4), Config (3), `get_theme`, `save_lampiran`,
`save_my_profile`

**5 dipertahankan (kelompok E)** — `save`, `delete`, `ping`, `init_database`,
`audit_master`. Semuanya `admin` ke atas, cadangan operasional.

## Penghematan sebenarnya

Dugaan di badan dokumen terbukti benar: nilainya bukan pada 36 baris registrasi,
melainkan pada **21 helper yatim / 346 baris** yang ikut terbuang.

Terbesar: `getCrossTabPerGrupTematik_` (68), `getTargetEvaluasi_` (49),
`getPerbandinganTematik_` (35), `getKegiatanListTematik_` (19),
`writeAuditLogTematik_` (19), `getTrendBulanan_` (17), `getConfigList_` (16),
`getKategoriList_` (15), `getRingkasan_` (14), `getDataPerGrup_` (13),
`saveGeneric_` (12).

Penghapusan dilakukan **iteratif** sampai konvergen (maks 12 putaran), dengan daftar
aman `assertEditorOnly_`, `localPreSaveHook_`, `systemActor_`. Konvergen di putaran 1.

## Keadaan akhir

**59 aksi** — bukan 66 seperti perkiraan di badan dokumen, karena pembuangan approval
mendahului penghitungan ulang. Nol helper yatim, nol aksi tanpa `actionLevels`, nol
aksi frontend tanpa handler. `node --check` lolos seluruhnya.

Daftar 59 aksi beserta levelnya ada di `docs/02_FUNGSI.md`.
