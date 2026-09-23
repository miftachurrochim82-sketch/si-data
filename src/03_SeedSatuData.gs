// ============================================================
// SI-DATA — 03_SeedSatuData.gs (v0.4.0 — Satu Data 3 tematik)
// Seed 15 baris contoh TRANTIBUM/GAKDA/DAMKAR + 5 master
// Jalankan di GAS: seedSatuData()  — idempotent (cek dobel)
// ============================================================

function seedSatuData() {
  var actor = (typeof systemActor_ === 'function' ? systemActor_() : { username: 'seed', email: 'seed@trenggalek.go.id' });
  var now = (typeof todayIsoLocal_ === 'function' ? todayIsoLocal_() : Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd'));
  var results = { masters: 0, utama: 0 };

  // --- 1. Master: KLASIFIKASI (3 tematik) ---
  var klasifikasi = [
    { kode: 'TRANTIBUM_PATROLI',   nama_tematik: 'TRANTIBUM', nama: 'Patroli Rutin', status: 'aktif' },
    { kode: 'TRANTIBUM_PENGAMANAN',nama_tematik: 'TRANTIBUM', nama: 'Pengamanan Event', status: 'aktif' },
    { kode: 'GAKDA_TIPIRING',      nama_tematik: 'GAKDA',     nama: 'Sidang Tipiring', status: 'aktif' },
    { kode: 'GAKDA_PENINDAKAN',    nama_tematik: 'GAKDA',     nama: 'Penindakan Perda', status: 'aktif' },
    { kode: 'DAMKAR_KEBAKARAN',    nama_tematik: 'DAMKAR',    nama: 'Kebakaran Lahan/Bangunan', status: 'aktif' },
    { kode: 'DAMKAR_PENYELAMATAN', nama_tematik: 'DAMKAR',    nama: 'Penyelamatan Non-Kebakaran', status: 'aktif' }
  ];
  klasifikasi.forEach(function(r) {
    try {
      if (!findUnique_('M_KLASIFIKASI', 'kode', r.kode)) {
        writeRecordNoLock_('M_KLASIFIKASI', { id: makeId_('kls'), kode: r.kode, nama_tematik: r.nama_tematik, nama: r.nama, status: r.status }, false, actor);
        results.masters++;
      }
    } catch(e) {}
  });

  // --- 2. Master: PEJABAT (3 Kabid) ---
  var pejabat = [
    { nama: 'Kabid Trantibum', nip: '19700101', bidang: 'TRANTIBUM', jabatan: 'Kabid Ketertiban Umum', status: 'aktif' },
    { nama: 'Kabid Gakda',     nip: '19700202', bidang: 'GAKDA',     jabatan: 'Kabid Penegakan Perda', status: 'aktif' },
    { nama: 'Kabid Damkar',    nip: '19700303', bidang: 'DAMKAR',    jabatan: 'Kabid Damkar & Penyelamatan', status: 'aktif' }
  ];
  pejabat.forEach(function(r) {
    try {
      if (!findUnique_('M_PEJABAT', 'nip', r.nip)) {
        writeRecordNoLock_('M_PEJABAT', { id: makeId_('pjb'), nama: r.nama, nip: r.nip, bidang: r.bidang, jabatan: r.jabatan, status: r.status }, false, actor);
        results.masters++;
      }
    } catch(e) {}
  });

  // --- 3. Master: SATUAN ---
  var satuan = [
    { kode: 'kejadian', nama: 'Kejadian' },
    { kode: 'orang',    nama: 'Orang' },
    { kode: 'kegiatan', nama: 'Kegiatan' },
    { kode: 'paket',    nama: 'Paket' }
  ];
  satuan.forEach(function(r) {
    try {
      if (!findUnique_('M_SATUAN', 'kode', r.kode)) {
        writeRecordNoLock_('M_SATUAN', { id: makeId_('sat'), kode: r.kode, nama: r.nama, status: 'aktif' }, false, actor);
        results.masters++;
      }
    } catch(e) {}
  });

  // --- 4. Master: PERIODE & TEMPLATE (ringkas) ---
  try {
    var periodeLabel = periodeBulan_(now) || now.slice(0,7);
    if (!findUnique_('M_PERIODE', 'label', periodeLabel)) {
      writeRecordNoLock_('M_PERIODE', { id: makeId_('prd'), tahun: Number(now.slice(0,4)), bulan: now.slice(5,7), label: periodeLabel, status: 'aktif' }, false, actor);
      results.masters++;
    }
  } catch(e) {}
  try {
    if (!findUnique_('M_TEMPLATE', 'kode_tematik', 'TRANTIBUM')) {
      ['TRANTIBUM','GAKDA','DAMKAR'].forEach(function(k) {
        writeRecordNoLock_('M_TEMPLATE', { id: makeId_('tpl'), kode_tematik: k, nama_template: 'LPPD ' + k, format: 'excel', status: 'aktif' }, false, actor);
        results.masters++;
      });
    }
  } catch(e) {}

  // --- 5. T_UTAMA: 15 baris contoh (5 per bidang) ---
  // Ambil id referensi untuk klasifikasi & pejabat (pakai yang baru di-seed)
  var allKlas = [];
  try { allKlas = getSheetDataCached_('M_KLASIFIKASI') || []; } catch(e) {}
  function klasId(kode) { for (var i=0;i<allKlas.length;i++) if (String(allKlas[i].kode)===kode) return allKlas[i].id; return ''; }

  var contohUtama = [
    // TRANTIBUM 5
    { kode_tematik: 'TRANTIBUM', klasifikasi_id: klasId('TRANTIBUM_PATROLI'),    uraian: 'Patroli Jl. Pahlawan — 2 PKL ditertibkan', nilai: 2, status: 'disetujui' },
    { kode_tematik: 'TRANTIBUM', klasifikasi_id: klasId('TRANTIBUM_PENGAMANAN'), uraian: 'Pengamanan Karnaval Trenggalek — 500 peserta', nilai: 1, status: 'diajukan' },
    { kode_tematik: 'TRANTIBUM', klasifikasi_id: klasId('TRANTIBUM_PATROLI'),    uraian: 'Operasi penertiban reklame liar — 5 titik', nilai: 5, status: 'draft' },
    { kode_tematik: 'TRANTIBUM', klasifikasi_id: klasId('TRANTIBUM_PENGAMANAN'), uraian: 'Pengamanan Pasar Pon — 1 gangguan trantibum', nilai: 1, status: 'selesai' },
    { kode_tematik: 'TRANTIBUM', klasifikasi_id: klasId('TRANTIBUM_PATROLI'),    uraian: 'Patroli malam Alun-Alun — nihil pelanggaran', nilai: 1, status: 'disetujui' },
    // GAKDA 5
    { kode_tematik: 'GAKDA',     klasifikasi_id: klasId('GAKDA_TIPIRING'),   uraian: 'Tipiring Perda No.5/2020 — 1 pelanggar PKL', nilai: 1, status: 'diajukan' },
    { kode_tematik: 'GAKDA',     klasifikasi_id: klasId('GAKDA_PENINDAKAN'), uraian: 'Penindakan bangunan liar — 2 bangunan', nilai: 2, status: 'disetujui' },
    { kode_tematik: 'GAKDA',     klasifikasi_id: klasId('GAKDA_TIPIRING'),   uraian: 'Sidang Tipiring Perda Kebersihan — 3 berkas', nilai: 3, status: 'draft' },
    { kode_tematik: 'GAKDA',     klasifikasi_id: klasId('GAKDA_PENINDAKAN'), uraian: 'Penyidikan PPNS — 1 kasus miras', nilai: 1, status: 'selesai' },
    { kode_tematik: 'GAKDA',     klasifikasi_id: klasId('GAKDA_PENINDAKAN'), uraian: 'Pembinaan pelaku usaha — 10 warung', nilai: 10, status: 'disetujui' },
    // DAMKAR 5
    { kode_tematik: 'DAMKAR',    klasifikasi_id: klasId('DAMKAR_KEBAKARAN'),    uraian: 'Kebakaran lahan 0,5ha Ds. Karangsoko — response 11 menit', nilai: 1, status: 'disetujui' },
    { kode_tematik: 'DAMKAR',    klasifikasi_id: klasId('DAMKAR_KEBAKARAN'),    uraian: 'Kebakaran rumah — 1 unit, kerugian 20jt', nilai: 1, status: 'diajukan' },
    { kode_tematik: 'DAMKAR',    klasifikasi_id: klasId('DAMKAR_PENYELAMATAN'), uraian: 'Evakuasi ular di permukiman — 1 ekor', nilai: 1, status: 'selesai' },
    { kode_tematik: 'DAMKAR',    klasifikasi_id: klasId('DAMKAR_PENYELAMATAN'), uraian: 'Pohon tumbang Jl. Brigjen — 1 pohon', nilai: 1, status: 'draft' },
    { kode_tematik: 'DAMKAR',    klasifikasi_id: klasId('DAMKAR_PENYELAMATAN'), uraian: 'Banjir Ds. Parakan — 3 KK terdampak', nilai: 3, status: 'disetujui' }
  ];

  var pegawaiId = '';
  try {
    var me = getSheetDataCached_('PEGAWAI');
    if (me && me.length) pegawaiId = String(me[0].pegawai_id || me[0].id || '');
  } catch(e) {}
  if (!pegawaiId) pegawaiId = 'PEG-0001';

  contohUtama.forEach(function(r, idx) {
    var judul = r.uraian.slice(0, 30);
    try {
      // cek dobel by uraian (sederhana)
      var exists = false;
      try {
        var all = getSheetDataCached_('T_UTAMA') || [];
        for (var i=0;i<all.length;i++) if (String(all[i].uraian)===r.uraian) { exists=true; break; }
      } catch(e) {}
      if (exists) return;
      writeRecordNoLock_('T_UTAMA', {
        id: makeId_('utm'),
        pegawai_id: pegawaiId,
        tanggal: now,
        kode_tematik: r.kode_tematik,
        klasifikasi_id: r.klasifikasi_id,
        pejabat_id: '',
        uraian: r.uraian,
        nilai: r.nilai,
        satuan_id: '',
        periode: periodeBulan_(now) || now.slice(0,7),
        status: r.status
      }, false, actor);
      results.utama++;
    } catch(e) {
      Logger.log('seed T_UTAMA gagal idx ' + idx + ': ' + e.message);
    }
  });

  // Invalidate cache
  try { invalidateSheetCache_('M_KLASIFIKASI'); invalidateSheetCache_('M_PEJABAT'); invalidateSheetCache_('T_UTAMA'); } catch(e) {}

  Logger.log('✅ seedSatuData selesai — masters: ' + results.masters + ', T_UTAMA: ' + results.utama + ' (total 15 contoh)');
  return { success: true, masters: results.masters, utama: results.utama, total: 15 };
}

function clearSeedSatuData_() {
  Logger.log('clearSeedSatuData_ belum diimplementasi — hapus manual di Sheet bila perlu');
  return { success: false, msg: 'Hapus manual di Sheet' };
}
