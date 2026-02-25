// DOM Elements
const urlInput = document.getElementById('urlInput');
// Use querySelector because class might be used, or check HTML.
// HTML has: class="ping-trigger-btn" onclick="startPingSequence()"
// But I might have changed it to ID in my previous HTML restore.
// Let's check HTML restore content (Step 638).
// <button class="ping-trigger-btn" onclick="startPingSequence()">...
// It does NOT have an ID 'startBtn'.
const startBtn = document.querySelector('.ping-trigger-btn');
const radarSweep = document.querySelector('.radar-sweep');
const radarStatus = document.getElementById('radarStatus');
const pingValue = document.getElementById('pingValue');
const minPingEl = document.getElementById('minPing');
const avgPingEl = document.getElementById('avgPing');
const maxPingEl = document.getElementById('maxPing');
const consoleContent = document.getElementById('consoleContent');
const continuousCheck = document.getElementById('continuousPing');

// State
let isPinging = false;
let pingInterval; // Not used in new logic loop, but good to have
let stopSignal = false;

// --- Helpers ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// Load saved URL
const savedUrl = localStorage.getItem('dg_ping_url');
if (savedUrl) urlInput.value = savedUrl;

function setPreset(url) {
    urlInput.value = url;
    startPingSequence();
}

function logToTerminal(msg, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString();
    line.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
    consoleContent.appendChild(line);
    consoleContent.scrollTop = consoleContent.scrollHeight;
}

// Strict Domain Validation Regex
function isValidDomain(domain) {
    const pattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return pattern.test(domain);
}

async function startPingSequence() {
    if (isPinging) {
        // Toggle Stop
        stopSignal = true;
        return;
    }

    let rawInput = urlInput.value.trim();

    // 1. Clean Input
    let domain = rawInput.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // 2. Strict Validation
    if (!isValidDomain(domain)) {
        logToTerminal(t('ping_err_url'), 'error');
        playSound('error');
        return;
    }

    const url = `https://${domain}`;
    localStorage.setItem('dg_ping_url', rawInput);

    // Update UI
    const originalBtnText = startBtn.innerHTML;
    // We want to preserve the icon but change the text.
    // HTML was: <i class="fas fa-satellite-dish"></i> <span data-i18n="ping_btn_start">INITIATE PING</span>

    // Changing status to STOP
    startBtn.innerHTML = `<i class="fas fa-stop"></i> ${t('ping_btn_stop')}`;
    startBtn.classList.add('active'); // Style for stop state if needed

    pingValue.innerText = '---';
    minPingEl.innerText = '--';
    avgPingEl.innerText = '--';
    maxPingEl.innerText = '--';
    radarStatus.innerText = t('ping_status_running');
    radarStatus.style.color = 'var(--accent-color)';
    radarSweep.style.animation = 'radar-spin 1.5s linear infinite';

    isPinging = true;
    stopSignal = false;
    const count = continuousCheck && continuousCheck.checked ? 1000 : 5; // Higher limit for continuous
    const results = [];

    logToTerminal(`${t('ping_status_running')} ${domain}`, 'info');

    for (let i = 0; i < count; i++) {
        if (stopSignal) break;

        radarStatus.innerText = `PING ${i + 1}/${count === 1000 ? '∞' : count}`;

        // Perform the Ping
        const result = await httpPing(url);

        if (result.success) {
            results.push(result.latency);
            pingValue.innerText = result.latency;
            updateStats(results);

            logToTerminal(`Reply from ${domain}: time=${result.latency}ms`, 'success');
            playSound('success');
        } else {
            logToTerminal(`Request timed out.`, 'error');
            playSound('error');
        }

        if (i < count - 1) {
            // Wait 1s but check stop signal
            for (let j = 0; j < 10; j++) {
                if (stopSignal) break;
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    // Reset UI
    startBtn.innerHTML = `<i class="fas fa-satellite-dish"></i> ${t('ping_btn_start')}`;
    startBtn.classList.remove('active');
    radarSweep.style.animation = 'none';
    isPinging = false;

    if (stopSignal) {
        radarStatus.innerText = t('ping_status_stopped');
        radarStatus.style.color = 'var(--text-secondary)';
        logToTerminal(t('ping_status_stopped'), 'warning');
    } else if (results.length > 0) {
        const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);

        radarStatus.innerText = 'ONLINE';
        radarStatus.style.color = 'var(--success-color)';
        logToTerminal(`--- ${domain} ping statistics ---`, 'info');
        logToTerminal(`${t('ping_stat_avg')}: ${avg}ms`, 'success');
        trackToolUsage('Ping Checker');
    } else {
        radarStatus.innerText = 'OFFLINE';
        radarStatus.style.color = 'var(--danger-color)';
        pingValue.innerText = 'ERR';
        logToTerminal(`${t('ping_err_url')}`, 'error');
    }
}

/**
 * HTTP Ping Method
 */
async function httpPing(url) {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Timeout

    try {
        await fetch(url, {
            mode: 'no-cors',
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const end = performance.now();
        return { success: true, latency: Math.round(end - start) };

    } catch (e) {
        clearTimeout(timeoutId);
        return { success: false, latency: null };
    }
}

function updateStats(results) {
    const min = Math.min(...results);
    const max = Math.max(...results);
    const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);

    minPingEl.innerText = min;
    maxPingEl.innerText = max;
    avgPingEl.innerText = avg;
}

// Keyboard Shortcut
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        startPingSequence();
    }
});
