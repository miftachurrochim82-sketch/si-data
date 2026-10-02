# 04 — API & Alur Eksekusi

> Hanya ada **satu permukaan API**. Permukaan kedua (`09_BridgeFrontend.gs`, 39 fungsi
> global tanpa penjaga) sudah dihapus pada commit `11f971f`.

---

## 1. Jalur permintaan

```
Browser
  └─ google.script.run.handleAction(payload)   ← satu-satunya pintu
       └─ handleAction()                       02_AppLogic.gs
            └─ CoreLib.dispatchAction(payload, handlers, getAppConfig_())
                 ├─ validasi sesi
                 ├─ cek actionLevels[aksi] vs role sesi   ← fail-closed
                 └─ handlers[aksi](payload, sesi)
```

`doGet` hanya menyajikan `Index.html`. `doPost` dikembalikan ke CoreLib untuk pertukaran
tiket SSO.

## 2. Bentuk payload

**Permintaan**

```js
{ aksi: 'lap_kategori', ...parameter }
```

**Balasan — selalu bentuk ini**

```js
{ ok: true,  data: ... }
{ ok: false, error: 'pesan' }
```

Frontend memakai pembungkus `callServer(aksi, payload)` di `app-core.js` (frontend-cdn
v3.0.1) yang menormalkan balasan dan menangani kegagalan jaringan.

## 3. Konfigurasi — `getAppConfig_()`

Didefinisikan di `01_ConfigAndBridge.gs`, dioper utuh ke CoreLib pada setiap dispatch.
Isinya:

| Kunci | Guna |
|---|---|
| `spreadsheetId` | Target basis data |
| `sheets` | Peta nama sheet |
| `headers` | `ALL_SHEET_HEADERS` — whitelist kolom |
| `idPrefix` | Prefix pembuatan id per sheet |
| `statusMap` | `STATUS_MAP` untuk validasi transisi |
| `actionLevels` | **Role minimum per aksi** |
| `preSaveHook` | `localPreSaveHook_` |

Menambah aksi baru berarti **dua tempat**: handler di `02_AppLogic.gs` dan entri role di
`actionLevels`. Lupa yang kedua = aksi ditolak permanen.

## 4. Keamanan

- **Fail-closed.** Aksi tanpa entri `actionLevels` ditolak sebelum handler dijalankan.
- **Tidak ada fungsi global tanpa penjaga.** Satu-satunya titik masuk yang dapat
  dipanggil dari browser adalah `handleAction`.
- **Sesi dari CoreLib**, bukan dari parameter klien. Payload tidak bisa memalsukan role.
- `assertEditorOnly_()` melindungi fungsi berbahaya (seed, init) agar hanya bisa
  dijalankan dari editor Apps Script, bukan dari web.

### Catatan terbuka

`appsscript.json` masih `access: ANYONE_ANONYMOUS` dengan `executeAs: USER_DEPLOYING`.
Gating role sudah menutup celah data, tapi halaman tetap dapat diakses siapa pun dan
setiap eksekusi membebani kuota akun deployer. Perubahan ke `ANYONE` perlu kepastian
bahwa alur SSO CoreLib tetap jalan — **belum dieksekusi**.

## 5. Integrasi

| Sumber | Cara | Dipakai untuk |
|---|---|---|
| **SIMPEG** | `CoreLib` membaca spreadsheet SIMPEG | `get_pegawai_list`, `get_unit_list`, `get_jabatan_list` |
| **si-platform** | Tiket SSO via `exchange_platform_ticket` (ditangani CoreLib) | Login |
| **Google Drive** | `upload_lampiran_tematik` | Simpan berkas lampiran |

## 6. Penanganan galat

- Handler melempar `Error` dengan pesan berbahasa Indonesia; CoreLib membungkusnya
  menjadi `{ ok: false, error }`.
- Galat tulis tercatat di `AUDIT_LOGS` dengan `status: 'ERROR'`.
- Frontend menampilkan pesan apa adanya — jangan menaruh detail teknis sensitif di
  pesan galat.
