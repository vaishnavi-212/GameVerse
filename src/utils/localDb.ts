export type PendingSyncEvent =
  | {
      id: string;
      type: 'user_upsert';
      payload: { anonymousUserId: string; firstSeen: string; lastSeen: string };
      createdAt: string;
    }
  | {
      id: string;
      type: 'app_session_start';
      payload: { sessionId: string; anonymousUserId: string; startedAt: string; lastActiveAt: string };
      createdAt: string;
    }
  | {
      id: string;
      type: 'app_session_activity';
      payload: { sessionId: string; lastActiveAt: string };
      createdAt: string;
    }
  | {
      id: string;
      type: 'game_start';
      payload: { gameSessionId: string; anonymousUserId: string; gameName: string; startedAt: string; playedOffline: boolean };
      createdAt: string;
    }
  | {
      id: string;
      type: 'game_end';
      payload: { gameSessionId: string; endedAt: string; duration: number; playedOffline: boolean };
      createdAt: string;
    };

const DB_NAME = 'gameverse_local_data';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sync_events';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingEvent(event: PendingSyncEvent): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(event);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB may be unavailable in private/restricted browsing.
  }
}

export async function getPendingEvents(): Promise<PendingSyncEvent[]> {
  try {
    const db = await openDb();
    const events = await new Promise<PendingSyncEvent[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as PendingSyncEvent[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function removePendingEvent(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
}

export async function getPendingCount(): Promise<number> {
  return (await getPendingEvents()).length;
}
