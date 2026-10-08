// Web Audio API Retro Sound & Music Synthesizer
// 100% offline, 0 bytes external audio dependencies, low latency on iOS.

class RetroAudioManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.sfxVolume = 0.6;
    this.musicVolume = 0.25;
    this.isMusicPlaying = false;
    this.musicTimer = null;
    this.currentNoteIndex = 0;

    // Load saved settings
    try {
      const savedSfx = localStorage.getItem('tetris_sfx');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      const savedMusic = localStorage.getItem('tetris_music');
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    } catch (e) {
      // LocalStorage might be restricted
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    try {
      localStorage.setItem('tetris_sfx', this.sfxEnabled);
    } catch (e) {}
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem('tetris_music', this.musicEnabled);
    } catch (e) {}

    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // --- Sound Effects ---

  playMove() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.035);

      gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }

  playRotate() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.045);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.055);
    } catch (e) {}
  }

  playSoftDrop() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(60, t + 0.02);

      gain.gain.setValueAtTime(this.sfxVolume * 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.025);
    } catch (e) {}
  }

  playHardDrop() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const t = this.ctx.currentTime;
      
      // Punchy bass impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.09);

      gain.gain.setValueAtTime(this.sfxVolume * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  playHold() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(660, t + 0.035);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.085);
    } catch (e) {}
  }

  playClear(lines) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      if (lines === 4) {
        // TETRIS! Grand fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const t = this.ctx.currentTime + idx * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.2);
        });
      } else {
        // 1-3 lines clear chime
        const baseNotes = [440, 554.37, 659.25];
        const count = Math.min(lines, 3);
        for (let i = 0; i <= count; i++) {
          const t = this.ctx.currentTime + i * 0.055;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseNotes[i % baseNotes.length] * (1 + 0.25 * i), t);

          gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.14);
        }
      }
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        const t = this.ctx.currentTime + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.16);
      });
    } catch (e) {}
  }

  playGameOver() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.init();
    try {
      const notes = [440, 415.3, 392, 349.23, 329.63, 220];
      notes.forEach((f, i) => {
        const t = this.ctx.currentTime + i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (e) {}
  }

  // --- 8-Bit Retro Chiptune (Korobeiniki) ---

  startMusic() {
    if (!this.musicEnabled) return;
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentNoteIndex = 0;
    this.scheduleNextNote();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  scheduleNextNote() {
    if (!this.isMusicPlaying || !this.musicEnabled || !this.ctx) return;

    // Classic Tetris Korobeiniki melody (Pitch, Duration in beats at ~140 BPM)
    // 1 beat ~ 0.22s
    const BEAT = 0.22;
    const melody = [
      // Phrase 1
      { f: 659.25, d: 2 }, // E5
      { f: 493.88, d: 1 }, // B4
      { f: 523.25, d: 1 }, // C5
      { f: 587.33, d: 2 }, // D5
      { f: 523.25, d: 1 }, // C5
      { f: 493.88, d: 1 }, // B4
      { f: 440.00, d: 2 }, // A4
      { f: 440.00, d: 1 }, // A4
      { f: 523.25, d: 1 }, // C5
      { f: 659.25, d: 2 }, // E5
      { f: 587.33, d: 1 }, // D5
      { f: 523.25, d: 1 }, // C5
      { f: 493.88, d: 3 }, // B4
      { f: 523.25, d: 1 }, // C5
      { f: 587.33, d: 2 }, // D5
      { f: 659.25, d: 2 }, // E5
      { f: 523.25, d: 2 }, // C5
      { f: 440.00, d: 2 }, // A4
      { f: 440.00, d: 2 }, // A4
      { f: 0,      d: 1 }, // pause

      // Phrase 2
      { f: 587.33, d: 3 }, // D5
      { f: 698.46, d: 1 }, // F5
      { f: 880.00, d: 2 }, // A5
      { f: 783.99, d: 1 }, // G5
      { f: 698.46, d: 1 }, // F5
      { f: 659.25, d: 3 }, // E5
      { f: 523.25, d: 1 }, // C5
      { f: 659.25, d: 2 }, // E5
      { f: 587.33, d: 1 }, // D5
      { f: 523.25, d: 1 }, // C5
      { f: 493.88, d: 2 }, // B4
      { f: 493.88, d: 1 }, // B4
      { f: 523.25, d: 1 }, // C5
      { f: 587.33, d: 2 }, // D5
      { f: 659.25, d: 2 }, // E5
      { f: 523.25, d: 2 }, // C5
      { f: 440.00, d: 2 }, // A4
      { f: 440.00, d: 2 }, // A4
      { f: 0,      d: 2 }  // pause
    ];

    const note = melody[this.currentNoteIndex];
    const duration = note.d * BEAT;

    if (note.f > 0 && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, t);

        const vol = this.musicVolume * 0.2;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.setValueAtTime(vol, t + duration * 0.75);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
      } catch (e) {}
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % melody.length;
    this.musicTimer = setTimeout(() => {
      this.scheduleNextNote();
    }, duration * 1000);
  }
}

window.retroAudio = new RetroAudioManager();
