/**
 * PDF STUDIO ENGINE - ULTIMATE
 * Version: 10.1 (Control Deck Update)
 */

window.PDFLib = window.PDFLib;
const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;

if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

const Core = {
    readBuffer: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("Read Error");
        reader.readAsArrayBuffer(file);
    }),

    readDataURL: (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    }),

    hexToRGB: (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
    },

    notify: (msg, type = 'info') => {
        console.log(`[${type.toUpperCase()}] ${msg}`);
        const toast = document.createElement('div');
        toast.innerText = msg;
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: #fff; padding: 12px 24px; border-radius: 50px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999;
            font-family: 'Inter'; font-size: 0.9rem; font-weight: 500;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    download: (data, name, mime) => {
        download(data, name, mime);
    }
};

class StudioEngine {
    constructor() {
        this.mergePages = [];
        this.splitBuffer = null;
        this.watermarkFile = null;
        this.wmImage = null;
        this.initDragDrop();
    }

    initDragDrop() {
        const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                prevent(e);
                zone.style.borderColor = 'var(--primary)';
                zone.style.background = 'rgba(59, 130, 246, 0.1)';
            });
            zone.addEventListener('dragleave', (e) => {
                prevent(e);
                zone.style.borderColor = '';
                zone.style.background = '';
            });
            zone.addEventListener('drop', (e) => {
                prevent(e);
                zone.style.borderColor = '';
                zone.style.background = '';

                const id = zone.id;
                const files = e.dataTransfer.files;
                if (files.length) {
                    if (id === 'drop-merge') this.ingestMerge(files);
                    if (id === 'drop-split') this.loadSplit(files[0]);
                    if (id === 'drop-secure') {
                        document.getElementById('in-secure').files = files;
                        Core.notify("File Loaded for Security", "success");
                    }
                    if (id === 'drop-water') this.loadWatermarkTarget(files[0]);
                    if (id === 'drop-wm-image') this.loadWatermarkImage(files[0]);
                }
            });
        });

        document.getElementById('in-merge').onchange = (e) => this.ingestMerge(e.target.files);
        document.getElementById('in-split').onchange = (e) => this.loadSplit(e.target.files[0]);
        document.getElementById('in-water').onchange = (e) => this.loadWatermarkTarget(e.target.files[0]);
        document.getElementById('in-wm-image').onchange = (e) => this.loadWatermarkImage(e.target.files[0]);
    }

    // --- HELPER FOR UI ---
    setWmType(type) {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-type-${type}`).classList.add('active');

        // Update hidden val 
        // Or simply force radio click if we kept radios. Since I removed radios in HTML refactor, I must handle logic here:
        // Actually, let's just toggle visibility directly.
        if (type === 'text') {
            document.getElementById('opt-text').classList.remove('hidden');
            document.getElementById('opt-image').classList.add('hidden');
            // set logic flag if needed, but doWatermark checks visibility? 
            // Better to set a property on the class.
            this.wmMode = 'text';
        } else {
            document.getElementById('opt-text').classList.add('hidden');
            document.getElementById('opt-image').classList.remove('hidden');
            this.wmMode = 'image';
        }
    }

    async ingestMerge(files) {
        if (!files.length) return;
        Core.notify(`Processing ${files.length} files...`);

        const grid = document.getElementById('grid-merge');
        document.getElementById('drop-merge').style.display = 'none';

        for (const f of files) {
            if (f.type !== 'application/pdf') continue;
            try {
                const buffer = await Core.readBuffer(f);
                const doc = await PDFDocument.load(buffer);
                const pages = doc.getPageCount();

                const div = document.createElement('div');
                div.className = 'file-card';
                div.innerHTML = `
                    <div class="card-thumb"><i class="fas fa-spinner fa-spin"></i></div>
                    <div class="card-meta">${f.name}<br><span style="opacity:0.6">${pages} Pages</span></div>
                    <button class="card-del" onclick="this.parentElement.remove();"><i class="fas fa-times"></i></button>
                `;
                grid.appendChild(div);

                this.mergePages.push({ doc, buffer });
                this.renderThumb(buffer, div.querySelector('.card-thumb'));

            } catch (e) { console.error(e); }
        }
    }

    async doMerge() {
        if (!this.mergePages.length) return Core.notify("No files to merge!", "error");
        Core.notify("Merging PDF...", "info");

        try {
            const fused = await PDFDocument.create();
            for (const item of this.mergePages) {
                const copied = await fused.copyPages(item.doc, item.doc.getPageIndices());
                copied.forEach(p => fused.addPage(p));
            }

            const bytes = await fused.save();
            Core.download(bytes, `Studio-Merge-${Date.now()}.pdf`, 'application/pdf');
            Core.notify("Download Started!", "success");
        } catch (e) { Core.notify("Merge Failed", "error"); }
    }

    async loadSplit(file) {
        if (!file) return;
        this.splitBuffer = await Core.readBuffer(file);
        Core.notify("Analyzing PDF Structure...");

        const grid = document.getElementById('grid-split');
        grid.innerHTML = '';
        document.getElementById('drop-split').style.display = 'none';

        const pdf = await pdfjsLib.getDocument(this.splitBuffer).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const div = document.createElement('div');
            div.className = 'file-card';
            div.style.cursor = 'pointer';
            div.onclick = () => {
                div.classList.toggle('selected-page');
            };

            div.innerHTML = `
                <div class="card-thumb"><canvas id="split-cvs-${i}"></canvas></div>
                <div class="card-meta">Page ${i}</div>
                <div class="sel-check" style="position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%; border:2px solid #fff;"></div>
            `;
            grid.appendChild(div);

            pdf.getPage(i).then(page => {
                const cvs = document.getElementById(`split-cvs-${i}`);
                const vp = page.getViewport({ scale: 0.5 });
                cvs.width = vp.width;
                cvs.height = vp.height;
                page.render({ canvasContext: cvs.getContext('2d'), viewport: vp });
            });
        }
    }

    async doSplit() {
        if (!this.splitBuffer) return;
        const selectedals = [];
        document.querySelectorAll('#grid-split .file-card').forEach((el, idx) => {
            if (el.classList.contains('selected-page')) {
                selectedals.push(idx);
            }
        });

        if (!selectedals.length) return Core.notify("Select pages to extract!", "error");

        const srcDoc = await PDFDocument.load(this.splitBuffer);
        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, selectedals);
        pages.forEach(p => newDoc.addPage(p));

        const bytes = await newDoc.save();
        Core.download(bytes, `Studio-Split-${Date.now()}.pdf`, 'application/pdf');
        Core.notify("Pages Extracted!", "success");
    }

    selectAllSplit() {
        document.querySelectorAll('#grid-split .file-card').forEach(el => {
            el.classList.add('selected-page');
        });
    }

    async doEncrypt() {
        const fileInput = document.getElementById('in-secure');
        const pass = document.getElementById('pass-encrypt').value;
        if (!fileInput.files[0] || !pass) return Core.notify("Missing File or Password", "error");

        const buffer = await Core.readBuffer(fileInput.files[0]);
        const doc = await PDFDocument.load(buffer);

        doc.encrypt({ userPassword: pass, ownerPassword: pass });
        const bytes = await doc.save();
        Core.download(bytes, `Encrypted-${Date.now()}.pdf`, 'application/pdf');
        Core.notify("Encryption Complete", "success");
    }

    async doDecrypt() {
        const fileInput = document.getElementById('in-secure');
        const pass = document.getElementById('pass-decrypt').value;
        if (!fileInput.files[0] || !pass) return Core.notify("Missing File or Password", "error");

        try {
            const buffer = await Core.readBuffer(fileInput.files[0]);
            const doc = await PDFDocument.load(buffer, { password: pass });
            const bytes = await doc.save();
            Core.download(bytes, `Decrypted-${Date.now()}.pdf`, 'application/pdf');
            Core.notify("File Unlocked", "success");
        } catch (e) {
            Core.notify("Incorrect Password or Fail", "error");
        }
    }

    async loadWatermarkTarget(file) {
        if (!file) return;
        this.watermarkFile = await Core.readBuffer(file);

        const preview = document.getElementById('wm-preview');
        const pdf = await pdfjsLib.getDocument(this.watermarkFile).promise;
        const page = await pdf.getPage(1);
        const vp = page.getViewport({ scale: 0.6 });
        preview.width = vp.width;
        preview.height = vp.height;
        await page.render({ canvasContext: preview.getContext('2d'), viewport: vp }).promise;

        document.getElementById('drop-water').style.display = 'none';
        document.getElementById('wm-controls').classList.remove('hidden');
        Core.notify("PDF Loaded. Configure Watermark.", "success");
    }

    async loadWatermarkImage(file) {
        if (!file) return;
        this.wmImage = await Core.readBuffer(file);
        this.wmImageType = file.type;

        // Visual feedback
        const zone = document.getElementById('drop-wm-image');
        zone.style.border = '2px solid var(--success)';
        zone.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success); font-size:2rem;"></i><span style="font-size:0.8rem; margin-top:10px;">Logo Loaded</span>`;

        Core.notify("Logo Loaded.", "success");
    }

    async doWatermark() {
        if (!this.watermarkFile) return Core.notify("Load PDF first!", "error");

        // UI Logic has changed to direct class checks in setWmType
        const mode = this.wmMode || 'text'; // default

        const text = document.getElementById('wm-text').value;
        const colorHex = document.getElementById('wm-color').value;
        const opacity = parseFloat(document.getElementById('wm-opacity').value);
        const size = parseInt(document.getElementById('wm-size').value);
        const rotation = parseInt(document.getElementById('wm-rotate').value);
        const position = document.getElementById('wm-position').value;

        try {
            const doc = await PDFDocument.load(this.watermarkFile);
            const font = await doc.embedFont(StandardFonts.HelveticaBold);
            const { r, g, b } = Core.hexToRGB(colorHex);
            const pages = doc.getPages();

            let embeddedImage;
            if (mode === 'image' && this.wmImage) {
                if (this.wmImageType.includes('png')) embeddedImage = await doc.embedPng(this.wmImage);
                else embeddedImage = await doc.embedJpg(this.wmImage);
            }

            for (const page of pages) {
                const { width, height } = page.getSize();
                let x, y, elWidth, elHeight;

                if (mode === 'image' && embeddedImage) {
                    const scale = size / 100;
                    elWidth = embeddedImage.width * scale;
                    elHeight = embeddedImage.height * scale;
                } else {
                    elWidth = font.widthOfTextAtSize(text, size);
                    elHeight = size;
                }

                const margin = 50;
                switch (position) {
                    case 'center': x = width / 2 - elWidth / 2; y = height / 2 - elHeight / 2; break;
                    case 'top-left': x = margin; y = height - margin - elHeight; break;
                    case 'top-center': x = width / 2 - elWidth / 2; y = height - margin - elHeight; break;
                    case 'top-right': x = width - margin - elWidth; y = height - margin - elHeight; break;
                    case 'bottom-left': x = margin; y = margin; break;
                    case 'bottom-center': x = width / 2 - elWidth / 2; y = margin; break;
                    case 'bottom-right': x = width - margin - elWidth; y = margin; break;
                    default: x = width / 2; y = height / 2;
                }

                if (mode === 'image' && embeddedImage) {
                    page.drawImage(embeddedImage, {
                        x, y,
                        width: elWidth, height: elHeight,
                        opacity: opacity,
                        rotate: degrees(rotation)
                    });
                } else {
                    page.drawText(text, {
                        x, y,
                        size,
                        font,
                        color: rgb(r, g, b),
                        opacity: opacity,
                        rotate: degrees(rotation)
                    });
                }
            }

            const bytes = await doc.save();
            Core.download(bytes, `Watermarked-${Date.now()}.pdf`, 'application/pdf');
            Core.notify("Watermark Applied Successfully!", "success");

        } catch (e) {
            console.error(e);
            Core.notify("Watermark Error. Check Console.", "error");
        }
    }

    async renderThumb(buffer, container) {
        if (!window.pdfjsLib) return;
        const doc = await pdfjsLib.getDocument(buffer).promise;
        const page = await doc.getPage(1);
        const cvs = document.createElement('canvas');
        const vp = page.getViewport({ scale: 0.5 });
        cvs.width = vp.width;
        cvs.height = vp.height;
        await page.render({ canvasContext: cvs.getContext('2d'), viewport: vp }).promise;
        container.innerHTML = '';
        container.appendChild(cvs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .selected-page { border-color: var(--primary) !important; box-shadow: 0 0 15px var(--primary-glow); }
        .selected-page .sel-check { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);
});
