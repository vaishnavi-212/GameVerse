import React, { useState, useEffect, useCallback } from 'react';
import { GameItem, UserStats, AppSettings } from './types';
import { GAMES_LIST } from './data/gamesList';
import { storage } from './utils/storage';
import { sound } from './utils/audio';
import { Home } from './components/Home';
import { GameInstructions } from './components/common/GameInstructions';

const GAME_THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  snake:{primary:'#4CEB73',secondary:'#7B4DFF',accent:'#FFE55C'}, 'game-2048':{primary:'#B8F04A',secondary:'#FF8A3D',accent:'#FFE45C'},
  tictactoe:{primary:'#FF4F8B',secondary:'#67D8FF',accent:'#FFE45C'}, 'connect-four':{primary:'#3E73FF',secondary:'#FF5D62',accent:'#FFCE48'},
  chess:{primary:'#8B65FF',secondary:'#57D5FF',accent:'#FFE05A'}, checkers:{primary:'#FF695B',secondary:'#65D7B2',accent:'#FFCC4D'},
  'memory-match':{primary:'#63CFFF',secondary:'#B69BFF',accent:'#FF8C7A'}, 'whack-a-mole':{primary:'#FFB92E',secondary:'#FF6B63',accent:'#63D8B0'},
  'word-guess':{primary:'#55D17B',secondary:'#7D7AFF',accent:'#FFE169'}, hangman:{primary:'#FF7C62',secondary:'#75D6FF',accent:'#FFE269'},
  sudoku:{primary:'#56D6C0',secondary:'#7A86FF',accent:'#FFD95D'}, 'rock-paper-scissors':{primary:'#FF5F76',secondary:'#5DD6FF',accent:'#FFD95D'},
  'number-guess':{primary:'#FF72B5',secondary:'#A98AFF',accent:'#FFE05A'}, ludo:{primary:'#FF655D',secondary:'#54D3FF',accent:'#FFDB55'},
  'snakes-and-ladders':{primary:'#6CD26D',secondary:'#FF7C68',accent:'#FFD95B'}, 'trivia-quiz':{primary:'#9A79FF',secondary:'#61D8FF',accent:'#FFCF58'},
  'typing-test':{primary:'#5F8FFF',secondary:'#FF7E70',accent:'#FFE05B'}, 'reaction-time':{primary:'#FF9F43',secondary:'#58D5FF',accent:'#FF5D70'},
  'bubble-shooter':{primary:'#FF70A5',secondary:'#6FCFFF',accent:'#FFE05B'}, 'target-hitter':{primary:'#FF785E',secondary:'#6D82FF',accent:'#FFD957'}
};

// Game Components
import { SnakeGame } from './components/games/SnakeGame';
import { Game2048 } from './components/games/Game2048';
import { TicTacToeGame } from './components/games/TicTacToeGame';
import { ConnectFourGame } from './components/games/ConnectFourGame';
import { ChessGame } from './components/games/ChessGame';
import { CheckersGame } from './components/games/CheckersGame';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { WhackAMoleGame } from './components/games/WhackAMoleGame';
import { WordGuessGame } from './components/games/WordGuessGame';
import { HangmanGame } from './components/games/HangmanGame';
import { SudokuGame } from './components/games/SudokuGame';
import { RockPaperScissorsGame } from './components/games/RockPaperScissorsGame';
import { NumberGuessGame } from './components/games/NumberGuessGame';
import { LudoGame } from './components/games/LudoGame';
import { SnakesAndLaddersGame } from './components/games/SnakesAndLaddersGame';
import { TriviaQuizGame } from './components/games/TriviaQuizGame';
import { TypingTestGame } from './components/games/TypingTestGame';
import { ReactionTimeGame } from './components/games/ReactionTimeGame';
import { BubbleShooterGame } from './components/games/BubbleShooterGame';
import { ArcheryTargetGame } from './components/games/ArcheryTargetGame';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);
  const [stats, setStats] = useState<UserStats>(() => storage.getStats());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [favorites, setFavorites] = useState<string[]>(() => storage.getFavorites());

  // Register service worker for offline PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('GameVerse Service Worker registered'))
          .catch((err) => console.log('SW registration error:', err));
      });
    }
  }, []);

  // Synchronize audio engine with user settings
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const handleSelectGame = (game: GameItem) => {
    storage.recordGamePlay(game.id);
    setStats(storage.getStats());
    setActiveGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    sound.playTap();
    setActiveGame(null);
  };

  const handleToggleFavorite = (gameId: string) => {
    const updated = storage.toggleFavorite(gameId);
    setFavorites(updated);
  };

  const handleToggleSound = () => {
    const newEnabled = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: newEnabled };
    storage.saveSettings(updated);
    setSettings(updated);
    sound.setEnabled(newEnabled);
    if (newEnabled) {
      sound.playPop();
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    storage.saveSettings(updated);
    setSettings(updated);
  };

  const handleResetStats = () => {
    const fresh = storage.resetStats();
    setStats(fresh);
    sound.playPop();
  };

  const handleGameOver = useCallback(
    (score: number, isWin: boolean) => {
      if (!activeGame) return;
      storage.recordScore(activeGame.id, score, isWin);
      setStats(storage.getStats());
    },
    [activeGame]
  );

  // Render individual active game
  const renderGameContent = () => {
    if (!activeGame) return null;

    const highScore = stats.highScores[activeGame.id] || 0;
    const commonProps = {
      game: activeGame,
      highScore,
      onGameOver: handleGameOver,
      onBack: handleBackToHome,
      soundEnabled: settings.soundEnabled,
      onToggleSound: handleToggleSound,
    };

    switch (activeGame.id) {
      case 'snake':
        return <SnakeGame {...commonProps} />;
      case 'game-2048':
        return <Game2048 {...commonProps} />;
      case 'tictactoe':
        return <TicTacToeGame {...commonProps} />;
      case 'connect-four':
        return <ConnectFourGame {...commonProps} />;
      case 'chess':
        return <ChessGame {...commonProps} />;
      case 'checkers':
        return <CheckersGame {...commonProps} />;
      case 'memory-match':
        return <MemoryMatchGame {...commonProps} />;
      case 'whack-a-mole':
        return <WhackAMoleGame {...commonProps} />;
      case 'word-guess':
        return <WordGuessGame {...commonProps} />;
      case 'hangman':
        return <HangmanGame {...commonProps} />;
      case 'sudoku':
        return <SudokuGame {...commonProps} />;
      case 'rock-paper-scissors':
        return <RockPaperScissorsGame {...commonProps} />;
      case 'number-guess':
        return <NumberGuessGame {...commonProps} />;
      case 'ludo':
        return <LudoGame {...commonProps} />;
      case 'snakes-and-ladders':
        return <SnakesAndLaddersGame {...commonProps} />;
      case 'trivia-quiz':
        return <TriviaQuizGame {...commonProps} />;
      case 'typing-test':
        return <TypingTestGame {...commonProps} />;
      case 'reaction-time':
        return <ReactionTimeGame {...commonProps} />;
      case 'bubble-shooter':
        return <BubbleShooterGame {...commonProps} />;
      case 'target-hitter':
        return <ArcheryTargetGame {...commonProps} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h2 className="text-xl font-bold text-white">Game Not Found</h2>
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold"
            >
              Return Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className={activeGame ? "gameverse-game-root" : "gameverse-root"} style={activeGame ? ({ '--game-primary': (GAME_THEME_COLORS[activeGame.id] || {primary:'#FF4F8B'}).primary, '--game-secondary': (GAME_THEME_COLORS[activeGame.id] || {secondary:'#67D8FF'}).secondary, '--game-accent': (GAME_THEME_COLORS[activeGame.id] || {accent:'#FFE45C'}).accent } as React.CSSProperties) : undefined}>
      {activeGame ? (
        <>
          {renderGameContent()}
          <GameInstructions gameId={activeGame.id} gameName={activeGame.name} />
        </>
      ) : (
        <Home
          games={GAMES_LIST}
          stats={stats}
          settings={settings}
          favorites={favorites}
          onSelectGame={handleSelectGame}
          onToggleFavorite={handleToggleFavorite}
          onToggleSound={handleToggleSound}
          onUpdateSettings={handleUpdateSettings}
          onResetStats={handleResetStats}
        />
      )}
    </div>
  );
}
