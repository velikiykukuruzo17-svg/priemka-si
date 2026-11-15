// Корректировки только газовой формы: физлица, газовый справочник, виды работ.
(function(){
'use strict';
var works=['Поверка','Замена АКБ','Поверка + замена АКБ','Диагностика'];
function el(id){return document.getElementById(id);}
function cards(){return Array.from(document.querySelectorAll('#devicesContainer .device-block'));}
function gasRows(rows){return (rows||[]).filter(function(r){return r[1]&&/газ/i.test(String(r[2]||''));});}
function rowFor(name){return typesData.find(function(r){return r[1]===name;});}
function normalizedWork(value,akb){
  if(works.includes(value))return value;
  if(/поверк/i.test(value||'')&&(akb||/АКБ/i.test(value)))return works[2];
  if(/диагност/i.test(value||''))return works[3];
  if(/АКБ/i.test(value||''))return works[1];
  return akb?works[2]:works[0];
}
function syncWork(block,value){
  var n=block.id.replace('device',''),select=el('gasWork'+n);
  var work=normalizedWork(value||block.dataset.workType,!!el('akbCheck'+n)?.checked);
  block.dataset.workType=work;if(select)select.value=work;
  if(el('akbCheck'+n))el('akbCheck'+n).checked=work===works[1]||work===works[2];
  if(el('akbRow'+n))el('akbRow'+n).style.display='none';
}
function options(n){
  var select=el('nameField'+n);if(!select||select.tagName!=='SELECT')return;
  var value=select.value;select.replaceChildren(new Option('Выберите газовый прибор',''));
  Array.from(new Set(typesData.map(function(r){return r[1];}))).forEach(function(name){select.add(new Option(name,name));});
  select.value=rowFor(value)?value:'';
}
function refresh(){typesData=gasRows(typesData);allTypesFromSheet=typesData.map(function(r){return r[1];});cards().forEach(function(b){options(b.id.replace('device',''));});}
window.getTypeNames=function(){return Array.from(new Set(gasRows(typesData).map(function(r){return r[1];})));};
window.fetchDictionariesInBackground=async function(){
  var response=await fetch(CSV_BASE+GID_TYPES);if(!response.ok)throw new Error('Справочник недоступен');
  var rows=gasRows(parseCSV(await response.text()));if(!rows.length)throw new Error('В справочнике нет газовых приборов');
  typesData=rows;localStorage.setItem('gas_model_dictionary',JSON.stringify(rows));refresh();
};
window.loadDictionaries=function(){
  try{typesData=gasRows(JSON.parse(localStorage.getItem('gas_model_dictionary')||localStorage.getItem('cache_types')||'[]'));}catch(e){typesData=[];}
  companyListData=[];refresh();showMainContent();
  fetchDictionariesInBackground().catch(function(e){setStatus(esc(e.message)+'. Используется сохранённый газовый справочник.','error');});
};
var oldCheck=checkType;
window.checkType=function(n){oldCheck(n);var b=el('device'+n);if(b)syncWork(b);};
var oldCreate=createDeviceBlock;
window.createDeviceBlock=function(n){
  var block=oldCreate(n),oldInput=el('nameField'+n),select=document.createElement('select');
  select.id=oldInput.id;select.required=true;oldInput.replaceWith(select);options(n);
  var row=select.closest('.field-row');row.querySelectorAll('button').forEach(function(b){b.remove();});
  var type=el('typeField'+n);type.readOnly=true;type.removeAttribute('oninput');
  block.querySelectorAll('.save-btn').forEach(function(b){b.remove();});
  select.onchange=function(){var r=rowFor(select.value);type.value=r?String(r[2]):'';checkType(n);saveFormData();};
  var group=document.createElement('div'),label=document.createElement('label'),work=document.createElement('select');
  group.className='field-group';label.textContent='Вид работ:';label.htmlFor='gasWork'+n;work.id='gasWork'+n;
  works.forEach(function(w){work.add(new Option(w,w));});
  work.onchange=function(){syncWork(block,work.value);saveFormData();};group.append(label,work);
  el('readingField'+n).closest('.field-group').after(group);syncWork(block,works[0]);return block;
};
var oldInit=initPriemkaMode;
window.initPriemkaMode=function(){
  oldInit();var input=el('companyInput'),group=input.closest('.field-group');
  group.querySelector('label').textContent='ФИО сдатчика:';input.placeholder='Введите фамилию, имя и отчество';input.autocomplete='off';
  input.removeAttribute('oninput');input.removeAttribute('onblur');input.oninput=saveFormData;input.onblur=null;
  var list=el('companyList');if(list)list.remove();group.querySelectorAll('button').forEach(function(b){b.remove();});
};
window.filterCompanies=function(){};window.hideCompanyList=function(){};window.addCompany=function(){};
var oldLoad=loadActData;
window.loadActData=function(act){
  oldLoad(act);cards().forEach(function(b,i){var d=(act.devices||[])[i]||{};syncWork(b,normalizedWork(d.workType,d.akb===true||d.akb==='Да'));});
  saveFormData();
};
async function ensureServer(){
  var r=await fetch(gasApiUrl()+'&action=gas_info'),d=await r.json();
  if(d.section!=='gas'||Number(d.version)<2)throw new Error('Сначала обновите Apps Script до версии газового обработчика 2.');
}
var oldSubmit=submitAct;
window.submitAct=async function(){
  try{
    if(!el('companyInput').value.trim())throw new Error('Введите ФИО сдатчика.');
    cards().forEach(function(b){var n=b.id.replace('device','');if(!rowFor(el('nameField'+n).value))throw new Error('Выберите прибор из газового справочника.');syncWork(b,el('gasWork'+n).value);});
    await ensureServer();return await oldSubmit();
  }catch(e){setStatus(esc(e.message),'error');}
};
var oldReturn=createReturnAct;
window.createReturnAct=async function(name,devices){
  try{await ensureServer();return await oldReturn(name,devices.map(function(d){return Object.assign({},d,{status:normalizedWork(d.workType,d.akb===true||d.akb==='Да')});}));}catch(e){alert(e.message);}
};
})();
