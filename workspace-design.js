// Только оформление. Не вызывает API, не изменяет формы и рабочие хранилища.
(function(){'use strict';
if(/\/menu-preview\.html$/.test(location.pathname))return;
function init(){
var app=document.getElementById('appContent');if(!app||document.getElementById('workspace-controls'))return;
var gas=/\/gas-intake\.html$/.test(location.pathname),key='priemkaMenuDesign',menu=document.getElementById('mainMenu');
['priemkaMode','devicesMode','calendarMode','priceMode','archiveMode','settingsPanel','gasMode'].forEach(function(id){var n=document.getElementById(id);if(n)n.classList.add('ws-panel');});
var css=document.createElement('link');css.rel='stylesheet';css.href='workspace-design.css?v=1';document.head.appendChild(css);
var bar=document.createElement('div');bar.id='workspace-controls';bar.setAttribute('aria-label','Оформление приложения');
var label=document.createElement('span');label.textContent='Дизайн приложения:';
function button(text){var b=document.createElement('button');b.type='button';b.textContent=text;return b;}
var classic=button('Текущий'),modern=button('Новый'),note=document.createElement('span');note.setAttribute('role','status');bar.append(label,classic,modern,note);app.prepend(bar);
function read(){try{return localStorage.getItem(key)==='modern';}catch(e){return false;}}
var gasActive=read();
function sync(){var on=gas?gasActive:document.body.classList.contains('mm-enabled');if(document.body.classList.contains('ws-modern')!==on)document.body.classList.toggle('ws-modern',on);classic.setAttribute('aria-pressed',String(!on));modern.setAttribute('aria-pressed',String(on));bar.hidden=!gas&&!!menu&&getComputedStyle(menu).display!=='none';}
async function choose(on){note.textContent='';if(gas){gasActive=on;sync();try{localStorage.setItem(key,on?'modern':'classic');}catch(e){note.textContent='Настройка действует только на этой странице.';}return;}
var controls=document.getElementById('menu-design-controls'),buttons=controls?controls.querySelectorAll('button'):[],target=buttons[on?1:0];
if(!target||typeof target.onclick!=='function'){note.textContent='Переключатель ещё загружается. Повторите нажатие.';return;}if(target.disabled){note.textContent='Оформление ещё загружается.';return;}
try{await target.onclick();sync();var status=document.getElementById('menu-design-status');note.textContent=status?status.textContent:'';}catch(e){note.textContent='Не удалось изменить оформление. Вернитесь в меню.';}}
classic.onclick=function(){return choose(false);};modern.onclick=function(){return choose(true);};
var observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});if(menu)observer.observe(menu,{attributes:true,attributeFilter:['style','class']});
window.addEventListener('storage',function(e){if(e.key!==key&&e.key!==null)return;if(gas){gasActive=read();sync();}else if(read()!==document.body.classList.contains('mm-enabled'))void choose(read());});
css.onerror=function(){note.textContent='Не удалось загрузить оформление внутренних разделов.';};sync();
}
if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
