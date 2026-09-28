import { useEffect, useState } from 'react';
import { Trophy, X, Sparkles, Zap, ShieldCheck, RotateCcw, UserPlus } from 'lucide-react';
import { getLeaderboard } from '../lib/gameService';
import type { LeaderboardEntry, UserProfile } from '../types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid?: string;
  userProfile?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export function LeaderboardModal({
  isOpen,
  onClose,
  currentUserUid,
  userProfile,
  onOpenAuthModal,
}: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = () => {
    setLoading(true);
    getLeaderboard(userProfile)
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
  }, [isOpen, userProfile?.displayName, userProfile?.highScore]);

  if (!isOpen) return null;

  const isRegisteredPilot = Boolean(userProfile?.isRegisteredPilot);
  const activeCallsign = userProfile?.displayName || 'Cadet Pilot';

  return (
    <div
      id="leaderboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="leaderboard-modal-container"
        className="w-full max-w-md bg-slate-950/95 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] border border-cyan-500/40 text-slate-100 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[86vh]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Futuristic Cyber Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 px-3.5 py-3 sm:px-5 sm:py-4 border-b border-cyan-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-black tracking-wider text-white uppercase font-mono truncate">
                PILOT HALL OF FAME
              </h2>
              <p className="text-[10px] sm:text-[11px] text-cyan-400/80 font-mono truncate">
                GLOBAL SECTOR BENCHMARKS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              id="refresh-leaderboard-btn"
              onClick={fetchLeaderboard}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-slate-700/60 transition-all cursor-pointer"
              title="Refresh Leaderboard"
              aria-label="Refresh"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              id="close-leaderboard-btn"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-slate-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Callsign / Registration Status Banner */}
        {isRegisteredPilot ? (
          <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/70 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-cyan-500/30 flex items-center justify-between gap-2 font-mono text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_#34D399]" />
              <div className="min-w-0">
                <p className="font-bold text-cyan-300 text-[11px] sm:text-xs truncate flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  PILOT: {activeCallsign.toUpperCase()}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-300 truncate">
                  Ranked Pilot • Telemetry streaming live
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/70 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-purple-500/30 flex items-center justify-between gap-2 font-mono text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-amber-300 text-[11px] sm:text-xs truncate">
                  CADET (GUEST) MODE
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-300 truncate">
                  Sign in or create Callsign to post permanent scores!
                </p>
              </div>
            </div>
            {onOpenAuthModal && (
              <button
                id="leaderboard-auth-action-btn"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-2.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-lg text-[10px] uppercase font-mono flex items-center gap-1 shrink-0 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3 h-3" />
                <span>SIGN UP / IN</span>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-3 sm:p-4 max-h-[58vh] overflow-y-auto space-y-2 custom-scrollbar font-mono text-xs sm:text-sm">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center text-slate-400 space-y-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px] font-mono text-cyan-400">RETRIEVING PILOT TELEMETRY...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 mx-auto" />
              <p className="font-bold text-white text-xs sm:text-sm">No pilot records registered yet.</p>
              <p className="text-[11px] text-slate-400">Sign Up with your Callsign and fly to set the benchmark!</p>
            </div>
          ) : (
            entries.map((player, idx) => {
              const myUid = currentUserUid || userProfile?.uid;
              const isCurrent =
                (myUid && player.uid === myUid) ||
                Boolean(userProfile?.displayName && player.displayName.trim().toLowerCase() === userProfile.displayName.trim().toLowerCase());
              const rank = idx + 1;

              let rankBadge = (
                <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[10px] sm:text-xs shrink-0">
                  #{rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = (
                  <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold text-[10px] sm:text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-500/20 text-slate-200 border border-slate-400/60 font-bold text-[10px] sm:text-xs shrink-0">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-xl bg-amber-700/20 text-amber-400 border border-amber-600/60 font-bold text-[10px] sm:text-xs shrink-0">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={player.uid + idx}
                  id={`leaderboard-item-${idx}`}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {rankBadge}
                    {player.photoURL && player.photoURL.startsWith('#') ? (
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-black border border-white/60 shrink-0 text-slate-950 shadow-xs"
                        style={{ backgroundColor: player.photoURL }}
                      >
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    ) : player.photoURL && player.photoURL.startsWith('http') ? (
                      <img
                        src={player.photoURL}
                        alt={player.displayName}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-cyan-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-800 text-cyan-400 font-black flex items-center justify-center text-xs sm:text-sm border border-cyan-500/30 shrink-0">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white text-[11px] sm:text-xs truncate flex items-center gap-1.5">
                        <span className="truncate max-w-[110px] sm:max-w-[170px]">{player.displayName}</span>
                        {isCurrent && (
                          <span className="text-[8px] sm:text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-full font-mono shrink-0">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                        {player.multiplayerWins ? `${player.multiplayerWins} duels won` : 'Sector Pilot'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pl-2 text-right shrink-0">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-black text-cyan-300 text-sm sm:text-base drop-shadow-[0_0_8px_#00F0FF]">
                      {player.highScore}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono ml-0.5">pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current Pilot Benchmark Footer */}
        {userProfile && (
          <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className={`text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                isRegisteredPilot
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                  : 'text-amber-400 bg-amber-950/60 border-amber-500/40'
              }`}>
                {isRegisteredPilot ? 'REGISTERED' : 'CADET'}
              </span>
              <span className="text-white font-bold truncate max-w-[110px] sm:max-w-[150px] text-[11px] sm:text-xs">
                {userProfile.displayName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-cyan-300 font-bold shrink-0 text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span>{userProfile.highScore || 0} pts</span>
            </div>
          </div>
        )}

        {/* Return to Cockpit Action */}
        <div className="p-3 sm:p-4 bg-slate-900/60 border-t border-slate-800/80 text-center shrink-0">
          <button
            id="modal-close-confirm-btn"
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl uppercase font-mono text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer active:scale-98"
          >
            RETURN TO COCKPIT
          </button>
        </div>
      </div>
    </div>
  );
}
