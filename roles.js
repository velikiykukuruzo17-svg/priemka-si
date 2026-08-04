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

var originalRenderDevicesFromCache=renderDevicesFromCache;
renderDevicesFromCache=function(search){
originalRenderDevicesFromCache(search);
if(window.userRole==='user'&&currentDeviceTab==='archive'){
setTimeout(function(){
document.querySelectorAll('#devicesList .group-card').forEach(function(card){
var cs=card.querySelector('.card-status');
if(cs){cs.onclick=null;cs.style.cursor='default';}
card.querySelectorAll('.btn-sm').forEach(function(btn){
var txt=btn.textContent||'';
if(txt.includes('🔄')||txt.includes('📧')||txt.includes('Передать'))btn.style.display='none';
});
var ga=card.querySelector('.group-actions');
if(ga)ga.style.display='none';
});
},200);
}
};
