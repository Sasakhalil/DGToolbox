/**
 * REFLEX PRO ENGINE (Lite)
 * Focused Reaction Testing (Visual/Audio Only)
 */

class ReflexEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;

        this.mode = 'vis';
        this.state = 'idle'; // idle, wait, active, result
        this.timer = null;
        this.startT = 0;

        // Data
        this.history = []; // { mode, ms, time }

        // DOM
        this.body = document.body;
        this.uiMain = document.getElementById('ui-main');
        this.uiSub = document.getElementById('ui-sub');
        this.logList = document.getElementById('log-list');

        // Init
        window.addEventListener('mousedown', () => this.initAudio(), { once: true });
        window.addEventListener('keydown', e => {
            if (e.code === 'Space') this.input();
            if (e.code === 'Escape') window.location.href = 'index.html'; // Quick Exit
        });

        this.updateStats();
    }

    /* --- AUDIO SYSTEM --- */
    initAudio() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Audio Init Failed:", e);
            }
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        document.getElementById('icon-mute').className = this.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }

    tone(f, type, d, vol = 0.1) {
        if (!this.ctx || this.muted) return;
        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type; o.frequency.value = f;
            o.connect(g); g.connect(this.ctx.destination);
            o.start();
            g.gain.setValueAtTime(vol, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
            o.stop(this.ctx.currentTime + d);
        } catch (e) {
            console.warn("Audio Tone Error:", e);
        }
    }

    /* --- LOGIC --- */
    setMode(m) {
        if (this.state !== 'idle' && this.state !== 'result') return;
        this.mode = m;
        this.body.className = `mode-${m}`;

        // Update Buttons
        const btns = document.querySelectorAll('.mode-btn');
        btns.forEach(b => b.classList.remove('active'));
        if (m === 'vis') btns[0].classList.add('active');
        if (m === 'aud') btns[1].classList.add('active');

        this.reset();
    }

    input(e) {
        if (this.state === 'idle' || this.state === 'result') this.prepare();
        else if (this.state === 'wait') this.fault();
        else if (this.state === 'active') this.finish();
    }

    reset() {
        this.state = 'idle';
        this.body.classList.remove('state-wait', 'state-go');
        this.uiMain.innerText = 'READY';
        this.uiMain.style.display = 'block';
        this.uiSub.innerText = 'TAP TO START';
        this.uiSub.style.display = 'block';
        this.uiMain.style.color = '';
    }

    prepare() {
        this.state = 'wait';
        this.body.classList.add('state-wait');
        this.uiMain.innerText = 'WAIT';
        this.uiSub.innerText = this.mode === 'aud' ? '...LISTENING...' : '...STEADY...';

        const delay = Math.random() * 2000 + 1500;
        this.timer = setTimeout(() => this.trigger(), delay);
    }

    trigger() {
        this.state = 'active';
        this.startT = performance.now();
        this.body.classList.remove('state-wait');
        this.body.classList.add('state-go');

        this.uiMain.innerText = 'GO!';
        this.uiSub.innerText = '';

        if (this.mode === 'aud') this.tone(600, 'square', 0.2, 0.2);
        else this.tone(1000, 'sine', 0.1, 0.1);
    }

    fault() {
        clearTimeout(this.timer);
        this.state = 'result';
        this.body.classList.remove('state-wait');
        this.uiMain.innerText = 'FAULT';
        this.uiSub.innerText = 'EARLY TRIGGER';
        this.tone(150, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this.reset(), 1000);
    }

    finish() {
        const ms = Math.round(performance.now() - this.startT);
        this.state = 'result';
        this.body.classList.remove('state-go');

        this.uiMain.innerText = ms;
        this.uiSub.innerText = 'MS LATENCY';

        if (ms < 200) this.tone(800, 'triangle', 0.4, 0.2); // Win

        this.addLog(ms);
    }

    /* --- DATA & LOGS --- */
    addLog(ms) {
        this.history.unshift(ms);
        if (this.history.length > 50) this.history.pop();

        const row = document.createElement('div');
        row.className = 'log-item';

        let rankIcon = '🔘';
        let color = '#555';

        // Relaxed Grading
        if (ms < 200) { rankIcon = '💎'; color = '#00e5ff'; }
        else if (ms < 250) { rankIcon = '🥇'; color = '#ffd700'; }
        else if (ms < 300) { rankIcon = '🥈'; color = '#ccc'; }
        else { rankIcon = '🥉'; color = '#cd7f32'; }

        row.style.borderLeftColor = color;
        row.innerHTML = `
            <div class="log-mode">${this.mode.toUpperCase()}</div>
            <div class="log-val">${ms}</div>
            <div class="log-rank">${rankIcon}</div>
        `;

        if (this.logList.firstChild) this.logList.insertBefore(row, this.logList.firstChild);
        else this.logList.appendChild(row);

        this.updateStats();
    }

    updateStats() {
        if (this.history.length === 0) return;
        const avg = Math.round(this.history.reduce((a, b) => a + b, 0) / this.history.length);
        const best = Math.min(...this.history);

        document.getElementById('disp-avg').innerText = avg;
        document.getElementById('disp-best').innerText = best;

        let r = "UNRANKED";
        const elR = document.getElementById('disp-rank');

        // Relaxed Ranking Thresholds
        if (avg < 200) r = "PRO LEAGUE";
        else if (avg < 250) r = "ELITE";
        else if (avg < 300) r = "GOLD";
        else if (avg < 400) r = "SILVER";
        else r = "ROOKIE";

        elR.innerText = r;
        if (r === 'PRO LEAGUE') elR.style.color = '#00e5ff';
        else if (r === 'ELITE') elR.style.color = '#d400ff';
        else if (r === 'GOLD') elR.style.color = '#ffd700';
        else elR.style.color = '#fff';
    }

    clearLog() {
        this.history = [];
        this.logList.innerHTML = '';
        document.getElementById('disp-avg').innerText = '--';
        document.getElementById('disp-best').innerText = '--';
        document.getElementById('disp-rank').innerText = 'UNRANKED';
    }
}

const app = new ReflexEngine();
