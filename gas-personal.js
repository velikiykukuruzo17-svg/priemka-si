// Газовая форма v3: ФИО клиента, поиск модели при вводе, добавление газовых моделей.
(function(){
'use strict';
var works=['Поверка','Замена АКБ','Поверка + замена АКБ','Диагностика'];
function el(id){return document.getElementById(id);}
function cards(){return Array.from(document.querySelectorAll('#devicesContainer .device-block'));}
function gasRows(rows){return (rows||[]).filter(function(r){return r[1]&&/газ/i.test(String(r[2]||''));});}
function rowFor(name){var key=String(name||'').trim().toLocaleLowerCase('ru-RU');return typesData.find(function(r){return String(r[1]).trim().toLocaleLowerCase('ru-RU')===key;});}
function normalizedWork(value,akb){
 if(works.includes(value))return value;
 if(/поверк/i.test(value||''))return akb||/АКБ/i.test(value)?works[2]:works[0];
 if(/диагност/i.test(value||''))return works[3];if(/АКБ/i.test(value||''))return works[1];return akb?works[2]:works[0];
}
function syncWork(block,value){
 var n=block.id.replace('device',''),select=el('gasWork'+n),work=normalizedWork(value||block.dataset.workType,!!el('akbCheck'+n)?.checked);
 block.dataset.workType=work;if(select)select.value=work;
 if(el('akbCheck'+n))el('akbCheck'+n).checked=work===works[1]||work===works[2];
 if(el('akbRow'+n))el('akbRow'+n).style.display='none';
}
function options(n){
 var input=el('nameField'+n),list=el('gasModels'+n);if(!input||!list)return;
 var query=input.value.trim().toLocaleLowerCase('ru-RU');list.replaceChildren();
 Array.from(new Set(typesData.map(function(r){return r[1];}))).filter(function(name){return String(name).toLocaleLowerCase('ru-RU').includes(query);}).forEach(function(name){var option=document.createElement('option');option.value=name;list.append(option);});
}
function refresh(){typesData=gasRows(typesData);allTypesFromSheet=typesData.map(function(r){return r[1];});localStorage.setItem('gas_model_dictionary',JSON.stringify(typesData));cards().forEach(function(b){options(b.id.replace('device',''));});}
window.getTypeNames=function(){return Array.from(new Set(gasRows(typesData).map(function(r){return r[1];})));};
async function api(action,params){
 var url=new URL(gasApiUrl());url.searchParams.set('action','gas_'+action);Object.keys(params||{}).forEach(function(k){url.searchParams.set(k,params[k]);});
 var r=await fetch(url.href,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);var d=await r.json();
 if(d.section!=='gas'||d.status==='error')throw new Error(d.message||'Не установлен газовый обработчик');return d;
}
async function ensureServer(){var d=await api('info');if(Number(d.version)<3)throw new Error('Сначала обновите Apps Script до версии 3.');}
window.fetchDictionariesInBackground=async function(){var d=await api('getModels');if(!Array.isArray(d.rows))throw new Error('Обновите Apps Script до версии 3');typesData=gasRows(d.rows);refresh();};
window.loadDictionaries=function(){
 try{typesData=gasRows(JSON.parse(localStorage.getItem('gas_model_dictionary')||localStorage.getItem('cache_types')||'[]'));}catch(e){typesData=[];}
 companyListData=[];refresh();showMainContent();fetchDictionariesInBackground().catch(function(e){setStatus(esc(e.message)+'. Используется сохранённый газовый справочник.','error');});
};
var oldCheck=checkType;
window.checkType=function(n){oldCheck(n);var b=el('device'+n);if(b)syncWork(b);};
async function addModel(n,button){
 try{
  var input=el('nameField'+n),name=input.value.trim();if(!name)throw new Error('Сначала введите наименование нового прибора.');
  var found=rowFor(name);if(found){input.value=found[1];el('typeField'+n).value=found[2];checkType(n);saveFormData();return;}
  var choice=prompt('Категория нового газового прибора: 1 — счетчик газа; 2 — сигнализатор газа; 3 — газоанализатор.','1');if(choice===null)return;
  var category={'1':'Счетчик газа','2':'Сигнализатор газа','3':'Газоанализатор'}[choice.trim()];if(!category)throw new Error('Введите 1, 2 или 3.');
  if(!confirm('Добавить «'+name+'» в газовый справочник, категория «'+category+'»?'))return;
  button.disabled=true;await ensureServer();
  var response=await fetch(gasApiUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({section:'gas',action:'gas_addModel',name:name,type:category})});
  if(!response.ok)throw new Error('HTTP '+response.status);var d=await response.json();
  if(d.section!=='gas'||!['success','exists'].includes(d.status)||!Array.isArray(d.row))throw new Error(d.message||'Не удалось добавить модель');
  if(!rowFor(d.row[1]))typesData.push(d.row);refresh();input.value=d.row[1];el('typeField'+n).value=d.row[2];checkType(n);saveFormData();setStatus('Газовый прибор добавлен в справочник.','success');
 }catch(e){setStatus(esc(e.message),'error');}finally{button.disabled=false;}
}
var oldCreate=createDeviceBlock;
window.createDeviceBlock=function(n){
 var block=oldCreate(n),previous=el('nameField'+n),input=document.createElement('input'),list=document.createElement('datalist');
 input.id=previous.id;input.type='text';input.required=true;input.autocomplete='off';input.placeholder='Начните вводить модель прибора';list.id='gasModels'+n;input.setAttribute('list',list.id);previous.replaceWith(input);input.after(list);
 var row=input.closest('.field-row');row.querySelectorAll('button').forEach(function(b){b.remove();});
 var button=document.createElement('button');button.type='button';button.textContent='Добавить новый газовый прибор';button.onclick=function(){addModel(n,button);};row.append(button);
 var type=el('typeField'+n);type.readOnly=true;type.removeAttribute('oninput');block.querySelectorAll('.save-btn').forEach(function(b){b.remove();});
 function choose(){var r=rowFor(input.value);type.value=r?String(r[2]):'';options(n);checkType(n);saveFormData();}
 input.oninput=choose;input.onchange=choose;options(n);
 var address=el('addressField'+n);if(address){address.placeholder='Адрес установки прибора';var label=address.closest('.field-group')?.querySelector('label');if(label)label.textContent='Адрес установки:';}
 var group=document.createElement('div'),label=document.createElement('label'),work=document.createElement('select');group.className='field-group';label.textContent='Вид работ:';label.htmlFor='gasWork'+n;work.id='gasWork'+n;
 works.forEach(function(w){work.add(new Option(w,w));});work.onchange=function(){syncWork(block,work.value);saveFormData();};group.append(label,work);el('readingField'+n).closest('.field-group').after(group);syncWork(block,works[0]);return block;
};
var oldInit=initPriemkaMode;
window.initPriemkaMode=function(){
 oldInit();var input=el('companyInput'),group=input.closest('.field-group');group.querySelector('label').textContent='ФИО клиента:';input.placeholder='Введите фамилию, имя и отчество';input.autocomplete='off';input.removeAttribute('oninput');input.removeAttribute('onblur');input.oninput=saveFormData;input.onblur=null;
 var list=el('companyList');if(list)list.remove();group.querySelectorAll('button').forEach(function(b){b.remove();});
};
window.filterCompanies=function(){};window.hideCompanyList=function(){};window.addCompany=function(){};
var oldLoad=loadActData;
window.loadActData=function(act){oldLoad(act);cards().forEach(function(b,i){var d=(act.devices||[])[i]||{};syncWork(b,normalizedWork(d.workType,d.akb===true||d.akb==='Да'));options(b.id.replace('device',''));});saveFormData();};
var oldSubmit=submitAct;
window.submitAct=async function(){try{
 if(!el('companyInput').value.trim())throw new Error('Введите ФИО клиента.');
 cards().forEach(function(b){var n=b.id.replace('device',''),input=el('nameField'+n),r=rowFor(input.value);if(!r)throw new Error('Выберите модель из газового справочника или нажмите «Добавить новый газовый прибор».');input.value=r[1];el('typeField'+n).value=r[2];syncWork(b,el('gasWork'+n).value);});
 await ensureServer();return await oldSubmit();
}catch(e){setStatus(esc(e.message),'error');}};
var oldReturn=createReturnAct;
window.createReturnAct=async function(name,devices){try{await ensureServer();return await oldReturn(name,devices.map(function(d){return Object.assign({},d,{status:normalizedWork(d.workType,d.akb===true||d.akb==='Да')});}));}catch(e){alert(e.message);}};
})();
