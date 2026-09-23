# 04 — DATABASE SI-DATA (v0.2 — 10 sheet baseline + 3 tematik)

> Baseline starter-kit: 5 master + 5 tabel = 10 sheet. Untuk Satu Data, kolom `kode_tematik` jadi dimensi utama.

| Sheet | Kolom Kunci | Tematik | Catatan |
|---|---|---|---|
| M_KLASIFIKASI | id, kode, nama_tematik (TRANTIBUM/GAKDA/DAMKAR), kategori | Master | Dimensi laporan |
| M_PEJABAT | id, nama, bidang (TRANTIBUM/GAKDA/DAMKAR), jabatan | Master | Validasi per bidang |
| M_TEMPLATE | id, kode_tematik, nama, format | Master | Template LPPD |
| M_PERIODE | id, tahun, bulan, label | Master | Periode |
| M_SATUAN | id, kode, nama | Master | Satuan |
| T_UTAMA | id, pegawai_id, tanggal, kode_tematik, klasifikasi_id, pejabat_id, uraian, nilai, satuan_id, periode, status | Tabel | Inti Satu Data |
| T_ITEM | id, utama_id, uraian | Tabel | Rincian |
| T_LAMPIRAN | id, utama_id, file_url | Tabel | Bukti |
| T_TINDAK_LANJUT | id, evaluasi_id, uraian, target | Tabel | RTL |
| T_LOGBOOK | id, utama_id, aksi | Tabel | Log |

Enum `status`: draft, diajukan, disetujui, ditolak, direvisi, selesai, arsip.
Enum `kode_tematik`: TRANTIBUM, GAKDA, DAMKAR.
