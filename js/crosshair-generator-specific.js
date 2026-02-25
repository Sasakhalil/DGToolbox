/**
         * CROSSHAIR LABS ENGINE v9
         * Features: Canvas Rendering, Physics Simulation (Recoil/Move), Layering
         */
        const app = {
            state: {
                color: '#00ffbc',
                zoom: 1.0,
                isRecoil: false,
                isMoving: false,
                recoilVal: 0,
                moveVal: 0,
                presets: {
                    default: { inner: [0.8, 6, 2, 3], outer: [0.35, 2, 2, 10], dot: [0, 1, 2], outline: [1, 0.5, 1], color: '#00ffbc' },
                    tenz: { inner: [1, 4, 2, 2], outer: [0, 0, 0, 0], dot: [0, 0, 0], outline: [0, 0, 0], color: '#00ffff' },
                    s1mple: { inner: [1, 2, 1, 1], outer: [0, 0, 0, 0], dot: [1, 1, 1], outline: [0, 0, 0], color: '#ffff00' },
                    dot: { inner: [0, 0, 0, 0], outer: [0, 0, 0, 0], dot: [1, 1, 4], outline: [1, 1, 1], color: '#ff4655' },
                    circle: { inner: [1, 1, 8, 2], outer: [0, 0, 0, 0], dot: [0, 0, 0], outline: [0, 0, 0], color: '#ffffff' }, // Mock circle via thick short lines
                    shroud: { inner: [0.8, 8, 3, 4], outer: [0, 0, 0, 0], dot: [0, 0, 0], outline: [1, 1, 1], color: '#00aaff' }
                }
            },

            els: {
                cvs: document.getElementById('cvs'),
                ctx: null,
                bg: document.getElementById('previewBg'),
                bgSelect: document.getElementById('bgSelect')
            },

            init() {
                this.els.ctx = this.els.cvs.getContext('2d');

                // Event Listeners
                this.els.bgSelect.addEventListener('change', (e) => this.setBg(e.target.value));

                // Animation Loop
                requestAnimationFrame(() => this.loop());

                // Default Update
                this.update();
            },

            // --- RENDER PIPELINE ---
            loop() {
                // Physics Logic
                if (this.state.isRecoil) {
                    this.state.recoilVal = Math.min(this.state.recoilVal + 2, 20); // Expand
                } else {
                    this.state.recoilVal = Math.max(this.state.recoilVal - 1, 0); // Contract
                }

                if (this.state.isMoving) {
                    // Bobbing effect
                    this.state.moveVal = Math.sin(Date.now() / 100) * 5 + 10;
                } else {
                    this.state.moveVal = 0;
                }

                this.draw();
                requestAnimationFrame(() => this.loop());
            },

            draw() {
                const ctx = this.els.ctx;
                const cvs = this.els.cvs;
                const cx = cvs.width / 2;
                const cy = cvs.height / 2;

                ctx.clearRect(0, 0, cvs.width, cvs.height);

                // Apply Zoom
                const z = this.state.zoom;

                // Helper to draw a cross
                const drawCross = (len, thick, gap, alpha, offsetError) => {
                    ctx.fillStyle = this.state.color;
                    ctx.globalAlpha = alpha;

                    const t = thick * z;
                    const l = len * 4 * z; // Scale factor
                    const g = (gap * 2 + offsetError) * z;

                    // Top
                    ctx.fillRect(cx - t / 2, cy - g - l, t, l);
                    // Bottom
                    ctx.fillRect(cx - t / 2, cy + g, t, l);
                    // Left
                    ctx.fillRect(cx - g - l, cy - t / 2, l, t);
                    // Right
                    ctx.fillRect(cx + g, cy - t / 2, l, t);

                    // Outlines (Manual implementation for crispness)
                    if (document.getElementById('outline-on').checked) {
                        const ot = parseFloat(document.getElementById('outline-thick').value) * z;
                        const oa = parseFloat(document.getElementById('outline-alpha').value);

                        ctx.globalCompositeOperation = 'destination-over'; // Draw behing
                        ctx.fillStyle = `rgba(0,0,0,${oa})`;

                        // Top
                        ctx.fillRect(cx - t / 2 - ot, cy - g - l - ot, t + ot * 2, l + ot * 2);
                        // Bottom
                        ctx.fillRect(cx - t / 2 - ot, cy + g - ot, t + ot * 2, l + ot * 2);
                        // Left
                        ctx.fillRect(cx - g - l - ot, cy - t / 2 - ot, l + ot * 2, t + ot * 2);
                        // Right
                        ctx.fillRect(cx + g - ot, cy - t / 2 - ot, l + ot * 2, t + ot * 2);

                        ctx.globalCompositeOperation = 'source-over'; // Reset
                    }
                };

                // Helper to draw dot
                const drawDot = (thick, alpha) => {
                    ctx.fillStyle = this.state.color;
                    ctx.globalAlpha = alpha;

                    const s = thick * 2 * z;
                    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);

                    if (document.getElementById('outline-on').checked) {
                        const ot = parseFloat(document.getElementById('outline-thick').value) * z;
                        const oa = parseFloat(document.getElementById('outline-alpha').value);
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = `rgba(0,0,0,${oa})`;
                        ctx.fillRect(cx - s / 2 - ot, cy - s / 2 - ot, s + ot * 2, s + ot * 2);
                        ctx.globalCompositeOperation = 'source-over';
                    }
                };

                // Dynamic Error
                const totalError = (this.state.recoilVal + this.state.moveVal) * 2;

                // LAYER 1: OUTER LINES
                if (document.getElementById('outer-on').checked) {
                    drawCross(
                        parseFloat(document.getElementById('outer-len').value),
                        parseFloat(document.getElementById('outer-thick').value),
                        parseFloat(document.getElementById('outer-offset').value),
                        parseFloat(document.getElementById('outer-alpha').value),
                        totalError * 1.5 // Outer lines react more
                    );
                }

                // LAYER 2: INNER LINES
                if (document.getElementById('inner-on').checked) {
                    drawCross(
                        parseFloat(document.getElementById('inner-len').value),
                        parseFloat(document.getElementById('inner-thick').value),
                        parseFloat(document.getElementById('inner-offset').value),
                        parseFloat(document.getElementById('inner-alpha').value),
                        totalError
                    );
                }

                // LAYER 3: DOT
                if (document.getElementById('dot-on').checked) {
                    drawDot(
                        parseFloat(document.getElementById('dot-thick').value),
                        parseFloat(document.getElementById('dot-alpha').value)
                    );
                }
            },

            update() {
                // Update numeric displays
                ['inner-len', 'inner-thick', 'inner-offset', 'inner-alpha',
                    'outer-len', 'outer-thick', 'outer-offset', 'outer-alpha'].forEach(id => {
                        const el = document.getElementById(id);
                        const val = document.getElementById('val-' + id);
                        if (val) val.innerText = el.value;
                    });

                // Color
                document.getElementById('hex-display').innerText = this.state.color;
            },

            // --- CONTROLS ---
            switchTab(id) {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                // Find index to set active button? easier to just loop
                const btns = document.querySelectorAll('.tab-btn');
                if (id === 'general') btns[0].classList.add('active');
                if (id === 'inner') btns[1].classList.add('active');
                if (id === 'outer') btns[2].classList.add('active');

                document.getElementById('tab-' + id).classList.add('active');
            },

            setColor(hex) {
                this.state.color = hex;
                document.getElementById('customColor').value = hex;
                this.update();
            },

            setBg(type) {
                // In a real app we would use actual images. 
                // Here we simulate atmospheric gradients for "Premium" feel without heavy assets.
                const el = this.els.bg;
                el.className = 'preview-bg'; // reset
                el.style.backgroundImage = '';

                if (type === 'grid') {
                    el.classList.add('bg-grid');
                    el.style.backgroundColor = 'transparent';
                }
                else if (type === 'dust2') el.style.background = 'linear-gradient(to bottom, #d6c6a6, #b19e7a)';
                else if (type === 'icebox') el.style.background = 'linear-gradient(to bottom, #a3d9ff, #6b9ac2)';
                else if (type === 'ascent') el.style.background = 'linear-gradient(to bottom, #8bb4ca, #557a94)';
                else if (type === 'night') el.style.background = 'linear-gradient(to bottom, #050a14, #0f1a2e)';
            },

            zoom(delta) {
                this.state.zoom = Math.max(0.5, Math.min(this.state.zoom + delta, 4.0));
            },
            center() { this.state.zoom = 1.0; },

            simRecoil(active) { this.state.isRecoil = active; },
            toggleMove() { this.state.isMoving = !this.state.isMoving; },

            loadPreset(name) {
                const p = this.state.presets[name];
                if (!p) return;

                // Set Color
                this.setColor(p.color);

                // Helper to set inputs
                const setL = (prefix, data) => {
                    const exists = p.inner[0] > 0 || p.inner[1] > 0; // rough check
                    document.getElementById(prefix + '-on').checked = (data[0] > 0 || data[1] > 0);
                    document.getElementById(prefix + '-alpha').value = data[0];
                    if (data[1]) document.getElementById(prefix + '-len').value = data[1];
                    if (data[2]) document.getElementById(prefix + '-thick').value = data[2];
                    if (document.getElementById(prefix + '-offset')) document.getElementById(prefix + '-offset').value = data[3] || 0;
                };

                setL('inner', p.inner);
                setL('outer', p.outer);

                document.getElementById('dot-on').checked = (p.dot[0] > 0);
                document.getElementById('dot-alpha').value = p.dot[0] || 1;
                document.getElementById('dot-thick').value = p.dot[2] || 2;

                document.getElementById('outline-on').checked = (p.outline[0] > 0);
                document.getElementById('outline-alpha').value = p.outline[1] || 0.5;
                document.getElementById('outline-thick').value = p.outline[2] || 1;

                this.update();
            },

            exportConfig() {
                // Generate CS2 Command (Example)
                let c = `cl_crosshaircolor 5; cl_crosshaircolor_r ${parseInt(this.state.color.substr(1, 2), 16)}; cl_crosshaircolor_g ${parseInt(this.state.color.substr(3, 2), 16)}; cl_crosshaircolor_b ${parseInt(this.state.color.substr(5, 2), 16)};`;

                // Dot
                c += ` cl_crosshairdot ${document.getElementById('dot-on').checked ? 1 : 0};`;

                // Outlines
                c += ` cl_crosshair_drawoutline ${document.getElementById('outline-on').checked ? 1 : 0};`;
                c += ` cl_crosshair_outlinethickness ${document.getElementById('outline-thick').value};`;

                // Inner
                if (document.getElementById('inner-on').checked) {
                    c += ` cl_crosshairsize ${document.getElementById('inner-len').value};`;
                    c += ` cl_crosshairthickness ${document.getElementById('inner-thick').value};`;
                    c += ` cl_crosshairgap ${document.getElementById('inner-offset').value};`;
                    c += ` cl_crosshairalpha ${document.getElementById('inner-alpha').value * 255};`;
                }

                // Append simple disclaimer for Outer lines (Since standard CS commands usually just have 1 primary layer easy to map, complex profiles need autoexecs)
                c += ` // Generated by DGToolbox Labs`;

                document.getElementById('exportContent').value = c;
                document.getElementById('exportModal').classList.add('active');
            },

            copyExport() {
                document.getElementById('exportContent').select();
                document.execCommand('copy');
            }
        };

        // Boot
        window.addEventListener('load', () => app.init());