// ============ ПРОДВИНУТЫЙ ПОИСК И ФИЛЬТРАЦИЯ ============

// Флаг - включены ли фильтры
var filtersActive=false;

window.addEventListener('load',function(){
setTimeout(addSearchPanel,800);
});

function addSearchPanel(){
var devicesMode=document.getElementById('devicesMode');
if(!devicesMode)return;
if(document.getElementById('filterPanel'))return;

var oldSearch=document.getElementById('deviceSearch');
if(!oldSearch)return;

var container=oldSearch.parentElement;

var filterRow=document.createElement('div');
filterRow.id='filterPanel';
filterRow.style.cssText='display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap';

filterRow.innerHTML=
'<input type="date" id="filterDateFrom" placeholder="С даты" style="flex:1;min-width:110px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px" onchange="applyFilters()">'+
'<input type="date" id="filterDateTo" placeholder="По дату" style="flex:1;min-width:110px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px" onchange="applyFilters()">'+
'<select id="filterCompany" style="flex:1;min-width:130px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px" onchange="applyFilters()"><option value="">🏢 Все</option></select>'+
'<button onclick="clearFilters()" style="padding:8px 12px;background:#FF3B30;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer">✕</button>';

container.after(filterRow);

// Перехватываем поиск
oldSearch.oninput=function(){
if(this.value===''&&!filtersActive){loadDevices();return;}
applyFilters();
};
var searchBtn=container.querySelector('button');
if(searchBtn)searchBtn.onclick=function(){applyFilters();};

updateCompanies();
}

// Переопределяем renderDevicesFromCache для учёта фильтров
var _originalRender=renderDevicesFromCache;
renderDevicesFromCache=function(search){
// Если фильтры активны - используем applyFilters вместо оригинального рендера
if(filtersActive){
applyFilters();
return;
}
// Иначе - обычный рендер
_originalRender(search);
};

function applyFilters(){
var query=(document.getElementById('deviceSearch')?.value||'').toLowerCase().trim();
var dateFrom=document.getElementById('filterDateFrom')?.value||'';
var dateTo=document.getElementById('filterDateTo')?.value||'';
var company=document.getElementById('filterCompany')?.value||'';

// Проверяем активны ли фильтры
filtersActive=(query!==''||dateFrom!==''||dateTo!==''||company!=='');

if(!filtersActive){
// Фильтры не активны - обычная загрузка
loadDevices();
return;
}

// Копируем и фильтруем
var filtered=allDevicesCache.slice();

if(query){
filtered=filtered.filter(function(d){
var s=(d.serial||'').toLowerCase();
var c=(d.company||'').toLowerCase();
var n=(d.name||'').toLowerCase();
return s.includes(query)||c.includes(query)||n.includes(query);
});
}

if(dateFrom){
var df=dateFrom.split('-').reverse().join('.');
filtered=filtered.filter(function(d){
if(!d.actDate)return false;
var ad=d.actDate;
if(ad.includes('-'))ad=ad.split('-').reverse().join('.');
if(ad.includes('T'))ad=ad.split('T')[0].split('-').reverse().join('.');
return ad>=df;
});
}

if(dateTo){
var dt=dateTo.split('-').reverse().join('.');
filtered=filtered.filter(function(d){
if(!d.actDate)return false;
var ad=d.actDate;
if(ad.includes('-'))ad=ad.split('-').reverse().join('.');
if(ad.includes('T'))ad=ad.split('T')[0].split('-').reverse().join('.');
return ad<=dt;
});
}

if(company){
filtered=filtered.filter(function(d){return d.company===company;});
}

// Рендерим
if(currentDeviceTab==='repair'){
filtered=filtered.filter(function(d){return d.status==='Ремонт'||d.status==='Калибровка'||d.status==='Настройка';});
renderRepairTab(filtered);
}else{
// Вызываем оригинальный рендер с подменой кеша
var saved=allDevicesCache;
allDevicesCache=filtered;
_originalRender(query||'');
allDevicesCache=saved;
}
}

function clearFilters(){
document.getElementById('filterDateFrom').value='';
document.getElementById('filterDateTo').value='';
document.getElementById('filterCompany').value='';
document.getElementById('deviceSearch').value='';
filtersActive=false;
loadDevices();
}

function updateCompanies(){
var select=document.getElementById('filterCompany');
if(!select)return;
var current=select.value;
var companies=[];
allDevicesCache.forEach(function(d){
if(d.company&&companies.indexOf(d.company)===-1)companies.push(d.company);
});
companies.sort();
select.innerHTML='<option value="">🏢 Все</option>';
companies.forEach(function(c){
select.innerHTML+='<option value="'+c+'">'+c+'</option>';
});
select.value=current;
}

var _origSwitchTab2=switchDeviceTab;
switchDeviceTab=function(tab){
_origSwitchTab2(tab);
setTimeout(updateCompanies,300);
if(!filtersActive)return;
setTimeout(applyFilters,500);
};
