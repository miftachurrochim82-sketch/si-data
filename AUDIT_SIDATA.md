# AUDIT — `si-data`

Tanggal: 2026-10-02 · Commit: `aec80a2` · 4.452 baris `.gs` + 3.893 baris `.html`

> ⚠️ **Dokumen ini adalah catatan audit bertanggal, bukan deskripsi sistem sekarang.**
> Angka di badan dokumen menggambarkan keadaan pada saat tiap tahap ditulis dan sengaja
> dibiarkan utuh sebagai riwayat. **Keadaan terkini ada di bagian "Status Akhir" di
> paling bawah.** Untuk deskripsi sistem, lihat `docs/`.

---

## 🔴 Temuan paling penting: lubang otorisasi

Ini bukan soal kerapian. Ini harus dibereskan sebelum aplikasi dipakai di kantor.

**`09_BridgeFrontend.gs` memiliki 39 fungsi global tanpa satu pun pemeriksaan role.**

```
grep -c "requireRole|checkRole|dispatchAction|getSession" 09_BridgeFrontend.gs
→ 0
```

Padahal `appsscript.json` menyatakan:

```json
"webapp": {
  "executeAs": "USER_DEPLOYING",
  "access":    "ANYONE_ANONYMOUS"
}
```

Artinya: **siapa pun yang punya URL, tanpa login**, bisa membuka console browser dan menjalankan

```javascript
google.script.run.hapusKegiatan('abc123')
google.script.run.updateTarget({ id: '...', nilai: 999 })
google.script.run.cleanAuditLogsOlderThan(0)     // hapus seluruh jejak audit
google.script.run.getLogbookList()                // baca data pegawai
```

…dan kode itu berjalan **sebagai akun yang men-deploy**, dengan akses penuh ke spreadsheet.

Lebih jauh, `simpanKegiatan()` memanggil `systemActor_()` yang mengembalikan `role: 'super'`.
Jadi penulis anonim tidak hanya lolos pemeriksaan — ia tercatat sebagai **super user**.

Fungsi bridge yang mengubah data: `simpanKegiatan`, `updateKegiatan`, `hapusKegiatan`,
`simpanTarget`, `updateTarget`, `simpanPeserta`, `hapusPeserta`, `simpanLogbook`,
`cleanAuditLogsOlderThan`, `upload/hapus atribut`.

Jalur satunya lagi — `handleAction` → `CoreLib.dispatchAction` — **punya** gating
fail-closed lewat `actionLevels` (101 aksi, semua bertingkat role). Pengamanannya ada.
Masalahnya ada pintu kedua yang tidak dijaga sama sekali.

> Risiko saat ini rendah karena belum dipakai di kantor. Tapi ini **blocker deploy**.

---

## Akar masalahnya: dua API paralel untuk hal yang sama

| Jalur | Titik masuk | Dipakai frontend | Gating role |
|---|---|---|---|
| `handleAction` → `dispatchAction` | **101** aksi | 52 | ✅ `actionLevels`, fail-closed |
| `google.script.run` → `09_BridgeFrontend` | **39** fungsi | 10 | ❌ tidak ada |
| **Total** | **140** | **62 (44%)** | |

**56% titik masuk tidak dipakai siapa pun.**

Dan keduanya sering membungkus helper yang sama:

```javascript
// 09_BridgeFrontend.gs
function getTopPegawai(filter, limit){ return getTopPegawai_(filter||{}, limit||10); }

// 02_AppLogic.gs
h['get_top_pegawai'] = function(d,u){ return getTopPegawai_(d||{}, d.limit||10); };
```

Kemampuan yang sama, dua pintu, satu dijaga satu tidak. Inilah over-engineering
yang kamu rasakan — bukan jumlah fitur, tapi **dua konvensi hidup berdampingan**
karena yang lama tidak pernah dipensiunkan.

Pasangan alias di dalam satu jalur pun ada: `get_config`/`get_config_list`,
`save_config`/`save_config_item`, `get_dashboard`/`dashboard`,
`get_tindak_lanjut_list`/`rtl_get_list`, dan 7 pasangan `rtl_*` lainnya.

---

## Kode yang menggantung

| | |
|---|---|
| Fungsi produksi `.gs` | 189 |
| Tidak terjangkau dari titik masuk hidup | **41** |
| Baris di fungsi tersebut | **408** (10% dari 4.050 baris produksi) |

Terbesar: `getCrossTabTematik` (52), `getTematikPanels` (45), `getLogbookList` (32),
`updateKegiatan` (20), `writeAuditLogTematik_` (18), `updateTarget` (17).

> **Catatan kejujuran:** 10% jauh lebih kecil daripada 71% yang ditemukan di CDN.
> Backend-mu tidak seboros pustaka komponennya. Memangkas 408 baris tidak akan
> terasa banyak — yang benar-benar menyederhanakan adalah **menghapus satu jalur API
> utuh**, bukan memburu baris mati satu per satu.

Dalam penghitungan ini saya mengecualikan titik masuk manual yang disengaja
(`seedSatuData`, `setupApp`, `initDatabase`) dan callback yang dioper tanpa tanda
kurung (`localPreSaveHook_`) — dua hal yang sempat salah saya vonis mati pada
hitungan pertama.

---

## Rekomendasi, berurut

### 1. 🔴 Tutup lubang otorisasi — sebelum apa pun
Dua pilihan:

- **(a) Hapus `09_BridgeFrontend.gs`**, pindahkan 10 fungsi yang masih dipakai ke
  `actionLevels` + `buildLocalHandlers_`. Frontend mengganti 19 pemanggilan
  `google.script.run.x()` menjadi `callServer('x')`.
  → satu jalur, satu konvensi, gating otomatis. **Saya rekomendasikan ini.**
- **(b) Tambahkan pemeriksaan role di setiap fungsi bridge.**
  Lebih cepat, tapi mempertahankan dua jalur dan 31 fungsi bridge mati.

Apa pun pilihannya, `systemActor_()` jangan dipakai sebagai aktor untuk tulisan
yang berasal dari permintaan pengguna.

### 2. Pertimbangkan `access: ANYONE_ANONYMOUS`
Kalau aplikasi ini memang untuk pegawai ber-SSO, `ANYONE` (wajib login Google)
memberi lapisan identitas gratis. Anonim hanya masuk akal bila ada halaman publik.

### 3. Hapus 78 titik masuk yang tidak dipakai
63 aksi + 31 fungsi bridge. Ini aman setelah langkah 1, dan menghapus ~408 baris
plus 78 baris registrasi.

### 4. Satukan alias
11 pasangan aksi yang menunjuk implementasi sama. Pilih satu nama per kemampuan.

### 5. Baru rapikan dokumen
8 dokumen → 4 (`README`, `AI_CONTEXT`, `docs/01_RANCANGAN`, `docs/02_DATA`,
`docs/03_UJI`). Dampaknya paling kecil, jadi paling akhir.

---

## Yang sudah baik — jangan diubah

- `actionLevels` fail-closed dengan 101 aksi bertingkat role: desainnya benar.
  Masalahnya bukan di sini, melainkan ada pintu yang melewatinya.
- Delegasi ke `CoreLib` untuk sheet/CRUD/sesi: tepat, tidak ada duplikasi mekanik.
- `.clasp.json` tidak di-commit: benar.
- Pemisahan `V_*` (tampilan) dan `J_*` (logika): rapi dan konsisten.
- `99_TestSuite.gs` dengan 16 fungsi uji: aset, bukan beban.


---

## Addendum — 2026-10-02: Peta & RTL dihapus

Keputusan user. Dieksekusi pada commit ini.

### Peta
Dua berkas penuh (`V_Peta.html`, `J_Peta.html`), fungsi bridge `getPetaKegiatan` +
`getGeoJSONContent`, aksi `get_peta_kegiatan`, folder Drive `GEOJSON`, dan dependensi
eksternal Leaflet 1.9.4. Keduanya sudah masuk daftar titik masuk mati pada audit di atas —
tidak satu pun dipanggil frontend.

### RTL — alasan sebenarnya bukan "manfaat kecil"

Modul ini **tidak pernah berjalan ujung-ke-ujung**. Skema sheet `T_TINDAK_LANJUT`
mendeklarasikan kolom bisnis `uraian`, `target_selesai`, `penanggung_jawab`, `evaluasi_id`,
`kode_tematik`. Seluruh kode membaca dan menulis kolom lain: `judul_rtl`, `status_rtl`,
`sumber_evaluasi`, `due_date`, `progress_pct`, `assigned_to`, `deskripsi`, `catatan`.
**Nol irisan pada field bisnisnya.**

Akibatnya `saveTindakLanjut_` memvalidasi `judul_rtl` yang tak punya kolom,
`getTindakLanjutList_` menyortir `due_date` yang selalu kosong, dan `evaluasiRtlTerbuka_`
memfilter `status_rtl` yang tak pernah terisi. Mempertahankannya berarti menulis ulang dari
nol, bukan merawat.

Yang dibuang: 7 fungsi di `02_AppLogic.gs`, 12 aksi + 12 entri `actionLevels` (6 pasang alias
`*_tindak_lanjut` ↔ `rtl_*` — ini juga menutup 6 dari 11 pasangan alias yang dicatat audit),
`V_Rtl.html`, state machine `T_TINDAK_LANJUT` di `STATUS_MAP`, hook `status_rtl`/`progress_pct`
di `localPreSaveHook_`, `testDomainRtl`, dan helper yatim `badgeStatusRtl` +
`badgeSumberEvaluasi`.

### Evaluasi dipertahankan
E1–E5 berdiri sendiri dan tetap jalan. Yang dicabut hanya kaitan RTL-nya: panel E6, dua tombol
"Generate RTL", kartu "RTL Terbuka" + panel "RTL Berjalan" di Dashboard.
Dashboard kini 3 kartu + 4 chart + 3 panel.

### Hasil

| | Sebelum | Sesudah | Selisih |
|---|---|---|---|
| Berkas `src/` | 32 | 29 | **−3** |
| Baris | 8.361 | 7.003 | **−1.358 (16%)** |
| Aksi dispatch | 117 | 101 | −16 |
| Fungsi bridge | 41 | 39 | −2 |
| Titik masuk | 158 | 140 | −18 |
| Pasangan alias | 11 | 5 | −6 |
| Dependensi eksternal | Vue, Tailwind, FontAwesome, Leaflet | Vue, Tailwind, FontAwesome | −1 |

Diverifikasi: `node --check` lolos untuk 10 berkas `.gs` dan seluruh blok `<script>` di 18
berkas `.html`; nol sebutan tersisa untuk `rtl`/`peta`/`geojson`/`leaflet`/`tindak_lanjut`;
nol aksi tanpa entri `actionLevels`; nol fungsi yatim.

**Lubang otorisasi `09_BridgeFrontend.gs` belum ditutup** — masih 39 fungsi tanpa
pemeriksaan role. Itu tetap blocker deploy dan jadi langkah berikutnya.

---

# Status Akhir — 2026-10-02, commit `14b8093`

Bagian ini menggantikan seluruh angka di atas. Angka di atas adalah riwayat per tahap.

## Perjalanan lengkap

| | Awal audit | Sekarang | Selisih |
|---|---|---|---|
| Berkas `src/` | 32 | **27** | −5 |
| Baris | 8.361 | **6.021** | **−2.340 (−28%)** |
| Aksi dispatch | 117 | **59** | −58 |
| Permukaan API | 2 | **1** | −1 |
| Fungsi terekspos tanpa penjaga | 39 | **0** | −39 |
| Dependensi eksternal | 4 | **3** | −1 |
| Helper yatim | 21 | **0** | −21 |

## Rantai commit

| Commit | Isi |
|---|---|
| `95a78c7` | Modul Peta & RTL dihapus |
| `11f971f` | `09_BridgeFrontend.gs` dihapus — permukaan API kedua ditutup |
| `fdcd2e2` | Alur approval dibuang sepenuhnya |
| `14b8093` | 36 aksi mati + 21 helper yatim (346 baris) dihapus |

## Rincian 59 aksi

| Kelompok | Jumlah |
|---|---|
| Dashboard & transaksi | 8 |
| Master | 13 |
| Laporan | 11 |
| Analisa | 7 |
| Evaluasi | 4 |
| Lampiran | 3 |
| Analitik lanjutan | 3 |
| SIMPEG & sesi | 5 |
| Sistem & audit | 5 |

50 dipakai frontend, 5 cadangan operasional (`save`, `delete`, `ping`,
`init_database`, `audit_master` — semuanya `admin` ke atas), 4 ditangani CoreLib.
`actionLevels` berisi 61 entri; selisih 2 adalah `exchange_platform_ticket` dan
`logout` milik CoreLib — normal, bukan yatim.

## Verifikasi

`node --check` lolos untuk seluruh `.gs` dan seluruh blok `<script>` di 18 berkas
`.html`. Nol helper yatim. Nol aksi tanpa `actionLevels`. Nol aksi frontend tanpa
handler. Nol sisa `approval`/`rtl`/`peta`/`leaflet`. Clone bersih dari remote cocok
byte-per-byte dengan salinan lokal.

## Blocker yang tersisa

1. **`appsscript.json` masih `ANYONE_ANONYMOUS` + `executeAs USER_DEPLOYING`.** Gating
   role sudah menutup celah data, tapi halaman tetap publik dan kuota membebani akun
   deployer. Perlu kepastian alur SSO CoreLib sebelum pindah ke `ANYONE`.
2. 4 sheet warisan tak terpakai (`M_KLASIFIKASI`, `M_PEJABAT`, `M_TEMPLATE`, `T_ITEM`).
3. Literal `'prd_'` / `'atr_'` di `04_CrudTematik.gs` baris 18, 47, 55.

Lubang otorisasi `09_BridgeFrontend.gs` yang disebut sebagai blocker di badan dokumen
**sudah ditutup** pada `11f971f`.
