// ============ РОЛИ ПОЛЬЗОВАТЕЛЕЙ ============

// Устанавливаем роль при загрузке
(function(){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
})();

// Перехватываем сохранение в localStorage чтобы добавить роль
var originalSetItem=localStorage.setItem;
localStorage.setItem=function(key,value){
if(key==='priemkaSession'){
try{
var data=JSON.parse(value);
if(!data.role&&data.user){
// Делаем фоновый запрос за ролью
var xhr=new XMLHttpRequest();
xhr.open('GET',SCRIPT_URL+'?action=checkLogin&login='+encodeURIComponent(data.user)+'&password=',false);
try{xhr.send();var res=JSON.parse(xhr.responseText);if(res.role){data.role=res.role;window.userRole=res.role;value=JSON.stringify(data);}}catch(e){}
}
}catch(e){}
}
originalSetItem.call(localStorage,key,value);
};

// Переопределяем switchDeviceTab
var originalSwitchDeviceTab=switchDeviceTab;
switchDeviceTab=function(tab){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
originalSwitchDeviceTab(tab);
};

// Переопределяем renderDevicesFromCache — скрываем кнопки для user в архиве
var originalRenderDevicesFromCache=renderDevicesFromCache;
renderDevicesFromCache=function(search){
originalRenderDevicesFromCache(search);

if(window.userRole==='user'&&currentDeviceTab==='archive'){
setTimeout(function(){
var cards=document.querySelectorAll('#devicesList .group-card');
cards.forEach(function(card){
var cs=card.querySelector('.card-status');
if(cs){cs.onclick=null;cs.style.cursor='default';cs.title='Только просмотр';}

card.querySelectorAll('.btn-sm').forEach(function(btn){
var txt=btn.textContent||'';
if(txt.includes('🔄')||txt.includes('📧')||txt.includes('Передать')){
btn.style.display='none';
}
});

var ga=card.querySelector('.group-actions');
if(ga)ga.style.display='none';
});
},200);
}
};
