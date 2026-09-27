import { useEffect, useState } from 'react';
import { Trophy, X, Medal, Sparkles, Zap, ShieldCheck, LogIn, RotateCcw } from 'lucide-react';
import { getLeaderboard } from '../lib/gameService';
import type { LeaderboardEntry, UserProfile } from '../types/game';
import type { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid?: string;
  userProfile?: UserProfile | null;
  currentUser?: User | null;
  onLoginGoogle?: () => void;
}

export function LeaderboardModal({
  isOpen,
  onClose,
  currentUserUid,
  userProfile,
  currentUser,
  onLoginGoogle,
}: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = () => {
    setLoading(true);
    getLeaderboard()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isGoogleUser = !!currentUser && !currentUser.isAnonymous;

  return (
    <div
      id="leaderboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="leaderboard-modal-container"
        className="w-full max-w-md bg-slate-950/95 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] border-2 border-cyan-500/40 text-slate-100 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Futuristic Cyber Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 px-6 py-4 border-b border-cyan-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
                GLOBAL PILOT HALL OF FAME
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">
                SECTOR QUANTUM FLIGHT BENCHMARKS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="refresh-leaderboard-btn"
              onClick={fetchLeaderboard}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-slate-700/60 transition-all cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="close-leaderboard-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-slate-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unranked Warning Banner if not logged in with Google */}
        {!isGoogleUser && onLoginGoogle && (
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 p-3 border-b border-amber-500/30 flex items-center justify-between gap-2 font-mono text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-amber-300 text-[11px] truncate">
                  UNRANKED CALLSIGN
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  Log in with Google to post your scores here!
                </p>
              </div>
            </div>
            <button
              id="leaderboard-google-login-btn"
              onClick={onLoginGoogle}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] uppercase font-mono flex items-center gap-1 shrink-0 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>SIGN IN</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 max-h-[58vh] overflow-y-auto space-y-2.5 custom-scrollbar font-mono text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono">RETRIEVING PILOT TELEMETRY...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto" />
              <p className="font-bold text-white">No pilot records registered yet.</p>
              <p className="text-xs text-slate-400">Engage warp in Solo Flight to set the sector benchmark!</p>
            </div>
          ) : (
            entries.map((player, idx) => {
              const isCurrent = player.uid === currentUserUid;
              const rank = idx + 1;

              let rankBadge = (
                <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs">
                  #{rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = (
                  <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-500/20 text-slate-200 border border-slate-400/60 font-bold text-xs">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-amber-700/20 text-amber-400 border border-amber-600/60 font-bold text-xs">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={player.uid}
                  id={`leaderboard-item-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {rankBadge}
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt={player.displayName}
                        className="w-9 h-9 rounded-full object-cover border border-cyan-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-cyan-400 font-black flex items-center justify-center text-sm border border-cyan-500/30 shrink-0">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                        {player.displayName}
                        {isCurrent && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-full font-mono">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {player.multiplayerWins ? `${player.multiplayerWins} duel victories` : 'Solo Warp Pilot'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pl-3 text-right">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-black text-cyan-300 text-base drop-shadow-[0_0_8px_#00F0FF]">
                      {player.highScore}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-0.5">pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current Pilot Benchmark Badge */}
        {userProfile && (
          <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                isGoogleUser
                  ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40'
                  : 'text-amber-400 bg-amber-950/60 border-amber-500/40'
              }`}>
                {isGoogleUser ? 'VERIFIED PILOT' : 'GUEST CALLSIGN'}
              </span>
              <span className="text-white font-bold truncate max-w-[120px]">
                {userProfile.displayName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{userProfile.highScore || 0} pts</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 text-center shrink-0">
          <button
            id="modal-close-confirm-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl uppercase font-mono text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
          >
            RETURN TO COCKPIT
          </button>
        </div>
      </div>
    </div>
  );
}
