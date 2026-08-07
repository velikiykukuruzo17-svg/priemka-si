// ============ ГАЗОВЫЕ СИ ============
console.log('gas.js загружен');

// Создаём раздел при загрузке
window.addEventListener('load', function() {
    setTimeout(createGasSection, 1000);
});

function createGasSection() {
    if (document.getElementById('gasMode')) return;
    
    var appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    // Создаём HTML раздела
    var gasHTML = 
        '<div id="gasMode" style="display:none">' +
        '<button class="btn-back" onclick="showMainMenu()">↩ Назад</button>' +
        '<div class="header"><div><h1>🔥 Газовые СИ</h1></div></div>' +
        '<div class="tabs">' +
        '<div class="tab active" id="tabGasAuto" onclick="switchGasTab(\'auto\')">🔧 Автоматизация и Метрология</div>' +
        '<div class="tab" id="tabGasCSM" onclick="switchGasTab(\'csm\')">🏭 ЦСМ</div>' +
        '</div>' +
        '<div id="gasContent" style="text-align:center;padding:60px 20px;color:#AAA;font-size:16px">🚧 Раздел в разработке</div>' +
        '</div>';
    
    // Вставляем перед calendarMode
    var calendarMode = document.getElementById('calendarMode');
    if (calendarMode) {
        calendarMode.insertAdjacentHTML('beforebegin', gasHTML);
    } else {
        appContent.insertAdjacentHTML('beforeend', gasHTML);
    }
    
    // Добавляем карточку в меню
    var menuCards = document.querySelectorAll('#mainMenu .menu-card');
    var calendarCard = null;
    menuCards.forEach(function(card) {
        if (card.querySelector('h3') && card.querySelector('h3').textContent === 'Календарь поверок') {
            calendarCard = card;
        }
    });
    
    if (calendarCard && !document.getElementById('menuGas')) {
        var gasCard = document.createElement('div');
        gasCard.id = 'menuGas';
        gasCard.className = 'menu-card';
        gasCard.onclick = function() { showMode('gas'); };
        gasCard.innerHTML = '<div class="menu-icon">🔥</div><div class="menu-info"><h3>Газовые СИ</h3><p>Автоматизация, Метрология, ЦСМ</p></div>';
        calendarCard.before(gasCard);
    }
}

// Переключатель вкладок
function switchGasTab(tab) {
    document.getElementById('tabGasAuto').classList.toggle('active', tab === 'auto');
    document.getElementById('tabGasCSM').classList.toggle('active', tab === 'csm');
    var content = document.getElementById('gasContent');
    if (tab === 'auto') {
        content.innerHTML = '<div style="padding:60px 20px;color:#AAA;font-size:16px">🔧 Раздел «Автоматизация и Метрология» в разработке</div>';
    } else {
        content.innerHTML = '<div style="padding:60px 20px;color:#AAA;font-size:16px">🏭 Раздел «ЦСМ» в разработке</div>';
    }
}

// Добавляем gasMode в showMode
var _origShowMode = showMode;
showMode = function(mode) {
    hideAllModes();
    if (mode === 'gas') {
        document.getElementById('gasMode').style.display = 'block';
        return;
    }
    _origShowMode(mode);
};

// Добавляем gasMode в hideAllModes
var _origHideAll = hideAllModes;
hideAllModes = function() {
    _origHideAll();
    var gasMode = document.getElementById('gasMode');
    if (gasMode) gasMode.style.display = 'none';
};