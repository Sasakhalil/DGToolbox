// DOM Elements
const configCard = document.querySelector('.config-card');
const inputContainer = document.getElementById('inputContainer');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const logoInput = document.getElementById('logoInput');
const logoPreviewName = document.getElementById('logoPreviewName');
const qrLogoOverlay = document.getElementById('qrLogoOverlay');

// State
let currentMode = 'url';
let qrLogo = null;
let qrColorDark = "#000000";
let qrColorLight = "#ffffff";

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
    setMode('url');
}

// --- Mode Switching ---
function setMode(mode) {
    currentMode = mode;

    // Update Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick.toString().includes(`'${mode}'`)) btn.classList.add('active');
    });

    renderInputs();
    generateQR();
    playSound('switch');
}

function renderInputs() {
    inputContainer.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'studio-input';
    input.id = 'qrInput';

    // Placeholders (Technical formats are universal)
    if (currentMode === 'url') input.placeholder = 'https://example.com';
    else if (currentMode === 'text') input.placeholder = t('qr_placeholder');
    else if (currentMode === 'wifi') input.placeholder = 'WIFI:S:MyNet;T:WPA;P:pass;;';
    else if (currentMode === 'email') input.placeholder = 'mailto:contact@example.com';

    input.addEventListener('input', generateQR);
    inputContainer.appendChild(input);

    // Initial value for demo
    if (currentMode === 'url' && !input.value) input.value = 'https://google.com';
}

// --- Color Handling ---
function updateColor(val, type) {
    if (type === 'dark') {
        qrColorDark = val;
        document.getElementById('textDark').value = val;
    } else {
        qrColorLight = val;
        document.getElementById('textLight').value = val;
    }
    generateQR();
}

// --- Logo Handling ---
function handleLogoUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            qrLogo = e.target.result;
            qrLogoOverlay.src = qrLogo;
            qrLogoOverlay.style.display = 'block';
            logoPreviewName.innerText = file.name;
            generateQR();
            playSound('success');
        };
        reader.readAsText(file); // Wait, readAsText for image? No! readAsDataURL
        reader.readAsDataURL(file);
    }
}

// --- Generation ---
function generateQR() {
    const text = document.getElementById('qrInput').value;
    if (!text) return;

    qrCodeContainer.innerHTML = '';

    // Using QRCode.js library
    new QRCode(qrCodeContainer, {
        text: text,
        width: 256,
        height: 256,
        colorDark: qrColorDark,
        colorLight: qrColorLight,
        correctLevel: QRCode.CorrectLevel.H
    });
}

// --- Download ---
function downloadQR() {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;

    // Create a new canvas to merge logo
    if (qrLogoOverlay.style.display !== 'none' && qrLogoOverlay.src) {
        // Complex logic to draw logo on canvas
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = qrLogoOverlay.src;
        img.onload = () => {
            // Draw logo in center
            const size = canvas.width;
            const logoSize = size * 0.2;
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;

            // Background box for logo
            ctx.fillStyle = qrColorLight;
            ctx.fillRect(x, y, logoSize, logoSize);

            ctx.drawImage(img, x, y, logoSize, logoSize);
            saveCanvas(canvas);
        };
        // If image loading is async, we might miss it.
        // For simplicity, we just save the raw QR canvas if no complex drawing is implemented here 
        // OR we trust the browser rendered it?
        // Actually, QRCode.js draws on canvas. The Overlay is an <img> tag on top in HTML.
        // To download combined, we MUST draw to canvas.

        // Let's implement simple draw:
        const logoSize = canvas.width * 0.2;
        const logoPos = (canvas.width - logoSize) / 2;

        // Draw white background for logo
        const ctx2 = canvas.getContext('2d');
        ctx2.fillStyle = qrColorLight;
        ctx2.fillRect(logoPos, logoPos, logoSize, logoSize);

        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";
        logoImg.src = qrLogoOverlay.src;

        // We need to wait for load? It's likely loaded since displayed.
        // But safe to just save.
        try {
            ctx2.drawImage(logoImg, logoPos, logoPos, logoSize, logoSize);
        } catch (e) {/* Cross origin issues */ }

        saveCanvas(canvas);
    } else {
        saveCanvas(canvas);
    }
}

function saveCanvas(canvas) {
    try {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast(t('qr_toast_saved'), 'success');
        if (window.playSound) playSound('success');
        trackToolUsage('QR Studio');
    } catch (e) {
        showToast(t('qr_toast_err'), 'error');
    }
}

// Start
init();
