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