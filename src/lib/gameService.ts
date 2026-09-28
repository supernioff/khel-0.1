import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth, signInAnonymously } from './firebase';
import type { UserProfile, MultiplayerRoom, PlayerRaceState, LeaderboardEntry } from '../types/game';
import type { User } from 'firebase/auth';

const GUEST_STORAGE_KEY = 'cyber_pilot_guest_profile';
const ACTIVE_PILOT_SESSION_KEY = 'flappy_active_pilot_session';

/**
 * Computes a secure SHA-256 hash with salt for pilot passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = 'flappy_quantum_sector_pilot_v1_';
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes username to a safe, case-insensitive document ID.
 */
export function sanitizeUsernameKey(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

/**
 * Retrieves the currently logged-in pilot from persistent session,
 * or returns null if the user is in guest/cadet mode.
 */
export function getActivePilotSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PILOT_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      if (parsed && parsed.uid && parsed.displayName && parsed.isRegisteredPilot) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading active pilot session:', e);
  }
  return null;
}

/**
 * Saves the active pilot session to localStorage.
 */
export function saveActivePilotSession(profile: UserProfile): void {
  try {
    localStorage.setItem(ACTIVE_PILOT_SESSION_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving active pilot session:', e);
  }
}

/**
 * Clears the active pilot session and resets guest storage to a fresh Cadet profile on logout.
 */
export function clearActivePilotSession(): UserProfile {
  try {
    localStorage.removeItem(ACTIVE_PILOT_SESSION_KEY);
  } catch (e) {
    console.warn('Error clearing active pilot session:', e);
  }

  const guestUid = 'cadet_' + Math.random().toString(36).substring(2, 10);
  const freshCadet: UserProfile = {
    uid: guestUid,
    displayName: 'Cadet Pilot',
    highScore: 0,
    multiplayerWins: 0,
    gamesPlayed: 0,
    isRegisteredPilot: false,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(freshCadet));
  } catch (e) {
    console.warn('Error saving fresh cadet profile:', e);
  }

  return freshCadet;
}

/**
 * Registers a new Pilot Account with Username (Callsign), Password, and Insignia.
 * Checks if username already exists in Sector Registry.
 */
export async function registerPilotAccount(
  username: string,
  password: string,
  avatarColor = '#00F0FF'
): Promise<{ success: boolean; profile?: UserProfile; error?: string; code?: 'EXISTS' | 'INVALID' }> {
  const cleanName = username.trim();
  if (cleanName.length < 2 || cleanName.length > 20) {
    return { success: false, error: 'Callsign must be between 2 and 20 characters.', code: 'INVALID' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.', code: 'INVALID' };
  }

  const docKey = sanitizeUsernameKey(cleanName);
  const userRef = doc(db, 'users', docKey);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return {
        success: false,
        error: `Callsign "${cleanName}" is already registered! Please SIGN IN with your password.`,
        code: 'EXISTS',
      };
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const newProfile: UserProfile = {
      uid: docKey,
      username: cleanName,
      displayName: cleanName,
      passwordHash,
      photoURL: avatarColor,
      highScore: 0,
      multiplayerWins: 0,
      gamesPlayed: 0,
      isRegisteredPilot: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, newProfile);
    saveActivePilotSession(newProfile);
    saveLocalGuestProfile(newProfile);

    return { success: true, profile: newProfile };
  } catch (err: unknown) {
    console.error('Error registering pilot account:', err);
    const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
    return { success: false, error: msg };
  }
}

/**
 * Authenticates an existing Pilot Account with Username and Password.
 */
export async function loginPilotAccount(
  username: string,
  password: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string; code?: 'NOT_FOUND' | 'WRONG_PASSWORD' }> {
  const cleanName = username.trim();
  if (!cleanName) {
    return { success: false, error: 'Please enter your Callsign.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const docKey = sanitizeUsernameKey(cleanName);
  const userRef = doc(db, 'users', docKey);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return {
        success: false,
        error: `Callsign "${cleanName}" was not found! Please SIGN UP to create your pilot identity.`,
        code: 'NOT_FOUND',
      };
    }

    const data = snap.data() as UserProfile;
    const computedHash = await hashPassword(password);

    if (data.passwordHash && data.passwordHash !== computedHash) {
      return {
        success: false,
        error: `Incorrect password for Callsign "${cleanName}". Please try again.`,
        code: 'WRONG_PASSWORD',
      };
    }

    const updatedProfile: UserProfile = {
      ...data,
      displayName: data.displayName || cleanName,
      username: data.username || cleanName,
      isRegisteredPilot: true,
      updatedAt: new Date().toISOString(),
    };

    saveActivePilotSession(updatedProfile);
    saveLocalGuestProfile(updatedProfile);

    return { success: true, profile: updatedProfile };
  } catch (err: unknown) {
    console.error('Error logging in pilot account:', err);
    const msg = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
    return { success: false, error: msg };
  }
}

/**
 * Resets the Leaderboard starting from scratch.
 * Resets pilot high scores to 0 or clears legacy/test entries, ensuring all registered pilots start fresh.
 */
export async function resetLeaderboard(): Promise<{ success: boolean; count: number }> {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    let count = 0;

    for (const d of snap.docs) {
      const data = d.data() as UserProfile;
      // If it's a registered pilot, reset their score to 0 so they stay on the board from scratch
      if (data.isRegisteredPilot || data.passwordHash) {
        await updateDoc(d.ref, {
          highScore: 0,
          gamesPlayed: 0,
          multiplayerWins: 0,
          updatedAt: new Date().toISOString(),
        });
        count++;
      } else {
        // Remove legacy guest/unauthenticated junk documents
        await deleteDoc(d.ref);
        count++;
      }
    }

    // Also reset local active session high score if present
    const active = getActivePilotSession();
    if (active) {
      active.highScore = 0;
      active.gamesPlayed = 0;
      active.multiplayerWins = 0;
      saveActivePilotSession(active);
    }

    return { success: true, count };
  } catch (err) {
    console.error('Error resetting leaderboard:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Performs a one-time clean reset of the leaderboard for the fresh start.
 */
export async function ensureInitialCleanResetOnce(): Promise<void> {
  try {
    const key = 'flappy_db_scratch_reset_2026';
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, 'true');
      await resetLeaderboard();
    }
  } catch (e) {
    console.warn('Initial reset check:', e);
  }
}

/**
 * Retrieves or creates a persistent local guest profile.
 * Ensures the user can immediately play single-player with full local stats.
 */
export function getLocalGuestProfile(): UserProfile {
  // If user has an active pilot session, use that
  const active = getActivePilotSession();
  if (active) return active;

  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      if (parsed && parsed.uid && parsed.displayName) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local guest profile:', e);
  }

  const guestUid = 'cadet_' + Math.random().toString(36).substring(2, 10);
  const newGuest: UserProfile = {
    uid: guestUid,
    displayName: 'Cadet Pilot',
    highScore: 0,
    multiplayerWins: 0,
    gamesPlayed: 0,
    isRegisteredPilot: false,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newGuest));
  } catch (e) {
    console.warn('Error saving local guest profile:', e);
  }

  return newGuest;
}

/**
 * Saves local guest profile to localStorage.
 */
export function saveLocalGuestProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving local guest profile:', e);
  }
}

/**
 * Ensures a user profile exists in Firestore and returns it.
 */
export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  const active = getActivePilotSession();
  if (active) return active;

  const userRef = doc(db, 'users', user.uid);
  let existingProfile: UserProfile | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingProfile = snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error reading user profile from Firestore:', err);
  }

  let localGuestHighScore = 0;
  let localGuestGames = 0;
  try {
    const local = getLocalGuestProfile();
    localGuestHighScore = local.highScore || 0;
    localGuestGames = local.gamesPlayed || 0;
  } catch (e) {
    // ignore
  }

  const bestHighScore = Math.max(existingProfile?.highScore || 0, localGuestHighScore);
  const totalGames = Math.max(existingProfile?.gamesPlayed || 0, localGuestGames);

  const mergedProfile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || (user.isAnonymous ? 'Guest Pilot' : 'Cadet Pilot'),
    email: user.email || undefined,
    photoURL: user.photoURL || undefined,
    highScore: bestHighScore,
    multiplayerWins: existingProfile?.multiplayerWins || 0,
    gamesPlayed: totalGames,
    isRegisteredPilot: Boolean(existingProfile?.isRegisteredPilot),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, mergedProfile, { merge: true });
  } catch (err) {
    console.warn('Could not persist user doc to Firestore:', err);
  }

  return mergedProfile;
}

/**
 * Updates high score if new score is greater, and increments games played.
 * Persists locally and syncs to Firestore if user is authenticated.
 */
export async function updateUserScore(uid: string, score: number, currentHighScore: number): Promise<number> {
  const newHighScore = Math.max(score, currentHighScore);

  // Update local storage so guest/pilot progress and callsign are guaranteed safe
  let currentDisplayName = 'Cadet Pilot';
  let currentPhotoURL: string | undefined = undefined;
  const activeSession = getActivePilotSession();

  try {
    const localProfile = activeSession || getLocalGuestProfile();
    localProfile.highScore = Math.max(localProfile.highScore || 0, newHighScore);
    localProfile.gamesPlayed = (localProfile.gamesPlayed || 0) + 1;
    localProfile.updatedAt = new Date().toISOString();
    if (localProfile.displayName && localProfile.displayName !== 'Guest Pilot') {
      currentDisplayName = localProfile.displayName;
    }
    currentPhotoURL = localProfile.photoURL;

    if (activeSession) {
      saveActivePilotSession(localProfile);
    }
    saveLocalGuestProfile(localProfile);
  } catch (e) {
    console.warn('Local score save error:', e);
  }

  // Update Firestore user document
  const targetUid = activeSession?.uid || auth.currentUser?.uid || uid;
  if (targetUid) {
    const userRef = doc(db, 'users', targetUid);
    const finalName = activeSession?.displayName || currentDisplayName;
    const finalPhoto = activeSession?.photoURL || currentPhotoURL;

    try {
      await setDoc(
        userRef,
        {
          uid: targetUid,
          displayName: finalName,
          photoURL: finalPhoto || null,
          highScore: newHighScore,
          gamesPlayed: increment(1),
          isRegisteredPilot: Boolean(activeSession?.isRegisteredPilot),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error updating high score in Firestore:', err);
    }
  }

  return newHighScore;
}

/**
 * Updates a pilot's custom callsign name and avatar photo.
 * Saves to local persistent profile and syncs to Firestore.
 */
export async function updateCustomPilotProfile(
  profile: UserProfile,
  displayName: string,
  photoURL?: string
): Promise<UserProfile> {
  const cleanName = displayName.trim() || profile.displayName || 'Cadet Pilot';
  const updated: UserProfile = {
    ...profile,
    displayName: cleanName,
    photoURL: photoURL !== undefined ? photoURL : profile.photoURL,
    updatedAt: new Date().toISOString(),
  };

  if (profile.isRegisteredPilot) {
    saveActivePilotSession(updated);
  }
  saveLocalGuestProfile(updated);

  // Sync to Firestore under user's uid
  const targetUid = profile.uid || auth.currentUser?.uid;
  if (targetUid) {
    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          uid: targetUid,
          displayName: cleanName,
          photoURL: updated.photoURL || null,
          highScore: updated.highScore || 0,
          multiplayerWins: updated.multiplayerWins || 0,
          gamesPlayed: updated.gamesPlayed || 0,
          isRegisteredPilot: Boolean(updated.isRegisteredPilot),
          updatedAt: updated.updatedAt,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore pilot update error:', e);
    }
  }

  return updated;
}

/**
 * Increments multiplayer race wins for a user.
 */
export async function incrementUserWins(uid: string): Promise<void> {
  const activeSession = getActivePilotSession();
  const local = activeSession || getLocalGuestProfile();
  const currentDisplayName = local.displayName || 'Cadet Pilot';
  const targetUid = activeSession?.uid || auth.currentUser?.uid || uid;

  if (targetUid) {
    const userRef = doc(db, 'users', targetUid);
    try {
      await setDoc(
        userRef,
        {
          uid: targetUid,
          displayName: activeSession?.displayName || currentDisplayName,
          photoURL: activeSession?.photoURL || local.photoURL || undefined,
          multiplayerWins: increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error incrementing user wins in Firestore:', err);
    }
  }

  try {
    local.multiplayerWins = (local.multiplayerWins || 0) + 1;
    if (activeSession) saveActivePilotSession(local);
    saveLocalGuestProfile(local);
  } catch (e) {
    // ignore
  }
}

/**
 * Fetches all registered pilots for the leaderboard and merges the current user's profile.
 */
export async function getLeaderboard(currentUserProfile?: UserProfile | null): Promise<LeaderboardEntry[]> {
  const list: LeaderboardEntry[] = [];
  const seenUids = new Set<string>();

  try {
    const q = query(
      collection(db, 'users'),
      orderBy('highScore', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as UserProfile;
      if (data && (data.displayName || data.username || data.email)) {
        const entryUid = data.uid || d.id;
        seenUids.add(entryUid);
        list.push({
          uid: entryUid,
          displayName: data.displayName || data.username || 'Pilot',
          photoURL: data.photoURL,
          highScore: typeof data.highScore === 'number' ? data.highScore : 0,
          multiplayerWins: typeof data.multiplayerWins === 'number' ? data.multiplayerWins : 0,
        });
      }
    });
  } catch (err) {
    console.warn('Error getting leaderboard from Firestore:', err);
  }

  // Ensure current pilot is always present in the leaderboard
  const activeSession = getActivePilotSession();
  const localProf = currentUserProfile || activeSession || getLocalGuestProfile();
  if (localProf && localProf.displayName) {
    const myUid = localProf.uid || activeSession?.uid || auth.currentUser?.uid;
    const existingIdx = myUid ? list.findIndex((e) => e.uid === myUid) : -1;
    if (existingIdx >= 0) {
      list[existingIdx].displayName = localProf.displayName;
      list[existingIdx].highScore = Math.max(list[existingIdx].highScore, localProf.highScore || 0);
      if (localProf.photoURL) list[existingIdx].photoURL = localProf.photoURL;
    } else if (myUid) {
      list.push({
        uid: myUid,
        displayName: localProf.displayName,
        photoURL: localProf.photoURL,
        highScore: localProf.highScore || 0,
        multiplayerWins: localProf.multiplayerWins || 0,
      });
    }
  }

  // Sort descending by high score
  list.sort((a, b) => b.highScore - a.highScore);
  return list;
}

/**
 * Generates an easy-to-read 6-character room code (e.g. "BIRD48", "WINGS7")
 */
function generateRoomCode(): string {
  const prefixes = ['BIRD', 'FLAP', 'WING', 'RACE', 'SOAR', 'DIVE', 'HERO', 'SKY'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}${num}`;
}

/**
 * Creates an active multiplayer room in Firestore.
 */
export async function createMultiplayerRoom(user: UserProfile): Promise<MultiplayerRoom> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // Allow guest session
    }
  }

  const roomsCol = collection(db, 'rooms');
  const roomDoc = doc(roomsCol);
  const roomId = roomDoc.id;
  const code = generateRoomCode();

  const hostPlayer: PlayerRaceState = {
    uid: user.uid,
    displayName: user.displayName || 'Host Pilot',
    photoURL: user.photoURL || '',
    isReady: true,
    score: 0,
    distance: 0,
    y: 250,
    vy: 0,
    alive: true,
    color: '#F59E0B', // Gold / Amber for Host
    lastUpdate: Date.now(),
  };

  const newRoom: MultiplayerRoom = {
    id: roomId,
    code,
    status: 'waiting',
    host: hostPlayer,
    guest: null,
    pipeSeed: Math.floor(Math.random() * 999999) + 1,
    createdAt: Date.now(),
    winnerUid: null,
  };

  await setDoc(roomDoc, newRoom);
  return newRoom;
}

/**
 * Joins an existing multiplayer room using its 6-character code.
 */
export async function joinMultiplayerRoomByCode(code: string, user: UserProfile): Promise<MultiplayerRoom> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // Allow guest session
    }
  }

  const cleanCode = code.trim().toUpperCase();
  const q = query(
    collection(db, 'rooms'),
    where('code', '==', cleanCode),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error(`Room with code "${cleanCode}" was not found.`);
  }

  const roomDoc = snap.docs[0];
  const room = roomDoc.data() as MultiplayerRoom;

  if (room.host.uid === user.uid) {
    return room; // Host re-entering
  }

  if (room.guest && room.guest.uid !== user.uid) {
    throw new Error('This room is already full (2/2 players).');
  }

  const guestPlayer: PlayerRaceState = {
    uid: user.uid,
    displayName: user.displayName || 'Challenger',
    photoURL: user.photoURL || '',
    isReady: true,
    score: 0,
    distance: 0,
    y: 250,
    vy: 0,
    alive: true,
    color: '#06B6D4', // Cyan / Teal for Guest
    lastUpdate: Date.now(),
  };

  await updateDoc(doc(db, 'rooms', room.id), {
    guest: guestPlayer,
  });

  return { ...room, guest: guestPlayer };
}

/**
 * Subscribes to open rooms that are waiting for a challenger.
 */
export function subscribeToOpenRooms(callback: (rooms: MultiplayerRoom[]) => void): Unsubscribe {
  try {
    const q = query(
      collection(db, 'rooms'),
      where('status', '==', 'waiting'),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      const rooms: MultiplayerRoom[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as MultiplayerRoom;
        if (!data.guest) {
          rooms.push(data);
        }
      });
      // Sort in memory by createdAt descending
      rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(rooms);
    }, (err) => {
      console.warn('Error listening to open rooms:', err);
      callback([]);
    });
  } catch (err) {
    console.warn('Error setting up open rooms subscription:', err);
    callback([]);
    return () => {};
  }
}

/**
 * Subscribes to real-time room updates.
 */
export function subscribeToRoom(roomId: string, callback: (room: MultiplayerRoom | null) => void): Unsubscribe {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback(snap.data() as MultiplayerRoom);
  });
}

/**
 * Updates player position, score, distance, and alive status in the room.
 */
export async function syncPlayerRaceState(
  roomId: string,
  isHost: boolean,
  state: {
    y: number;
    vy: number;
    score: number;
    distance: number;
    alive: boolean;
  }
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const prefix = isHost ? 'host' : 'guest';

  try {
    await updateDoc(roomRef, {
      [`${prefix}.y`]: state.y,
      [`${prefix}.vy`]: state.vy,
      [`${prefix}.score`]: state.score,
      [`${prefix}.distance`]: Math.floor(state.distance),
      [`${prefix}.alive`]: state.alive,
      [`${prefix}.lastUpdate`]: Date.now(),
    });
  } catch (err) {
    console.warn('Error syncing player race state:', err);
  }
}

/**
 * Host triggers the race start countdown.
 */
export async function startMatchCountdown(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    status: 'countdown',
    countdownStart: Date.now(), // timestamp when countdown initiated
    winnerUid: null,
  });
}

/**
 * Sets the room to active racing once countdown completes.
 */
export async function beginRacing(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    status: 'racing',
  });
}

/**
 * Declares the winner of the race.
 */
export async function finishRace(roomId: string, winnerUid: string | 'tie'): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    status: 'finished',
    winnerUid,
  });
}

/**
 * Resets the room for an immediate rematch with a fresh pipe seed!
 */
export async function restartRoomMatch(roomId: string, host: PlayerRaceState, guest?: PlayerRaceState | null): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const newSeed = Math.floor(Math.random() * 999999) + 1;

  const resetHost: PlayerRaceState = {
    ...host,
    score: 0,
    distance: 0,
    y: 250,
    vy: 0,
    alive: true,
    lastUpdate: Date.now(),
  };

  const updatePayload: Record<string, unknown> = {
    pipeSeed: newSeed,
    status: 'countdown',
    countdownStart: Date.now(),
    winnerUid: null,
    host: resetHost,
  };

  if (guest) {
    updatePayload.guest = {
      ...guest,
      score: 0,
      distance: 0,
      y: 250,
      vy: 0,
      alive: true,
      lastUpdate: Date.now(),
    };
  }

  await updateDoc(roomRef, updatePayload);
}

/**
 * Leave/Exit room.
 */
export async function leaveRoom(roomId: string, isHost: boolean): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    if (isHost) {
      // If host leaves, mark finished or remove guest
      await updateDoc(roomRef, {
        status: 'finished',
        'host.alive': false,
      });
    } else {
      // Guest leaves
      await updateDoc(roomRef, {
        guest: null,
        status: 'waiting',
      });
    }
  } catch (err) {
    console.warn('Error leaving room:', err);
  }
}
