/**
 * CYBER.AIM ENGINE
 * v6.0 - Cyberpunk Edition
 */

const app = {
    active: 'hub',
    nav(t) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('n-' + t).classList.add('active');

        document.querySelectorAll('.panel').forEach(p => {
            p.classList.remove('active');
            setTimeout(() => { if (!p.classList.contains('active')) p.style.display = 'none'; }, 200);
        });

        const target = document.getElementById('p-' + t);
        target.style.display = 'flex';
        // Force Reflow
        void target.offsetWidth;
        target.classList.add('active');

        if (t === 'stats') this.loadStats();
    },

    loadStats() {
        const c = document.getElementById('log-feed');
        const d = JSON.parse(localStorage.getItem('cyber_aim_logs') || '[]');

        if (d.length === 0) {
            c.innerHTML = '<div style="text-align:center; padding:20px; color:#555;">NO COMBAT DATA</div>';
            return;
        }

        c.innerHTML = '';
        d.forEach(l => {
            const el = document.createElement('div');
            el.style.cssText = 'background:rgba(255,255,255,0.05); padding:15px; margin-bottom:10px; border-left:2px solid var(--neon-blue); display:flex; justify-content:space-between; align-items:center;';
            el.innerHTML = `
                <div>
                    <div style="color:#fff; font-weight:700;">${l.mode.toUpperCase()}</div>
                    <div style="font-size:0.8rem; color:#888;">${l.date}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-head); font-size:1.5rem; color:var(--neon-yellow);">${l.score}</div>
                    <div style="font-size:0.8rem;">${l.acc}% ACC</div>
                </div>
            `;
            c.appendChild(el);
        });
    }
};

class CyberEngine {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.w = 0; this.h = 0;

        this.state = 'idle';
        this.mode = 'grid';

        this.score = 0;
        this.start = 0;
        this.targets = []; // {x, y, r, hp, ...}
        this.particles = [];

        this.hits = 0; this.clicks = 0;

        this.cfg = {
            dur: 60,
            color: '#fcee0a',
            scale: 1.0
        };

        this.audio = new (window.AudioContext || window.webkitAudioContext)();

        // Listeners
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousedown', e => this.click(e));
        this.canvas.addEventListener('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            this.mx = e.clientX - r.left; this.my = e.clientY - r.top;
        });
        window.addEventListener('keydown', e => { if (e.key === 'Escape') this.stop(); });

        this.loop();
    }

    init(m) {
        this.mode = m;
        const durEl = document.getElementById('cfg-dur');
        const scalEl = document.getElementById('cfg-size');

        if (durEl) this.cfg.dur = parseInt(durEl.value);
        if (scalEl) this.cfg.scale = parseFloat(scalEl.value);

        // LAYER VISIBILITY
        document.getElementById('game-layer').style.display = 'block';

        // RESET STATE
        this.state = 'ready';
        this.score = 0; this.hits = 0; this.clicks = 0;
        document.getElementById('h-score').innerText = '0';
        document.getElementById('h-time').innerText = this.cfg.dur;

        // SHOW CONTROLS, HIDE CANVAS CONTENT FOR NOW
        document.getElementById('hud-controls').style.display = 'flex';
        document.getElementById('countdown').style.display = 'none';

        // Clear old targets
        this.targets = []; this.particles = [];

        // Force Resize logic
        setTimeout(() => this.resize(), 50);
    }

    async beginSequence() {
        const btn = document.getElementById('btn-start');
        btn.innerText = "INITIALIZING...";

        // Audio Resume
        try {
            if (this.audio.state === 'suspended') await this.audio.resume();
        } catch (e) { console.warn(e); }

        // hide controls
        document.getElementById('hud-controls').style.display = 'none';

        // Countdown
        const cd = document.getElementById('countdown');
        cd.style.display = 'flex';

        const count = async (n) => {
            cd.innerText = n;
            this.sfx(440 + n * 100, 'square'); // Beep
            await new Promise(r => setTimeout(r, 1000));
        };

        await count(3);
        await count(2);
        await count(1);

        cd.style.display = 'none';
        this.sfx(880, 'sawtooth'); // GO Sound
        this.startSession();
    }

    startSession() {
        this.state = 'playing';
        this.start = performance.now();

        // Initial Spawns
        const count = (this.mode === 'grid' || this.mode === 'spider') ? 3 : 1;
        for (let i = 0; i < count; i++) this.spawn();
    }

    stop() {
        this.state = 'idle';
        document.getElementById('game-layer').style.display = 'none';
        document.getElementById('modal-end').style.display = 'none';
    }

    restart() {
        document.getElementById('modal-end').style.display = 'none';
        this.init(this.mode);
    }

    resize() {
        // Force browser to recalculate layout before sizing
        const layer = document.getElementById('game-layer');
        if (getComputedStyle(layer).display !== 'none') {
            this.canvas.width = this.w = window.innerWidth;
            this.canvas.height = this.h = window.innerHeight;
        }
    }

    /* --- LOGIC --- */
    spawn(center = false) {
        const pad = 100;
        let r = 50 * this.cfg.scale;

        let x = Math.random() * (this.w - pad * 2) + pad;
        let y = Math.random() * (this.h - pad * 2) + pad;

        if (center) { x = this.w / 2; y = this.h / 2; }

        const t = {
            x, y, r,
            vx: 0, vy: 0,
            maxLife: 99999,
            spawn: performance.now()
        };

        if (this.mode === 'track') {
            t.vx = (Math.random() - 0.5) * 8;
            t.vy = (Math.random() - 0.5) * 8;
        }

        this.targets.push(t);
    }

    click(e) {
        if (this.state !== 'playing') return;
        this.clicks++;

        const r = this.canvas.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;

        let hitIdx = -1;
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            if (Math.hypot(mx - t.x, my - t.y) < t.r) {
                hitIdx = i; break;
            }
        }

        if (hitIdx !== -1) {
            // Hit
            this.hits++;
            this.score += 100;
            this.sfx(600 + (this.hits % 8) * 50, 'square');

            // FX
            const t = this.targets[hitIdx];
            for (let k = 0; k < 8; k++) {
                this.particles.push({
                    x: t.x, y: t.y,
                    vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                    life: 1.0, color: this.cfg.color
                });
            }

            this.targets.splice(hitIdx, 1);

            if (this.mode === 'spider') {
                const isCenter = Math.hypot(t.x - this.w / 2, t.y - this.h / 2) < 5;
                this.spawn(!isCenter);
            } else {
                this.spawn();
            }

        } else {
            // Miss
            if (this.mode !== 'track') this.score = Math.max(0, this.score - 50);
            this.sfx(100, 'sawtooth');

            this.ctx.fillStyle = 'rgba(255,0,0,0.1)';
            this.ctx.fillRect(0, 0, this.w, this.h); // Flash
        }

        this.updateHUD();
    }

    updateHUD() {
        const el = (performance.now() - this.start) / 1000;
        const rem = Math.ceil(this.cfg.dur - el);

        document.getElementById('h-time').innerText = rem;
        document.getElementById('h-score').innerText = this.score;
        const acc = this.clicks === 0 ? 100 : Math.round((this.hits / this.clicks) * 100);
        document.getElementById('h-acc').innerText = acc + "%";

        if (rem <= 0) this.finish();
    }

    finish() {
        this.state = 'idle';
        document.getElementById('modal-end').style.display = 'flex';

        const acc = this.clicks === 0 ? 0 : Math.round((this.hits / this.clicks) * 100);

        let rank = 'F'; // Cyber style
        if (this.score > 20000) rank = 'D';
        if (this.score > 40000) rank = 'C';
        if (this.score > 60000) rank = 'B';
        if (this.score > 80000) rank = 'A';
        if (this.score > 100000) rank = 'S';
        if (this.score > 120000) rank = 'CYBER.GOD';

        document.getElementById('r-rank').innerText = rank;
        document.getElementById('r-score').innerText = this.score;
        document.getElementById('r-acc').innerText = acc + "%";

        // Save
        const logs = JSON.parse(localStorage.getItem('cyber_aim_logs') || '[]');
        logs.unshift({ date: new Date().toLocaleTimeString(), mode: this.mode, score: this.score, acc: acc });
        localStorage.setItem('cyber_aim_logs', JSON.stringify(logs.slice(0, 50)));
    }

    /* --- LOOP --- */
    loop() {
        requestAnimationFrame(() => this.loop());
        if (this.state !== 'playing') return;

        this.updateHUD();

        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.w, this.h);

        // Grid FX
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        this.ctx.lineWidth = 1;
        const s = 50;
        // Animated Grid
        const offset = (performance.now() / 50) % s;
        for (let x = offset; x < this.w; x += s) { this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.h); this.ctx.stroke(); }

        // Targets
        this.targets.forEach(t => {
            if (t.vx) {
                t.x += t.vx; t.y += t.vy;
                if (t.x < t.r || t.x > this.w - t.r) t.vx *= -1;
                if (t.y < t.r || t.y > this.h - t.r) t.vy *= -1;
            }

            // Glow
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = this.cfg.color;
            this.ctx.fillStyle = this.cfg.color;
            this.ctx.beginPath(); this.ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); this.ctx.fill();

            // Core
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath(); this.ctx.arc(t.x, t.y, t.r * 0.7, 0, Math.PI * 2); this.ctx.fill();
        });

        // Particles
        this.particles.forEach((p, i) => {
            p.life -= 0.05;
            p.x += p.vx; p.y += p.vy;
            if (p.life <= 0) this.particles.splice(i, 1);

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath(); this.ctx.fillRect(p.x, p.y, 4, 4);
            this.ctx.globalAlpha = 1.0;
        });

        // Crosshair
        if (this.mx) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mx - 10, this.my); this.ctx.lineTo(this.mx + 10, this.my);
            this.ctx.moveTo(this.mx, this.my - 10); this.ctx.lineTo(this.mx, this.my + 10);
            this.ctx.stroke();
        }
    }

    sfx(f, type) {
        if (this.audio.state === 'suspended') this.audio.resume();
        const o = this.audio.createOscillator();
        const g = this.audio.createGain();
        o.type = type; o.frequency.value = f;
        o.connect(g); g.connect(this.audio.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.1);
        o.stop(this.audio.currentTime + 0.1);
    }
}

const game = new CyberEngine();
app.nav('hub');
