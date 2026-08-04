// ============ РОЛИ ПОЛЬЗОВАТЕЛЕЙ ============

// Устанавливаем роль при загрузке страницы
(function(){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
})();

// Переопределяем switchDeviceTab — обновляем роль при переключении вкладок
var originalSwitchDeviceTab=switchDeviceTab;
switchDeviceTab=function(tab){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
originalSwitchDeviceTab(tab);
};

// Переопределяем renderDevicesFromCache — скрываем кнопки для user в архиве
var originalRenderDevicesFromCache=renderDevicesFromCache;
renderDevicesFromCache=function(search){
// Вызываем оригинальную функцию
originalRenderDevicesFromCache(search);

// Если user и вкладка Архив — скрываем кнопки
if(window.userRole==='user'&&currentDeviceTab==='archive'){
setTimeout(function(){
var cards=document.querySelectorAll('#devicesList .group-card');
cards.forEach(function(card){
// Убираем возможность смены статуса карточки
var cs=card.querySelector('.card-status');
if(cs){
cs.onclick=null;
cs.style.cursor='default';
cs.title='';
}

// Скрываем кнопки действий у приборов
card.querySelectorAll('.btn-sm').forEach(function(btn){
var txt=btn.textContent||'';
if(txt.includes('🔄')||txt.includes('📧')){
btn.style.display='none';
}
});

// Скрываем групповые действия
var ga=card.querySelector('.group-actions');
if(ga)ga.style.display='none';

// Скрываем кнопку "Передать"
var tb=card.querySelector('.btn-sm.green');
if(tb&&tb.textContent.includes('Передать'))tb.style.display='none';
});
},100);
}
};
