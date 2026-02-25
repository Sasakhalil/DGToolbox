// DOM Elements
const qtySlider = document.getElementById('qtySlider');
const qtyDisplay = document.getElementById('qtyDisplay');
const uuidList = document.getElementById('uuidList');

// Options
const optHyphens = document.getElementById('optHyphens');
const optUppercase = document.getElementById('optUppercase');
const optBraces = document.getElementById('optBraces');
const optQuotes = document.getElementById('optQuotes');
const optSingleQuotes = document.getElementById('optSingleQuotes');
const optComma = document.getElementById('optComma');
const optNumbered = document.getElementById('optNumbered');
const btnUuid = document.getElementById('btn-uuid');
const btnNano = document.getElementById('btn-nano');

// State
let currentType = 'uuid'; // uuid | nano
let generatedData = [];

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
    updateQty(5);
    generateIDs();
}

function updateQty(val) {
    qtyDisplay.innerText = val;
}

function setType(type) {
    currentType = type;
    if (type === 'uuid') {
        btnUuid.classList.add('active');
        btnNano.classList.remove('active');
        optHyphens.disabled = false;
        optHyphens.parentElement.style.opacity = '1';
    } else {
        btnNano.classList.add('active');
        btnUuid.classList.remove('active');
        optHyphens.checked = false;
        optHyphens.disabled = true;
        optHyphens.parentElement.style.opacity = '0.5';
    }
    playSound('switch');
}

// --- Core Logic ---
function generateIDs() {
    const qty = parseInt(qtySlider.value);
    uuidList.innerHTML = '';
    generatedData = [];

    for (let i = 0; i < qty; i++) {
        let id = currentType === 'uuid' ? generateUUID() : generateNanoID();
        id = formatID(id, i);
        generatedData.push(id);

        const item = document.createElement('div');
        item.className = 'uuid-item';
        // Delay animation
        item.style.animationDelay = `${i * 0.05}s`;

        item.innerHTML = `
            <span class="uuid-text">${id}</span>
            <button class="copy-item-btn" onclick="copyItem('${id}')" title="Copy">
                <i class="fas fa-copy"></i>
            </button>
        `;

        uuidList.appendChild(item);
    }

    showToast(`${t('uuid_stat_generated')} ${qty}`, 'success');
    playSound('success');
    trackToolUsage('UUID Studio');
}

function generateUUID() {
    // Native Crypto API
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function generateNanoID(size = 21) {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
    let id = '';
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    for (let i = 0; i < size; i++) {
        id += alphabet[bytes[i] & 63];
    }
    return id;
}

function formatID(id, index) {
    // 1. UUID Specifics
    if (currentType === 'uuid') {
        if (!optHyphens.checked) id = id.replace(/-/g, '');
        if (optUppercase.checked) id = id.toUpperCase();
        if (optBraces.checked) id = `{${id}}`;
    } else {
        // NanoID common transformations
        if (optUppercase.checked) id = id.toUpperCase();
    }

    // 2. Wrappers
    if (optQuotes.checked) id = `"${id}"`;
    if (optSingleQuotes.checked) id = `'${id}'`;

    // 3. Delimiters
    if (optComma.checked) id = `${id},`;

    // 4. Numbering
    if (optNumbered.checked) id = `${index + 1}. ${id}`;

    return id;
}

// --- Actions ---
function copyItem(text) {
    navigator.clipboard.writeText(text);
    showToast(t('uuid_msg_copied'), 'success'); // "UUID Copied"
    playSound('click');
}

function copyAll() {
    if (generatedData.length === 0) return;
    const text = generatedData.join('\n');
    navigator.clipboard.writeText(text);
    showToast(t('json_msg_copied'), 'success'); // "Copied to clipboard"
    playSound('success');
}

function clearList() {
    if (generatedData.length === 0) return;
    uuidList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">List Cleared</div>';
    generatedData = [];
    showToast(t('json_msg_cleared'), 'info');
    playSound('error'); // Just a delete sound
}

function downloadList() {
    if (generatedData.length === 0) return;
    const text = generatedData.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSound('success');
}

// Start
init();

// Event Listeners
qtySlider.addEventListener('input', () => updateQty(qtySlider.value));
btnUuid.addEventListener('click', () => setType('uuid'));
btnNano.addEventListener('click', () => setType('nano'));
btnCopyAll.addEventListener('click', copyAll);
btnClearList.addEventListener('click', clearList);
btnDownloadList.addEventListener('click', downloadList);