// Оформление меню: без перезагрузки, вызовов Apps Script и изменения черновиков.
(function(){
'use strict';
if(/\/(menu-preview|gas-intake)\.html$/.test(location.pathname))return;
function init(){
 var menu=document.getElementById('mainMenu'),app=document.getElementById('appContent');if(!menu||!app||document.getElementById('menu-design-controls'))return;
 var key='priemkaMenuDesign',active=false,prepared=false,assets=null,loading=null,epoch=0,snap=null,off=false;
 var rules=document.createElement('style');rules.textContent='#menu-design-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:12px;background:#16243d;color:#e5edff;border:1px solid #475569;border-radius:12px;font-size:14px}#menu-design-controls button{padding:9px 13px;border:1px solid #64748b;border-radius:9px;background:#223655;color:#fff;font-size:14px;cursor:pointer}#menu-design-controls button[aria-pressed="true"]{background:#1d4ed8;border-color:#93c5fd}#menu-design-controls button:focus-visible{outline:3px solid #a5d8ff;outline-offset:3px}#menu-design-controls button[hidden],#mainMenu .mm-toggle-hidden{display:none!important}#menu-design-status{flex-basis:100%;color:#d4e3fc;font-size:13px;line-height:1.5}body.mm-home #particlesCanvas{display:none!important}';document.head.append(rules);
 var controls=document.createElement('div');controls.id='menu-design-controls';var label=document.createElement('span');label.textContent='Дизайн меню:';
 function button(text){var b=document.createElement('button');b.type='button';b.textContent=text;return b;}
 var current=button('Текущий'),modern=button('Новый'),motion=button('Без анимаций'),status=document.createElement('div');status.id='menu-design-status';status.setAttribute('role','status');motion.hidden=true;controls.append(label,current,modern,motion,status);menu.prepend(controls);
 function stored(){try{return localStorage.getItem(key)==='modern';}catch(e){return false;}}
 function remember(value){try{localStorage.setItem(key,value?'modern':'classic');}catch(e){status.textContent='Выбор действует до закрытия страницы: браузер не разрешил сохранить настройку.';}}
 function syncHome(){document.body.classList.toggle('mm-home',active&&getComputedStyle(menu).display!=='none'&&getComputedStyle(app).display!=='none');}
 var watch=new MutationObserver(syncHome);watch.observe(menu,{attributes:true,attributeFilter:['style','class']});watch.observe(app,{attributes:true,attributeFilter:['style','class']});
 function attr(node,name,value){if(value===null)node.removeAttribute(name);else node.setAttribute(name,value);}
 async function ensureAssets(){
  if(assets)return assets;if(loading)return loading;
  loading=(async function(){var r=await fetch('menu-preview.html',{cache:'no-cache'});if(!r.ok)throw new Error('Не загружен новый дизайн: HTTP '+r.status);var text=await r.text();
   var begin=text.indexOf('function mmPreviewDesign(){'),end=text.indexOf('\n(async function(){try{',begin),match=text.match(/var css=`([\s\S]*?)`;var design=/);
   if(begin<0||end<0||!match)throw new Error('Формат пробного дизайна изменился; текущий вид сохранён.');
   var source=text.slice(begin,end),guard="function sync(){document.body.classList.toggle('mm-home',";
   if(source.indexOf(guard)<0)throw new Error('Новый дизайн несовместим с переключателем.');
   source=source.replace(guard,"function sync(){if(!document.body.classList.contains('mm-enabled'))return;document.body.classList.toggle('mm-home',");
   var style=document.createElement('style');style.disabled=true;style.textContent=match[1];document.head.append(style);
   // Выполняется только функция из собственного проверенного menu-preview.html.
   // Загрузчик страницы с document.write сюда не переносится.
   var script=document.createElement('script');script.textContent=source;document.head.append(script);
   if(typeof window.mmPreviewDesign!=='function'){style.remove();script.remove();throw new Error('Браузер не разрешил подключить новый дизайн.');}
   assets={style:style,script:script};return assets;
  })();try{return await loading;}finally{loading=null;}
 }
 function prepare(){
  if(prepared)return;
  var heading=menu.querySelector('.header h1'),logout=menu.querySelector('.btn-logout'),user=document.getElementById('menuUserName');
  snap={heading:heading,headingText:heading?heading.textContent:'',logout:logout,logoutHTML:logout?logout.innerHTML:'',logoutAria:logout?logout.getAttribute('aria-label'):null,logoutTitle:logout?logout.getAttribute('title'):null,texts:[],cards:[],containers:[]};
  if(logout){snap.logoutMark=document.createComment('original logout');logout.before(snap.logoutMark);}
  if(user){snap.userParent=user.parentElement;snap.userHadClass=user.parentElement.classList.contains('mm-user');Array.from(user.parentElement.childNodes).forEach(function(n){if(n.nodeType===3)snap.texts.push({node:n,text:n.textContent});});}
  Array.from(menu.querySelectorAll('.menu-card')).forEach(function(card){var mark=document.createComment('original menu item');card.before(mark);var icon=card.querySelector('.menu-icon');snap.cards.push({card:card,mark:mark,oldIcon:icon,oldHTML:icon?icon.innerHTML:'',oldIconAria:icon?icon.getAttribute('aria-hidden'):null,tab:card.getAttribute('tabindex'),role:card.getAttribute('role'),label:card.getAttribute('aria-label'),delay:card.style.getPropertyValue('--delay'),priority:card.style.getPropertyPriority('--delay')});});
  try{window.mmPreviewDesign();
   snap.containers=[menu.querySelector('.mm-hero'),menu.querySelector('.mm-grid'),menu.querySelector('.mm-top-actions')].filter(Boolean);
   if(snap.containers.length!==3)throw new Error('Не удалось построить новое меню.');
   snap.grid=menu.querySelector('.mm-grid');snap.actions=menu.querySelector('.mm-top-actions');snap.modernHeading=heading?heading.textContent:'';snap.modernLogout=logout?logout.innerHTML:'';
   snap.cards.forEach(function(s){s.picture=s.card.querySelector('.menu-icon');s.newHTML=s.picture?s.picture.innerHTML:'';s.kind=s.card.dataset.mmKind;s.arrow=s.card.querySelector('.mm-arrow');s.newTab=s.card.getAttribute('tabindex');s.newRole=s.card.getAttribute('role');s.newLabel=s.card.getAttribute('aria-label');s.newDelay=s.card.style.getPropertyValue('--delay');});prepared=true;
  }catch(e){restore();[menu.querySelector('.mm-hero'),menu.querySelector('.mm-grid'),menu.querySelector('.mm-top-actions')].filter(Boolean).forEach(function(n){n.remove();});snap.cards.forEach(function(s){s.mark.remove();});if(snap.logoutMark)snap.logoutMark.remove();snap=null;throw e;}
 }
 function restore(){
  if(!snap)return;
  snap.cards.forEach(function(s){s.mark.after(s.card);s.card.classList.remove('mm-card','mm-settings');var pic=s.card.querySelector('.menu-icon');if(s.oldIcon){s.oldIcon.innerHTML=s.oldHTML;attr(s.oldIcon,'aria-hidden',s.oldIconAria);}else if(pic)pic.remove();var arrow=s.card.querySelector('.mm-arrow');if(arrow)arrow.remove();attr(s.card,'tabindex',s.tab);attr(s.card,'role',s.role);attr(s.card,'aria-label',s.label);if(s.delay)s.card.style.setProperty('--delay',s.delay,s.priority);else s.card.style.removeProperty('--delay');});
  if(snap.logout){snap.logoutMark.after(snap.logout);snap.logout.innerHTML=snap.logoutHTML;attr(snap.logout,'aria-label',snap.logoutAria);attr(snap.logout,'title',snap.logoutTitle);}
  if(snap.heading)snap.heading.textContent=snap.headingText;snap.texts.forEach(function(s){s.node.textContent=s.text;});if(snap.userParent&&!snap.userHadClass)snap.userParent.classList.remove('mm-user');
  [menu.querySelector('.mm-hero'),menu.querySelector('.mm-grid'),menu.querySelector('.mm-top-actions')].filter(Boolean).forEach(function(n){n.classList.add('mm-toggle-hidden');});
 }
 function apply(value,save){
  active=value;document.body.classList.toggle('mm-enabled',value);
  if(value){snap.containers.forEach(function(n){n.classList.remove('mm-toggle-hidden');});snap.cards.forEach(function(s){s.card.classList.add(s.kind==='settings'?'mm-settings':'mm-card');s.card.dataset.mmKind=s.kind;if(s.picture){s.picture.innerHTML=s.newHTML;s.picture.setAttribute('aria-hidden','true');if(!s.oldIcon)s.card.prepend(s.picture);}if(s.arrow)s.card.append(s.arrow);attr(s.card,'tabindex',s.newTab);attr(s.card,'role',s.newRole);attr(s.card,'aria-label',s.newLabel);s.card.style.setProperty('--delay',s.newDelay);if(s.kind==='settings')snap.actions.prepend(s.card);else snap.grid.append(s.card);});if(snap.logout){snap.logout.innerHTML=snap.modernLogout;snap.logout.setAttribute('aria-label','Выйти');snap.logout.title='Выйти';snap.actions.append(snap.logout);}if(snap.heading)snap.heading.textContent=snap.modernHeading;if(snap.userParent)snap.userParent.classList.add('mm-user');snap.texts.forEach(function(s){s.node.textContent='Сотрудник: ';});assets.style.disabled=false;
  }else{if(assets)assets.style.disabled=true;restore();}
  document.body.classList.toggle('mm-no-motion',value&&off);syncHome();current.setAttribute('aria-pressed',String(!value));modern.setAttribute('aria-pressed',String(value));motion.hidden=!value;modern.disabled=false;modern.textContent='Новый';status.textContent='';if(save)remember(value);
 }
 current.onclick=function(){epoch++;apply(false,true);};
 modern.onclick=async function(){var request=++epoch;modern.disabled=true;modern.textContent='Загрузка…';status.textContent='Загружаю оформление; данные приложения не меняются.';try{await ensureAssets();if(request!==epoch)return;prepare();apply(true,true);}catch(e){if(request===epoch){apply(false,false);status.textContent=e.message||'Не удалось включить новый дизайн. Текущий вид сохранён.';}}};
 var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');function motionLabel(){motion.disabled=reduced.matches;motion.textContent=reduced.matches?'Анимации отключены системой':off?'Включить анимации':'Без анимаций';}motion.onclick=function(){off=!off;document.body.classList.toggle('mm-no-motion',active&&off);motionLabel();};if(reduced.addEventListener)reduced.addEventListener('change',motionLabel);motionLabel();apply(false,false);if(stored())void modern.onclick();
}
if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
