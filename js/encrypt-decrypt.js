// DOM Elements
const secretKey = document.getElementById('secretKey');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const miniConsole = document.getElementById('miniConsole');

// --- Helper Functions ---

// Get Translation
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// Log to Mini Console
function logToConsole(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-entry`;
    div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${msg}</span>`;

    // Prepend to show newest at top
    miniConsole.prepend(div);

    // Limit logs
    if (miniConsole.children.length > 50) {
        miniConsole.lastChild.remove();
    }
}

// Toggle Key Visibility
function toggleKeyVisibility() {
    const type = secretKey.getAttribute('type') === 'password' ? 'text' : 'password';
    secretKey.setAttribute('type', type);
    const icon = document.getElementById('eyeIcon');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    playSound('switch');
}

// --- Core Logic ---

function encryptText() {
    const text = inputText.value;
    const key = secretKey.value;

    if (!text || !key) {
        const msg = t('enc_msg_empty');
        showToast(msg, 'error');
        logToConsole(msg, 'error');
        playSound('error');
        return;
    }

    // Visual Feedback
    logToConsole(t('enc_log_start_enc'), 'info');
    playSound('click');

    // Simulate processing delay for effect
    outputText.value = 'Encrypting...';

    setTimeout(() => {
        try {
            const encrypted = CryptoJS.AES.encrypt(text, key).toString();
            outputText.value = encrypted;

            showToast(t('enc_msg_success'));
            logToConsole(t('enc_msg_success'), 'success');
            playSound('success');
            trackToolUsage('Crypto Studio');
        } catch (e) {
            outputText.value = '';
            showToast('Encryption Failed', 'error');
            logToConsole('Error: ' + e.message, 'error');
            playSound('error');
        }
    }, 300);
}

function decryptText() {
    const text = inputText.value;
    const key = secretKey.value;

    if (!text || !key) {
        const msg = t('enc_msg_empty');
        showToast(msg, 'error');
        logToConsole(msg, 'error');
        playSound('error');
        return;
    }

    logToConsole(t('enc_log_start_dec'), 'info');
    playSound('click');
    outputText.value = 'Decrypting...';

    setTimeout(() => {
        try {
            const bytes = CryptoJS.AES.decrypt(text, key);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);

            if (originalText) {
                outputText.value = originalText;
                showToast(t('enc_msg_success'));
                logToConsole(t('enc_msg_success'), 'success');
                playSound('success');
                trackToolUsage('Crypto Studio');
            } else {
                throw new Error('Invalid Key or Corrupted Data');
            }
        } catch (e) {
            outputText.value = '';
            const msg = t('enc_err_dec');
            showToast(msg, 'error');
            logToConsole(msg, 'error');
            playSound('error');
        }
    }, 300);
}

// --- Actions ---

function pasteText() {
    navigator.clipboard.readText().then(text => {
        inputText.value = text;
        showToast(t('json_msg_pasted'), 'success');
        playSound('click');
    }).catch(err => {
        showToast('Clipboard Error', 'error');
    });
}

function clearInput() {
    inputText.value = '';
    outputText.value = '';
    inputText.focus();
    playSound('trash'); // Assuming 'trash' sound exists or falls back
}

function copyResult() {
    if (!outputText.value) return;
    navigator.clipboard.writeText(outputText.value).then(() => {
        showToast(t('json_msg_copied'), 'success');
        logToConsole(t('json_msg_copied'), 'success');
        playSound('success');
    });
}

// Init
logToConsole(t('enc_log_ready'), 'info');
