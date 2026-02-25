// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
// File Mode Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const inputBase64File = document.getElementById('inputBase64File');
const outputFileBase64 = document.getElementById('outputFileBase64');
const fileDownloadZone = document.getElementById('fileDownloadZone');
const previewFileName = document.getElementById('previewFileName');
const previewFileType = document.getElementById('previewFileType');
const btnDownloadFile = document.getElementById('btnDownloadFile');
// Mode & Buttons
const btnText = document.getElementById('btn-text');
const btnFile = document.getElementById('btn-file');
const btnEncode = document.getElementById('btnEncode');
const btnDecode = document.getElementById('btnDecode');

// State
let currentMode = 'text'; // 'text' or 'file'
let currentAction = 'encode'; // 'encode' or 'decode'
let loadedFile = null;
let decodedFileBlob = null;

// --- Helpers ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// --- Initialization ---
function init() {
    setMode('text');
}

// --- Mode Switching ---
function setMode(mode) {
    currentMode = mode;

    // UI Updates
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');

    // Toggle Interfaces
    document.getElementById('textModeUI').classList.toggle('hidden', mode !== 'text');
    document.getElementById('fileModeUI').classList.toggle('hidden', mode !== 'file');

    // Reset logic if needed
    // if(mode === 'file') initFileMode(); 

    playSound('switch');
}

// --- Text Mode Logic ---
function autoConvert() {
    if (currentMode !== 'text') return;
    processConversion(currentAction);
}

function processConversion(action) {
    currentAction = action;

    // Update Button Styles
    if (action === 'encode') {
        btnEncode.classList.add('primary');
        btnDecode.classList.remove('primary');
    } else {
        btnDecode.classList.add('primary');
        btnEncode.classList.remove('primary');
    }

    if (currentMode === 'text') {
        processText(action);
    } else {
        processFileMode(action);
    }
}

function processText(action) {
    const input = inputText.value;
    if (!input) {
        outputText.value = '';
        return;
    }

    try {
        if (action === 'encode') {
            // Support Unicode
            outputText.value = btoa(unescape(encodeURIComponent(input)));
        } else {
            outputText.value = decodeURIComponent(escape(atob(input)));
        }
    } catch (e) {
        outputText.value = t('b64_err');
    }
}

function copyResult() {
    const text = currentMode === 'text' ? outputText.value : outputFileBase64.value;
    if (!text) return;

    navigator.clipboard.writeText(text);
    showToast(t('json_msg_copied'), 'success');
    playSound('success');
}

function pasteText() {
    navigator.clipboard.readText().then(text => {
        inputText.value = text;
        autoConvert();
        showToast(t('json_msg_pasted'), 'success');
    });
}

function clearAll() {
    inputText.value = '';
    outputText.value = '';
    playSound('click');
}

// --- File Mode Logic ---
function processFileMode(action) {
    // Toggle File inputs based on action
    const dropZone = document.getElementById('dropZone');
    const inputBase64 = document.getElementById('inputBase64File');
    const outputBase64 = document.getElementById('outputFileBase64');
    const downloadZone = document.getElementById('fileDownloadZone');

    if (action === 'encode') {
        dropZone.classList.remove('hidden');
        inputBase64.classList.add('hidden');
        outputBase64.classList.remove('hidden');
        downloadZone.classList.add('hidden');

        // Trigger re-encode if file loaded
        if (loadedFile) encodeFile(loadedFile);

    } else {
        dropZone.classList.add('hidden');
        inputBase64.classList.remove('hidden');
        outputBase64.classList.add('hidden');
        downloadZone.classList.remove('hidden');
    }
}

// Encode File
function handleFile(file) {
    if (!file) return;
    loadedFile = file;

    // Update UI
    fileInfo.innerHTML = `<strong>${file.name}</strong> (${formatSize(file.size)})`;
    fileInfo.classList.remove('hidden');

    encodeFile(file);
    playSound('success');
}

function encodeFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const result = e.target.result;
        // result is "data:image/png;base64,....."
        // We might want just the base64 part? Usually yes for "Base64 string".
        // But "data URI" is more useful for web.
        // Let's provide the full Data URI.
        outputFileBase64.value = result;
        showToast(t('json_msg_formatted'), 'success');
    };
    reader.onerror = function () {
        showToast(t('img_failed'), 'error');
    };
    reader.readAsDataURL(file);
}

// Decode File
function previewFileFromBase64() {
    const base64 = inputBase64File.value.trim();
    if (!base64) return;

    try {
        // Detect MIME or Default
        let type = 'application/octet-stream';
        let data = base64;

        if (base64.startsWith('data:')) {
            const parts = base64.split(',');
            const meta = parts[0];
            data = parts[1];
            type = meta.split(':')[1].split(';')[0];
        }

        // Convert to Blob
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        decodedFileBlob = new Blob([byteArray], { type: type });

        // Update Preview
        let ext = type.split('/')[1] || 'bin';
        previewFileName.innerText = `decoded_file.${ext}`;
        previewFileType.innerText = `${type} • ${formatSize(decodedFileBlob.size)}`;

        btnDownloadFile.disabled = false;
        btnDownloadFile.style.opacity = '1';
        btnDownloadFile.style.cursor = 'pointer';

    } catch (e) {
        previewFileName.innerText = t('b64_err');
        btnDownloadFile.disabled = true;
    }
}

function downloadDecodedFile() {
    if (!decodedFileBlob) return;
    const url = URL.createObjectURL(decodedFileBlob);
    const a = document.createElement('a');
    a.href = url;
    // Guess name
    const ext = decodedFileBlob.type.split('/')[1] || 'bin';
    a.download = `decoded_base64.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSound('success');
    trackToolUsage('Base64 Studio');
}

function downloadBase64() {
    const text = outputFileBase64.value;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64_data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start
init();
