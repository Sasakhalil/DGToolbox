class ZenithEngine {
    constructor() {
        this.fileIn = document.getElementById('file-in');
        this.dropZone = document.getElementById('drop-zone');
        this.imgPreview = document.getElementById('img-preview');
        this.heroMsg = document.getElementById('hero-msg');
        this.viewNav = document.getElementById('view-nav');
        this.navMap = document.getElementById('nav-map');

        // Layers
        this.layers = {
            image: document.getElementById('layer-image'),
            data: document.getElementById('layer-data'),
            hex: document.getElementById('layer-hex'),
            json: document.getElementById('layer-json'),
            map: document.getElementById('layer-map'),
            info: document.getElementById('layer-info')
        };

        this.dataTable = document.getElementById('data-table');
        this.jsonViewer = document.getElementById('json-viewer');
        this.mapFrame = document.getElementById('map-frame');

        this.currentFile = null;
        this.metaData = null;

        this.init();
    }

    init() {
        // Drag Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
            document.body.addEventListener(e, (evt) => { evt.preventDefault(); evt.stopPropagation(); });
        });

        document.body.addEventListener('drop', (e) => this.load(e.dataTransfer.files[0]));
        this.fileIn.addEventListener('change', (e) => this.load(e.target.files[0]));

        // Hover FX
        this.dropZone.addEventListener('dragenter', () => this.dropZone.classList.add('drop-active'));
        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('drop-active'));

        // EXIT SLIDER LOGIC
        const track = document.getElementById('exit-track');
        const handle = document.getElementById('exit-handle');
        if (!track || !handle) return;

        let isDragging = false;
        let startX = 0;

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            handle.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let offset = e.clientX - startX;
            if (offset < 0) offset = 0;
            if (offset > 110) offset = 110;
            handle.style.transform = `translateX(${offset}px)`;

            if (offset >= 105) {
                isDragging = false;
                track.classList.add('active');
                setTimeout(() => window.location.href = 'index.html', 300);
            }
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            handle.style.transition = 'transform 0.3s';
            handle.style.transform = 'translateX(0)';
        });
    }

    load(file) {
        if (!file || !file.type.match('image.*')) {
            alert('SYSTEM ERROR: INVALID FILE TYPE. IMAGE REQUIRED.');
            return;
        }
        this.currentFile = file;
        this.dropZone.classList.remove('drop-active');

        // UI Transition
        this.heroMsg.style.display = 'none';
        this.viewNav.style.display = 'flex';
        this.dataTable.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#6366f1; padding:40px;">SCANNING ...</td></tr>';

        // 1. Basic Stats
        document.getElementById('val-size').innerText = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        document.getElementById('val-type').innerText = file.type.split('/')[1].toUpperCase();

        // 2. Preview & Res
        const url = URL.createObjectURL(file);
        this.imgPreview.src = url;
        this.imgPreview.style.display = 'block';

        const i = new Image();
        i.src = url;
        i.onload = () => {
            document.getElementById('val-res').innerText = `${i.naturalWidth} x ${i.naturalHeight}`;
        };

        // 3. HEX STREAM
        this.renderHex(file);

        // 4. EXIF Logic
        EXIF.getData(file, () => {
            const tags = EXIF.getAllTags(file);
            /* Always merge file info to ensure JSON isn't empty */
            const safeData = {
                FILE_INTEGRITY: {
                    Name: file.name,
                    Size: file.size,
                    Type: file.type,
                    LastModified: file.lastModified
                },
                EXIF_DATA: this.cleanMetaData(tags)
            };

            this.metaData = safeData;

            // GPS Check
            if (tags.GPSLatitude && tags.GPSLongitude) {
                document.getElementById('val-gps').innerText = 'DETECTED';
                document.getElementById('val-gps').style.color = '#6366f1';
                this.navMap.style.display = 'block';

                const lat = this.dmsToDD(tags.GPSLatitude, tags.GPSLatitudeRef);
                const lng = this.dmsToDD(tags.GPSLongitude, tags.GPSLongitudeRef);
                this.mapFrame.src = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=15&ie=UTF8&iwloc=&output=embed`;
            } else {
                document.getElementById('val-gps').innerText = 'NO SIGNAL';
                document.getElementById('val-gps').style.color = '#444';
                this.navMap.style.display = 'none';
            }

            this.renderData(safeData.EXIF_DATA);
            this.renderJSON(safeData);
        });

        this.setLayer('image');
    }

    /* --- DATA PROCESSING --- */
    renderHex(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target.result;
            const bytes = new Uint8Array(buffer);
            let hex = '';
            // Read first 1024 bytes for preview
            for (let j = 0; j < Math.min(bytes.length, 1024); j++) {
                hex += bytes[j].toString(16).padStart(2, '0').toUpperCase() + ' ';
                if ((j + 1) % 16 === 0) hex += '\n';
            }
            if (bytes.length > 1024) hex += '\n... [STREAM TRUNCATED]';
            const hexEl = document.getElementById('hex-viewer');
            if (hexEl) hexEl.innerText = hex;
        };
        reader.readAsArrayBuffer(file.slice(0, 2048));
    }

    cleanMetaData(tags) {
        const clean = {};
        if (!tags) return clean;

        for (const [key, val] of Object.entries(tags)) {
            if (key === 'thumbnail') continue;
            const formatted = this.formatVal(val);
            if (formatted !== undefined) {
                clean[key] = formatted;
            }
        }
        return clean;
    }

    formatVal(v) {
        if (v instanceof Number) return v.valueOf();
        if (v instanceof String) return v.toString().replace(/\0/g, '').trim();
        if (v && typeof v === 'object' && 'numerator' in v) return parseFloat((v.numerator / v.denominator).toFixed(4));
        if (Array.isArray(v)) {
            if (v.length > 10 && typeof v[0] === 'number') return `[Binary Array(${v.length})]`;
            return v.map(i => this.formatVal(i));
        }
        if (typeof v === 'string') return v.replace(/\0/g, '').trim();
        return v;
    }

    renderData(data) {
        this.dataTable.innerHTML = '';
        if (Object.keys(data).length === 0) {
            this.dataTable.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:40px; color:#666;">NO EMBEDDED METADATA FOUND</td></tr>';
            return;
        }

        const keys = Object.keys(data).sort();
        keys.forEach(k => {
            const v = data[k];
            const row = document.createElement('tr');

            let displayVal = v;
            if (typeof v === 'object') displayVal = JSON.stringify(v);
            if (String(displayVal).length > 80) displayVal = String(displayVal).substring(0, 80) + '...';

            row.innerHTML = `<td>${k}</td><td style="color:#fff">${displayVal}</td>`;
            this.dataTable.appendChild(row);
        });
    }

    renderJSON(data) {
        document.getElementById('json-viewer').innerText = JSON.stringify(data, null, 4);
    }

    /* --- ACTIONS --- */
    setLayer(id) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const links = document.querySelectorAll('.nav-link');

        if (id === 'image') links[0]?.classList.add('active');
        if (id === 'data') links[1]?.classList.add('active');
        if (id === 'hex') links[2]?.classList.add('active'); // Added Hex nav
        if (id === 'json') links[3]?.classList.add('active');
        if (id === 'map') links[4]?.classList.add('active');
        if (id === 'info') links[5]?.classList.add('active');

        Object.values(this.layers).forEach(el => { if (el) el.classList.remove('active') });
        if (this.layers[id]) this.layers[id].classList.add('active');
    }

    dmsToDD(dms, ref) {
        if (!dms || dms.length < 3) return 0;
        let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
        if (ref === "S" || ref === "W") dd = dd * -1;
        return dd;
    }

    downloadJSON() {
        if (!this.metaData) return;
        const blob = new Blob([JSON.stringify(this.metaData, null, 4)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `EVIDENCE_${Date.now()}.json`;
        a.click();
        this.showToast('JSON REPORT EXPORTED');
    }

    cleanAndDownload() {
        if (!this.currentFile) return;

        const btn = document.querySelector('.btn i.fa-shield-alt').parentElement;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>PROCESSING...</span> <i class="fas fa-circle-notch fa-spin"></i>';

        setTimeout(() => {
            const img = new Image();
            img.src = URL.createObjectURL(this.currentFile);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(blob => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `CLEAN_${this.currentFile.name}`;
                    a.click();

                    btn.innerHTML = originalText;
                    this.showToast('FILE SANITIZED & DOWNLOADED');
                }, 'image/jpeg', 0.95);
            };
        }, 500);
    }

    showToast(msg) {
        const t = document.createElement('div');
        t.style.position = 'fixed';
        t.style.bottom = '30px';
        t.style.left = '50%';
        t.style.transform = 'translateX(-50%)';
        t.style.background = '#fff';
        t.style.color = '#000';
        t.style.padding = '12px 24px';
        t.style.borderRadius = '30px';
        t.style.fontWeight = '700';
        t.style.zIndex = '1000';
        t.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }

    reset() {
        // Simple reload to clear all states cleanly
        window.location.reload();
    }
}

const eng = new ZenithEngine();
