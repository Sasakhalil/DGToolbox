// DOM Elements
const colorInput = document.getElementById('colorInput');
const mainPreview = document.getElementById('mainPreview');
const hexInput = document.getElementById('hexInput');
const rgbInput = document.getElementById('rgbInput');
const hslInput = document.getElementById('hslInput');
const shadesContainer = document.getElementById('shadesContainer');
const historyGrid = document.getElementById('historyGrid');

// Gradient Elements
const gradColor1 = document.getElementById('gradColor1');
const gradColor2 = document.getElementById('gradColor2');
const gradientPreview = document.getElementById('gradientPreview');
const cssOutput = document.getElementById('cssOutput');

// State
let history = JSON.parse(localStorage.getItem('colorHistory')) || [];

// --- Helper Functions ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// --- Initialization ---
function init() {
    // Set initial color
    const initialColor = colorInput.value;
    updateColor(initialColor);
    renderHistory();
    updateGradient();

    // Listeners
    colorInput.addEventListener('input', (e) => updateColor(e.target.value));
    colorInput.addEventListener('change', (e) => addToHistory(e.target.value));

    gradColor1.addEventListener('input', updateGradient);
    gradColor2.addEventListener('input', updateGradient);
}

// --- Color Logic ---
function updateColor(hex) {
    // Update Preview
    mainPreview.style.backgroundColor = hex;
    colorInput.value = hex; // Sync if updated from elsewhere

    // Update Values
    hexInput.value = hex.toUpperCase();
    const rgb = hexToRgb(hex);
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    // Update Shades
    generateShades(hex);

    // Dynamic Theme Accent
    document.documentElement.style.setProperty('--accent-color', hex);
}

function generateShades(hex) {
    shadesContainer.innerHTML = '';
    const rgb = hexToRgb(hex);

    // Generate 5 shades (darker) and 5 tints (lighter)
    const steps = 5;

    // Tints (Light)
    for (let i = steps; i > 0; i--) {
        const factor = i / (steps + 1);
        const color = `rgba(${rgb.r + (255 - rgb.r) * factor}, ${rgb.g + (255 - rgb.g) * factor}, ${rgb.b + (255 - rgb.b) * factor}, 1)`;
        createShadeBar(color);
    }

    // Base
    createShadeBar(hex, true);

    // Shades (Dark)
    for (let i = 1; i <= steps; i++) {
        const factor = 1 - (i / (steps + 1));
        const color = `rgba(${rgb.r * factor}, ${rgb.g * factor}, ${rgb.b * factor}, 1)`;
        createShadeBar(color);
    }
}

function createShadeBar(color, isBase = false) {
    const bar = document.createElement('div');
    bar.className = 'shade-bar';
    bar.style.backgroundColor = color;
    if (isBase) {
        bar.style.height = '40px';
        bar.style.zIndex = '5';
        bar.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    }

    bar.onclick = () => {
        // Convert rgb/rgba to hex for input
        const rgbVals = color.match(/\d+/g);
        const hex = rgbToHex(parseInt(rgbVals[0]), parseInt(rgbVals[1]), parseInt(rgbVals[2]));
        updateColor(hex);
        playSound('click');
    };

    shadesContainer.appendChild(bar);
}

// --- Gradient Logic ---
function updateGradient() {
    const c1 = gradColor1.value;
    const c2 = gradColor2.value;
    const gradient = `linear-gradient(90deg, ${c1}, ${c2})`;

    gradientPreview.style.background = gradient;
    cssOutput.value = gradient;
}

// --- History Logic ---
function addToHistory(color) {
    if (history.includes(color)) return;

    history.unshift(color);
    if (history.length > 15) history.pop();

    localStorage.setItem('colorHistory', JSON.stringify(history));
    renderHistory();
    trackToolUsage('Color Studio');
}

function renderHistory() {
    historyGrid.innerHTML = '';
    history.forEach(color => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.style.backgroundColor = color;
        item.onclick = () => {
            updateColor(color);
            playSound('click');
        };
        historyGrid.appendChild(item);
    });
}

function clearHistory() {
    history = [];
    localStorage.removeItem('colorHistory');
    renderHistory();
    showToast(t('color_msg_cleared'), 'info');
    playSound('trash');
}

// --- Utilities ---
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function copyToClipboard(id) {
    const el = document.getElementById(id);
    const text = el.value;

    navigator.clipboard.writeText(text).then(() => {
        const msg = t('color_msg_copied') || 'Color copied';
        showToast(`${msg}: ${text}`, 'success');
        playSound('success');
    }).catch(err => {
        // Fallback
        el.select();
        document.execCommand('copy');
        showToast('Copied!', 'success');
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'picker') {
        document.getElementById('pickerTab').style.display = 'flex';
        document.getElementById('gradientTab').style.display = 'none';

        // Update URL/History? No need for now.
    } else {
        document.getElementById('pickerTab').style.display = 'none';
        document.getElementById('gradientTab').style.display = 'flex';
    }
    playSound('switch');
}

// Start
init();
