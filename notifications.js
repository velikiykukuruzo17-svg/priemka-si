// ============ УВЕДОМЛЕНИЯ (облегчённые) ============
console.log('notifications.js загружен');

window.addEventListener('load', function() {
    setTimeout(function() {
        // Запрашиваем разрешение на уведомления
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        // Проверяем срочные
        checkUrgentDevices();
    }, 2000);
});

function checkUrgentDevices() {
    if (!allDevicesCache || allDevicesCache.length === 0) return;
    
    var now = new Date();
    var urgent = 0;
    var warning = 0;
    
    allDevicesCache.forEach(function(d) {
        var skip = ['Выдан', 'Ремонт', 'Годен', 'Не годен', 'Брак', 'Калибровка', 'Настройка'];
        if (skip.indexOf(d.status) !== -1) return;
        if (d.cardStatus === 'transferred') return;
        
        var dl = getDeadline(d.actDate);
        var days = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
        
        if (days <= 0) urgent++;
        else if (days <= 2) warning++;
    });
    
    if (urgent > 0 || warning > 0) {
        var msg = '';
        if (urgent > 0) msg += '🔴 ' + urgent + ' просрочено! ';
        if (warning > 0) msg += '🟡 ' + warning + ' — ≤2 дня';
        
        // Всплывашка
        showPopup(msg);
        
        // Браузерное уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification('⚠️ Срочные поверки', { body: msg, vibrate: [200,100,200] }); } catch(e) {}
        }
        
        // Звук (простой)
        try { playBeep(urgent > 0 ? 800 : 500); } catch(e) {}
    }
}

function showPopup(msg) {
    var old = document.getElementById('urgentPopup');
    if (old) old.remove();
    
    var p = document.createElement('div');
    p.id = 'urgentPopup';
    p.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'background:#FF5252;color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;' +
        'cursor:pointer;box-shadow:0 4px 16px rgba(255,82,82,0.4);text-align:center;max-width:90%';
    p.textContent = msg + ' — Нажмите';
    p.onclick = function() { showMode('devices'); p.remove(); };
    document.body.appendChild(p);
    setTimeout(function() { if (p.parentElement) p.remove(); }, 8000);
}

function playBeep(freq) {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        osc.start();
        setTimeout(function() { osc.stop(); }, 250);
    } catch(e) {}
}

// Защита фоновой отрисовки. Выполняется раньше отложенного initParticles.
(function(){'use strict';
if(window.__backgroundSafetyInstalled)return;window.__backgroundSafetyInstalled=true;
var base=document.createElement('style');base.textContent='@media screen{html{background:#0a0e27!important}}';document.head.appendChild(base);
function install(){
 if(typeof window.initParticles!=='function')return;
 window.initParticles=function(){
  if(document.getElementById('particlesCanvas'))return;
  var canvas=document.createElement('canvas');canvas.id='particlesCanvas';canvas.width=1;canvas.height=1;
  canvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;display:none';
  var ctx;try{ctx=canvas.getContext('2d');}catch(e){return;}if(!ctx)return;
  document.body.prepend(canvas);
  var frame=0,last=-Infinity,failed=false,particles=[],reduced=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  for(var i=0;i<24;i++)particles.push({x:Math.random(),y:Math.random(),dx:(Math.random()-.5)*.0003,dy:(Math.random()-.5)*.0003,r:Math.random()*2+1,a:Math.random()*.4+.1});
  function allowed(){var c=document.body.classList;return !failed&&!document.hidden&&!(reduced&&reduced.matches)&&!c.contains('mm-enabled')&&!c.contains('ws-modern')&&!c.contains('mm-no-motion');}
  function resize(){var w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight),scale=Math.min(1,1600/w,1000/h);canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);}
  function pause(){if(frame)cancelAnimationFrame(frame);frame=0;canvas.style.display='none';if(canvas.width!==1)canvas.width=1;if(canvas.height!==1)canvas.height=1;}
  function paint(time){frame=0;if(!allowed()){pause();return;}try{
   if(time-last>=50){last=time;ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(function(p){p.x=(p.x+p.dx+1)%1;p.y=(p.y+p.dy+1)%1;ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,p.r,0,Math.PI*2);ctx.fillStyle='rgba(0,200,255,'+p.a+')';ctx.fill();});}
   frame=requestAnimationFrame(paint);
  }catch(e){failed=true;pause();console.warn('Декоративный фон отключён из-за ошибки отрисовки.');}}
  function sync(){if(!allowed()){pause();return;}canvas.style.display='';if(!frame){resize();last=-Infinity;frame=requestAnimationFrame(paint);}}
  var observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);window.addEventListener('resize',function(){if(frame)resize();},{passive:true});
  if(reduced){if(reduced.addEventListener)reduced.addEventListener('change',sync);else if(reduced.addListener)reduced.addListener(sync);}
  canvas.addEventListener('contextlost',function(){failed=true;pause();});sync();
 };
}
if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();
