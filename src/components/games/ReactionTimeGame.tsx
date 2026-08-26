import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Zap, Timer, Flame, Award } from 'lucide-react';

interface ReactionGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type Phase = 'idle' | 'waiting' | 'ready' | 'early' | 'round_result';

export const ReactionTimeGame: React.FC<ReactionGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [roundTimes, setRoundTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentMs, setCurrentMs] = useState<number | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startNextRound = useCallback(() => {
    setPhase('waiting');
    setCurrentMs(null);

    // Random delay between 1.5s and 4s
    const delay = Math.floor(Math.random() * 2500) + 1500;
    timeoutRef.current = setTimeout(() => {
      sound.playPop();
      setStartTime(Date.now());
      setPhase('ready');
    }, delay);
  }, []);

  const resetGame = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRoundTimes([]);
    setCurrentMs(null);
    setPhase('idle');
    setIsGameOverModalOpen(false);
  }, []);

  const handleBoxClick = () => {
    if (phase === 'idle') {
      startNextRound();
    } else if (phase === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      sound.playError();
      setPhase('early');
    } else if (phase === 'ready') {
      const elapsed = Date.now() - startTime;
      sound.playWin();
      setCurrentMs(elapsed);
      const nextTimes = [...roundTimes, elapsed];
      setRoundTimes(nextTimes);

      if (nextTimes.length >= 5) {
        setPhase('round_result');
        const avg = Math.round(nextTimes.reduce((a, b) => a + b, 0) / 5);
        setIsGameOverModalOpen(true);
        // Inverse score: faster = higher points (e.g. 500 - avg)
        const score = Math.max(10, 600 - avg);
        onGameOver(score, avg < 250);
      } else {
        setPhase('round_result');
      }
    } else if (phase === 'early' || phase === 'round_result') {
      startNextRound();
    }
  };

  const avgReaction =
    roundTimes.length > 0 ? Math.round(roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length) : 0;

  return (
    <GameContainer
      game={game}
      score={avgReaction > 0 ? avgReaction : 0}
      highScore={highScore}
      onBack={onBack}
      onRestart={resetGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-lg select-none">
        {/* Status Tracker */}
        <div className="grid grid-cols-3 gap-2 w-full p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-xs font-bold text-slate-400">Round: {Math.min(5, roundTimes.length + 1)}/5</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-mono font-bold text-white">
              {currentMs ? `${currentMs} ms` : '--'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-300">
              Avg: {avgReaction > 0 ? `${avgReaction} ms` : '--'}
            </span>
          </div>
        </div>

        {/* Big Interactive Click Surface */}
        <button
          onClick={handleBoxClick}
          className={`reaction-click-surface w-full h-72 sm:h-80 rounded-3xl border-4 flex flex-col items-center justify-center p-6 text-center shadow-2xl transition-colors cursor-pointer active:scale-98 ${
            phase === 'idle'
              ? 'bg-slate-900 border-indigo-500 hover:border-indigo-300 text-white'
              : phase === 'waiting'
              ? 'reaction-wait-surface animate-pulse'
              : phase === 'ready'
              ? 'reaction-ready-surface animate-pulse'
              : phase === 'early'
              ? 'bg-sky-900/80 border-sky-500 text-white'
              : 'bg-slate-900 border-amber-500/60 text-white'
          }`}
        >
          {phase === 'idle' && (
            <>
              <Zap className="w-12 h-12 text-indigo-400 mb-3 animate-bounce" />
              <h3 className="text-2xl font-black mb-1">Click to Start</h3>
              <p className="text-xs text-slate-300 max-w-xs font-semibold">
                Wait for the screen to become <span className="rounded bg-emerald-400 px-1.5 py-0.5 font-black text-slate-950">BRIGHT GREEN</span>, then click instantly.
              </p>
            </>
          )}

          {phase === 'waiting' && (
            <>
              <Timer className="w-12 h-12 text-rose-300 mb-3 animate-spin" />
              <h3 className="text-3xl font-black">WAIT — DON'T CLICK</h3>
              <span className="text-xs text-white mt-2 font-bold">The target has not turned green yet.</span>
            </>
          )}

          {phase === 'ready' && (
            <>
              <div className="w-20 h-20 rounded-full bg-white/25 border-4 border-white flex items-center justify-center mb-3 animate-bounce"><Flame className="w-12 h-12 text-white" /></div>
              <h3 className="text-4xl sm:text-5xl font-black tracking-tight">CLICK NOW!</h3>
              <p className="mt-2 rounded-full bg-white px-4 py-1.5 text-xs font-black text-emerald-700">GO! GO! GO!</p>
            </>
          )}

          {phase === 'early' && (
            <>
              <span className="text-4xl mb-2">⚠️</span>
              <h3 className="text-2xl font-black text-sky-300">Too Early!</h3>
              <p className="text-xs text-slate-300 mt-1">You clicked before it turned green. Click to retry.</p>
            </>
          )}

          {phase === 'round_result' && (
            <>
              <span className="text-5xl font-black font-mono text-slate-950 mb-2">{currentMs} ms</span>
              <p className="text-sm font-bold text-slate-200">
                {roundTimes.length < 5 ? 'Click to trigger next round' : 'Test finished!'}
              </p>
            </>
          )}
        </button>

        {/* History rounds pills */}
        <div className="flex gap-2 w-full justify-center">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 py-1.5 rounded-xl border text-center font-mono text-xs font-bold ${
                roundTimes[idx]
                  ? 'bg-slate-900 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-600'
              }`}
            >
              {roundTimes[idx] ? `${roundTimes[idx]}ms` : `#${idx + 1}`}
            </div>
          ))}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={avgReaction <= 260}
        score={Math.max(10, 600 - avgReaction)}
        highScore={highScore}
        title={avgReaction <= 200 ? 'Superhuman Reflexes!' : 'Test Complete!'}
        message={`Your average reaction speed across 5 rounds is ${avgReaction} ms.`}
        customStats={[
          { label: 'Average Speed', value: `${avgReaction} ms` },
          { label: 'Best Round', value: `${Math.min(...roundTimes)} ms` },
        ]}
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
