// ============ ПРОДВИНУТЫЙ ПОИСК И ФИЛЬТРАЦИЯ ============

// Добавляем фильтры при загрузке
window.addEventListener('load',function(){
setTimeout(addSearchPanel,800);
});

function addSearchPanel(){
var devicesMode=document.getElementById('devicesMode');
if(!devicesMode)return;
if(document.getElementById('filterPanel'))return;

// Находим старый поиск и заменяем его
var oldSearch=document.getElementById('deviceSearch');
if(!oldSearch)return;

// Добавляем поле даты и компании рядом
var container=oldSearch.parentElement;

// Создаём строку фильтров
var filterRow=document.createElement('div');
filterRow.id='filterPanel';
filterRow.style.cssText='display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap';

filterRow.innerHTML=
'<input type="date" id="filterDateFrom" placeholder="С даты" style="flex:1;min-width:110px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px" onchange="applyFilters()">'+
'<input type="date" id="filterDateTo" placeholder="По дату" style="flex:1;min-width:110px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px" onchange="applyFilters()">'+
'<select id="filterCompany" style="flex:1;min-width:130px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:12px" onchange="applyFilters()"><option value="">🏢 Все</option></select>'+
'<button onclick="clearFilters()" style="padding:8px 12px;background:#FF3B30;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer">✕</button>';

// Вставляем после строки поиска
container.after(filterRow);

// Обновляем поиск — теперь он вызывает фильтрацию
oldSearch.oninput=function(){applyFilters();};
var searchBtn=container.querySelector('button');
if(searchBtn)searchBtn.onclick=function(){applyFilters();};

// Обновляем компании
updateCompanies();
}

function applyFilters(){
var query=(document.getElementById('deviceSearch')?.value||'').toLowerCase().trim();
var dateFrom=document.getElementById('filterDateFrom')?.value||'';
var dateTo=document.getElementById('filterDateTo')?.value||'';
var company=document.getElementById('filterCompany')?.value||'';

// Копируем кеш
var filtered=allDevicesCache.slice();

// Текстовый поиск
if(query){
filtered=filtered.filter(function(d){
return(d.serial&&d.serial.toLowerCase().includes(query))||
(d.company&&d.company.toLowerCase().includes(query))||
(d.name&&d.name.toLowerCase().includes(query));
});
}

// Дата С
if(dateFrom){
var df=dateFrom.split('-').reverse().join('.');
filtered=filtered.filter(function(d){
if(!d.actDate)return false;
return d.actDate>=df;
});
}

// Дата По
if(dateTo){
var dt=dateTo.split('-').reverse().join('.');
filtered=filtered.filter(function(d){
if(!d.actDate)return false;
return d.actDate<=dt;
});
}

// Компания
if(company){
filtered=filtered.filter(function(d){return d.company===company;});
}

// Применяем вкладку
if(currentDeviceTab==='repair'){
filtered=filtered.filter(function(d){return d.status==='Ремонт'||d.status==='Калибровка'||d.status==='Настройка';});
renderRepairTab(filtered);
}else{
// Временно подменяем кеш для рендера
var saved=allDevicesCache;
allDevicesCache=filtered;
renderDevicesFromCache(query||'');
allDevicesCache=saved;
}
}

function clearFilters(){
document.getElementById('filterDateFrom').value='';
document.getElementById('filterDateTo').value='';
document.getElementById('filterCompany').value='';
document.getElementById('deviceSearch').value='';
applyFilters();
}

function updateCompanies(){
var select=document.getElementById('filterCompany');
if(!select)return;
var companies=[];
allDevicesCache.forEach(function(d){
if(d.company&&companies.indexOf(d.company)===-1)companies.push(d.company);
});
companies.sort();
select.innerHTML='<option value="">🏢 Все</option>';
companies.forEach(function(c){
select.innerHTML+='<option value="'+c+'">'+c+'</option>';
});
}

// Перехватываем switchDeviceTab для обновления компаний
var _origSwitchTab=switchDeviceTab;
switchDeviceTab=function(tab){
_origSwitchTab(tab);
setTimeout(updateCompanies,300);
};
