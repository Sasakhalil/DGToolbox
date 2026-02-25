/**
 * PDF STUDIO PRO - ROBUST EDITION
 * Debugged and secured against CDN failures.
 */

// Global Safeties
const PDFLib = window.PDFLib || null;
const pdfjsLib = window.pdfjsLib || null;
const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;

// Ensure Workers
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

const Utils = {
    // Robust file reader
    readFileArrayBuffer: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("File read failed"));
            reader.readAsArrayBuffer(file);
        });
    },

    readFileDataURL: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("File read failed"));
            reader.readAsDataURL(file);
        });
    },

    toast: (msg, type = 'info') => {
        // Fallback toast system if global one missing
        const container = document.getElementById('toast-container') || createToastContainer();
        const el = document.createElement('div');
        el.style.background = type === 'error' ? '#e74c3c' : (type === 'success' ? '#2ecc71' : '#3498db');
        el.style.color = 'white';
        el.style.padding = '12px 20px';
        el.style.borderRadius = '8px';
        el.style.marginBottom = '10px';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        el.style.fontFamily = 'Inter, sans-serif';
        el.style.fontSize = '0.9rem';
        el.innerText = msg;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    },

    showLoader: (msg) => {
        const l = document.getElementById('studio-loader');
        if (l) {
            l.style.display = 'flex';
            l.querySelector('h2').innerText = msg || "Processing...";
        }
    },

    hideLoader: () => {
        const l = document.getElementById('studio-loader');
        if (l) l.style.display = 'none';
    }
};

function createToastContainer() {
    const d = document.createElement('div');
    d.id = 'toast-container';
    d.style.position = 'fixed';
    d.style.bottom = '20px';
    d.style.right = '20px';
    d.style.zIndex = '11000';
    document.body.appendChild(d);
    return d;
}

// --- APP ---
class StudioAppPro {
    constructor() {
        this.checkDeps();
        this.initMerge();
        this.initSplit();
        this.initImg();
        this.initOCR();
        this.initNav();

        // Hide loader initially
        Utils.hideLoader();
    }

    checkDeps() {
        if (!PDFLib) Utils.toast("Critical: PDF-Lib not loaded. Check internet.", "error");
        if (!jsPDF) Utils.toast("Critical: jsPDF not loaded.", "error");
        if (!pdfjsLib) Utils.toast("Critical: PDF.js Viewer not loaded.", "error");
    }

    initNav() {
        window.navTo = (id) => {
            document.querySelectorAll('.workspace-view').forEach(e => e.classList.remove('active'));
            document.getElementById('view-' + id).classList.add('active');

            document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[data-target="${id}"]`);
            if (btn) btn.classList.add('active');
        };
    }

    // --- MERGE ---
    initMerge() {
        const input = document.getElementById('input-merge');
        const drop = document.getElementById('drop-merge');
        const list = document.getElementById('grid-merge');

        this.mergePages = [];

        const handle = async (files) => {
            if (!files || files.length === 0) return;
            Utils.showLoader("Analyzing PDFs...");

            // Force display update immediately
            const emptyEl = document.getElementById('empty-merge');
            const contentEl = document.getElementById('content-merge');
            if (emptyEl) emptyEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'flex';

            for (const f of files) {
                // Relaxed check: Accept if PDF mime OR ends with .pdf
                const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
                if (!isPdf) {
                    Utils.toast(`Skipping ${f.name} (Not a PDF)`, 'warning');
                    continue;
                }

                try {
                    const buf = await Utils.readFileArrayBuffer(f);

                    // Try to generate thumbnails
                    let pdfDocView = null;
                    if (pdfjsLib) {
                        try {
                            pdfDocView = await pdfjsLib.getDocument(buf).promise;
                        } catch (e) { console.warn("Thumbnails failed", e); }
                    }

                    // For actual merging logic (using PDFLib later), we store buffer
                    const pageCount = pdfDocView ? pdfDocView.numPages : 1; // Fallback

                    for (let i = 0; i < pageCount; i++) {
                        const div = document.createElement('div');
                        div.className = 'page-thumb';
                        div.dataset.id = Math.random().toString(36);

                        // Storage ref
                        this.mergePages.push({
                            div: div,
                            buffer: buf,
                            pageIndex: i,
                            rotation: 0
                        });

                        // Render Visual
                        const canvas = document.createElement('canvas');
                        // Set explicit size to avoid zero-size canvas in flexbox
                        canvas.width = 150;
                        canvas.height = 200;
                        div.appendChild(canvas);

                        // Info overlay
                        div.innerHTML += `
                            <div class="thumb-overlay">
                                <span onclick="window.app.removePage(this)">🗑️</span>
                                <span onclick="window.app.rotatePage(this)">🔄</span>
                            </div>
                            <div class="page-num">${i + 1}</div>
                        `;

                        list.appendChild(div);

                        // Async Render
                        if (pdfDocView) this.renderThumb(pdfDocView, i, div.querySelector('canvas'));
                        else {
                            // Fallback Visual
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#2c3e50';
                            ctx.fillRect(0, 0, 150, 200);
                            ctx.fillStyle = '#ecf0f1';
                            ctx.font = '16px sans-serif';
                            ctx.fillText('PDF Page', 40, 100);
                        }
                    }

                } catch (e) {
                    Utils.toast(`Error reading ${f.name}`, 'error');
                    console.error(e);
                }
            }
            Utils.hideLoader();
            this.initSortable(list);
        };

        if (input) input.addEventListener('change', e => handle(e.target.files));
        if (drop) {
            drop.onclick = () => input.click();
            drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--studio-accent)'; });
            drop.addEventListener('drop', e => {
                e.preventDefault();
                drop.style.borderColor = 'rgba(255,255,255,0.1)';
                handle(e.dataTransfer.files);
            });
        }
    }

    async renderThumb(pdfDoc, index, canvas) {
        try {
            const page = await pdfDoc.getPage(index + 1);
            const vp = page.getViewport({ scale: 0.3 });
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch (e) {
            // Draw placeholder if render fails
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.fillText("PDF Icon", 10, 50);
        }
    }

    rotatePage(span) {
        const div = span.closest('.page-thumb');
        const item = this.mergePages.find(p => p.div === div);
        if (item) {
            item.rotation = (item.rotation + 90) % 360;
            div.style.transform = `rotate(${item.rotation}deg)`;
        }
    }

    removePage(span) {
        const div = span.closest('.page-thumb');
        const idx = this.mergePages.findIndex(p => p.div === div);
        if (idx > -1) {
            this.mergePages.splice(idx, 1);
            div.remove();
        }
    }

    initSortable(el) {
        new Sortable(el, { animation: 150 });
    }

    async runMerge() {
        if (!this.mergePages.length) return Utils.toast("No pages!", "warning");
        Utils.showLoader("Merging...");

        try {
            // Re-read DOM order
            const domList = document.querySelectorAll('#grid-merge .page-thumb');
            const orderedPages = [];
            domList.forEach(div => {
                const p = this.mergePages.find(x => x.div === div);
                if (p) orderedPages.push(p);
            });

            const merged = await PDFLib.PDFDocument.create();

            // Optimization: Cache loaded docs
            const cache = new Map();

            for (const p of orderedPages) {
                let src = cache.get(p.buffer);
                if (!src) {
                    src = await PDFLib.PDFDocument.load(p.buffer);
                    cache.set(p.buffer, src);
                }
                const [cp] = await merged.copyPages(src, [p.pageIndex]);
                if (p.rotation) cp.setRotation(PDFLib.degrees(cp.getRotation().angle + p.rotation));
                merged.addPage(cp);
            }

            const bytes = await merged.save();
            download(bytes, 'merged_pro.pdf', 'application/pdf');
            Utils.toast("Success!", "success");

        } catch (e) {
            Utils.toast("Merge Failed: " + e.message, "error");
        }
        Utils.hideLoader();
    }


    // --- SPLIT ---
    initSplit() {
        const input = document.getElementById('input-split');
        const drop = document.getElementById('drop-split');
        let currentSplitPdf = null;
        let currentSplitBuffer = null;

        const handle = async (f) => {
            if (!f || f.type !== 'application/pdf') return;
            Utils.showLoader("Parsing PDF...");

            try {
                currentSplitBuffer = await Utils.readFileArrayBuffer(f);
                const grid = document.getElementById('grid-split');
                grid.innerHTML = '';
                document.getElementById('empty-split').style.display = 'none';
                document.getElementById('content-split').style.display = 'block';

                if (pdfjsLib) {
                    currentSplitPdf = await pdfjsLib.getDocument(currentSplitBuffer).promise;
                    for (let i = 0; i < currentSplitPdf.numPages; i++) {
                        const div = document.createElement('div');
                        div.className = 'page-thumb selectable';
                        div.dataset.idx = i;
                        div.onclick = () => div.classList.toggle('selected');

                        const cvs = document.createElement('canvas');
                        div.appendChild(cvs);
                        div.innerHTML += `<div class="page-num">${i + 1}</div>`;
                        grid.appendChild(div);

                        this.renderThumb(currentSplitPdf, i, div.querySelector('canvas'));
                    }
                } else {
                    // Primitive fallback if viewer missing
                    Utils.toast("Viewer not ready, using simple mode", "warning");
                }

            } catch (e) { Utils.toast("Error: " + e.message, "error"); }
            Utils.hideLoader();
        };

        if (input) input.addEventListener('change', e => handle(e.target.files[0]));
        if (drop) drop.onclick = () => input.click();

        window.runSplit = async () => {
            if (!currentSplitBuffer) return;
            const mode = document.getElementById('split-mode').value;
            Utils.showLoader("Splitting...");

            try {
                const srcDoc = await PDFLib.PDFDocument.load(currentSplitBuffer);
                const grid = document.getElementById('grid-split');

                if (mode === 'extract') {
                    // Extract Selected
                    const selected = Array.from(grid.querySelectorAll('.page-thumb.selected')).map(e => parseInt(e.dataset.idx));
                    if (!selected.length) throw new Error("Select pages first!");

                    const newDoc = await PDFLib.PDFDocument.create();
                    const cp = await newDoc.copyPages(srcDoc, selected);
                    cp.forEach(p => newDoc.addPage(p));
                    download(await newDoc.save(), 'extracted.pdf', 'application/pdf');

                } else if (mode === 'explode') {
                    // Zip all
                    const zip = new JSZip();
                    for (let i = 0; i < srcDoc.getPageCount(); i++) {
                        const d = await PDFLib.PDFDocument.create();
                        const [p] = await d.copyPages(srcDoc, [i]);
                        d.addPage(p);
                        zip.file(`page_${i + 1}.pdf`, await d.save());
                    }
                    download(await zip.generateAsync({ type: "blob" }), 'all_pages.zip', 'application/zip');
                }
                Utils.toast("Done!", "success");
            } catch (e) { Utils.toast(e.message, "error"); }
            Utils.hideLoader();
        };
    }

    // --- IMG 2 PDF ---
    initImg() {
        const input = document.getElementById('input-img');
        const drop = document.getElementById('drop-img');
        const grid = document.getElementById('grid-img');
        this.imgFiles = [];

        const handle = async (files) => {
            if (!files.length) return;
            document.getElementById('empty-img').style.display = 'none';
            document.getElementById('content-img').style.display = 'block';

            for (const f of files) {
                if (!f.type.startsWith('image/')) continue;
                this.imgFiles.push(f);
                const url = await Utils.readFileDataURL(f);

                const div = document.createElement('div');
                div.className = 'page-thumb';
                div.style.backgroundImage = `url(${url})`;
                div.style.backgroundSize = 'cover';
                div.innerHTML = `<div class="thumb-overlay"><span onclick="this.closest('.page-thumb').remove()">✖</span></div>`;
                grid.appendChild(div);
            }
            new Sortable(grid, { animation: 150 });
        };

        if (input) input.addEventListener('change', e => handle(e.target.files));
        if (drop) drop.onclick = () => input.click();

        window.runImg2Pdf = async () => {
            if (!this.imgFiles.length) return Utils.toast("No images!", "warning");
            Utils.showLoader("Converting...");

            try {
                // Determine order from DOM
                // (Simplified: using array for now, pro version would match DOM)
                const doc = new jsPDF({ unit: 'mm' });
                const w = doc.internal.pageSize.getWidth();
                const h = doc.internal.pageSize.getHeight();

                for (let i = 0; i < this.imgFiles.length; i++) {
                    if (i > 0) doc.addPage();
                    const d = await Utils.readFileDataURL(this.imgFiles[i]);
                    // Simply fit to page
                    doc.addImage(d, 'JPEG', 0, 0, w, h);
                }
                doc.save('images.pdf');
                Utils.toast("Converted!", "success");
            } catch (e) { console.error(e); Utils.toast("Error", "error"); }
            Utils.hideLoader();
        };
    }

    // --- OCR ---
    initOCR() {
        const input = document.getElementById('input-ocr');
        const drop = document.getElementById('drop-ocr');
        const pre = document.getElementById('ocr-preview');
        let ocrImage = null;

        const handle = async (f) => {
            if (!f || f.type !== 'application/pdf') return;
            Utils.showLoader("Loading PDF Preview...");

            try {
                const buf = await Utils.readFileArrayBuffer(f);
                if (pdfjsLib) {
                    const doc = await pdfjsLib.getDocument(buf).promise;
                    const page = await doc.getPage(1);
                    const vp = page.getViewport({ scale: 1.5 });
                    pre.width = vp.width;
                    pre.height = vp.height;
                    await page.render({ canvasContext: pre.getContext('2d'), viewport: vp }).promise;
                    ocrImage = pre;

                    document.getElementById('empty-ocr').style.display = 'none';
                    document.getElementById('content-ocr').style.display = 'flex';
                }
            } catch (e) { Utils.toast("Preview error", "error"); }
            Utils.hideLoader();
        };

        if (input) input.addEventListener('change', e => handle(e.target.files[0]));
        if (drop) drop.onclick = () => input.click();

        window.runOCR = async () => {
            if (!ocrImage) return;
            Utils.toast("Starting Tesseract... This takes time.", "info");
            Utils.showLoader("OCR Scanning...");
            try {
                const worker = Tesseract.createWorker({ logger: m => console.log(m) });
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(ocrImage);
                document.getElementById('ocr-result').value = text;
                await worker.terminate();
                Utils.toast("Done!", "success");
            } catch (e) { Utils.toast("OCR Failed: " + e.message, "error"); }
            Utils.hideLoader();
        };
    }
}

// Start
window.app = new StudioAppPro();
window.app.rotatePage = window.app.rotatePage.bind(window.app);
window.app.removePage = window.app.removePage.bind(window.app);
