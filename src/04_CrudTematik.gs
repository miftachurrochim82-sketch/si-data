function getMasterOptions_(){
  var opt={};
  opt.allUnits=getSheetData_('REF_UNIT').map(function(r){return {id:String(r.id).trim(), kode:String(r.kode||'').trim(), nama:String(r.nama||'').trim(), parent_id:String(r.parent_id||'').trim(), jenis_unit:String(r.jenis_unit||'').trim()};});
  opt.allFungsi=getSheetData_('M_FUNGSI').map(function(r){return {id:String(r.id).trim(), kode:String(r.kode||'').trim(), nama:String(r.nama||'').trim(), parent_id:String(r.parent_id||'').trim(), unit_id:String(r.unit_id||'').trim(), level:Number(r.level)||0, urutan:Number(r.urutan)||0};});
  opt.kategori=getSheetData_('M_KATEGORI').map(function(r){return {id:r.id, nama:r.nama};});
  opt.jenis=getSheetData_('M_JENIS').map(function(r){return {id:r.id, nama:r.nama};});
  var maps=getPeriodeMaps_();
  opt.periode=getSheetData_('M_PERIODE').map(function(r){return {id:r.id, label:maps.byId[String(r.id)]};});
  opt.satuan=getSheetData_('M_SATUAN').map(function(r){return {id:r.id, nama:r.nama, simbol:r.simbol};});
  opt.lokasi=getSheetData_('M_LOKASI').filter(function(r){return r.id;}).map(function(r){return {id:r.id, nama:r.nama};});
  return opt;
}
function getKegiatanListTematik_(filter){
  var rows=getRowsUtama_(filter);
  var maps=getPeriodeMaps_();
  var fungsiMap=getFungsiMap_();
  var unitMap=getUnitMap_();
  var lokasiMap=getLokasiMap_();
  var satuanMap={}; getSheetData_('M_SATUAN').forEach(function(r){ if(r.id) satuanMap[String(r.id)]=r.simbol||r.nama; });
  return rows.map(function(r){
    return {
      id:r.id, kode:r.kode, tanggal:formatDate_(r.tanggal),
      unit_id:r.unit_id, unit_nama:unitMap[r.unit_id]||r.unit_id,
      fungsi_id:r.fungsi_id, fungsi_nama:(fungsiMap[r.fungsi_id]&&fungsiMap[r.fungsi_id].nama)||r.fungsi_id,
      periode:toPeriodeLabel_(r.periode_id, maps),
      lokasi_nama:lokasiMap[r.lokasi_id]||r.lokasi_id,
      uraian:r.uraian, jumlah:r.jumlah, satuan:satuanMap[r.satuan_id]||r.satuan_id,
      anggaran:r.anggaran, status:r.status
    };
  }).reverse();
}
function generateIdKegiatan_(periodeId){
  var data=getSheetData_('T_UTAMA');
  var prefix='t_'+String(periodeId).replace('prd_','');
  var max=0;
  data.forEach(function(r){
    var id=String(r.id||'');
    if(id.indexOf(prefix+'_')===0){ var num=parseInt(id.substring(prefix.length+1),10); if(!isNaN(num)&&num>max) max=num; }
  });
  return prefix+'_'+String(max+1).padStart(3,'0');
}
function generateKodeKegiatan_(periodeId){
  var maps=getPeriodeMaps_();
  var label=maps.byId[periodeId]||'';
  var tahun=label.split(' ')[1]|| new Date().getFullYear();
  var max=0;
  getSheetData_('T_UTAMA').forEach(function(r){
    var m=String(r.kode||'').match(/TRB-(\d{4})-(\d+)/);
    if(m&&m[1]==String(tahun)){ var num=parseInt(m[2],10); if(!isNaN(num)&&num>max) max=num; }
  });
  return 'TRB-'+tahun+'-'+String(max+1).padStart(3,'0');
}
function getDimensiForForm_(fungsiId){
  var dimensi=getDimensiByFungsi_(fungsiId);
  var nilaiMap=getNilaiDimensiMap_();
  return dimensi.map(function(d){ return {id:d.id, kode:d.kode, nama:d.nama, jenis_input:d.jenis_input, urutan:d.urutan, opsi:nilaiMap[d.id]||[]}; });
}
function simpanAtributKegiatan_(kegiatanId, atributList){
  if(!kegiatanId||!atributList||!atributList.length) return {success:true, total:0};
  var sheetName='T_ATRIBUT';
  var max=0;
  getSheetData_(sheetName).forEach(function(r){
    var m=String(r.id||'').match(/atr_(\d+)/); if(m){ var n=parseInt(m[1],10); if(n>max) max=n; }
  });
  var user='system'; try{ user=Session.getActiveUser().getEmail()||'system'; }catch(e){}
  var now=new Date().toISOString();
  var count=0;
  atributList.forEach(function(atr){
    var hasValue=(atr.nilai_id&&atr.nilai_id!=='')||(atr.nilai_text&&atr.nilai_text!=='')||(atr.nilai_number&&Number(atr.nilai_number)!==0)||(atr.nilai_date&&atr.nilai_date!=='');
    if(!hasValue) return;
    max++; var id='atr_'+String(max).padStart(5,'0');
    var rec={id:id, kegiatan_id:kegiatanId, dimensi_id:atr.dimensi_id||'', nilai_id:atr.nilai_id||'', nilai_text:atr.nilai_text||'', nilai_number:Number(atr.nilai_number)||0, nilai_date:atr.nilai_date||'', keterangan:atr.keterangan||'', status_aktif:true, created_at:now, updated_at:now, created_by:user, updated_by:user, deleted_at:''};
    saveRecord_(sheetName, rec, {email:user, role:'user'});
    count++;
  });
  return {success:true, total:count};
}
function hapusAtributKegiatan_(kegiatanId){
  if(!kegiatanId) return {success:true, total:0};
  var rows=getSheetData_('T_ATRIBUT');
  var user='system'; try{ user=Session.getActiveUser().getEmail()||'system'; }catch(e){}
  var now=new Date().toISOString();
  var count=0;
  rows.forEach(function(r){
    if(String(r.kegiatan_id).trim()===String(kegiatanId).trim() && isActive_(r.status_aktif)){
      var rec=Object.assign({}, r, {status_aktif:false, updated_at:now, updated_by:user, deleted_at:now});
      saveRecord_('T_ATRIBUT', rec, {email:user, role:'user'});
      count++;
    }
  });
  return {success:true, total:count};
}
function simpanKegiatanTematik_(payload, actor){
  var wajib=['tanggal','unit_id','fungsi_id','kategori_id','jenis_id','periode_id','lokasi_id','uraian','jumlah','satuan_id'];
  for(var i=0;i<wajib.length;i++){ if(!payload[wajib[i]]) return {success:false, error:'Field '+wajib[i]+' wajib diisi'}; }
  var id=generateIdKegiatan_(payload.periode_id);
  var kode=generateKodeKegiatan_(payload.periode_id);
  var rec={
    id:id, kode:kode, tanggal:payload.tanggal, unit_id:payload.unit_id, fungsi_id:payload.fungsi_id,
    kategori_id:payload.kategori_id, jenis_id:payload.jenis_id, periode_id:payload.periode_id, lokasi_id:payload.lokasi_id,
    uraian:payload.uraian, jumlah:Number(payload.jumlah)||0, satuan_id:payload.satuan_id,
    anggaran:Number(payload.anggaran)||0, status:payload.status||'DRAFT',
    keterangan:payload.keterangan||'', status_aktif:true
  };
  saveRecord_('T_UTAMA', rec, actor);
  var atrResult={total:0};
  if(payload.atribut && payload.atribut.length) atrResult=simpanAtributKegiatan_(id, payload.atribut);
  return {success:true, id:id, kode:kode, total_atribut:atrResult.total};
}
function getKegiatanDetailTematik_(id){
  var r=findRecordById_('T_UTAMA', id);
  if(!r) return null;
  var maps=getPeriodeMaps_();
  var fungsiMap=getFungsiMap_();
  var unitMap=getUnitMap_();
  var lokasiMap=getLokasiMap_();
  var satuanMap={}; getSheetData_('M_SATUAN').forEach(function(x){ if(x.id) satuanMap[String(x.id)]=x.simbol||x.nama; });
  var katMap={}; getSheetData_('M_KATEGORI').forEach(function(x){ if(x.id) katMap[String(x.id)]=x.nama; });
  var jenMap={}; getSheetData_('M_JENIS').forEach(function(x){ if(x.id) jenMap[String(x.id)]=x.nama; });
  var kegiatan={
    id:r.id, kode:r.kode, tanggal:formatDate_(r.tanggal),
    unit:unitMap[r.unit_id]||r.unit_id,
    fungsi:(fungsiMap[r.fungsi_id]&&fungsiMap[r.fungsi_id].nama)||r.fungsi_id,
    kategori:katMap[r.kategori_id]||r.kategori_id,
    jenis:jenMap[r.jenis_id]||r.jenis_id,
    periode:toPeriodeLabel_(r.periode_id, maps),
    lokasi:lokasiMap[r.lokasi_id]||r.lokasi_id,
    uraian:r.uraian, jumlah:r.jumlah, satuan:satuanMap[r.satuan_id]||r.satuan_id,
    anggaran:r.anggaran, status:r.status, keterangan:r.keterangan
  };
  // peserta & lampiran & logbook
  var pegMap={}; (getSheetData_('PEGAWAI')||[]).forEach(function(x){ if(x.id) pegMap[String(x.id||x.pegawai_id)]=x.nama||x.nama_lengkap||x.id; });
  var peserta=getSheetData_('T_PESERTA').filter(function(x){return x.kegiatan_id===id && isActive_(x.status_aktif);}).map(function(x){return {id:x.id, pegawai_id:x.pegawai_id, pegawai_nama:pegMap[x.pegawai_id]||x.pegawai_id, peran:x.peran};});
  var lampiran=getSheetData_('T_LAMPIRAN').filter(function(x){return x.kegiatan_id===id && isActive_(x.status_aktif);}).map(function(x){return {id:x.id, nama:x.nama_file, tipe:x.tipe, file_url:x.file_url, deskripsi:x.deskripsi};});
  var logbook=getSheetData_('T_LOGBOOK').filter(function(x){return x.kegiatan_id===id && isActive_(x.status_aktif);}).map(function(x){return {id:x.id, tanggal:formatDate_(x.tanggal), pegawai_nama:pegMap[x.pegawai_id]||x.pegawai_id, uraian:x.uraian};});
  // atribut tematik
  var atribut=getAtributDetail_(id);
  return {kegiatan:kegiatan, peserta:peserta, lampiran:lampiran, logbook:logbook, atribut:atribut};
}
function getAtributDetail_(kegiatanId){
  var rows=getSheetData_('T_ATRIBUT').filter(function(r){return String(r.kegiatan_id).trim()===String(kegiatanId).trim() && isActive_(r.status_aktif);});
  var dimensiMap=getDimensiMap_();
  var nilaiMap={};
  getSheetData_('M_NILAI_DIMENSI').forEach(function(r){ if(r.id) nilaiMap[String(r.id).trim()]=String(r.nama||r.kode||'').trim(); });
  return rows.map(function(r){
    var dimInfo=dimensiMap[r.dimensi_id]||{nama:r.dimensi_id, jenis_input:''};
    var display='';
    if(dimInfo.jenis_input==='SELECT') display=nilaiMap[r.nilai_id]||r.nilai_id||'-';
    else if(dimInfo.jenis_input==='TEXT') display=r.nilai_text||'-';
    else if(dimInfo.jenis_input==='NUMBER') display=formatNumberID_(r.nilai_number);
    else if(dimInfo.jenis_input==='DATE') display=r.nilai_date||'-';
    else display=nilaiMap[r.nilai_id]||r.nilai_text||r.nilai_number||r.nilai_date||'-';
    return {id:r.id, kegiatan_id:r.kegiatan_id, dimensi_id:r.dimensi_id, dimensi_nama:dimInfo.nama, dimensi_kode:dimInfo.kode, jenis_input:dimInfo.jenis_input, nilai_id:r.nilai_id, nilai_text:r.nilai_text, nilai_number:r.nilai_number, nilai_date:r.nilai_date, nilai_display:display, keterangan:r.keterangan};
  });
}

// Target evaluasi (04_Target adaptasi)