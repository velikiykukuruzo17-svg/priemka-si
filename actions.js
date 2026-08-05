// ============ ЖУРНАЛ ДЕЙСТВИЙ СОТРУДНИКОВ ============
console.log('actions.js загружен');

// Инициализация
window.addEventListener('load', function() {
    setTimeout(initActions, 1500);
});

function initActions() {
    // Проверяем роль
    var s = JSON.parse(localStorage.getItem('priemkaSession') || '{}');
    if (s.role !== 'admin') return;
    
    // Добавляем меню
    addActionsMenu();
    
    // Записываем вход
    logAction('Вход в систему', '');
}

// Добавление пункта меню
function addActionsMenu() {
    var mainMenu = document.getElementById('mainMenu');
    if (!mainMenu) return;
    if (document.getElementById('menuActions')) return;
    
    var menuCard = document.createElement('div');
    menuCard.id = 'menuActions';
    menuCard.className = 'menu-card';
    menuCard.onclick = function() { openActionsModal(); };
    menuCard.innerHTML = 
        '<div class="menu-icon">👥</div>' +
        '<div class="menu-info"><h3>Действия сотрудников</h3><p>Журнал действий</p></div>';
    
    // Вставляем перед Настройками
    var settingsCard = mainMenu.querySelector('.menu-card:last-child');
    if (settingsCard) {
        settingsCard.before(menuCard);
    } else {
        mainMenu.appendChild(menuCard);
    }
    
    // Стиль для модального окна
    var style = document.createElement('style');
    style.textContent = 
        '.action-log-table { width:100%; border-collapse:collapse; font-size:11px; color:#DDD }' +
        '.action-log-table th { background:rgba(255,213,79,0.2); padding:8px 6px; text-align:left; font-weight:600; color:#FFD54F; border-bottom:2px solid rgba(255,213,79,0.3) }' +
        '.action-log-table td { padding:7px 6px; border-bottom:1px solid rgba(255,255,255,0.06); vertical-align:top }' +
        '.action-log-table tr:hover td { background:rgba(255,255,255,0.03) }';
    document.head.appendChild(style);
}

// Запись действия
function logAction(action, details) {
    var s = JSON.parse(localStorage.getItem('priemkaSession') || '{}');
    var user = s.user || 'Неизвестно';
    var now = new Date();
    var time = ('0' + now.getDate()).slice(-2) + '.' + 
               ('0' + (now.getMonth() + 1)).slice(-2) + '.' + 
               now.getFullYear() + ' ' + 
               ('0' + now.getHours()).slice(-2) + ':' + 
               ('0' + now.getMinutes()).slice(-2);
    
    var log = JSON.parse(localStorage.getItem('actionLog') || '[]');
    log.push({
        user: user,
        action: action,
        details: details,
        time: time
    });
    
    // Храним последние 500 записей
    if (log.length > 500) log = log.slice(-500);
    
    localStorage.setItem('actionLog', JSON.stringify(log));
}

// Открытие модального окна
function openActionsModal() {
    // Удаляем старое если есть
    var old = document.getElementById('actionsModal');
    if (old) old.remove();
    
    var log = JSON.parse(localStorage.getItem('actionLog') || '[]');
    
    var modal = document.createElement('div');
    modal.id = 'actionsModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center';
    
    var html = '<div style="background:linear-gradient(180deg,#1E1E30,#1A1A1A);border-radius:20px;padding:20px;max-width:650px;width:95%;max-height:80vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.1)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
    html += '<h3 style="font-size:18px;font-weight:700;color:#fff;margin:0">👥 Журнал действий</h3>';
    html += '<div>';
    html += '<button onclick="clearActionLog()" style="background:#FF5252;color:#fff;border:none;padding:8px 14px;border-radius:10px;font-size:12px;cursor:pointer;margin-right:8px">🗑️ Очистить</button>';
    html += '<button onclick="document.getElementById(\'actionsModal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#FF5252">✕</button>';
    html += '</div></div>';
    
    if (log.length === 0) {
        html += '<div style="text-align:center;color:#AAA;padding:40px">Нет записей</div>';
    } else {
        html += '<table class="action-log-table"><thead><tr><th>Время</th><th>Сотрудник</th><th>Действие</th><th>Детали</th></tr></thead><tbody>';
        
        // Показываем последние сверху
        log.reverse().forEach(function(entry) {
            html += '<tr>';
            html += '<td style="white-space:nowrap">' + esc(entry.time) + '</td>';
            html += '<td style="white-space:nowrap">' + esc(entry.user) + '</td>';
            html += '<td>' + esc(entry.action) + '</td>';
            html += '<td style="font-size:10px;color:#AAA">' + esc(entry.details) + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table>';
    }
    
    html += '</div>';
    modal.innerHTML = html;
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

// Очистка журнала
function clearActionLog() {
    if (confirm('Очистить весь журнал действий?')) {
        localStorage.removeItem('actionLog');
        openActionsModal();
        logAction('Очистка журнала', 'Журнал очищен');
    }
}

// ============ ПЕРЕХВАТ ДЕЙСТВИЙ ============

// Ждём загрузки функций
setTimeout(function() {
    if (typeof saveNewStatus === 'function') {
        var _orig = saveNewStatus;
        saveNewStatus = function() {
            var st = document.getElementById('newStatus').value;
            var rs = document.getElementById('statusReason').value;
            _orig();
            logAction('Изменение статуса прибора', 'Статус: ' + st + (rs ? ' | Причина: ' + rs : ''));
        };
    }
    
    if (typeof saveCardStatus === 'function') {
        var _orig2 = saveCardStatus;
        saveCardStatus = function() {
            var cs = document.getElementById('newCardStatus').value;
            var names = {'lab': 'В лаборатории', 'done': 'Готова', 'transferred': 'Передано'};
            _orig2();
            logAction('Изменение статуса карточки', 'Статус: ' + (names[cs] || cs));
        };
    }
    
    if (typeof removeFromRepair === 'function') {
        var _orig3 = removeFromRepair;
        removeFromRepair = function(row) {
            _orig3(row);
            logAction('Удаление из ремонта', 'Прибор возвращён в работу');
        };
    }
    
    if (typeof submitAct === 'function') {
        var _orig4 = submitAct;
        submitAct = function() {
            var company = document.getElementById('companyInput').value;
            _orig4();
            logAction('Создание акта', 'Компания: ' + company);
        };
    }
}, 2000);
