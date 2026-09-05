/**
 * audioStore — durable local storage for uploaded audio bytes.
 *
 * Uploaded music previously only lived as a session-scoped `blob:` URL stored in a
 * localStorage/Supabase metadata row. Blob URLs die on reload/login, which is exactly why
 * "the song plays in the session but won't play after you log back in."
 *
 * This module persists the real audio bytes in IndexedDB (no ~5MB localStorage cap, survives
 * reload/logout/login, works offline). On app startup, tracks are re-hydrated by turning the
 * stored bytes back into live object URLs.
 */

const DB_NAME = "lifeos_audio_store";
const DB_VERSION = 1;
const STORE_NAME = "audio";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/** Persist a track's audio bytes under its stable track id. */
export async function saveAudioBytes(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load a track's stored audio bytes, or undefined when missing/unreachable. */
export async function loadAudioBytes(id: string): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result?.blob);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return undefined;
  }
}

/** Remove a track's audio bytes (used when a track is deleted). */
export async function deleteAudioBytes(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Best effort — nothing else to do if the store is unavailable.
  }
}

/**
 * Build a live object URL from stored bytes, or return null if there is nothing
 * stored (or the store is unreachable). Object URLs must be revoked when no longer
 * needed to avoid leaking memory.
 */
export async function materializeAudioUrl(id: string): Promise<string | null> {
  const blob = await loadAudioBytes(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Given a persisted track, return a playable URL. If it already has a durable
 * remote URL (http/https), keep it. Otherwise reconstitute a fresh object URL
 * from IndexedDB for this session.
 */
export async function resolvePlayableUrl(
  track: { id: string; audioFileUrl?: string },
): Promise<string | undefined> {
  if (track.audioFileUrl && track.audioFileUrl.startsWith("http")) {
    return track.audioFileUrl;
  }
  const url = await materializeAudioUrl(track.id);
  return url ?? undefined;
}