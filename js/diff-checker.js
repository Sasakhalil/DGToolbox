// DOM Elements
const textOld = document.getElementById('textOld');
const textNew = document.getElementById('textNew');
const diffViewer = document.getElementById('diffViewer');
const statsBar = document.getElementById('statsBar');
const inputContainer = document.getElementById('inputContainer');

// --- Helpers ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

function compareText() {
    const oldVal = textOld.value;
    const newVal = textNew.value;

    if (!oldVal && !newVal) {
        showToast(t('diff_msg_nodiff'), 'info'); // Or empty
        return;
    }

    // Check if identical
    if (oldVal === newVal) {
        showToast(t('diff_msg_nodiff'), 'success');
        playSound('success');
        resetView();
        return;
    }

    // Perform Diff
    // Using jsdiff library (loaded in HTML)
    const diff = Diff.diffLines(oldVal, newVal);

    renderDiff(diff);
    updateStats(diff);

    // UI Transition
    statsBar.style.display = 'flex';
    diffViewer.style.display = 'block';

    // Hide input container to focus on result?
    // inputContainer.style.display = 'none'; // Optional UX choice
    // Let's keep inputs visible for editing but maybe scroll to diff.
    diffViewer.scrollIntoView({ behavior: 'smooth' });

    showToast(t('diff_msg_found'), 'info');
    playSound('switch');
    trackToolUsage('Diff Checker');
}

function renderDiff(diff) {
    diffViewer.innerHTML = '';

    let lineNumOld = 1;
    let lineNumNew = 1;

    diff.forEach(part => {
        // part.value is content
        // part.added is true if added
        // part.removed is true if removed

        const lines = part.value.replace(/\n$/, '').split('\n'); // remove trailing newline
        const colorClass = part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-empty';

        lines.forEach(line => {
            const row = document.createElement('div');
            row.className = 'diff-row ' + colorClass;

            let numOld = '';
            let numNew = '';

            if (part.removed) {
                numOld = lineNumOld++;
                numNew = '-';
            } else if (part.added) {
                numOld = '+';
                numNew = lineNumNew++;
            } else {
                numOld = lineNumOld++;
                numNew = lineNumNew++;
            }

            // Highlighting chars? (Advanced, stick to line diff for efficiency)
            let contentHtml = escapeHtml(line);

            // Add gutters
            row.innerHTML = `
                <div class="diff-gutter">${numOld}</div>
                <div class="diff-gutter">${numNew}</div>
                <div class="diff-content">${contentHtml || '&nbsp;'}</div>
            `;

            diffViewer.appendChild(row);
        });
    });
}

function updateStats(diff) {
    let added = 0, removed = 0;
    diff.forEach(part => {
        if (part.added) added += part.count;
        if (part.removed) removed += part.count;
    });

    document.getElementById('statAdded').textContent = '+' + added;
    document.getElementById('statRemoved').textContent = '-' + removed;
    document.getElementById('statChanges').textContent = added + removed;
}

function resetTool() {
    textOld.value = '';
    textNew.value = '';
    resetView();
    playSound('click');
    showToast(t('json_msg_cleared'), 'info');
}

function resetView() {
    diffViewer.style.display = 'none';
    diffViewer.innerHTML = '';
    statsBar.style.display = 'none';
    inputContainer.style.display = 'grid'; // Ensure visible
}

function loadDemo() {
    textOld.value = `function hello() {
    console.log("Hello World");
    return true;
}`;
    textNew.value = `function hello(name) {
    console.log("Hello " + name);
    return true;
}`;
    compareText();
    showToast(t('json_msg_loaded'), 'success');
}

function pasteTo(id) {
    navigator.clipboard.readText().then(text => {
        document.getElementById(id).value = text;
        showToast(t('json_msg_pasted'), 'success');
    });
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
