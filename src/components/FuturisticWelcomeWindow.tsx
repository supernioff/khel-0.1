import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Trophy,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Radio,
  ChevronRight,
  Compass,
  Cpu,
  RotateCw,
  Film,
  Crown,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { UserProfile, BirdCraftId } from '../types/game';
import { CinematicIntro } from './CinematicIntro';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginGoogle: () => Promise<boolean>;
  onLogout?: () => void;
  currentUser: User | null;
  profile: UserProfile | null;
  onContinueAsGuest?: () => void;
  initialView?: 'cinematic' | 'intro' | 'auth';
  onSelectCraft?: (craftId: BirdCraftId) => void;
}

export function FuturisticWelcomeWindow({
  isOpen,
  onClose,
  onLoginGoogle,
  onLogout,
  currentUser,
  profile,
  onContinueAsGuest,
  initialView = 'cinematic',
  onSelectCraft,
}: Props) {
  const [phase, setPhase] = useState<'cinematic' | 'intro' | 'auth'>(initialView);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Sync initial view when modal reopens
  useEffect(() => {
    if (isOpen) {
      setPhase(initialView);
      setErrorMsg(null);
      setJustLoggedIn(false);
    }
  }, [isOpen, initialView]);

  // Procedural rotating telemetry angle
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isGoogleUser = !!currentUser && !currentUser.isAnonymous;

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await onLoginGoogle();
      if (success) {
        setJustLoggedIn(true);
        setTimeout(() => {
          setJustLoggedIn(false);
          onClose();
        }, 1200);
      } else {
        setErrorMsg('Sign-in cancelled or window closed. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBypass = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
    onClose();
  };

  if (phase === 'cinematic') {
    return (
      <CinematicIntro
        onComplete={(unlockedGoddess) => {
          if (unlockedGoddess && onSelectCraft) {
            onSelectCraft('goddess');
          }
          setPhase('intro');
        }}
        onSkip={() => setPhase('intro')}
      />
    );
  }

  return (
    <div
      id="welcome-window-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={(e) => {
        // Prevent background clicks from starting game
        e.stopPropagation();
      }}
    >
      {/* Background Animated Cyber Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      <div
        id="welcome-window-container"
        className="w-full max-w-lg bg-slate-950/98 rounded-3xl shadow-[0_0_80px_rgba(0,240,255,0.3)] border-2 border-cyan-500/40 text-slate-100 overflow-hidden flex flex-col relative z-10 transition-all duration-500 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between shrink-0 font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">
              {phase === 'intro' ? 'CYBER SYSTEM BOOT // v4.2' : 'PRE-FLIGHT PILOT CLEARANCE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhase('cinematic')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900/90 text-[10px] text-amber-300 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1 font-bold"
              title="Watch 2014 Origin & Goddess Awakening Cinematic"
            >
              <Film className="w-3 h-3 text-amber-400" />
              <span>ORIGIN STORY</span>
            </button>

            {phase === 'auth' && (
              <button
                onClick={() => setPhase('intro')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer"
              >
                ◀ INTRO
              </button>
            )}
            <button
              id="welcome-modal-close-btn"
              onClick={handleGuestBypass}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
              aria-label="Close"
              title="Close & Enter Cockpit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PHASE 1: FUTURISTIC INTRO WITH ROTATING RINGS & KINETIC GAME TITLE */}
        {phase === 'intro' ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6 font-mono overflow-y-auto">
            {/* The Spectacular Rounding Concentric Cyber Rings */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-2 shrink-0">
              {/* Outer Ring 1: Clockwise Dashed Compass Ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)',
                }}
              >
                {/* Orbital Corner Tick Markers */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#00F0FF]" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400" />
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400" />
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400" />
              </div>

              {/* Middle Ring 2: Counter-Clockwise Neon Pulse Ring */}
              <div
                className="absolute inset-5 sm:inset-6 rounded-full border-2 border-t-purple-400 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin"
                style={{
                  animationDuration: '6s',
                  animationDirection: 'reverse',
                  boxShadow: 'inset 0 0 20px rgba(168, 85, 247, 0.2)',
                }}
              />

              {/* Inner Ring 3: Fast Revolving Quantum Accelerator */}
              <div
                className="absolute inset-11 sm:inset-12 rounded-full border border-dotted border-cyan-300/60 animate-spin"
                style={{ animationDuration: '4s' }}
              />

              {/* Core Reactor: Holographic Cyber Bird Emblem */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-purple-950 border-2 border-cyan-400 shadow-[0_0_35px_rgba(0,240,255,0.6)] flex flex-col items-center justify-center p-3 animate-pulse">
                <svg viewBox="0 0 40 40" className="w-12 h-12 drop-shadow-[0_0_10px_#00F0FF]">
                  {/* Cyber Bird Silhouette */}
                  <path
                    d="M6 20 C10 14, 18 10, 26 12 C32 14, 38 18, 38 20 C38 22, 30 26, 22 26 C16 26, 10 24, 6 20 Z"
                    fill="#00F0FF"
                    opacity="0.85"
                  />
                  <polygon points="14,14 26,8 24,18 12,22" fill="#38BDF8" />
                  <ellipse cx="28" cy="18" rx="3.5" ry="2" fill="#FFFFFF" />
                  <path d="M4 20 L-2 18 L-2 22 Z" fill="#F43F5E" />
                </svg>
                <span className="text-[9px] font-black tracking-widest text-cyan-300 mt-1 uppercase">
                  WARP CORE
                </span>
              </div>

              {/* Floating Orbiting HUD Badges */}
              <div
                className="absolute text-[10px] tracking-widest font-black text-cyan-400 bg-slate-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all"
                style={{
                  top: '6%',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${-rotationAngle * 0.4}deg)`,
                }}
              >
                // ORBIT 2099
              </div>

              <div
                className="absolute text-[9px] tracking-wider font-bold text-amber-300 bg-slate-950/90 border border-amber-500/50 px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all"
                style={{
                  bottom: '6%',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${rotationAngle * 0.4}deg)`,
                }}
              >
                HALL OF FAME LINK
              </div>
            </div>

            {/* Kinetic Game Title Presentation */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>CYBERNETIC AEROSPACE WARP</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 uppercase drop-shadow-[0_0_25px_rgba(0,240,255,0.5)]">
                CYBER FLAP 2099
              </h1>

              <p className="text-xs text-slate-300 max-w-sm mx-auto font-medium leading-relaxed">
                Step into the high-velocity cyber corridor. Master supersonic warp gates, pilot legendary mechanical crafts, and claim sector supremacy on the global leaderboard.
              </p>
            </div>

            {/* Live Systems Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm text-left text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 block text-[9px]">WARP PROPULSION</span>
                  <span className="text-emerald-400 font-bold">100% ONLINE</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 block text-[9px]">SECTOR LEADERBOARD</span>
                  <span className="text-amber-300 font-bold">LIVE SYNCED</span>
                </div>
              </div>
            </div>

            {/* Transition Action to Pilot Authentication */}
            <div className="w-full max-w-sm space-y-2 pt-2">
              <button
                id="welcome-advance-btn"
                onClick={() => setPhase('auth')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black rounded-xl uppercase text-xs tracking-wider transition-all duration-200 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 fill-current text-slate-950" />
                <span>INITIALIZE PILOT CLEARANCE</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                id="play-cinematic-btn"
                onClick={() => setPhase('cinematic')}
                className="w-full py-2.5 px-3 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>REPLAY 2014 ORIGIN & GODDESS CINEMATIC</span>
              </button>

              <button
                onClick={handleGuestBypass}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
              >
                Skip straight to offline cockpit &gt;
              </button>
            </div>
          </div>
        ) : (
          /* PHASE 2: GOOGLE PILOT CLEARANCE ("where you ask gmail and all like you do now") */
          <div className="p-6 space-y-5 font-mono overflow-y-auto">
            {/* Feedback Banners */}
            {justLoggedIn && (
              <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs flex items-center gap-2.5 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 animate-bounce" />
                <div>
                  <p className="font-black text-cyan-300">CALLSIGN VERIFIED!</p>
                  <p className="text-[11px] text-cyan-200/80">
                    Telemetry link active. Your high scores will stream to the Global Hall of Fame!
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-950/70 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-300">AUTHENTICATION INTERRUPTED</p>
                  <p className="text-[11px] text-red-200/80">{errorMsg}</p>
                </div>
              </div>
            )}

            {isGoogleUser && profile ? (
              /* Already Logged In Card */
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    PILOT CALLSIGN VERIFIED
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    RANKED PILOT
                  </span>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.displayName}
                      className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-cyan-300 font-mono font-black flex items-center justify-center text-base border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-white text-sm truncate">
                      {profile.displayName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {profile.email || 'Google Pilot Identity'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Best: {profile.highScore} pts
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-cyan-400 font-bold">
                        {profile.multiplayerWins} duels won
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    id="welcome-start-game-btn"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>ENGAGE TAKEOFF</span>
                  </button>

                  {onLogout && (
                    <button
                      id="welcome-signout-btn"
                      onClick={onLogout}
                      className="py-3 px-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                      title="Sign Out to Switch Pilot"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-[10px]">SWITCH</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Not Logged In State */
              <div className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold mb-1 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>GLOBAL PILOT HALL OF FAME</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                    LINK GOOGLE PILOT CALLSIGN
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Authenticate with your Google account before takeoff so your high scores, pilot callsign, and photo appear permanently on the <span className="text-cyan-400 font-bold">Global Leaderboard</span>!
                  </p>
                </div>

                {/* Feature Points */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">Sector Hall of Fame</p>
                      <p className="text-[10px] text-slate-400">
                        Compete for the #1 spot on the global Hall of Fame.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">Verified Pilot Avatar</p>
                      <p className="text-[10px] text-slate-400">
                        Feature your genuine Google pilot photo in solo runs and duels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                      <Radio className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">Cloud Telemetry Sync</p>
                      <p className="text-[10px] text-slate-400">
                        Records and high scores saved securely in the cloud.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Official Google Login Button */}
                <button
                  id="welcome-google-auth-btn"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl uppercase font-mono text-xs tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-900">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>CONNECTING TO GOOGLE...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27A7.06 7.06 0 0 1 4.9 12c0-.79.14-1.55.38-2.27V6.58H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>SIGN IN WITH GOOGLE</span>
                    </>
                  )}
                </button>

                {/* Secondary Option: Guest Bypass */}
                <div className="pt-1 text-center">
                  <button
                    id="welcome-guest-btn"
                    onClick={handleGuestBypass}
                    className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-[11px] font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Fly as Unranked Guest</span>
                    <span className="text-slate-500 text-[10px]">
                      (Scores saved locally only)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <span>QUANTUM FLIGHT MATRIX // v4.2</span>
          <span className="text-cyan-400/80 font-bold">PRESS [SPACE] TO THRUST</span>
        </div>
      </div>
    </div>
  );
}
