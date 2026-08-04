// ============ РОЛИ ПОЛЬЗОВАТЕЛЕЙ ============

// Устанавливаем роль при загрузке страницы
(function(){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'';
})();

// Переопределяем doLogin — сохраняем роль
var originalDoLogin=doLogin;
doLogin=function(){
var l=document.getElementById('loginInput').value.trim();
var p=document.getElementById('passwordInput').value.trim();
if(!l||!p){document.getElementById('loginError').textContent='Введите логин и пароль';return;}
currentUser=l;
localStorage.setItem('priemkaSession',JSON.stringify({user:currentUser,role:'',date:new Date().toDateString()}));
document.getElementById('menuUserName').textContent=currentUser;
document.getElementById('loginScreen').style.display='none';
document.getElementById('appContent').style.display='block';
document.getElementById('mainMenu').style.display='block';
loadUrgentBlock();

// Фоновый запрос для получения роли
fetch(SCRIPT_URL+'?action=checkLogin&login='+encodeURIComponent(l)+'&password='+encodeURIComponent(p))
.then(r=>r.json())
.then(function(res){
if(res.status==='success'){
currentUser=res.name||l;
var role=res.role||'';
window.userRole=role;
localStorage.setItem('priemkaSession',JSON.stringify({user:currentUser,role:role,date:new Date().toDateString()}));
document.getElementById('menuUserName').textContent=currentUser;
}
})
.catch(function(){});
};

// Переопределяем switchDeviceTab — обновляем роль
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
