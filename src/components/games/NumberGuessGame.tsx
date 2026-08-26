import React, { useState, useEffect, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { CornerDownLeft, Delete, KeyRound, TrendingUp, TrendingDown } from 'lucide-react';

interface NumberGuessProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type Mode = 'bulls-and-cows' | 'higher-lower';

interface BullsCowsAttempt {
  guess: string;
  bulls: number;
  cows: number;
}

interface HigherLowerAttempt {
  guess: number;
  result: 'HIGH' | 'LOW' | 'CORRECT';
}

export const NumberGuessGame: React.FC<NumberGuessProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [mode, setMode] = useState<Mode>('bulls-and-cows');
  const [currentInput, setCurrentInput] = useState<string>('');

  // Bulls & Cows State
  const [secretCode, setSecretCode] = useState<string>('1234');
  const [bcHistory, setBcHistory] = useState<BullsCowsAttempt[]>([]);

  // Higher Lower State
  const [secretNumber, setSecretNumber] = useState<number>(50);
  const [hlHistory, setHlHistory] = useState<HigherLowerAttempt[]>([]);
  const [rangeMax, setRangeMax] = useState<number>(100);

  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const initGame = useCallback(() => {
    setCurrentInput('');
    setIsWon(false);
    setIsGameOverModalOpen(false);

    if (mode === 'bulls-and-cows') {
      // 4 distinct digits
      const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      digits.sort(() => Math.random() - 0.5);
      const code = digits.slice(0, 4).join('');
      setSecretCode(code);
      setBcHistory([]);
    } else {
      const rand = Math.floor(Math.random() * rangeMax) + 1;
      setSecretNumber(rand);
      setHlHistory([]);
    }
  }, [mode, rangeMax]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleDigit = (d: string) => {
    sound.playTap();
    if (mode === 'bulls-and-cows') {
      if (currentInput.length < 4 && !currentInput.includes(d)) {
        setCurrentInput((prev) => prev + d);
      }
    } else {
      if (currentInput.length < 4) {
        setCurrentInput((prev) => prev + d);
      }
    }
  };

  const handleDelete = () => {
    sound.playTap();
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (mode === 'bulls-and-cows') {
      if (currentInput.length !== 4) return;

      let bulls = 0;
      let cows = 0;
      for (let i = 0; i < 4; i++) {
        if (currentInput[i] === secretCode[i]) {
          bulls++;
        } else if (secretCode.includes(currentInput[i])) {
          cows++;
        }
      }

      const nextHistory = [{ guess: currentInput, bulls, cows }, ...bcHistory];
      setBcHistory(nextHistory);
      setCurrentInput('');

      if (bulls === 4) {
        sound.playWin();
        setIsWon(true);
        setIsGameOverModalOpen(true);
        const score = Math.max(50, 500 - nextHistory.length * 40);
        onGameOver(score, true);
      } else if (nextHistory.length >= 10) {
        sound.playGameOver();
        setIsGameOverModalOpen(true);
        onGameOver(30, false);
      } else {
        sound.playMove();
      }
    } else {
      const num = parseInt(currentInput, 10);
      if (isNaN(num)) return;

      let res: 'HIGH' | 'LOW' | 'CORRECT';
      if (num === secretNumber) res = 'CORRECT';
      else if (num > secretNumber) res = 'HIGH';
      else res = 'LOW';

      const nextHistory = [{ guess: num, result: res }, ...hlHistory];
      setHlHistory(nextHistory);
      setCurrentInput('');

      if (res === 'CORRECT') {
        sound.playWin();
        setIsWon(true);
        setIsGameOverModalOpen(true);
        const score = Math.max(50, 400 - nextHistory.length * 35);
        onGameOver(score, true);
      } else if (nextHistory.length >= 8) {
        sound.playGameOver();
        setIsGameOverModalOpen(true);
        onGameOver(20, false);
      } else {
        sound.playMove();
      }
    }
  };

  return (
    <GameContainer
      game={game}
      highScore={highScore}
      onBack={onBack}
      onRestart={initGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setMode('bulls-and-cows')}
            className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
              mode === 'bulls-and-cows' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bulls & Cows
          </button>
          <button
            onClick={() => setMode('higher-lower')}
            className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
              mode === 'higher-lower' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Higher/Lower
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row items-center gap-6 w-full max-w-2xl justify-center select-none">
        {/* Input & Keypad Panel */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {/* Display screen */}
          <div className="w-full p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center shadow-inner">
            <span className="text-[11px] font-bold text-slate-400 uppercase mb-1">
              {mode === 'bulls-and-cows' ? 'Enter 4 Distinct Digits' : `Guess number (1 to ${rangeMax})`}
            </span>
            <div className="h-12 flex items-center justify-center font-mono text-3xl font-black tracking-widest text-teal-300">
              {currentInput || <span className="text-slate-700">_ _ _ _</span>}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-12 rounded-xl bg-slate-800 hover:bg-teal-600 hover:text-white border border-slate-700 font-bold text-xl text-white flex items-center justify-center active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                {d}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-rose-400 border border-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-800 hover:bg-teal-600 hover:text-white border border-slate-700 font-bold text-xl text-white flex items-center justify-center active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <CornerDownLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Attempts Log Feed */}
        <div className="w-full lg:w-72 p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-2 max-h-[360px]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            Attempts Log ({mode === 'bulls-and-cows' ? `${bcHistory.length}/10` : `${hlHistory.length}/8`})
          </span>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {mode === 'bulls-and-cows' ? (
              bcHistory.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No guesses yet.</span>
              ) : (
                bcHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <span className="font-mono font-black text-white text-sm">{item.guess}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                        🐂 {item.bulls} Bulls
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                        🐄 {item.cows} Cows
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : hlHistory.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No guesses yet.</span>
            ) : (
              hlHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <span className="font-mono font-black text-white text-sm">{item.guess}</span>
                  {item.result === 'CORRECT' ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                      🎉 Match!
                    </span>
                  ) : item.result === 'HIGH' ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Aim Lower
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Aim Higher
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={isWon}
        title={isWon ? 'Code Cracked!' : 'Attempts Exhausted!'}
        message={isWon ? 'Phenomenal deduction!' : `The secret was: ${mode === 'bulls-and-cows' ? secretCode : secretNumber}`}
        customStats={[
          { label: 'Secret Code', value: mode === 'bulls-and-cows' ? secretCode : secretNumber },
          { label: 'Attempts Used', value: mode === 'bulls-and-cows' ? bcHistory.length : hlHistory.length },
        ]}
        onPlayAgain={initGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
