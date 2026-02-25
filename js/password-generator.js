// DOM Elements
const passwordOutput = document.getElementById('passwordOutput');
const lengthRange = document.getElementById('lengthRange');
const lengthValue = document.getElementById('lengthValue');
const historyList = document.getElementById('historyList');
const strengthLabel = document.getElementById('strengthLabel');
const segments = [
    document.getElementById('seg1'),
    document.getElementById('seg2'),
    document.getElementById('seg3'),
    document.getElementById('seg4')
];

// Options
const options = {
    upper: document.getElementById('includeUppercase'),
    lower: document.getElementById('includeLowercase'),
    number: document.getElementById('includeNumbers'),
    symbol: document.getElementById('includeSymbols')
};

const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    symbol: '!@#$%^&*()_+~`|}{[]:;?><,./-='
};

// State
let history = JSON.parse(localStorage.getItem('passwordHistory')) || [];

// --- Initialization ---
function init() {
    renderHistory();
    generatePassword();

    // Listeners
    lengthRange.addEventListener('input', (e) => {
        lengthValue.innerText = e.target.value;
        generatePassword();
    });

    Object.values(options).forEach(opt => {
        opt.addEventListener('change', generatePassword);
    });
}

// --- Helpers ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// --- Core Logic ---
function generatePassword() {
    let charset = '';
    if (options.upper.checked) charset += CHARS.upper;
    if (options.lower.checked) charset += CHARS.lower;
    if (options.number.checked) charset += CHARS.number;
    if (options.symbol.checked) charset += CHARS.symbol;

    if (charset === '') {
        passwordOutput.value = '';
        updateStrength('');
        return;
    }

    const length = parseInt(lengthRange.value);
    let password = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }

    passwordOutput.value = password;
    updateStrength(password);
}

function updateStrength(password) {
    if (!password) {
        resetStrength();
        return;
    }

    let score = 0;
    if (password.length > 8) score++;
    if (password.length > 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Normalize to 0-4
    let level = 0;
    if (score > 6) level = 4;
    else if (score > 4) level = 3;
    else if (score > 2) level = 2;
    else level = 1;

    // Update UI
    segments.forEach((seg, i) => {
        if (i < level) {
            seg.classList.add('filled');
            seg.style.backgroundColor = getStrengthColor(level);
        } else {
            seg.classList.remove('filled');
            seg.style.backgroundColor = '';
        }
    });

    strengthLabel.innerText = getStrengthText(level);
    strengthLabel.style.color = getStrengthColor(level);
}

function getStrengthColor(level) {
    if (level === 1) return '#ff4d4d'; // Weak
    if (level === 2) return '#ffa600'; // Fair
    if (level === 3) return '#00ff88'; // Strong
    if (level === 4) return '#00ccff'; // Very Strong
    return '#ccc';
}

function getStrengthText(level) {
    if (level === 1) return t('pass_strength_weak');
    if (level === 2) return t('pass_strength_med');
    if (level === 3) return t('pass_strength_strong');
    if (level === 4) return t('pass_strength_very_strong');
    return '-';
}

function resetStrength() {
    segments.forEach(seg => {
        seg.classList.remove('filled');
        seg.style.backgroundColor = '';
    });
    strengthLabel.innerText = '-';
}

// --- UI Actions ---
function toggleOption(id) {
    const checkbox = document.getElementById(id);
    const card = checkbox.parentElement;

    // Prevent unchecking the last one
    const checkedCount = Object.values(options).filter(o => o.checked).length;
    if (checkedCount === 1 && checkbox.checked) {
        playSound('error');
        return;
    }

    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        card.classList.add('active');
    } else {
        card.classList.remove('active');
    }

    generatePassword();
    playSound('click');
}

function copyPassword() {
    const password = passwordOutput.value;
    if (!password) return;

    navigator.clipboard.writeText(password).then(() => {
        showToast(t('pass_msg_copied'), 'success');
        playSound('success');
        addToHistory(password);
    });
}

// --- History ---
function addToHistory(password) {
    // Avoid duplicates at top
    if (history[0] === password) return;

    history.unshift(password);
    if (history.length > 10) history.pop();

    localStorage.setItem('passwordHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1rem; font-style: italic;">${t('pass_empty')}</div>`;
        return;
    }

    history.forEach(pass => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-pass">${pass}</div>
            <button class="mini-copy" onclick="copyHistory('${pass}')"><i class="fas fa-copy"></i></button>
        `;
        historyList.appendChild(item);
    });
}

function copyHistory(pass) {
    navigator.clipboard.writeText(pass).then(() => {
        showToast(t('pass_msg_copied'), 'success');
        playSound('success');
    });
}

function clearHistory() {
    history = [];
    localStorage.removeItem('passwordHistory');
    renderHistory();
    playSound('trash');
}

// Start
init();
