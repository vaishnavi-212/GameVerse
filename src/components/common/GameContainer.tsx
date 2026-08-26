import React, { useState } from 'react';
import { GameItem } from '../../types';
import { ChevronLeft, HelpCircle, RotateCcw, Volume2, VolumeX, Star, Pause, Play } from 'lucide-react';
import { InstructionsModal } from './InstructionsModal';
import { IconHelper } from './IconHelper';
import { sound } from '../../utils/audio';

interface GameContainerProps {
  game: GameItem;
  score?: number;
  highScore?: number;
  onBack: () => void;
  onRestart?: () => void;
  onPauseToggle?: () => void;
  isPaused?: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  children: React.ReactNode;
  extraHeaderControls?: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  game,
  score,
  highScore,
  onBack,
  onRestart,
  onPauseToggle,
  isPaused,
  soundEnabled,
  onToggleSound,
  children,
  extraHeaderControls,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="flex flex-col min-h-screen gv-game-shell font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Game Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 gv-game-header select-none">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-xl gv-game-control transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Hub</span>
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${game.gradient} text-white shadow-md flex items-center justify-center`}>
              <IconHelper name={game.icon} className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold gv-game-title leading-tight font-heading flex items-center gap-2">
                {game.title}
                {game.badge && (
                  <span className="hidden sm:inline-block text-[9px] uppercase font-bold py-0.5 px-2 rounded-full bg-white/5 gv-accent-text border border-white/10">
                    {game.badge}
                  </span>
                )}
              </h1>
              <p className="text-[11px] gv-game-subtitle hidden sm:block">{game.players}</p>
            </div>
          </div>
        </div>

        {/* Center: Scores (if available) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {score !== undefined && (
            <div className="py-1.5 px-3 sm:px-4 rounded-2xl gv-score-box text-center">
              <span className="text-[9px] text-white/40 block font-bold leading-none mb-0.5 tracking-wider uppercase font-mono">
                SCORE
              </span>
              <span className="text-sm sm:text-base font-black gv-score-value font-mono leading-none">{score}</span>
            </div>
          )}
          {highScore !== undefined && (
            <div className="hidden xs:block py-1.5 px-3 sm:px-4 rounded-2xl gv-score-box gv-best-box text-center">
              <span className="text-[9px] gv-accent-text flex items-center justify-center gap-0.5 font-bold leading-none mb-0.5 tracking-wider uppercase font-mono">
                <Star className="w-2.5 h-2.5 fill-amber-400 gv-accent-text" /> BEST
              </span>
              <span className="text-sm sm:text-base font-black gv-accent-text font-mono leading-none">{highScore}</span>
            </div>
          )}
        </div>

        {/* Right: Game Action Controls */}
        <div className="flex items-center gap-2">
          {extraHeaderControls}

          {onPauseToggle && (
            <button
              onClick={() => {
                sound.playClick();
                onPauseToggle();
              }}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-colors flex items-center justify-center cursor-pointer ${
                isPaused
                  ? 'gv-pause-active'
                  : 'gv-game-control'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          {onRestart && (
            <button
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
              title="Restart Game"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gv-game-control transition-colors flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gv-game-control transition-colors flex items-center justify-center cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 gv-accent-text" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowInstructions(true);
            }}
            title="How to Play"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gv-accent-button transition-colors flex items-center justify-center cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Game Screen Canvas / Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 md:p-6 lg:p-7 w-full max-w-[1500px] mx-auto">
        {children}
      </main>

      {/* Instructions Modal */}
      <InstructionsModal
        game={game}
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
};
