// ============ КАЛЕНДАРЬ - КАРТОЧКИ ПО ДАТЕ ============
console.log('calendar.js загружен');

// Перехватываем selectCalDate
var _origSelectCalDate = selectCalDate;
selectCalDate = function(day) {
    _origSelectCalDate(day);
    setTimeout(openDayModal, 200);
};

// Создаём модальное окно
function createDayModal() {
    if (document.getElementById('dayModal')) return;
    
    var modal = document.createElement('div');
    modal.id = 'dayModal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;overflow-y:auto';
    
    modal.innerHTML = 
        '<div style="background:#F2F2F7;margin:20px auto;padding:16px;border-radius:16px;max-width:550px;min-height:60vh;max-height:85vh;overflow-y:auto">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;background:#FFFFFF;padding:12px;border-radius:12px">' +
        '<h3 id="dayModalTitle" style="font-size:17px;font-weight:700;margin:0">📅 Приборы</h3>' +
        '<button id="dayModalClose" style="background:none;border:none;font-size:22px;cursor:pointer;color:#FF3B30;padding:4px 8px">✕</button>' +
        '</div>' +
        '<div id="dayModalContent"></div>' +
        '</div>';
    
    document.body.appendChild(modal);
    
    document.getElementById('dayModalClose').onclick = function() {
        document.getElementById('dayModal').style.display = 'none';
    };
    modal.onclick = function(e) {
        if (e.target === modal) modal.style.display = 'none';
    };
}

// Открываем модальное окно
function openDayModal() {
    createDayModal();
    
    var modal = document.getElementById('dayModal');
    var title = document.getElementById('dayModalTitle');
    var content = document.getElementById('dayModalContent');
    
    if (!modal || !title || !content) return;
    
    var dateStr = document.getElementById('calDayInfo').textContent.replace('📅 ', '');
    title.textContent = '📅 ' + dateStr;
    
    // Собираем приборы на эту дату
    var dlDate = calSelectedDate;
    var dlKey = dlDate.getFullYear() + '-' + dlDate.getMonth() + '-' + dlDate.getDate();
    
    var devices = allDevicesCache.filter(function(d) {
        var exclude = ['Выдан', 'Ремонт', 'Калибровка', 'Настройка', 'Брак', 'Не годен'];
        if (exclude.indexOf(d.status) !== -1) return false;
        if (d.cardStatus === 'transferred') return false;
        var dl = getDeadline(d.actDate);
        return (dl.getFullYear() + '-' + dl.getMonth() + '-' + dl.getDate()) === dlKey;
    });
    
    if (devices.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:40px;background:#FFFFFF;border-radius:12px">Нет приборов на эту дату</div>';
        modal.style.display = 'block';
        return;
    }
    
    // Группируем по актам (как в Управлении СИ)
    var groups = {};
    devices.forEach(function(d) {
        var k = (d.company || '') + '|' + (d.actDate || '') + '|' + (d.actNumber || '');
        if (!groups[k]) {
            groups[k] = {
                company: d.company,
                actDate: d.actDate,
                actNumber: d.actNumber,
                employee: d.employee,
                cardStatus: d.cardStatus || 'lab',
                transferDate: d.transferDate || '',
                devices: []
            };
        }
        groups[k].devices.push(d);
    });
    
    // Рендерим такие же карточки как в Управлении СИ
    var html = '';
    var sem = {'В работе': '🟡', 'Годен': '🟢', 'Выдан': '✅', 'Ремонт': '🔧', 'Не годен': '🔴', 'Брак': '❌', 'Калибровка': '📐', 'Настройка': '⚙️'};
    var sortedGroups = Object.values(groups).sort(function(a, b) { return (b.actDate || '').localeCompare(a.actDate || ''); });
    
    sortedGroups.forEach(function(group, gi) {
        var groupId = 'calGroup_' + gi;
        var dd = group.actDate ? group.actDate.replace(/T.*/, '').split('-').reverse().join('.') : '';
        var sc = {};
        group.devices.forEach(function(d) { var s = d.status || 'В работе'; sc[s] = (sc[s] || 0) + 1; });
        var sl = Object.keys(sc).map(function(s) { return (sem[s] || '') + '×' + sc[s]; }).join(' ');
        var cst = group.cardStatus === 'transferred' ? '📤 Передано' + (group.transferDate ? ' ' + group.transferDate : '') :
                  (group.cardStatus === 'done' ? '🟢 Готова' : '🟡 В лаборатории');
        var csc = group.cardStatus === 'transferred' ? 'transferred' : (group.cardStatus === 'done' ? 'done' : 'lab');
        
        html += '<div class="group-card" id="' + groupId + '" style="cursor:pointer">';
        html += '<div class="company-name" onclick="var el=document.getElementById(\'' + groupId + '\');el.classList.toggle(\'expanded\');">🏢 ' + esc(group.company || 'Нет компании') + ' <span class="toggle-icon">▶</span></div>';
        html += '<div class="act-date">📅 ' + dd + (group.actNumber ? ' | Акт №' + esc(group.actNumber) : '') + ' (' + group.devices.length + ' прибора)</div>';
        html += '<div class="employee-line">👤 ' + (group.employee || '—') + '</div>';
        html += '<div class="status-indicator">' + sl + '</div>';
        html += '<div class="card-status ' + csc + '">📋 ' + cst + '</div>';
        
        // Приборы внутри
        html += '<div class="devices-inner">';
        group.devices.forEach(function(d) {
            html += '<div class="device-mini">' + (sem[d.status] || '🟡') + ' <b>' + esc(d.name || '') + '</b> | ' + esc(d.serial || '') + ' | ' + esc(d.status || 'В работе');
            if (d.address) html += '<br><span style="color:#8E8E93;font-size:10px">📍 ' + esc(d.address) + '</span>';
            if (d.note) html += '<br><span style="color:#8E8E93;font-size:10px">📝 ' + esc(d.note) + '</span>';
            html += '</div>';
        });
        html += '</div>';
        
        html += '</div>';
    });
    
    content.innerHTML = html;
    modal.style.display = 'block';
}

// Создаём окно при загрузке
window.addEventListener('load', function() {
    setTimeout(createDayModal, 1500);
});
