/**
 * AI Text Summarizer - Ultimate Edition (v3)
 * Features: 
 * - Enhanced "TextRank-Lite" Algorithm (Position, cues, frequency clusters)
 * - Distinct summarization levels
 * - Detailed Analytics (Time saved, reduction %)
 * - Robust Bi-directional Support (AR/EN)
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

const APP_STATE = {
    lang: 'en',
    sentences: [],
    stats: {
        originalWords: 0,
        summaryWords: 0,
        percent: 0
    }
};

const CONSTANTS = {
    // English Stop Words
    STOP_EN: new Set([
        'the', 'is', 'in', 'at', 'of', 'on', 'and', 'a', 'an', 'to', 'for', 'with', 'it', 'that', 'this', 'was', 'as', 'are', 'be', 'by', 'not', 'or', 'but', 'from', 'have', 'has', 'had', 'they', 'we', 'you', 'my', 'their', 'which', 'who', 'whom', 'whose', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
    ]),

    // Arabic Stop Words (Expanded)
    STOP_AR: new Set([
        'في', 'من', 'على', 'ان', 'أن', 'هذا', 'هذه', 'تم', 'كان', 'كانت', 'التي', 'الذي', 'مع', 'عن', 'ما', 'هو', 'هي', 'لا', 'لم', 'لن', 'و', 'أو', 'ثم',
        'إلى', 'بين', 'ذلك', 'عند', 'حيث', 'فإن', 'كما', 'لكن', 'هل', 'ليست', 'ليس', 'فقط', 'وقد', 'أيضا', 'كل', 'بعد', 'قبل', 'حتى', 'إذا', 'نحو', 'أكثر',
        'اي', 'أنا', 'نحن', 'هم', 'هي', 'هو', 'انت', 'أنت', 'تلك', 'هؤلاء', 'كيف', 'متى', 'لماذا', 'ماذا', 'لقد', 'عندما', 'طالما', 'أي', 'أين', 'إذ', 'إلا'
    ]),

    // Important "Cue" words that signify summary-worthy sentences
    CUES_EN: ['conclusion', 'summary', 'result', 'therefore', 'thus', 'significantly', 'important', 'key', 'finally', 'shown', 'demonstrates', 'consequence'],
    CUES_AR: ['الخلاصة', 'النتيجة', 'وبالتالي', 'ختاما', 'نستنتج', 'أخيرا', 'المهم', 'ملخص', 'الجدير', 'يذكر', 'أساس', 'تظهر', 'يتبين'],

    // CONNECTORS: Semantic glue to make extractive summaries flow like generative text
    CONNECTORS_EN: [
        'Furthermore,', 'In addition,', 'It is worth noting that', 'Moreover,', 'Consequently,', 'On the other hand,', 'Specifically,', 'As a result,', 'Needless to say,'
    ],
    CONNECTORS_AR: [
        'علاوة على ذلك،', 'ومن الجدير بالذكر أن', 'إضافة إلى ذلك،', 'وبالتالي،', 'من ناحية أخرى،', 'وفي هذا السياق،', 'كما نلاحظ أن', 'ونتيجة لذلك،', 'هذا ويؤكد النص أن'
    ]
};

function initApp() {
    // UI Elements
    const btnSummarize = document.getElementById('btn-summarize');
    const inputSlider = document.getElementById('summary-length');
    const btnSpeak = document.getElementById('btn-speak');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');

    // Listeners
    btnSummarize.addEventListener('click', processText);
    inputSlider.addEventListener('input', updateLabel);
    btnSpeak.addEventListener('click', toggleSpeech);
    btnCopy.addEventListener('click', copyOutput);
    btnClear.addEventListener('click', clearAll);

    document.getElementById('input-text').addEventListener('input', () => {
        updateStats(document.getElementById('input-text').value, '');
    });
}

// ==========================================
// CORE ALGORITHM: Analyzes and Ranks Sentences
// ==========================================

async function processText() {
    const rawText = document.getElementById('input-text').value.trim();
    const lengthLevel = parseInt(document.getElementById('summary-length').value); // 1-10

    if (!rawText) {
        showToast('Please enter text first!', 'error');
        return;
    }

    setLoading(true);

    // UX Delay
    await new Promise(r => setTimeout(r, 600));

    try {
        // 1. Detect Language
        APP_STATE.lang = /[\u0600-\u06FF]/.test(rawText) ? 'ar' : 'en';

        // 2. Preprocess & Split
        const sentences = splitSentences(rawText);
        if (sentences.length < 2) {
            setLoading(false);
            showToast('Text is too short to summarize.', 'warn');
            renderOutput(rawText);
            return;
        }

        // 3. Analyze Frequency (TF)
        const wordFreq = calculateWordFrequency(sentences);

        // 4. Score Sentences
        const rankedSentences = sentences.map((sent, index) => {
            return {
                text: sent,
                index: index,
                score: calculateSentenceScore(sent, wordFreq, index, sentences.length)
            };
        });

        // 5. Select Top Sentences based on Slider
        const summary = selectSentences(rankedSentences, lengthLevel);

        // 6. Output & Stats
        renderOutput(summary);
        updateStats(rawText, summary);
        extractKeywords(wordFreq);

    } catch (err) {
        console.error(err);
        showToast('Failed to generate summary.', 'error');
    } finally {
        setLoading(false);
    }
}

function splitSentences(text) {
    // Robust splitting:
    // 1. Replace uncommon punctuation
    let clean = text.replace(/[\u2026\u2025]/g, '.'); // Ellipsis replacement

    // 2. Match sentence delimiters (. ? ! or Arabic equivalent) followed by whitespace or EOF
    const matches = clean.match(/[^.!?؟\n]+[.!?؟\n]+(\s+|$)/g);

    if (matches && matches.length > 0) return matches;

    // Fallback: Split by newline if structured as list
    const byLine = clean.split(/\n+/).filter(s => s.trim().length > 15);
    if (byLine.length > 0) return byLine;

    // Fallback 2: Return as one chunk if no delimiters found
    return [clean];
}

function calculateWordFrequency(sentences) {
    const freq = {};
    const stopWords = APP_STATE.lang === 'ar' ? CONSTANTS.STOP_AR : CONSTANTS.STOP_EN;

    sentences.forEach(s => {
        const words = tokenise(s);
        words.forEach(w => {
            if (!stopWords.has(w) && w.length > 2 && isNaN(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        });
    });
    return freq;
}

function tokenise(str) {
    return str.toLowerCase().replace(/[.,!?:;؟،"()]/g, ' ').split(/\s+/).filter(w => w);
}

function calculateSentenceScore(sentence, wordFreq, index, totalSentences) {
    const words = tokenise(sentence);
    const stopWords = APP_STATE.lang === 'ar' ? CONSTANTS.STOP_AR : CONSTANTS.STOP_EN;
    const cues = APP_STATE.lang === 'ar' ? CONSTANTS.CUES_AR : CONSTANTS.CUES_EN;

    let score = 0;
    let validWords = 0;

    // A. Keyword Importance
    words.forEach(w => {
        if (!stopWords.has(w) && wordFreq[w]) {
            score += wordFreq[w];
            validWords++;
        }
    });

    // Normalize by length (prevent long sentences from dominating)
    if (validWords > 0) score = score / Math.pow(validWords, 0.5); // Soft normalization

    // B. Position Boosting
    // First sentence of document is usually the thesis
    if (index === 0) score *= 2.0;
    // Last sentence is often conclusion
    if (index === totalSentences - 1) score *= 1.5;
    // First sentences of paragraphs (heuristic: often starts with newline in raw text, 
    // but here we just use top 10% as proxy for "early context")
    if (index < totalSentences * 0.1) score *= 1.2;

    // C. Cue Words (Indicators)
    const hasCue = cues.some(cue => sentence.toLowerCase().includes(cue));
    if (hasCue) score *= 1.4;

    // D. Numeric Data (Facts)
    if (/\d+/.test(sentence)) score *= 1.1;

    return score;
}

function selectSentences(rankedItems, level) {
    // New Aggressive Curve: Power curve to favor reduction
    const x = level / 10;
    const curve = Math.pow(x, 1.5); // convex curve

    // Base count calculation
    let count = Math.round(rankedItems.length * curve);

    // Enforce constraints
    if (level < 10) {
        // Reduced levels: try to remove at least one sentence
        if (rankedItems.length > 2) {
            count = Math.min(count, rankedItems.length - 1);
        }
        // But keep at least 1
        count = Math.max(1, count);
    } else {
        count = rankedItems.length;
    }

    // Get Top Sentences
    const top = [...rankedItems].sort((a, b) => b.score - a.score).slice(0, count);

    // Sort chronologically
    top.sort((a, b) => a.index - b.index);

    // SMART FLOW GENERATION
    if (level >= 3 && level < 10) {
        return weaveText(top);
    }

    return top.map(item => item.text.trim()).join(' ');
}

function weaveText(items) {
    const connectors = APP_STATE.lang === 'ar' ? CONSTANTS.CONNECTORS_AR : CONSTANTS.CONNECTORS_EN;
    let text = "";

    items.forEach((item, idx) => {
        let sentence = item.text.trim();

        // Don't add connector to first sentence
        if (idx > 0) {
            // Logic: Add connector if there was a gap in original text (meaning we skipped something)
            // or just randomly to improve flow.
            const prevIndex = items[idx - 1].index;
            const jump = item.index - prevIndex;
            const isGap = jump > 1;

            // 40% chance if no gap, 80% if gap
            const chance = isGap ? 0.8 : 0.4;

            if (Math.random() < chance) {
                const conn = connectors[Math.floor(Math.random() * connectors.length)];

                // Add connector
                text += " " + conn + " ";

                // For English, lowercase the next word if not proper noun
                if (APP_STATE.lang === 'en' && /[A-Z]/.test(sentence[0]) && sentence.length > 1) {
                    // Simple heuristic: don't lowercase 'I' or 'USA'
                    if (sentence.split(' ')[0] !== 'I') {
                        sentence = sentence.charAt(0).toLowerCase() + sentence.slice(1);
                    }
                }
            } else {
                text += " ";
            }
        }
        text += sentence;
    });

    return text;
}

// ==========================================
// UI & UTILS
// ==========================================

function renderOutput(text) {
    const out = document.getElementById('output-text');
    out.innerHTML = ''; // clear

    // Type out nicely
    let i = 0;
    out.classList.add('typing');
    // Chunk typing for speed
    const step = 4;
    function type() {
        if (i < text.length) {
            out.textContent += text.substring(i, i + step);
            i += step;
            out.scrollTop = out.scrollHeight;
            if (out.classList.contains('typing')) requestAnimationFrame(type);
        } else {
            out.classList.remove('typing');
        }
    }
    type();
}

function updateStats(original, summary) {
    const cw = str => str.trim().split(/\s+/).filter(x => x).length;

    const c1 = cw(original);
    const c2 = cw(summary);

    // If no summary yet (just typing input)
    if (!summary) {
        document.getElementById('stat-input-words').textContent = `${c1} words`;
        document.getElementById('stat-input-chars').textContent = `${original.length} chars`;
        return;
    }

    // Full Stats
    const reducedPct = c1 > 0 ? Math.round(((c1 - c2) / c1) * 100) : 0;
    const factor = APP_STATE.lang === 'ar' ? 130 : 200; // wpm
    const timeOriginal = Math.ceil(c1 / factor);
    const timeSummary = Math.ceil(c2 / factor);
    const timeSaved = Math.max(0, timeOriginal - timeSummary);

    // Inject rich HTML stats
    const statsHTML = `
        <span class="stat-tag" style="color:#ff4757"><i class="fas fa-cut"></i> -${reducedPct}% Content</span>
        <span class="stat-tag" style="color:#2ed573"><i class="fas fa-hourglass-half"></i> Saved ${timeSaved} min</span>
        <span class="stat-tag" style="color:#ffa502"><i class="fas fa-file-alt"></i> ${c2} / ${c1} Words</span>
    `;

    document.getElementById('stat-reduction').innerHTML = statsHTML;
    document.getElementById('stat-reading-time').style.display = 'none'; // Replaced by detailed line above
}

function extractKeywords(freqMap) {
    const keys = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]).slice(0, 6);
    const container = document.getElementById('keywords-container');
    container.innerHTML = keys.map(k => `<span class="keyword-chip">#${k}</span>`).join(' ');
}

function updateLabel() {
    const val = document.getElementById('summary-length').value;
    const labels = {
        1: 'Extreme (Highlights)',
        2: 'Very Short',
        3: 'Short',
        4: 'Concise',
        5: 'Balanced',
        6: 'Detailed',
        7: 'Extensive',
        8: 'Comprehensive',
        9: 'Near Full',
        10: 'Original Text'
    };
    document.getElementById('length-label').textContent = labels[val] || 'Custom';
}

function toggleSpeech() {
    const text = document.getElementById('output-text').textContent;
    if (!text) return;

    if (window.audioManager) {
        window.audioManager.speak(text, APP_STATE.lang === 'ar' ? 'ar-SA' : 'en-US');
    } else {
        // Fallback if AudioManager is missing
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = APP_STATE.lang === 'ar' ? 'ar-SA' : 'en-US';
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
    }
}

function copyOutput() {
    const t = document.getElementById('output-text').textContent;
    if (t) navigator.clipboard.writeText(t).then(() => showToast('Copied!'));
}

function clearAll() {
    document.getElementById('input-text').value = '';
    document.getElementById('output-text').textContent = '';
    document.getElementById('keywords-container').innerHTML = '';
    updateStats('', '');
}

function setLoading(b) {
    const btn = document.getElementById('btn-summarize');
    const loader = document.getElementById('ai-loader');
    if (b) {
        btn.disabled = true;
        loader.classList.add('active');
    } else {
        btn.disabled = false;
        loader.classList.remove('active');
    }
}

function showToast(msg, type) {
    if (window.showToast) window.showToast(msg, type);
    else alert(msg);
}
