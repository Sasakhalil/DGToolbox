const markdownInput = document.getElementById('markdownInput');
const htmlPreview = document.getElementById('htmlPreview');
const fileImport = document.getElementById('fileImport');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');

// --- Helpers ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set default content if empty
    if (!markdownInput.value) {
        const lang = document.documentElement.lang || 'en';
        if (lang === 'ar') {
            markdownInput.value = `# مرحباً بك في محرر Markdown المحترف

ابدأ الكتابة لرؤية **المعاينة الحية** على اليسار.

## المميزات
- دعم كامل لـ **Markdown**
- معاينة فورية
- تلوين الأكواد البرمجية:

\`\`\`javascript
function hello() {
  console.log("مرحباً بالعالم!");
}
\`\`\`

> "البساطة هي قمة الرقي." - ليوناردو دافنشي
`;
        } else {
            markdownInput.value = `# Welcome to Pro Markdown Editor

Start typing to see the **live preview** on the right.

## Features
- Full support for **Markdown** syntax
- Real-time preview
- Syntax highlighting for code blocks:

\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`

> "Simplicity is the ultimate sophistication." - Leonardo da Vinci
`;
        }
    }
    updatePreview();
    updateStats();
});

// --- Core Logic ---
function updatePreview() {
    const text = markdownInput.value;

    // Configure Marked.js
    marked.setOptions({
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-',
        breaks: true,
        gfm: true
    });

    try {
        const html = marked.parse(text);
        htmlPreview.innerHTML = html;
        updateStats();
    } catch (e) {
        console.error('Markdown parsing error:', e);
    }
}

function updateStats() {
    const text = markdownInput.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;

    if (wordCount) wordCount.innerHTML = `${words} ${t('md_words')}`;
    if (lineCount) lineCount.innerHTML = `${lines} ${t('md_lines')}`;
}

// --- View Management ---
function toggleView(mode) {
    const editorPane = document.getElementById('editorPane');
    const previewPane = document.getElementById('previewPane');

    editorPane.style.display = 'flex';
    previewPane.style.display = 'flex';

    if (mode === 'editor') {
        previewPane.style.display = 'none';
    } else if (mode === 'preview') {
        editorPane.style.display = 'none';
    }
    // 'split' shows both (default)
}

// --- File Operations ---
if (fileImport) {
    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            markdownInput.value = e.target.result;
            updatePreview();
            showToast(`${t('md_toast_open')}: ${file.name}`);
        };
        reader.readAsText(file);
        fileImport.value = ''; // Reset
    });
}

function clearEditor() {
    const msg = document.documentElement.lang === 'ar' ? 'هل أنت متأكد أنك تريد مسح المحرر؟' : 'Are you sure you want to clear the editor?';
    if (confirm(msg)) {
        markdownInput.value = '';
        updatePreview();
        showToast(t('md_toast_clear'));
    }
}

function downloadMarkdown() {
    const blob = new Blob([markdownInput.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    trackToolUsage('Markdown Editor');
}

// --- Toolbar Formatting ---
function insertFormat(type) {
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    const text = markdownInput.value;
    const selectedText = text.substring(start, end);

    let before = '';
    let after = '';
    let placeholder = '';

    switch (type) {
        case 'bold': before = '**'; after = '**'; placeholder = 'bold text'; break;
        case 'italic': before = '*'; after = '*'; placeholder = 'italic text'; break;
        case 'strikethrough': before = '~~'; after = '~~'; placeholder = 'text'; break;
        case 'h1': before = '# '; placeholder = 'Heading 1'; break;
        case 'h2': before = '## '; placeholder = 'Heading 2'; break;
        case 'h3': before = '### '; placeholder = 'Heading 3'; break;
        case 'list-ul': before = '- '; placeholder = 'List item'; break;
        case 'list-ol': before = '1. '; placeholder = 'List item'; break;
        case 'check': before = '- [ ] '; placeholder = 'Task item'; break;
        case 'code':
            if (selectedText.includes('\n')) {
                before = '```\n'; after = '\n```';
            } else {
                before = '`'; after = '`';
            }
            placeholder = 'code';
            break;
        case 'quote': before = '> '; placeholder = 'Quote'; break;
        case 'link': before = '['; after = '](url)'; placeholder = 'Link text'; break;
        case 'image': before = '!['; after = '](url)'; placeholder = 'Image alt'; break;
        case 'table':
            before = '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |';
            break;
    }

    const insertion = selectedText || placeholder;
    const newText = text.substring(0, start) + before + insertion + after + text.substring(end);

    markdownInput.value = newText;
    updatePreview();
    markdownInput.focus();

    // Restore selection
    // markdownInput.setSelectionRange(start + before.length, start + before.length + insertion.length);
}

// --- Export Functions ---
function copyHtml() {
    const html = marked.parse(markdownInput.value);
    navigator.clipboard.writeText(html).then(() => {
        showToast(t('md_toast_copy'));
        if (window.playSound) window.playSound('success');
    });
}

function downloadHtml() {
    const html = marked.parse(markdownInput.value);
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Markdown</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
img { max-width: 100%; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background-color: #f4f4f4; }
</style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
    trackToolUsage('Markdown Editor');
}

// --- Event Listeners ---
markdownInput.addEventListener('input', updatePreview);

// Sync Scroll (Simple implementation)
markdownInput.addEventListener('scroll', () => {
    const percentage = markdownInput.scrollTop / (markdownInput.scrollHeight - markdownInput.clientHeight);
    htmlPreview.scrollTop = percentage * (htmlPreview.scrollHeight - htmlPreview.clientHeight);
});
