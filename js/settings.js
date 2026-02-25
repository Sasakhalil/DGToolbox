/* Elements */
const themeSelect = document.getElementById('themeSelect');
const languageSelect = document.getElementById('languageSelect');
const layoutSelect = document.getElementById('layoutSelect');
const accentOptions = document.getElementById('accentOptions');
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const densitySelect = document.getElementById('densitySelect');
const animProfileSelect = document.getElementById('animProfileSelect');
const energyModeSelect = document.getElementById('energyModeSelect');
const masterMuteToggle = document.getElementById('masterMuteToggle');
const soundThemeSelect = document.getElementById('soundThemeSelect');
const ambientVolumeSlider = document.getElementById('ambientVolumeSlider');
const ambientTrackSelect = document.getElementById('ambientTrackSelect'); // Added
const voiceVolumeSlider = document.getElementById('voiceVolumeSlider'); // Added
const ambientToggle = document.getElementById('ambientToggle');


const ACCENTS = ['#00c8ff', '#ff4d4d', '#00ff88', '#ffd700', '#ff00ff', '#ffffff'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    generateAccentOptions();
});

function initSettings() {
    const settings = JSON.parse(localStorage.getItem('dg_settings')) || {};

    // Level 1 (Theme)
    // Sync Hidden Select
    if (themeSelect) {
        themeSelect.value = settings.themeMode || 'dark';
        updateVisualThemeGrid(settings.themeMode || 'dark');
    }

    languageSelect.value = settings.language || 'en';
    applyTheme(settings.themeMode || 'dark');

    // Level 2 (Font)
    if (settings.fontSize) {
        const size = parseInt(settings.fontSize);
        fontSizeRange.value = size;
        fontSizeValue.innerText = size + 'px';
        document.documentElement.style.setProperty('--font-size-base', size + 'px');
    }
    fontFamilySelect.value = settings.fontFamily || "'Inter', sans-serif";
    document.body.style.fontFamily = settings.fontFamily || "'Inter', sans-serif";

    // Level 3
    densitySelect.value = settings.density || 'comfortable';
    document.body.className = document.body.className.replace(/density-\w+/g, '') + ' density-' + (settings.density || 'comfortable');

    layoutSelect.value = settings.layout || 'grid';

    // Level 4
    animProfileSelect.value = settings.animProfile || 'normal';
    document.body.className = document.body.className.replace(/anim-\w+/g, '') + ' anim-' + (settings.animProfile || 'normal');

    energyModeSelect.value = settings.energyMode || 'balanced';
    document.body.className = document.body.className.replace(/energy-\w+/g, '') + ' energy-' + (settings.energyMode || 'balanced');

    // Audio Studio
    if (!window.audioManager) {
        const script = document.createElement('script');
        script.src = 'audio-manager.js';
        document.head.appendChild(script);
        script.onload = () => {
            masterMuteToggle.checked = !window.audioManager.settings.muted; // Fix: Checked = !Muted
            soundThemeSelect.value = window.audioManager.settings.theme;
            ambientToggle.checked = window.audioManager.settings.ambientEnabled;
            ambientVolumeSlider.value = window.audioManager.settings.ambientVolume;
            if (document.getElementById('voiceVolumeSlider')) {
                document.getElementById('voiceVolumeSlider').value = window.audioManager.settings.voiceVolume;
            }
            if (document.getElementById('sfxVolumeSlider')) {
                document.getElementById('sfxVolumeSlider').value = window.audioManager.settings.sfxVolume;
            }
        }
    }
}

// --- Theme Grid Helpers ---
function selectVisualTheme(mode) {
    themeSelect.value = mode;
    updateVisualThemeGrid(mode);
    updateTheme(); // Call original update
}

function updateVisualThemeGrid(activeMode) {
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === activeMode) {
            card.classList.add('active');
        }
    });
}

function generateAccentOptions() {
    accentOptions.innerHTML = '';
    const currentAccent = localStorage.getItem('dg_accent') || '#00c8ff';

    ACCENTS.forEach(color => {
        const div = document.createElement('div');
        div.className = `color-swatch ${color === currentAccent ? 'active' : ''}`;
        div.style.backgroundColor = color;
        div.onclick = () => setAccent(color);
        accentOptions.appendChild(div);
    });
}

function setAccent(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('dg_accent', color);
    generateAccentOptions();
    saveSettings();
}

// --- Save & Update Functions ---

function saveSettings() {
    const settings = {
        themeMode: themeSelect.value,
        language: languageSelect.value,
        fontSize: fontSizeRange.value,
        fontFamily: fontFamilySelect.value,
        density: densitySelect.value,
        layout: layoutSelect.value,
        animProfile: animProfileSelect.value,
        energyMode: energyModeSelect.value,
        // experimental removed
    };
    localStorage.setItem('dg_settings', JSON.stringify(settings));
}

function updateTheme() {
    const mode = themeSelect.value;
    applyTheme(mode);
    saveSettings();
}

function applyTheme(mode) {
    document.body.classList.remove('light-mode', 'amoled-mode', 'flat-mode', 'neon-mode', 'cyber-mode', 'retro-mode', 'pastel-mode');

    if (mode === 'light') document.body.classList.add('light-mode');
    else if (mode === 'amoled') document.body.classList.add('amoled-mode');
    else if (mode === 'flat') document.body.classList.add('flat-mode');
    else if (mode === 'neon') document.body.classList.add('neon-mode');
    else if (mode === 'cyber') document.body.classList.add('cyber-mode');
    else if (mode === 'retro') document.body.classList.add('retro-mode');
    else if (mode === 'pastel') document.body.classList.add('pastel-mode');
}

function updateLanguage() {
    saveSettings();
    showToast(languageSelect.value === 'ar' ? 'تم حفظ اللغة' : 'Language Saved', 'success');
    setTimeout(() => location.reload(), 500);
}

function updateFontSize() {
    const size = fontSizeRange.value;
    fontSizeValue.innerText = size + 'px';
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
    document.body.style.fontSize = size + 'px'; // Fallback
    saveSettings();
}

function updateFontFamily() {
    document.body.style.fontFamily = fontFamilySelect.value;
    saveSettings();
}

function updateDensity() {
    const density = densitySelect.value;
    document.body.className = document.body.className.replace(/density-\w+/g, '') + ' density-' + density;
    saveSettings();
}

function updateLayout() {
    saveSettings();
}

function updateAnimProfile() {
    const profile = animProfileSelect.value;
    document.body.className = document.body.className.replace(/anim-\w+/g, '') + ' anim-' + profile;
    saveSettings();
}

function updateEnergyMode() {
    const mode = energyModeSelect.value;
    document.body.className = document.body.className.replace(/energy-\w+/g, '') + ' energy-' + mode;
    saveSettings();
}

// --- Audio Functions ---

// --- Audio Functions ---

function toggleMasterMute() {
    if (window.audioManager) {
        // Switch ON = Audio Enabled (Not Muted)
        // Switch OFF = Audio Disabled (Muted)
        window.audioManager.toggleMute(!masterMuteToggle.checked);
    }
}

function updateSoundTheme() {
    if (window.audioManager) {
        window.audioManager.setTheme(soundThemeSelect.value);
        window.audioManager.playSound('switch');
    }
}

function previewSound() {
    if (window.audioManager) {
        window.audioManager.playSound('success');
    }
}

function toggleAmbient() {
    if (window.audioManager) {
        window.audioManager.toggleAmbient(ambientToggle.checked);
    }
}

function updateAmbientTrack() {
    if (window.audioManager) {
        const val = ambientTrackSelect.value;
        if (val === 'custom') {
            document.getElementById('customAudioInput').click();
        } else if (val === 'stream_quran') {
            window.audioManager.setStreamUrl('https://server10.mp3quran.net/ares/001.mp3'); // Al-Fatiha Loop for now
        } else if (val === 'stream_lofi') {
            window.audioManager.setStreamUrl('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3'); // Royalty Free Lofi
        } else {
            window.audioManager.setAmbientTrack(val);
        }
    }
}

function handleCustomAudio(input) {
    if (input.files && input.files[0]) {
        if (window.audioManager) {
            window.audioManager.setCustomTrack(input.files[0]);
        }
    }
}

function updateVolume(type) {
    if (!window.audioManager) return;

    let val;
    if (type === 'ambient') {
        val = ambientVolumeSlider.value;
        window.audioManager.setVolume('ambient', val);
    } else if (type === 'voice') {
        const slider = document.getElementById('voiceVolumeSlider');
        if (slider) {
            val = slider.value;
            window.audioManager.setVolume('voice', val);
        }
    } else if (type === 'sfx') {
        const slider = document.getElementById('sfxVolumeSlider');
        if (slider) {
            val = slider.value;
            window.audioManager.setVolume('sfx', val);
        }
    }
}



// --- Data Management ---

function exportSettings() {
    const settings = localStorage.getItem('dg_settings');
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dg_settings.json';
    a.click();
}

function importSettings(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            JSON.parse(e.target.result); // Validate JSON
            localStorage.setItem('dg_settings', e.target.result);
            showToast('Settings Imported Successfully', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            showToast('Invalid settings file', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Are you sure? This will reset all settings.')) {
        localStorage.clear();
        showToast('All Data Cleared', 'warning');
        setTimeout(() => location.reload(), 1000);
    }
}
