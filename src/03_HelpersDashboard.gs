
// ============================================================
// PATCH OTOMATIS 2026-09-26 — Adopsi Sumber Tematik + Dashboard + Drive
// Sumber: 7 file (01_Dashboard,02_Crud,03_CrossTab,04_Target,05_Lampiran,06_Analisa,07_Audit,Code.gs)
// Adaptasi: getActive() → getSheetData_ / SPREADSHEET_ID, Session → actor, Drive 8 folder
// ============================================================

// LEGACY MAP (dari Code.gs sumber)
var LEGACY_FUNGSI = {
  'fn_penjagaan':            { nama: 'Penjagaan',              parent: 'fn_pencegahan' },
  'fn_deteksi_dini':         { nama: 'Deteksi & Cegah Dini',   parent: 'fn_pencegahan' },
  'fn_pengendalian':         { nama: 'Penanganan Massa',       parent: 'fn_penanganan' },
  'fn_pembinaan_linmas':     { nama: 'Pembinaan Linmas',       parent: 'fn_satlinmas' },
  'fn_pelatihan_linmas':     { nama: 'Pelatihan Satlinmas',    parent: 'fn_satlinmas' },
  'fn_pemberdayaan_linmas':  { nama: 'Pemberdayaan Satlinmas', parent: 'fn_satlinmas' },
  'fn_kerjasama':            { nama: 'Kerjasama',              parent: 'fn_kerjasama' }
};
var LEGACY_LOKASI = {
  'lok_3503012001': 'lok_3503100', 'lok_3503012002': 'lok_3503100',
  'lok_3503012003': 'lok_3503100', 'lok_3503012004': 'lok_3503100',
  'lok_3503012005': 'lok_3503100',
  'lok_3503022001': 'lok_3503010', 'lok_3503022002': 'lok_3503010',
  'lok_3503022003': 'lok_3503010',
  'lok_3503032001': 'lok_3503020', 'lok_3503032002': 'lok_3503020'
};

// Utils sumber — dipindah ke sini agar pakai SPREADSHEET_ID
function isDateLike_(v){ return v !== null && typeof v === 'object' && typeof v.getMonth === 'function'; }
function isActive_(v){ if(v===true||v===1) return true; var s=String(v).toUpperCase().trim(); return s==='TRUE'||s==='AKTIF'; }
function formatDate_(d){ if(isDateLike_(d)) return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); return String(d); }
function formatNumberID_(n){ if(!n && n!==0) return '-'; return new Intl.NumberFormat('id-ID').format(n); }

// Periode maps (adaptasi: pakai getSheetData_)
function getPeriodeMaps_(){
  var rows = getSheetData_('M_PERIODE');
  var byId={}, byYM={};
  rows.forEach(function(r){
    if(!r.id) return;
    var label = r.label || (r.tahun ? (['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][Number(r.bulan)-1]+' '+r.tahun) : String(r.id));
    if(isDateLike_(r.label)) label = NAMA_BULAN[r.label.getMonth()]+' '+r.label.getFullYear();
    byId[String(r.id)] = String(label).trim();
    if(r.tahun && r.bulan) byYM[Number(r.tahun)+'-'+String(Number(r.bulan)).padStart(2,'0')] = String(label).trim();
  });
  return {byId:byId, byYM:byYM};
}
function toPeriodeLabel_(v, maps){
  if(v===null||v===undefined||v==='') return '';
  if(isDateLike_(v)){ var y=v.getFullYear(), m=v.getMonth()+1, k=y+'-'+String(m).padStart(2,'0'); return maps.byYM[k] || (NAMA_BULAN[m-1]+' '+y); }
  var str=String(v).trim(); if(!str) return '';
  var bulanMap={'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12};
  var m1=str.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+(\d{4})/);
  if(m1&&bulanMap[m1[1]]){ var k2=m1[2]+'-'+String(bulanMap[m1[1]]).padStart(2,'0'); return maps.byYM[k2] || (NAMA_BULAN[bulanMap[m1[1]]-1]+' '+m1[2]); }
  if(maps.byId[str]) return maps.byId[str];
  var m2=str.match(/(\d{4})-(\d{1,2})/);
  if(m2){ var y2=Number(m2[1]), m2n=Number(m2[2]); if(m2n>=1&&m2n<=12){ var k3=y2+'-'+String(m2n).padStart(2,'0'); return maps.byYM[k3] || (NAMA_BULAN[m2n-1]+' '+y2); } }
  return str;
}
function getFungsiMap_(){
  var rows=getSheetData_('M_FUNGSI');
  var map={};
  rows.forEach(function(r){
    if(!r.id) return;
    var id=String(r.id).trim();
    var parent=r.parent_id ? String(r.parent_id).trim() : id;
    map[id]={nama:r.nama, parent:parent, unit_id:r.unit_id||''};
  });
  Object.keys(LEGACY_FUNGSI).forEach(function(k){ if(!map[k]) map[k]=LEGACY_FUNGSI[k]; });
  return map;
}
function getUnitMap_(){
  var rows=getSheetData_('REF_UNIT') || getSheetData_('UNIT_KERJA') || [];
  if(!rows.length) { try{ rows=getSheetData_('REF_UNIT'); }catch(e){} }
  var map={};
  // REF_UNIT header: id,kode,nama,parent_id,jenis_unit ...
  rows.forEach(function(r){
    var id=r.id||r[0]; var nama=r.nama||r[2]||id;
    if(id) map[String(id)]=String(nama);
  });
  return map;
}
function getLokasiMap_(){
  var rows=getSheetData_('M_LOKASI');
  var map={};
  rows.forEach(function(r){ if(r.id) map[String(r.id).trim()]=String(r.nama||r.kode||r.id); });
  Object.keys(LEGACY_LOKASI).forEach(function(oldId){
    var nid=LEGACY_LOKASI[oldId];
    if(map[nid]) map[oldId]=map[nid];
  });
  return map;
}
function getUnitList_(){
  var rows=getSheetData_('REF_UNIT') || [];
  return rows.filter(function(r){return r.id;}).map(function(r){
    return {id:String(r.id).trim(), parent_id:String(r.parent_id||'').trim(), jenis_unit:String(r.jenis_unit||'').trim()};
  });
}
function isUnitInBidang_(unitId, bidangId, allUnits){
  if(!bidangId) return true;
  if(unitId===bidangId) return true;
  var cur=allUnits.find(function(u){return u.id===unitId;});
  var depth=0;
  while(cur && depth<5){
    if(cur.parent_id===bidangId) return true;
    cur=allUnits.find(function(u){return u.id===cur.parent_id;});
    depth++;
  }
  return false;
}
function getTahunFromPeriode_(periodeId){ if(!periodeId) return ''; var m=String(periodeId).match(/^prd_(\d{4})/); return m?m[1]:''; }
function getBulanFromPeriode_(periodeId){ if(!periodeId) return ''; var m=String(periodeId).match(/^prd_\d{4}_(\d{2})/); return m?m[1]:''; }
function getFilterOptions_(){
  var tahunSet=new Set();
  getSheetData_('M_PERIODE').forEach(function(r){
    if(r.id){ var t=getTahunFromPeriode_(String(r.id)); if(t) tahunSet.add(t); }
  });
  var tahun=Array.from(tahunSet).sort().reverse();
  var bulan=[{id:'01',nama:'Januari'},{id:'02',nama:'Februari'},{id:'03',nama:'Maret'},{id:'04',nama:'April'},{id:'05',nama:'Mei'},{id:'06',nama:'Juni'},{id:'07',nama:'Juli'},{id:'08',nama:'Agustus'},{id:'09',nama:'September'},{id:'10',nama:'Oktober'},{id:'11',nama:'November'},{id:'12',nama:'Desember'}];
  var bidang=getSheetData_('REF_UNIT').filter(function(r){return r.jenis_unit==='BIDANG';}).map(function(r){return {id:String(r.id).trim(), nama:String(r.nama).trim()};});
  return {tahun:tahun, bulan:bulan, bidang:bidang};
}
function getRowsUtama_(filter){
  filter=filter||{};
  var rows=getSheetData_('T_UTAMA');
  var allUnits=getUnitList_();
  return rows.filter(function(r){
    if(!r.id || !isActive_(r.status_aktif)) return false;
    var periodeId=String(r.periode_id||'');
    var unitId=String(r.unit_id||'');
    if(filter.tahun){ var t=getTahunFromPeriode_(periodeId); if(t!==filter.tahun) return false; }
    if(filter.bulan){ var b=getBulanFromPeriode_(periodeId); if(b!==filter.bulan) return false; }
    if(filter.bidangId){ if(!isUnitInBidang_(unitId, filter.bidangId, allUnits)) return false; }
    return true;
  });
}
function getDimensiMap_(){
  var rows=getSheetData_('M_DIMENSI');
  var map={};
  rows.forEach(function(r){
    if(!r.id) return;
    map[String(r.id).trim()]={id:String(r.id).trim(), kode:String(r.kode||'').trim(), nama:String(r.nama||'').trim(), jenis_input:String(r.jenis_input||'').trim(), fungsi_id:String(r.fungsi_id||'').trim(), urutan:Number(r.urutan)||0};
  });
  return map;
}
function getDimensiByFungsi_(fungsiId){
  var rows=getSheetData_('M_DIMENSI');
  return rows.filter(function(r){return r.id && isActive_(r.status_aktif) && String(r.fungsi_id||'').trim()===String(fungsiId);})
    .map(function(r){return {id:String(r.id).trim(), kode:String(r.kode||'').trim(), nama:String(r.nama||'').trim(), jenis_input:String(r.jenis_input||'').trim(), fungsi_id:String(r.fungsi_id||'').trim(), urutan:Number(r.urutan)||0};})
    .sort(function(a,b){return a.urutan-b.urutan;});
}
function getNilaiDimensiMap_(){
  var rows=getSheetData_('M_NILAI_DIMENSI');
  var map={};
  rows.forEach(function(r){
    if(!r.id) return;
    var dimId=String(r.dimensi_id||'').trim();
    if(!map[dimId]) map[dimId]=[];
    map[dimId].push({id:String(r.id).trim(), kode:String(r.kode||'').trim(), nama:String(r.nama||'').trim(), urutan:Number(r.urutan)||0});
  });
  Object.keys(map).forEach(function(k){ map[k].sort(function(a,b){return a.urutan-b.urutan;}); });
  return map;
}
function getAtributKegiatan_(kegiatanId){
  var rows=getSheetData_('T_ATRIBUT');
  return rows.filter(function(r){return r.id && isActive_(r.status_aktif) && String(r.kegiatan_id||'').trim()===String(kegiatanId);})
    .map(function(r){return {id:String(r.id).trim(), kegiatan_id:String(r.kegiatan_id).trim(), dimensi_id:String(r.dimensi_id||'').trim(), nilai_id:String(r.nilai_id||'').trim(), nilai_text:String(r.nilai_text||'').trim(), nilai_number:Number(r.nilai_number)||0, nilai_date:String(r.nilai_date||'').trim(), keterangan:String(r.keterangan||'').trim()};});
}

// Drive helpers sumber (8 folder)
function getFolderByKey_(key){
  var id=DRIVE_FOLDER_IDS[key];
  if(!id) throw new Error('Folder ID untuk "'+key+'" belum di-setup');
  try{ return DriveApp.getFolderById(id); }catch(e){ throw new Error('Folder '+key+' tidak ditemukan: '+id); }
}
function getLampiranFolder_(kodeKegiatan){
  var rootFolders=DriveApp.getFoldersByName('SI-DATA-SatpolPP');
  var rootFolder=rootFolders.hasNext()?rootFolders.next():DriveApp.createFolder('SI-DATA-SatpolPP');
  var lapRoot; try{ lapRoot=getFolderByKey_('LAMPIRAN'); }catch(e){ lapRoot=rootFolder; }
  // fallback: buat subfolder per kode
  var sanitized=String(kodeKegiatan||'Lainnya').replace(/[^a-zA-Z0-9-_]/g,'_');
  var it=lapRoot.getFoldersByName(sanitized);
  return it.hasNext()?it.next():lapRoot.createFolder(sanitized);
}

// ================= DASHBOARD KPI (dari 01_Dashboard.gs) =================
function getRingkasan_(filter){
  var rows=getRowsUtama_(filter);
  var totalAnggaran=0, totalVolume=0;
  rows.forEach(function(r){ totalAnggaran+=Number(r.anggaran)||0; totalVolume+=Number(r.jumlah)||0; });
  var kegIds=new Set(rows.map(function(r){return String(r.id);}));
  var peserta=getSheetData_('T_PESERTA');
  var pegawaiUnik=new Set();
  peserta.forEach(function(r){
    if(isActive_(r.status_aktif) && r.pegawai_id && kegIds.has(String(r.kegiatan_id))) pegawaiUnik.add(String(r.pegawai_id));
  });
  var fungsiUnik=new Set(rows.map(function(r){return r.fungsi_id;}).filter(Boolean));
  return {totalKegiatan:rows.length, totalAnggaran:totalAnggaran, totalVolume:totalVolume, totalPersonel:pegawaiUnik.size, totalFungsi:fungsiUnik.size};
}
function getTrendBulanan_(filter){
  var rows=getRowsUtama_(filter);
  var maps=getPeriodeMaps_();
  var counter={};
  rows.forEach(function(r){
    var label=toPeriodeLabel_(r.periode_id, maps);
    if(label) counter[label]=(counter[label]||0)+1;
  });
  var keys=Object.keys(counter).sort(function(a,b){
    var partsA=a.split(' '), partsB=b.split(' ');
    var tA=partsA[1], tB=partsB[1];
    var diff=(Number(tA)||0)-(Number(tB)||0);
    if(diff!==0) return diff;
    return NAMA_BULAN.indexOf(partsA[0])-NAMA_BULAN.indexOf(partsB[0]);
  });
  return keys.map(function(k){return {periode:k, jumlah:counter[k]};});
}
function getDataPerFungsi_(filter){
  var rows=getRowsUtama_(filter);
  var fungsiMap=getFungsiMap_();
  var counter={};
  rows.forEach(function(r){ var fid=r.fungsi_id; if(fid) counter[fid]=(counter[fid]||0)+1; });
  return Object.keys(counter).map(function(fid){
    return {id:fid, nama:(fungsiMap[fid]&&fungsiMap[fid].nama)||fid, jumlah:counter[fid]};
  }).sort(function(a,b){return b.jumlah-a.jumlah;});
}
function getDataPerGrup_(filter){
  var rows=getRowsUtama_(filter);
  var fungsiMap=getFungsiMap_();
  var counter={};
  rows.forEach(function(r){
    var fid=r.fungsi_id; if(!fid) return;
    var info=fungsiMap[fid];
    var parent=info?info.parent:null;
    var grup=(parent&&GRUP_MAP[parent])||'Lainnya';
    counter[grup]=(counter[grup]||0)+1;
  });
  return Object.keys(counter).map(function(g){return {grup:g, jumlah:counter[g]};});
}
function getDataPerUnit_(filter){
  var rows=getRowsUtama_(filter);
  var unitMap=getUnitMap_();
  var counter={};
  rows.forEach(function(r){
    var uid=r.unit_id; if(!uid) return;
    var nama=unitMap[uid]||uid;
    counter[nama]=(counter[nama]||0)+1;
  });
  return Object.keys(counter).map(function(u){return {unit:u, jumlah:counter[u]};}).sort(function(a,b){return b.jumlah-a.jumlah;});
}
function getDataPerLokasi_(filter){
  var rows=getRowsUtama_(filter);
  var lokasiMap=getLokasiMap_();
  var counter={};
  rows.forEach(function(r){
    var lid=r.lokasi_id; if(!lid) return;
    var nama=lokasiMap[lid]||lid;
    counter[nama]=(counter[nama]||0)+1;
  });
  return Object.keys(counter).map(function(l){return {lokasi:l, jumlah:counter[l]};}).sort(function(a,b){return b.jumlah-a.jumlah;}).slice(0,10);
}
function getTopPegawai_(filter, limit){
  limit=limit||10;
  var rows=getRowsUtama_(filter);
  var kegIds=new Set(rows.map(function(r){return String(r.id);}));
  var kegAnggaranMap={}, kegVolumeMap={};
  rows.forEach(function(r){ var id=String(r.id); kegAnggaranMap[id]=Number(r.anggaran)||0; kegVolumeMap[id]=Number(r.jumlah)||0; });
  var peserta=getSheetData_('T_PESERTA');
  var counter={};
  peserta.forEach(function(r){
    if(!r.id || !isActive_(r.status_aktif)) return;
    var kegId=String(r.kegiatan_id||'').trim();
    var pegId=String(r.pegawai_id||'').trim();
    if(!kegIds.has(kegId)||!pegId) return;
    if(!counter[pegId]) counter[pegId]={jumlah:0, volume:0, anggaran:0, peran:{}};
    counter[pegId].jumlah++;
    counter[pegId].volume+=kegVolumeMap[kegId]||0;
    counter[pegId].anggaran+=kegAnggaranMap[kegId]||0;
    var peran=String(r.peran||'Anggota');
    counter[pegId].peran[peran]=(counter[pegId].peran[peran]||0)+1;
  });
  var pegMap={}; var pegUnitMap={};
  var pegRows=getSheetData_('PEGAWAI') || getSheetData_('REF_PEGAWAI') || [];
  // PEGAWAI header bervariasi, coba ambil nama field umum
  pegRows.forEach(function(r){
    var pid=String(r.id||r.pegawai_id||'').trim();
    if(!pid) return;
    pegMap[pid]=String(r.nama||r.nama_lengkap||r[2]||pid).trim();
    // unit
    var unitMap=getUnitMap_();
    var uid=String(r.unit_id||r.unit||'').trim();
    pegUnitMap[pid]=unitMap[uid]||'-';
  });
  var hasil=Object.keys(counter).map(function(pid){
    return {id:pid, nama:pegMap[pid]||pid, unit:pegUnitMap[pid]||'-', jumlah:counter[pid].jumlah, volume:counter[pid].volume, anggaran:counter[pid].anggaran, koordinator:counter[pid].peran['Koordinator']||0};
  });
  hasil.sort(function(a,b){return b.jumlah-a.jumlah;});
  return hasil.slice(0, limit);
}
function getLeaderboardUnit_(filter){
  var rows=getRowsUtama_(filter);
  var unitMap=getUnitMap_();
  var counter={};
  rows.forEach(function(r){
    var uid=String(r.unit_id||'').trim(); if(!uid) return;
    var nama=unitMap[uid]||uid;
    if(!counter[nama]) counter[nama]={nama:nama, jumlah:0, volume:0, anggaran:0, fungsi:{}};
    counter[nama].jumlah++;
    counter[nama].volume+=Number(r.jumlah)||0;
    counter[nama].anggaran+=Number(r.anggaran)||0;
    var fid=String(r.fungsi_id||'').trim();
    counter[nama].fungsi[fid]=(counter[nama].fungsi[fid]||0)+1;
  });
  var total=Object.values(counter).reduce(function(s,x){return s+x.jumlah;},0)||1;
  var hasil=Object.values(counter).map(function(u){
    return {nama:u.nama, jumlah:u.jumlah, volume:u.volume, anggaran:u.anggaran, persen:Math.round((u.jumlah/total)*1000)/10, fungsiUnik:Object.keys(u.fungsi).length};
  });
  hasil.sort(function(a,b){return b.jumlah-a.jumlah;});
  return hasil;
}
function getHeatmapBulanGrup_(filter){
  var rows=getRowsUtama_(filter);
  var fungsiMap=getFungsiMap_();
  var maps=getPeriodeMaps_();
  var bulanSet=new Set(), grupSet=new Set(), matrix={};
  rows.forEach(function(r){
    var label=toPeriodeLabel_(r.periode_id, maps); if(!label) return;
    var bulanNama=label.split(' ')[0]; bulanSet.add(bulanNama);
    var fid=String(r.fungsi_id||'').trim();
    var info=fungsiMap[fid];
    var parent=info?info.parent:null;
    var grup=(parent&&GRUP_MAP[parent])||'Lainnya'; grupSet.add(grup);
    var key=grup+'|'+bulanNama; matrix[key]=(matrix[key]||0)+1;
  });
  var bulanSorted=Array.from(bulanSet).sort(function(a,b){return NAMA_BULAN.indexOf(a)-NAMA_BULAN.indexOf(b);});
  var grupUrutan=Object.values(GRUP_MAP);
  var grupSorted=Array.from(grupSet).sort(function(a,b){
    var ia=grupUrutan.indexOf(a), ib=grupUrutan.indexOf(b);
    if(ia===-1&&ib===-1) return a.localeCompare(b);
    if(ia===-1) return 1;
    if(ib===-1) return -1;
    return ia-ib;
  });
  var maxVal=Math.max.apply(null, Object.values(matrix).concat([1]));
  return {bulan:bulanSorted, grup:grupSorted, matrix:matrix, maxVal:maxVal};
}

// ================= TEMATIK CRUD =================