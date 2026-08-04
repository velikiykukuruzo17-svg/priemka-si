// ============ ПРОДВИНУТЫЙ ПОИСК И ФИЛЬТРАЦИЯ ============

// Добавляем улучшенный поиск при загрузке страницы
window.addEventListener('load',function(){
setTimeout(addSearchPanel,600);
});

function addSearchPanel(){
var devicesMode=document.getElementById('devicesMode');
if(!devicesMode)return;

// Проверяем что ещё не добавлен
if(document.getElementById('searchPanel'))return;

// Находим старый поиск
var oldSearch=document.getElementById('deviceSearch');
var searchContainer=oldSearch?oldSearch.parentElement:null;

// Создаём новую панель
var panel=document.createElement('div');
panel.id='searchPanel';
panel.innerHTML=`
<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
<input type="text" id="deviceSearch" placeholder="🔍 Поиск по номеру, компании или названию" style="flex:1;min-width:150px;padding:10px;border:1px solid #E5E5EA;border-radius:10px;font-size:14px" oninput="doSearch()">
<button onclick="doSearch()" style="width:40px;height:40px;border-radius:10px;background:#007AFF;color:#fff;border:none;font-size:18px;cursor:pointer">🔍</button>
<button onclick="toggleFilters()" id="filterBtn" style="height:40px;border-radius:10px;background:#8E8E93;color:#fff;border:none;font-size:14px;cursor:pointer;padding:0 12px">⚙️ Фильтры</button>
</div>
<div id="filterPanel" style="display:none;background:#F9F9F9;border-radius:12px;padding:12px;margin-bottom:10px">
<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
<label style="font-size:12px;font-weight:600">📅 С:</label>
<input type="date" id="filterDateFrom" style="flex:1;min-width:120px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px" onchange="doSearch()">
<label style="font-size:12px;font-weight:600">📅 По:</label>
<input type="date" id="filterDateTo" style="flex:1;min-width:120px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px" onchange="doSearch()">
</div>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
<label style="font-size:12px;font-weight:600">🏢 Компания:</label>
<select id="filterCompany" style="flex:1;min-width:150px;padding:8px;border:1px solid #E5E5EA;border-radius:8px;font-size:13px" onchange="doSearch()">
<option value="">Все компании</option>
</select>
<button onclick="resetFilters()" style="height:36px;border-radius:8px;background:#FF3B30;color:#fff;border:none;font-size:13px;cursor:pointer;padding:0 12px">✕ Сбросить</button>
</div>
</div>
`;

// Вставляем панель
if(searchContainer){
searchContainer.replaceWith(panel);
}else{
var statsRow=document.getElementById('statsRow');
if(statsRow)statsRow.after(panel);
}

// Заполняем список компаний
updateCompanyFilter();
// Вешаем слушатель на переключение вкладок для обновления компаний
var origSwitch=switchDeviceTab;
switchDeviceTab=function(tab){
origSwitch(tab);
setTimeout(updateCompanyFilter,300);
};
}

// Показать/скрыть фильтры
function toggleFilters(){
var panel=document.getElementById('filterPanel');
var btn=document.getElementById('filterBtn');
if(panel.style.display==='none'){
panel.style.display='block';
btn.style.background='#007AFF';
}else{
panel.style.display='none';
btn.style.background='#8E8E93';
}
}

// Сбросить фильтры
function resetFilters(){
document.getElementById('filterDateFrom').value='';
document.getElementById('filterDateTo').value='';
document.getElementById('filterCompany').value='';
document.getElementById('deviceSearch').value='';
doSearch();
}

// Выполнить поиск
function doSearch(){
var query=(document.getElementById('deviceSearch')?.value||'').toLowerCase().trim();
var dateFrom=document.getElementById('filterDateFrom')?.value||'';
var dateTo=document.getElementById('filterDateTo')?.value||'';
var company=document.getElementById('filterCompany')?.value||'';

// Фильтруем кеш
var filtered=allDevicesCache;

// Текстовый поиск
if(query){
filtered=filtered.filter(function(d){
return(d.serial&&d.serial.toLowerCase().includes(query))||
(d.company&&d.company.toLowerCase().includes(query))||
(d.name&&d.name.toLowerCase().includes(query))||
(d.type&&d.type.toLowerCase().includes(query));
});
}

// Фильтр по дате
if(dateFrom){
filtered=filtered.filter(function(d){
if(!d.actDate)return false;
var ad=d.actDate.replace(/T.*/,'').split('-').reverse().join('-');
return ad>=dateFrom.split('-').reverse().join('-');
});
}
if(dateTo){
filtered=filtered.filter(function(d){
if(!d.actDate)return false;
var ad=d.actDate.replace(/T.*/,'').split('-').reverse().join('-');
return ad<=dateTo.split('-').reverse().join('-');
});
}

// Фильтр по компании
if(company){
filtered=filtered.filter(function(d){
return d.company===company;
});
}

// Применяем фильтр по вкладкам
if(currentDeviceTab==='repair'){
filtered=filtered.filter(function(d){return d.status==='Ремонт'||d.status==='Калибровка'||d.status==='Настройка';});
renderRepairTab(filtered);
}else{
// Группируем и рендерим через renderDevicesFromCache
// Временно подменяем allDevicesCache
var originalCache=allDevicesCache;
allDevicesCache=filtered;
renderDevicesFromCache(query);
allDevicesCache=originalCache;
}
}

// Обновить список компаний в фильтре
function updateCompanyFilter(){
var select=document.getElementById('filterCompany');
if(!select)return;
var currentVal=select.value;
var companies=[];
allDevicesCache.forEach(function(d){
if(d.company&&companies.indexOf(d.company)===-1)companies.push(d.company);
});
companies.sort();
select.innerHTML='<option value="">Все компании</option>';
companies.forEach(function(c){
select.innerHTML+='<option value="'+c+'">'+c+'</option>';
});
select.value=currentVal;
}
