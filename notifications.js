// ============ УВЕДОМЛЕНИЯ (облегчённые) ============
console.log('notifications.js загружен');

window.addEventListener('load', function() {
    setTimeout(function() {
        // Запрашиваем разрешение на уведомления
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        // Проверяем срочные
        checkUrgentDevices();
    }, 2000);
});

function checkUrgentDevices() {
    if (!allDevicesCache || allDevicesCache.length === 0) return;
    
    var now = new Date();
    var urgent = 0;
    var warning = 0;
    
    allDevicesCache.forEach(function(d) {
        var skip = ['Выдан', 'Ремонт', 'Годен', 'Не годен', 'Брак', 'Калибровка', 'Настройка'];
        if (skip.indexOf(d.status) !== -1) return;
        if (d.cardStatus === 'transferred') return;
        
        var dl = getDeadline(d.actDate);
        var days = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
        
        if (days <= 0) urgent++;
        else if (days <= 2) warning++;
    });
    
    if (urgent > 0 || warning > 0) {
        var msg = '';
        if (urgent > 0) msg += '🔴 ' + urgent + ' просрочено! ';
        if (warning > 0) msg += '🟡 ' + warning + ' — ≤2 дня';
        
        // Всплывашка
        showPopup(msg);
        
        // Браузерное уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification('⚠️ Срочные поверки', { body: msg, vibrate: [200,100,200] }); } catch(e) {}
        }
        
        // Звук (простой)
        try { playBeep(urgent > 0 ? 800 : 500); } catch(e) {}
    }
}

function showPopup(msg) {
    var old = document.getElementById('urgentPopup');
    if (old) old.remove();
    
    var p = document.createElement('div');
    p.id = 'urgentPopup';
    p.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'background:#FF5252;color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;' +
        'cursor:pointer;box-shadow:0 4px 16px rgba(255,82,82,0.4);text-align:center;max-width:90%';
    p.textContent = msg + ' — Нажмите';
    p.onclick = function() { showMode('devices'); p.remove(); };
    document.body.appendChild(p);
    setTimeout(function() { if (p.parentElement) p.remove(); }, 8000);
}

function playBeep(freq) {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        osc.start();
        setTimeout(function() { osc.stop(); }, 250);
    } catch(e) {}
}
