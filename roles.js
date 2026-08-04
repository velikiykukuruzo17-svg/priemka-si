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
if(window.userRole==='user'&&tab==='archive'){
setTimeout(hideButtonsForUser,100);
setTimeout(hideButtonsForUser,500);
}
};

// БЛОКИРУЕМ ДЕЙСТВИЯ ДЛЯ USER В АРХИВЕ
var originalOpenStatusModal=openStatusModal;
openStatusModal=function(rows,name,serial){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
alert('⛔ Доступ запрещён. Только просмотр.');
return;
}
originalOpenStatusModal(rows,name,serial);
};

var originalOpenCardStatusModal=openCardStatusModal;
openCardStatusModal=function(groupId){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
alert('⛔ Доступ запрещён. Только просмотр.');
return;
}
originalOpenCardStatusModal(groupId);
};

var originalSaveCardStatus=saveCardStatus;
saveCardStatus=function(){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
alert('⛔ Доступ запрещён. Только просмотр.');
closeCardStatusModal();
return;
}
originalSaveCardStatus();
};

var originalSaveNewStatus=saveNewStatus;
saveNewStatus=function(){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
alert('⛔ Доступ запрещён. Только просмотр.');
closeStatusModal();
return;
}
originalSaveNewStatus();
};

var originalIssueCard=issueCard;
issueCard=function(groupId){
if(window.userRole==='user'&&currentDeviceTab==='archive'){
alert('⛔ Доступ запрещён. Только просмотр.');
return;
}
originalIssueCard(groupId);
};

// СКРЫВАЕМ КНОПКИ
function hideButtonsForUser(){
if(window.userRole!=='user'||currentDeviceTab!=='archive')return;
var cards=document.querySelectorAll('#devicesList .group-card');
cards.forEach(function(card){
var cs=card.querySelector('.card-status');
if(cs){cs.onclick=null;cs.style.pointerEvents='none';cs.title='Только просмотр';}

card.querySelectorAll('.btn-sm, button').forEach(function(btn){
var txt=btn.textContent||'';
if(txt.includes('🔄')||txt.includes('📧')||txt.includes('Передать')||txt.includes('Статус')||txt.includes('Акт')||txt.includes('Печать')||txt.includes('Написать')){
btn.style.display='none';
btn.disabled=true;
}
});

var ga=card.querySelector('.group-actions');
if(ga)ga.style.display='none';
});
}

// Наблюдатель
var observer=new MutationObserver(function(){hideButtonsForUser();});
setTimeout(function(){
var list=document.getElementById('devicesList');
if(list)observer.observe(list,{childList:true,subtree:true});
hideButtonsForUser();
},300);
setTimeout(hideButtonsForUser,600);
setTimeout(hideButtonsForUser,1000);
