/**
 * PDF Studio Logic
 * Handles Merge, Split, Image-to-PDF, and PDF-to-Text
 */

const { PDFDocument } = PDFLib;
const { jsPDF } = window.jspdf;

// State
let state = {
    merge: [],
    split: null,
    img2pdf: [],
    pdf2text: null
};

document.addEventListener('DOMContentLoaded', () => {
    initListeners();
    initSortable();
});

function initListeners() {
    // Inputs
    document.getElementById('input-merge').addEventListener('change', (e) => handleFiles('merge', e.files));
    document.getElementById('input-split').addEventListener('change', (e) => handleFiles('split', e.files));
    document.getElementById('input-img2pdf').addEventListener('change', (e) => handleFiles('img2pdf', e.files));
    document.getElementById('input-pdf2text').addEventListener('change', (e) => handleFiles('pdf2text', e.files));

    // Drag & Drop
    const zones = document.querySelectorAll('.drop-zone');
    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const mode = zone.getAttribute('onclick')?.match(/'(.*?)'/)[1]; // safe hack to get mode
            if (mode && e.dataTransfer.files.length > 0) handleFiles(mode, e.dataTransfer.files);
        });
    });
}

function initSortable() {
    new Sortable(document.getElementById('list-merge'), { animation: 150, onEnd: updateMergeOrder });
    new Sortable(document.getElementById('list-img2pdf'), { animation: 150, onEnd: updateImgOrder });
}

/* --- NAVIGATION --- */
window.switchMode = function (mode) {
    // Tabs
    document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tool-tab[onclick="switchMode('${mode}')"]`).classList.add('active');

    // Sections
    document.querySelectorAll('.mode-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${mode}`).classList.add('active');
}

window.triggerUpload = function (mode) {
    document.getElementById(`input-${mode}`).click();
}

/* --- FILE HANDLING --- */
function handleFiles(mode, fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (mode === 'merge') {
        const valid = files.filter(f => f.type === 'application/pdf');
        state.merge = [...state.merge, ...valid];
        renderMerge();
    }
    else if (mode === 'split') {
        if (files[0].type !== 'application/pdf') return showToast('PDF only!', 'error');
        state.split = files[0];
        document.getElementById('split-filename').innerText = files[0].name;
        document.getElementById('split-options').style.display = 'block';

        // Load page count
        loadPdfPageCount(files[0]).then(count => {
            document.getElementById('status-split').innerText = `${count} pages`;
            document.getElementById('split-to').max = count;
            document.getElementById('split-to').value = count;
        });
    }
    else if (mode === 'img2pdf') {
        const valid = files.filter(f => f.type.startsWith('image/'));
        // Create URLs for preview
        valid.forEach(f => state.img2pdf.push({ file: f, id: Math.random().toString(36).substr(2, 9) }));
        renderImg2Pdf();
    }
    else if (mode === 'pdf2text') {
        if (files[0].type !== 'application/pdf') return showToast('PDF only!', 'error');
        state.pdf2text = files[0];
        document.getElementById('pdf2text-filename').innerText = files[0].name;
    }
}

async function loadPdfPageCount(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        return pdfDoc.getPageCount();
    } catch (e) {
        return 0;
    }
}

/* --- RENDERING --- */
function renderMerge() {
    const list = document.getElementById('list-merge');
    list.innerHTML = '';
    state.merge.forEach((f, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <i class="fas fa-file-pdf file-icon"></i>
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${f.name}</span>
            <span style="color:var(--text-secondary); font-size:0.8rem;">${(f.size / 1024 / 1024).toFixed(2)} MB</span>
            <button onclick="removeMergeItem(${index})" style="background:none; border:none; color:#ff4757; cursor:pointer;"><i class="fas fa-times"></i></button>
        `;
        list.appendChild(div);
    });
    document.getElementById('status-merge').innerText = `${state.merge.length} files ready`;
}

window.removeMergeItem = function (index) {
    state.merge.splice(index, 1);
    renderMerge();
}

function updateMergeOrder(evt) {
    const item = state.merge.splice(evt.oldIndex, 1)[0];
    state.merge.splice(evt.newIndex, 0, item);
}

function renderImg2Pdf() {
    const grid = document.getElementById('list-img2pdf');
    grid.innerHTML = '';
    state.img2pdf.forEach((obj, index) => {
        const div = document.createElement('div');
        div.className = 'img-card';
        const url = URL.createObjectURL(obj.file);
        div.innerHTML = `
            <img src="${url}">
            <button class="remove-btn" onclick="removeImgItem(${index})"><i class="fas fa-times"></i></button>
        `;
        grid.appendChild(div);
    });
    document.getElementById('status-img2pdf').innerText = `${state.img2pdf.length} images`;
}

window.removeImgItem = function (index) {
    state.img2pdf.splice(index, 1);
    renderImg2Pdf();
}

function updateImgOrder(evt) {
    const item = state.img2pdf.splice(evt.oldIndex, 1)[0];
    state.img2pdf.splice(evt.newIndex, 0, item);
}

window.clearImages = function () {
    state.img2pdf = [];
    renderImg2Pdf();
}

/* --- ACTIONS --- */

// 1. MERGE LOGIC
window.runMerge = async function () {
    if (state.merge.length < 2) return showToast('Need at least 2 files!', 'warning');

    showToast('Merging PDFs...', 'info');
    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of state.merge) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        download(pdfBytes, "merged_studio.pdf", "application/pdf");
        showToast('Merge Complete! 🚀', 'success');
        if (window.playSound) window.playSound('success');
    } catch (err) {
        console.error(err);
        showToast('Merge Failed', 'error');
    }
}

// 2. SPLIT LOGIC
window.runSplit = async function () {
    if (!state.split) return showToast('No file selected!', 'warning');

    const mode = document.querySelector('input[name="split-mode"]:checked').value;
    showToast('Processing Split...', 'info');

    try {
        const arrayBuffer = await state.split.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        if (mode === 'range') {
            // Extract single new PDF with range
            const from = parseInt(document.getElementById('split-from').value) - 1;
            const to = parseInt(document.getElementById('split-to').value) - 1;

            if (from < 0 || to >= pageCount || from > to) return showToast('Invalid range!', 'error');

            const newPdf = await PDFDocument.create();
            const indices = []; // Create range array
            for (let i = from; i <= to; i++) indices.push(i);

            const copiedPages = await newPdf.copyPages(pdfDoc, indices);
            copiedPages.forEach(p => newPdf.addPage(p));

            const bytes = await newPdf.save();
            download(bytes, `split_${from + 1}-${to + 1}.pdf`, "application/pdf");
        } else {
            // Extract ALL pages (Zip)
            if (pageCount > 50 && !confirm(`This will split ${pageCount} pages. Continue?`)) return;

            const zip = new JSZip();

            for (let i = 0; i < pageCount; i++) {
                const subPdf = await PDFDocument.create();
                const [copiedPage] = await subPdf.copyPages(pdfDoc, [i]);
                subPdf.addPage(copiedPage);
                const subBytes = await subPdf.save();
                zip.file(`page_${i + 1}.pdf`, subBytes);
            }

            const content = await zip.generateAsync({ type: "blob" });
            download(content, "split_pages.zip", "application/zip");
        }
        showToast('Split Complete!', 'success');
        if (window.playSound) window.playSound('success');

    } catch (err) {
        console.error(err);
        showToast('Split Failed', 'error');
    }
}

// 3. IMG TO PDF LOGIC
window.runImg2Pdf = async function () {
    if (state.img2pdf.length === 0) return showToast('No images selected!', 'warning');

    const orientation = document.getElementById('img-orientation').value;
    showToast('Generating PDF...', 'info');

    try {
        // Default A4
        const doc = new jsPDF({
            orientation: orientation === 'l' ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < state.img2pdf.length; i++) {
            if (i > 0) doc.addPage();

            const file = state.img2pdf[i].file;
            const imgData = await readFileAsDataURL(file);

            if (orientation === 'fit') {
                // Just add image as is (might result in huge page)
                // Actually jsPDF usually needs fixed format. We will stretch to fit A4 margin
                const props = doc.getImageProperties(imgData);
                // Calculate ratio to fit A4
                const ratio = Math.min(pageWidth / props.width, pageHeight / props.height);
                const w = props.width * ratio;
                const h = props.height * ratio;
                const x = (pageWidth - w) / 2;
                const y = (pageHeight - h) / 2;
                doc.addImage(imgData, 'JPEG', x, y, w, h);
            } else {
                // Fill page
                doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
            }
        }

        doc.save("images_album.pdf");
        showToast('PDF Created!', 'success');
        if (window.playSound) window.playSound('success');

    } catch (err) {
        console.error(err);
        showToast('Conversion Failed', 'error');
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 4. PDF TO TEXT LOGIC
window.runPdf2Text = async function () {
    if (!state.pdf2text) return showToast('No PDF selected!', 'warning');

    const btn = document.querySelector('#section-pdf2text .action-bar .primary-btn');
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Reading...';
    btn.disabled = true;

    try {
        const arrayBuffer = await state.pdf2text.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        document.getElementById('pdf2text-output').value = fullText;
        showToast(`Extracted ${pdf.numPages} pages!`, 'success');
        if (window.playSound) window.playSound('success');
    } catch (err) {
        console.error(err);
        showToast('Extraction Failed (Is it scanned?)', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-search"></i> Extract Text';
        btn.disabled = false;
    }
}

function showToast(msg, type = 'success') {
    if (window.showToast) window.showToast(msg, type);
    else alert(msg);
}
