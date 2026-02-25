/**
 * QUANTUM IMAGE CORE ENGINE
 * Powered by browser-image-compression
 */

class QuantumCore {
    constructor() {
        this.file = null;
        this.blob = null; // Compressed result
        this.config = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.8
        };

        // DOM
        this.dropZone = document.getElementById('drop-zone');
        this.slider = document.getElementById('slider');
        this.beforeContainer = document.getElementById('img-before');
        this.stage = document.getElementById('compare-stage');
        this.resBar = document.getElementById('res-bar');

        // Init Inputs
        this.initDrag();
        this.initSlider();
    }

    /* --- INPUT HANDLING --- */
    initDrag() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files);
        });

        document.getElementById('file-in').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        if (files.length > 0) {
            this.file = files[0];
            this.dropZone.style.display = 'none'; // Hide drop zone
            this.stage.style.display = 'block'; // Show stage
            this.resBar.classList.add('active'); // Show results

            // Set Original Preview
            const url = URL.createObjectURL(this.file);
            this.setPreview('before', url);

            // Initial Process
            this.process();
        }
    }

    /* --- PROCESSING --- */
    async process() {
        if (!this.file) return;

        this.showToast('PROCESSING...', '#fff');

        try {
            // Apply Config
            const options = {
                maxSizeMB: 20, // We rely on quality mainly for 'artistic' compression, size limit creates resizing.
                maxWidthOrHeight: this.config.maxWidthOrHeight,
                useWebWorker: true,
                fileType: this.config.fileType,
                initialQuality: this.config.initialQuality
            };

            this.blob = await imageCompression(this.file, options);

            // Success
            const url = URL.createObjectURL(this.blob);
            this.setPreview('after', url);
            this.updateStats();
            this.showToast('OPTIMIZED', '#00ff9d');

        } catch (error) {
            console.error(error);
            this.showToast('ERROR', '#ff5555');
        }
    }

    /* --- UI UPDATES --- */
    setPreview(type, url) {
        if (type === 'before') {
            document.getElementById('img-before-inner').style.backgroundImage = `url(${url})`;
            // Show file size
            document.getElementById('val-orig').innerText = this.formatBytes(this.file.size);
        } else {
            document.getElementById('img-after').style.backgroundImage = `url(${url})`;
        }
    }

    updateStats() {
        if (!this.file || !this.blob) return;

        const orig = this.file.size;
        const comp = this.blob.size;
        const save = ((orig - comp) / orig * 100).toFixed(1);

        document.getElementById('val-opt').innerText = this.formatBytes(comp);
        document.getElementById('val-save').innerText = save + '%';

        // Color code savings
        const el = document.getElementById('val-save');
        if (save > 0) el.style.color = '#00ff9d';
        else el.style.color = '#ff5555';
    }

    setFmt(fmt) {
        document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');

        // Map to mime
        if (fmt === 'webp') this.config.fileType = 'image/webp';
        if (fmt === 'jpeg') this.config.fileType = 'image/jpeg';
        if (fmt === 'png') this.config.fileType = 'image/png';

        if (this.file) this.process();
    }

    updateQ(val) {
        this.config.initialQuality = parseFloat(val);
        document.getElementById('q-val').innerText = val;
    }

    updateW(val) {
        this.config.maxWidthOrHeight = parseInt(val);
        document.getElementById('w-val').innerText = val + 'px';
    }

    download() {
        if (!this.blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(this.blob);

        // Extension
        let ext = 'jpg';
        if (this.config.fileType === 'image/webp') ext = 'webp';
        if (this.config.fileType === 'image/png') ext = 'png';

        link.download = `quantum_opt.${ext}`;
        link.click();
    }

    /* --- SLIDER LOGIC --- */
    initSlider() {
        let active = false;

        const move = (e) => {
            if (!active) return;
            const rect = this.stage.getBoundingClientRect();
            let x = e.clientX - rect.left;
            // Clamp
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;

            // Move Handle
            this.slider.style.left = x + 'px';
            // Resize Before Container
            this.beforeContainer.style.width = x + 'px';
        };

        this.slider.addEventListener('mousedown', () => active = true);
        window.addEventListener('mouseup', () => active = false);
        window.addEventListener('mousemove', move);
    }

    /* --- UTILS --- */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(msg, color) {
        const t = document.getElementById('toast');
        t.innerHTML = msg;
        t.style.background = color;
        t.style.color = color === '#00ff9d' ? '#000' : '#fff';
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
    }
}

const eng = new QuantumCore();
