export type GameCategory =
  | 'all'
  | 'arcade'
  | 'board'
  | 'puzzle'
  | 'strategy'
  | 'word'
  | 'quick'
  | 'multiplayer';

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'all-levels';

export interface GameItem {
  id: string;
  title: string;
  category: GameCategory;
  description: string;
  icon: string; // Lucide icon name
  badge?: string;
  players: string; // e.g. "1 Player", "1-2 Players", "1-4 Players", "vs AI"
  difficulty: GameDifficulty;
  gradient: string; // Tailwind gradient classes
  accentColor: string; // Tailwind color name e.g. "indigo", "emerald", "amber", "rose", "cyan", "purple"
  instructions: {
    overview: string;
    rules: string[];
    controls: string[];
    tips?: string[];
  };
  tags: string[];
  featured?: boolean;
}

export interface UserStats {
  gamesPlayed: number;
  totalWins: number;
  highScores: Record<string, number>;
  lastPlayed: Record<string, string>; // gameId -> ISO date
  playCounts: Record<string, number>; // gameId -> count
}

export interface AppSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  hapticsEnabled: boolean;
  theme: 'dark' | 'light';
  animationsEnabled: boolean;
}

export type ViewMode =
  | 'home'
  | 'explore'
  | 'favorites'
  | 'trophy'
  | 'settings'
  | 'game-play';
