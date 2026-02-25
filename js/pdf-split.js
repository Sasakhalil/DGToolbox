// PDF Split Logic
// Uses pdf-lib and JSZip

let currentFile = null;
let currentPdfDoc = null;
let totalPages = 0;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const splitOptions = document.getElementById('splitOptions');
const fileNameDisplay = document.getElementById('fileName');
const pageCountDisplay = document.getElementById('pageCount');
const rangeInputs = document.getElementById('rangeInputs');
const splitBtn = document.getElementById('splitBtn');
const statusMsg = document.getElementById('statusMsg');

document.addEventListener('DOMContentLoaded', () => {
    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', handleDrop);

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
});

function handleDrop(e) {
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        handleFile(files[0]);
    } else {
        showToast('Please upload a PDF file.', 'error');
    }
}

async function handleFile(file) {
    if (!file) return;

    currentFile = file;
    dropZone.classList.add('hidden');
    splitOptions.classList.remove('hidden');

    fileNameDisplay.textContent = file.name;
    statusMsg.textContent = 'Analyzing PDF...';
    splitBtn.disabled = true;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const { PDFDocument } = PDFLib;
        currentPdfDoc = await PDFDocument.load(arrayBuffer);
        totalPages = currentPdfDoc.getPageCount();

        pageCountDisplay.textContent = totalPages;

        // Setup inputs
        document.getElementById('toPage').max = totalPages;
        document.getElementById('toPage').value = totalPages;
        document.getElementById('fromPage').max = totalPages;

        splitBtn.disabled = false;
        statusMsg.textContent = '';
    } catch (error) {
        console.error("Load Error: ", error);
        showToast('Failed to load PDF. It might be encrypted.', 'error');
        resetFile();
    }
}

function resetFile() {
    currentFile = null;
    currentPdfDoc = null;
    totalPages = 0;
    fileInput.value = '';

    dropZone.classList.remove('hidden');
    splitOptions.classList.add('hidden');
}

function toggleMode() {
    const mode = document.querySelector('input[name="splitMode"]:checked').value;
    if (mode === 'range') {
        rangeInputs.classList.add('active');
        splitBtn.innerHTML = '<i class="fas fa-cut"></i> Extract Range';
    } else {
        rangeInputs.classList.remove('active');
        splitBtn.innerHTML = '<i class="fas fa-layer-group"></i> Split All Pages';
    }
}

async function processSplit() {
    if (!currentPdfDoc) return;

    const mode = document.querySelector('input[name="splitMode"]:checked').value;
    splitBtn.disabled = true;
    splitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        const { PDFDocument } = PDFLib;

        if (mode === 'range') {
            // SINGLE FILE OUTPUT
            const from = parseInt(document.getElementById('fromPage').value);
            const to = parseInt(document.getElementById('toPage').value);

            if (from < 1 || to > totalPages || from > to) {
                showToast('Invalid page range.', 'error');
                splitBtn.disabled = false;
                splitBtn.innerHTML = '<i class="fas fa-cut"></i> Extract Range';
                return;
            }

            statusMsg.textContent = `Extracting pages ${from}-${to}...`;

            const newPdf = await PDFDocument.create();
            // getPageIndices are 0-based
            const indices = []; // range from (from-1) to (to-1)
            for (let i = from - 1; i < to; i++) indices.push(i);

            const copiedPages = await newPdf.copyPages(currentPdfDoc, indices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            download(pdfBytes, `split_${from}-${to}_${currentFile.name}`, "application/pdf");

            showToast('Range Extracted!');

        } else {
            // ZIP OUPUT (ALL PAGES)
            statusMsg.textContent = 'Splitting pages...';
            const zip = new JSZip();
            const folder = zip.folder("split_pages");

            for (let i = 0; i < totalPages; i++) {
                statusMsg.textContent = `Processing page ${i + 1}/${totalPages}...`;
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(currentPdfDoc, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();

                folder.file(`page_${i + 1}.pdf`, pdfBytes);
            }

            statusMsg.textContent = 'Generating ZIP...';
            const content = await zip.generateAsync({ type: "blob" });
            download(content, "split_pages.zip", "application/zip");

            showToast('All pages extracted to ZIP!');
        }

    } catch (error) {
        console.error("Split Error:", error);
        showToast('Error during splitting.', 'error');
    } finally {
        splitBtn.disabled = false;
        statusMsg.textContent = 'Done!';
        toggleMode(); // Reset button text
    }
}

function showToast(msg, type = 'success') {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}
