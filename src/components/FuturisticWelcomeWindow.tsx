import { useState, useEffect } from 'react';
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
  ChevronRight,
  UserPlus,
  Eye,
  EyeOff,
  Film,
  Lock,
  User,
  KeyRound,
} from 'lucide-react';
import type { UserProfile, BirdCraftId } from '../types/game';
import { CinematicIntro } from './CinematicIntro';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegisterPilot: (
    username: string,
    password: string,
    avatarColor?: string
  ) => Promise<{ success: boolean; error?: string; code?: 'EXISTS' | 'INVALID' }>;
  onLoginPilot: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; code?: 'NOT_FOUND' | 'WRONG_PASSWORD' }>;
  onLogout?: () => void;
  profile: UserProfile | null;
  onContinueAsGuest?: () => void;
  initialView?: 'cinematic' | 'intro' | 'auth';
  onSelectCraft?: (craftId: BirdCraftId) => void;
}

const PILOT_AVATARS = [
  { id: 'valkyrie', label: 'Valkyrie-01', color: '#00F0FF', icon: '⚡' },
  { id: 'solaris', label: 'Solar-Pyro', color: '#FF4500', icon: '🔥' },
  { id: 'shadow', label: 'Void-Nox', color: '#A855F7', icon: '🌑' },
  { id: 'chrono', label: 'Flora-Bloom', color: '#10B981', icon: '🌿' },
  { id: 'titan', label: 'Aegis-Guard', color: '#F59E0B', icon: '🛡️' },
  { id: 'phase', label: 'Mirage-Astra', color: '#00FFA3', icon: '✨' },
];

export function FuturisticWelcomeWindow({
  isOpen,
  onClose,
  onRegisterPilot,
  onLoginPilot,
  onLogout,
  profile,
  onContinueAsGuest,
  initialView = 'cinematic',
}: Props) {
  const [phase, setPhase] = useState<'cinematic' | 'intro' | 'auth'>(initialView);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<'EXISTS' | 'NOT_FOUND' | 'WRONG_PASSWORD' | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Sync initial view when modal reopens
  useEffect(() => {
    if (isOpen) {
      setPhase(initialView);
      setErrorMsg(null);
      setErrorCode(null);
      setJustLoggedIn(false);
      if (profile?.isRegisteredPilot && profile.displayName) {
        setUsername(profile.displayName);
      }
    }
  }, [isOpen, initialView, profile?.displayName, profile?.isRegisteredPilot]);

  // Rotating telemetry radar effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isRegistered = Boolean(profile?.isRegisteredPilot);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMsg('Please enter your Pilot Callsign.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const avatarColor = PILOT_AVATARS[selectedAvatarIdx]?.color || '#00F0FF';
        const res = await onRegisterPilot(cleanUser, password, avatarColor);
        if (res.success) {
          setJustLoggedIn(true);
          setTimeout(() => {
            setJustLoggedIn(false);
            onClose();
          }, 900);
        } else {
          setErrorMsg(res.error || 'Registration failed.');
          if (res.code === 'EXISTS') {
            setErrorCode('EXISTS');
          }
        }
      } else {
        const res = await onLoginPilot(cleanUser, password);
        if (res.success) {
          setJustLoggedIn(true);
          setTimeout(() => {
            setJustLoggedIn(false);
            onClose();
          }, 900);
        } else {
          setErrorMsg(res.error || 'Sign in failed.');
          if (res.code === 'NOT_FOUND') {
            setErrorCode('NOT_FOUND');
          } else if (res.code === 'WRONG_PASSWORD') {
            setErrorCode('WRONG_PASSWORD');
          }
        }
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
    } else {
      onClose();
    }
  };

  return (
    <div
      id="futuristic-welcome-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleGuestBypass}
    >
      <div
        id="futuristic-welcome-modal"
        className="w-full max-w-lg bg-slate-950/95 rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.3)] border-2 border-cyan-500/40 text-slate-100 overflow-hidden flex flex-col max-h-[92vh] transition-all relative"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Futuristic Cyber Top Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 px-5 py-3 border-b border-cyan-500/30 flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#00F0FF]" />
            <span className="font-bold text-cyan-300 tracking-wider">
              QUANTUM COCKPIT TERMINAL
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline-block">
              // SEC-2099
            </span>
          </div>

          <button
            id="close-welcome-modal-btn"
            onClick={handleGuestBypass}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Phase Content */}
        {phase === 'cinematic' ? (
          /* PHASE 0: 2014 ORIGIN STORY CINEMATIC */
          <div className="p-4 sm:p-6 overflow-y-auto">
            <CinematicIntro
              onComplete={() => setPhase('auth')}
              onSkip={() => setPhase('auth')}
            />
          </div>
        ) : phase === 'intro' ? (
          /* PHASE 1: GAME INTRO & OVERVIEW */
          <div className="p-6 text-center space-y-5 font-mono overflow-y-auto flex flex-col items-center">
            {/* Holographic Radar Visualizer */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border border-cyan-500/30 animate-spin"
                style={{ animationDuration: '15s' }}
              />
              <div
                className="absolute inset-2 rounded-full border border-purple-500/30 animate-spin"
                style={{ animationDuration: '8s', animationDirection: 'reverse' }}
              />
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-900/60 to-purple-900/60 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                <span className="text-4xl">⚡</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 uppercase drop-shadow-[0_0_25px_rgba(0,240,255,0.5)]">
                CYBER FLAP 2099
              </h1>
              <p className="text-xs text-slate-300 max-w-sm mx-auto font-medium leading-relaxed">
                Step into the high-velocity cyber corridor. Register your Pilot Callsign, master supersonic warp gates, and claim sector supremacy on the global leaderboard.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2 pt-2">
              <button
                id="welcome-advance-btn"
                onClick={() => setPhase('auth')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black rounded-xl uppercase text-xs tracking-wider transition-all duration-200 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 fill-current text-slate-950" />
                <span>PILOT SIGN IN / SIGN UP</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPhase('cinematic')}
                className="w-full py-2.5 px-3 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>REPLAY 2014 ORIGIN CINEMATIC</span>
              </button>

              <button
                onClick={handleGuestBypass}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
              >
                Fly as Cadet (Guest) &gt;
              </button>
            </div>
          </div>
        ) : (
          /* PHASE 2: PILOT USERNAME & PASSWORD AUTHENTICATION */
          <div className="p-5 sm:p-6 space-y-4 font-mono overflow-y-auto">
            {/* Feedback Banners */}
            {justLoggedIn && (
              <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs flex items-center gap-2.5 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 animate-bounce" />
                <div>
                  <p className="font-black text-cyan-300">CALLSIGN CLEARED & LOGGED IN!</p>
                  <p className="text-[11px] text-cyan-200/80">
                    Welcome back, Pilot. Your telemetry is actively streaming to the Global Leaderboard.
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-300">AUTHENTICATION NOTICE</p>
                    <p className="text-[11px] text-red-200/90 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>

                {/* Helpful 1-Click Action Button when username exists or not found */}
                {errorCode === 'EXISTS' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMsg(null);
                      setErrorCode(null);
                    }}
                    className="w-full py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>SWITCH TO SIGN IN WITH THIS CALLSIGN</span>
                  </button>
                )}

                {errorCode === 'NOT_FOUND' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                      setErrorCode(null);
                    }}
                    className="w-full py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>CREATE NEW ACCOUNT FOR THIS CALLSIGN</span>
                  </button>
                )}
              </div>
            )}

            {isRegistered && profile ? (
              /* Already Logged In Card */
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    VERIFIED PILOT CALLSIGN
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    RANKED PILOT
                  </span>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0"
                    style={{ backgroundColor: profile.photoURL || '#00F0FF' }}
                  >
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-white text-base truncate">
                      {profile.displayName}
                    </p>
                    <p className="text-[10px] text-cyan-400 font-mono truncate">
                      CALLSIGN ID: @{profile.displayName.toLowerCase()}
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
                    <span>ENTER COCKPIT & FLY</span>
                  </button>

                  {onLogout && (
                    <button
                      id="welcome-signout-btn"
                      onClick={onLogout}
                      className="py-3 px-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                      title="Sign Out of Callsign"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-[10px]">LOGOUT</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Sign In / Sign Up Form */
              <div className="space-y-4">
                {/* Clean Tab Switcher: SIGN IN vs SIGN UP */}
                <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMsg(null);
                      setErrorCode(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authMode === 'signin'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>SIGN IN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                      setErrorCode(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authMode === 'signup'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>SIGN UP (NEW PILOT)</span>
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                    {authMode === 'signin'
                      ? 'PILOT SIGN IN // ENTER COCKPIT'
                      : 'REGISTER CALLSIGN // GLOBAL LEADERBOARD'}
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {authMode === 'signin'
                      ? 'Enter your registered Callsign and Password to sync your high score.'
                      : 'Set your unique Callsign and Password to start your pilot career on the Leaderboard.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 text-left">
                  {/* Callsign / Username Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Pilot Callsign (Username)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="pilot-username-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. Maverick, AeroAce, Falcon7"
                        maxLength={20}
                        required
                        className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      <span>Password (Access Key)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="pilot-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={authMode === 'signup' ? 'Create a secure password (4+ chars)' : 'Enter your password'}
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Avatar Insignia Selector (Only in Sign Up Mode) */}
                  {authMode === 'signup' && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Choose Pilot Insignia Badge
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {PILOT_AVATARS.map((av, idx) => (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setSelectedAvatarIdx(idx)}
                            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm transition-all cursor-pointer shrink-0 ${
                              selectedAvatarIdx === idx
                                ? 'border-white scale-110 shadow-[0_0_15px_#00F0FF]'
                                : 'border-slate-700 opacity-60 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: av.color }}
                            title={av.label}
                          >
                            {av.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <button
                    id="pilot-auth-submit-btn"
                    type="submit"
                    disabled={loading || !username.trim() || !password}
                    className={`w-full py-3.5 px-4 font-black rounded-xl uppercase font-mono text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-98 mt-2 ${
                      authMode === 'signup'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>PROCESSING TELEMETRY...</span>
                      </div>
                    ) : authMode === 'signup' ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>REGISTER CALLSIGN & ENTER COCKPIT</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>AUTHENTICATE & ENTER COCKPIT</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Always Available Guest Mode Option */}
                <div className="pt-2 border-t border-slate-800/80 text-center space-y-2">
                  <button
                    id="welcome-guest-btn"
                    type="button"
                    onClick={handleGuestBypass}
                    className="w-full py-2.5 px-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500/40 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>FLY AS GUEST / CADET</span>
                    <span className="text-slate-500 text-[10px]">
                      (Instant offline flight)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="px-6 py-2.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <span>CYBER FLAP QUANTUM MATRIX</span>
          <span className="text-cyan-400/80 font-bold">PRESS [SPACE] TO THRUST</span>
        </div>
      </div>
    </div>
  );
}
