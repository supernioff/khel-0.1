import { useEffect, useState } from 'react';
import { Trophy, X, Sparkles, Zap, ShieldCheck, LogIn, RotateCcw, Trash2, AlertTriangle, UserPlus } from 'lucide-react';
import { getLeaderboard, resetLeaderboard } from '../lib/gameService';
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
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

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
      setShowResetConfirm(false);
      setResetSuccessMsg(null);
    }
  }, [isOpen, userProfile?.displayName, userProfile?.highScore]);

  const handleResetBoard = async () => {
    setResetting(true);
    try {
      const res = await resetLeaderboard();
      if (res.success) {
        setResetSuccessMsg('Leaderboard has been reset from scratch! All pilots start at 0 pts.');
        fetchLeaderboard();
        setTimeout(() => {
          setShowResetConfirm(false);
          setResetSuccessMsg(null);
        }, 2200);
      }
    } catch (err) {
      console.warn('Error resetting board:', err);
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  const isRegisteredPilot = Boolean(userProfile?.isRegisteredPilot);
  const activeCallsign = userProfile?.displayName || 'Cadet Pilot';

  return (
    <div
      id="leaderboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="leaderboard-modal-container"
        className="w-full max-w-md bg-slate-950/95 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] border-2 border-cyan-500/40 text-slate-100 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Futuristic Cyber Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 px-5 py-4 border-b border-cyan-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
                PILOT HALL OF FAME
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">
                LIVE SECTOR BENCHMARKS (ALL PILOTS)
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

        {/* Reset Confirmation Overlay */}
        {showResetConfirm && (
          <div className="bg-gradient-to-b from-rose-950/95 to-slate-950 p-4 border-b border-rose-500/50 space-y-2.5 font-mono text-xs shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-rose-400 font-black">
              <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
              <span>CONFIRM LEADERBOARD RESET FROM SCRATCH</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This will reset all high score records to 0 and clean legacy test data. All registered pilot accounts will start from scratch.
            </p>
            {resetSuccessMsg ? (
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{resetSuccessMsg}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResetBoard}
                  disabled={resetting}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl uppercase transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer"
                >
                  {resetting ? 'RESETTING...' : 'YES, RESET FROM SCRATCH'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        )}

        {/* Callsign / Registration Status Banner */}
        {isRegisteredPilot ? (
          <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/70 p-3 border-b border-cyan-500/30 flex items-center justify-between gap-2 font-mono text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_#34D399]" />
              <div className="min-w-0">
                <p className="font-bold text-cyan-300 text-[11px] truncate flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  PILOT: {activeCallsign.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  Ranked Pilot Account • High scores streaming live
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-lg text-[10px] transition-all cursor-pointer shrink-0"
              title="Reset Leaderboard from Scratch"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/70 p-3 border-b border-purple-500/30 flex items-center justify-between gap-2 font-mono text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-amber-300 text-[11px] truncate">
                  CADET (GUEST) MODE
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  Sign in or create a Callsign to post permanent scores!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenAuthModal && (
                <button
                  id="leaderboard-auth-action-btn"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-lg text-[10px] uppercase font-mono flex items-center gap-1 shrink-0 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>SIGN UP / IN</span>
                </button>
              )}
              <button
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-lg text-[10px] transition-all cursor-pointer"
                title="Reset Leaderboard from Scratch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 max-h-[56vh] overflow-y-auto space-y-2.5 custom-scrollbar font-mono text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono">RETRIEVING PILOT TELEMETRY...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto" />
              <p className="font-bold text-white">No pilot records registered yet.</p>
              <p className="text-xs text-slate-400">Sign Up with your Callsign and fly to set the benchmark!</p>
            </div>
          ) : (
            entries.map((player, idx) => {
              const myUid = currentUserUid || userProfile?.uid;
              const isCurrent =
                (myUid && player.uid === myUid) ||
                Boolean(userProfile?.displayName && player.displayName.trim().toLowerCase() === userProfile.displayName.trim().toLowerCase());
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
                  key={player.uid + idx}
                  id={`leaderboard-item-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {rankBadge}
                    {player.photoURL && player.photoURL.startsWith('#') ? (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border border-white/60 shrink-0 text-slate-950 shadow-sm"
                        style={{ backgroundColor: player.photoURL }}
                      >
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    ) : player.photoURL && player.photoURL.startsWith('http') ? (
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
                        {player.multiplayerWins ? `${player.multiplayerWins} duel victories` : 'Sector Pilot'}
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

        {/* Current Pilot Benchmark Footer */}
        {userProfile && (
          <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                isRegisteredPilot
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                  : 'text-amber-400 bg-amber-950/60 border-amber-500/40'
              }`}>
                {isRegisteredPilot ? 'REGISTERED PILOT' : 'CADET PILOT'}
              </span>
              <span className="text-white font-bold truncate max-w-[120px]">
                {userProfile.displayName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold shrink-0">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{userProfile.highScore || 0} pts</span>
            </div>
          </div>
        )}

        {/* Return to Cockpit Action */}
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
