// ============================================================
// 09_BridgeFrontend.gs — Wrapper untuk frontend literatur plain
// Menjembatani google.script.run.* (tanpa _) ke fungsi _ (underscore)
// v2.14-tematik — frontend Literatur 15 file (plain HTML) + backend 7 file medium
// ============================================================

// ---------- Helpers dashboard ----------
function getRingkasan(filter){ return getRingkasan_(filter||{}); }
function getTrendBulanan(filter){ return getTrendBulanan_(filter||{}); }
function getDataPerGrup(filter){ return getDataPerGrup_(filter||{}); }
function getDataPerUnit(filter){ return getDataPerUnit_(filter||{}); }
function getDataPerLokasi(filter){ return getDataPerLokasi_(filter||{}); }
function getDataPerFungsi(filter){ return getDataPerFungsi_(filter||{}); }
function getTopPegawai(filter, limit){ return getTopPegawai_(filter||{}, limit||10); }
function getLeaderboardUnit(filter){ return getLeaderboardUnit_(filter||{}); }
function getHeatmapBulanGrup(filter){ return getHeatmapBulanGrup_(filter||{}); }
function getHeatmap(filter){ return getHeatmapBulanGrup_(filter||{}); }
function getFilterOptions(){ return getFilterOptions_(); }
function getMasterOptions(){ return getMasterOptions_(); }

// ---------- Cross-tab & Analisa ----------
function getCrossTabPerGrup(filter){ return getCrossTabPerGrupTematik_(filter||{}); }
function getPeriodeListSimple(){
  var maps=getPeriodeMaps_();
  var rows=getSheetData_('M_PERIODE')||[];
  var list=rows.filter(function(r){return r.id;}).map(function(r){return {id:String(r.id), label: maps.byId[String(r.id)]||String(r.id)};});
  // sort by label year
  list.sort(function(a,b){
    var pa=a.label.split(' '), pb=b.label.split(' ');
    var ya=Number(pa[1])||0, yb=Number(pb[1])||0;
    if(ya!==yb) return ya-yb;
    return NAMA_BULAN.indexOf(pa[0])-NAMA_BULAN.indexOf(pb[0]);
  });
  return list;
}
function getPerbandingan(filter){ return getPerbandinganTematik_(filter||{}); }

// Tematik panels per grup (untuk tab Tematik)
function getTematikPanels(filter){
  filter=filter||{};
  var allUnits=getUnitList_();
  var fungsiRows=getSheetData_('M_FUNGSI');
  var seksiIds=new Set();
  if(filter.bidangId){
    var seksiList=allUnits.filter(function(u){ return u.parent_id===filter.bidangId && (u.jenis_unit==='SEKSI'||u.jenis_unit==='SUB_BIDANG'); });
    seksiList.forEach(function(s){ seksiIds.add(String(s.id)); });
    seksiIds.add(String(filter.bidangId));
  }
  var grupList;
  if(filter.bidangId){
    grupList=fungsiRows.filter(function(r){ return r.id && Number(r.level)===1 && seksiIds.has(String(r.unit_id||'').trim()); }).map(function(r){return {id:String(r.id).trim(), nama:String(r.nama).trim(), urutan:Number(r.urutan)||0};}).sort(function(a,b){return a.urutan-b.urutan;});
    if(!grupList.length){
      var um=getUnitMap_();
      grupList=[{id:String(filter.bidangId), nama: um[filter.bidangId]||String(filter.bidangId), urutan:0}];
    }
  } else {
    grupList=fungsiRows.filter(function(r){ return r.id && Number(r.level)===1; }).map(function(r){return {id:String(r.id).trim(), nama:String(r.nama).trim(), urutan:Number(r.urutan)||0};}).sort(function(a,b){return a.urutan-b.urutan;});
  }
  var dimensiRows=getSheetData_('M_DIMENSI')||[];
  var nilaiMap=getNilaiDimensiMap_();
  var fungsiToDimensi={};
  dimensiRows.forEach(function(d){
    if(!d.id || !isActive_(d.status_aktif)) return;
    var fid=String(d.fungsi_id||'').trim();
    if(!fid) return;
    if(!fungsiToDimensi[fid]) fungsiToDimensi[fid]=[];
    fungsiToDimensi[fid].push({id:String(d.id), kode:String(d.kode||''), nama:String(d.nama), jenis_input:String(d.jenis_input||''), urutan:Number(d.urutan)||0, opsi:nilaiMap[String(d.id)]||[]});
  });
  // Build panels
  return grupList.map(function(grup){
    var subIds=new Set([grup.id]);
    fungsiRows.forEach(function(r){ if(String(r.parent_id||'').trim()===grup.id) subIds.add(String(r.id).trim()); });
    var dimensiList=[];
    subIds.forEach(function(fid){
      if(fungsiToDimensi[fid]) dimensiList=dimensiList.concat(fungsiToDimensi[fid]);
    });
    // dedup dimensi by id
    var seen={}; var uniq=[];
    dimensiList.forEach(function(d){ if(!seen[d.id]){ seen[d.id]=1; uniq.push(d);} });
    uniq.sort(function(a,b){return a.urutan-b.urutan;});
    return {grupId:grup.id, grupNama:grup.nama, dimensiList: uniq};
  }).filter(function(p){ return p.dimensiList.length>0; });
}

function getCrossTabTematik(filter, dimensiId){
  filter=filter||{};
  if(!dimensiId) return {error:'dimensiId kosong'};
  var maps=getPeriodeMaps_();
  var rows=getRowsUtama_(filter);
  var nilaiRows=(getSheetData_('M_NILAI_DIMENSI')||[]).filter(function(r){ return String(r.dimensi_id).trim()===String(dimensiId) && isActive_(r.status_aktif); });
  var nilaiList=nilaiRows.map(function(r){return String(r.nama).trim();}).filter(function(x){return x;});
  if(!nilaiList.length) nilaiList=['-'];
  var nilaiById={}; nilaiRows.forEach(function(r){ nilaiById[String(r.id)]=String(r.nama).trim(); });
  // Build matrix periode x nilai
  var atributMap={};
  getSheetData_('T_ATRIBUT')||[].forEach(function(a){
    if(!isActive_(a.status_aktif)) return;
    if(String(a.dimensi_id).trim()!==String(dimensiId)) return;
    var kid=String(a.kegiatan_id);
    var display=nilaiById[String(a.nilai_id)]||String(a.nilai_text||a.nilai_number||a.nilai_date||'-').trim();
    if(!atributMap[kid]) atributMap[kid]=[];
    atributMap[kid].push(display);
  });
  var idSet=new Set(rows.map(function(r){return String(r.id);}));
  // Only keep atribut for rows in filter
  var matrix={}, periodeSet=new Set(), nilaiSet=new Set(nilaiList);
  var totalPerPeriode={}, totalPerNilai={}, grandTotal=0;
  rows.forEach(function(r){
    var label=toPeriodeLabel_(r.periode_id, maps);
    if(!label) return;
    periodeSet.add(label);
    var kid=String(r.id);
    var vals=atributMap[kid]||['-'];
    vals.forEach(function(v){
      nilaiSet.add(v);
      if(!matrix[label]) matrix[label]={};
      matrix[label][v]=(matrix[label][v]||0)+1;
    });
  });
  var periodeKeys=Array.from(periodeSet).sort(function(a,b){
    var pa=a.split(' '), pb=b.split(' ');
    var diff=(Number(pa[1])||0)-(Number(pb[1])||0);
    if(diff!==0) return diff;
    return NAMA_BULAN.indexOf(pa[0])-NAMA_BULAN.indexOf(pb[0]);
  });
  var nilaiSorted=Array.from(nilaiSet);
  // sort by urutan in M_NILAI
  var urutanMap={}; nilaiRows.forEach(function(r){ urutanMap[String(r.nama).trim()]=Number(r.urutan)||999; });
  nilaiSorted.sort(function(a,b){ return (urutanMap[a]||999)-(urutanMap[b]||999); });
  periodeKeys.forEach(function(p){
    var tot=0;
    nilaiSorted.forEach(function(n){ var v=(matrix[p]&&matrix[p][n])||0; tot+=v; totalPerNilai[n]=(totalPerNilai[n]||0)+v; });
    totalPerPeriode[p]=tot; grandTotal+=tot;
  });
  return {periode:periodeKeys, nilai:nilaiSorted, data:matrix, totalPerPeriode:totalPerPeriode, totalPerNilai:totalPerNilai, grandTotal:grandTotal};
}

// ---------- Kegiatan CRUD ----------
function getKegiatanList(filter){ return getKegiatanListTematik_(filter||{}); }
function getKegiatanDetail(id){ return getKegiatanDetailTematik_(id); }
function getKegiatanById(id){
  if(!id) return null;
  var r=findRecordById_('T_UTAMA', id);
  if(!r) return null;
  var atr=getAtributDetail_(id);
  return {
    id:r.id, kode:r.kode, tanggal: Utilities.formatDate(new Date(r.tanggal), 'Asia/Jakarta', 'yyyy-MM-dd'),
    unit_id:r.unit_id, fungsi_id:r.fungsi_id, kategori_id:r.kategori_id, jenis_id:r.jenis_id,
    periode_id:r.periode_id, lokasi_id:r.lokasi_id, uraian:r.uraian, jumlah:r.jumlah,
    satuan_id:r.satuan_id, anggaran:r.anggaran, status:r.status, keterangan:r.keterangan||'', atribut:atr
  };
}
function getDimensiForForm(fungsiId){ return getDimensiForForm_(fungsiId); }
function simpanKegiatan(payload){
  var actor=systemActor_();
  return simpanKegiatanTematik_(payload||{}, actor);
}
function updateKegiatan(payload){
  if(!payload || !payload.id) return {success:false, error:'id kosong'};
  var existing=findRecordById_('T_UTAMA', payload.id);
  if(!existing) return {success:false, error:'Data tidak ditemukan'};
  var wajib=['tanggal','unit_id','fungsi_id','kategori_id','jenis_id','periode_id','lokasi_id','uraian','jumlah','satuan_id'];
  for(var i=0;i<wajib.length;i++){ if(!payload[wajib[i]]) return {success:false, error:'Field '+wajib[i]+' wajib diisi'}; }
  var rec={
    id:payload.id, kode:existing.kode, tanggal:payload.tanggal, unit_id:payload.unit_id, fungsi_id:payload.fungsi_id,
    kategori_id:payload.kategori_id, jenis_id:payload.jenis_id, periode_id:payload.periode_id, lokasi_id:payload.lokasi_id,
    uraian:payload.uraian, jumlah:Number(payload.jumlah)||0, satuan_id:payload.satuan_id,
    anggaran:Number(payload.anggaran)||0, status:payload.status||existing.status,
    keterangan:payload.keterangan||'', status_aktif:true
  };
  saveRecord_('T_UTAMA', rec, systemActor_());
  if(payload.atribut){
    hapusAtributKegiatan_(payload.id);
    if(payload.atribut.length) simpanAtributKegiatan_(payload.id, payload.atribut);
  }
  return {success:true, id:payload.id, kode:rec.kode};
}
function hapusKegiatan(id){
  if(!id) return {success:false, error:'id kosong'};
  var r=findRecordById_('T_UTAMA', id);
  if(!r) return {success:false, error:'Tidak ditemukan'};
  var actor=systemActor_();
  var rec=Object.assign({}, r, {status_aktif:false, deleted_at:new Date().toISOString(), updated_by: actor.email});
  saveRecord_('T_UTAMA', rec, actor);
  return {success:true};
}

// ---------- Pegawai & Logbook ----------
function getPegawaiList(){
  var rows=getSheetData_('PEGAWAI')||[];
  return rows.filter(function(r){return r.id;}).map(function(r){
    return {id:String(r.id), nip:String(r.nip||r.pegawai_id||''), nama:String(r.nama||r.nama_lengkap||''), jenis_kelamin:String(r.jenis_kelamin||r.jk||''), unit:String(r.unit||r.unit_kerja||''), jabatan:String(r.jabatan||''), status:String(r.status||'AKTIF')};
  });
}
function getPegawaiSimple(){
  var rows=getPegawaiList();
  return rows.map(function(r){ return {id:r.id, nama:r.nama}; });
}
function getLogbookList(filter){
  filter=filter||{};
  var rows=getSheetData_('T_LOGBOOK')||[];
  var pegMap={}; getSheetData_('PEGAWAI').forEach(function(p){ if(p.id) pegMap[String(p.id)]=String(p.nama||p.nama_lengkap||''); });
  var kegMap={}; getSheetData_('T_UTAMA').forEach(function(k){ if(k.id) kegMap[String(k.id)]=String(k.uraian||k.kode||''); });
  var maps=getPeriodeMaps_();
  var list=rows.filter(function(r){return r.id && isActive_(r.status_aktif);}).map(function(r){
    return {
      id:String(r.id),
      tanggal: formatDate_(r.tanggal),
      periode_id: String(r.periode_id||''),
      periode: toPeriodeLabel_(r.periode_id, maps),
      pegawai_id:String(r.pegawai_id||''),
      pegawai_nama: pegMap[String(r.pegawai_id)]||String(r.pegawai_id||''),
      kegiatan_id:String(r.kegiatan_id||''),
      kegiatan_uraian: kegMap[String(r.kegiatan_id)]||'',
      uraian:String(r.uraian||'')
    };
  }).reverse();
  // filter by filterState if provided
  if(filter.tahun || filter.bulan || filter.bidangId){
    var utamaRows=getRowsUtama_(filter);
    var allowedIds=new Set(utamaRows.map(function(r){return String(r.id);}));
    // If filter active, only logbook linked to kegiatan in that set + logbook without kegiatan? keep those without kegiatan filtered by date?
    // Simplify: filter logbook by kegiatan_id if present
    list=list.filter(function(l){
      if(l.kegiatan_id) return allowedIds.has(l.kegiatan_id);
      return true;
    });
  }
  return list;
}
function simpanLogbook(payload){
  if(!payload || !payload.tanggal || !payload.pegawai_id || !payload.uraian) return {success:false, error:'Field wajib kosong'};
  var id='lb_'+Date.now();
  var rec={id:id, tanggal:payload.tanggal, pegawai_id:payload.pegawai_id, kegiatan_id:payload.kegiatan_id||'', uraian:payload.uraian, status_aktif:true, created_at:new Date().toISOString()};
  saveRecord_('T_LOGBOOK', rec, systemActor_());
  return {success:true, id:id};
}

// ---------- Peserta ----------
function simpanPeserta(payload){
  if(!payload || !payload.kegiatan_id || !payload.peserta || !payload.peserta.length) return {success:false, error:'Data tidak lengkap'};
  var max=0;
  getSheetData_('T_PESERTA').forEach(function(r){ var m=String(r.id||'').match(/ps_(\d+)/); if(m){ var n=parseInt(m[1],10); if(n>max) max=n; }});
  var count=0;
  payload.peserta.forEach(function(p){
    max++; var id='ps_'+String(max).padStart(5,'0');
    var rec={id:id, kegiatan_id:payload.kegiatan_id, pegawai_id:p.pegawai_id, peran:p.peran||'Anggota', status_aktif:true, created_at:new Date().toISOString()};
    saveRecord_('T_PESERTA', rec, systemActor_());
    count++;
  });
  return {success:true, total:count};
}
function hapusPeserta(id){
  var r=findRecordById_('T_PESERTA', id);
  if(!r) return {success:false, error:'Tidak ditemukan'};
  saveRecord_('T_PESERTA', Object.assign({}, r, {status_aktif:false, deleted_at:new Date().toISOString()}), systemActor_());
  return {success:true};
}
function hapusLampiran(id){
  var r=findRecordById_('T_LAMPIRAN', id);
  if(!r) return {success:false, error:'Tidak ditemukan'};
  try{
    var url=String(r.file_url||'');
    var m=url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if(m){ try{ DriveApp.getFileById(m[1]).setTrashed(true);}catch(e){} }
  }catch(e){}
  saveRecord_('T_LAMPIRAN', Object.assign({}, r, {status_aktif:false, deleted_at:new Date().toISOString()}), systemActor_());
  return {success:true};
}
function uploadLampiran(payload){ return uploadLampiranTematik_(payload||{}, systemActor_()); }

// ---------- Target ----------
function getTargetFormOptions(){
  var maps=getPeriodeMaps_();
  var fungsiList=getSheetData_('M_FUNGSI').filter(function(r){return r.id;}).map(function(r){return {id:String(r.id), nama:String(r.nama)};});
  var periodeList=getSheetData_('M_PERIODE').filter(function(r){return r.id;}).map(function(r){return {id:String(r.id), label: maps.byId[String(r.id)]||String(r.id)};});
  var unitList=getUnitList_().map(function(u){return {id:String(u.id), nama:String(u.nama)};});
  return {fungsi:fungsiList, periode:periodeList, unit:unitList};
}
function simpanTarget(payload){
  if(!payload || !payload.nama_target || !payload.fungsi_id || !payload.periode_id || !payload.unit_id) return {success:false, error:'Field wajib kosong'};
  var rows=getSheetData_('M_TARGET')||[];
  var max=0;
  rows.forEach(function(r){ var m=String(r.id||'').match(/tgt_(\d+)/); if(m){ var n=parseInt(m[1],10); if(n>max) max=n; }});
  var id='tgt_'+String(max+1).padStart(4,'0');
  var rec={
    id:id, kode:id, nama_target:String(payload.nama_target), fungsi_id:String(payload.fungsi_id),
    periode_id:String(payload.periode_id), unit_id:String(payload.unit_id),
    target_kegiatan:Number(payload.target_kegiatan)||0, target_anggaran:Number(payload.target_anggaran)||0,
    target_volume:Number(payload.target_volume)||0, keterangan:String(payload.keterangan||''), status_aktif:true,
    created_at:new Date().toISOString()
  };
  saveRecord_('M_TARGET', rec, systemActor_());
  return {success:true, id:id};
}
function updateTarget(payload){
  if(!payload || !payload.id) return {success:false, error:'id kosong'};
  var r=findRecordById_('M_TARGET', payload.id);
  if(!r) return {success:false, error:'Tidak ditemukan'};
  var rec=Object.assign({}, r, {
    nama_target:String(payload.nama_target||r.nama_target),
    fungsi_id:String(payload.fungsi_id||r.fungsi_id),
    periode_id:String(payload.periode_id||r.periode_id),
    unit_id:String(payload.unit_id||r.unit_id),
    target_kegiatan:Number(payload.target_kegiatan)||0,
    target_anggaran:Number(payload.target_anggaran)||0,
    target_volume:Number(payload.target_volume)||0,
    keterangan:String(payload.keterangan||'')
  });
  saveRecord_('M_TARGET', rec, systemActor_());
  return {success:true};
}
function getTargetEvaluasi(filter){ return getTargetEvaluasi_(filter||{}); }

// ---------- Audit ----------
function getAuditLogs(filter){ var res=getAuditLogsTematik_(filter||{}); return res; }
function getAuditFilterOptions(){
  var rows=getSheetData_('AUDIT_LOGS')||[];
  var users=[...new Set(rows.map(function(r){return String(r.user||'');}).filter(Boolean))];
  var aksi=[...new Set(rows.map(function(r){return String(r.aksi||'');}).filter(Boolean))];
  var tabel=[...new Set(rows.map(function(r){return String(r.tabel||'');}).filter(Boolean))];
  return {users:users, aksi:aksi, tabel:tabel};
}
function cleanAuditLogsOlderThan(days){
  days=Number(days)||90;
  var rows=getSheetData_('AUDIT_LOGS')||[];
  var cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days);
  var count=0;
  rows.forEach(function(r){
    try{
      var d=new Date(r.timestamp);
      if(d < cutoff && isActive_(r.status)){
        saveRecord_('AUDIT_LOGS', Object.assign({}, r, {status:'DELETED', deleted_at:new Date().toISOString()}), systemActor_());
        count++;
      }
    }catch(e){}
  });
  return {success:true, hapus:count};
}

// ---------- Peta ----------
function getPetaKegiatan(filter){
  filter=filter||{};
  var rows=getRowsUtama_(filter);
  var lokasiMap=getLokasiMap_();
  var fungsiMap=getFungsiMap_();
  var map={};
  rows.forEach(function(r){
    var nama=lokasiMap[r.lokasi_id]||String(r.lokasi_id||'Tidak diketahui');
    if(!map[nama]) map[nama]={nama:nama, jumlah:0, volume:0, anggaran:0, byFungsi:{}};
    map[nama].jumlah++;
    map[nama].volume+=Number(r.jumlah)||0;
    map[nama].anggaran+=Number(r.anggaran)||0;
    var fname=(fungsiMap[r.fungsi_id]&&fungsiMap[r.fungsi_id].nama)||String(r.fungsi_id);
    map[nama].byFungsi[fname]=(map[nama].byFungsi[fname]||0)+1;
  });
  var wilayah=Object.values(map).map(function(w){
    var topF='-'; var max=0;
    Object.keys(w.byFungsi).forEach(function(f){ if(w.byFungsi[f]>max){max=w.byFungsi[f]; topF=f;} });
    return {nama:w.nama, jumlah:w.jumlah, volume:w.volume, anggaran:w.anggaran, topFungsi:topF};
  }).sort(function(a,b){return b.jumlah-a.jumlah;});
  return {wilayah:wilayah, totalKegiatan:rows.length};
}
function getGeoJSONContent(fileName){
  try{
    var folder=DRIVE_FOLDER_IDS.GEOJSON ? DriveApp.getFolderById(DRIVE_FOLDER_IDS.GEOJSON) : null;
    if(!folder) return {success:false, error:'Folder GEOJSON tidak dikonfigurasi'};
    var files=folder.getFilesByName(fileName);
    if(!files.hasNext()) return {success:false, error:'File tidak ditemukan: '+fileName};
    var file=files.next();
    var content=file.getBlob().getDataAsString();
    return {success:true, data:content};
  }catch(e){ return {success:false, error:e.message}; }
}
