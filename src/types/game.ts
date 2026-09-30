export interface UserProfile {
  uid: string;
  username?: string;
  displayName: string;
  passwordHash?: string;
  email?: string;
  photoURL?: string;
  highScore: number;
  multiplayerWins: number;
  gamesPlayed: number;
  isRegisteredPilot?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerRaceState {
  uid: string;
  displayName: string;
  photoURL?: string;
  isReady: boolean;
  score: number;
  distance: number;
  y: number;
  vy: number;
  alive: boolean;
  color: string;
  lastUpdate?: number;
}

export type RoomStatus = 'waiting' | 'countdown' | 'racing' | 'finished';

export interface MultiplayerRoom {
  id: string;
  code: string;
  status: RoomStatus;
  host: PlayerRaceState;
  guest?: PlayerRaceState | null;
  pipeSeed: number;
  countdownStart?: number;
  winnerUid?: string | null;
  createdAt: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  highScore: number;
  multiplayerWins?: number;
}

export interface PipePair {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
  emoji?: string;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  alpha: number;
  color: string;
}

export type CyberThemeId =
  | 'cyberpunk'
  | 'synthwave'
  | 'matrix'
  | 'void'
  | 'solar'
  | 'aurora'
  | 'citadel'
  | 'acid';

export interface CyberTheme {
  id: CyberThemeId;
  name: string;
  tagline: string;
  skyTop: string;
  skyBottom: string;
  gridColor: string;
  gatePrimary: string;
  gateSecondary: string;
  gateGlow: string;
  birdVisor: string;
  accent: string;
  accentBg: string;
}

export type BirdCraftId =
  | 'falcon'
  | 'phoenix'
  | 'raven'
  | 'hummingbird'
  | 'osprey'
  | 'specter'
  | 'goddess';

export interface BirdCraft {
  id: BirdCraftId;
  name: string;
  designation: string;
  classType: string;
  description: string;
  hullColor: string;
  accentColor: string;
  visorColor: string;
  thrusterColor: string;
  wingSpanFactor: number;
}

export interface PilotAvatarOption {
  id: string;
  label: string;
  color: string;
  icon: string;
  name: string;
}

export const PILOT_AVATARS: PilotAvatarOption[] = [
  { id: 'valkyrie', label: 'Valkyrie-01', color: '#00F0FF', icon: '⚡', name: 'Lightning Core' },
  { id: 'solaris', label: 'Solar-Pyro', color: '#FF4500', icon: '🔥', name: 'Plasma Flare' },
  { id: 'shadow', label: 'Void-Nox', color: '#A855F7', icon: '🌑', name: 'Quantum Void' },
  { id: 'chrono', label: 'Flora-Bloom', color: '#10B981', icon: '🌿', name: 'Cyber Emerald' },
  { id: 'titan', label: 'Aegis-Guard', color: '#F59E0B', icon: '🛡️', name: 'Titan Aegis' },
  { id: 'phase', label: 'Mirage-Astra', color: '#00FFA3', icon: '✨', name: 'Stellar Pulse' },
  { id: 'crown', label: 'Apex-Overlord', color: '#F43F5E', icon: '👑', name: 'Apex Crown' },
  { id: 'cyborg', label: 'Mecha-Spectre', color: '#38BDF8', icon: '🤖', name: 'Mecha Unit' },
];

