import { useState } from 'react';
import { Volume2, VolumeX, Trophy, LogOut, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { soundManager } from '../lib/audio';
import type { UserProfile } from '../types/game';

interface Props {
  profile: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenLeaderboard: () => void;
}

export function UserProfileBar({
  profile,
  onOpenAuthModal,
  onLogout,
  onOpenLeaderboard,
}: Props) {
  const [muted, setMuted] = useState(soundManager.isMuted());

  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
  };

  const isRegistered = Boolean(profile?.isRegisteredPilot);

  return (
    <header
      id="top-profile-bar"
      className="w-full px-3.5 py-1.5 flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-sm font-mono text-xs"
    >
      {/* Left: User Info or Pilot Sign In */}
      <div className="flex items-center gap-2 min-w-0">
        {isRegistered && profile ? (
          <div className="flex items-center gap-2 min-w-0">
            {profile.photoURL && profile.photoURL.startsWith('#') ? (
              <div
                className="w-8 h-8 rounded-full border border-white flex items-center justify-center font-black text-xs text-slate-950 shrink-0"
                style={{ backgroundColor: profile.photoURL }}
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-cyan-400">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-[140px] flex items-center gap-1">
                <span>{profile.displayName}</span>
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              </p>
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold">
                <span>Best: {profile.highScore}</span>
                <span>•</span>
                <span>Wins: {profile.multiplayerWins}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              id="pilot-auth-top-btn"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Pilot Sign In / Up</span>
            </button>
            <span className="text-[10px] text-slate-400 hidden sm:inline-block">
              (Cadet Guest)
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Leaderboard, Sound, Logout */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="open-leaderboard-btn"
          onClick={onOpenLeaderboard}
          title="Global Leaderboard"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xs:inline">Rankings</span>
        </button>

        <button
          id="mute-sound-btn"
          onClick={handleToggleMute}
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {isRegistered && (
          <button
            id="logout-btn"
            onClick={onLogout}
            title="Sign Out of Callsign"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
