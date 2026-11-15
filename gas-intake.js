(function () {
'use strict';
window.gasApiUrl = function () { return SCRIPT_URL + '?section=gas'; };
function api(action, params) {
  var u = new URL(gasApiUrl());
  u.searchParams.set('action', 'gas_' + action);
  Object.keys(params || {}).forEach(function(k) { u.searchParams.set(k, params[k]); });
  return u.href;
}
function el(id) { return document.getElementById(id); }
function blocks() { return Array.from(document.querySelectorAll('#devicesContainer .device-block')); }
function field(n, key) { var f=el(key+n); return f ? f.value.trim() : ''; }
function uid() { return crypto.randomUUID(); }
var pendingId = null, pendingPayload = null, awaitingDraft = false;
function readDevices(validate) {
  return blocks().map(function(b) {
    var n=b.id.replace('device',''), dual=isDualSerialType(Number(n));
    var reading=field(n,'readingField');
    if (validate && reading && !/^\d+(?:[.,]\d+)?$/.test(reading)) throw new Error('Показания: введите неотрицательное число без единиц измерения.');
    var first=dual ? field(n,'serialDual1_') : field(n,'serialField');
    var second=dual ? field(n,'serialDual2_') : '';
    var d={type:field(n,'typeField'),name:field(n,'nameField'),serial:first+(second?'/'+second:''),address:field(n,'addressField'),note:field(n,'noteField'),akb:!!el('akbCheck'+n)?.checked,reading:reading};
    if(b.dataset.workType)d.workType=b.dataset.workType;
    if (validate && (!d.type || !d.name || !first)) throw new Error('Заполните название, тип и заводской номер каждого прибора.');
    return d;
  });
}
window.renumberDevices=function() {
  var max=0;
  blocks().forEach(function(b,i) { b.querySelector('.device-number').textContent=i+1; max=Math.max(max,Number(b.id.replace('device',''))); });
  deviceCounter=max;
};
var originalCreate=createDeviceBlock;
window.createDeviceBlock=function(n) {
  var b=originalCreate(n), group=document.createElement('div');
  group.className='field-group';
  var label=document.createElement('label'),input=document.createElement('input');
  label.textContent='Текущие показания:'; label.htmlFor='readingField'+n;
  input.id='readingField'+n; input.type='text'; input.inputMode='decimal';
  input.placeholder='Например: 00123,45'; input.pattern='[0-9]+([.,][0-9]+)?';
  input.oninput=saveFormData; group.append(label,input);
  b.querySelector('[id="serialField'+n+'"]').closest('.field-group').after(group);
  return b;
};
window.loadDictionaries=function(){
  try {typesData=JSON.parse(localStorage.getItem('cache_types')||'[]');companyListData=JSON.parse(localStorage.getItem('cache_companies')||'[]');}catch(e){typesData=[];companyListData=[];}
  showMainContent();
  fetchDictionariesInBackground().catch(function(){setStatus('Справочники недоступны. Можно вводить данные вручную.','loading');});
};
var originalInit=initPriemkaMode;
window.initPriemkaMode=function() {
  awaitingDraft=true;
  originalInit();
  var group=document.createElement('div'); group.className='field-group';
  group.innerHTML='<label for="clientPhone">Номер телефона клиента:</label><input id="clientPhone" type="tel" autocomplete="tel" placeholder="+7 ...">';
  el('companyInput').closest('.field-group').after(group);
  el('clientPhone').oninput=saveFormData;
};
function draft() {
  return {company:el('companyInput')?.value||'',phone:el('clientPhone')?.value||'',devices:readDevices(false)};
}
window.saveFormData=function() {
  if(awaitingDraft)return;
  try { localStorage.setItem('gas_priemkaFormData',JSON.stringify(draft())); showSaved(); }
  catch(e) { if(el('status'))setStatus(esc(e.message),'error'); }
};
window.loadActData=function(act) {
  el('companyInput').value=act.company||''; el('clientPhone').value=act.phone||'';
  el('devicesContainer').innerHTML='';deviceCounter=0;usedAddresses=[];
  (act.devices||[]).forEach(function(d) {
    var n=++deviceCounter;var block=createDeviceBlock(n);block.dataset.workType=d.workType||'';
    el('typeField'+n).value=d.type||''; el('nameField'+n).value=d.name||'';
    el('addressField'+n).value=d.address||'';el('noteField'+n).value=d.note||'';
    el('readingField'+n).value=d.reading == null ? '' : String(d.reading);
    checkType(n);
    if(isDualSerialType(n) && String(d.serial||'').includes('/')) {
      var parts=String(d.serial).split('/');el('serialDual1_'+n).value=parts[0];el('serialDual2_'+n).value=parts.slice(1).join('/');
    } else el('serialField'+n).value=d.serial||'';
    el('akbCheck'+n).checked=d.akb===true||d.akb==='Да';
    if(d.address && usedAddresses.indexOf(d.address)<0)usedAddresses.push(d.address);
  });
  if(!deviceCounter)addDevice();
  if(act.number)localStorage.setItem('gas_lastActNumber',String(act.number));
  pendingId=null;pendingPayload=null;saveFormData();
};
window.loadFormData=function() {
  try { var value=localStorage.getItem('gas_priemkaFormData');if(value)loadActData(JSON.parse(value)); }
  catch(e) { setStatus('Не удалось восстановить газовый черновик: '+esc(e.message),'error'); }
  finally {awaitingDraft=false;}
};
window.newAct=function() {
  if(!confirm('Очистить газовый черновик и создать новый акт?'))return;
  loadActData({devices:[]});localStorage.removeItem('gas_priemkaFormData');
  localStorage.removeItem('gas_lastActNumber');el('printBtn').style.display='none';
};
async function get(action,params) {
  var response=await fetch(api(action,params));if(!response.ok)throw new Error('HTTP '+response.status);
  var data=await response.json();
  if(data.section!=='gas')throw new Error('Газовый обработчик Apps Script ещё не установлен. Запись заблокирована.');
  if(data.status==='error')throw new Error(data.message||data.error||'Ошибка сервера');return data;
}
async function sendAct(data) {
  await get('info');
  var serialized=JSON.stringify(data);
  if(serialized!==pendingPayload){pendingPayload=serialized;pendingId=uid();}
  data.section='gas';data.requestId=pendingId;
  var response=await fetch(gasApiUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(data)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  var result=await response.json();
  if(result.section!=='gas'||result.status!=='success')throw new Error(result.message||'Сервер не подтвердил создание газового акта.');
  localStorage.setItem('gas_lastActNumber',result.actNumber);
  if(el('printBtn'))el('printBtn').style.display='block';
  pendingPayload=null;pendingId=null;
  return result;
}
function today() { var n=new Date();return ('0'+n.getDate()).slice(-2)+'.'+('0'+(n.getMonth()+1)).slice(-2)+'.'+n.getFullYear(); }
window.submitAct=async function() {
  var button=el('submitBtn');
  try {
    var data={date:today(),company:el('companyInput').value.trim(),phone:el('clientPhone').value.trim(),employee:currentUser,email:settings.email||'',actType:'Приёмка',devices:readDevices(true)};
    if(!data.company||!data.employee||!data.devices.length)throw new Error('Укажите компанию, сотрудника и приборы.');
    if(!data.email)throw new Error('Укажите email в настройках.');
    button.disabled=true;setStatus('Создание газового акта...','loading');
    var result=await sendAct(data);
    localStorage.removeItem('gas_priemkaFormData');
    setStatus(esc('Создан акт №'+result.actNumber+(result.warning?' — '+result.warning:'. PDF отправлен на '+data.email)),result.warning?'loading':'success');
    loadDevices();
  } catch(e) {setStatus(esc(e.message)+' Повторная отправка неизменённых данных использует тот же идентификатор запроса.','error');}
  finally {button.disabled=false;}
};
window.createReturnAct=async function(company,devices) {
  if(!confirm('Создать газовый акт возврата для «'+company+'»?'))return;
  try {
    var data={date:today(),company:company,phone:devices[0]?.phone||'',employee:currentUser,email:settings.email||'',actType:'Выдача',devices:devices.map(function(d){return {type:d.type,name:d.name,serial:d.serial,address:d.address,akb:d.akb===true||d.akb==='Да',note:d.repairReason||d.note||'',reading:d.reading==null?'':String(d.reading),workType:d.status||'Поверка (годен)'};})};
    var result=await sendAct(data);alert('Создан газовый акт №'+result.actNumber+(result.warning?'\n'+result.warning:''));
  } catch(e) {alert(e.message);}
};
window.printAct=async function() {
  var number=localStorage.getItem('gas_lastActNumber');
  if(!number){alert('Сначала создайте или выберите газовый акт.');return;}
  var tab=window.open('about:blank','_blank');
  try {var result=await get('printAct',{number:number});if(tab)tab.location.href=result.pdfUrl;else alert(result.pdfUrl);}
  catch(e){if(tab)tab.close();alert(e.message);}
};
window.loadDevices=async function() {
  try {var data=await get('getDevices');allDevicesCache=data.devices||[];localStorage.setItem('gas_cache_devices',JSON.stringify(allDevicesCache));renderDevicesFromCache((el('deviceSearch')?.value||'').toLowerCase());if(typeof updateCompanyList==='function')updateCompanyList();}
  catch(e){if(el('devicesList'))el('devicesList').textContent=e.message;}
};
window.saveRepairStatus=async function() {
  var row=currentRepairRow;if(!row)return;
  var status=el('newRepairStatus').value,note=el('repairNote').value.trim();
  try {await get('updateRepairStatus',{row:row,status:status,note:note});closeRepairStatusModal();await loadDevices();}
  catch(e){alert(e.message);}
};
function renderActs(container,acts,modal) {
  container.replaceChildren();
  if(!Object.keys(acts).length){container.textContent='Нет газовых актов.';return;}
  Object.values(acts).reverse().forEach(function(a) {
    var item=document.createElement('div');item.className='act-item';
    item.textContent='Акт №'+a.number+' от '+a.date+' — '+a.company+' | '+a.devicesCount+' приборов';
    item.onclick=function(){loadFromArchive(a.number,modal);};container.appendChild(item);
  });
}
async function loadFromArchive(number,modal) {
  try {var a=await get('getAct',{number:number});if(!modal)showMode('priemka');
    setTimeout(function(){loadActData(a);el('printBtn').style.display='block';if(modal)closeActsList();},550);
  }catch(e){alert(e.message);}
}
window.loadArchive=async function(){var c=el('archiveContent');c.textContent='Загрузка газового архива...';try{var d=await get('getActs');renderActs(c,d.acts,false);}catch(e){c.textContent=e.message;}};
window.openActsList=async function(){el('actsModal').style.display='block';var c=el('actsList');c.textContent='Загрузка...';try{var d=await get('getActs');renderActs(c,d.acts,true);}catch(e){c.textContent=e.message;}};
window.loadActFromModal=function(n){loadFromArchive(n,true);};
window.restoreAct=function(n){loadFromArchive(n,false);};
window.addEventListener('load',function(){
  loadDevices();
  var params=new URLSearchParams(location.search),mode=params.get('mode');
  if(currentUser && (mode==='priemka'||mode==='archive'||mode==='devices')){
    showMode(mode);
    if(mode==='priemka' && params.get('company'))setTimeout(function(){el('companyInput').value=params.get('company');saveFormData();},850);
  }
});
})();
