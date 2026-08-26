import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Star, Frown, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  isWin: boolean;
  score?: number;
  highScore?: number;
  title?: string;
  message?: string;
  customStats?: { label: string; value: string | number }[];
  onPlayAgain: () => void;
  onHome: () => void;
  transparentBackdrop?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isWin,
  score,
  highScore,
  title,
  message,
  customStats,
  onPlayAgain,
  onHome,
  transparentBackdrop = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isWin) {
        sound.playWin();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
          });
        } catch {}
      } else {
        sound.playGameOver();
      }
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  const isNewHighScore = score !== undefined && highScore !== undefined && score > 0 && score >= highScore;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${transparentBackdrop ? 'bg-transparent pointer-events-none' : 'gv-modal-backdrop backdrop-blur-md'}`}>
      <div className={`relative w-full max-w-sm overflow-hidden gv-gameover-panel rounded-3xl shadow-2xl p-6 text-center ${transparentBackdrop ? 'pointer-events-auto border-2 border-white/30' : ''}`}>
        {/* Glowing top badge */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${
              isWin
                ? 'gv-win-badge'
                : 'gv-loss-badge'
            }`}
          >
            {isWin ? <Trophy className="w-10 h-10 animate-bounce" /> : <Frown className="w-10 h-10" />}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold gv-gameover-title tracking-tight font-heading">
          {title || (isWin ? 'Victory!' : 'Game Over')}
        </h3>
        <p className="mt-1 text-xs gv-gameover-copy leading-relaxed">
          {message || (isWin ? 'Great match! You achieved victory.' : 'Nice try! Give it another round.')}
        </p>

        {/* New High Score Banner */}
        {isNewHighScore && (
          <div className="mt-4 py-1.5 px-3 rounded-full gv-new-best text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> NEW HIGH SCORE!
          </div>
        )}

        {/* Scores & Stats Grid */}
        <div className="my-5 p-4 rounded-2xl gv-gameover-stats grid grid-cols-2 gap-3 text-center">
          {score !== undefined && (
            <div className="p-3 rounded-xl gv-gameover-stat">
              <span className="text-[10px] font-bold gv-muted uppercase tracking-widest block font-mono">Score</span>
              <span className="text-2xl font-black gv-gameover-number font-mono">{score}</span>
            </div>
          )}
          {highScore !== undefined && (
            <div className="p-3 rounded-xl gv-gameover-stat">
              <span className="text-[10px] font-bold gv-accent-text uppercase tracking-widest flex items-center justify-center gap-1 font-mono">
                <Star className="w-3 h-3 fill-amber-400 gv-accent-text" /> Best
              </span>
              <span className="text-2xl font-black gv-accent-text font-mono">{highScore}</span>
            </div>
          )}
          {customStats &&
            customStats.map((st, i) => (
              <div key={i} className="p-3 rounded-xl gv-gameover-stat col-span-1">
                <span className="text-[10px] font-bold gv-muted uppercase tracking-widest block font-mono">
                  {st.label}
                </span>
                <span className="text-base font-bold gv-accent-text font-mono">{st.value}</span>
              </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full py-3 px-4 gv-gameover-primary font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onHome();
            }}
            className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" /> Games Library
          </button>
        </div>
      </div>
    </div>
  );
};
