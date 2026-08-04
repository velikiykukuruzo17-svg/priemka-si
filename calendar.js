// ============ КАЛЕНДАРЬ - ДЕТАЛИ ДНЯ ============
console.log('calendar.js загружен');

// Перехватываем selectCalDate
var _origSelectCalDate = selectCalDate;
selectCalDate = function(day) {
    // Вызываем оригинал (заполняет calDayInfo и calDevices)
    _origSelectCalDate(day);
    
    // Открываем модальное окно
    setTimeout(openDayModal, 200);
};

// Создаём модальное окно если его ещё нет
function createDayModal() {
    if (document.getElementById('dayModal')) return;
    
    var modal = document.createElement('div');
    modal.id = 'dayModal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;overflow-y:auto';
    
    modal.innerHTML = 
        '<div style="background:#FFFFFF;margin:30px auto;padding:20px;border-radius:16px;max-width:500px;max-height:80vh;overflow-y:auto">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<h3 id="dayModalTitle" style="font-size:18px;font-weight:700">📅 Приборы</h3>' +
        '<button id="dayModalClose" style="background:none;border:none;font-size:24px;cursor:pointer;color:#FF3B30">✕</button>' +
        '</div>' +
        '<div id="dayModalContent"></div>' +
        '</div>';
    
    document.body.appendChild(modal);
    
    // Закрытие по крестику
    document.getElementById('dayModalClose').onclick = function() {
        document.getElementById('dayModal').style.display = 'none';
    };
    
    // Закрытие по клику вне окна
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Открываем модальное окно с приборами
function openDayModal() {
    createDayModal();
    
    var modal = document.getElementById('dayModal');
    var title = document.getElementById('dayModalTitle');
    var content = document.getElementById('dayModalContent');
    
    if (!modal || !title || !content) return;
    
    var dateStr = document.getElementById('calDayInfo').textContent.replace('📅 ', '');
    title.textContent = '📅 ' + dateStr;
    
    // Собираем приборы
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
        content.innerHTML = '<div style="text-align:center;color:#8E8E93;padding:20px">Нет приборов на эту дату</div>';
        modal.style.display = 'block';
        return;
    }
    
    // Группируем по компаниям
    var groups = {};
    devices.forEach(function(d) {
        var k = (d.company || 'Нет компании') + '|' + (d.actDate || '') + '|' + (d.actNumber || '');
        if (!groups[k]) {
            groups[k] = {
                company: d.company || 'Нет компании',
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
    
    // Рендерим карточки
    var html = '';
    var sem = {'В работе': '🟡', 'Годен': '🟢', 'Выдан': '✅', 'Ремонт': '🔧', 'Не годен': '🔴', 'Брак': '❌', 'Калибровка': '📐', 'Настройка': '⚙️'};
    
    Object.values(groups).forEach(function(group) {
        var dd = group.actDate ? group.actDate.replace(/T.*/, '').split('-').reverse().join('.') : '';
        var cardStatusText = group.cardStatus === 'transferred' ? '📤 Передано ' + group.transferDate : 
                            (group.cardStatus === 'done' ? '🟢 Готова' : '🟡 В лаборатории');
        
        html += '<div style="background:#F9F9F9;border-radius:12px;padding:12px;margin-bottom:10px;border-left:4px solid #007AFF">';
        html += '<div style="font-weight:700;font-size:15px;margin-bottom:4px">🏢 ' + esc(group.company) + '</div>';
        html += '<div style="font-size:11px;color:#8E8E93;margin-bottom:4px">📅 ' + dd + 
                (group.actNumber ? ' | Акт №' + esc(group.actNumber) : '') + 
                ' | Приборов: ' + group.devices.length + '</div>';
        html += '<div style="font-size:11px;color:#8E8E93;margin-bottom:6px">👤 ' + (group.employee || '—') + '</div>';
        html += '<div style="font-size:12px;color:#8E8E93;margin-bottom:8px">📋 ' + cardStatusText + '</div>';
        
        group.devices.forEach(function(d) {
            html += '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid #f0f0f0">';
            html += sem[d.status] + ' <b>' + esc(d.name || '') + '</b> | ' + esc(d.serial || '') + ' | ' + esc(d.status || 'В работе');
            if (d.address) html += '<br><span style="color:#8E8E93;font-size:11px">📍 ' + esc(d.address) + '</span>';
            if (d.note) html += '<br><span style="color:#8E8E93;font-size:11px">📝 ' + esc(d.note) + '</span>';
            html += '</div>';
        });
        
        html += '</div>';
    });
    
    content.innerHTML = html;
    modal.style.display = 'block';
}

// Создаём окно при загрузке
window.addEventListener('load', function() {
    setTimeout(createDayModal, 1500);
});
