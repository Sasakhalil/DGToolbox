// PDF Merge Logic
// Uses pdf-lib for client-side merging

let pdfFiles = [];
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const pdfList = document.getElementById('pdfList');
const controls = document.getElementById('controls');
const statusMsg = document.getElementById('statusMsg');
const mergeBtn = document.getElementById('mergeBtn');

// Helper for translation
function t(key) {
    // Simple fallback
    return key;
}

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

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
});

function handleDrop(e) {
    dropZone.classList.remove('dragover');
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');

    if (newFiles.length === 0) {
        showToast('Only PDF files are allowed', 'error');
        return;
    }

    pdfFiles = [...pdfFiles, ...newFiles];
    renderList();
}

function renderList() {
    pdfList.innerHTML = '';

    if (pdfFiles.length > 0) {
        controls.classList.remove('hidden');
    } else {
        controls.classList.add('hidden');
    }

    pdfFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'pdf-item';
        item.innerHTML = `
            <div class="pdf-icon"><i class="fas fa-file-pdf"></i></div>
            <div class="pdf-name">${file.name}</div>
            <div class="pdf-actions">
                <button class="action-btn" onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="action-btn" onclick="moveDown(${index})" ${index === pdfFiles.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="action-btn delete" onclick="removeFile(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        pdfList.appendChild(item);
    });
}

function moveUp(index) {
    if (index > 0) {
        [pdfFiles[index], pdfFiles[index - 1]] = [pdfFiles[index - 1], pdfFiles[index]];
        renderList();
    }
}

function moveDown(index) {
    if (index < pdfFiles.length - 1) {
        [pdfFiles[index], pdfFiles[index + 1]] = [pdfFiles[index + 1], pdfFiles[index]];
        renderList();
    }
}

function removeFile(index) {
    pdfFiles.splice(index, 1);
    renderList();
}

async function mergePDFs() {
    if (pdfFiles.length < 2) {
        showToast('Please select at least 2 PDF files', 'warning');
        return;
    }

    mergeBtn.disabled = true;
    mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging...';
    statusMsg.textContent = 'Processing files...';

    try {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();

        for (const file of pdfFiles) {
            statusMsg.textContent = `Processing ${file.name}...`;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        statusMsg.textContent = 'Finalizing...';
        const pdfBytes = await mergedPdf.save();

        // Download
        download(pdfBytes, "merged-document.pdf", "application/pdf");

        showToast('PDFs Merged Successfully!');
        if (window.playSound) window.playSound('success');

        // Reset
        statusMsg.textContent = 'Done!';
        setTimeout(() => statusMsg.textContent = '', 3000);

    } catch (error) {
        console.error('Merge Error:', error);
        showToast('Failed to merge PDFs. One might be encrypted.', 'error');
        statusMsg.textContent = 'Error occurred.';
    } finally {
        mergeBtn.disabled = false;
        mergeBtn.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs NOW';
    }
}

// Simple Toast fallback
function showToast(msg, type = 'success') {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}
