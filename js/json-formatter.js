// DOM Elements
const jsonInput = document.getElementById('jsonInput');
const jsonOutput = document.getElementById('jsonOutput');
const treeView = document.getElementById('treeView');
const statusMsg = document.getElementById('statusMsg');
const sizeInfo = document.getElementById('sizeInfo');
const fileInput = document.getElementById('fileInput');

// State
let isTreeView = false;

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
    // Load saved input
    const saved = localStorage.getItem('dg_json_input');
    if (saved) {
        jsonInput.value = saved;
        updateSizeInfo(saved);
    }

    // Listeners
    jsonInput.addEventListener('input', () => {
        const val = jsonInput.value;
        localStorage.setItem('dg_json_input', val);
        updateSizeInfo(val);
        setStatus(t('json_status_ready'));
    });

    fileInput.addEventListener('change', handleFileUpload);
}

// --- Core Logic ---
function parseInput() {
    const raw = jsonInput.value.trim();
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        setStatus(`${t('json_err_invalid')}: ${e.message}`, 'error');
        playSound('error');
        return null;
    }
}

function formatJSON() {
    const obj = parseInput();
    if (!obj) return;

    if (isTreeView) {
        renderTree(obj);
    } else {
        jsonOutput.value = JSON.stringify(obj, null, 4);
        jsonOutput.style.display = 'block';
        treeView.style.display = 'none';
    }

    setStatus(t('json_msg_formatted'), 'success');
    playSound('success');
    trackToolUsage('JSON Studio');
}

function minifyJSON() {
    const obj = parseInput();
    if (!obj) return;

    // Force text view for minify
    if (isTreeView) toggleViewMode();

    jsonOutput.value = JSON.stringify(obj);
    setStatus(t('json_msg_minified'), 'success');
    playSound('success');
    trackToolUsage('JSON Studio');
}

// --- Tree View Logic ---
function toggleViewMode() {
    isTreeView = !isTreeView;
    const btn = document.getElementById('treeToggle');

    if (isTreeView) {
        btn.classList.add('primary');
        jsonOutput.style.display = 'none';
        treeView.style.display = 'block';

        // Auto-render if content exists
        if (jsonInput.value.trim()) formatJSON();
    } else {
        btn.classList.remove('primary');
        jsonOutput.style.display = 'block';
        treeView.style.display = 'none';
    }
    playSound('click');
}

function renderTree(obj) {
    treeView.innerHTML = '';
    treeView.appendChild(createTreeElement(obj));
}

function createTreeElement(item) {
    if (item === null) return createLeaf('null', 'null');
    if (typeof item === 'boolean') return createLeaf(item, 'boolean');
    if (typeof item === 'number') return createLeaf(item, 'number');
    if (typeof item === 'string') return createLeaf(`"${item}"`, 'string');

    if (Array.isArray(item)) {
        return createParent(item, '[', ']');
    }

    if (typeof item === 'object') {
        return createParent(item, '{', '}');
    }
}

function createLeaf(val, type) {
    const span = document.createElement('span');
    span.className = `tree-${type}`;
    span.innerText = val;
    return span;
}

function createParent(obj, openChar, closeChar) {
    const container = document.createElement('div');

    // Header
    const header = document.createElement('div');
    header.className = 'collapsible';
    const count = Object.keys(obj).length;
    const itemsText = t('json_items_count'); // "items" or "عناصر"

    header.innerHTML = `<span style="color: var(--text-secondary)">${openChar}</span> <span style="font-size: 0.8em; color: var(--text-secondary)">${count} ${itemsText}</span>`;
    header.onclick = (e) => {
        e.stopPropagation();
        header.classList.toggle('collapsed');
    };
    container.appendChild(header);

    // Children
    const children = document.createElement('div');
    children.className = 'children';

    Object.keys(obj).forEach(key => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';

        // Key
        if (!Array.isArray(obj)) {
            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key';
            keySpan.innerText = `"${key}": `;
            itemDiv.appendChild(keySpan);
        }

        // Value
        itemDiv.appendChild(createTreeElement(obj[key]));
        children.appendChild(itemDiv);
    });

    // Footer
    const footer = document.createElement('div');
    footer.style.color = 'var(--text-secondary)';
    footer.innerText = closeChar;
    children.appendChild(footer);

    container.appendChild(children);
    return container;
}

// --- File & Clipboard ---
function triggerUpload() {
    fileInput.click();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        jsonInput.value = e.target.result;
        updateSizeInfo(jsonInput.value);
        setStatus(`${t('json_msg_loaded')} ${file.name}`);
        playSound('success');
    };
    reader.readAsText(file);
}

function downloadJSON() {
    const content = jsonOutput.value || jsonInput.value;
    if (!content) return;

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    playSound('success');
}

function copyOutput() {
    const content = jsonOutput.value;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
        setStatus(t('json_msg_copied'), 'success');
        playSound('success');
    });
}

function pasteClipboard() {
    navigator.clipboard.readText().then(text => {
        jsonInput.value = text;
        updateSizeInfo(text);
        setStatus(t('json_msg_pasted'));
        playSound('click');
    });
}

function clearAll() {
    jsonInput.value = '';
    jsonOutput.value = '';
    treeView.innerHTML = '';
    localStorage.removeItem('dg_json_input');
    updateSizeInfo('');
    setStatus(t('json_msg_cleared'));
    playSound('trash');
}

// --- Helpers ---
function setStatus(msg, type = 'normal') {
    statusMsg.innerText = msg;
    statusMsg.className = type === 'error' ? 'status-error' : (type === 'success' ? 'status-success' : '');
}

function updateSizeInfo(text) {
    const bytes = new Blob([text]).size;
    if (bytes < 1024) sizeInfo.innerText = bytes + ' B';
    else if (bytes < 1024 * 1024) sizeInfo.innerText = (bytes / 1024).toFixed(2) + ' KB';
    else sizeInfo.innerText = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Start
init();
