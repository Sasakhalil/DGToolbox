import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = true;

/**
 * AI Grammar Fixer Logic - Ultra Edition
 * Updated model to LaMini-Flan-T5-77M for superior instruction following.
 * Added aggressive Regex Pre-processor for common typos.
 */

const MODEL_NAME = 'Xenova/LaMini-Flan-T5-77M';
const TASK_NAME = 'text2text-generation';

let fixerPipeline = null;
let isModelLoading = false;

// Expanded Common Typo List (Pre-AI Optimization)
// This catches "Low hanging fruit" so the AI focuses on sentence structure.
const TYPO_MAP = {
    "teh": "the", "wiht": "with", "taht": "that", "becuase": "because", "inteh": "in the",
    "cuz": "because", "u": "you", "ur": "your", "r": "are", "dont": "don't", "cant": "can't",
    "wont": "won't", "im": "I'm", "i": "I", "wat": "what", "wut": "what", "gonna": "going to",
    "wanna": "want to", "gotta": "have to", "thier": "their", "wierd": "weird", "realy": "really",
    "alot": "a lot", "wich": "which"
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let originalTextState = "";
let fixedTextState = "";

function initApp() {
    const btnFix = document.getElementById('btn-fix');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const inputText = document.getElementById('input-text');

    btnFix.addEventListener('click', () => runSmartFix());
    btnClear.addEventListener('click', clearAll);
    btnCopy.addEventListener('click', copyOutput);

    inputText.addEventListener('input', updateWordCount);
    updateWordCount();

    checkFirstRun();
}

function checkFirstRun() {
    const isCached = localStorage.getItem('dg_model_lamini_cached'); // New key for new model
    const alertBox = document.getElementById('download-alert');
    if (!isCached && alertBox) {
        alertBox.style.display = 'flex';
    }
}

async function loadModel() {
    if (fixerPipeline) return true;
    if (isModelLoading) return false;

    isModelLoading = true;

    // Show Full Screen Loader
    const overlay = document.getElementById('ai-loader-overlay');
    const progressBar = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');

    // Reset loader state
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0% Ready';

    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);

    const btn = document.getElementById('btn-fix');
    btn.disabled = true;

    try {
        fixerPipeline = await pipeline(TASK_NAME, MODEL_NAME, {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    const pct = Math.round(data.progress || 0);
                    progressBar.style.width = pct + '%';
                    progressText.textContent = `${pct}% Ready`;
                }
            }
        });

        isModelLoading = false;
        localStorage.setItem('dg_model_lamini_cached', 'true');

        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 500);

        const alertBox = document.getElementById('download-alert');
        if (alertBox) alertBox.remove();

        btn.disabled = false;
        updateStatus('Brain Active 🧠', 'success');
        return true;
    } catch (err) {
        console.error("AI Load Failed:", err);
        isModelLoading = false;
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 500);

        btn.disabled = false;
        showToast('Download Failed. Check Internet.', 'error');
        return false;
    }
}

async function runSmartFix() {
    const input = document.getElementById('input-text');
    let raw = input.value;

    if (!raw.trim()) {
        showToast("Please enter some text first!", "error");
        return;
    }

    // 1. Ensure Model Loads
    if (!fixerPipeline) {
        const loaded = await loadModel();
        if (!loaded) return; // Stop if failed
    }

    setLoading(true);

    // 2. Pre-process: Catch Obvious Typos BEFORE AI
    // This helps the logic not get stuck on very bad spelling
    raw = preProcessTypos(raw);

    try {
        // 3. Super Prompt
        // 'Correct this text:' is a strong simple instruction for LaMini
        // Sometimes repeating the instruction helps.
        const prompt = `Correct the grammar and spelling: ${raw}`;

        const result = await fixerPipeline(prompt, {
            max_new_tokens: 300,
            temperature: 0.1, // Creative enough to fix spelling, strict enough to keep meaning
            repetition_penalty: 1.2,
            do_sample: false
        });

        let fixedText = result[0].generated_text;

        // Clean up artifacts
        if (fixedText.toLowerCase().startsWith('output:')) fixedText = fixedText.substring(7).trim();

        // Final sanity check: if AI output is shorter than 50% of input, meaningful data might be lost. 
        // In that case, maybe fallback or user warning? For now, we trust LaMini.

        originalTextState = raw;
        fixedTextState = fixedText;

        renderOutput(fixedText);
        updateStats(true);
        playSuccessSound();

    } catch (err) {
        console.error("Inference Error:", err);
        showToast("AI Brain Error.", "error");
    } finally {
        setLoading(false);
    }
}

/**
 * Replaces common internet slang and typos immediately using regex.
 * This is "Layer 1" correction.
 */
function preProcessTypos(text) {
    let t = text;
    // Sentence Case start
    t = t.replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());

    // Map replacement
    const words = t.split(/(\s+|[.,!?;])/);
    const correctedWords = words.map(w => {
        const lower = w.toLowerCase();
        if (TYPO_MAP[lower]) return TYPO_MAP[lower];
        return w;
    });

    return correctedWords.join('');
}

function renderOutput(text) {
    const outDiv = document.getElementById('diff-output');
    outDiv.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = text;
    span.className = 'fade-in';
    outDiv.appendChild(span);
}

function updateStats(isAI) {
    const statsEl = document.getElementById('stats-bar');
    statsEl.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <span style="color:var(--accent-color); font-weight:bold;">
                <i class="fas fa-check-double"></i> Fixed
            </span>
            <span style="color:var(--text-secondary); font-size:0.85rem;">(AI + Typo Engine)</span>
        </div>
    `;
}

function updateStatus(msg, type) {
    const statsEl = document.getElementById('stats-bar');
    let color = '#fff';
    if (type === 'info') color = 'var(--accent-color)';
    if (type === 'success') color = 'var(--success-color)';
    statsEl.innerHTML = `<span style="color:${color}">${msg}</span>`;
}

function updateWordCount() {
    const text = document.getElementById('input-text').value || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('word-count').textContent = `${words} words`;
}

function setLoading(isLoading) {
    const btn = document.getElementById('btn-fix');
    if (isLoading) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Intelligent Fix...';
        btn.disabled = true;
    } else {
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Fix Errors';
        btn.disabled = false;
    }
}

function clearAll() {
    document.getElementById('input-text').value = '';
    document.getElementById('diff-output').textContent = '';
    document.getElementById('stats-bar').innerHTML = '';
    updateWordCount();
    document.getElementById('input-text').focus();
}

function copyOutput() {
    if (!fixedTextState) return;
    navigator.clipboard.writeText(fixedTextState).then(() => {
        showToast('Copied to clipboard!');
    });
}

function showToast(msg, type = 'success') {
    if (window.showToast) window.showToast(msg, type);
    else alert(msg);
}

function playSuccessSound() {
    if (window.playSound) window.playSound('success');
}
