import {
  addPendingEvent,
  getPendingCount,
  getPendingEvents,
  removePendingEvent,
  type PendingSyncEvent,
} from './localDb';
import { supabase } from './supabase';

const ANON_ID_KEY = 'gameverse_anonymous_id';
const FIRST_SEEN_KEY = 'gameverse_first_seen';
const SESSION_KEY = 'gameverse_current_session_id';

export type SyncState = {
  online: boolean;
  pending: number;
  syncing: boolean;
  configured: boolean;
};

type Listener = (state: SyncState) => void;
const listeners = new Set<Listener>();
let state: SyncState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pending: 0,
  syncing: false,
  configured: Boolean(supabase),
};

function publish() {
  listeners.forEach(listener => listener(state));
}

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  publish();
}

export function subscribeToSyncState(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getAnonymousUserId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

function getFirstSeen(): string {
  let value = localStorage.getItem(FIRST_SEEN_KEY);
  if (!value) {
    value = new Date().toISOString();
    localStorage.setItem(FIRST_SEEN_KEY, value);
  }
  return value;
}

function createEvent<T extends PendingSyncEvent['type']>(
  type: T,
  payload: Extract<PendingSyncEvent, { type: T }>['payload'],
): PendingSyncEvent {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  } as PendingSyncEvent;
}

async function queue(event: PendingSyncEvent) {
  await addPendingEvent(event);
  setState({ pending: await getPendingCount() });
  if (navigator.onLine) void syncPendingEvents();
}

export async function startAnonymousAppSession(): Promise<string> {
  const anonymousUserId = getAnonymousUserId();
  const firstSeen = getFirstSeen();
  const now = new Date().toISOString();
  const existingSessionId = sessionStorage.getItem(SESSION_KEY);
  const sessionId = existingSessionId || crypto.randomUUID();

  await queue(createEvent('user_upsert', {
    anonymousUserId,
    firstSeen,
    lastSeen: now,
  }));

  if (existingSessionId) {
    await queue(createEvent('app_session_activity', {
      sessionId,
      lastActiveAt: now,
    }));
    return sessionId;
  }

  sessionStorage.setItem(SESSION_KEY, sessionId);
  await queue(createEvent('app_session_start', {
    sessionId,
    anonymousUserId,
    startedAt: now,
    lastActiveAt: now,
  }));

  return sessionId;
}

export async function touchAppSession() {
  const sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  await queue(createEvent('app_session_activity', {
    sessionId,
    lastActiveAt: new Date().toISOString(),
  }));
}

export async function startGameSession(gameName: string): Promise<string> {
  const anonymousUserId = getAnonymousUserId();
  const gameSessionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  await queue(createEvent('game_start', {
    gameSessionId,
    anonymousUserId,
    gameName,
    startedAt,
    playedOffline: !navigator.onLine,
  }));

  return gameSessionId;
}

export async function endGameSession(gameSessionId: string, startedAtMs: number) {
  const endedAt = new Date().toISOString();
  await queue(createEvent('game_end', {
    gameSessionId,
    endedAt,
    duration: Math.max(0, Math.round((Date.now() - startedAtMs) / 1000)),
    playedOffline: !navigator.onLine,
  }));
}

async function syncEvent(event: PendingSyncEvent) {
  if (!supabase) throw new Error('Cloud tracking is not configured');

  switch (event.type) {
    case 'user_upsert': {
      const { error } = await supabase
        .from('anonymous_users')
        .upsert({
          anonymous_user_id: event.payload.anonymousUserId,
          first_seen: event.payload.firstSeen,
          last_seen: event.payload.lastSeen,
        }, { onConflict: 'anonymous_user_id' });
      if (error) throw error;
      break;
    }
    case 'app_session_start': {
      const { error } = await supabase
        .from('app_sessions')
        .upsert({
          id: event.payload.sessionId,
          anonymous_user_id: event.payload.anonymousUserId,
          started_at: event.payload.startedAt,
          last_active_at: event.payload.lastActiveAt,
        });
      if (error) throw error;
      break;
    }
    case 'app_session_activity': {
      const { error } = await supabase
        .from('app_sessions')
        .update({ last_active_at: event.payload.lastActiveAt })
        .eq('id', event.payload.sessionId);
      if (error) throw error;
      break;
    }
    case 'game_start': {
      const { error } = await supabase
        .from('game_sessions')
        .upsert({
          id: event.payload.gameSessionId,
          anonymous_user_id: event.payload.anonymousUserId,
          game_name: event.payload.gameName,
          started_at: event.payload.startedAt,
          played_offline: event.payload.playedOffline,
        });
      if (error) throw error;
      break;
    }
    case 'game_end': {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          ended_at: event.payload.endedAt,
          duration: event.payload.duration,
          played_offline: event.payload.playedOffline,
          synced_at: new Date().toISOString(),
        })
        .eq('id', event.payload.gameSessionId);
      if (error) throw error;
      break;
    }
  }
}

export async function syncPendingEvents() {
  if (!navigator.onLine || !supabase || state.syncing) {
    setState({ online: navigator.onLine, pending: await getPendingCount() });
    return;
  }

  setState({ syncing: true, online: true });
  try {
    const events = await getPendingEvents();
    for (const event of events) {
      await syncEvent(event);
      await removePendingEvent(event.id);
    }
  } catch (error) {
    console.warn('Anonymous usage sync will retry later.', error);
  } finally {
    setState({
      syncing: false,
      online: navigator.onLine,
      pending: await getPendingCount(),
    });
  }
}

export function initializeAnonymousTracking() {
  const sync = () => void syncPendingEvents();
  const offline = () => setState({ online: false });
  window.addEventListener('online', sync);
  window.addEventListener('offline', offline);
  void startAnonymousAppSession();
  void syncPendingEvents();

  return () => {
    window.removeEventListener('online', sync);
    window.removeEventListener('offline', offline);
  };
}
