/**
 * DGToolbox Ultimate Audio Engine
 * Version: 3.0 (Cinema-Grade)
 * 
 * Architecture:
 * [Sources] -> [Channel Strips] -> [Master Bus] -> [Destination]
 * 
 * Features:
 * - Procedural Impulse Response Reverb (Space)
 * - Stereo Spread & Panning (Width)
 * - Multi-Layer Synthesis (Transient + Body + Tail)
 * - Dynamic Sidechaining (Ducking)
 * - Master Bus Compression & Limiting
 */

class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = false;

        // --- Master Bus Chain ---
        this.masterGain = this.ctx.createGain();
        this.limiter = this.ctx.createDynamicsCompressor();

        // Limiter Settings (Transparent Safety)
        this.limiter.threshold.value = -1.0;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.1;

        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        // --- FX Bus (Reverb) ---
        this.reverbGain = this.ctx.createGain();
        this.reverbNode = this.ctx.createConvolver();
        this.reverbGain.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);
        this.reverbGain.gain.value = 0.3; // Default Send Level

        // --- Channels ---
        this.sfxGain = this.ctx.createGain(); // UI Sounds
        this.ambienceGain = this.ctx.createGain(); // Background
        this.voiceGain = this.ctx.createGain(); // Speech

        // Routing
        this.sfxGain.connect(this.masterGain);
        this.sfxGain.connect(this.reverbGain); // Send SFX to Reverb

        this.ambienceGain.connect(this.masterGain);
        // Ambience usually doesn't go to reverb to keep it clean, or very little

        this.voiceGain.connect(this.masterGain);
        this.voiceGain.connect(this.reverbGain);

        // --- State ---
        this.settings = {
            masterVolume: 1.0,
            sfxVolume: 1.0,
            voiceVolume: 1.0,
            ambientVolume: 0.5,
            ambientTrack: 'drone',
            theme: 'default',
            muted: true, // Default to Muted (User must enable)
            ambientEnabled: false
        };

        this.activeNodes = [];
        this.ambientNodes = [];
        this.zenTimeout = null;

        // --- Init ---
        this.loadSettings();
        this.generateImpulseResponse(); // Create Reverb Buffer
        this.initInteraction();
        this.updateVolumes();
    }

    // --- Core Setup ---

    initInteraction() {
        const resume = () => {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    this.initialized = true;
                    console.log('Audio Engine: Online');
                });
            }
            if (this.settings.ambientEnabled && this.ambientNodes.length === 0) {
                this.startAmbient();
            }
        };
        ['click', 'keydown', 'touchstart', 'mousemove'].forEach(e =>
            window.addEventListener(e, resume, { once: true })
        );
    }

    generateImpulseResponse() {
        // Create a synthetic reverb tail (decaying noise)
        const duration = 2.0;
        const decay = 2.0;
        const rate = this.ctx.sampleRate;
        const length = rate * duration;
        const impulse = this.ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = i / length;
            // Exponential decay
            const env = Math.pow(1 - n, decay);
            left[i] = (Math.random() * 2 - 1) * env;
            right[i] = (Math.random() * 2 - 1) * env;
        }
        this.reverbNode.buffer = impulse;
    }

    // --- Settings & Volume ---

    loadSettings() {
        try {
            const s = JSON.parse(localStorage.getItem('dg_audio_settings'));
            if (s) this.settings = { ...this.settings, ...s };
        } catch (e) { }
    }

    saveSettings() {
        localStorage.setItem('dg_audio_settings', JSON.stringify(this.settings));
    }

    updateVolumes() {
        const t = this.ctx.currentTime;
        const ramp = 0.1;

        const master = this.settings.muted ? 0 : this.settings.masterVolume;
        this.masterGain.gain.setTargetAtTime(master, t, ramp);

        this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, t, ramp);
        this.voiceGain.gain.setTargetAtTime(this.settings.voiceVolume, t, ramp);

        const amb = this.settings.ambientEnabled ? this.settings.ambientVolume : 0;
        this.ambienceGain.gain.setTargetAtTime(amb, t, 0.5);
    }

    toggleMute(isMuted) {
        // Logic: Input is "isMuted" state. 
        // If toggle is ON (checked), audio is ON (muted=false).
        // If toggle is OFF (unchecked), audio is OFF (muted=true).
        // Wait, usually Toggle ON = Feature Active. 
        // Let's stick to: Toggle Checked = Audio ON.
        this.settings.muted = isMuted;
        this.saveSettings();
        this.updateVolumes();
    }

    setVolume(type, val) {
        if (type === 'master') this.settings.masterVolume = val;
        if (type === 'sfx') this.settings.sfxVolume = val;
        if (type === 'voice') this.settings.voiceVolume = val;
        if (type === 'ambient') this.settings.ambientVolume = val;
        this.saveSettings();
        this.updateVolumes();
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
    }

    setAmbientTrack(track) {
        this.settings.ambientTrack = track;
        this.saveSettings();
        if (this.settings.ambientEnabled) {
            this.stopAmbient();
            this.startAmbient();
        }
    }

    setCustomTrack(file) {
        this.customFile = file;
        this.setAmbientTrack('custom');
    }

    toggleAmbient(enabled) {
        this.settings.ambientEnabled = enabled;
        this.saveSettings();
        if (enabled) this.startAmbient();
        else this.stopAmbient();
        this.updateVolumes();
    }

    // --- Sound Synthesis (The "Cinema" Sound) ---

    play(type) {
        if (this.settings.muted) return; // Master Mute Enforcement
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Sidechain: Duck ambience briefly
        this._duckAmbience();

        const theme = this.settings.theme || 'default';

        // Dispatch to theme generators
        if (theme === 'minimal') this._playMinimal(type);
        else if (theme === 'tech') this._playTech(type);
        else if (theme === 'mechanical') this._playMechanical(type);
        else if (theme === 'bubble') this._playBubble(type);
        else if (theme === 'retro') this._playRetro(type);
        else if (theme === 'glass') this._playGlass(type);
        else if (theme === 'magic') this._playMagic(type);
        else if (theme === 'wood') this._playWood(type);
        else if (theme === 'zap') this._playZap(type);
        else if (theme === 'piano') this._playPiano(type);
        else if (theme === 'space') this._playSpace(type);
        else if (theme === 'water') this._playWater(type);
        else if (theme === 'neon') this._playNeon(type);
        else if (theme === 'typewriter') this._playTypewriter(type);
        else if (theme === 'samurai') this._playSamurai(type);
        else if (theme === 'synth') this._playSynth(type);
        else if (theme === 'orchestra') this._playOrchestra(type);
        else if (theme === 'cartoon') this._playCartoon(type);
        else if (theme === 'cyberpunk') this._playCyberpunk(type);
        else if (theme === 'pop') this._playPop(type);
        else if (theme === 'horror') this._playHorror(type);
        else this._playDefault(type);
    }

    speak(text, lang = 'en-US') {
        if (this.settings.muted) return;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return; // Toggle behavior (stop if talking)
        }

        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 1.0;
        u.volume = this.settings.voiceVolume; // Apply Volume Setting!

        // Optional: Select a better voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find a google/microsoft premium voice
            const premium = voices.find(v => v.lang === lang && (v.name.includes('Google') || v.name.includes('Natural')));
            if (premium) u.voice = premium;
        }

        u.onstart = () => this._duckAmbience();
        u.onend = () => {
            // restore ambience if needed, though _duckAmbience handles a temp duck usually.
            // checks if we need to forcefully restore? _duckAmbience only dips for 1s in current implementation?
            // Actually _duckAmbience behaves like a sidechain trigger (dip then recover).
            // For speech, we might want continuous ducking.
            // For now, let's just stick to the volume fix.
        };

        window.speechSynthesis.speak(u);
    }

    _duckAmbience() {
        if (!this.settings.ambientEnabled) return;
        const t = this.ctx.currentTime;
        // Sidechain Dip
        this.ambienceGain.gain.cancelScheduledValues(t);
        this.ambienceGain.gain.setValueAtTime(this.settings.ambientVolume, t);
        this.ambienceGain.gain.linearRampToValueAtTime(this.settings.ambientVolume * 0.2, t + 0.1);
        this.ambienceGain.gain.exponentialRampToValueAtTime(this.settings.ambientVolume, t + 4.0); // Slow recovery
    }

    // --- Theme: Default (Premium UI) ---
    _playDefault(type) {
        const t = this.ctx.currentTime;

        if (type === 'click') {
            // Layer 1: Transient (Sharp Click)
            this._noise(t, 0.01, 0.5, 3000, 'highpass');
            // Layer 2: Body (Tonal Thump)
        }
        else if (type === 'success') {
            // Glassy Chord
            this._tone(t, 'sine', 523.25, 523.25, 0.6, 0.2); // C
            this._tone(t + 0.05, 'sine', 659.25, 659.25, 0.6, 0.2); // E
            this._tone(t + 0.1, 'sine', 783.99, 783.99, 0.6, 0.2); // G
            this._tone(t + 0.15, 'sine', 1046.50, 1046.50, 0.4, 0.3); // C
        }
        else if (type === 'type') {
            // Soft Tick
            this._noise(t, 0.005, 0.3, 4000, 'highpass');
        }
    }

    // --- Theme: Mechanical (Tactile) ---
    _playMechanical(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            // Plastic Hit
            this._noise(t, 0.03, 0.8, 2000, 'lowpass');
            this._tone(t, 'square', 400, 100, 0.05, 0.2);
        } else if (type === 'hover') {
            this._noise(t, 0.01, 0.1, 5000, 'highpass');
        } else if (type === 'type') {
            // Cherry MX Blue
            this._noise(t, 0.01, 0.6, 2000, 'highpass'); // Click
            this._tone(t, 'square', 600, 100, 0.02, 0.1); // Tactile bump
        }
    }

    // --- Theme: Tech (Sci-Fi) ---
    _playTech(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 800, 1200, 0.05, 0.1);
            this._tone(t, 'square', 400, 200, 0.1, 0.1);
        } else if (type === 'hover') {
            this._tone(t, 'sawtooth', 1200, 800, 0.05, 0.05);
        } else if (type === 'type') {
            // Data blip
            this._tone(t, 'sine', 2000, 2500, 0.01, 0.1);
        }
    }

    // --- Theme: Bubble (Organic) ---
    _playBubble(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 400, 800, 0.1, 0.3);
        } else if (type === 'hover') {
            this._tone(t, 'sine', 300, 350, 0.1, 0.1);
        } else if (type === 'type') {
            // Small Pop
            this._tone(t, 'sine', 600, 800, 0.02, 0.2);
        }
    }

    // --- Theme: Minimal ---
    _playMinimal(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') this._tone(t, 'sine', 800, 800, 0.03, 0.1);
        else if (type === 'hover') this._noise(t, 0.01, 0.05, 4000, 'highpass');
        else if (type === 'type') this._noise(t, 0.002, 0.1, 8000, 'highpass'); // Barely audible
    }

    // --- Theme: Retro (8-Bit) ---
    _playRetro(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'square', 440, 880, 0.05, 0.2);
        } else if (type === 'hover') {
            this._tone(t, 'square', 880, 440, 0.02, 0.1);
        } else if (type === 'type') {
            // 8-bit text scroll
            this._tone(t, 'square', 1200, 1200, 0.01, 0.1);
        }
    }

    // --- Theme: Glass (Elegant) ---
    _playGlass(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 1200, 0, 0.01, 0.3); // High ping
            this._tone(t, 'sine', 2000, 0, 0.05, 0.1); // Sparkle
        } else if (type === 'hover') {
            this._tone(t, 'sine', 1500, 1600, 0.05, 0.05);
        } else if (type === 'type') {
            // Crystal tap
            this._tone(t, 'sine', 2500, 2500, 0.01, 0.1);
        }
    }

    // --- Theme: Magic (Sparkly) ---
    _playMagic(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 800, 1200, 0.1, 0.2);
            this._tone(t + 0.05, 'sine', 1200, 1600, 0.1, 0.1);
            this._noise(t, 0.2, 0.1, 3000, 'highpass'); // Stardust
        } else if (type === 'hover') {
            this._tone(t, 'triangle', 1000, 1200, 0.1, 0.05);
        } else if (type === 'type') {
            // Fairy dust
            this._tone(t, 'sine', 1500 + Math.random() * 500, 2000, 0.05, 0.1);
        }
    }

    // --- Theme: Wood (Organic) ---
    _playWood(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._noise(t, 0.05, 0.8, 400, 'lowpass'); // Thud
            this._tone(t, 'square', 200, 100, 0.02, 0.1);
        } else if (type === 'hover') {
            this._noise(t, 0.02, 0.2, 800, 'bandpass'); // Scrape
        } else if (type === 'type') {
            // Wood block
            this._tone(t, 'square', 400, 400, 0.01, 0.1);
            this._noise(t, 0.01, 0.4, 600, 'lowpass');
        }
    }

    // --- Theme: Zap (Laser) ---
    _playZap(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 2000, 200, 0.1, 0.2);
        } else if (type === 'hover') {
            this._tone(t, 'sawtooth', 1000, 1500, 0.05, 0.05);
        } else if (type === 'type') {
            // Mini zap
            this._tone(t, 'sawtooth', 1500, 500, 0.02, 0.1);
        }
    }

    // --- Theme: Piano (Musical) ---
    _playPiano(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 523.25, 523.25, 0.3, 0.2); // C5
            this._tone(t, 'triangle', 523.25, 523.25, 0.3, 0.1); // Harmonics
        } else if (type === 'hover') {
            this._tone(t, 'sine', 659.25, 659.25, 0.1, 0.1); // E5
        } else if (type === 'type') {
            // Random pentatonic note
            const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
            const note = notes[Math.floor(Math.random() * notes.length)];
            this._tone(t, 'sine', note, note, 0.1, 0.1);
        }
    }

    // --- Theme: Space (Deep) ---
    _playSpace(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 100, 50, 0.2, 0.3); // Deep drop
            this._noise(t, 0.3, 0.1, 500, 'lowpass'); // Whoosh
        } else if (type === 'hover') {
            this._tone(t, 'sine', 200, 150, 0.1, 0.1);
        } else if (type === 'type') {
            // Radar blip
            this._tone(t, 'sine', 800, 800, 0.03, 0.1);
        }
    }

    // --- Theme: Water (Liquid) ---
    _playWater(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 600, 400, 0.05, 0.3); // Drip
            this._tone(t + 0.02, 'sine', 800, 600, 0.05, 0.2); // Drop
        } else if (type === 'hover') {
            this._tone(t, 'sine', 500, 550, 0.05, 0.1);
        } else if (type === 'type') {
            // Droplet
            this._tone(t, 'sine', 1000 + Math.random() * 200, 800, 0.02, 0.1);
        }
    }

    // --- Theme: Neon (Buzz) ---
    _playNeon(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 100, 100, 0.1, 0.2); // Buzz
            this._tone(t, 'square', 200, 200, 0.05, 0.1);
        } else if (type === 'hover') {
            this._tone(t, 'sawtooth', 150, 150, 0.05, 0.05);
        } else if (type === 'type') {
            // Electric spark
            this._tone(t, 'sawtooth', 400, 600, 0.02, 0.1);
        }
    }

    // --- Theme: Typewriter (Clack) ---
    _playTypewriter(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._noise(t, 0.02, 0.8, 2000, 'bandpass'); // Clack
            this._tone(t, 'square', 300, 100, 0.01, 0.2);
        } else if (type === 'hover') {
            this._noise(t, 0.01, 0.1, 1000, 'highpass');
        } else if (type === 'type') {
            // Authentic Typewriter
            this._noise(t, 0.04, 0.7, 1500, 'bandpass');
            this._tone(t, 'square', 200, 50, 0.02, 0.2);
        }
    }

    // --- Theme: Samurai (Sharp) ---
    _playSamurai(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._noise(t, 0.1, 0.5, 5000, 'highpass'); // Shing
            this._tone(t, 'sawtooth', 1000, 2000, 0.1, 0.1);
        } else if (type === 'hover') {
            this._noise(t, 0.05, 0.1, 3000, 'bandpass');
        } else if (type === 'type') {
            // Tanto tap
            this._noise(t, 0.02, 0.3, 4000, 'highpass');
        }
    }

    // --- Theme: 80s Synth (Retrowave) ---
    _playSynth(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 200, 50, 0.2, 0.2); // Bass drop
            this._tone(t, 'square', 400, 400, 0.1, 0.1); // Chord
        } else if (type === 'hover') {
            this._tone(t, 'sawtooth', 600, 800, 0.1, 0.05);
        } else if (type === 'type') {
            // Synth key
            this._tone(t, 'sawtooth', 400, 400, 0.05, 0.1);
        }
    }

    // --- Theme: Orchestra (Dramatic) ---
    _playOrchestra(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 100, 100, 0.3, 0.3); // Cello
            this._tone(t, 'triangle', 200, 200, 0.3, 0.2); // Viola
            this._tone(t, 'sine', 400, 400, 0.3, 0.1); // Flute
        } else if (type === 'hover') {
            this._tone(t, 'triangle', 600, 600, 0.1, 0.1);
        } else if (type === 'type') {
            // Pizzicato
            this._tone(t, 'triangle', 440, 440, 0.05, 0.2);
        }
    }

    // --- Theme: Cartoon (Fun) ---
    _playCartoon(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 200, 600, 0.2, 0.3); // Slide up
        } else if (type === 'hover') {
            this._tone(t, 'triangle', 800, 400, 0.1, 0.1); // Slide down
        } else if (type === 'type') {
            // Squeak
            this._tone(t, 'sine', 1000, 1200, 0.05, 0.2);
        }
    }

    // --- Theme: Cyberpunk (Heavy) ---
    _playCyberpunk(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 50, 100, 0.2, 0.4); // Deep bass
            this._noise(t, 0.1, 0.3, 1000, 'lowpass'); // Grime
        } else if (type === 'hover') {
            this._tone(t, 'square', 100, 50, 0.1, 0.1);
        } else if (type === 'type') {
            // Glitch click
            this._noise(t, 0.01, 0.4, 2000, 'bandpass');
            this._tone(t, 'sawtooth', 500, 100, 0.01, 0.2);
        }
    }

    // --- Theme: Pop (Happy) ---
    _playPop(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sine', 800, 1000, 0.05, 0.2); // Pop!
        } else if (type === 'hover') {
            this._tone(t, 'sine', 1000, 1200, 0.02, 0.1);
        } else if (type === 'type') {
            // Bubble pop
            this._tone(t, 'sine', 600, 800, 0.03, 0.2);
        }
    }

    // --- Theme: Horror (Creepy) ---
    _playHorror(type) {
        const t = this.ctx.currentTime;
        if (type === 'click') {
            this._tone(t, 'sawtooth', 100, 90, 0.5, 0.2); // Unsettling
            this._tone(t, 'sine', 105, 95, 0.5, 0.2); // Dissonance
        } else if (type === 'hover') {
            this._noise(t, 0.1, 0.1, 500, 'highpass'); // Breath
        } else if (type === 'type') {
            // Bone crack
            this._noise(t, 0.01, 0.4, 1000, 'highpass');
        }
    }

    // --- Synthesis Helpers ---

    _tone(t, type, freqStart, freqEnd, dur, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, t);
        if (freqEnd > 0) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur); // Decay

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + dur);
    }

    _noise(t, dur, vol, filterFreq, filterType) {
        const bufSize = this.ctx.sampleRate * dur;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        src.start(t);
    }

    // --- Ambient Engine ---

    startAmbient() {
        this.stopAmbient(); // Safety clear
        const track = this.settings.ambientTrack || 'drone';

        if (track === 'custom') this._playCustom();
        else if (track === 'stream') this._playStream();
        else if (track === 'drone') this._playDrone();
        else if (track === 'rain') this._playRain();
        else if (track === 'cyber') this._playCyber();
        else if (track === 'zen') this._playZen();
    }

    setStreamUrl(url) {
        this.streamUrl = url;
        this.setAmbientTrack('stream');
    }

    _playStream() {
        if (!this.streamUrl) return;
        const audio = new Audio(this.streamUrl);
        audio.loop = true;
        audio.crossOrigin = "anonymous";

        const src = this.ctx.createMediaElementSource(audio);
        src.connect(this.ambienceGain);

        audio.play().catch(e => console.error("Stream Error:", e));

        this.ambientNodes.push({
            stop: () => { audio.pause(); audio.src = ''; },
            disconnect: () => src.disconnect()
        });
    }

    stopAmbient() {
        if (this.zenTimeout) {
            clearTimeout(this.zenTimeout);
            this.zenTimeout = null;
        }
        this.ambientNodes.forEach(n => {
            try { n.stop(); n.disconnect(); } catch (e) { }
        });
        this.ambientNodes = [];
    }

    _playCustom() {
        if (!this.customFile) return;
        const url = URL.createObjectURL(this.customFile);
        const audio = new Audio(url);
        audio.loop = true;

        const src = this.ctx.createMediaElementSource(audio);
        src.connect(this.ambienceGain);

        audio.play().catch(e => console.error(e));

        this.ambientNodes.push({
            stop: () => { audio.pause(); audio.src = ''; },
            disconnect: () => src.disconnect()
        });
    }

    _playDrone() {
        // Binaural Drone (Left/Right slight detune)
        const f = 110; // A2
        const oscL = this.ctx.createOscillator();
        const oscR = this.ctx.createOscillator();
        const panL = this.ctx.createStereoPanner();
        const panR = this.ctx.createStereoPanner();

        oscL.frequency.value = f;
        oscR.frequency.value = f + 0.5; // Beat frequency

        panL.pan.value = -0.5;
        panR.pan.value = 0.5;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.15;

        oscL.connect(panL); panL.connect(gain);
        oscR.connect(panR); panR.connect(gain);
        gain.connect(this.ambienceGain);

        oscL.start(); oscR.start();
        this.ambientNodes.push(oscL, oscR, gain, panL, panR);
    }

    _playRain() {
        // Pink Noise
        const dur = 5;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < data.length; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179;
            b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520;
            b3 = 0.86650 * b3 + w * 0.3104856;
            b4 = 0.55000 * b4 + w * 0.5329522;
            b5 = -0.7616 * b5 - w * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
            b6 = w * 0.115926;
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        src.connect(filter);
        filter.connect(this.ambienceGain);
        src.start();
        this.ambientNodes.push(src, filter);
    }

    _playCyber() {
        const osc = this.ctx.createOscillator();
        osc.frequency.value = 60; // Hum
        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;
        osc.connect(gain);
        gain.connect(this.ambienceGain);
        osc.start();
        this.ambientNodes.push(osc, gain);
    }

    _playZen() {
        const scale = [220, 261.63, 293.66, 329.63, 392.00, 440];
        const play = () => {
            if (!this.settings.ambientEnabled || this.settings.ambientTrack !== 'zen') return;

            const f = scale[Math.floor(Math.random() * scale.length)];
            const t = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            osc.frequency.value = f;
            osc.type = 'sine';

            const pan = this.ctx.createStereoPanner();
            pan.pan.value = Math.random() * 2 - 1; // Random pan

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 4);

            osc.connect(pan);
            pan.connect(gain);
            gain.connect(this.ambienceGain);
            gain.connect(this.reverbGain); // Send to reverb!

            osc.start(t);
            osc.stop(t + 4);

            this.zenTimeout = setTimeout(play, 2000 + Math.random() * 3000);
        };
        play();
    }
}

window.audioManager = new AudioManager();
