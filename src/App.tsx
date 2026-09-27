/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type User,
} from './lib/firebase';
import {
  getOrCreateUserProfile,
  getLocalGuestProfile,
  subscribeToRoom,
} from './lib/gameService';
import { FlappyGame } from './components/FlappyGame';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ThemeWindow } from './components/ThemeWindow';
import { FuturisticWelcomeWindow } from './components/FuturisticWelcomeWindow';
import type { UserProfile, MultiplayerRoom, CyberThemeId, BirdCraftId } from './types/game';
import { Palette, Trophy, Gamepad2, Users } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<'single' | 'multiplayer'>('single');
  const [currentTheme, setCurrentTheme] = useState<CyberThemeId>(() => {
    try {
      return (localStorage.getItem('flappy_theme') as CyberThemeId) || 'cyberpunk';
    } catch {
      return 'cyberpunk';
    }
  });
  const [currentCraft, setCurrentCraft] = useState<BirdCraftId>(() => {
    try {
      return (localStorage.getItem('flappy_bird_craft') as BirdCraftId) || 'falcon';
    } catch {
      return 'falcon';
    }
  });
  const [showThemeWindow, setShowThemeWindow] = useState(false);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [welcomeInitialView, setWelcomeInitialView] = useState<'cinematic' | 'intro' | 'auth'>('cinematic');
  const [hasAskedAuthBeforeGame, setHasAskedAuthBeforeGame] = useState(false);
  const [isGuestDismissed, setIsGuestDismissed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const isModalOpen = showThemeWindow || showLeaderboard || showAuthModal;

  const handleSelectCraft = (c: BirdCraftId) => {
    setCurrentCraft(c);
    try {
      localStorage.setItem('flappy_bird_craft', c);
    } catch {
      // ignore
    }
  };

  const handleSelectTheme = (t: CyberThemeId) => {
    setCurrentTheme(t);
    try {
      localStorage.setItem('flappy_theme', t);
    } catch {
      // ignore
    }
  };

  // Check URL params for room code on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setMode('multiplayer');
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser(user);
        try {
          const prof = await getOrCreateUserProfile(user);
          if (isMounted) setProfile(prof);
        } catch (e) {
          console.warn('Profile fetch fallback to local:', e);
          if (isMounted) setProfile(getLocalGuestProfile());
        }
        if (isMounted) setAuthLoading(false);
      } else {
        // Attempt anonymous sign-in, with graceful fallback to local guest session
        // if anonymous sign-in is disabled in Firebase console (auth/admin-restricted-operation)
        try {
          await signInAnonymously(auth);
        } catch (err: unknown) {
          // Anonymous authentication is restricted or offline; establish guest pilot session
          if (isMounted) {
            setCurrentUser(null);
            setProfile(getLocalGuestProfile());
            setAuthLoading(false);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Subscribe to real-time room updates if in an active room
  useEffect(() => {
    if (!activeRoom?.id) return;

    const unsubscribe = subscribeToRoom(activeRoom.id, (room) => {
      setActiveRoom(room);
      if (!room) {
        // Room deleted or ended
        setMode('single');
      }
    });

    return () => unsubscribe();
  }, [activeRoom?.id]);

  // Check if we need to ask the user to log in with Google before the game starts
  useEffect(() => {
    if (!authLoading && !hasAskedAuthBeforeGame) {
      const isGoogle = !!currentUser && !currentUser.isAnonymous;
      if (!isGoogle) {
        setShowAuthModal(true);
      }
    }
  }, [authLoading, currentUser, hasAskedAuthBeforeGame]);

  // Google Sign-In
  const handleGoogleLogin = async (): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setCurrentUser(cred.user);
        const prof = await getOrCreateUserProfile(cred.user);
        setProfile(prof);
        setHasAskedAuthBeforeGame(true);
        return true;
      }
      return false;
    } catch (err: unknown) {
      console.warn('Google sign-in cancelled or failed:', err);
      return false;
    }
  };

  // Sign out (reverts smoothly to local guest pilot)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setProfile(getLocalGuestProfile());
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updated });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col p-0 m-0 select-none relative font-sans">
      {/* Main Full-Screen Game or Lobby Arena */}
      <main className="w-full h-full flex-1 relative flex flex-col overflow-hidden">
        {authLoading ? (
          <div className="flex flex-col items-center justify-center h-full w-full space-y-4 bg-slate-950">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#00F0FF]" />
            <p className="text-sm font-mono tracking-widest text-cyan-400 uppercase">
              INITIALIZING CYBER COCKPIT...
            </p>
          </div>
        ) : mode === 'single' ? (
          profile && (
            <FlappyGame
              userProfile={profile}
              onUpdateProfile={handleUpdateProfile}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
              themeId={currentTheme}
              onSelectTheme={handleSelectTheme}
              craftId={currentCraft}
              onSelectCraft={handleSelectCraft}
              onOpenThemeWindow={() => setShowThemeWindow(true)}
              currentUser={currentUser}
              onOpenAuthModal={() => {
                setWelcomeInitialView('auth');
                setShowAuthModal(true);
              }}
              onLoginGoogle={handleGoogleLogin}
              isModalOpen={isModalOpen}
              onOpenCinematic={() => {
                setWelcomeInitialView('cinematic');
                setShowAuthModal(true);
              }}
              isGuestDismissed={isGuestDismissed}
              onDismissGuestClearance={() => setIsGuestDismissed(true)}
              currentMode={mode}
              onSelectMode={(m) => {
                setMode(m);
                if (m === 'single') setActiveRoom(null);
              }}
            />
          )
        ) : (
          profile && (
            <>
              {/* If room is not yet started, show Cyber Multiplayer Lobby */}
              {!activeRoom || activeRoom.status === 'waiting' ? (
                <div className="w-full h-full flex flex-col items-center justify-start p-3 sm:p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-y-auto custom-scrollbar">
                  {/* Top Bar for Lobby */}
                  <div className="w-full max-w-lg flex items-center justify-between mb-4 shrink-0">
                    {/* Main Screen Flight Mode Switcher */}
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)] font-mono">
                      <button
                        id="lobby-mode-solo-btn"
                        onClick={() => {
                          setMode('single');
                          setActiveRoom(null);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer text-slate-400 hover:text-white"
                        title="Return to Solo Flight Arena"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>SOLO</span>
                      </button>

                      <button
                        id="lobby-mode-multi-btn"
                        className="px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        title="Multiplayer 1v1 Quantum Duel"
                      >
                        <Users className="w-3.5 h-3.5 text-purple-300" />
                        <span>DUEL 2P</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="lobby-theme-window-btn"
                        onClick={() => setShowThemeWindow(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">CRAFTS & THEMES</span>
                      </button>

                      <button
                        id="lobby-open-leaderboard-btn"
                        onClick={() => setShowLeaderboard(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">LEADERBOARD</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full max-w-lg my-auto pb-8 flex flex-col items-center">
                    <MultiplayerLobby
                      userProfile={profile}
                      activeRoom={activeRoom}
                      onRoomUpdated={(room) => setActiveRoom(room)}
                      onBackToMenu={() => {
                        setMode('single');
                        setActiveRoom(null);
                      }}
                      currentUser={currentUser}
                      onLoginGoogle={handleGoogleLogin}
                    />
                  </div>
                </div>
              ) : (
                /* Once room is in countdown, racing, or finished, show synchronized game canvas */
                <FlappyGame
                  userProfile={profile}
                  activeRoom={activeRoom}
                  onUpdateProfile={handleUpdateProfile}
                  onExitRoom={() => setActiveRoom(null)}
                  onOpenLeaderboard={() => setShowLeaderboard(true)}
                  themeId={currentTheme}
                  onSelectTheme={handleSelectTheme}
                  craftId={currentCraft}
                  onSelectCraft={handleSelectCraft}
                  onOpenThemeWindow={() => setShowThemeWindow(true)}
                  currentUser={currentUser}
                  onOpenAuthModal={() => {
                    setWelcomeInitialView('auth');
                    setShowAuthModal(true);
                  }}
                  onLoginGoogle={handleGoogleLogin}
                  isModalOpen={isModalOpen}
                  onOpenCinematic={() => {
                    setWelcomeInitialView('cinematic');
                    setShowAuthModal(true);
                  }}
                  isGuestDismissed={isGuestDismissed}
                  onDismissGuestClearance={() => setIsGuestDismissed(true)}
                  currentMode={mode}
                  onSelectMode={(m) => {
                    setMode(m);
                    if (m === 'single') setActiveRoom(null);
                  }}
                />
              )}
            </>
          )
        )}
      </main>

      {/* Futuristic Theme & System Window */}
      <ThemeWindow
        isOpen={showThemeWindow}
        onClose={() => setShowThemeWindow(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        currentCraft={currentCraft}
        onSelectCraft={handleSelectCraft}
        currentMode={mode}
        onSelectMode={(m) => {
          setMode(m);
          if (m === 'single') setActiveRoom(null);
        }}
      />

      {/* Futuristic Welcome Window & Pilot Google Clearance */}
      <FuturisticWelcomeWindow
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setHasAskedAuthBeforeGame(true);
          setIsGuestDismissed(true);
        }}
        onLoginGoogle={handleGoogleLogin}
        onLogout={handleLogout}
        currentUser={currentUser}
        profile={profile}
        initialView={welcomeInitialView}
        onSelectCraft={handleSelectCraft}
        onContinueAsGuest={() => {
          setShowAuthModal(false);
          setHasAskedAuthBeforeGame(true);
          setIsGuestDismissed(true);
        }}
      />

      {/* Global Cyber Pilot Hall of Fame Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserUid={currentUser?.uid || profile?.uid}
        userProfile={profile}
        currentUser={currentUser}
        onLoginGoogle={handleGoogleLogin}
      />
    </div>
  );
}
