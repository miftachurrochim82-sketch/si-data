# 05 — UI & Antarmuka

---

## 1. Tumpukan

| Lapisan | Pilihan |
|---|---|
| Kerangka | Vue 3.5.42 (global build, tanpa langkah build) |
| Gaya | `frontend-cdn` **v3.0.1** — `app.min.css`, Tailwind sudah ter-compile |
| Perilaku bersama | `frontend-cdn` **v3.0.1** — `app.min.js` |
| Ikon | Font Awesome 6.5.2 |

Empat berkas eksternal, semuanya dari jsDelivr dengan tag versi terkunci. **Tidak ada
Tailwind Play CDN** dan tidak ada Leaflet (peta sudah dibuang).

> Pin versi wajib memakai tag (`@v3.0.1`), bukan `@main`. Tanpa tag, jsDelivr menyajikan
> versi yang berubah sewaktu-waktu.

## 2. Susunan berkas

```
Index.html          shell: head, CDN, mount Vue, include semua view
V_*.html            markup per halaman
J_*.html            logika per halaman
```

Delapan halaman: Dashboard, Transaksi, Laporan, Analisa, Evaluasi, Master,
Pengaturan, Detail. Navigasi sisi klien, tanpa muat ulang.

## 3. Komponen bersama dari CDN

Dipakai apa adanya — **jangan mengarang prop baru**, periksa dulu di repo `frontend-cdn`.

| Komponen | Guna |
|---|---|
| `AppShell` | Kerangka sidebar + header |
| `DataTable` | Tabel dengan sort, filter, paginasi |
| `StatCard` | Kartu angka ringkas |
| `ChartBlock` | Pembungkus chart |
| `FormModal` | Modal form |
| `Toast` | Notifikasi |

Pembungkus pemanggilan server: `callServer(aksi, payload)` di `app-core.js`.

## 4. Pola yang berlaku

- **Server yang menghitung.** Dashboard, laporan, analisa, evaluasi mengembalikan angka
  siap pakai. Frontend tidak mengagregasi.
- **Paginasi di server** untuk daftar transaksi. Tidak pernah menarik seluruh sheet.
- **Satu pintu.** Semua panggilan lewat `callServer`. Tidak ada
  `google.script.run.<fungsi>` langsung.
- **Status sebagai badge berwarna**, mengikuti `STATUS_MAP`.
- **Bahasa Indonesia** untuk seluruh label, pesan, dan galat.
- **Format WIB** untuk tanggal; rupiah dengan pemisah ribuan.

## 5. Tema

Admin memilih tema di Pengaturan; disimpan lewat `save_theme` ke properti
`THEME_JSON` dan dibaca saat muat awal. Tidak ada tema per pengguna.

## 6. Responsif

Dirancang untuk desktop, dapat dipakai di tablet. Tabel lebar bergulir horizontal pada
layar sempit. Fitur RTL **sudah dihapus** — tidak ada dukungan arah kanan-ke-kiri.

## 7. Aksesibilitas — status jujur

Kontras dan ukuran font mengikuti bawaan komponen CDN. Navigasi keyboard dan label ARIA
**belum diaudit**. Ini utang yang diakui, bukan fitur yang diklaim.
