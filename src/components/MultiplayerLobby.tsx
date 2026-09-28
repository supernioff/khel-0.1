import { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  LogIn,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Zap,
  Swords,
} from 'lucide-react';
import type { MultiplayerRoom, UserProfile } from '../types/game';
import type { User } from 'firebase/auth';
import {
  createMultiplayerRoom,
  joinMultiplayerRoomByCode,
  startMatchCountdown,
  leaveRoom,
} from '../lib/gameService';

interface Props {
  userProfile: UserProfile;
  activeRoom: MultiplayerRoom | null;
  onRoomUpdated: (room: MultiplayerRoom | null) => void;
  onBackToMenu: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export function MultiplayerLobby({
  userProfile,
  activeRoom,
  onRoomUpdated,
  onBackToMenu,
  onOpenAuthModal,
}: Props) {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check URL params for quick join e.g. ?room=FLY82
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !activeRoom) {
      setInputCode(roomParam.toUpperCase());
    }
  }, [activeRoom]);

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const room = await createMultiplayerRoom(userProfile);
      onRoomUpdated(room);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create room.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || inputCode).trim().toUpperCase();
    if (!code) {
      setError('Please enter a 6-character room code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const room = await joinMultiplayerRoomByCode(code, userProfile);
      onRoomUpdated(room);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not join room.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${activeRoom.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartRace = async () => {
    if (!activeRoom || !activeRoom.guest) return;

    try {
      setLoading(true);
      setError(null);
      await startMatchCountdown(activeRoom.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start race.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (activeRoom) {
      const isHost = activeRoom.host.uid === userProfile.uid;
      await leaveRoom(activeRoom.id, isHost);
      onRoomUpdated(null);
    } else {
      onBackToMenu();
    }
  };

  // If in a room, render the Room Lobby
  if (activeRoom) {
    const isHost = activeRoom.host.uid === userProfile.uid;
    const hasGuest = !!activeRoom.guest;

    return (
      <div
        id="multiplayer-room-view"
        className="w-full max-w-lg mx-auto bg-slate-950/95 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] p-5 sm:p-6 space-y-5 text-slate-100 font-mono my-auto"
      >
        {/* Top Header with Back button */}
        <div className="flex items-center justify-between">
          <button
            id="leave-room-btn"
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EXIT LOBBY</span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>QUANTUM LINK ACTIVE</span>
          </div>
        </div>

        {/* Room Code Card */}
        <div className="bg-gradient-to-br from-slate-900 via-cyan-950/60 to-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 text-center space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            SECTOR FREQUENCY CODE
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl sm:text-4xl font-black tracking-widest font-mono text-white drop-shadow-[0_0_12px_#00F0FF]">
              {activeRoom.code}
            </span>
            <button
              id="copy-code-btn"
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
              title="Copy code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            id="share-link-btn"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300 transition-colors cursor-pointer border border-slate-700"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Invite Link'}</span>
          </button>
        </div>

        {/* Pilot Matchup */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            PILOT TELEMETRY
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Host Pilot */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/40 space-y-2 text-center">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded-full">
                HOST PILOT
              </span>
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black flex items-center justify-center text-lg border-2 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                {activeRoom.host.displayName.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-white text-xs truncate">
                {activeRoom.host.displayName}
              </p>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> READY
              </p>
            </div>

            {/* Challenger Pilot */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/40 space-y-2 text-center">
              <span className="text-[10px] font-bold text-purple-400 bg-purple-950/40 border border-purple-500/40 px-2 py-0.5 rounded-full">
                CHALLENGER
              </span>
              {hasGuest && activeRoom.guest ? (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-lg border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                    {activeRoom.guest.displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-white text-xs truncate">
                    {activeRoom.guest.displayName}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> READY
                  </p>
                </>
              ) : (
                <div className="py-2 space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                    <Users className="w-4 h-4 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400">Waiting for pilot...</p>
                  <p className="text-[9px] text-slate-500">Share code or link</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Start Game Action */}
        <div className="pt-1">
          {isHost ? (
            <button
              id="host-start-race-btn"
              disabled={!hasGuest || loading}
              onClick={handleStartRace}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 uppercase tracking-wider transition-all ${
                hasGuest && !loading
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 active:scale-98 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? (
                <span>INITIALIZING WARP...</span>
              ) : hasGuest ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>ENGAGE MULTIPLAYER RACE</span>
                </>
              ) : (
                <span>WAITING FOR CHALLENGER TO JOIN...</span>
              )}
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-center text-xs font-bold text-purple-300 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              <span>LINK ESTABLISHED. WAITING FOR HOST TO ENGAGE...</span>
            </div>
          )}
        </div>

        {/* Match Rules Info */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <p className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> QUANTUM FLIGHT PROTOCOL
          </p>
          <p>• Both pilots encounter synchronized cyber gate elevations.</p>
          <p>• Opponent visible live as a holographic quantum ghost bird.</p>
          <p>• Higher score and longer flight marks victory!</p>
        </div>
      </div>
    );
  }

  // Lobby Menu: Create Room or Join Room via Code
  return (
    <div
      id="multiplayer-menu-view"
      className="w-full max-w-lg mx-auto bg-slate-950/95 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] p-5 sm:p-6 space-y-5 text-slate-100 font-mono my-auto"
    >
      {/* Title */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-1">
          <Swords className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white uppercase">
          QUANTUM DUEL ARENA
        </h2>
        <p className="text-xs text-slate-400">
          Real-time synchronized multiplayer dogfight with live ghost bird!
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs text-center font-mono">
          {error}
        </div>
      )}

      {!userProfile.isRegisteredPilot && onOpenAuthModal && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>PILOT CALLSIGN & LEADERBOARD SYNC</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            You are currently playing as Cadet Pilot. Sign Up or Sign In with your Callsign to record duel victories and stream stats to the Global Leaderboard!
          </p>
          <button
            onClick={onOpenAuthModal}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>REGISTER OR SIGN IN CALLSIGN</span>
          </button>
        </div>
      )}

      {/* Action 1: Create a new room */}
      <div className="bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-cyan-500/30 space-y-2.5">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-white">HOST QUANTUM SECTOR</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Create a private race room and obtain a unique sector code to duel your friend.
        </p>
        <button
          id="create-room-btn"
          disabled={loading}
          onClick={handleCreateRoom}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{loading ? 'CREATING SECTOR...' : 'CREATE RACE SECTOR'}</span>
        </button>
      </div>

      {/* Action 2: Join an existing room via Code */}
      <div className="bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-purple-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm text-white">JOIN SECTOR CODE</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Enter the 6-character room code received from your rival.
        </p>

        <div className="flex gap-2">
          <input
            id="room-code-input"
            type="text"
            placeholder="e.g. BIRD48"
            value={inputCode}
            maxLength={8}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold tracking-wider uppercase text-white placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-400"
          />
          <button
            id="join-room-btn"
            disabled={loading || !inputCode.trim()}
            onClick={() => handleJoinRoom()}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer ${
              inputCode.trim() && !loading
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-98'
                : 'bg-slate-800 text-slate-600 shadow-none cursor-not-allowed'
            }`}
          >
            {loading ? 'LINKING...' : 'JOIN'}
          </button>
        </div>
      </div>

      {/* Back button */}
      <button
        id="back-to-singleplayer-btn"
        onClick={onBackToMenu}
        className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        ← RETURN TO SOLO WARP
      </button>
    </div>
  );
}

