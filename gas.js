// ============ ГАЗОВЫЕ СИ ============
console.log('gas.js загружен');

var currentGasCompany = null; // null = главный экран, 'auto', 'csm', или название компании
var currentGasStatus = 'work';

// Список газовых компаний (можно дополнять)
var GAS_COMPANIES = ['Автоматизация и Метрология', 'ЦСМ'];

window.addEventListener('load', function() {
    setTimeout(createGasSection, 1000);
});

function createGasSection() {
    if (document.getElementById('gasMode')) return;
    
    var appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    // Главный экран Газовые СИ (список компаний)
    var gasHTML = 
        '<div id="gasMode" style="display:none">' +
        '<button class="btn-back" onclick="backToGasMain()">↩ Назад</button>' +
        '<div class="header" id="gasHeader"><div><h1>🔥 Газовые СИ</h1></div></div>' +
        
        // Главный экран — список компаний
        '<div id="gasMainScreen">' +
        '<div id="gasCompaniesList" style="margin-top:16px"></div>' +
        '</div>' +
        
        // Экран компании — скрыт по умолчанию
        '<div id="gasCompanyScreen" style="display:none">' +
        '<div class="tabs" id="gasStatusTabs">' +
        '<div class="tab active" id="tabGasWork" onclick="switchGasStatus(\'work\')">🟡 В работе</div>' +
        '<div class="tab" id="tabGasReady" onclick="switchGasStatus(\'ready\')">🟢 Годен</div>' +
        '<div class="tab" id="tabGasNotGood" onclick="switchGasStatus(\'notgood\')">🔴 Не годен</div>' +
        '<div class="tab" id="tabGasIssued" onclick="switchGasStatus(\'issued\')">✅ Выдан</div>' +
        '<div class="tab" id="tabGasRepair" onclick="switchGasStatus(\'repair\')">🔧 Ремонт</div>' +
        '</div>' +
        '<div class="stats-row" id="gasStatsRow"></div>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">' +
        '<input type="text" id="gasSearch" placeholder="🔍 Поиск по номеру или названию" style="flex:1;padding:10px;border:1px solid #E5E5EA;border-radius:10px;font-size:14px" oninput="renderGasCompanyDevices()">' +
        '<button onclick="renderGasCompanyDevices()" style="width:40px;height:40px;border-radius:10px;background:#007AFF;color:#fff;border:none;font-size:18px;cursor:pointer">🔍</button>' +
        '</div>' +
        '<div id="gasDevicesList" style="max-height:450px;overflow-y:auto"></div>' +
        '</div>' +
        '</div>';
    
    var calendarMode = document.getElementById('calendarMode');
    if (calendarMode) {
        calendarMode.insertAdjacentHTML('beforebegin', gasHTML);
    } else {
        appContent.insertAdjacentHTML('beforeend', gasHTML);
    }
    
    addGasMenuCard();
}

function addGasMenuCard() {
    if (document.getElementById('menuGas')) return;
    var menuCards = document.querySelectorAll('#mainMenu .menu-card');
    var calendarCard = null;
    menuCards.forEach(function(card) {
        if (card.querySelector('h3') && card.querySelector('h3').textContent === 'Календарь поверок') {
            calendarCard = card;
        }
    });
    if (calendarCard) {
        var gasCard = document.createElement('div');
        gasCard.id = 'menuGas';
        gasCard.className = 'menu-card';
        gasCard.onclick = function() { showMode('gas'); };
        gasCard.innerHTML = '<div class="menu-icon">🔥</div><div class="menu-info"><h3>Газовые СИ</h3><p>Средства измерения учёта газа</p></div>';
        calendarCard.before(gasCard);
    }
}

// Показать главный экран (список компаний)
function showGasMainScreen() {
    document.getElementById('gasMainScreen').style.display = 'block';
    document.getElementById('gasCompanyScreen').style.display = 'none';
    document.getElementById('gasHeader').querySelector('h1').textContent = '🔥 Газовые СИ';
    currentGasCompany = null;
    renderGasCompanies();
}

// Показать экран компании
function showGasCompany(company) {
    currentGasCompany = company;
    document.getElementById('gasMainScreen').style.display = 'none';
    document.getElementById('gasCompanyScreen').style.display = 'block';
    document.getElementById('gasHeader').querySelector('h1').textContent = '🏢 ' + company;
    currentGasStatus = 'work';
    resetGasStatusTabs();
    renderGasCompanyDevices();
}

// Назад к списку компаний
function backToGasMain() {
    if (currentGasCompany) {
        showGasMainScreen();
    } else {
        showMainMenu();
    }
}

// Рендер списка компаний
function renderGasCompanies() {
    if (!allDevicesCache) return;
    
    // Собираем компании у которых есть газовые приборы
    var companies = {};
    allDevicesCache.forEach(function(d) {
        var c = d.company || '';
        var n = (d.name || '').toLowerCase();
        var t = (d.type || '').toLowerCase();
        
        // Проверяем что это газовый прибор
        var isGas = GAS_COMPANIES.indexOf(c) !== -1 || 
                    n.includes('газ') || t.includes('газ') ||
                    c.toLowerCase().includes('газ');
        
        if (isGas && c) {
            if (!companies[c]) companies[c] = { total: 0, work: 0, ready: 0 };
            companies[c].total++;
            if (d.status === 'В работе') companies[c].work++;
            else if (d.status === 'Годен') companies[c].ready++;
        }
    });
    
    var html = '';
    var names = Object.keys(companies).sort();
    
    if (names.length === 0) {
        html = '<div style="text-align:center;color:#AAA;padding:60px 20px">Нет газовых приборов</div>';
    } else {
        names.forEach(function(name) {
            var c = companies[name];
            html += '<div class="menu-card" onclick="showGasCompany(\'' + esc(name) + '\')" style="cursor:pointer">';
            html += '<div class="menu-icon">🏢</div>';
            html += '<div class="menu-info">';
            html += '<h3>' + esc(name) + '</h3>';
            html += '<p>🔵 ' + c.work + ' в работе | 🟢 ' + c.ready + ' готово | 📋 Всего: ' + c.total + '</p>';
            html += '</div>';
            html += '<div style="font-size:24px;color:#8E8E93;margin-left:auto">→</div>';
            html += '</div>';
        });
    }
    
    document.getElementById('gasCompaniesList').innerHTML = html;
}

// Переключение статусов
function switchGasStatus(status) {
    currentGasStatus = status;
    resetGasStatusTabs();
    renderGasCompanyDevices();
}

function resetGasStatusTabs() {
    document.getElementById('tabGasWork').classList.toggle('active', currentGasStatus === 'work');
    document.getElementById('tabGasReady').classList.toggle('active', currentGasStatus === 'ready');
    document.getElementById('tabGasNotGood').classList.toggle('active', currentGasStatus === 'notgood');
    document.getElementById('tabGasIssued').classList.toggle('active', currentGasStatus === 'issued');
    document.getElementById('tabGasRepair').classList.toggle('active', currentGasStatus === 'repair');
}

// Рендер приборов компании
function renderGasCompanyDevices() {
    if (!allDevicesCache || !currentGasCompany) return;
    
    var search = (document.getElementById('gasSearch')?.value || '').toLowerCase();
    
    // Фильтруем по компании
    var filtered = allDevicesCache.filter(function(d) {
        return d.company === currentGasCompany;
    });
    
    // Поиск
    if (search) {
        filtered = filtered.filter(function(d) {
            return String(d.serial || '').toLowerCase().includes(search) ||
                   String(d.name || '').toLowerCase().includes(search);
        });
    }
    
    // Статус
    if (currentGasStatus === 'work') filtered = filtered.filter(function(d) { return d.status === 'В работе'; });
    else if (currentGasStatus === 'ready') filtered = filtered.filter(function(d) { return d.status === 'Годен'; });
    else if (currentGasStatus === 'notgood') filtered = filtered.filter(function(d) { return d.status === 'Не годен' || d.status === 'Брак'; });
    else if (currentGasStatus === 'issued') filtered = filtered.filter(function(d) { return d.status === 'Выдан'; });
    else if (currentGasStatus === 'repair') filtered = filtered.filter(function(d) { return d.status === 'Ремонт' || d.status === 'Калибровка' || d.status === 'Настройка'; });
    
    // Статистика
    var all = allDevicesCache.filter(function(d) { return d.company === currentGasCompany; });
    var stats = { work: 0, ready: 0, notgood: 0, issued: 0, repair: 0 };
    all.forEach(function(d) {
        if (d.status === 'В работе') stats.work++;
        else if (d.status === 'Годен') stats.ready++;
        else if (d.status === 'Не годен' || d.status === 'Брак') stats.notgood++;
        else if (d.status === 'Выдан') stats.issued++;
        else if (d.status === 'Ремонт' || d.status === 'Калибровка' || d.status === 'Настройка') stats.repair++;
    });
    
    document.getElementById('gasStatsRow').innerHTML = 
        '<span class="stat-badge blue">🔵 В работе: ' + stats.work + '</span>' +
        '<span class="stat-badge green">🟢 Годен: ' + stats.ready + '</span>' +
        '<span class="stat-badge red">🔴 Не годен: ' + stats.notgood + '</span>' +
        '<span class="stat-badge gray">✅ Выдан: ' + stats.issued + '</span>' +
        '<span class="stat-badge orange">🔧 Ремонт: ' + stats.repair + '</span>';
    
    // Рендер карточек
    var sem = {'В работе': '🟡', 'Годен': '🟢', 'Выдан': '✅', 'Ремонт': '🔧', 'Не годен': '🔴', 'Брак': '❌', 'Калибровка': '📐', 'Настройка': '⚙️'};
    var html = '';
    
    if (filtered.length === 0) {
        html = '<div style="text-align:center;color:#AAA;padding:40px">Нет приборов</div>';
    } else {
        var groups = {};
        filtered.forEach(function(d) {
            var k = (d.actDate || '') + '|' + (d.actNumber || '');
            if (!groups[k]) groups[k] = { actDate: d.actDate, actNumber: d.actNumber, employee: d.employee, cardStatus: d.cardStatus || 'lab', transferDate: d.transferDate || '', devices: [] };
            groups[k].devices.push(d);
        });
        
        Object.values(groups).sort(function(a, b) { return (b.actDate || '').localeCompare(a.actDate || ''); }).forEach(function(g, gi) {
            var gid = 'gasGroup_' + gi;
            var dd = g.actDate ? g.actDate.replace(/T.*/, '').split('-').reverse().join('.') : '';
            var cst = g.cardStatus === 'transferred' ? '📤 Передано ' + g.transferDate : (g.cardStatus === 'done' ? '🟢 Готова' : '🟡 В лаборатории');
            var csc = g.cardStatus === 'transferred' ? 'transferred' : (g.cardStatus === 'done' ? 'done' : 'lab');
            
            html += '<div class="group-card" id="' + gid + '">';
            html += '<div class="company-name" onclick="var el=document.getElementById(\'' + gid + '\');el.classList.toggle(\'expanded\');">📋 Акт ' + dd + (g.actNumber ? ' №' + esc(g.actNumber) : '') + ' (' + g.devices.length + ' прибора) <span class="toggle-icon">▶</span></div>';
            html += '<div class="employee-line">👤 ' + (g.employee || '—') + '</div>';
            html += '<div class="card-status ' + csc + '">' + cst + '</div>';
            html += '<div class="devices-inner">';
            g.devices.forEach(function(d) {
                html += '<div class="device-mini">' + (sem[d.status] || '🟡') + ' <b>' + esc(d.name || '') + '</b> | ' + esc(d.serial || '') + ' | ' + esc(d.status || 'В работе') + '</div>';
            });
            html += '</div></div>';
        });
    }
    
    document.getElementById('gasDevicesList').innerHTML = html;
}

// Перехватываем showMode
var _origShowModeGas = showMode;
showMode = function(mode) {
    hideAllModes();
    if (mode === 'gas') {
        document.getElementById('gasMode').style.display = 'block';
        showGasMainScreen();
        return;
    }
    _origShowModeGas(mode);
};

var _origHideAllGas = hideAllModes;
hideAllModes = function() {
    _origHideAllGas();
    var gm = document.getElementById('gasMode');
    if (gm) gm.style.display = 'none';
};