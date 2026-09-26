function getCrossTabPerGrupTematik_(filter){
  filter=filter||{};
  var allUnits=getUnitList_();
  var fungsiRows=getSheetData_('M_FUNGSI');
  var maps=getPeriodeMaps_();
  var fungsiMap=getFungsiMap_();
  var fungsiSortMap={};
  fungsiRows.forEach(function(r){
    if(!r.id) return;
    var nama=String(r.nama).trim();
    var parent=String(r.parent_id||'').trim();
    var urutan=Number(r.urutan)||0;
    var grupUrutan=0;
    if(parent){ var prow=fungsiRows.find(function(p){return String(p.id).trim()===parent;}); if(prow) grupUrutan=Number(prow.urutan)||0; }
    fungsiSortMap[nama]={grupUrutan:grupUrutan, urutan:urutan};
  });
  var buildCrossTab=function(rows){
    var crossTab={}, fungsiSet=new Set();
    rows.forEach(function(r){
      var label=toPeriodeLabel_(r.periode_id, maps);
      var fid=r.fungsi_id; if(!label||!fid) return;
      var fungsi=(fungsiMap[fid]&&fungsiMap[fid].nama)||fid;
      fungsiSet.add(fungsi);
      if(!crossTab[label]) crossTab[label]={};
      crossTab[label][fungsi]=(crossTab[label][fungsi]||0)+1;
    });
    var periodeKeys=Object.keys(crossTab).sort(function(a,b){
      var pa=a.split(' '), pb=b.split(' ');
      var diff=(Number(pa[1])||0)-(Number(pb[1])||0);
      if(diff!==0) return diff;
      return NAMA_BULAN.indexOf(pa[0])-NAMA_BULAN.indexOf(pb[0]);
    });
    var fungsiSorted=Array.from(fungsiSet).sort(function(a,b){
      var ia=fungsiSortMap[a]||{grupUrutan:999,urutan:999}, ib=fungsiSortMap[b]||{grupUrutan:999,urutan:999};
      if(ia.grupUrutan!==ib.grupUrutan) return ia.grupUrutan-ib.grupUrutan;
      return ia.urutan-ib.urutan;
    });
    var totalPerPeriode={}, totalPerFungsi={};
    periodeKeys.forEach(function(p){
      var total=0;
      fungsiSorted.forEach(function(f){ var v=crossTab[p][f]||0; total+=v; totalPerFungsi[f]=(totalPerFungsi[f]||0)+v; });
      totalPerPeriode[p]=total;
    });
    var grandTotal=Object.values(totalPerPeriode).reduce(function(a,b){return a+b;},0);
    return {periode:periodeKeys, fungsi:fungsiSorted, data:crossTab, totalPerPeriode:totalPerPeriode, totalPerFungsi:totalPerFungsi, grandTotal:grandTotal};
  };
  if(!filter.bidangId){
    var rows=getRowsUtama_(filter);
    var panel=buildCrossTab(rows); panel.grupId=''; panel.grupNama='Semua Grup Fungsi'; return [panel];
  }
  // bidang dipilih — panel per grup
  var seksiList=allUnits.filter(function(u){ return u.parent_id===filter.bidangId && (u.jenis_unit==='SEKSI'||u.jenis_unit==='SUB_BIDANG'); });
  var seksiIds=new Set(seksiList.map(function(s){return s.id;})); seksiIds.add(filter.bidangId);
  var grupList=fungsiRows.filter(function(r){ return r.id && Number(r.level)===1 && seksiIds.has(String(r.unit_id||'').trim()); }).map(function(r){return {id:String(r.id).trim(), nama:String(r.nama).trim(), urutan:Number(r.urutan)||0};}).sort(function(a,b){return a.urutan-b.urutan;});
  if(!grupList.length){
    var rows2=getRowsUtama_(filter);
    var panel2=buildCrossTab(rows2); panel2.grupId=filter.bidangId; panel2.grupNama=getUnitMap_()[filter.bidangId]||filter.bidangId; return [panel2];
  }
  var allRows=getRowsUtama_(filter);
  return grupList.map(function(grup){
    var subIds=new Set([grup.id]); fungsiRows.forEach(function(r){ if(r.id && String(r.parent_id||'').trim()===grup.id) subIds.add(String(r.id).trim()); });
    var rowsF=allRows.filter(function(r){return subIds.has(String(r.fungsi_id||'').trim());});
    var p=buildCrossTab(rowsF); p.grupId=grup.id; p.grupNama=grup.nama; return p;
  });
}
function getPerbandinganTematik_(filter){
  filter=filter||{};
  if(!filter.periodeA || !filter.periodeB) return {error:'Pilih 2 periode'};
  var maps=getPeriodeMaps_();
  var fungsiMap=getFungsiMap_();
  var getData=function(pid){
    var rows=getSheetData_('T_UTAMA').filter(function(r){return r.id && isActive_(r.status_aktif) && String(r.periode_id).trim()===String(pid);});
    var result={byFungsi:{}, total:0, anggaran:0, volume:0};
    rows.forEach(function(r){
      var fname=(fungsiMap[r.fungsi_id]&&fungsiMap[r.fungsi_id].nama)||r.fungsi_id;
      result.byFungsi[fname]=(result.byFungsi[fname]||0)+1;
      result.total++; result.anggaran+=Number(r.anggaran)||0; result.volume+=Number(r.jumlah)||0;
    });
    return result;
  };
  var dataA=getData(filter.periodeA), dataB=getData(filter.periodeB);
  var allFungsi=new Set([...Object.keys(dataA.byFungsi), ...Object.keys(dataB.byFungsi)]);
  var diff=[...allFungsi].map(function(f){
    var a=dataA.byFungsi[f]||0, b=dataB.byFungsi[f]||0, sel=b-a, persen=a>0?(sel/a)*100:(b>0?100:0), status=sel>0?'naik':(sel<0?'turun':'stabil');
    return {fungsi:f, nilaiA:a, nilaiB:b, selisih:sel, persen:Math.round(persen*10)/10, status:status};
  }).sort(function(a,b){
    var ra=a.status==='naik'?0:(a.status==='turun'?1:2), rb=b.status==='naik'?0:(b.status==='turun'?1:2);
    if(ra!==rb) return ra-rb;
    return Math.abs(b.selisih)-Math.abs(a.selisih);
  });
  var selTotal=dataB.total-dataA.total;
  var persenTotal=dataA.total>0?(selTotal/dataA.total)*100:(dataB.total>0?100:0);
  return {
    periodeA:{id:filter.periodeA, label:maps.byId[filter.periodeA]||filter.periodeA},
    periodeB:{id:filter.periodeB, label:maps.byId[filter.periodeB]||filter.periodeB},
    totalA:dataA.total, totalB:dataB.total, selisihTotal:selTotal, persenTotal:Math.round(persenTotal*10)/10,
    anggaranA:dataA.anggaran, anggaranB:dataB.anggaran,
    diffPerFungsi:diff, ringkasan:{naik:diff.filter(function(d){return d.status==='naik';}).length, turun:diff.filter(function(d){return d.status==='turun';}).length, stabil:diff.filter(function(d){return d.status==='stabil';}).length}
  };
}
