import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Palette,
  Volume2,
  VolumeX,
  Music,
  Zap,
  Radio,
  Plane,
  ShieldAlert,
  Sliders,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  Film,
  Crown,
  Gamepad2,
  Users,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { soundManager } from '../lib/audio';
import { PilotAvatar } from './PilotAvatar';
import {
  updateUserScore,
  syncPlayerRaceState,
  incrementUserWins,
  finishRace,
  restartRoomMatch,
  beginRacing,
} from '../lib/gameService';
import type {
  UserProfile,
  MultiplayerRoom,
  PipePair,
  Particle,
  FloatingText,
  CyberThemeId,
  BirdCraftId,
} from '../types/game';
import {
  CYBER_THEMES,
  BIRD_CRAFTS,
  getBirdCraft,
  getSectorStage,
  type SectorColorStage,
} from '../lib/themes';
import { renderThemeBackground } from '../lib/themeBackgrounds';
import type { User } from 'firebase/auth';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  activeRoom?: MultiplayerRoom | null;
  onExitRoom?: () => void;
  onOpenLeaderboard?: () => void;
  themeId?: CyberThemeId;
  onSelectTheme?: (theme: CyberThemeId) => void;
  craftId?: BirdCraftId;
  onSelectCraft?: (craft: BirdCraftId) => void;
  onOpenThemeWindow?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onSavePilotCallsign?: (displayName: string, photoURL?: string) => Promise<void>;
  isModalOpen?: boolean;
  onOpenCinematic?: () => void;
  isGuestDismissed?: boolean;
  onDismissGuestClearance?: () => void;
  currentMode?: 'single' | 'multiplayer';
  onSelectMode?: (mode: 'single' | 'multiplayer') => void;
  onLogout?: () => void;
}

// Game Physics Constants (Full-Screen Virtual Space)
const GAME_HEIGHT = 650;
const BIRD_X = 140;
const BIRD_RADIUS = 26;
const BIRD_HIT_RADIUS = 20;
const GRAVITY = 0.24;
const JUMP_IMPULSE = -6.2;
const MAX_FALL_SPEED = 5.6;
const BASE_PIPE_SPEED = 2.4;
const PIPE_WIDTH = 90;
const PIPE_GAP = 185;
const BASE_PIPE_SPACING = 380;
const GROUND_HEIGHT = 90;
const PLAYABLE_HEIGHT = GAME_HEIGHT - GROUND_HEIGHT;

export function FlappyGame({
  userProfile,
  onUpdateProfile,
  activeRoom,
  onExitRoom,
  onOpenLeaderboard,
  themeId = 'cyberpunk',
  onSelectTheme,
  craftId = 'falcon',
  onSelectCraft,
  onOpenThemeWindow,
  currentUser,
  onOpenAuthModal,
  onSavePilotCallsign,
  isModalOpen = false,
  onOpenCinematic,
  isGuestDismissed = false,
  onDismissGuestClearance,
  currentMode = 'single',
  onSelectMode,
  onLogout,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const virtualWidthRef = useRef<number>(960);
  const virtualHeightRef = useRef<number>(GAME_HEIGHT);
  const virtualOffsetYRef = useRef<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(soundManager.isMuted());
  const [musicMuted, setMusicMuted] = useState(soundManager.isMusicMuted());
  const [voiceEnabled, setVoiceEnabled] = useState(soundManager.isVoiceEnabled());

  const isRegisteredPilot = Boolean(userProfile.isRegisteredPilot);
  const isGoogleUser = isRegisteredPilot;
  const guestBypassedAuthRef = useRef(isGuestDismissed);
  const [guestBypassedState, setGuestBypassedState] = useState(isGuestDismissed);

  // Sync isGuestDismissed prop
  useEffect(() => {
    if (isGuestDismissed) {
      guestBypassedAuthRef.current = true;
      setGuestBypassedState(true);
    }
  }, [isGuestDismissed]);

  const isMultiplayer = !!activeRoom;
  const isHost = activeRoom?.host.uid === userProfile.uid;

  // Selected Craft
  const activeCraft = getBirdCraft(craftId);

  // Game States
  const [gameState, setGameState] = useState<
    'idle' | 'countdown' | 'playing' | 'gameover'
  >('idle');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [warpSpeed, setWarpSpeed] = useState('1.0x');
  const [highScore, setHighScore] = useState(userProfile.highScore || 0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [raceWinner, setRaceWinner] = useState<string | 'tie' | null>(null);
  const [rematchLoading, setRematchLoading] = useState(false);

  // Dynamic 10-Point Color Stage Evolution or Selected Theme Palette
  const currentSector = getSectorStage(score);
  const baseTheme = CYBER_THEMES[themeId] || CYBER_THEMES.cyberpunk;
  const isCustomTheme = Boolean(themeId && themeId !== 'cyberpunk');
  const activeTheme: SectorColorStage = isCustomTheme
    ? {
        scoreThreshold: Math.floor(score / 10) * 10,
        sectorName: `${baseTheme.name.toUpperCase()} // SECTOR ${Math.floor(score / 10) + 1}`,
        headline: score >= 10 ? currentSector.headline : 'READY FOR TAKEOFF!',
        subtitle: score >= 10 ? currentSector.subtitle : `${baseTheme.name} // Thrusters Engaged`,
        gatePrimary: baseTheme.gatePrimary,
        gateSecondary: baseTheme.gateSecondary,
        gateGlow: baseTheme.gateGlow,
        gridColor: baseTheme.gridColor,
        skyTop: baseTheme.skyTop,
        skyBottom: baseTheme.skyBottom,
        birdVisor: baseTheme.birdVisor,
        accent: baseTheme.accent,
      }
    : score >= 10
      ? currentSector
      : {
          scoreThreshold: 0,
          sectorName: baseTheme.name.toUpperCase(),
          headline: 'READY FOR TAKEOFF!',
          subtitle: 'Sector 1 // Warp Thrusters Active',
          gatePrimary: baseTheme.gatePrimary,
          gateSecondary: baseTheme.gateSecondary,
          gateGlow: baseTheme.gateGlow,
          gridColor: baseTheme.gridColor,
          skyTop: baseTheme.skyTop,
          skyBottom: baseTheme.skyBottom,
          birdVisor: baseTheme.birdVisor,
          accent: baseTheme.accent,
        };

  const activeThemeRef = useRef<SectorColorStage>(activeTheme);
  activeThemeRef.current = activeTheme;

  // Top Milestone Banner
  const [milestoneBanner, setMilestoneBanner] = useState<{
    headline: string;
    subtitle: string;
    color: string;
  } | null>(null);
  const milestoneTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync high score accurately from user profile
  useEffect(() => {
    setHighScore(userProfile.highScore || 0);
  }, [userProfile.highScore]);

  // Opponent race info
  const opponent = isMultiplayer
    ? isHost
      ? activeRoom?.guest
      : activeRoom?.host
    : null;

  // Physics loop state refs
  const birdY = useRef(260);
  const birdVy = useRef(0);
  const birdRotation = useRef(0);
  const flapFrame = useRef(0);
  const isAlive = useRef(true);
  const currentScore = useRef(0);
  const currentDistance = useRef(0);
  const gameStartTime = useRef(0);
  const currentSpeedMultiplier = useRef(1);
  const pipes = useRef<PipePair[]>([]);
  const particles = useRef<Particle[]>([]);
  const floaters = useRef<FloatingText[]>([]);
  const groundOffset = useRef(0);
  const bgCityOffset = useRef(0);
  const animFrameId = useRef<number | null>(null);
  const lastSyncTime = useRef(0);
  const lastOpponentY = useRef(260);
  const targetOpponentY = useRef(260);
  const prngRef = useRef<() => number>(Math.random);
  const screenShakeRef = useRef(0);
  const pipeSpawnCountRef = useRef(0);
  const opponentCrashedRef = useRef(false);
  const crashTimestampRef = useRef(0);

  // Entry Guardian Creature Ref (Aero-Chrome Launch Sentinel)
  const guardianRef = useRef<{
    x: number;
    y: number;
    vx: number;
    mode: 'idle' | 'launching' | 'cleared';
    wingPhase: number;
    time: number;
  }>({
    x: BIRD_X + 115,
    y: 195,
    vx: 0,
    mode: 'idle',
    wingPhase: 0,
    time: 0,
  });

  // Crash Steel Reaper Creature Ref (Chrome Sentinel Reaper)
  const reaperRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    wingPhase: number;
    scanPhase: number;
    time: number;
    arrived: boolean;
  }>({
    active: false,
    x: 999,
    y: 999,
    targetX: 0,
    targetY: 0,
    wingPhase: 0,
    scanPhase: 0,
    time: 0,
    arrived: false,
  });

  // Confetti trigger
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
          activeTheme.gatePrimary,
          activeTheme.accent,
          '#00F0FF',
          '#FF007F',
          '#FBBF24',
        ],
      });
    } catch {
      // ignore
    }
  }, [activeTheme.gatePrimary, activeTheme.accent]);

  // Reset Game State
  const initGame = useCallback(() => {
    birdY.current = 260;
    birdVy.current = 0;
    birdRotation.current = 0;
    flapFrame.current = 0;
    isAlive.current = true;
    currentScore.current = 0;
    currentDistance.current = 0;
    currentSpeedMultiplier.current = 1;
    pipeSpawnCountRef.current = 0;
    opponentCrashedRef.current = false;
    pipes.current = [];
    particles.current = [];
    floaters.current = [];
    screenShakeRef.current = 0;

    // Reset unique creatures
    guardianRef.current = {
      x: BIRD_X + 115,
      y: 195,
      vx: 0,
      mode: 'idle',
      wingPhase: 0,
      time: 0,
    };
    reaperRef.current = {
      active: false,
      x: 999,
      y: 999,
      targetX: 0,
      targetY: 0,
      wingPhase: 0,
      scanPhase: 0,
      time: 0,
      arrived: false,
    };

    setScore(0);
    setDistance(0);
    setWarpSpeed('1.0x');
    setIsNewRecord(false);
    setRaceWinner(null);
  }, []);

  // Universal Fullscreen Handler (Works reliably across iPhone Safari, Android, iPads, Desktops & iframes)
  const toggleFullscreen = useCallback(async () => {
    try {
      const container = containerRef.current || document.documentElement;
      const isNativeFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isFullscreen && !isNativeFs) {
        if (container.requestFullscreen) {
          await container.requestFullscreen().catch(() => {});
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if ((container as any).webkitEnterFullscreen) {
          (container as any).webkitEnterFullscreen();
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (isNativeFs) {
          if (document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to seamless CSS edge-to-edge fullscreen viewport if native is restricted
      setIsFullscreen((prev) => !prev);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const isNativeFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, [isFullscreen]);

  // Toggle SFX
  const handleToggleSfx = () => {
    const next = soundManager.toggleMute();
    setSfxMuted(next);
  };

  // Toggle Music
  const handleToggleMusic = () => {
    const next = soundManager.toggleMusic();
    setMusicMuted(next);
  };

  // Toggle Voice
  const handleToggleVoice = () => {
    const next = soundManager.toggleVoice();
    setVoiceEnabled(next);
  };

  // Flap wings / Jet Impulse
  const handleFlap = useCallback(() => {
    // Prevent starting or flapping when modal (crafts/themes, welcome, leaderboard) is open
    if (isModalOpen) return;

    if (gameState === 'idle') {
      if (!isMultiplayer) {
        // Only ask if user has NOT chosen guest mode and hasn't logged in with Google
        if (
          !isGoogleUser &&
          !isGuestDismissed &&
          !guestBypassedAuthRef.current &&
          !guestBypassedState &&
          onOpenAuthModal
        ) {
          onOpenAuthModal();
          return;
        }

        setGameState('playing');
        gameStartTime.current = performance.now();
        birdVy.current = JUMP_IMPULSE;
        soundManager.playFlap(craftId);
        soundManager.startMusic('intense');
        soundManager.speakTacticalAlert('THRUSTERS ENGAGED.');

        // Engage Entry Guardian launch escort
        guardianRef.current.mode = 'launching';
        soundManager.playGuardianDeploy();
      }
      return;
    }

    if (gameState === 'playing' && isAlive.current) {
      birdVy.current = JUMP_IMPULSE;
      soundManager.playFlap(craftId);

      // Jet exhaust particles with craft thruster color
      const effSpeed = BASE_PIPE_SPEED * currentSpeedMultiplier.current;
      for (let i = 0; i < 6; i++) {
        particles.current.push({
          x: BIRD_X - 22,
          y: birdY.current + (Math.random() * 8 - 4),
          vx: -effSpeed * 2.2 - Math.random() * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          color:
            Math.random() > 0.4
              ? activeCraft.thrusterColor
              : activeTheme.gatePrimary,
          radius: Math.random() * 3.5 + 1.5,
          alpha: 0.9,
          decay: 0.05,
        });
      }

      // Instantaneous telemetry sync on flap
      if (isMultiplayer && activeRoom) {
        syncPlayerRaceState(activeRoom.id, isHost, {
          y: birdY.current,
          vy: birdVy.current,
          score: currentScore.current,
          distance: currentDistance.current,
          alive: true,
        });
      }
    } else if (gameState === 'gameover') {
      // Do NOT restart on casual canvas taps or clicks!
      // Players must tap the dedicated "REBOOT CHASSIS" button or press Space/R to relaunch.
      return;
    }
  }, [
    gameState,
    isMultiplayer,
    craftId,
    activeCraft.thrusterColor,
    activeTheme.gatePrimary,
    isGoogleUser,
    isGuestDismissed,
    guestBypassedState,
    onOpenAuthModal,
    isModalOpen,
    activeRoom,
    isHost,
  ]);

  // High-Tech Crash & Impact Handling
  const handleCrash = useCallback(() => {
    if (!isAlive.current) return;
    isAlive.current = false;
    crashTimestampRef.current = Date.now();

    // Cinematic Audio & Speech cues
    soundManager.playHit();
    setTimeout(() => soundManager.playDie(), 90);
    soundManager.setMusicIntensity('crash');
    soundManager.speakTacticalAlert('CRITICAL IMPACT DETECTED. HULL BREACH.');

    // Screen Shake Impulse
    screenShakeRef.current = 14;

    // Deploy Crash Steel Reaper Creature
    reaperRef.current = {
      active: true,
      x: virtualWidthRef.current + 80,
      y: Math.max(50, birdY.current - 120),
      targetX: BIRD_X + 45,
      targetY: Math.max(65, birdY.current - 75),
      wingPhase: 0,
      scanPhase: 0,
      time: 0,
      arrived: false,
    };
    setTimeout(() => {
      soundManager.playReaperArrive();
    }, 260);

    // High-Tech Kinetic Shrapnel & EMP Sparks (No cartoon dead emojis!)
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2.5;
      particles.current.push({
        x: BIRD_X,
        y: birdY.current,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: [
          activeCraft.thrusterColor,
          activeTheme.gatePrimary,
          '#EF4444',
          '#FFFFFF',
        ][Math.floor(Math.random() * 4)],
        radius: Math.random() * 4 + 2,
        alpha: 1,
        decay: 0.035,
      });
    }

    // Trailing dark ion smoke puffs
    for (let i = 0; i < 8; i++) {
      particles.current.push({
        x: BIRD_X + (Math.random() * 20 - 10),
        y: birdY.current + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 1,
        color: '#1E293B',
        radius: Math.random() * 12 + 6,
        alpha: 0.75,
        decay: 0.02,
      });
    }

    const finalScore = currentScore.current;
    const finalDist = currentDistance.current;

    // Single Player score handling
    if (!isMultiplayer) {
      const isNew = finalScore > highScore;
      if (isNew) {
        setIsNewRecord(true);
        triggerConfetti();
        soundManager.speakTacticalAlert('ALL-TIME RECORD ACHIEVED.');
      }

      updateUserScore(userProfile.uid, finalScore, highScore).then(
        (updatedBest) => {
          setHighScore(updatedBest);
          onUpdateProfile({ highScore: updatedBest });
        }
      );

      setGameState('gameover');
    } else if (activeRoom) {
      // Multiplayer sync
      syncPlayerRaceState(activeRoom.id, isHost, {
        y: birdY.current,
        vy: 0,
        score: finalScore,
        distance: finalDist,
        alive: false,
      });

      if (!opponent || !opponent.alive) {
        let winnerUid: string | 'tie' = 'tie';
        const myScore = finalScore;
        const opScore = opponent?.score || 0;
        const myDist = finalDist;
        const opDist = opponent?.distance || 0;

        if (myScore > opScore || (myScore === opScore && myDist > opDist)) {
          winnerUid = userProfile.uid;
          triggerConfetti();
          soundManager.playWin();
          soundManager.speakTacticalAlert('RACE WON. TARGET ELIMINATED.');
          incrementUserWins(userProfile.uid);
        } else if (opScore > myScore || (opScore === myScore && opDist > myDist)) {
          winnerUid = opponent ? opponent.uid : userProfile.uid;
          soundManager.speakTacticalAlert('MISSION FAILED. OPPONENT PREVAILED.');
        }

        setRaceWinner(winnerUid);
        setGameState('gameover');
        finishRace(activeRoom.id, winnerUid);
      } else {
        soundManager.speakTacticalAlert('CRAFT DOWNED. SPECTATING OPPONENT.');
      }
    }
  }, [
    activeCraft.thrusterColor,
    activeTheme.gatePrimary,
    highScore,
    isMultiplayer,
    activeRoom,
    isHost,
    opponent,
    triggerConfetti,
    userProfile.uid,
    onUpdateProfile,
  ]);

  // PRNG seed for multiplayer
  useEffect(() => {
    if (activeRoom && activeRoom.pipeSeed) {
      let seed = activeRoom.pipeSeed;
      prngRef.current = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    } else {
      prngRef.current = Math.random;
    }
  }, [activeRoom?.pipeSeed]);

  // Smooth Opponent Y interpolation
  useEffect(() => {
    if (opponent && opponent.y !== undefined) {
      if (opponent.alive) {
        targetOpponentY.current = opponent.y;
      } else {
        targetOpponentY.current = PLAYABLE_HEIGHT - BIRD_HIT_RADIUS;
      }
    }
  }, [opponent?.y, opponent?.alive]);

  // Track opponent crash event
  useEffect(() => {
    if (!isMultiplayer || !opponent) {
      opponentCrashedRef.current = false;
      return;
    }
    if (opponent.alive) {
      opponentCrashedRef.current = false;
    } else if (!opponent.alive && !opponentCrashedRef.current) {
      opponentCrashedRef.current = true;
      if (isAlive.current) {
        soundManager.speakTacticalAlert('OPPONENT DOWNED. SECURE SECTOR TO WIN.');
      }
    }
  }, [isMultiplayer, opponent?.alive]);

  // Check if both players are finished in multiplayer
  useEffect(() => {
    if (!isMultiplayer || !activeRoom || gameState !== 'playing') return;

    if (!isAlive.current && opponent && !opponent.alive) {
      let winnerUid: string | 'tie' = 'tie';
      const myScore = currentScore.current;
      const opScore = opponent.score || 0;
      const myDist = currentDistance.current;
      const opDist = opponent.distance || 0;

      if (myScore > opScore || (myScore === opScore && myDist > opDist)) {
        winnerUid = userProfile.uid;
        triggerConfetti();
        soundManager.playWin();
        soundManager.speakTacticalAlert('RACE WON. TARGET ELIMINATED.');
        incrementUserWins(userProfile.uid);
      } else if (opScore > myScore || (opScore === myScore && opDist > myDist)) {
        winnerUid = opponent.uid;
        soundManager.speakTacticalAlert('MISSION FAILED. OPPONENT PREVAILED.');
      }

      setRaceWinner(winnerUid);
      setGameState('gameover');
      finishRace(activeRoom.id, winnerUid);
    }
  }, [
    isMultiplayer,
    activeRoom?.id,
    gameState,
    opponent?.alive,
    opponent?.score,
    opponent?.distance,
    opponent?.uid,
    userProfile.uid,
    triggerConfetti,
  ]);

  // Multiplayer Room State Transitions
  useEffect(() => {
    if (!activeRoom) return;

    if (activeRoom.status === 'countdown') {
      setGameState('countdown');
      initGame();
      const startTime = activeRoom.countdownStart || Date.now();
      const updateCd = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const rem = Math.max(0, 3 - elapsed);
        setCountdownNum(rem);
        soundManager.playCountdown(rem);
        if (rem === 0) {
          setGameState('playing');
          gameStartTime.current = performance.now();
          soundManager.startMusic('intense');
          soundManager.speakTacticalAlert('THRUSTERS ENGAGED.');
          if (isHost && activeRoom.status === 'countdown') {
            beginRacing(activeRoom.id);
          }
        }
      };
      updateCd();
      const interval = setInterval(updateCd, 250);
      return () => clearInterval(interval);
    }

    if (activeRoom.status === 'racing') {
      setGameState('playing');
      gameStartTime.current = performance.now();
      soundManager.startMusic('intense');
    }

    if (activeRoom.status === 'finished') {
      setGameState('gameover');
      if (activeRoom.winnerUid) {
        setRaceWinner(activeRoom.winnerUid);
        if (activeRoom.winnerUid === userProfile.uid) {
          triggerConfetti();
          soundManager.playWin();
          soundManager.speakTacticalAlert('RACE WON. TARGET ELIMINATED.');
        }
      }
    }
  }, [
    activeRoom?.status,
    activeRoom?.countdownStart,
    activeRoom?.winnerUid,
    userProfile.uid,
    initGame,
    triggerConfetti,
  ]);

  // Deterministic seeded height calculation
  const getPipeHeight = useCallback(
    (pipeIdx: number) => {
      const minHeight = 65;
      const maxHeight = PLAYABLE_HEIGHT - PIPE_GAP - minHeight;
      const seed = activeRoom?.pipeSeed;
      if (seed) {
        // High-precision deterministic PRNG based on seed + index
        const s =
          ((seed * 1103515245 + pipeIdx * 12345 + 1013904223) >>> 0) /
          4294967296;
        return Math.floor(minHeight + s * (maxHeight - minHeight));
      }
      return Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
    },
    [activeRoom?.pipeSeed]
  );

  // Spawn Gate Pair
  const spawnPipe = useCallback(
    (startX?: number) => {
      const pipeIdx = pipeSpawnCountRef.current++;
      const topHeight = getPipeHeight(pipeIdx);

      pipes.current.push({
        x: startX !== undefined ? startX : 800,
        topHeight,
        bottomY: topHeight + PIPE_GAP,
        width: PIPE_WIDTH,
        passed: false,
      });
    },
    [getPipeHeight]
  );

  // Main Canvas Render and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimestamp) / 16.66, 2.5);
      lastTimestamp = timestamp;

      // Dynamic Canvas Sizing & High-DPI Scaling across all devices
      const container = containerRef.current;
      if (container && canvas) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = Math.floor(rect.width * dpr);
          const targetH = Math.floor(rect.height * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          // Ensure minimum horizontal runway (560 units) for comfortable reaction time on mobile
          const MIN_VIRTUAL_WIDTH = 560;
          const scaleFactor = Math.min(
            rect.width / MIN_VIRTUAL_WIDTH,
            rect.height / GAME_HEIGHT
          );
          const scale = scaleFactor * dpr;

          const vWidth = rect.width / scaleFactor;
          const vHeight = rect.height / scaleFactor;
          const offsetY = Math.max(0, (vHeight - GAME_HEIGHT) / 2);

          virtualWidthRef.current = vWidth;
          virtualHeightRef.current = vHeight;
          virtualOffsetYRef.current = offsetY;

          ctx.setTransform(scale, 0, 0, scale, 0, Math.floor(offsetY * scale));
        }
      }

      const vWidth = virtualWidthRef.current;
      const curTheme = activeThemeRef.current;

      // Screen Shake translation
      if (screenShakeRef.current > 0) {
        const shakeMagnitude = screenShakeRef.current;
        const sx = (Math.random() - 0.5) * shakeMagnitude;
        const sy = (Math.random() - 0.5) * shakeMagnitude;
        ctx.translate(sx, sy);
        screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.6 * dt);
      }

      // Physics & Progression Update (freeze simulation while modal is open)
      if (!isModalOpen && (gameState === 'playing' || (gameState === 'idle' && !isMultiplayer))) {
        if (gameState === 'playing') {
          const elapsedSec =
            (performance.now() - gameStartTime.current) / 1000;
          const speedMult =
            1 +
            Math.min(
              0.75,
              currentScore.current * 0.035 + elapsedSec * 0.0035
            );
          currentSpeedMultiplier.current = speedMult;
          // World motion halts immediately when local craft has crashed!
          const effectiveSpeed = isAlive.current ? BASE_PIPE_SPEED * speedMult : 0;
          const effectiveSpacing = BASE_PIPE_SPACING * speedMult;

          const currentWarpFormatted = speedMult.toFixed(1) + 'x';
          if (currentWarpFormatted !== warpSpeed) {
            setWarpSpeed(currentWarpFormatted);
          }

          // Active craft physics (falls to floor if dead)
          if (isAlive.current) {
            birdVy.current = Math.min(
              birdVy.current + GRAVITY * dt,
              MAX_FALL_SPEED
            );
            birdY.current += birdVy.current * dt;

            const targetRotation =
              birdVy.current < 0
                ? Math.max(-0.32, birdVy.current * 0.04)
                : Math.min(0.22, birdVy.current * 0.035);
            birdRotation.current +=
              (targetRotation - birdRotation.current) * Math.min(1, 0.065 * dt);

            flapFrame.current += 0.25 * dt;

            // Continuous subtle jet thruster trail
            if (Math.random() > 0.4) {
              particles.current.push({
                x: BIRD_X - 22,
                y: birdY.current + (Math.random() * 6 - 3),
                vx: -effectiveSpeed * 1.6 - Math.random() * 2,
                vy: (Math.random() - 0.5) * 1.5,
                color:
                  Math.random() > 0.5
                    ? activeCraft.thrusterColor
                    : curTheme.gatePrimary,
                radius: Math.random() * 3 + 1.2,
                alpha: 0.8,
                decay: 0.05,
              });
            }

            currentDistance.current += effectiveSpeed * dt;
            setDistance(Math.floor(currentDistance.current / 10));

            groundOffset.current =
              (groundOffset.current + effectiveSpeed * dt) % 40;
            bgCityOffset.current = (bgCityOffset.current + 0.6 * dt) % vWidth;

            // Spawn hurdles deterministically: first gate is at BIRD_X + 500
            const lastPipe = pipes.current[pipes.current.length - 1];
            if (!lastPipe) {
              spawnPipe(BIRD_X + 500);
            } else if (lastPipe.x <= vWidth + 120) {
              spawnPipe(lastPipe.x + effectiveSpacing);
            }
          }

          // Move hurdles & check scoring / collision (stops when crashed)
          for (let i = pipes.current.length - 1; i >= 0; i--) {
            const pipe = pipes.current[i];
            pipe.x -= effectiveSpeed * dt;

            // Score point
            if (!pipe.passed && pipe.x + pipe.width < BIRD_X) {
              pipe.passed = true;
              currentScore.current += 1;
              const newScore = currentScore.current;
              setScore(newScore);
              soundManager.playScore();

              // 10-Point Milestone: Color shift & praise
              if (newScore > 0 && newScore % 10 === 0) {
                const nextStage = getSectorStage(newScore);
                activeThemeRef.current = nextStage;
                triggerConfetti();
                soundManager.playMilestone();
                soundManager.speakTacticalAlert(
                  `WARP SECTOR ${newScore / 10 + 1} CLEARED.`
                );

                if (milestoneTimerRef.current)
                  clearTimeout(milestoneTimerRef.current);
                setMilestoneBanner({
                  headline: nextStage.headline,
                  subtitle: nextStage.subtitle,
                  color: nextStage.gatePrimary,
                });
                milestoneTimerRef.current = setTimeout(() => {
                  setMilestoneBanner(null);
                }, 3500);

                floaters.current.push({
                  id: Date.now() + Math.random(),
                  x: vWidth / 2,
                  y: 160,
                  text: `⚡ SECTOR CLEAR // +${newScore} PTS! ⚡`,
                  alpha: 1,
                  color: nextStage.gatePrimary,
                });
              }

              // Gate pass spark particles
              const gapHeight = pipe.bottomY - pipe.topHeight;
              for (let p = 0; p < 10; p++) {
                particles.current.push({
                  x: pipe.x + pipe.width / 2,
                  y: pipe.topHeight + gapHeight / 2,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: curTheme.gatePrimary,
                  radius: Math.random() * 3.5 + 1.5,
                  alpha: 1,
                  decay: 0.04,
                });
              }

              if (isMultiplayer && activeRoom && isAlive.current) {
                syncPlayerRaceState(activeRoom.id, isHost, {
                  y: birdY.current,
                  vy: birdVy.current,
                  score: currentScore.current,
                  distance: currentDistance.current,
                  alive: true,
                });
              }
            }

            // Pipe collision
            if (isAlive.current) {
              const inPipeX =
                BIRD_X + BIRD_HIT_RADIUS > pipe.x &&
                BIRD_X - BIRD_HIT_RADIUS < pipe.x + pipe.width;

              if (inPipeX) {
                const hitTop = birdY.current - BIRD_HIT_RADIUS < pipe.topHeight;
                const hitBottom = birdY.current + BIRD_HIT_RADIUS > pipe.bottomY;

                if (hitTop || hitBottom) {
                  handleCrash();
                }
              }
            }

            if (pipe.x + pipe.width < -60) {
              pipes.current.splice(i, 1);
            }
          }

          // Ceiling and Floor collision (Adapted to dynamic screen height & virtual offset)
          if (isAlive.current) {
            const ceilingLimit = -(virtualOffsetYRef.current || 0);
            if (birdY.current - BIRD_HIT_RADIUS <= ceilingLimit) {
              birdY.current = ceilingLimit + BIRD_HIT_RADIUS;
              birdVy.current = 0;
            }

            if (birdY.current + BIRD_HIT_RADIUS >= PLAYABLE_HEIGHT) {
              birdY.current = PLAYABLE_HEIGHT - BIRD_HIT_RADIUS;
              handleCrash();
            }
          } else {
            // Fallen craft physics - drop down to the pylon floor and rest there
            if (birdY.current + BIRD_HIT_RADIUS < PLAYABLE_HEIGHT) {
              birdVy.current = Math.min(
                birdVy.current + GRAVITY * 1.5 * dt,
                MAX_FALL_SPEED * 1.2
              );
              birdY.current += birdVy.current * dt;
              birdRotation.current = Math.min(
                0.55,
                birdRotation.current + 0.05 * dt
              );
            } else {
              birdY.current = PLAYABLE_HEIGHT - BIRD_HIT_RADIUS;
              birdVy.current = 0;
            }
          }

          // Multiplayer sync interval (tight 75ms heartbeat)
          if (isMultiplayer && activeRoom && isAlive.current) {
            const now = Date.now();
            if (now - lastSyncTime.current > 75) {
              lastSyncTime.current = now;
              syncPlayerRaceState(activeRoom.id, isHost, {
                y: birdY.current,
                vy: birdVy.current,
                score: currentScore.current,
                distance: currentDistance.current,
                alive: true,
              });
            }
          }
        } else if (gameState === 'idle') {
          birdY.current = 260 + Math.sin(timestamp * 0.0035) * 12;
          birdRotation.current = Math.sin(timestamp * 0.0035) * 0.05;
          flapFrame.current += 0.15 * dt;
        }
      }

      // Smooth opponent Y
      if (isMultiplayer && opponent) {
        lastOpponentY.current +=
          (targetOpponentY.current - lastOpponentY.current) *
          Math.min(1, 0.25 * dt);
      }

      // Update particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= p.decay * dt;
        if (p.alpha <= 0) {
          particles.current.splice(i, 1);
        }
      }

      // Update floaters
      for (let i = floaters.current.length - 1; i >= 0; i--) {
        const f = floaters.current[i];
        f.y -= 1.2 * dt;
        f.alpha -= 0.02 * dt;
        if (f.alpha <= 0) {
          floaters.current.splice(i, 1);
        }
      }

      // -------------------------------------------------------------
      // DRAW CANVAS WORLD
      // -------------------------------------------------------------
      const curOffsetY = virtualOffsetYRef.current || 0;
      ctx.clearRect(0, -curOffsetY, vWidth, GAME_HEIGHT + curOffsetY * 2);

      // Sky Gradient extending upwards seamlessly
      const skyGrad = ctx.createLinearGradient(0, -curOffsetY, 0, PLAYABLE_HEIGHT);
      skyGrad.addColorStop(0, curTheme.skyTop);
      skyGrad.addColorStop(1, curTheme.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, -curOffsetY, vWidth, PLAYABLE_HEIGHT + curOffsetY);

      // Render Bespoke Thematic Environment (Synthwave Sun/Mountains, Matrix Rain, Void Singularity, Solar Flares, etc.)
      renderThemeBackground(
        ctx,
        themeId || 'cyberpunk',
        vWidth,
        PLAYABLE_HEIGHT,
        curOffsetY,
        timestamp,
        bgCityOffset.current,
        curTheme
      );

      // Energy Gate Pylons (Seamless extension beyond top & bottom screen edges)
      const topPylonStartY = -curOffsetY - 40;
      pipes.current.forEach((pipe) => {
        const topPylonHeight = pipe.topHeight - topPylonStartY;
        drawCyberGate(ctx, pipe.x, topPylonStartY, pipe.width, topPylonHeight, true, curTheme);
        drawCyberGate(
          ctx,
          pipe.x,
          pipe.bottomY,
          pipe.width,
          (PLAYABLE_HEIGHT - pipe.bottomY) + curOffsetY + 100,
          false,
          curTheme
        );

        // Holographic laser barrier field across gap
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = curTheme.gatePrimary;
        ctx.fillRect(
          pipe.x + 10,
          pipe.topHeight,
          pipe.width - 20,
          pipe.bottomY - pipe.topHeight
        );

        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pipe.x + pipe.width / 2, pipe.topHeight);
        ctx.lineTo(pipe.x + pipe.width / 2, pipe.bottomY);
        ctx.stroke();
        ctx.restore();
      });

      // Ground Highway extending downwards seamlessly
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, PLAYABLE_HEIGHT, vWidth, GROUND_HEIGHT + curOffsetY + 60);

      // Neon Horizon Line
      ctx.save();
      ctx.shadowColor = curTheme.gridColor;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = curTheme.gridColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, PLAYABLE_HEIGHT);
      ctx.lineTo(vWidth, PLAYABLE_HEIGHT);
      ctx.stroke();
      ctx.restore();

      // Highway perspective lines extending to bottom of screen
      ctx.strokeStyle = curTheme.gridColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.55;
      for (let x = -groundOffset.current; x < vWidth + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, PLAYABLE_HEIGHT);
        ctx.lineTo(x - 20, GAME_HEIGHT + curOffsetY + 60);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Render Particles
      particles.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Opponent Ghost Bird
      if (isMultiplayer && opponent) {
        ctx.save();
        const deltaDist = (opponent.distance || 0) - currentDistance.current;
        const oppX = opponent.alive
          ? BIRD_X + Math.max(-120, Math.min(120, deltaDist)) + (Math.abs(deltaDist) < 10 ? 10 : 0)
          : BIRD_X + Math.max(-350, deltaDist);

        const oppAngle = opponent.alive
          ? Math.max(-0.4, Math.min(0.35, (opponent.vy || 0) * 0.05))
          : 0.55;

        const oppWingCycle = opponent.alive ? flapFrame.current : 0;

        ctx.globalAlpha = opponent.alive ? 0.8 : 0.45;
        drawCyberBird(
          ctx,
          oppX,
          lastOpponentY.current,
          oppAngle,
          oppWingCycle,
          opponent.color || '#A855F7',
          true,
          opponent.alive,
          curTheme,
          activeCraft
        );

        // Pilot Name Tag above opponent
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = opponent.alive ? '#C084FC' : '#EF4444';
        ctx.fillText(
          `${opponent.displayName.toUpperCase()} ${opponent.alive ? '' : '[CRASHED]'}`,
          oppX,
          lastOpponentY.current - 26
        );

        ctx.restore();
      }

      // Main Pilot Craft
      drawCyberBird(
        ctx,
        BIRD_X,
        birdY.current,
        birdRotation.current,
        flapFrame.current,
        activeCraft.accentColor,
        false,
        isAlive.current,
        curTheme,
        activeCraft
      );

      // Entry Guardian Escort Creature (Aero-Chrome Launch Sentinel)
      drawEntryGuardian(ctx, curTheme, dt, vWidth);

      // Crash Steel Reaper Creature (Chrome Sentinel Reaper)
      drawSteelReaper(ctx, dt, vWidth, BIRD_X, birdY.current);

      // Render Floaters
      floaters.current.forEach((f) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.alpha);
        ctx.font = '900 15px monospace';
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 8;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      });

      // Idle State Guidance overlay
      if (gameState === 'idle' && !isMultiplayer) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 17px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = activeTheme.gatePrimary;
        ctx.shadowBlur = 12;
        ctx.fillText('CLICK OR TAP [SPACE] TO ENGAGE CELESTIAL FLIGHT', vWidth / 2, 135);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = activeCraft.accentColor;
        ctx.shadowBlur = 0;
        ctx.fillText(
          `ACTIVE GODDESS: ${activeCraft.name.toUpperCase()} // ${activeCraft.classType.toUpperCase()}`,
          vWidth / 2,
          156
        );
        ctx.restore();
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [
    gameState,
    isMultiplayer,
    activeCraft,
    spawnPipe,
    handleCrash,
    opponent,
    triggerConfetti,
    warpSpeed,
    isModalOpen,
  ]);

  // Draw Pylon Gate
  const drawCyberGate = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isTop: boolean,
    theme: SectorColorStage
  ) => {
    ctx.save();
    const bodyGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    bodyGrad.addColorStop(0, '#0F172A');
    bodyGrad.addColorStop(0.5, '#1E293B');
    bodyGrad.addColorStop(1, '#0B0F19');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = theme.gatePrimary;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Emitter Cap
    const capH = 34;
    const capX = x - 6;
    const capW = width + 12;
    const capY = isTop ? y + height - capH : y;

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(capX, capY, capW, capH);
    ctx.strokeRect(capX, capY, capW, capH);

    // Hazard stripes
    ctx.fillStyle = theme.gatePrimary;
    for (let hx = capX + 6; hx < capX + capW - 6; hx += 14) {
      ctx.fillRect(hx, capY + 6, 5, capH - 12);
    }

    // Glowing core
    ctx.shadowColor = theme.gatePrimary;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(
      capX + capW / 2,
      isTop ? capY + capH - 7 : capY + 7,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  };

  // Dedicated Cyber Bird & Craft Drawing
  const drawCyberBird = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    angle: number,
    wingCycle: number,
    mainColor: string,
    isGhost: boolean,
    alive: boolean,
    theme: SectorColorStage,
    craft: typeof activeCraft
  ) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);

    if (isGhost) {
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_RADIUS + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rear Jet Engine Thruster
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-BIRD_RADIUS - 6, -6, 8, 12);
    ctx.fill();
    ctx.stroke();

    // Jet Engine Flame Glow
    if (alive) {
      ctx.fillStyle = craft.thrusterColor;
      ctx.shadowColor = craft.thrusterColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-BIRD_RADIUS - 4, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-BIRD_RADIUS - 4, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // CELESTIAL GODDESS HALO & ASTRAL CROWN (Custom divine halo for every Goddess)
    if (alive) {
      ctx.save();
      // Outer divine aura ring
      ctx.strokeStyle = craft.accentColor;
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.004) * 0.15;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = craft.accentColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_RADIUS + 7, 0, Math.PI * 2);
      ctx.stroke();

      const haloY = -BIRD_RADIUS - 8;

      if (craft.id === 'falcon') {
        // Valyria // Goddess of Swift Winds: Azure zephyr halo with aerodynamic wind-crest finlets
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, haloY, 15, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Twin wind-crest fins
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-15, haloY);
        ctx.lineTo(-21, haloY - 4);
        ctx.moveTo(15, haloY);
        ctx.lineTo(21, haloY - 4);
        ctx.stroke();

        // Sky-sapphire jewel
        ctx.fillStyle = '#E0F2FE';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, haloY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (craft.id === 'phoenix') {
        // Sol-Ignis // Goddess of Solar Rebirth: Flaming solar corona halo with radiating fire rays
        ctx.strokeStyle = '#FFAA00';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(0, haloY, 15, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 5 Radiating solar corona flame rays
        ctx.strokeStyle = '#FF3366';
        ctx.lineWidth = 2;
        for (let r = -2; r <= 2; r++) {
          const rx = r * 6;
          const rayH = 8 - Math.abs(r) * 2;
          ctx.beginPath();
          ctx.moveTo(rx, haloY);
          ctx.lineTo(rx + r * 1.5, haloY - rayH);
          ctx.stroke();
        }

        // Solar heart orb
        ctx.fillStyle = '#FFF3BF';
        ctx.beginPath();
        ctx.arc(0, haloY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (craft.id === 'raven') {
        // Morrigan // Goddess of the Cosmic Void: Lunar eclipse crescent halo with ultraviolet stardust
        ctx.strokeStyle = '#C084FC';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#A855F7';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, haloY, 12, Math.PI * 0.15, Math.PI * 1.25);
        ctx.stroke();

        // Floating dark void orb
        ctx.fillStyle = '#0F0B1E';
        ctx.strokeStyle = '#E879F9';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, haloY - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Amethyst starlight point
        ctx.fillStyle = '#F3E8FF';
        ctx.fillRect(-1, haloY - 3, 2, 2);
      } else if (craft.id === 'hummingbird') {
        // Flora-Zephyr // Goddess of Verdant Bloom: Radiant jade lotus petal halo
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, haloY, 14, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Lotus crown petal spikes
        ctx.fillStyle = '#6EE7B7';
        for (let p = -2; p <= 2; p++) {
          const px = p * 6;
          const py = haloY - (p === 0 ? 7 : 4);
          ctx.beginPath();
          ctx.moveTo(px - 2, haloY);
          ctx.lineTo(px, py);
          ctx.lineTo(px + 2, haloY);
          ctx.fill();
        }

        // Dewdrop emerald star
        ctx.fillStyle = '#E6FFFA';
        ctx.beginPath();
        ctx.arc(0, haloY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (craft.id === 'osprey') {
        // Athena-Aegis // Goddess of Sacred Defense: Golden spiked aegis battle crown with lightning crest
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(0, haloY, 16, 5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Gilded lightning crown crests
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        [-10, -4, 4, 10].forEach((lx, idx) => {
          const lh = idx === 1 || idx === 2 ? 9 : 6;
          ctx.beginPath();
          ctx.moveTo(lx, haloY);
          ctx.lineTo(lx, haloY - lh);
          ctx.stroke();
        });

        // Golden aegis node
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, haloY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (craft.id === 'specter') {
        // Selene-Phase // Goddess of Astral Mirage: Shimmering iridescent chromatic rainbow halo
        const rot = Date.now() * 0.002;
        ctx.strokeStyle = '#00FFA3';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.ellipse(0, haloY, 15, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiting astral star gems
        for (let s = 0; s < 3; s++) {
          const a = rot + s * ((Math.PI * 2) / 3);
          const sx = Math.cos(a) * 16;
          const sy = haloY + Math.sin(a) * 4.5;
          ctx.fillStyle = s === 0 ? '#38BDF8' : s === 1 ? '#F472B6' : '#FDE047';
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Aethelia // Supreme Goddess of Games: Triple-tiered golden halos with 5-pointed divine crown
        ctx.strokeStyle = '#FFE066';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(0, haloY, 17, 5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Upper second tier halo
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, haloY - 4, 12, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 5-Pointed divine starlight crown
        ctx.fillStyle = '#FFD700';
        for (let pt = -2; pt <= 2; pt++) {
          const px = pt * 5;
          const py = haloY - (pt === 0 ? 10 : Math.abs(pt) === 1 ? 7 : 5);
          ctx.beginPath();
          ctx.moveTo(px - 1.8, haloY - 4);
          ctx.lineTo(px, py);
          ctx.lineTo(px + 1.8, haloY - 4);
          ctx.fill();
        }

        // Central celestial cyan diamond jewel
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, haloY - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Hull Gradient
    const hullGrad = ctx.createLinearGradient(
      -BIRD_RADIUS,
      -BIRD_RADIUS,
      BIRD_RADIUS,
      BIRD_RADIUS
    );
    if (alive) {
      hullGrad.addColorStop(0, craft.hullColor);
      hullGrad.addColorStop(0.6, '#0B0F19');
      hullGrad.addColorStop(1, '#020617');
    } else {
      // Breached, charred alloy hull
      hullGrad.addColorStop(0, '#334155');
      hullGrad.addColorStop(0.5, '#0F172A');
      hullGrad.addColorStop(1, '#020617');
    }

    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = alive ? mainColor : '#475569';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_RADIUS + 4, BIRD_RADIUS, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!alive) {
      // Charred impact blast scars
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.ellipse(-2, 2, 9, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Kinetic spark arcs across metal hull
      if (Math.random() < 0.45) {
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const ax = (Math.random() - 0.5) * 20;
        const ay = (Math.random() - 0.5) * 14;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (Math.random() - 0.5) * 12, ay + (Math.random() - 0.5) * 12);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Cyber Armor Seam Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS - 6, Math.PI * 0.2, Math.PI * 1.2);
    ctx.stroke();

    // Craft-Specific Celestial Goddess Wing Rendering
    const wingFlap = Math.sin(wingCycle * 2.5) * 9 * craft.wingSpanFactor;
    ctx.save();
    ctx.translate(-8, wingFlap);

    if (craft.id === 'phoenix') {
      // Sol-Ignis: Swept blazing multi-feathered solar flame wing
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(16, -15);
      ctx.lineTo(24, -4);
      ctx.lineTo(18, 4);
      ctx.lineTo(8, 9);
      ctx.closePath();
      const fireGrad = ctx.createLinearGradient(-14, -15, 24, 9);
      fireGrad.addColorStop(0, '#FFAA00');
      fireGrad.addColorStop(0.5, '#FF4500');
      fireGrad.addColorStop(1, '#990022');
      ctx.fillStyle = fireGrad;
      ctx.strokeStyle = '#FFAA00';
      ctx.shadowColor = '#FF4500';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fiery quill vein
      ctx.strokeStyle = '#FFF3BF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(16, -6);
      ctx.stroke();
    } else if (craft.id === 'raven') {
      // Morrigan: Obsidian layered celestial feathers with glowing violet starlight veins
      ctx.beginPath();
      ctx.moveTo(-15, -4);
      ctx.lineTo(14, -12);
      ctx.lineTo(19, 0);
      ctx.lineTo(10, 8);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      const ravenGrad = ctx.createLinearGradient(-15, -12, 19, 9);
      ravenGrad.addColorStop(0, '#2E1065');
      ravenGrad.addColorStop(0.6, '#0F0E1A');
      ravenGrad.addColorStop(1, '#020617');
      ctx.fillStyle = ravenGrad;
      ctx.strokeStyle = '#C084FC';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Ultraviolet quill vein
      ctx.strokeStyle = '#E879F9';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-11, -2);
      ctx.lineTo(14, -4);
      ctx.stroke();
    } else if (craft.id === 'hummingbird') {
      // Flora-Zephyr: High-frequency crystalline kinetic wings shimmering with emerald glow
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(18, -9);
      ctx.lineTo(14, 5);
      ctx.lineTo(2, 7);
      ctx.closePath();
      const floraGrad = ctx.createLinearGradient(-8, -9, 18, 7);
      floraGrad.addColorStop(0, '#A7F3D0');
      floraGrad.addColorStop(0.5, '#10B981');
      floraGrad.addColorStop(1, '#064E3B');
      ctx.fillStyle = floraGrad;
      ctx.strokeStyle = '#34D399';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.6;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Emerald light veins
      ctx.strokeStyle = '#ECFDF5';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.lineTo(13, -3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (craft.id === 'osprey') {
      // Athena-Aegis: Golden eagle aegis wing with divine protection runes
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(16, -11);
      ctx.lineTo(20, 2);
      ctx.lineTo(12, 9);
      ctx.lineTo(-4, 9);
      ctx.closePath();
      const aegisGrad = ctx.createLinearGradient(-14, -11, 20, 9);
      aegisGrad.addColorStop(0, '#FEF08A');
      aegisGrad.addColorStop(0.4, '#F59E0B');
      aegisGrad.addColorStop(1, '#451A03');
      ctx.fillStyle = aegisGrad;
      ctx.strokeStyle = '#FDE047';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Divine lightning glyph
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(4, -5);
      ctx.lineTo(8, -1);
      ctx.lineTo(15, -4);
      ctx.stroke();
    } else if (craft.id === 'specter') {
      // Selene-Phase: Prismatic translucent crystal fairy-phase wing
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(17, -13);
      ctx.lineTo(22, -1);
      ctx.lineTo(13, 7);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      const specGrad = ctx.createLinearGradient(-12, -13, 22, 8);
      specGrad.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
      specGrad.addColorStop(0.5, 'rgba(232, 121, 249, 0.8)');
      specGrad.addColorStop(1, 'rgba(52, 211, 153, 0.85)');
      ctx.fillStyle = specGrad;
      ctx.strokeStyle = '#67E8F9';
      ctx.shadowColor = '#00FFA3';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Astral starlight quill
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(16, -4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (craft.id === 'falcon') {
      // Valyria: Supersonic cyan feather-blade with luminous aeolian quills
      ctx.beginPath();
      ctx.moveTo(-13, -5);
      ctx.lineTo(15, -12);
      ctx.lineTo(19, 1);
      ctx.lineTo(10, 8);
      ctx.lineTo(-5, 8);
      ctx.closePath();
      const valyriaGrad = ctx.createLinearGradient(-13, -12, 19, 8);
      valyriaGrad.addColorStop(0, '#BAE6FD');
      valyriaGrad.addColorStop(0.5, '#0284C7');
      valyriaGrad.addColorStop(1, '#082F49');
      ctx.fillStyle = valyriaGrad;
      ctx.strokeStyle = '#38BDF8';
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Azure wind quill
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.lineTo(15, -4);
      ctx.stroke();
    } else {
      // Aethelia: Celestial Golden Feathered Wings with Astral Glow
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(16, -14);
      ctx.lineTo(24, -2);
      ctx.lineTo(14, 6);
      ctx.lineTo(-4, 10);
      ctx.closePath();
      const wingGrad = ctx.createLinearGradient(-14, -14, 24, 10);
      wingGrad.addColorStop(0, '#FFF5C2');
      wingGrad.addColorStop(0.5, '#FFD700');
      wingGrad.addColorStop(1, '#B8860B');
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = '#FFE066';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Starlight cyan quill vein
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(18, -4);
      ctx.stroke();
    }
    ctx.restore();

    // Visor / Celestial Eyes & Forehead Divine Diadem
    if (alive) {
      // Forehead Divine Bindi / Diadem Jewel
      ctx.save();
      ctx.fillStyle = craft.accentColor;
      ctx.shadowColor = craft.accentColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(8, -11, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Celestial Visor / Eyes
      ctx.shadowColor = craft.visorColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = craft.visorColor;
      ctx.beginPath();
      ctx.ellipse(12, -4, 11, 6.5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Celestial Starlight Glint
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(14, -6, 4.5, 2, -0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tactical Offline Breached Visor (no cartoon dead eyes, realistic breached canopy)
      ctx.fillStyle = '#450A0A';
      ctx.beginPath();
      ctx.ellipse(12, -4, 11, 6.5, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Breach Fracture Lines
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, -8);
      ctx.lineTo(12, -3);
      ctx.lineTo(17, -7);
      ctx.moveTo(12, -3);
      ctx.lineTo(14, 2);
      ctx.stroke();

      // Flickering emergency beacon diode
      if (Math.sin(Date.now() * 0.015) > 0.2) {
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(8, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Aerodynamic Beak / Sensor Cone
    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(20, -4);
    ctx.lineTo(34, 0);
    ctx.lineTo(20, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  // UNIQUE ENTRY CREATURE: Aero-Chrome Launch Sentinel Guardian
  const drawEntryGuardian = (
    ctx: CanvasRenderingContext2D,
    curTheme: SectorColorStage,
    dt: number,
    vWidth: number
  ) => {
    const guardian = guardianRef.current;
    if (guardian.mode === 'cleared') return;

    guardian.time += dt * 0.045;

    if (guardian.mode === 'idle') {
      // Smooth hovering escort stance ahead and slightly above player craft
      guardian.x = BIRD_X + 115 + Math.sin(guardian.time * 1.8) * 6;
      guardian.y = 195 + Math.sin(guardian.time * 2.4) * 8;
    } else if (guardian.mode === 'launching') {
      // Supersonic acceleration forward to escort craft into warp
      guardian.vx += 1.6 * dt;
      guardian.x += (12 + guardian.vx) * dt;

      // Sonic blast particles
      if (Math.random() < 0.6) {
        particles.current.push({
          x: guardian.x - 26,
          y: guardian.y + (Math.random() * 8 - 4),
          vx: -guardian.vx * 1.8,
          vy: (Math.random() - 0.5) * 2,
          color: '#00F0FF',
          radius: Math.random() * 4 + 2,
          alpha: 0.9,
          decay: 0.06,
        });
      }

      if (guardian.x > vWidth + 140) {
        guardian.mode = 'cleared';
        return;
      }
    }

    const wingSweep = Math.sin(guardian.time * 3.5) * 12;

    ctx.save();
    ctx.translate(guardian.x, guardian.y);

    // 1. Rear Ion Plasma Exhaust
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.ellipse(
      -18,
      0,
      guardian.mode === 'launching' ? 14 : 7,
      3.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-16, 0, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Articulated Chrome Back Wing
    ctx.save();
    ctx.translate(-6, -4);
    ctx.rotate((-wingSweep * Math.PI) / 180);
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(24, -18);
    ctx.lineTo(30, -6);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Main Chrome Aerospace Fuselage
    const fuseGrad = ctx.createLinearGradient(-16, -10, 20, 10);
    fuseGrad.addColorStop(0, '#E2E8F0');
    fuseGrad.addColorStop(0.5, '#64748B');
    fuseGrad.addColorStop(1, '#1E293B');

    ctx.fillStyle = fuseGrad;
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-4, -10);
    ctx.lineTo(16, -6);
    ctx.lineTo(28, 0);
    ctx.lineTo(16, 6);
    ctx.lineTo(-4, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Accent cyan light piping
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();

    // 4. Fore Articulated Wing (Foreground)
    ctx.save();
    ctx.translate(2, 2);
    ctx.rotate((wingSweep * 0.9 * Math.PI) / 180);
    const foreWingGrad = ctx.createLinearGradient(0, 0, 34, -22);
    foreWingGrad.addColorStop(0, '#F8FAFC');
    foreWingGrad.addColorStop(0.5, '#94A3B8');
    foreWingGrad.addColorStop(1, '#334155');
    ctx.fillStyle = foreWingGrad;
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(28, -22);
    ctx.lineTo(36, -12);
    ctx.lineTo(16, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cyan energy feather conduits
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(26, -16);
    ctx.lineTo(20, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Visor / Sensor Eye
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(18, -1, 5, 2.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Beak / Sensor Cone
    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, -3);
    ctx.lineTo(34, 0);
    ctx.lineTo(24, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // 7. Holographic Flight Corridor Projection (During Idle)
    if (guardian.mode === 'idle') {
      ctx.save();
      const projX = guardian.x + 20;
      const projY = guardian.y + 4;

      // Translucent cyan guide cone extending to the right
      const coneGrad = ctx.createLinearGradient(
        projX,
        projY,
        projX + 160,
        projY + 20
      );
      coneGrad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
      coneGrad.addColorStop(0.6, 'rgba(0, 240, 255, 0.08)');
      coneGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(projX, projY);
      ctx.lineTo(projX + 160, projY - 24);
      ctx.lineTo(projX + 160, projY + 24);
      ctx.closePath();
      ctx.fill();

      // Guide line
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(projX, projY);
      ctx.lineTo(projX + 160, projY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating Entry HUD Label
      ctx.font = '900 11px monospace';
      ctx.fillStyle = '#00F0FF';
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'left';
      ctx.fillText('GUARDIAN ESCORT // RUNWAY SECURE', projX + 25, projY - 14);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.shadowBlur = 0;
      ctx.fillText(
        'PRESS [SPACE] / TAP TO COMMENCE TAKEOFF',
        projX + 25,
        projY + 16
      );

      ctx.restore();
    }
  };

  // UNIQUE CRASH CREATURE: Chrome Sentinel Reaper (Scans the dead bird with crimson laser)
  const drawSteelReaper = (
    ctx: CanvasRenderingContext2D,
    dt: number,
    vWidth: number,
    downedX: number,
    downedY: number
  ) => {
    const reaper = reaperRef.current;
    if (!reaper.active) return;

    reaper.time += dt * 0.04;
    reaper.targetX = downedX + 45;
    reaper.targetY = Math.max(65, downedY - 75);

    // Smooth movement toward target above downed bird
    const dx = reaper.targetX - reaper.x;
    const dy = reaper.targetY - reaper.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      reaper.x += dx * Math.min(1, 0.09 * dt);
      reaper.y += dy * Math.min(1, 0.09 * dt);
    } else {
      reaper.arrived = true;
    }

    // Hover bobbing when arrived
    const hoverY =
      reaper.y + (reaper.arrived ? Math.sin(reaper.time * 2.6) * 5 : 0);
    const hoverX =
      reaper.x + (reaper.arrived ? Math.cos(reaper.time * 1.8) * 3 : 0);
    const wingSwing = Math.sin(reaper.time * 3.2) * 14;

    ctx.save();
    ctx.translate(hoverX, hoverY);

    // Face left towards the downed bird
    ctx.scale(-1, 1);

    // 1. Thruster Jet Particles
    if (Math.random() < 0.35) {
      particles.current.push({
        x: hoverX + (Math.random() * 10 - 5),
        y: hoverY + 14,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#EF4444' : '#F97316',
        radius: Math.random() * 3 + 1,
        alpha: 0.7,
        decay: 0.05,
      });
    }

    // 2. Mechanical Steel Wings (Articulated Razor Plates)
    // Left / Back Wing
    ctx.save();
    ctx.translate(-8, -4);
    ctx.rotate((wingSwing * Math.PI) / 180);
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-24, -18);
    ctx.lineTo(-32, -4);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner blade edge
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-20, -12);
    ctx.lineTo(-14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Steel Mecha Fuselage / Torso
    const torsoGrad = ctx.createLinearGradient(-14, -14, 18, 14);
    torsoGrad.addColorStop(0, '#64748B');
    torsoGrad.addColorStop(0.4, '#1E293B');
    torsoGrad.addColorStop(1, '#0B0F19');

    ctx.fillStyle = torsoGrad;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.lineTo(8, -12);
    ctx.lineTo(22, -2);
    ctx.lineTo(14, 12);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crimson energy conduit line
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Steel Raptor Talons (deploying downward toward wreckage)
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(-8, 18);
    ctx.lineTo(-4, 22);
    ctx.moveTo(4, 10);
    ctx.lineTo(2, 18);
    ctx.lineTo(6, 23);
    ctx.stroke();

    // 5. Fore Wing (Front Articulated Chrome Razor)
    ctx.save();
    ctx.translate(4, -2);
    ctx.rotate((-wingSwing * 0.9 * Math.PI) / 180);
    const wingGrad = ctx.createLinearGradient(0, 0, 36, -26);
    wingGrad.addColorStop(0, '#94A3B8');
    wingGrad.addColorStop(0.5, '#334155');
    wingGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -24);
    ctx.lineTo(36, -16);
    ctx.lineTo(18, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chrome feathers
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(30, -20);
    ctx.lineTo(20, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Cybernetic Sensor Head & Crimson Ocular Eye
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(16, -4);
    ctx.lineTo(30, -2);
    ctx.lineTo(26, 6);
    ctx.lineTo(14, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Ocular Scanner Eye
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(23, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore(); // restore translate / flip

    // 7. Volumetric Targeting Laser Scanning Down onto Fallen Bird!
    if (reaper.arrived) {
      ctx.save();
      const eyeX = hoverX - 23;
      const eyeY = hoverY;

      // Volumetric laser cone
      const coneGrad = ctx.createLinearGradient(eyeX, eyeY, downedX, downedY);
      coneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
      coneGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.18)');
      coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.lineTo(downedX - 35, downedY + 12);
      ctx.lineTo(downedX + 35, downedY + 12);
      ctx.closePath();
      ctx.fill();

      // Sweeping horizontal laser bar across the dead bird
      const sweepY = downedY - 14 + ((Math.sin(reaper.time * 4) + 1) / 2) * 26;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(downedX - 28, sweepY);
      ctx.lineTo(downedX + 28, sweepY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Wireframe target box around downed bird
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(downedX - 25, downedY - 20, 50, 36);

      // Monospace HUD Readout over the fallen wreckage
      ctx.font = '900 11px monospace';
      ctx.fillStyle = '#EF4444';
      ctx.textAlign = 'center';
      ctx.fillText('[STEEL REAPER // HARVEST PROTOCOL]', downedX, downedY - 32);
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#FCA5A5';
      ctx.fillText(
        'TARGET STATUS: OFFLINE // HULL INTEGRITY 0%',
        downedX,
        downedY - 21
      );

      ctx.restore();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disallow key triggers when any modal (Crafts & Themes, Welcome, Hall of Fame) is open
      if (isModalOpen) return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleFlap();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleRestart();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMusic();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleToggleSfx();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap, isModalOpen]);

  // Restart match in single or rematch in multiplayer
  const handleRestart = async () => {
    // Grace period so crash impulse taps don't accidentally restart immediately
    if (Date.now() - crashTimestampRef.current < 450) return;

    if (isMultiplayer && activeRoom) {
      if (rematchLoading) return;
      try {
        setRematchLoading(true);
        soundManager.speakTacticalAlert('REMATCH SEQUENCE INITIATED.');
        await restartRoomMatch(activeRoom.id, activeRoom.host, activeRoom.guest);
      } catch (err) {
        console.warn('Error restarting multiplayer race:', err);
      } finally {
        setRematchLoading(false);
      }
    } else {
      initGame();
      setGameState('idle');
      soundManager.startMusic('ambient');
    }
  };

  return (
    <div
      id="flappy-game-wrapper"
      className={`relative w-full h-full flex-1 flex flex-col items-center select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-[100dvh] max-w-none m-0 p-0 bg-slate-950' : ''
      }`}
    >
      <div
        id="canvas-container"
        ref={containerRef}
        className="relative w-full h-full flex-1 overflow-hidden bg-slate-950 cursor-pointer touch-none flex flex-col"
        onClick={() => {
          if (gameState === 'gameover') return;
          handleFlap();
        }}
        onTouchStart={(e) => {
          // In gameover state, do NOT preventDefault or trigger flap!
          // This allows all buttons on the crash window to receive touches cleanly!
          if (gameState === 'gameover') return;
          e.preventDefault();
          handleFlap();
        }}
      >
        <canvas
          ref={canvasRef}
          id="flappy-canvas"
          className="w-full h-full block"
        />

        {/* Minimalist Aerospace Top HUD */}
        <div
          className="absolute top-0 inset-x-0 pt-safe px-2 sm:px-4 pt-2 sm:pt-3 flex items-center justify-between pointer-events-none z-10 font-mono gap-1 sm:gap-2"
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Top-Left: Pilot Avatar, Warp Speed, & Flight Mode */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto min-w-0">
            {/* Pilot Callsign Avatar */}
            {isGoogleUser ? (
              <button
                id="hud-pilot-status-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="relative p-0.5 rounded-full hover:scale-105 transition-all cursor-pointer group shrink-0"
                title={`Pilot: ${userProfile.displayName} // Insignia Verified (Click to open terminal)`}
                aria-label="Pilot Profile"
              >
                <PilotAvatar
                  photoURL={userProfile.photoURL}
                  name={userProfile.displayName}
                  size="sm"
                  showGlow={true}
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
              </button>
            ) : (
              <button
                id="hud-guest-signin-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="p-1.5 sm:p-2 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-400/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)] animate-pulse transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Sign Up or Sign In to post your score to Leaderboard"
                aria-label="Pilot Sign In / Sign Up"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              </button>
            )}

            <div className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-cyan-400 text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="hidden xs:inline">WARP</span>
              <span>{warpSpeed}</span>
            </div>

            <div
              className="hidden md:flex items-center px-2.5 py-1.5 rounded-lg bg-slate-950/90 border text-xs font-bold gap-1.5 transition-all duration-300 shrink-0"
              style={{
                borderColor: activeTheme.gatePrimary,
                color: activeTheme.gatePrimary,
                boxShadow: `0 0 12px ${activeTheme.gateGlow}`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeTheme.sectorName}</span>
            </div>

            {/* Direct Flight Mode Switcher */}
            {onSelectMode && (
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0">
                <button
                  id="hud-mode-single-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode('single');
                  }}
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                    currentMode === 'single'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Single Player Endless Warp Mode"
                >
                  <Gamepad2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">SOLO</span>
                </button>

                <button
                  id="hud-mode-multiplayer-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode('multiplayer');
                  }}
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                    currentMode === 'multiplayer'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Multiplayer 1v1 Quantum Duel"
                >
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">DUEL</span>
                  <span className="sm:hidden">2P</span>
                </button>
              </div>
            )}
          </div>

          {/* Top-Right: Opponent Telemetry, Universal Fullscreen, and Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0 relative">
            {isMultiplayer && opponent && (
              <div className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold ${
                opponent.alive
                  ? 'bg-purple-950/90 border-purple-500/40 text-purple-300'
                  : 'bg-red-950/90 border-red-500/50 text-red-300'
              }`}>
                {opponent.displayName.slice(0, 5)}: {opponent.score}
                <span className="hidden sm:inline">{opponent.alive ? ' pts' : ' (CRASH)'}</span>
              </div>
            )}

            {/* Universal Fullscreen Button - Prominent & accessible on EVERY screen */}
            <button
              id="fullscreen-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Universal Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Universal Fullscreen'}
              className="p-1.5 sm:p-2 bg-slate-950/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="text-[10px] font-bold hidden xs:inline sm:hidden">
                {isFullscreen ? 'EXIT' : 'FULL'}
              </span>
            </button>

            {/* Mobile Cockpit Drawer Toggle (< sm screens) */}
            <div className="relative sm:hidden">
              <button
                id="mobile-hud-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  showMobileMenu
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                    : 'bg-slate-950/90 border-slate-700 text-slate-200 hover:text-white'
                }`}
                title="Cockpit Quick Actions"
                aria-label="Cockpit Quick Actions"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black tracking-wider">MENU</span>
              </button>

              {/* Mobile HUD Floating Quick Flyout Menu */}
              {showMobileMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 p-2.5 rounded-2xl bg-slate-950/98 border border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.35)] backdrop-blur-xl z-30 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1 text-[10px] font-black text-cyan-400 border-b border-cyan-500/30 flex items-center justify-between">
                    <span>COCKPIT CONTROLS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  {onOpenLeaderboard && (
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onOpenLeaderboard();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pilot Hall of Fame</span>
                    </button>
                  )}

                  {onOpenThemeWindow && (
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onOpenThemeWindow();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Goddesses & Themes</span>
                    </button>
                  )}

                  {onOpenCinematic && (
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onOpenCinematic();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      <span>2014 Origin Cinematic</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
                    <button
                      onClick={handleToggleMusic}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                        !musicMuted
                          ? 'bg-purple-950/80 border-purple-400 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <Music className="w-3 h-3" />
                      <span>{musicMuted ? 'BGM OFF' : 'BGM ON'}</span>
                    </button>

                    <button
                      onClick={handleToggleSfx}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                        !sfxMuted
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {!sfxMuted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      <span>{sfxMuted ? 'SFX OFF' : 'SFX ON'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tablet & Desktop Inline Buttons (hidden on < sm) */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Background Music Toggle */}
              <button
                id="hud-music-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMusic();
                }}
                className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                  !musicMuted
                    ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={!musicMuted ? 'Mute Music' : 'Play Music'}
                aria-label="Toggle Music"
              >
                <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Sound FX Toggle */}
              <button
                id="hud-mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSfx();
                }}
                className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                  !sfxMuted
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={!sfxMuted ? 'Mute SFX' : 'Unmute SFX'}
                aria-label="Toggle Sound Effects"
              >
                {!sfxMuted ? (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>

              {/* 2014 Origin Story & Goddess Awakening Cinematic Trigger */}
              {onOpenCinematic && (
                <button
                  id="hud-cinematic-intro-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCinematic();
                  }}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:border-amber-400 group"
                  title="Watch 2014 Origin & Goddess Awakening Cinematic"
                  aria-label="Origin Story Cinematic"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span className="hidden lg:inline">2014 ORIGIN</span>
                </button>
              )}

              {/* On-Screen Global Pilot Hall of Fame Button */}
              {onOpenLeaderboard && (
                <button
                  id="hud-hall-of-fame-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLeaderboard();
                  }}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-400 group"
                  title="Global Pilot Hall of Fame"
                  aria-label="Hall of Fame"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">RANKINGS</span>
                </button>
              )}

              {/* Theme & Craft Config Button */}
              {onOpenThemeWindow && (
                <button
                  id="hud-theme-system-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenThemeWindow();
                  }}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  title="Craft Fleet & Sector Themes"
                  aria-label="Craft Fleet & Sector Themes"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">CRAFTS</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Centered Score */}
        {gameState === 'playing' && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none text-center font-mono">
            <span
              className="text-6xl sm:text-7xl font-black tracking-wider transition-colors duration-500"
              style={{
                color: '#FFFFFF',
                textShadow: `0 0 20px ${activeTheme.gatePrimary}, 0 0 45px ${activeTheme.gatePrimary}`,
              }}
            >
              {score}
            </span>
          </div>
        )}

        {/* Multiplayer Spectating HUD when local player is crashed */}
        {isMultiplayer && !isAlive.current && opponent && opponent.alive && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none font-mono">
            <div className="px-4 py-2 rounded-xl bg-red-950/90 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-center animate-pulse">
              <p className="text-xs font-black text-red-400 tracking-wider">
                ⚠️ HULL INTEGRITY LOST // DOWNED IN SECTOR
              </p>
              <p className="text-[11px] text-slate-300 font-bold">
                SPECTATING {opponent.displayName.toUpperCase()} (SCORE: {opponent.score || 0})
              </p>
            </div>
          </div>
        )}

        {/* Pre-Flight Pilot Registration Clearance Card (Before Flight Commences) */}
        {gameState === 'idle' && !isMultiplayer && !isGuestDismissed && !guestBypassedState && (
          <div
            id="pre-flight-clearance-card"
            className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto font-mono w-[94%] max-w-md animate-in fade-in slide-in-from-top-3 duration-300"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/92 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_35px_rgba(0,240,255,0.25)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isGoogleUser ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                    {isGoogleUser ? 'PILOT CLEARANCE: VERIFIED' : 'CALLSIGN AUTHENTICATION NEEDED'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isGoogleUser ? 'SECTOR RANKED' : 'LEADERBOARD GATE'}
                </span>
              </div>

              {isGoogleUser ? (
                <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-cyan-500/30 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PilotAvatar
                      photoURL={userProfile.photoURL}
                      name={userProfile.displayName}
                      size="sm"
                      showGlow={true}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span>PILOT: {userProfile.displayName}</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      </p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> Leaderboard connected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-mono">BEST</span>
                      <span className="text-xs font-black text-amber-400 font-mono">{highScore} pts</span>
                    </div>
                    {onLogout && (
                      <button
                        id="preflight-logout-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogout();
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                        title="Sign Out of Callsign"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>LOGOUT</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                    Register your Callsign ID & password before takeoff so your flight rank, insignia, and high score stream to the <span className="text-cyan-400 font-bold">Global Leaderboard</span>!
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      id="idle-pilot-signin-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenAuthModal) onOpenAuthModal();
                      }}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase font-mono transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <UserPlus className="w-3.5 h-3.5 shrink-0" />
                      <span>SIGN UP / SIGN IN</span>
                    </button>

                    <button
                      id="idle-guest-bypass-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        guestBypassedAuthRef.current = true;
                        setGuestBypassedState(true);
                        if (onDismissGuestClearance) onDismissGuestClearance();
                      }}
                      className="py-2 px-3 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      Fly as Guest
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Milestone Banner */}
        {milestoneBanner && (
          <div
            id="top-milestone-praise-banner"
            className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-sm px-4 animate-in slide-in-from-top-3 fade-in duration-300 font-mono"
          >
            <div
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950/95 border text-center space-y-0.5 shadow-2xl"
              style={{
                borderColor: milestoneBanner.color,
                boxShadow: `0 0 35px ${milestoneBanner.color}80`,
              }}
            >
              <div
                className="text-sm sm:text-base font-black tracking-wider uppercase"
                style={{ color: milestoneBanner.color }}
              >
                {milestoneBanner.headline}
              </div>
              <p className="text-[11px] font-bold text-slate-300">
                {milestoneBanner.subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none space-y-3 font-mono">
            <p className="text-xs font-bold tracking-widest text-cyan-400">
              QUANTUM TELEMETRY SYNCHRONIZATION
            </p>
            <div className="text-8xl font-black text-cyan-400 drop-shadow-[0_0_30px_#00F0FF] animate-bounce">
              {countdownNum}
            </div>
            <p className="text-xs text-slate-400">
              INITIALIZING PROPULSION DRIVE...
            </p>
          </div>
        )}

        {/* STREAMLINED HIGH-TECH AEROSPACE CRASH TELEMETRY HUD */}
        {gameState === 'gameover' && (
          <div
            id="game-over-overlay"
            className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-30 pointer-events-auto font-mono animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-950/85 backdrop-blur-md border border-rose-500/40 rounded-2xl p-3.5 sm:p-4.5 shadow-[0_0_35px_rgba(244,63,94,0.25)] space-y-3">
              {/* Tactical Status & Chassis Readout */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs sm:text-sm font-black text-rose-400 tracking-wider">
                    {isMultiplayer
                      ? raceWinner === userProfile.uid
                        ? 'TARGET DOWN // RACE WON'
                        : 'MISSION DEFEAT // RECOVERY ACTIVE'
                      : 'HULL INTEGRITY 0% // CRITICAL IMPACT'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  GODDESS: {activeCraft.name.split('//')[0].trim().toUpperCase()}
                </span>
              </div>

              {/* Minimalist 3-Metric HUD Bar */}
              <div className="grid grid-cols-3 gap-2 text-center py-0.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase">GATES</span>
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]">
                    {score}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase">WARP VELOCITY</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">
                    {warpSpeed}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase">
                    {isNewRecord ? 'NEW RECORD!' : 'BEST RECORD'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {highScore}
                  </span>
                </div>
              </div>

              {/* Leaderboard Post Status / Google Login Prompt */}
              {isGoogleUser ? (
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate text-[11px]">
                      Callsign <strong>{userProfile.displayName}</strong> linked to Leaderboard
                    </span>
                  </div>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md shrink-0 font-bold">
                    RANKED
                  </span>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs flex items-center justify-between gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span className="text-[11px] truncate text-slate-200">
                      Cadet run: <strong className="text-amber-400 font-black">{score} pts</strong>. Post to Leaderboard?
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black rounded-lg text-[10px] uppercase shrink-0">
                    SIGN UP / IN
                  </span>
                </div>
              )}

              {/* Primary Action Button: Glowing Cyber Reboot */}
              <div className="space-y-2">
                {isMultiplayer ? (
                  <button
                    id="rematch-race-btn"
                    disabled={rematchLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestart();
                    }}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950/60 disabled:text-emerald-400/50 text-slate-950 font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider active:scale-98"
                  >
                    <RotateCcw className={`w-4 h-4 ${rematchLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {rematchLoading
                        ? 'SYNCHRONIZING REMATCH...'
                        : 'RE-ENGAGE QUANTUM DUEL [SPACE / R]'}
                    </span>
                  </button>
                ) : (
                  <button
                    id="play-again-single-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestart();
                    }}
                    className="w-full py-3 sm:py-3.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>REBOOT CHASSIS & THRUSTERS [CLICK TO FLY AGAIN]</span>
                  </button>
                )}

                {/* Quick Clean Action Buttons */}
                <div className="flex items-center gap-2">
                  {onOpenLeaderboard && (
                    <button
                      id="view-leaderboard-from-gameover-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLeaderboard();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>PILOT RANKINGS</span>
                    </button>
                  )}

                  {onOpenThemeWindow && (
                    <button
                      id="open-theme-from-gameover-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenThemeWindow();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-purple-400" />
                      <span>CRAFTS & SECTORS</span>
                    </button>
                  )}

                  <button
                    id="gameover-fullscreen-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Universal Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span className="hidden xs:inline">{isFullscreen ? 'EXIT' : 'FULL'}</span>
                  </button>

                  {isMultiplayer && onExitRoom && (
                    <button
                      id="exit-to-lobby-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExitRoom();
                      }}
                      className="py-2 px-3 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800 rounded-lg shrink-0"
                    >
                      EXIT
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Touch Device Tactile Flap Trigger (Only during active flight) */}
      {gameState === 'playing' && (
        <button
          id="mobile-flap-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleFlap();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleFlap();
          }}
          className="fixed bottom-6 right-6 px-5 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 active:scale-90 text-slate-950 font-black rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.6)] sm:hidden z-20 font-mono tracking-wider flex items-center gap-1.5 border border-cyan-200 cursor-pointer"
          aria-label="Tap to thrust"
        >
          <Zap className="w-4 h-4 fill-current animate-pulse" />
          <span className="text-xs">THRUST</span>
        </button>
      )}
    </div>
  );
}
