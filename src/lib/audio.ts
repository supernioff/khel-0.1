/**
 * High-Tech Cybernetic Web Audio Synthesizer & Dynamic Procedural BGM Engine.
 * Zero external audio assets, instant zero-latency playback, pristine sci-fi sound design.
 */

let audioCtx: AudioContext | null = null;
let isSfxMuted = false;
let isMusicMuted = false;
let isVoiceEnabled = true;

// Load settings from localStorage
try {
  const savedSfx = localStorage.getItem('flappy_muted');
  if (savedSfx !== null) isSfxMuted = savedSfx === 'true';

  const savedMusic = localStorage.getItem('flappy_music_muted');
  if (savedMusic !== null) isMusicMuted = savedMusic === 'true';

  const savedVoice = localStorage.getItem('flappy_voice_enabled');
  if (savedVoice !== null) isVoiceEnabled = savedVoice === 'true';
} catch {
  // ignore local storage restrictions
}

function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global master gains
let sfxMasterGain: GainNode | null = null;
let musicMasterGain: GainNode | null = null;
let musicFilterNode: BiquadFilterNode | null = null;

function ensureMasterNodes(ctx: AudioContext) {
  if (!sfxMasterGain) {
    sfxMasterGain = ctx.createGain();
    sfxMasterGain.gain.setValueAtTime(isSfxMuted ? 0 : 0.85, ctx.currentTime);
    sfxMasterGain.connect(ctx.destination);
  }
  if (!musicMasterGain) {
    musicMasterGain = ctx.createGain();
    musicMasterGain.gain.setValueAtTime(isMusicMuted ? 0 : 0.4, ctx.currentTime);

    musicFilterNode = ctx.createBiquadFilter();
    musicFilterNode.type = 'lowpass';
    musicFilterNode.frequency.setValueAtTime(1400, ctx.currentTime);
    musicFilterNode.Q.setValueAtTime(1.5, ctx.currentTime);

    musicFilterNode.connect(musicMasterGain);
    musicMasterGain.connect(ctx.destination);
  }
}

// Procedural BGM Engine (Cyberpunk / Synthwave 124 BPM driving sequence)
let musicInterval: number | null = null;
let musicStep = 0;
let musicIntensity: 'ambient' | 'intense' | 'crash' = 'ambient';

// Bassline progression: A -> C -> D -> F
const BASS_PITCHES = [
  55, 55, 55, 55, 65.41, 65.41, 65.41, 65.41, 73.42, 73.42, 73.42, 73.42, 87.31, 87.31, 82.41, 73.42,
];

// Arp notes (cyber minor scale frequencies)
const ARP_PITCHES = [
  220, 261.63, 329.63, 392.0, 440, 523.25, 440, 329.63,
  261.63, 329.63, 392.0, 523.25, 587.33, 523.25, 392.0, 329.63,
];

function playBassNote(ctx: AudioContext, freq: number, duration: number, isAccent: boolean) {
  if (isMusicMuted || !musicFilterNode) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq / 2, now);

    filter.type = 'lowpass';
    const filterCutoff = isAccent ? 950 : 650;
    filter.frequency.setValueAtTime(filterCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);

    const baseVol = isAccent ? 0.35 : 0.24;
    gain.gain.setValueAtTime(baseVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(musicFilterNode);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + duration);
    subOsc.stop(now + duration);
  } catch {
    // audio failure fallback
  }
}

function playArpNote(ctx: AudioContext, freq: number, duration: number) {
  if (isMusicMuted || !musicFilterNode) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const vol = musicIntensity === 'intense' ? 0.12 : 0.05;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(musicFilterNode);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // ignore
  }
}

function playCyberDrum(ctx: AudioContext, type: 'kick' | 'snare' | 'hihat') {
  if (isMusicMuted || !musicFilterNode) return;
  try {
    const now = ctx.currentTime;

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(musicFilterNode);

      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'snare') {
      // Noise burst + mid tone
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1000, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(musicFilterNode);

      noise.start(now);
      noise.stop(now + 0.12);
    } else if (type === 'hihat') {
      // High-frequency subtle click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(6000, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(musicFilterNode);

      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // ignore
  }
}

function tickMusic() {
  const ctx = getAudioContext();
  if (!ctx || isMusicMuted) return;
  ensureMasterNodes(ctx);

  const step16 = musicStep % 16;
  const bassPitch = BASS_PITCHES[step16];
  const arpPitch = ARP_PITCHES[step16];

  // Play bassline on every 16th note
  const isAccent = step16 % 4 === 0;
  playBassNote(ctx, bassPitch, 0.11, isAccent);

  // Arp pattern
  playArpNote(ctx, arpPitch, 0.09);

  // Drum pattern (kick on 1 & 3, snare on 2 & 4, hihat on every 8th)
  if (musicIntensity === 'intense') {
    if (step16 === 0 || step16 === 8) {
      playCyberDrum(ctx, 'kick');
    } else if (step16 === 4 || step16 === 12) {
      playCyberDrum(ctx, 'snare');
    }
    if (step16 % 2 === 0) {
      playCyberDrum(ctx, 'hihat');
    }
  } else if (musicIntensity === 'ambient') {
    // Lighter drums in lobby/idle
    if (step16 === 0 || step16 === 8) {
      playCyberDrum(ctx, 'kick');
    }
    if (step16 % 4 === 2) {
      playCyberDrum(ctx, 'hihat');
    }
  }

  musicStep++;
}

export const soundManager = {
  isMuted() {
    return isSfxMuted;
  },

  isMusicMuted() {
    return isMusicMuted;
  },

  isVoiceEnabled() {
    return isVoiceEnabled;
  },

  toggleMute() {
    isSfxMuted = !isSfxMuted;
    try {
      localStorage.setItem('flappy_muted', String(isSfxMuted));
    } catch {
      // ignore
    }
    const ctx = getAudioContext();
    if (ctx && sfxMasterGain) {
      sfxMasterGain.gain.setValueAtTime(isSfxMuted ? 0 : 0.85, ctx.currentTime);
    }
    return isSfxMuted;
  },

  toggleMusic() {
    isMusicMuted = !isMusicMuted;
    try {
      localStorage.setItem('flappy_music_muted', String(isMusicMuted));
    } catch {
      // ignore
    }
    const ctx = getAudioContext();
    if (ctx && musicMasterGain) {
      musicMasterGain.gain.setValueAtTime(isMusicMuted ? 0 : 0.4, ctx.currentTime);
    }
    if (!isMusicMuted) {
      this.startMusic();
    }
    return isMusicMuted;
  },

  toggleVoice() {
    isVoiceEnabled = !isVoiceEnabled;
    try {
      localStorage.setItem('flappy_voice_enabled', String(isVoiceEnabled));
    } catch {
      // ignore
    }
    return isVoiceEnabled;
  },

  startMusic(intensity: 'ambient' | 'intense' = 'ambient') {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);
    musicIntensity = intensity;

    // Adjust filter cutoff based on state
    if (musicFilterNode) {
      const targetFreq = intensity === 'intense' ? 3200 : 1200;
      musicFilterNode.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.2);
    }

    if (!musicInterval) {
      // 124 BPM -> 16th note is ~121ms
      musicInterval = window.setInterval(tickMusic, 121);
    }
  },

  setMusicIntensity(intensity: 'ambient' | 'intense' | 'crash') {
    musicIntensity = intensity;
    const ctx = getAudioContext();
    if (!ctx || !musicFilterNode) return;

    if (intensity === 'crash') {
      // Glitch tape-stop filter dive
      musicFilterNode.frequency.setValueAtTime(3200, ctx.currentTime);
      musicFilterNode.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.4);
    } else if (intensity === 'intense') {
      musicFilterNode.frequency.setTargetAtTime(3200, ctx.currentTime, 0.15);
    } else {
      musicFilterNode.frequency.setTargetAtTime(1200, ctx.currentTime, 0.3);
    }
  },

  stopMusic() {
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  },

  /**
   * HIGH-TECH FLY / JET IMPULSE VOICE:
   * Multi-layered sci-fi booster with plasma whoosh, resonant frequency sweep,
   * and craft-specific tonal nuances.
   */
  /**
   * HIGH-TECH FLY / JET IMPULSE VOICE:
   * Smooth aerodynamic plasma thruster whoosh and deep air burst.
   * Completely removed all high-pitch tonal oscillator beeps!
   */
  playFlap(_craftId: string = 'falcon') {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;

      // Layer 1: Smooth Aerodynamic Air & Plasma Whoosh (Filtered white noise, NO tonal beep)
      const bufferSize = Math.floor(ctx.sampleRate * 0.09);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Warm lowpass filter: deep atmospheric air displacement, zero sharp beep
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(540, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.09);
      noiseFilter.Q.setValueAtTime(0.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(sfxMasterGain!);

      noiseSource.start(now);
      noiseSource.stop(now + 0.09);

      // Layer 2: Ultra-low frequency sub-puff (55Hz gentle sine bass rumble, visceral impulse)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(75, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      subGain.gain.setValueAtTime(0.12, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      subOsc.connect(subGain);
      subGain.connect(sfxMasterGain!);
      subOsc.start(now);
      subOsc.stop(now + 0.08);
    } catch {
      // ignore
    }
  },

  /**
   * HIGH-TECH CRASH & IMPACT VOICE:
   * Heavy cinematic impact with sub-bass drop, hull crunch, EMP glitch overload,
   * and hull integrity warning ping.
   */
  playHit() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;

      // Layer 1: Sub-Bass Shockwave (60Hz down to 25Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(90, now);
      subOsc.frequency.exponentialRampToValueAtTime(24, now + 0.4);

      subGain.gain.setValueAtTime(0.65, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      subOsc.connect(subGain);
      subGain.connect(sfxMasterGain!);
      subOsc.start(now);
      subOsc.stop(now + 0.45);

      // Layer 2: Metallic Hull Shatter (Distorted Sawtooth FM)
      const crunchOsc = ctx.createOscillator();
      const crunchGain = ctx.createGain();
      const crunchFilter = ctx.createBiquadFilter();

      crunchOsc.type = 'sawtooth';
      crunchOsc.frequency.setValueAtTime(280, now);
      crunchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      crunchFilter.type = 'lowpass';
      crunchFilter.frequency.setValueAtTime(1800, now);
      crunchFilter.frequency.exponentialRampToValueAtTime(200, now + 0.28);

      crunchGain.gain.setValueAtTime(0.45, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      crunchOsc.connect(crunchFilter);
      crunchFilter.connect(crunchGain);
      crunchGain.connect(sfxMasterGain!);
      crunchOsc.start(now);
      crunchOsc.stop(now + 0.28);

      // Layer 3: EMP Glitch Noise Spark
      const bufferSize = Math.floor(ctx.sampleRate * 0.22);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(3200, now);
      nFilter.frequency.exponentialRampToValueAtTime(600, now + 0.22);
      nFilter.Q.setValueAtTime(4.0, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.38, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(sfxMasterGain!);
      noise.start(now);
      noise.stop(now + 0.22);
    } catch {
      // ignore
    }
  },

  /**
   * SYSTEM DISINTEGRATION & HULL FAILURE ALARM
   */
  playDie() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;

      // Two rapid tactical warning pulses (880Hz -> 440Hz -> 220Hz)
      const warningPitches = [880, 587.33, 440, 220];
      warningPitches.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.14);

        osc.connect(gain);
        gain.connect(sfxMasterGain!);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.14);
      });
    } catch {
      // ignore
    }
  },

  /**
   * CRYSTAL TELEMETRY SCORE CHIME:
   * Significantly lowered volume and softened tone for gentle feedback when passing obstacles.
   */
  playScore() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft warm sine wave blip (C5 to E5 harmonic)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      // Low gentle volume (0.07 instead of loud 0.28)
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxMasterGain!);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  },

  /**
   * SECTOR CLEAR / COLOR SHIFT HARMONIC CHORD CASCADE
   */
  playMilestone() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C major 9th hyperdrive

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(sfxMasterGain!);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.45);
      });
    } catch {
      // ignore
    }
  },

  /**
   * HUD RADAR COUNTDOWN PING
   */
  playCountdown(count: number) {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (count === 0) {
        // High-energy lock-on chord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.25);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      } else {
        // Crisp radar blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25 + (3 - count) * 120, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      }

      osc.connect(gain);
      gain.connect(sfxMasterGain!);
      osc.start(now);
      osc.stop(now + (count === 0 ? 0.35 : 0.16));
    } catch {
      // ignore
    }
  },

  /**
   * TRIUMPHANT GRAND SYNTH CHORUS (RACE VICTORY)
   */
  playWin() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const fanfare = [
        { f: 523.25, t: 0.0 },
        { f: 659.25, t: 0.12 },
        { f: 783.99, t: 0.24 },
        { f: 1046.5, t: 0.36 },
        { f: 1318.5, t: 0.52 },
        { f: 1567.98, t: 0.7 },
      ];
      const now = ctx.currentTime;

      fanfare.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.24, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.4);

        osc.connect(gain);
        gain.connect(sfxMasterGain!);

        osc.start(now + note.t);
        osc.stop(now + note.t + 0.4);
      });
    } catch {
      // ignore
    }
  },

  /**
   * STEEL REAPER PREDATOR ARRIVAL SOUND:
   * Mechanical servo screech and ominous targeting lock-on scan pulse.
   */
  playReaperArrive() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;

      // Servo glide oscillator
      const servoOsc = ctx.createOscillator();
      const servoFilter = ctx.createBiquadFilter();
      const servoGain = ctx.createGain();

      servoOsc.type = 'sawtooth';
      servoOsc.frequency.setValueAtTime(420, now);
      servoOsc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

      servoFilter.type = 'bandpass';
      servoFilter.frequency.setValueAtTime(600, now);
      servoFilter.frequency.exponentialRampToValueAtTime(200, now + 0.35);
      servoFilter.Q.setValueAtTime(4, now);

      servoGain.gain.setValueAtTime(0.35, now);
      servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      servoOsc.connect(servoFilter);
      servoFilter.connect(servoGain);
      servoGain.connect(sfxMasterGain!);

      servoOsc.start(now);
      servoOsc.stop(now + 0.4);

      // Lock-on scan ping
      const pingOsc = ctx.createOscillator();
      const pingGain = ctx.createGain();

      pingOsc.type = 'sine';
      pingOsc.frequency.setValueAtTime(1480, now + 0.15);
      pingOsc.frequency.exponentialRampToValueAtTime(740, now + 0.35);

      pingGain.gain.setValueAtTime(0.001, now);
      pingGain.gain.setValueAtTime(0.25, now + 0.15);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      pingOsc.connect(pingGain);
      pingGain.connect(sfxMasterGain!);

      pingOsc.start(now + 0.15);
      pingOsc.stop(now + 0.45);
    } catch {
      // ignore
    }
  },

  /**
   * STEEL GUARDIAN LAUNCH ESCORT BURST:
   * Supersonic plasma spool-up and energetic thruster ignition.
   */
  playGuardianDeploy() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.32);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.32);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxMasterGain!);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // ignore
    }
  },

  /**
   * RETRO 2014 CLASSIC CHIRP (NOSTALGIA INTRO):
   * Authentic 8-bit vintage arcade square jump
   */
  playRetroFlap() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(sfxMasterGain!);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  },

  /**
   * RETRO 2014 OBSTACLE IMPACT (CLASSIC GLASS CRUNCH)
   */
  playRetroCrash() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);
    try {
      const now = ctx.currentTime;
      // White noise impact
      const bufferSize = Math.floor(ctx.sampleRate * 0.25);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(gain);
      gain.connect(sfxMasterGain!);
      noise.start(now);
      noise.stop(now + 0.25);
    } catch {
      // ignore
    }
  },

  /**
   * CINEMATIC DIVINE BASS DROP & QUANTUM SURGE (GODDESS REBIRTH)
   */
  playDivineBassDrop() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.8);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(sfxMasterGain!);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // ignore
    }
  },

  /**
   * CELESTIAL CHORAL ASCENSION HARMONY
   */
  playDivineChoirChord() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);
    try {
      const now = ctx.currentTime;
      const pitches = [523.25, 659.25, 783.99, 1046.5]; // C Major Celestial Triad
      pitches.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.05 + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 1.2);

        osc.connect(gain);
        gain.connect(sfxMasterGain!);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 1.2);
      });
    } catch {
      // ignore
    }
  },

  /**
   * SUPERSONIC OBSTACLE OBLITERATION BLAST
   */
  playObliterationBlast() {
    if (isSfxMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureMasterNodes(ctx);
    try {
      const now = ctx.currentTime;
      // Laser sweep
      const laser = ctx.createOscillator();
      const laserGain = ctx.createGain();
      laser.type = 'sawtooth';
      laser.frequency.setValueAtTime(1800, now);
      laser.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      laserGain.gain.setValueAtTime(0.35, now);
      laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      laser.connect(laserGain);
      laserGain.connect(sfxMasterGain!);
      laser.start(now);
      laser.stop(now + 0.35);

      // Sonic disintegration thunder
      const bufferSize = Math.floor(ctx.sampleRate * 0.45);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'lowpass';
      nFilter.frequency.setValueAtTime(2800, now);
      nFilter.frequency.exponentialRampToValueAtTime(200, now + 0.45);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.38, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(sfxMasterGain!);
      noise.start(now);
      noise.stop(now + 0.45);
    } catch {
      // ignore
    }
  },

  /**
   * TACTICAL ROBOTIC VOICE ANNOUNCER:
   * Uses Web Speech API with robotic synthesizer parameters (low pitch, crisp rate)
   * to deliver authentic aerospace telemetry callouts.
   */
  speakTacticalAlert(phrase: string) {
    if (!isVoiceEnabled || isSfxMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // cancel any trailing utterance
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.pitch = 0.85; // cybernetic deep pilot tone
      utterance.rate = 1.15; // prompt military pacing
      utterance.volume = 0.75;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David')));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // speech synthesis error fallback
    }
  },
};
