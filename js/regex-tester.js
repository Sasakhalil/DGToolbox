const regexPattern = document.getElementById('regexPattern');
const replacePattern = document.getElementById('replacePattern');
const testString = document.getElementById('testString');
const regexOutput = document.getElementById('regexOutput');
const replaceOutput = document.getElementById('replaceOutput');
const matchCountBadge = document.getElementById('matchCountBadge');
const matchList = document.getElementById('matchList');
const flagBtns = document.querySelectorAll('.flag-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const replaceSection = document.getElementById('replaceSection');
const replaceResultSection = document.getElementById('replaceResultSection');
const explanationText = document.getElementById('explanationText');

// State
let activeFlags = new Set(['g']); // Default global
let currentMode = 'match'; // 'match' or 'replace'

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
    setupFlags();
    setupModes();
    setupListeners();
    runRegex();
}

// --- Event Listeners ---
function setupListeners() {
    regexPattern.addEventListener('input', runRegex);
    replacePattern.addEventListener('input', runRegex);
    testString.addEventListener('input', runRegex);

    // Scroll Sync
    testString.addEventListener('scroll', () => {
        regexOutput.scrollTop = testString.scrollTop;
        regexOutput.scrollLeft = testString.scrollLeft;
    });
}

// --- Mode Switching ---
function setupModes() {
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.dataset.mode;

            // Update UI
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (currentMode === 'replace') {
                replaceSection.style.display = 'block';
                replaceResultSection.style.display = 'block';
            } else {
                replaceSection.style.display = 'none';
                replaceResultSection.style.display = 'none';
            }

            playSound('switch');
            runRegex();
        });
    });
}

// --- Flags Handling ---
function setupFlags() {
    flagBtns.forEach(btn => {
        const flag = btn.dataset.flag;
        if (activeFlags.has(flag)) btn.classList.add('active');

        btn.addEventListener('click', () => {
            if (activeFlags.has(flag)) {
                activeFlags.delete(flag);
                btn.classList.remove('active');
            } else {
                activeFlags.add(flag);
                btn.classList.add('active');
            }
            runRegex();
            playSound('switch');
        });
    });
}

function getFlagsString() {
    return Array.from(activeFlags).join('');
}

// --- Core Regex Logic ---
function runRegex() {
    const pattern = regexPattern.value;
    const flags = getFlagsString();
    const text = testString.value;
    const replaceText = replacePattern.value;

    // Clear previous results
    matchList.innerHTML = '';

    // Update Explanation
    updateExplanation(pattern, flags);

    if (!pattern || !text) {
        regexOutput.innerHTML = escapeHtml(text);
        matchCountBadge.innerText = `0 ${t('regex_matches')}`;
        matchList.innerHTML = `<div class="empty-state">${t('regex_no_matches')}</div>`;
        replaceOutput.innerText = '';
        return;
    }

    try {
        const regex = new RegExp(pattern, flags);
        let matchCountVal = 0;
        let highlighted = '';
        let lastIndex = 0;
        let matchesData = [];

        // --- Matching Logic ---
        if (flags.includes('g')) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                matchCountVal++;

                matchesData.push({
                    index: match.index,
                    text: match[0],
                    groups: match.slice(1)
                });

                highlighted += escapeHtml(text.substring(lastIndex, match.index));
                highlighted += `<span class="highlight">${escapeHtml(match[0])}</span>`;
                lastIndex = regex.lastIndex;

                if (match.index === regex.lastIndex) regex.lastIndex++;
            }
            highlighted += escapeHtml(text.substring(lastIndex));
        } else {
            const match = regex.exec(text);
            if (match) {
                matchCountVal = 1;
                matchesData.push({
                    index: match.index,
                    text: match[0],
                    groups: match.slice(1)
                });

                highlighted += escapeHtml(text.substring(0, match.index));
                highlighted += `<span class="highlight">${escapeHtml(match[0])}</span>`;
                highlighted += escapeHtml(text.substring(match.index + match[0].length));
            } else {
                highlighted = escapeHtml(text);
            }
        }

        regexOutput.innerHTML = highlighted;
        matchCountBadge.innerText = `${matchCountVal} ${t('regex_matches')}`;

        // --- Sidebar Population ---
        if (matchCountVal > 0) {
            matchList.innerHTML = matchesData.map((m, i) => `
                <div class="match-item">
                    <div style="font-weight: bold; color: var(--text-primary);">${t('regex_match_prefix')} ${i + 1}: <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px;">${escapeHtml(m.text)}</span></div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Index: ${m.index}</div>
                    ${m.groups.length > 0 ?
                    m.groups.map((g, gi) => `<span class="group-info">${t('regex_group_prefix')} ${gi + 1}: ${escapeHtml(g || 'undefined')}</span>`).join('')
                    : ''}
                </div>
            `).join('');

            trackToolUsage('Regex Tester');
        } else {
            matchList.innerHTML = `<div class="empty-state">${t('regex_no_matches')}</div>`;
        }

        // --- Replace Logic ---
        if (currentMode === 'replace') {
            try {
                const result = text.replace(regex, replaceText);
                replaceOutput.innerText = result;
            } catch (e) {
                replaceOutput.innerText = "Error in replacement";
            }
        }

    } catch (e) {
        regexOutput.innerHTML = `<span style="color: var(--danger-color)">${t('regex_err')}: ${escapeHtml(e.message)}</span>`;
        matchCountBadge.innerText = 'Error';
        matchList.innerHTML = `<div style="color: var(--danger-color); padding: 1rem;">${escapeHtml(e.message)}</div>`;
    }
}

// --- Helper Functions ---
function updateExplanation(pattern, flags) {
    if (!pattern) {
        explanationText.innerText = t('regex_expl_placeholder');
        return;
    }
    // Very basic explanation logic
    let explanation = `${t('regex_pattern_prefix')}: /${pattern}/${flags}`;
    if (flags.includes('g')) explanation += ` • ${t('regex_flags_global')}`;
    if (flags.includes('i')) explanation += ` • ${t('regex_flags_ignore')}`;
    if (flags.includes('m')) explanation += ` • ${t('regex_flags_multiline')}`;

    explanationText.innerText = explanation;
}

function insertToken(token) {
    const input = regexPattern;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    input.value = text.substring(0, start) + token + text.substring(end);
    input.selectionStart = input.selectionEnd = start + token.length;
    input.focus();

    runRegex();
    playSound('click');
}

function clearText() {
    testString.value = '';
    runRegex();
    playSound('click');
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    const text = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? el.value : el.innerText;

    navigator.clipboard.writeText(text).then(() => {
        showToast(t('json_msg_copied')); // Resusing common copy message
        playSound('success');
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Start
init();
