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
  Crown,
  Sparkles,
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

function GoddessAvatarThumbnail({ craftKey }: { craftKey: BirdCraftId }) {
  const c = BIRD_CRAFTS[craftKey];
  return (
    <div
      className="h-14 w-full rounded-lg border border-white/10 mb-2 relative overflow-hidden flex items-center justify-center"
      style={{
        background: `radial-gradient(circle at 50% 45%, ${c.accentColor}25, ${c.hullColor} 75%, #020617 100%)`,
      }}
    >
      {/* Floating Celestial Halo */}
      <div
        className="absolute top-1.5 w-10 h-4 rounded-full border-2 animate-pulse"
        style={{
          borderColor: c.accentColor,
          boxShadow: `0 0 12px ${c.accentColor}`,
        }}
      />

      {/* Floating Crown / Diadem Jewel */}
      <div
        className="absolute top-1 w-2 h-2 rotate-45"
        style={{
          backgroundColor: c.visorColor,
          boxShadow: `0 0 8px ${c.visorColor}`,
        }}
      />

      {/* Goddess Avatar Body Silhouette */}
      <div className="relative mt-2.5 flex items-center justify-center">
        {/* Left Wing */}
        <div
          className="w-5 h-3 rounded-tl-full rounded-bl-lg -rotate-12 border-t-2"
          style={{
            backgroundColor: `${c.accentColor}40`,
            borderColor: c.accentColor,
          }}
        />
        {/* Divine Core */}
        <div
          className="w-4 h-5 rounded-full border shadow-md mx-0.5 relative z-10"
          style={{
            backgroundColor: c.hullColor,
            borderColor: c.accentColor,
            boxShadow: `0 0 8px ${c.accentColor}`,
          }}
        >
          {/* Third Eye / Visor glint */}
          <div
            className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
            style={{ backgroundColor: c.visorColor }}
          />
        </div>
        {/* Right Wing */}
        <div
          className="w-5 h-3 rounded-tr-full rounded-br-lg rotate-12 border-t-2"
          style={{
            backgroundColor: `${c.accentColor}40`,
            borderColor: c.accentColor,
          }}
        />
      </div>

      {/* Celestial Energy Stream Base */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          backgroundColor: c.thrusterColor,
          boxShadow: `0 0 8px ${c.thrusterColor}`,
        }}
      />
    </div>
  );
}

function ThemeThumbnail({ themeKey }: { themeKey: CyberThemeId }) {
  const t = CYBER_THEMES[themeKey];
  return (
    <div
      className="h-12 w-full rounded-lg border border-white/10 mb-2 relative overflow-hidden flex items-end justify-center"
      style={{
        background: `linear-gradient(180deg, ${t.skyTop}, ${t.skyBottom})`,
      }}
    >
      {themeKey === 'synthwave' && (
        <>
          <div className="absolute top-1.5 w-7 h-7 rounded-full bg-gradient-to-b from-amber-300 via-rose-500 to-purple-600 shadow-[0_0_10px_#f43f5e]" />
          <div className="absolute top-4 w-7 h-0.5 bg-purple-950/80" />
          <div className="absolute top-5 w-7 h-0.5 bg-purple-950/80" />
          <div className="w-full h-3 border-t border-rose-500 bg-purple-950/60 flex items-end justify-center">
            <span className="text-[7px] text-pink-400 font-mono">▲▲▲</span>
          </div>
        </>
      )}
      {themeKey === 'matrix' && (
        <div className="absolute inset-0 flex justify-around items-center px-1 font-mono text-[8px] text-emerald-400/90 font-bold tracking-widest select-none">
          <span className="animate-pulse">1 0</span>
          <span className="opacity-90">0 1</span>
          <span className="opacity-70">1 0</span>
        </div>
      )}
      {themeKey === 'cyberpunk' && (
        <div className="w-full h-full flex items-end justify-around px-1 pb-1">
          <div className="w-2.5 h-6 bg-slate-900 border-t border-cyan-400" />
          <div className="w-3.5 h-8 bg-slate-900 border-t-2 border-rose-500 shadow-[0_0_6px_#f43f5e]" />
          <div className="w-2.5 h-5 bg-slate-900 border-t border-cyan-400" />
        </div>
      )}
      {themeKey === 'void' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-black border-2 border-indigo-400 shadow-[0_0_12px_#818cf8] relative">
            <div className="absolute -inset-1 border border-indigo-300/60 rounded-full rotate-45" />
          </div>
        </div>
      )}
      {themeKey === 'solar' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-300 to-orange-600 shadow-[0_0_15px_#f97316] relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-amber-300 rounded-full animate-ping opacity-60" />
          </div>
        </div>
      )}
      {themeKey === 'aurora' && (
        <div className="absolute inset-0 flex flex-col justify-center px-2">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 rounded-full blur-[1px] opacity-80" />
          <div className="h-1 w-3/4 mx-auto bg-gradient-to-r from-teal-300 to-indigo-400 rounded-full blur-[1px] mt-1 opacity-70" />
        </div>
      )}
      {themeKey === 'citadel' && (
        <div className="w-full h-full flex items-end justify-center pb-1 gap-1">
          <div className="w-2 h-5 bg-amber-950 border-t border-amber-400" />
          <div className="w-3 h-8 bg-amber-950 border-t-2 border-amber-300 shadow-[0_0_8px_#f59e0b] relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 border border-amber-200 rounded-full" />
          </div>
          <div className="w-2 h-6 bg-amber-950 border-t border-amber-400" />
        </div>
      )}
      {themeKey === 'acid' && (
        <div className="w-full h-full flex items-end justify-center px-2 pb-1 gap-1">
          <div className="w-1.5 h-3 bg-lime-400" />
          <div className="w-1.5 h-6 bg-cyan-400" />
          <div className="w-1.5 h-8 bg-pink-500 shadow-[0_0_6px_#ff007f]" />
          <div className="w-1.5 h-5 bg-lime-400" />
          <div className="w-1.5 h-7 bg-cyan-400" />
        </div>
      )}

      {/* Horizon Gate Strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: t.gatePrimary, boxShadow: `0 0 6px ${t.gateGlow}` }}
      />
    </div>
  );
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
          {/* Section 1: Celestial Goddess Avatars */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" /> 01 // SELECT CELESTIAL GODDESS AVATAR
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Divine incarnations & sacred aerodynamic halos
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
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <GoddessAvatarThumbnail craftKey={craftKey} />

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block">
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
                      <span className="text-slate-400 truncate max-w-[140px]">{c.classType}</span>
                      {isSelected ? (
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          BLESSED
                        </span>
                      ) : (
                        <span className="text-slate-400 hover:text-white">INVOKE</span>
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
                    <ThemeThumbnail themeKey={themeKey} />

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
