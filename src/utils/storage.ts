import { AppSettings, UserStats } from '../types';

const STATS_KEY = 'gv_user_stats';
const SETTINGS_KEY = 'gv_settings';
const FAVORITES_KEY = 'gv_favorites';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  soundVolume: 0.7,
  hapticsEnabled: true,
  theme: 'dark',
  animationsEnabled: true,
};

export const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  totalWins: 0,
  highScores: {},
  lastPlayed: {},
  playCounts: {},
};

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function getStoredStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordGamePlay(gameId: string, isWin: boolean = false, score?: number): UserStats {
  const current = getStoredStats();
  const nextPlayCounts = { ...current.playCounts, [gameId]: (current.playCounts[gameId] || 0) + 1 };
  const nextLastPlayed = { ...current.lastPlayed, [gameId]: new Date().toISOString() };
  
  let nextHighScores = { ...current.highScores };
  if (score !== undefined) {
    const prevBest = current.highScores[gameId] || 0;
    if (score > prevBest) {
      nextHighScores[gameId] = score;
    }
  }

  const updated: UserStats = {
    gamesPlayed: current.gamesPlayed + 1,
    totalWins: current.totalWins + (isWin ? 1 : 0),
    highScores: nextHighScores,
    lastPlayed: nextLastPlayed,
    playCounts: nextPlayCounts,
  };

  saveStats(updated);
  return updated;
}

export function getFavoriteGameIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return ['snake', 'game-2048', 'tictactoe', 'word-guess'];
    return JSON.parse(raw);
  } catch {
    return ['snake', 'game-2048', 'tictactoe', 'word-guess'];
  }
}

export function toggleFavoriteGameId(gameId: string): string[] {
  const current = getFavoriteGameIds();
  let updated: string[];
  if (current.includes(gameId)) {
    updated = current.filter((id) => id !== gameId);
  } else {
    updated = [...current, gameId];
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}


export function recordGameResult(gameId: string, isWin: boolean = false, score?: number): UserStats {
  const current = getStoredStats();

  let nextHighScores = { ...current.highScores };
  if (score !== undefined) {
    const prevBest = current.highScores[gameId] || 0;
    if (score > prevBest) {
      nextHighScores[gameId] = score;
    }
  }

  const updated: UserStats = {
    ...current,
    totalWins: current.totalWins + (isWin ? 1 : 0),
    highScores: nextHighScores,
    lastPlayed: { ...current.lastPlayed, [gameId]: new Date().toISOString() },
  };

  saveStats(updated);
  return updated;
}

export function resetAllData(): void {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(FAVORITES_KEY);
  } catch {}
}

export const storage = {
  getStats: getStoredStats,
  saveStats: saveStats,
  getSettings: getStoredSettings,
  saveSettings: saveSettings,
  getFavorites: getFavoriteGameIds,
  toggleFavorite: toggleFavoriteGameId,
  recordGamePlay: (gameId: string) => recordGamePlay(gameId, false),
  recordScore: (gameId: string, score: number, isWin: boolean = false) =>
    recordGameResult(gameId, isWin, score),
  resetStats: () => {
    localStorage.removeItem(STATS_KEY);
    return DEFAULT_STATS;
  },
  resetAll: resetAllData,
};
