import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Timer, Zap, Flame } from 'lucide-react';

interface WhackAMoleGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type MoleType = 'regular' | 'golden' | 'bomb' | null;

export const WhackAMoleGame: React.FC<WhackAMoleGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [holes, setHoles] = useState<MoleType[]>(Array(9).fill(null));
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hitHole, setHitHole] = useState<{ index: number; type: MoleType } | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(1);
    setTimeLeft(30);
    setHoles(Array(9).fill(null));
    setIsPlaying(true);
    setIsGameOverModalOpen(false);
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      setIsGameOverModalOpen(true);
      onGameOver(score, score >= 150);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, onGameOver, score]);

  // Mole pop loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setHoles(() => {
        const next = Array(9).fill(null);
        // Randomly pop 1 to 2 moles
        const holeCount = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < holeCount; i++) {
          const randomIdx = Math.floor(Math.random() * 9);
          const randType = Math.random();
          let moleType: MoleType = 'regular';
          if (randType < 0.18) moleType = 'golden';
          else if (randType < 0.35) moleType = 'bomb';

          next[randomIdx] = moleType;
        }
        return next;
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const whack = (index: number) => {
    if (!isPlaying) return;
    const mole = holes[index];
    if (!mole) {
      setCombo(1);
      return;
    }

    setHitHole({ index, type: mole });
    setTimeout(() => setHitHole(null), 250);

    // Clear hole immediately
    setHoles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    if (mole === 'regular') {
      sound.playHit();
      setScore((s) => s + 10 * combo);
      setCombo((c) => Math.min(5, c + 1));
    } else if (mole === 'golden') {
      sound.playWin();
      setScore((s) => s + 35 * combo);
      setCombo((c) => Math.min(5, c + 1));
    } else if (mole === 'bomb') {
      sound.playError();
      setScore((s) => Math.max(0, s - 25));
      setCombo(1);
    }
  };

  return (
    <GameContainer
      game={game}
      score={score}
      highScore={highScore}
      onBack={onBack}
      onRestart={startGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-md select-none">
        {/* Status bar */}
        <div className="grid grid-cols-3 gap-2 w-full p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-mono font-bold text-white">{timeLeft}s</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-mono font-bold text-emerald-300">{score} pts</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-300">{combo}x Combo</span>
          </div>
        </div>

        {/* 3x3 Mole Garden */}
        <div className="mole-garden-shell">
          <div className="mole-garden-sign"><span>WHACK!</span><small>30 SECOND RUSH</small></div>
          <div className="mole-garden" aria-label="Whack-a-Mole board">
            {holes.map((mole, idx) => {
              const isHit = hitHole?.index === idx;
              return (
                <button
                  key={idx}
                  onClick={() => whack(idx)}
                  className={`mole-hole ${mole ? 'has-mole' : ''} ${isHit ? 'is-hit' : ''} ${mole ? `mole-${mole}` : ''}`}
                  aria-label={mole ? `Whack ${mole === 'golden' ? 'golden mole' : mole === 'bomb' ? 'bomb' : 'mole'}` : 'Empty mole hole'}
                >
                  <span className="mole-grass grass-left" />
                  <span className="mole-grass grass-right" />
                  <span className="mole-hole-rim" />
                  {mole && (
                    <span className="mole-character" aria-hidden="true">
                      {mole === 'bomb' ? (
                        <span className="mole-bomb-face"><span className="bomb-fuse">✦</span><span>×</span></span>
                      ) : (
                        <>
                          <span className="mole-ear ear-left" />
                          <span className="mole-ear ear-right" />
                          <span className="mole-head">
                            {mole === 'golden' && <span className="mole-crown">★</span>}
                            <span className="mole-eye eye-left" />
                            <span className="mole-eye eye-right" />
                            <span className="mole-nose" />
                            <span className="mole-mouth" />
                          </span>
                        </>
                      )}
                    </span>
                  )}
                  {isHit && <span className="whack-burst">POW!</span>}
                </button>
              );
            })}
          </div>
          <div className="mole-legend"><span className="legend-dot regular" /> +10 <span className="legend-dot golden" /> +35 <span className="legend-dot bomb" /> −25</div>
        </div>

        {!isPlaying && timeLeft === 30 && (
          <button
            onClick={startGame}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/30 uppercase tracking-wider text-sm cursor-pointer"
          >
            Start 30-Second Round
          </button>
        )}
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={score >= 150}
        score={score}
        highScore={highScore}
        title={score >= 150 ? 'Mole Buster Pro!' : 'Time Is Up!'}
        message={`You accumulated a total score of ${score} points!`}
        customStats={[
          { label: 'Max Combo', value: `${combo}x` },
          { label: 'Time', value: '30s' },
        ]}
        onPlayAgain={startGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
