/**
         * TACTICAL OPS ENGINE v4.5
         */
        const app = {
            locked: false,
            // Accurate Yaw Values derived from game engines
            games: [
                { name: "VALORANT", yaw: 0.07 },
                { name: "COUNTER-STRIKE 2", yaw: 0.022 },
                { name: "APEX LEGENDS", yaw: 0.022 },
                { name: "OVERWATCH 2", yaw: 0.0066 },
                { name: "CALL OF DUTY", yaw: 0.0066 },
                { name: "R6 SIEGE", yaw: 0.00573 },
                { name: "FORTNITE", yaw: 0.5715 }, // Slider scale variation exists, this is standard
                { name: "PUBG: BATTLEGROUNDS", yaw: 0.00702 },
                { name: "FREE FIRE (EMULATOR)", yaw: 0.022 },
                { name: "MINECRAFT (JAVA)", yaw: 0.0066 },
                { name: "ROBLOX", yaw: 0.001716 },
                { name: "GTA V", yaw: 0.022 },
                { name: "QUAKE", yaw: 0.022 },
                { name: "DESTINY 2", yaw: 0.0066 },
                { name: "XDEFIANT", yaw: 0.0066 },
                { name: "THE FINALS", yaw: 0.0066 },
                { name: "BATTLEFIELD 2042", yaw: 0.022 },
                { name: "TEAM FORTRESS 2", yaw: 0.022 },
                { name: "CS: SOURCE", yaw: 0.022 }
            ],

            els: {
                sA: document.getElementById('sensA'),
                dA: document.getElementById('dpiA'),
                dB: document.getElementById('dpiB'),
                res: document.querySelector('.res-display'),
                edpi: document.getElementById('val-edpi'),
                cm: document.getElementById('val-cm'),
                lock: document.getElementById('btn-lock'),
                overlay: document.getElementById('overlay')
            },

            selectedA: 0,
            selectedB: 0,

            init() {
                this.initCustomSelect('c-gameA', 'gameA', 0);
                this.initCustomSelect('c-gameB', 'gameB', 1);

                [this.els.sA, this.els.dA, this.els.dB].forEach(e => {
                    e.addEventListener('input', () => this.calc());
                });

                window.addEventListener('click', (e) => {
                    document.querySelectorAll('.custom-select').forEach(select => {
                        if (!select.contains(e.target)) select.classList.remove('open');
                    });
                });

                this.calc();
            },

            initCustomSelect(uiId, realId, defaultIndex) {
                const ui = document.getElementById(uiId);
                const optsContainer = ui.querySelector('.custom-options');
                const triggerText = ui.querySelector('.selection-text');

                this.games.forEach((g, idx) => {
                    const opt = document.createElement('div');
                    opt.className = 'custom-option';
                    opt.innerText = g.name;
                    opt.dataset.value = g.yaw;

                    if (idx === defaultIndex) {
                        opt.classList.add('selected');
                        triggerText.innerText = g.name;
                        if (realId === 'gameA') this.selectedA = g.yaw;
                        if (realId === 'gameB') this.selectedB = g.yaw;
                    }

                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        ui.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        triggerText.innerText = g.name;

                        if (realId === 'gameA') this.selectedA = g.yaw;
                        if (realId === 'gameB') this.selectedB = g.yaw;

                        ui.classList.remove('open');
                        this.calc();
                    });

                    optsContainer.appendChild(opt);
                });

                ui.querySelector('.custom-select-trigger').addEventListener('click', () => {
                    document.querySelectorAll('.custom-select').forEach(s => { if (s !== ui) s.classList.remove('open'); });
                    ui.classList.toggle('open');
                });
            },

            calc() {
                const yA = this.selectedA;
                const sA = parseFloat(this.els.sA.value);
                const dA = parseFloat(this.els.dA.value);
                const yB = this.selectedB;
                let dB = parseFloat(this.els.dB.value);

                if (this.locked) {
                    dB = dA;
                    this.els.dB.value = dA;
                }

                if (!sA || !dA || !dB) return;

                // Math: sens * yaw * dpi = counts per 360 approx (simplified)
                // Real Formula: 360 / (sens * yaw) * cm_per_inch / dpi = cm/360
                // We want matched cm/360.
                // cm360_A = cm360_B
                // (sensA * yawA * dpiA) = (sensB * yawB * dpiB)  <-- Angular velocity matching logic

                const term = sA * yA * dA;
                const sB = term / (yB * dB);

                // Derived stats
                const edpi = (sB * dB).toFixed(0);
                // cm/360 formula: (360 / (sens * yaw)) * (2.54 / dpi) ... wait, standard yaw is usually degrees. 
                // Using standard yaw values (e.g. 0.022 for source): 
                // Degrees per count = yaw. 
                // Counts per 360 = 360 / (sens * yaw).
                // Inches per 360 = Counts / DPI.
                // CM per 360 = Inches * 2.54.

                const countsPer360 = 360 / (sB * yB);
                const cm = (countsPer360 / dB * 2.54).toFixed(1);

                this.els.res.innerText = sB.toFixed(3);
                this.els.edpi.innerText = edpi;
                this.els.cm.innerText = cm + " CM";
            },

            swap() {
                const tempVal = this.selectedA;
                const tempName = document.querySelector('#c-gameA .selection-text').innerText;

                this.selectedA = this.selectedB;
                document.querySelector('#c-gameA .selection-text').innerText = document.querySelector('#c-gameB .selection-text').innerText;

                this.selectedB = tempVal;
                document.querySelector('#c-gameB .selection-text').innerText = tempName;

                // Also swap DPIs if not locked
                if (!this.locked) {
                    const tempDpi = this.els.dA.value;
                    this.els.dA.value = this.els.dB.value;
                    this.els.dB.value = tempDpi;
                }

                this.calc();
            },

            toggleLock() {
                this.locked = !this.locked;
                this.els.lock.classList.toggle('active');
                if (this.locked) {
                    this.els.dB.disabled = true;
                    this.els.dB.style.opacity = "0.5";
                    this.calc();
                } else {
                    this.els.dB.disabled = false;
                    this.els.dB.style.opacity = "1";
                }
            },

            copy() {
                navigator.clipboard.writeText(this.els.res.innerText).then(() => {
                    this.els.overlay.classList.add('active');
                    setTimeout(() => this.els.overlay.classList.remove('active'), 1000);
                });
            }
        };

        // Init
        app.init();