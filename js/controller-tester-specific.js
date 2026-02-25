/**
         * TITAN MK-II CORE SYSTEM
         * A structured, object-oriented approach to Controller Diagnostics.
         */
        const app = {
            state: {
                gpIndex: null,
                metrics: { hz: [], lastTs: 0 },
                drift: { l: [], r: [] },
                flightCheck: {}
            },

            // --- INITIALIZATION ---
            init: function () {
                this.bg.init();
                this.flightCheck.setup();
                this.bindEvents();
                this.loop.start();
            },

            bindEvents: function () {
                window.addEventListener("gamepadconnected", e => this.onConnect(e.gamepad));
                window.addEventListener("gamepaddisconnected", e => this.onDisconnect(e.gamepad));

                // UI Binds
                document.getElementById('rumble-dur').addEventListener('input', (e) => {
                    document.getElementById('lbl-dur').innerText = e.target.value + 'ms';
                });
            },

            onConnect: function (gp) {
                this.state.gpIndex = gp.index;
                this.toast(`DEVICE LINKED: ${gp.id.split('(')[0]}`);

                // Update Sidebar
                document.getElementById('st-state').innerText = "ONLINE";
                document.getElementById('st-state').style.color = "var(--neon-success)";
                document.getElementById('st-led').classList.add('on');
                document.getElementById('st-id').innerText = gp.id;
            },

            onDisconnect: function () {
                this.state.gpIndex = null;
                this.toast(`DEVICE LOST`);

                document.getElementById('st-state').innerText = "SEARCHING";
                document.getElementById('st-state').style.color = "#fff";
                document.getElementById('st-led').classList.remove('on');
                document.getElementById('st-id').innerText = "--";
                document.getElementById('st-hz').innerText = "0 Hz";
            },

            // --- ANIMATION FRAME LOOP ---
            loop: {
                id: null,
                start: function () {
                    const frame = () => {
                        app.logic();
                        app.bg.draw();
                        requestAnimationFrame(frame);
                    };
                    requestAnimationFrame(frame);
                }
            },

            logic: function () {
                // Background animation always runs

                if (app.state.gpIndex === null) return;
                const gp = navigator.getGamepads()[app.state.gpIndex];
                if (!gp) return;

                // 1. Polling Rate Calc
                app.calcHz(gp);

                // 2. Global Flight Check Monitor (Always checks button presses)
                app.flightCheck.monitor(gp);

                // 3. View Logic
                const view = document.querySelector('.view-layer.active').id;

                if (view === 'view-dashboard') app.viz.render(gp);
                if (view === 'view-drift') app.drift.render(gp);
            },

            calcHz: function (gp) {
                const now = performance.now();
                if (gp.timestamp && gp.timestamp !== app.state.metrics.lastTs) {
                    const diff = now - app.state.metrics.lastTime;
                    if (diff > 0) {
                        app.state.metrics.hz.push(diff);
                        if (app.state.metrics.hz.length > 50) app.state.metrics.hz.shift();
                    }
                    app.state.metrics.lastTs = gp.timestamp;
                    app.state.metrics.lastTime = now;

                    // Update UI every 10 frames to avoid flickering
                    if (now % 10 === 0 || app.state.metrics.hz.length > 0) {
                        const avg = app.state.metrics.hz.reduce((a, b) => a + b, 0) / app.state.metrics.hz.length;
                        const Hz = Math.round(1000 / avg);
                        if (isFinite(Hz)) document.getElementById('st-hz').innerText = `${Hz} Hz`;
                    }
                }
            },

            // --- MODULES ---
            viz: {
                render: function (gp) {
                    const set = (id, attr, val) => {
                        const el = document.getElementById(id);
                        if (el) el.setAttribute(attr, val);
                    };
                    const setClass = (id, cls, on) => {
                        const el = document.getElementById(id);
                        if (el) on ? el.classList.add(cls) : el.classList.remove(cls);
                    };

                    // Sticks (SVG Coords: Center 320,300 & 480,300. R=35)
                    // Movement scale factor = 25px
                    set('v-ls', 'cx', gp.axes[0] * 25); set('v-ls', 'cy', gp.axes[1] * 25);
                    set('v-rs', 'cx', gp.axes[2] * 25); set('v-rs', 'cy', gp.axes[3] * 25);

                    // Triggers
                    const tL = gp.buttons[6].value; const tR = gp.buttons[7].value;
                    set('v-l2', 'width', tL * 70); set('v-l2', 'opacity', tL > 0.1 ? 1 : 0.3);
                    set('v-r2', 'width', tR * 70); set('v-r2', 'opacity', tR > 0.1 ? 1 : 0.3);

                    // Buttons Map
                    const map = {
                        0: 'v-b', 1: 'v-r', 2: 'v-l', 3: 'v-t', // Face
                        4: 'v-l1', 5: 'v-r1', // Bumpers
                        12: 'v-up', 13: 'v-down', 14: 'v-left', 15: 'v-right', // Dpad
                        8: 'v-sel', 9: 'v-start', 16: 'v-home' // Meta
                    };

                    for (const [idx, id] of Object.entries(map)) {
                        setClass(id, 'active', gp.buttons[idx] && gp.buttons[idx].pressed);
                    }

                    // Stick Clicks
                    const L3 = gp.buttons[10], R3 = gp.buttons[11];
                    setClass('v-ls', 'active', L3 && L3.pressed);
                    setClass('v-rs', 'active', R3 && R3.pressed);
                }
            },

            drift: {
                render: function (gp) {
                    const draw = (ctx, x, y, trace) => {
                        const w = 250, h = 250, r = 125;

                        // Trace Logic
                        trace.push({ x, y });
                        if (trace.length > 200) trace.shift();

                        ctx.clearRect(0, 0, w, h);

                        // Draw Path
                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
                        ctx.lineWidth = 2;
                        trace.forEach((p, i) => {
                            const px = (p.x * r) + r; const py = (p.y * r) + r;
                            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                        });
                        ctx.stroke();

                        // Draw Current Point
                        const curX = (x * r) + r; const curY = (y * r) + r;
                        ctx.fillStyle = '#fff';
                        ctx.beginPath(); ctx.arc(curX, curY, 6, 0, Math.PI * 2); ctx.fill();

                        // Crosshair
                        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(r, 250); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(250, r); ctx.stroke();
                    };

                    draw(document.getElementById('cv-l').getContext('2d'), gp.axes[0], gp.axes[1], app.state.drift.l);
                    draw(document.getElementById('cv-r').getContext('2d'), gp.axes[2], gp.axes[3], app.state.drift.r);

                    document.getElementById('val-l').innerText = `X: ${gp.axes[0].toFixed(4)} | Y: ${gp.axes[1].toFixed(4)}`;
                    document.getElementById('val-r').innerText = `X: ${gp.axes[2].toFixed(4)} | Y: ${gp.axes[3].toFixed(4)}`;

                    // Error Calc (Simple deadzone error)
                    const errL = Math.max(0, (Math.abs(gp.axes[0]) + Math.abs(gp.axes[1])) - 0.1);
                    // This is naive, but works visually for center drift.
                }
            },

            flightCheck: {
                buttons: [
                    { id: 0, n: 'A / X', i: 'fa-times' }, { id: 1, n: 'B / Circle', i: 'fa-circle' },
                    { id: 2, n: 'X / Square', i: 'fa-square' }, { id: 3, n: 'Y / Triangle', i: 'fa-caret-up' },
                    { id: 4, n: 'LB / L1', i: 'fa-chevron-left' }, { id: 5, n: 'RB / R1', i: 'fa-chevron-right' },
                    { id: 6, n: 'LT / L2 (Trigger)', i: 'fa-bullseye' }, { id: 7, n: 'RT / R2 (Trigger)', i: 'fa-bullseye' },
                    { id: 8, n: 'Select / Share', i: 'fa-window-maximize' }, { id: 9, n: 'Start / Options', i: 'fa-bars' },
                    { id: 10, n: 'L3 (Stick)', i: 'fa-dot-circle' }, { id: 11, n: 'R3 (Stick)', i: 'fa-dot-circle' },
                    { id: 12, n: 'D-Up', i: 'fa-arrow-up' }, { id: 13, n: 'D-Down', i: 'fa-arrow-down' },
                    { id: 14, n: 'D-Left', i: 'fa-arrow-left' }, { id: 15, n: 'D-Right', i: 'fa-arrow-right' }
                ],
                status: {},
                setup: function () {
                    const grid = document.getElementById('fc-grid');
                    grid.innerHTML = this.buttons.map(b => `
                        <div class="check-item" id="fc-btn-${b.id}">
                            <div class="check-icon"><i class="fas ${b.i}"></i></div>
                            <div style="font-size:0.8rem; font-weight:700;">${b.n}</div>
                        </div>
                    `).join('');
                },
                monitor: function (gp) {
                    let passedCount = 0;
                    this.buttons.forEach(b => {
                        // Check if pressed
                        if (gp.buttons[b.id] && gp.buttons[b.id].pressed) {
                            this.status[b.id] = true;
                            document.getElementById(`fc-btn-${b.id}`).classList.add('passed');
                        }
                        if (this.status[b.id]) passedCount++;
                    });

                    // Update Progress
                    const pct = (passedCount / this.buttons.length) * 100;
                    document.getElementById('fc-bar').style.width = pct + '%';
                    document.getElementById('fc-status').innerText = pct === 100 ? "DIAGNOSTIC COMPLETE - ALL SYSTEMS GO" : `${Math.round(pct)}% COMPLETE`;
                }
            },

            haptics: {
                fire: function () {
                    const gp = navigator.getGamepads()[app.state.gpIndex];
                    if (gp && gp.vibrationActuator) {
                        const strong = document.getElementById('rumble-low').value / 100;
                        const weak = document.getElementById('rumble-high').value / 100;
                        const dur = document.getElementById('rumble-dur').value;

                        gp.vibrationActuator.playEffect("dual-rumble", {
                            startDelay: 0, duration: dur, weakMagnitude: weak, strongMagnitude: strong
                        }).then(() => app.toast("Pulse Sent"))
                            .catch(e => app.toast("Error: " + e.message));
                    } else {
                        app.toast("Vibration Not Supported by Browser/Device");
                    }
                }
            },

            // --- PARTICLES BG (Visual Flair) ---
            bg: {
                ctx: null, w: 0, h: 0, particles: [],
                init: function () {
                    const cvs = document.getElementById('bg-canvas');
                    this.ctx = cvs.getContext('2d');
                    this.resize();
                    window.addEventListener('resize', () => this.resize());
                    // Create particles
                    for (let i = 0; i < 50; i++) this.particles.push(this.createP());
                },
                resize: function () {
                    const cvs = document.getElementById('bg-canvas');
                    this.w = cvs.width = window.innerWidth;
                    this.h = cvs.height = window.innerHeight;
                },
                createP: function () {
                    return {
                        x: Math.random() * this.w, y: Math.random() * this.h,
                        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 2, alpha: Math.random() * 0.5
                    };
                },
                draw: function () {
                    const c = this.ctx;
                    c.clearRect(0, 0, this.w, this.h);
                    c.fillStyle = '#fff';
                    this.particles.forEach(p => {
                        p.x += p.vx; p.y += p.vy;
                        if (p.x < 0) p.x = this.w; if (p.x > this.w) p.x = 0;
                        if (p.y < 0) p.y = this.h; if (p.y > this.h) p.y = 0;

                        c.globalAlpha = p.alpha;
                        c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
                    });
                }
            },

            // --- UTILS ---
            nav: function (viewId) {
                document.querySelectorAll('.view-layer').forEach(v => v.classList.remove('active'));
                document.getElementById('view-' + viewId).classList.add('active');

                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                event.currentTarget.classList.add('active');
            },
            resetFlightCheck: function () {
                app.flightCheck.status = {};
                document.querySelectorAll('.check-item').forEach(c => c.classList.remove('passed'));
            },
            toast: function (msg) {
                const t = document.getElementById('titan-toast');
                t.querySelector('span').innerText = msg;
                t.classList.add('show');
                setTimeout(() => t.classList.remove('show'), 3000);
            }
        };

        // Boot
        window.addEventListener('DOMContentLoaded', () => app.init());

        // Global access for onclicks
        window.app = app;