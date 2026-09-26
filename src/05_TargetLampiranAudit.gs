function getTargetEvaluasi_(filter){
  filter=filter||{};
  var targetRows=getSheetData_('M_TARGET');
  var fungsiMap=getFungsiMap_();
  var maps=getPeriodeMaps_();
  var unitMap=getUnitMap_();
  var realisasiMap={};
  getSheetData_('T_UTAMA').forEach(function(r){
    if(!r.id || !isActive_(r.status_aktif)) return;
    var fid=String(r.fungsi_id||'').trim(), pid=String(r.periode_id||'').trim();
    var key=fid+'|'+pid;
    if(!realisasiMap[key]) realisasiMap[key]={jumlah:0, anggaran:0, volume:0};
    realisasiMap[key].jumlah++;
    realisasiMap[key].anggaran+=Number(r.anggaran)||0;
    realisasiMap[key].volume+=Number(r.jumlah)||0;
  });
  var hasil=[];
  targetRows.forEach(function(r){
    if(!r.id || !isActive_(r.status_aktif)) return;
    var fid=String(r.fungsi_id||'').trim(), pid=String(r.periode_id||'').trim(), uid=String(r.unit_id||'').trim();
    if(filter.periodeId && pid!==filter.periodeId) return;
    if(filter.fungsiId && fid!==filter.fungsiId) return;
    if(filter.unitId && uid!==filter.unitId) return;
    var key=fid+'|'+pid;
    var real=realisasiMap[key]||{jumlah:0, anggaran:0, volume:0};
    var targetKg=Number(r.target_kegiatan)||0, targetAng=Number(r.target_anggaran)||0, targetVol=Number(r.target_volume)||0;
    var capaianKg=targetKg>0 ? (real.jumlah/targetKg)*100 : 0;
    var status='tercapai'; if(capaianKg<50) status='kurang'; else if(capaianKg<100) status='sedang';
    hasil.push({
      id:String(r.id), kode:String(r.kode), nama_target:String(r.nama_target),
      fungsi_id:fid, fungsi_nama:(fungsiMap[fid]&&fungsiMap[fid].nama)||fid,
      periode_id:pid, periode:maps.byId[pid]||pid,
      unit_id:uid, unit_nama:unitMap[uid]||uid,
      target_kegiatan:targetKg, target_anggaran:targetAng, target_volume:targetVol,
      realisasi_kegiatan:real.jumlah, realisasi_anggaran:real.anggaran, realisasi_volume:real.volume,
      capaian_kegiatan:Math.round(capaianKg*10)/10,
      capaian_anggaran: targetAng>0 ? Math.round((real.anggaran/targetAng)*1000)/10 : 0,
      capaian_volume: targetVol>0 ? Math.round((real.volume/targetVol)*1000)/10 : 0,
      status:status, keterangan:String(r.keterangan||'')
    });
  });
  var totalTarget=hasil.reduce(function(s,x){return s+x.target_kegiatan;},0);
  var totalRealisasi=hasil.reduce(function(s,x){return s+x.realisasi_kegiatan;},0);
  return {items:hasil, ringkasan:{totalTarget:totalTarget, totalRealisasi:totalRealisasi, capaian: totalTarget>0?Math.round((totalRealisasi/totalTarget)*1000)/10:0, tercapai:hasil.filter(function(x){return x.status==='tercapai';}).length, sedang:hasil.filter(function(x){return x.status==='sedang';}).length, kurang:hasil.filter(function(x){return x.status==='kurang';}).length}};
}

// Lampiran upload (05_Lampiran adaptasi — pakai SPREADSHEET_ID)
function uploadLampiranTematik_(payload, actor){
  try{
    if(!payload.kegiatan_id || !payload.file_name || !payload.file_data) return {success:false, error:'Data upload tidak lengkap'};
    var sizeBytes=Math.round((payload.file_data.length*3)/4);
    if(sizeBytes>5*1024*1024) return {success:false, error:'File terlalu besar. Maks 5 MB.'};
    var keg=findRecordById_('T_UTAMA', payload.kegiatan_id);
    var kodeKegiatan=keg? keg.kode : 'UNKNOWN';
    var folder=getLampiranFolder_(kodeKegiatan);
    var blob=Utilities.newBlob(Utilities.base64Decode(payload.file_data), payload.mime_type||'application/octet-stream', payload.file_name);
    var file=folder.createFile(blob);
    file.setDescription(payload.deskripsi||'');
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var rec={
      id:'tl_'+String(Date.now()).slice(-6),
      kegiatan_id:payload.kegiatan_id,
      nama_file:payload.file_name,
      tipe:payload.tipe||'file',
      file_url:file.getUrl(),
      deskripsi:payload.deskripsi||'',
      status_aktif:true
    };
    saveRecord_('T_LAMPIRAN', rec, actor);
    return {success:true, id:rec.id, url:file.getUrl(), fileId:file.getId()};
  }catch(e){ return {success:false, error:e.message}; }
}

// Audit (07_Audit adaptasi — pakai saveRecord_)
function writeAuditLogTematik_(payload){
  try{
    var rec={
      id:'log_'+String(Date.now()).slice(-6)+'_'+Math.random().toString(36).substr(2,3),
      timestamp:new Date().toISOString(),
      user: String(payload.user|| Session.getActiveUser().getEmail()||'unknown'),
      aksi:payload.aksi||'UNKNOWN',
      tabel:payload.tabel||'',
      record_id:payload.record_id||'',
      data_lama:String(payload.data_lama||'').substring(0,5000),
      data_baru:String(payload.data_baru||'').substring(0,5000),
      keterangan:String(payload.keterangan||'').substring(0,500),
      status:payload.status||'SUCCESS'
    };
    saveRecord_('AUDIT_LOGS', rec, {email:rec.user, role:'super'});
    return true;
  }catch(e){ Logger.log('Audit log error: '+e.message); return false; }
}
function getAuditLogsTematik_(filter){
  filter=filter||{};
  var rows=getSheetData_('AUDIT_LOGS', {includeDeleted:true});
  var items=rows.map(function(r){
    return {id:String(r.id), timestamp:String(r.timestamp), timestampISO:String(r.timestamp), user:String(r.user), aksi:String(r.aksi), tabel:String(r.tabel), record_id:String(r.record_id), data_lama:String(r.data_lama), data_baru:String(r.data_baru), keterangan:String(r.keterangan), status:String(r.status)};
  });
  if(filter.user) items=items.filter(function(d){return d.user===filter.user;});
  if(filter.aksi) items=items.filter(function(d){return d.aksi===filter.aksi;});
  if(filter.tabel) items=items.filter(function(d){return d.tabel===filter.tabel;});
  if(filter.search){ var s=String(filter.search).toLowerCase(); items=items.filter(function(d){return d.user.toLowerCase().includes(s)||d.record_id.toLowerCase().includes(s)||d.keterangan.toLowerCase().includes(s);});}
  items.sort(function(a,b){return b.timestampISO.localeCompare(a.timestampISO);});
  return {items:items, total:items.length};
}
function auditMasterTematik_(){
  var laporan=[];
  laporan.push('AUDIT DATABASE SI-DATA TEMATIK');
  laporan.push('Waktu: '+new Date().toLocaleString('id-ID'));
  var sheets=['M_FUNGSI','M_DIMENSI','M_NILAI_DIMENSI','M_KATEGORI','M_JENIS','M_PERIODE','M_SATUAN','M_LOKASI','T_UTAMA','T_ATRIBUT','T_PESERTA','T_LAMPIRAN','T_LOGBOOK','M_TARGET','AUDIT_LOGS'];
  sheets.forEach(function(name){
    var rows=getSheetData_(name, {includeDeleted:true});
    var dataRows=rows.filter(function(r){return r.id;});
    laporan.push(name+': '+dataRows.length+' baris');
  });
  var tUtama=getSheetData_('T_UTAMA');
  var idFungsi=new Set(getSheetData_('M_FUNGSI').map(function(r){return String(r.id);} ));
  var orphans=new Set();
  tUtama.forEach(function(r){ var fid=String(r.fungsi_id||'').trim(); if(fid && !idFungsi.has(fid)) orphans.add(fid); });
  if(orphans.size) laporan.push('Orphan fungsi_id: '+Array.from(orphans).join(', '));
  var text=laporan.join('\n');
  Logger.log(text);
  return text;
}

// CrossTab tematik (03_CrossTab adaptasi)