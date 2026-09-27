import React from 'react';
import {
  X,
  Palette,
  Gamepad2,
  Users,
  Volume2,
  VolumeX,
  Music,
  Radio,
  Zap,
  Plane,
} from 'lucide-react';
import type { CyberThemeId, BirdCraftId } from '../types/game';
import { CYBER_THEMES, BIRD_CRAFTS } from '../lib/themes';
import { soundManager } from '../lib/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: CyberThemeId;
  onSelectTheme: (theme: CyberThemeId) => void;
  currentCraft: BirdCraftId;
  onSelectCraft: (craft: BirdCraftId) => void;
  currentMode?: 'single' | 'multiplayer';
  onSelectMode?: (mode: 'single' | 'multiplayer') => void;
}

export function ThemeWindow({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  currentCraft,
  onSelectCraft,
  currentMode,
  onSelectMode,
}: Props) {
  const [sfxMuted, setSfxMuted] = React.useState(soundManager.isMuted());
  const [musicMuted, setMusicMuted] = React.useState(soundManager.isMusicMuted());
  const [voiceEnabled, setVoiceEnabled] = React.useState(soundManager.isVoiceEnabled());

  if (!isOpen) return null;

  const handleToggleSfx = () => {
    const next = soundManager.toggleMute();
    setSfxMuted(next);
  };

  const handleToggleMusic = () => {
    const next = soundManager.toggleMusic();
    setMusicMuted(next);
  };

  const handleToggleVoice = () => {
    const next = soundManager.toggleVoice();
    setVoiceEnabled(next);
  };

  return (
    <div
      id="theme-window-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="theme-window-container"
        className="w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] text-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Aerospace Command Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase font-mono">
                  TACTICAL FLIGHT CONFIGURATION
                </h2>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  // SYS.ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                CRAFT HULLS · SECTOR THEMES · SYNTH AUDIO ENGINE
              </p>
            </div>
          </div>

          <button
            id="close-theme-window-btn"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            aria-label="Close System Window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Configuration Sections */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Bird Craft Fleet */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                <Plane className="w-4 h-4" /> 01 // SELECT BIRD CRAFT
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Aerospace chassis specifications
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(BIRD_CRAFTS) as BirdCraftId[]).map((craftKey) => {
                const c = BIRD_CRAFTS[craftKey];
                const isSelected = currentCraft === craftKey;
                return (
                  <button
                    key={craftKey}
                    id={`craft-btn-${craftKey}`}
                    onClick={() => {
                      onSelectCraft(craftKey);
                      soundManager.playFlap(craftKey);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {c.designation}
                        </span>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          {c.name}
                        </h4>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-1"
                        style={{
                          backgroundColor: c.accentColor,
                          boxShadow: `0 0 8px ${c.accentColor}`,
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 font-mono">
                      {c.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-slate-400">{c.classType}</span>
                      {isSelected ? (
                        <span className="text-cyan-400 font-bold">ARMED</span>
                      ) : (
                        <span className="text-slate-400">SELECT</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Visual Sector Themes */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                <Palette className="w-4 h-4" /> 02 // SECTOR THEMES
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Environment & energy gates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(Object.keys(CYBER_THEMES) as CyberThemeId[]).map((themeKey) => {
                const t = CYBER_THEMES[themeKey];
                const isActive = currentTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    id={`theme-btn-${themeKey}`}
                    onClick={() => {
                      onSelectTheme(themeKey);
                      soundManager.playScore();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div
                      className="h-10 w-full rounded-lg border border-white/10 mb-2 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${t.skyTop}, ${t.skyBottom})`,
                      }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: t.gatePrimary }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">
                          {t.name}
                        </span>
                        {isActive && (
                          <span className="text-[9px] text-cyan-400 font-mono font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-mono">
                        {t.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Audio Deck & Procedural Synthwave Music */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
                <Music className="w-4 h-4" /> 03 // AUDIO DECK & SYNTH ENGINE
              </span>
              <span className="text-[11px] text-slate-400">Zero-latency Web Audio</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Synthwave Music Toggle */}
              <button
                id="toggle-music-deck-btn"
                onClick={handleToggleMusic}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                  !musicMuted
                    ? 'bg-purple-950/30 border-purple-400/80 text-purple-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span className="text-xs font-bold">Cyber Music</span>
                </div>
                <span className="text-[10px] font-bold">
                  {!musicMuted ? 'PLAYING' : 'MUTED'}
                </span>
              </button>

              {/* Sound Effects Toggle */}
              <button
                id="toggle-sfx-deck-btn"
                onClick={handleToggleSfx}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                  !sfxMuted
                    ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {!sfxMuted ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <span className="text-xs font-bold">Sound FX</span>
                </div>
                <span className="text-[10px] font-bold">
                  {!sfxMuted ? 'ACTIVE' : 'MUTED'}
                </span>
              </button>

              {/* Voice Alerts Toggle */}
              <button
                id="toggle-voice-deck-btn"
                onClick={handleToggleVoice}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                  voiceEnabled
                    ? 'bg-emerald-950/30 border-emerald-400/80 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  <span className="text-xs font-bold">Tactical Voice</span>
                </div>
                <span className="text-[10px] font-bold">
                  {voiceEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tactical Status Footer */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
          <span>FLIGHT ENGINE v4.2 // READY</span>
          <span className="text-cyan-400 font-bold">CONFIG SAVED</span>
        </div>
      </div>
    </div>
  );
}
