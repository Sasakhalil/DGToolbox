// Hash Tools Logic
// Supports MD5, SHA1, SHA256, SHA512
// Uses Web Crypto API for SHA and CryptoJS for MD5

let currentAlgo = 'MD5';
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const outputContainer = document.getElementById('outputContainer');
const outputLabel = document.getElementById('outputLabel');
const inputStats = document.getElementById('inputStats');
const loadingIndicator = document.getElementById('loadingIndicator');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Restore last used algo if valid
    const savedAlgo = localStorage.getItem('hash_last_algo');
    if (savedAlgo && ['MD5', 'SHA1', 'SHA256', 'SHA512'].includes(savedAlgo)) {
        setAlgo(savedAlgo);
    } else {
        setAlgo('MD5');
    }

    // Input listeners
    inputText.addEventListener('input', () => {
        updateStats();
        debouncedHash();
    });

    // Initial focus
    inputText.focus();
});

function setAlgo(algo) {
    currentAlgo = algo;
    outputLabel.textContent = algo;
    localStorage.setItem('hash_last_algo', algo);

    // Update buttons UI
    document.querySelectorAll('.algo-btn').forEach(btn => {
        if (btn.textContent === algo) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Re-calculate if content exists
    if (inputText.value) {
        performHash();
    }
}

// Debounce to prevent freezing on large inputs
let infoTimeout;
function debouncedHash() {
    clearTimeout(infoTimeout);
    infoTimeout = setTimeout(performHash, 300);
}

async function performHash() {
    const text = inputText.value;

    if (!text) {
        outputContainer.style.opacity = '0.5';
        outputText.value = '';
        return;
    }

    outputContainer.style.opacity = '1';
    loadingIndicator.classList.add('active');

    try {
        let result = '';

        if (currentAlgo === 'MD5') {
            // Use CryptoJS for MD5 (Web Crypto doesn't support it due to weakness)
            if (typeof CryptoJS !== 'undefined') {
                result = CryptoJS.MD5(text).toString();
            } else {
                result = "Error: CryptoJS library not loaded.";
            }
        } else {
            // Use Native Web Crypto API for SHA family
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            let algoName = '';

            switch (currentAlgo) {
                case 'SHA1': algoName = 'SHA-1'; break;
                case 'SHA256': algoName = 'SHA-256'; break;
                case 'SHA512': algoName = 'SHA-512'; break;
            }

            const hashBuffer = await crypto.subtle.digest(algoName, data);
            result = bufferToHex(hashBuffer);
        }

        outputText.value = result;
    } catch (error) {
        console.error("Hashing error:", error);
        outputText.value = "Error calculating hash.";
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

function bufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        return hexCode.padStart(2, '0');
    });
    return hexCodes.join('');
}

function updateStats() {
    const text = inputText.value;
    const chars = text.length;
    // Calculate bytes (UTF-8)
    const bytes = new TextEncoder().encode(text).length;

    inputStats.textContent = `${chars} chars | ${bytes} bytes`;
}

// --- Actions ---

function clearInput() {
    inputText.value = '';
    outputText.value = '';
    outputContainer.style.opacity = '0.5';
    updateStats();
    inputText.focus();
}

async function pasteInput() {
    try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        updateStats();
        performHash();
        showToast('Text pasted from clipboard');
    } catch (err) {
        showToast('Failed to read clipboard', 'error');
    }
}

function copyOutput() {
    const text = outputText.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Hash copied to clipboard');
        if (window.playSound) window.playSound('success');
    }).catch(err => {
        console.error('Copy failed', err);
        showToast('Failed to copy', 'error');
    });
}

// Helper for toast if not globally available
function showToast(msg, type = 'success') {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        // Fallback
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = type === 'error' ? '#ff4757' : '#2ed573';
        toast.style.color = '#fff';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '20px';
        toast.style.zIndex = '1000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
}
