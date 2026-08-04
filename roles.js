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
// Дополнительная проверка после переключения
if(window.userRole==='user'&&tab==='archive'){
setTimeout(hideButtonsForUser,100);
setTimeout(hideButtonsForUser,500);
setTimeout(hideButtonsForUser,1000);
}
};

function hideButtonsForUser(){
if(window.userRole!=='user'||currentDeviceTab!=='archive')return;
var cards=document.querySelectorAll('#devicesList .group-card');
cards.forEach(function(card){
var cs=card.querySelector('.card-status');
if(cs){cs.onclick=null;cs.style.cursor='default';cs.style.pointerEvents='none';cs.title='Только просмотр';}

card.querySelectorAll('.btn-sm, button').forEach(function(btn){
var txt=btn.textContent||'';
if(txt.includes('🔄')||txt.includes('📧')||txt.includes('Передать')||txt.includes('Статус')||txt.includes('Акт')||txt.includes('Печать')||txt.includes('Написать')){
btn.style.display='none';
btn.style.visibility='hidden';
btn.style.pointerEvents='none';
btn.disabled=true;
}
});

var ga=card.querySelector('.group-actions');
if(ga){ga.style.display='none';ga.style.visibility='hidden';}
});
}

// Наблюдаем за изменениями
var observer=new MutationObserver(function(){
hideButtonsForUser();
});

// Множественные запуски для надёжности
setTimeout(function(){
var list=document.getElementById('devicesList');
if(list){observer.observe(list,{childList:true,subtree:true});}
hideButtonsForUser();
},300);

setTimeout(hideButtonsForUser,600);
setTimeout(hideButtonsForUser,1000);
setTimeout(hideButtonsForUser,2000);

// Также при таче/клике на карточку
document.addEventListener('click',function(e){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
hideButtonsForUser();
}
});
