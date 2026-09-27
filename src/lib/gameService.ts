import {
  doc,
  getDoc,
  setDoc,
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

/**
 * Retrieves or creates a persistent local guest profile.
 * Ensures the user can immediately play single-player with full local stats
 * even if anonymous auth is restricted on the project.
 */
export function getLocalGuestProfile(): UserProfile {
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

  const guestUid = 'guest_' + Math.random().toString(36).substring(2, 10);
  const newGuest: UserProfile = {
    uid: guestUid,
    displayName: 'Cadet Pilot',
    highScore: 0,
    multiplayerWins: 0,
    gamesPlayed: 0,
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

  // Preserve any local offline high score achieved prior to logging in
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

  // Update local storage so guest progress is guaranteed safe
  try {
    const localProfile = getLocalGuestProfile();
    localProfile.highScore = Math.max(localProfile.highScore || 0, newHighScore);
    localProfile.gamesPlayed = (localProfile.gamesPlayed || 0) + 1;
    localProfile.updatedAt = new Date().toISOString();
    saveLocalGuestProfile(localProfile);
  } catch (e) {
    console.warn('Local score save error:', e);
  }

  // If user is authenticated in Firebase, update Firestore
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const userRef = doc(db, 'users', uid);
    try {
      await setDoc(
        userRef,
        {
          uid,
          displayName: auth.currentUser.displayName || (auth.currentUser.isAnonymous ? 'Guest Pilot' : 'Cadet Pilot'),
          photoURL: auth.currentUser.photoURL || undefined,
          email: auth.currentUser.email || undefined,
          highScore: newHighScore,
          gamesPlayed: increment(1),
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
 * Increments multiplayer race wins for a user.
 */
export async function incrementUserWins(uid: string): Promise<void> {
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const userRef = doc(db, 'users', uid);
    try {
      await setDoc(
        userRef,
        {
          uid,
          displayName: auth.currentUser.displayName || (auth.currentUser.isAnonymous ? 'Guest Pilot' : 'Cadet Pilot'),
          photoURL: auth.currentUser.photoURL || undefined,
          email: auth.currentUser.email || undefined,
          multiplayerWins: increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error incrementing user wins in Firestore:', err);
    }
  } else {
    try {
      const local = getLocalGuestProfile();
      local.multiplayerWins = (local.multiplayerWins || 0) + 1;
      saveLocalGuestProfile(local);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Fetches top players for the leaderboard.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('highScore', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    const list: LeaderboardEntry[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserProfile;
      if (data && (data.displayName || data.email)) {
        list.push({
          uid: data.uid || d.id,
          displayName: data.displayName || (data.email ? data.email.split('@')[0] : 'Pilot'),
          photoURL: data.photoURL,
          highScore: typeof data.highScore === 'number' ? data.highScore : 0,
          multiplayerWins: typeof data.multiplayerWins === 'number' ? data.multiplayerWins : 0,
        });
      }
    });
    return list;
  } catch (err) {
    console.warn('Error getting leaderboard:', err);
    return [];
  }
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
