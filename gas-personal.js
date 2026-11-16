// Газовая форма v4: редактируемый тип и добавление без prompt/confirm.
(function(){
'use strict';
var works=['Поверка','Замена АКБ','Поверка + замена АКБ','Диагностика'],submitting=false;
function el(id){return document.getElementById(id);}
function cards(){return Array.from(document.querySelectorAll('#devicesContainer .device-block'));}
function key(v){return String(v||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU');}
function gasRows(rows){return (rows||[]).filter(function(r){return r[1]&&(r[3]==='gas'||/газ/i.test(String(r[2]||'')));});}
function rowFor(name){return typesData.find(function(r){return key(r[1])===key(name);});}
function normalizedWork(v,akb){if(works.includes(v))return v;if(/поверк/i.test(v||''))return akb||/АКБ/i.test(v)?works[2]:works[0];if(/диагност/i.test(v||''))return works[3];if(/АКБ/i.test(v||''))return works[1];return akb?works[2]:works[0];}
function syncWork(b,value){var n=b.id.replace('device',''),w=normalizedWork(value||b.dataset.workType,!!el('akbCheck'+n)?.checked);b.dataset.workType=w;if(el('gasWork'+n))el('gasWork'+n).value=w;if(el('akbCheck'+n))el('akbCheck'+n).checked=w===works[1]||w===works[2];if(el('akbRow'+n))el('akbRow'+n).style.display='none';}
function note(n,text,error){var box=el('gasModelNote'+n);if(box){box.textContent=text;box.style.color=error?'#b42318':'#087443';}}
function options(n){var input=el('nameField'+n),list=el('gasModels'+n);if(!input||!list)return;var q=key(input.value);list.replaceChildren();Array.from(new Set(typesData.map(function(r){return r[1];}))).filter(function(name){return key(name).includes(q);}).forEach(function(name){var op=document.createElement('option');op.value=name;list.append(op);});}
function refresh(){typesData=gasRows(typesData);allTypesFromSheet=typesData.map(function(r){return r[1];});try{localStorage.setItem('gas_model_dictionary',JSON.stringify(typesData));}catch(e){}cards().forEach(function(b){options(b.id.replace('device',''));});}
window.getTypeNames=function(){return Array.from(new Set(gasRows(typesData).map(function(r){return r[1];})));};
async function readResponse(r){if(!r.ok)throw new Error('HTTP '+r.status);var text=await r.text(),d;try{d=JSON.parse(text);}catch(e){throw new Error('Сервер вернул не JSON. Проверьте URL и доступ к развёртыванию Apps Script.');}if(d.section!=='gas'||d.status==='error')throw new Error(d.message||'Не установлен газовый обработчик');return d;}
async function api(action){var u=new URL(gasApiUrl());u.searchParams.set('action','gas_'+action);return readResponse(await fetch(u.href,{cache:'no-store'}));}
async function ensureServer(){var d=await api('info');if(Number(d.version)<4)throw new Error('Сначала обновите Apps Script до версии 4 и обновите развёртывание.');}
window.fetchDictionariesInBackground=async function(){await ensureServer();var d=await api('getModels');if(!Array.isArray(d.rows))throw new Error('Справочник моделей не получен');typesData=gasRows(d.rows);refresh();};
window.loadDictionaries=function(){try{typesData=gasRows(JSON.parse(localStorage.getItem('gas_model_dictionary')||localStorage.getItem('cache_types')||'[]'));}catch(e){typesData=[];}companyListData=[];refresh();showMainContent();fetchDictionariesInBackground().catch(function(e){setStatus(esc(e.message)+'. Данные формы не удалены.','error');});};
var oldCheck=checkType;
window.checkType=function(n){var input=el('typeField'+n),value=input?input.value:'';oldCheck(n);if(input){input.readOnly=false;input.disabled=false;input.value=value;}var b=el('device'+n);if(b)syncWork(b);};
async function saveModel(n){
 var input=el('nameField'+n),typeInput=el('typeField'+n),button=el('gasAddModel'+n),name=input.value.trim(),type=typeInput.value.trim();
 if(!name)throw new Error('Введите название нового прибора.');if(!type)throw new Error('Введите тип прибора вручную.');
 if(button)button.disabled=true;note(n,'Сохраняю прибор в газовый справочник…');
 try{await ensureServer();var d=await readResponse(await fetch(gasApiUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({section:'gas',action:'gas_addModel',name:name,type:type})}));if(!['success','exists'].includes(d.status)||!Array.isArray(d.row))throw new Error('Сервер не подтвердил сохранение модели');var i=typesData.findIndex(function(r){return key(r[1])===key(d.row[1]);});if(i<0)typesData.push(d.row);else typesData[i]=d.row;refresh();input.value=d.row[1];typeInput.value=type;checkType(n);saveFormData();note(n,d.status==='exists'?'Прибор уже есть в справочнике. Введённый тип сохранится в этом акте.':'Прибор сохранён. Можно продолжать приёмку.');return d;}catch(e){note(n,e.message||'Сервер не подтвердил добавление. Повторите попытку.',true);throw e;}finally{if(button)button.disabled=false;}
}
var oldCreate=createDeviceBlock;
window.createDeviceBlock=function(n){
 var b=oldCreate(n),previous=el('nameField'+n),input=document.createElement('input'),list=document.createElement('datalist');input.id=previous.id;input.style.cssText=previous.style.cssText;input.type='text';input.required=true;input.autocomplete='off';input.placeholder='Введите или выберите модель';list.id='gasModels'+n;input.setAttribute('list',list.id);previous.replaceWith(input);input.after(list);
 var row=input.closest('.field-row');row.querySelectorAll('button').forEach(function(x){x.remove();});var button=document.createElement('button');button.type='button';button.id='gasAddModel'+n;button.textContent='Добавить прибор';button.onclick=function(){saveModel(n).catch(function(){});};row.append(button);
 var message=document.createElement('div');message.id='gasModelNote'+n;message.setAttribute('role','status');message.style.fontSize='13px';row.after(message);
 var type=el('typeField'+n);type.readOnly=false;type.disabled=false;type.removeAttribute('readonly');type.removeAttribute('oninput');type.placeholder='Можно напечатать вручную';type.oninput=function(){b.dataset.manualType='1';checkType(n);saveFormData();};b.querySelectorAll('.save-btn').forEach(function(x){x.remove();});
 function choose(){var found=rowFor(input.value);if(found&&b.dataset.manualType!=='1')type.value=found[2];options(n);checkType(n);saveFormData();note(n,found?'':'Новой модели нет в списке: заполните тип и нажмите «Добавить прибор».');}
 input.oninput=choose;input.onchange=choose;options(n);
 var address=el('addressField'+n);if(address){address.placeholder='Адрес установки прибора';var al=address.closest('.field-group')?.querySelector('label');if(al)al.textContent='Адрес установки:';}
 var group=document.createElement('div'),label=document.createElement('label'),work=document.createElement('select');group.className='field-group';label.textContent='Вид работ:';label.htmlFor='gasWork'+n;work.id='gasWork'+n;works.forEach(function(w){work.add(new Option(w,w));});work.onchange=function(){syncWork(b,work.value);saveFormData();};group.append(label,work);el('readingField'+n).closest('.field-group').after(group);syncWork(b,works[0]);return b;
};
var oldInit=initPriemkaMode;
window.initPriemkaMode=function(){oldInit();var input=el('companyInput'),group=input.closest('.field-group');group.querySelector('label').textContent='ФИО клиента:';input.placeholder='Введите фамилию, имя и отчество';input.autocomplete='off';input.removeAttribute('oninput');input.removeAttribute('onblur');input.oninput=saveFormData;input.onblur=null;var list=el('companyList');if(list)list.remove();group.querySelectorAll('button').forEach(function(b){b.remove();});};
window.filterCompanies=function(){};window.hideCompanyList=function(){};window.addCompany=function(){};
var oldLoad=loadActData;
window.loadActData=function(act){oldLoad(act);cards().forEach(function(b,i){var d=(act.devices||[])[i]||{},n=b.id.replace('device','');if(d.type)b.dataset.manualType='1';syncWork(b,normalizedWork(d.workType,d.akb===true||d.akb==='Да'));options(n);});saveFormData();};
var oldSubmit=submitAct;
window.submitAct=async function(){if(submitting)return;submitting=true;try{if(!el('companyInput').value.trim())throw new Error('Введите ФИО клиента.');await ensureServer();for(var b of cards()){var n=b.id.replace('device',''),name=el('nameField'+n).value.trim(),type=el('typeField'+n).value.trim();if(!name||!type)throw new Error('Заполните название и тип каждого прибора.');if(!rowFor(name))await saveModel(n);syncWork(b,el('gasWork'+n).value);}return await oldSubmit();}catch(e){setStatus(esc(e.message),'error');}finally{submitting=false;}};
var oldReturn=createReturnAct;
window.createReturnAct=async function(name,devices){try{await ensureServer();return await oldReturn(name,devices.map(function(d){return Object.assign({},d,{status:normalizedWork(d.workType,d.akb===true||d.akb==='Да')});}));}catch(e){alert(e.message);}};
})();
