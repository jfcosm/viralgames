// ==========================================================================
// VIRALGAMES FIREBASE CLOUD FIRESTORE INTEGRATION
// ==========================================================================
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyCnFEmfktVFMi-yJDMxxhl3zJj4yp812vw",
  authDomain: "viralgames-app-2026.firebaseapp.com",
  projectId: "viralgames-app-2026",
  storageBucket: "viralgames-app-2026.firebasestorage.app",
  messagingSenderId: "706719023304",
  appId: "1:706719023304:web:016c68abb20e3bbde765fd",
  measurementId: "G-BS7MZYLT5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Firebase Analytics (if supported in current environment)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.debug("[Firebase] Analytics not supported in this environment:", err);
  });
}

// --------------------------------------------------------------------------
// SETTINGS (Theme, CRT, HUD visibility, Navbar visibility, Custom tags)
// --------------------------------------------------------------------------
export function subscribeSettings(callback) {
  const docRef = doc(db, "settings", "system");
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn("[Firebase] Error in subscribeSettings:", err);
  });
}

export async function saveSystemSettings(settings) {
  try {
    const docRef = doc(db, "settings", "system");
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("[Firebase] Error saving system settings:", err);
  }
}

// --------------------------------------------------------------------------
// CREDITS META (pretitle, title, subtitle)
// --------------------------------------------------------------------------
export function subscribeCreditsMeta(callback) {
  const docRef = doc(db, "settings", "credits_meta");
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn("[Firebase] Error in subscribeCreditsMeta:", err);
  });
}

export async function saveCreditsMetaToDb(creditsMeta) {
  try {
    const docRef = doc(db, "settings", "credits_meta");
    await setDoc(docRef, {
      ...creditsMeta,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("[Firebase] Error saving credits meta:", err);
  }
}

// --------------------------------------------------------------------------
// GAMES CATALOG
// --------------------------------------------------------------------------
export function subscribeGames(callback) {
  const colRef = collection(db, "games");
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const games = [];
    snapshot.forEach(docSnap => {
      games.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort preserving standard order or id
    callback(games);
  }, (err) => {
    console.warn("[Firebase] Error in subscribeGames:", err);
  });
}

export async function saveGameToDb(game) {
  try {
    if (!game.id) throw new Error("Game must have an id");
    const docRef = doc(db, "games", game.id);
    await setDoc(docRef, {
      ...game,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("[Firebase] Error saving game:", err);
  }
}

export async function saveAllGamesToDb(games) {
  try {
    const batch = writeBatch(db);
    games.forEach((game, index) => {
      if (!game.id) return;
      const docRef = doc(db, "games", game.id);
      batch.set(docRef, {
        ...game,
        catalogOrder: index,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error("[Firebase] Error saving games batch:", err);
  }
}

export async function deleteGameFromDb(gameId) {
  try {
    if (!gameId) return;
    const docRef = doc(db, "games", gameId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("[Firebase] Error deleting game:", err);
  }
}

// --------------------------------------------------------------------------
// CREDITS STAFF
// --------------------------------------------------------------------------
export function subscribeCredits(callback) {
  const colRef = collection(db, "credits");
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const credits = [];
    snapshot.forEach(docSnap => {
      credits.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort by order if available
    credits.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    callback(credits);
  }, (err) => {
    console.warn("[Firebase] Error in subscribeCredits:", err);
  });
}

export async function saveCreditToDb(credit) {
  try {
    if (!credit.id) throw new Error("Credit must have an id");
    const docRef = doc(db, "credits", credit.id);
    await setDoc(docRef, {
      ...credit,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("[Firebase] Error saving credit:", err);
  }
}

export async function saveAllCreditsToDb(credits) {
  try {
    const batch = writeBatch(db);
    credits.forEach((credit, index) => {
      const id = credit.id || `credit-${index}`;
      const docRef = doc(db, "credits", id);
      batch.set(docRef, {
        ...credit,
        id,
        order: index,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error("[Firebase] Error saving credits batch:", err);
  }
}

export async function deleteCreditFromDb(creditId) {
  try {
    if (!creditId) return;
    const docRef = doc(db, "credits", creditId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("[Firebase] Error deleting credit:", err);
  }
}

// --------------------------------------------------------------------------
// ARCADE LEADERBOARDS (Global per game)
// --------------------------------------------------------------------------
export function subscribeLeaderboard(gameId, callback) {
  const docRef = doc(db, "leaderboards", gameId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists() && snap.data().entries) {
      callback(snap.data().entries);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn(`[Firebase] Error in subscribeLeaderboard (${gameId}):`, err);
  });
}

export async function saveLeaderboardToDb(gameId, entries) {
  try {
    const docRef = doc(db, "leaderboards", gameId);
    await setDoc(docRef, {
      gameId,
      entries,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error(`[Firebase] Error saving leaderboard (${gameId}):`, err);
  }
}
