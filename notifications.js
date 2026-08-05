// ============ УВЕДОМЛЕНИЯ ============
console.log('notifications.js загружен');

var notificationSound = null;
var notificationEnabled = false;

// Инициализация при загрузке
window.addEventListener('load', function() {
    setTimeout(initNotifications, 1500);
});

function initNotifications() {
    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Создаём звук
    createSound();
    
    // Проверяем срочные поверки при входе
    checkUrgentDevices();
    
    // Наблюдаем за ремонтом
    observeRepairStatus();
}

// Создание звукового сигнала
function createSound() {
    // Используем Web Audio API для звука
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var ctx = new AudioContext();
        
        notificationSound = function(type) {
            var oscillator = ctx.createOscillator();
            var gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            if (type === 'urgent') {
                // Тревожный сигнал - высокий прерывистый
                oscillator.frequency.value = 800;
                oscillator.type = 'square';
                gainNode.gain.value = 0.3;
                oscillator.start();
                setTimeout(function() { oscillator.stop(); }, 200);
                setTimeout(function() {
                    var osc2 = ctx.createOscillator();
                    osc2.connect(gainNode);
                    osc2.frequency.value = 1000;
                    osc2.type = 'square';
                    osc2.start();
                    setTimeout(function() { osc2.stop(); }, 200);
                }, 300);
            } else if (type === 'repair') {
                // Сигнал ремонта - два коротких
                oscillator.frequency.value = 600;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.2;
                oscillator.start();
                setTimeout(function() { oscillator.stop(); }, 150);
                setTimeout(function() {
                    var osc2 = ctx.createOscillator();
                    osc2.connect(gainNode);
                    osc2.frequency.value = 600;
                    osc2.type = 'sine';
                    osc2.start();
                    setTimeout(function() { osc2.stop(); }, 150);
                }, 250);
            } else {
                // Обычное уведомление
                oscillator.frequency.value = 500;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.2;
                oscillator.start();
                setTimeout(function() { oscillator.stop(); }, 300);
            }
        };
    } catch(e) {
        console.log('Звук не поддерживается');
    }
}

// Проверка срочных приборов
function checkUrgentDevices() {
    if (!allDevicesCache || allDevicesCache.length === 0) return;
    
    var now = new Date();
    var urgent = [];
    var warning = [];
    
    allDevicesCache.forEach(function(d) {
        var skipStatuses = ['Выдан', 'Ремонт', 'Годен', 'Не годен', 'Брак', 'Калибровка', 'Настройка'];
        if (skipStatuses.indexOf(d.status) !== -1) return;
        if (d.cardStatus === 'transferred') return;
        
        var dl = getDeadline(d.actDate);
        var days = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
        
        if (days <= 0) {
            urgent.push(d);
        } else if (days <= 2) {
            warning.push(d);
        }
    });
    
    if (urgent.length > 0 || warning.length > 0) {
        var message = '';
        if (urgent.length > 0) {
            message += '🔴 ' + urgent.length + ' прибора просрочены! ';
        }
        if (warning.length > 0) {
            message += '🟡 ' + warning.length + ' прибора — осталось ≤2 дня';
        }
        
        // Показываем уведомление
        showBrowserNotification('⚠️ Срочные поверки', message);
        
        // Звуковой сигнал
        if (notificationSound) {
            notificationSound(urgent.length > 0 ? 'urgent' : 'warning');
        }
        
        // Всплывающее окно
        setTimeout(function() {
            showUrgentPopup(message, urgent.length + warning.length);
        }, 500);
    }
}

// Браузерное уведомление
function showBrowserNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body: message,
                icon: 'https://drive.google.com/uc?export=view&id=1iygIPf19buf7dI3O0lR3i-u5gZblkPjH',
                vibrate: [200, 100, 200]
            });
        } catch(e) {}
    }
}

// Всплывающее окно срочных поверок
function showUrgentPopup(message, count) {
    // Удаляем старое если есть
    var old = document.getElementById('urgentPopup');
    if (old) old.remove();
    
    var popup = document.createElement('div');
    popup.id = 'urgentPopup';
    popup.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'background:linear-gradient(135deg,#FF5252,#D32F2F);color:#fff;padding:14px 24px;border-radius:16px;' +
        'font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(255,82,82,0.4);cursor:pointer;' +
        'animation:slideDown 0.5s ease;text-align:center;max-width:90%';
    popup.textContent = message + ' — Нажмите для просмотра';
    popup.onclick = function() {
        showMode('devices');
        popup.remove();
    };
    
    document.body.appendChild(popup);
    
    // Авто-скрытие через 10 секунд
    setTimeout(function() {
        if (popup.parentElement) {
            popup.style.animation = 'slideUp 0.5s ease';
            setTimeout(function() { if (popup.parentElement) popup.remove(); }, 500);
        }
    }, 10000);
}

// Наблюдение за ремонтом
function observeRepairStatus() {
    var repairCount = 0;
    
    setInterval(function() {
        if (!allDevicesCache) return;
        
        var currentRepairCount = allDevicesCache.filter(function(d) {
            return d.status === 'Ремонт';
        }).length;
        
        if (currentRepairCount > repairCount) {
            // Новый прибор в ремонте
            var role = window.userRole || '';
            if (role === 'admin' || role === 'superuser') {
                showBrowserNotification('🔧 Новый ремонт', 'Прибор отправлен в ремонт. Всего в ремонте: ' + currentRepairCount);
                if (notificationSound) notificationSound('repair');
            }
        }
        
        repairCount = currentRepairCount;
    }, 30000); // Проверка каждые 30 секунд
}

// Анимации
var style = document.createElement('style');
style.textContent = 
    '@keyframes slideDown { from { transform: translateX(-50%) translateY(-100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }' +
    '@keyframes slideUp { from { transform: translateX(-50%) translateY(0); opacity: 1; } to { transform: translateX(-50%) translateY(-100px); opacity: 0; } }';
document.head.appendChild(style);

// Экспорт функции для внешнего вызова
function notifyRepairAdded(count) {
    var role = window.userRole || '';
    if (role === 'admin' || role === 'superuser') {
        showBrowserNotification('🔧 Новый ремонт', 'Приборов в ремонте: ' + count);
        if (notificationSound) notificationSound('repair');
    }
}
