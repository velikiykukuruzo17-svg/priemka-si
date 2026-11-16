// Газовый учёт читает только отдельный газовый журнал.
var currentGasCompany=null,currentGasStatus='work',gasDevicesCache=[];
(function(){
'use strict';
function node(id){return document.getElementById(id);}
function make(tag,text,cls){var n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
function link(text,mode,company){var a=make('a',text,'btn-ios');a.href='gas-intake.html?mode='+mode+(company?'&company='+encodeURIComponent(company):'');a.style.cssText='display:block;margin:10px 0;text-decoration:none';return a;}
window.createGasSection=function(){
  if(node('gasMode')||!node('appContent'))return;
  var section=make('div');section.id='gasMode';section.style.display='none';
  var back=make('button','Назад','btn-back');back.onclick=function(){if(currentGasCompany)showGasMainScreen();else showMainMenu();};
  var heading=make('h1','Газовые СИ');heading.id='gasHeading';
  var toolbar=make('div');toolbar.id='gasToolbar';
  var content=make('div');content.id='gasContent';section.append(back,heading,toolbar,content);node('appContent').appendChild(section);
  var card=make('div',null,'menu-card');card.id='menuGas';
  var info=make('div',null,'menu-info');info.append(make('h3','Газовые СИ'),make('p','Отдельные приёмка, журнал и архив'));card.appendChild(info);card.onclick=function(){showMode('gas');};
  var menu=node('mainMenu'),before=Array.from(menu.querySelectorAll('.menu-card')).find(function(c){return c.textContent.includes('Календарь поверок');});
  if(before)before.before(card);else menu.appendChild(card);
};
async function reload(){
  var c=node('gasContent');c.textContent='Загрузка газового журнала...';
  try {var u=new URL(SCRIPT_URL);u.searchParams.set('section','gas');u.searchParams.set('action','gas_getDevices');
    var r=await fetch(u.href);if(!r.ok)throw new Error('HTTP '+r.status);var data=await r.json();
    if(data.section!=='gas'||data.status==='error')throw new Error(data.message||'Газовый обработчик Apps Script ещё не установлен. Обычный журнал не используется.');
    gasDevicesCache=data.devices||[];if(currentGasCompany)renderGasCompanyDevices();else renderGasCompanies();
  }catch(e){c.textContent=e.message;}
}
window.showGasMainScreen=function(){currentGasCompany=null;node('gasHeading').textContent='Газовые СИ';var t=node('gasToolbar');t.replaceChildren(link('Приёмка газовых СИ','priemka'),link('Архив газовых актов','archive'),link('Управление газовыми СИ','devices'));renderGasCompanies();reload();};
window.renderGasCompanies=function(){
  var content=node('gasContent');content.replaceChildren();var companies={};
  gasDevicesCache.forEach(function(d){var c=d.company||'Без компании';if(!companies[c])companies[c]={total:0,work:0,ready:0};companies[c].total++;if(d.status==='В работе')companies[c].work++;if(d.status==='Годен')companies[c].ready++;});
  Object.keys(companies).sort().forEach(function(name){var stats=companies[name],card=make('div',null,'menu-card'),info=make('div',null,'menu-info');info.append(make('h3',name),make('p',stats.work+' в работе | '+stats.ready+' готово | Всего: '+stats.total));card.appendChild(info);card.onclick=function(){showGasCompany(name);};content.appendChild(card);});
  if(!Object.keys(companies).length)content.textContent='Газовый журнал пока пуст. Старые приборы автоматически не переносятся.';
};
window.showGasCompany=function(company){
  currentGasCompany=company;currentGasStatus='work';node('gasHeading').textContent=company;
  var t=node('gasToolbar');t.replaceChildren(link('Принять приборы компании','priemka',company),link('Управление газовыми СИ','devices'));
  var tabs=make('div',null,'tabs');
  [['work','В работе'],['ready','Годен'],['notgood','Не годен'],['issued','Выдан'],['repair','Ремонт']].forEach(function(pair){var tab=make('button',pair[1],'tab');tab.dataset.status=pair[0];tab.onclick=function(){currentGasStatus=pair[0];renderGasCompanyDevices();};tabs.appendChild(tab);});
  var search=make('input');search.type='search';search.id='gasSearch';search.placeholder='Поиск по номеру или названию';search.oninput=renderGasCompanyDevices;t.append(tabs,search);renderGasCompanyDevices();
};
window.renderGasCompanyDevices=function(){
  var groups={},sets={work:['В работе'],ready:['Годен'],notgood:['Не годен','Брак'],issued:['Выдан'],repair:['Ремонт','Калибровка','Настройка']},query=(node('gasSearch')?.value||'').toLowerCase();
  var filtered=gasDevicesCache.filter(function(d){return (d.company||'Без компании')===currentGasCompany&&sets[currentGasStatus].includes(d.status)&&(d.name+' '+d.type+' '+d.serial).toLowerCase().includes(query);});
  document.querySelectorAll('#gasToolbar .tab').forEach(function(t){t.classList.toggle('active',t.dataset.status===currentGasStatus);});
  filtered.forEach(function(d){var key=d.actNumber||d.actDate;if(!groups[key])groups[key]=[];groups[key].push(d);});
  var content=node('gasContent');content.replaceChildren();
  Object.keys(groups).forEach(function(k){var details=make('details',null,'group-card');details.appendChild(make('summary','Акт '+k+' ('+groups[k].length+')'));groups[k].forEach(function(d){details.appendChild(make('div',(d.name||'')+' | '+d.serial+' | '+d.status+' | Показания: '+(d.reading||'—')+' | Телефон: '+(d.phone||'—'),'device-mini'));});content.appendChild(details);});
  if(!filtered.length)content.textContent='Нет приборов с выбранным статусом.';
};
var originalShow=showMode;showMode=function(mode){if(mode==='gas'){createGasSection();hideAllModes();node('gasMode').style.display='block';showGasMainScreen();return;}originalShow(mode);};
var originalHide=hideAllModes;hideAllModes=function(){originalHide();if(node('gasMode'))node('gasMode').style.display='none';};
window.addEventListener('load',createGasSection);
})();

// Переключатель оформления подключается только на основном входе.
(function(){
 if(/\/(menu-preview|gas-intake)\.html$/.test(location.pathname))return;
 function load(){if(document.getElementById('menu-toggle-loader'))return;var s=document.createElement('script');s.id='menu-toggle-loader';s.src='menu-toggle.js?v=1';s.async=true;document.head.appendChild(s);var w=document.createElement('script');w.src='workspace-design.js?v=1';w.async=true;document.head.appendChild(w);}
 if(document.readyState==='complete')load();else window.addEventListener('load',load,{once:true});
})();
