// ============ РОЛИ ПОЛЬЗОВАТЕЛЕЙ ============
(function(){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
})();

var originalSwitchDeviceTab=switchDeviceTab;
switchDeviceTab=function(tab){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
originalSwitchDeviceTab(tab);
};

// Наблюдаем за изменениями в devicesList и скрываем кнопки
var observer=new MutationObserver(function(){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
hideButtonsForUser();
}
});

function hideButtonsForUser(){
var cards=document.querySelectorAll('#devicesList .group-card');
cards.forEach(function(card){
var cs=card.querySelector('.card-status');
if(cs){cs.onclick=null;cs.style.cursor='default';cs.title='Только просмотр';}

card.querySelectorAll('.btn-sm').forEach(function(btn){
var txt=btn.textContent||'';
if(txt.includes('🔄')||txt.includes('📧')||txt.includes('Передать')||txt.includes('Статус')||txt.includes('Акт')||txt.includes('Печать')||txt.includes('Написать')){
btn.style.display='none';
}
});

var ga=card.querySelector('.group-actions');
if(ga)ga.style.display='none';
});
}

// Запускаем наблюдение после загрузки
setTimeout(function(){
var list=document.getElementById('devicesList');
if(list){
observer.observe(list,{childList:true,subtree:true});
}
},500);
