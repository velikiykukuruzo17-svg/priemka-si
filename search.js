// ============ ПОИСК И ФИЛЬТРЫ ============
console.log('search.js загружен');

window.addEventListener('load', function() {
    setTimeout(initSearch, 800);
});

function initSearch() {
    var devicesMode = document.getElementById('devicesMode');
    if (!devicesMode) return;
    
    // Удаляем старый поиск
    var oldSearch = document.getElementById('deviceSearch');
    if (oldSearch && oldSearch.parentElement) {
        oldSearch.parentElement.remove();
    }
    
    // Проверяем что ещё не добавлен
    if (document.getElementById('newSearchPanel')) return;

    // Создаём новый поиск
    var panel = document.createElement('div');
    panel.id = 'newSearchPanel';
    panel.innerHTML = 
        '<div style="display:flex;gap:6px;margin-bottom:8px;align-items:center">' +
        '<input type="text" id="deviceSearch" placeholder="🔍 Поиск по номеру, компании или названию" style="flex:1;padding:10px;border:1px solid #E5E5EA;border-radius:10px;font-size:14px" oninput="doFilter()">' +
        '<button onclick="doFilter()" style="width:40px;height:40px;border-radius:10px;background:#007AFF;color:#fff;border:none;font-size:18px;cursor:pointer">🔍</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;flex-wrap:wrap">' +
        '<input type="date" id="filterDateFrom" style="flex:1;min-width:100px;padding:7px;border:1px solid #E5E5EA;border-radius:8px;font-size:11px" onchange="doFilter()">' +
        '<span style="font-size:11px;color:#8E8E93">—</span>' +
        '<input type="date" id="filterDateTo" style="flex:1;min-width:100px;padding:7px;border:1px solid #E5E5EA;border-radius:8px;font-size:11px" onchange="doFilter()">' +
        '<select id="filterCompany" style="flex:1;min-width:120px;padding:7px;border:1px solid #E5E5EA;border-radius:8px;font-size:11px" onchange="doFilter()"><option value="">🏢 Все</option></select>' +
        '<button onclick="resetFilter()" style="padding:7px 10px;background:#FF3B30;color:#fff;border:none;border-radius:8px;font-size:11px;cursor:pointer">✕</button>' +
        '</div>';

    // Вставляем перед statsRow
    var statsRow = document.getElementById('statsRow');
    if (statsRow) {
        statsRow.before(panel);
    }
    
    // Заполняем компании
    updateCompanyList();
    
    // Применяем поиск
    var searchInput = document.getElementById('deviceSearch');
    if (searchInput) {
        searchInput.oninput = function() {
            if (this.value === '' && !hasActiveFilters()) {
                loadDevices();
                return;
            }
            doFilter();
        };
    }
}

// Проверка активных фильтров
function hasActiveFilters() {
    var df = document.getElementById('filterDateFrom');
    var dt = document.getElementById('filterDateTo');
    var fc = document.getElementById('filterCompany');
    return (df && df.value !== '') || (dt && dt.value !== '') || (fc && fc.value !== '');
}

// Фильтрация
function doFilter() {
    var query = '';
    var searchInput = document.getElementById('deviceSearch');
    if (searchInput) query = searchInput.value.toLowerCase().trim();
    
    var dateFrom = '';
    var dateTo = '';
    var company = '';
    
    var df = document.getElementById('filterDateFrom');
    var dt = document.getElementById('filterDateTo');
    var fc = document.getElementById('filterCompany');
    
    if (df) dateFrom = df.value;
    if (dt) dateTo = dt.value;
    if (fc) company = fc.value;

    // Если ничего не выбрано - обычная загрузка
    if (query === '' && dateFrom === '' && dateTo === '' && company === '') {
        loadDevices();
        return;
    }

    // Фильтруем
    var filtered = allDevicesCache.slice();

    if (query) {
        filtered = filtered.filter(function(d) {
            return (d.serial && d.serial.toLowerCase().includes(query)) ||
                   (d.company && d.company.toLowerCase().includes(query)) ||
                   (d.name && d.name.toLowerCase().includes(query)) ||
                   (d.type && d.type.toLowerCase().includes(query));
        });
    }

    if (dateFrom) {
        filtered = filtered.filter(function(d) {
            if (!d.actDate) return false;
            var ad = d.actDate;
            if (ad.includes('T')) ad = ad.split('T')[0];
            return ad >= dateFrom;
        });
    }

    if (dateTo) {
        filtered = filtered.filter(function(d) {
            if (!d.actDate) return false;
            var ad = d.actDate;
            if (ad.includes('T')) ad = ad.split('T')[0];
            return ad <= dateTo;
        });
    }

    if (company) {
        filtered = filtered.filter(function(d) {
            return d.company === company;
        });
    }

    // Применяем вкладку
    if (currentDeviceTab === 'repair') {
        filtered = filtered.filter(function(d) {
            return d.status === 'Ремонт' || d.status === 'Калибровка' || d.status === 'Настройка';
        });
        renderRepairTab(filtered);
    } else {
        // Временно подменяем кеш
        var saved = allDevicesCache;
        allDevicesCache = filtered;
        renderDevicesFromCache(query);
        allDevicesCache = saved;
    }
}

// Сброс
function resetFilter() {
    var searchInput = document.getElementById('deviceSearch');
    var df = document.getElementById('filterDateFrom');
    var dt = document.getElementById('filterDateTo');
    var fc = document.getElementById('filterCompany');
    
    if (searchInput) searchInput.value = '';
    if (df) df.value = '';
    if (dt) dt.value = '';
    if (fc) fc.value = '';
    
    loadDevices();
}

// Обновление списка компаний
function updateCompanyList() {
    var select = document.getElementById('filterCompany');
    if (!select) return;
    var current = select.value;
    var companies = [];
    allDevicesCache.forEach(function(d) {
        if (d.company && companies.indexOf(d.company) === -1) companies.push(d.company);
    });
    companies.sort();
    select.innerHTML = '<option value="">🏢 Все</option>';
    companies.forEach(function(c) {
        select.innerHTML += '<option value="' + c + '">' + c + '</option>';
    });
    if (current) select.value = current;
}

// Перехватываем switchDeviceTab
var _swTab = switchDeviceTab;
switchDeviceTab = function(tab) {
    _swTab(tab);
    setTimeout(function() {
        updateCompanyList();
        if (hasActiveFilters() || (document.getElementById('deviceSearch') && document.getElementById('deviceSearch').value !== '')) {
            doFilter();
        }
    }, 500);
};
