import { useState } from 'react';
import { Volume2, VolumeX, Trophy, LogOut, Sparkles } from 'lucide-react';
import { soundManager } from '../lib/audio';
import type { UserProfile } from '../types/game';
import type { User } from 'firebase/auth';

interface Props {
  firebaseUser: User | null;
  profile: UserProfile | null;
  onLoginGoogle: () => void;
  onLogout: () => void;
  onOpenLeaderboard: () => void;
}

export function UserProfileBar({
  firebaseUser,
  profile,
  onLoginGoogle,
  onLogout,
  onOpenLeaderboard,
}: Props) {
  const [muted, setMuted] = useState(soundManager.isMuted());

  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
  };

  const isGuest = !firebaseUser || firebaseUser.isAnonymous;

  return (
    <header
      id="top-profile-bar"
      className="w-full px-3.5 py-1.5 flex items-center justify-between gap-2 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-200/80 shadow-sm"
    >
      {/* Left: User Info or Google Login */}
      <div className="flex items-center gap-2 min-w-0">
        {firebaseUser && !isGuest && profile ? (
          <div className="flex items-center gap-2 min-w-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[110px] sm:max-w-[140px]">
                {profile.displayName}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                <span>Best: {profile.highScore}</span>
                <span>•</span>
                <span>Wins: {profile.multiplayerWins}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              id="google-signin-btn"
              onClick={onLoginGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
              <span>Sign In with Google</span>
            </button>
            {isGuest && profile && (
              <span className="text-[10px] text-slate-500 hidden sm:inline-block">
                (Playing as Guest)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Leaderboard, Sound, Logout */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="open-leaderboard-btn"
          onClick={onOpenLeaderboard}
          title="Global Leaderboard"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all active:scale-95"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden xs:inline">Rankings</span>
        </button>

        <button
          id="mute-sound-btn"
          onClick={handleToggleMute}
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
        </button>

        {firebaseUser && !isGuest && (
          <button
            id="logout-btn"
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
