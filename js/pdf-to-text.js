// PDF to Text Logic
// Uses PDF.js

let currentPdfText = '';
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const outputText = document.getElementById('outputText');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const statusMsg = document.getElementById('statusMsg');
const fileNameDisplay = document.getElementById('fileName');

// Set Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
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

    fileNameDisplay.textContent = file.name;
    dropZone.classList.add('hidden');
    workspace.classList.remove('hidden');
    outputText.value = '';
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    statusMsg.textContent = 'Initializing PDF...';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        let extractedText = '';

        for (let i = 1; i <= totalPages; i++) {
            statusMsg.textContent = `Extracting page ${i} of ${totalPages}...`;
            progressFill.style.width = `${(i / totalPages) * 100}%`;

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join items with buffer
            const pageText = textContent.items.map(item => item.str).join(' ');

            extractedText += `--- Page ${i} ---\n\n${pageText}\n\n`;

            // Allow UI update
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        outputText.value = extractedText;
        statusMsg.textContent = 'Extraction Complete!';
        progressFill.style.width = '100%';

        showToast('Text extracted successfully!');
        if (window.playSound) window.playSound('success');

        setTimeout(() => {
            progressBar.style.display = 'none';
            statusMsg.textContent = '';
        }, 3000);

    } catch (error) {
        console.error("PDF Text Error:", error);
        showToast('Error extracting text. PDF might be image-based.', 'error');
        statusMsg.textContent = 'Extraction Failed.';
    }
}

function copyText() {
    if (!outputText.value) return;
    navigator.clipboard.writeText(outputText.value).then(() => {
        showToast('Text copied to clipboard');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function resetTool() {
    dropZone.classList.remove('hidden');
    workspace.classList.add('hidden');
    outputText.value = '';
    fileInput.value = '';
    currentPdfText = '';
}

function showToast(msg, type = 'success') {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}

