// ============ ЭФФЕКТЫ И АНИМАЦИИ ============
console.log('effects.js загружен');

window.addEventListener('load', function() {
    setTimeout(function() {
        initParticles();
        initRipple();
        initCounters();
        initIconAnimations();
        initSkeletonLoading();
    }, 800);
});

// ============ 1. ПЛАВАЮЩИЕ ЧАСТИЦЫ ============
function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.id = 'particlesCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
    document.body.prepend(canvas);
    
    var ctx = canvas.getContext('2d');
    var particles = [];
    var maxParticles = 40; // Мало частиц — не тормозит
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    
    // Создаём частицы
    for (var i = 0; i < maxParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1,
            color: Math.random() < 0.5 ? '0, 255, 136' : '0, 200, 255'
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(function(p) {
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + p.color + ',' + p.opacity + ')';
            ctx.fill();
            
            // Свечение
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + p.color + ',' + (p.opacity * 0.15) + ')';
            ctx.fill();
        });
        
        // Соединяем близкие частицы
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(0, 255, 136, ' + (0.04 * (1 - dist / 120)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// ============ 2. RIPPLE ЭФФЕКТ НА КНОПКАХ ============
function initRipple() {
    document.addEventListener('click', function(e) {
        var target = e.target.closest('.btn-ios, .btn-ios-green, .btn-ios-orange, .btn-ios-gray, .btn-sm, .menu-card');
        if (!target) return;
        
        var ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        var rect = target.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = 
            'position:absolute;width:' + size + 'px;height:' + size + 'px;' +
            'left:' + x + 'px;top:' + y + 'px;' +
            'background:rgba(255,255,255,0.2);border-radius:50%;' +
            'pointer-events:none;animation:ripple 0.6s ease-out;' +
            'transform:scale(0);opacity:1;';
        
        target.style.position = target.style.position || 'relative';
        target.style.overflow = 'hidden';
        target.appendChild(ripple);
        
        setTimeout(function() { ripple.remove(); }, 600);
    });
    
    var rippleStyle = document.createElement('style');
    rippleStyle.textContent = '@keyframes ripple { to { transform: scale(4); opacity: 0; } }';
    document.head.appendChild(rippleStyle);
}

// ============ 3. АНИМАЦИЯ СЧЁТЧИКОВ ============
function initCounters() {
    // Наблюдаем за появлением стат-бейджей
    var observer = new MutationObserver(function() {
        animateAllCounters();
    });
    
    var statsRow = document.getElementById('statsRow');
    if (statsRow) {
        observer.observe(statsRow, { childList: true, subtree: true });
    }
}

function animateAllCounters() {
    var badges = document.querySelectorAll('.stat-badge');
    badges.forEach(function(badge) {
        if (badge.dataset.animated) return;
        badge.dataset.animated = '1';
        
        var text = badge.textContent;
        var match = text.match(/(\d+)/);
        if (!match) return;
        
        var targetNum = parseInt(match[1]);
        var prefix = text.substring(0, match.index);
        var suffix = text.substring(match.index + match[0].length);
        var currentNum = 0;
        var duration = 600;
        var start = null;
        
        function step(timestamp) {
            if (!start) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            // Easing
            var eased = 1 - Math.pow(1 - progress, 3);
            currentNum = Math.floor(eased * targetNum);
            badge.textContent = prefix + currentNum + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                badge.textContent = prefix + targetNum + suffix;
            }
        }
        
        requestAnimationFrame(step);
    });
}

// ============ 4. АНИМИРОВАННЫЕ ИКОНКИ ============
function initIconAnimations() {
    // Добавляем стили для иконок
    var style = document.createElement('style');
    style.textContent = 
        '.menu-icon { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); display: inline-block; }' +
        '.menu-card:hover .menu-icon { transform: scale(1.2) rotate(-5deg); }' +
        '.btn-ios-icon { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }' +
        '.btn-ios-icon:active { transform: scale(0.85) rotate(10deg); }' +
        '.card-status { transition: all 0.3s ease; }' +
        '.card-status:hover { transform: translateY(-2px); filter: brightness(1.3); }' +
        '.group-card .toggle-icon { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }' +
        '.device-mini { transition: all 0.25s ease; }' +
        '.device-mini:hover { background: rgba(0,255,136,0.03); padding-left: 4px; border-radius: 6px; }';
    document.head.appendChild(style);
}

// ============ 5. SKELETON LOADING ============
function initSkeletonLoading() {
    // Перехватываем loadDevices для показа скелетона
    var _origLoadDevices = loadDevices;
    loadDevices = function() {
        var list = document.getElementById('devicesList');
        if (list && (!allDevicesCache || allDevicesCache.length === 0)) {
            showSkeleton(list);
        }
        _origLoadDevices();
    };
    
    // Скелетон для приёмки
    var _origInitPriemka = initPriemkaMode;
    if (typeof _origInitPriemka === 'function') {
        initPriemkaMode = function() {
            var content = document.getElementById('priemkaContent');
            if (content) showSkeleton(content);
            _origInitPriemka();
        };
    }
}

function showSkeleton(container) {
    var html = '';
    for (var i = 0; i < 3; i++) {
        html += '<div class="skeleton-card" style="background:rgba(15,25,60,0.6);border-radius:16px;padding:16px;margin-bottom:10px;border:1px solid rgba(0,255,136,0.08)">' +
            '<div class="skeleton-line" style="height:16px;width:60%;background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:10px;animation:shimmer 1.5s infinite"></div>' +
            '<div class="skeleton-line" style="height:12px;width:40%;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:8px;animation:shimmer 1.5s infinite 0.2s"></div>' +
            '<div class="skeleton-line" style="height:12px;width:30%;background:rgba(255,255,255,0.04);border-radius:8px;animation:shimmer 1.5s infinite 0.4s"></div>' +
            '</div>';
    }
    container.innerHTML = html;
    
    var shimmerStyle = document.createElement('style');
    shimmerStyle.textContent = '@keyframes shimmer { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }';
    if (!document.querySelector('style[data-shimmer]')) {
        shimmerStyle.setAttribute('data-shimmer', '1');
        document.head.appendChild(shimmerStyle);
    }
}
