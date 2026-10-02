# 45 Titik Masuk Mati — Rincian & Rekomendasi

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
