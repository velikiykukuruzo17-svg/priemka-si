// ============ АВТОРИЗАЦИЯ И РОЛИ ============

// Конфигурация
var SESSION_HOURS=24; // Сессия на 24 часа

// Проверка сессии при загрузке
(function(){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
var now=new Date();
if(s.user&&s.expires){
var expires=new Date(s.expires);
if(now<expires){
// Сессия активна
currentUser=s.user;
window.userRole=s.role||'user';
document.getElementById('loginScreen').style.display='none';
document.getElementById('appContent').style.display='block';
showMainMenu();
document.getElementById('menuUserName').textContent=currentUser;
loadUrgentBlock();
return;
}
}
// Сессия истекла или нет — показываем вход
localStorage.removeItem('priemkaSession');
document.getElementById('loginScreen').style.display='flex';
document.getElementById('appContent').style.display='none';
})();

// Функция входа
function doLogin(){
var l=document.getElementById('loginInput').value.trim();
var p=document.getElementById('passwordInput').value.trim();
if(!l||!p){document.getElementById('loginError').textContent='Введите логин и пароль';return;}

document.getElementById('loginError').textContent='Проверка...';
var btn=document.querySelector('#loginScreen .btn-ios');
btn.disabled=true;

fetch(SCRIPT_URL+'?action=checkLogin&login='+encodeURIComponent(l)+'&password='+encodeURIComponent(p))
.then(r=>r.json())
.then(function(res){
btn.disabled=false;
if(res.status==='success'){
currentUser=res.name||l;
var role=res.role||'user';
window.userRole=role;
// Сохраняем сессию с датой истечения
var expires=new Date();
expires.setHours(expires.getHours()+SESSION_HOURS);
localStorage.setItem('priemkaSession',JSON.stringify({
user:currentUser,
role:role,
expires:expires.toISOString()
}));
document.getElementById('menuUserName').textContent=currentUser;
document.getElementById('loginScreen').style.display='none';
document.getElementById('appContent').style.display='block';
document.getElementById('mainMenu').style.display='block';
loadUrgentBlock();
}else if(res.status==='wrong_password'){
document.getElementById('loginError').textContent='❌ Неверный пароль';
}else if(res.status==='user_not_found'){
document.getElementById('loginError').textContent='❌ Пользователь не найден';
}else{
document.getElementById('loginError').textContent='❌ Ошибка сервера';
}
})
.catch(function(){
btn.disabled=false;
// Оффлайн-режим — пускаем с ролью user
currentUser=l;
window.userRole='user';
var expires=new Date();
expires.setHours(expires.getHours()+SESSION_HOURS);
localStorage.setItem('priemkaSession',JSON.stringify({
user:currentUser,
role:'user',
expires:expires.toISOString()
}));
document.getElementById('menuUserName').textContent=currentUser;
document.getElementById('loginScreen').style.display='none';
document.getElementById('appContent').style.display='block';
document.getElementById('mainMenu').style.display='block';
loadUrgentBlock();
});
}

// Выход
function doLogout(){
localStorage.removeItem('priemkaSession');
currentUser='';
window.userRole='';
location.reload();
}

// Enter на пароле
document.getElementById('passwordInput').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});

// ============ БЛОКИРОВКА ДЕЙСТВИЙ ДЛЯ USER В АРХИВЕ ============
setTimeout(function(){
if(typeof switchDeviceTab!=='undefined'){
var __origSwitchTab=switchDeviceTab;
switchDeviceTab=function(tab){
var s=JSON.parse(localStorage.getItem('priemkaSession')||'{}');
window.userRole=s.role||'user';
__origSwitchTab(tab);
};

var __origOpenStatus=openStatusModal;
openStatusModal=function(rows,name,serial){
if(window.userRole==='user'&&currentDeviceTab==='archive')return;
__origOpenStatus(rows,name,serial);
};

var __origOpenCard=openCardStatusModal;
openCardStatusModal=function(groupId){
if(window.userRole==='user'&&currentDeviceTab==='archive')return;
__origOpenCard(groupId);
};

var __origSaveCard=saveCardStatus;
saveCardStatus=function(){
if(window.userRole==='user'&&currentDeviceTab==='archive')return;
__origSaveCard();
};

var __origSaveStatus=saveNewStatus;
saveNewStatus=function(){
if(window.userRole==='user'&&currentDeviceTab==='archive')return;
__origSaveStatus();
};

var __origIssue=issueCard;
issueCard=function(groupId){
if(window.userRole==='user'&&currentDeviceTab==='archive')return;
__origIssue(groupId);
};
}
},500);
