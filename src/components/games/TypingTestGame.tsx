import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Timer, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

interface TypingTestProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const SAMPLE_TEXTS = [
  'The quick brown fox jumps over the lazy dog while the autumn wind whispers through the towering pines.',
  'Quantum computing promises to revolutionize cryptography, materials discovery, and complex optimization algorithms.',
  'Exploring deep space requires advanced propulsion systems, resilient habitats, and international scientific cooperation.',
  'Video games combine storytelling, interactive systems design, visual artistry, and atmospheric acoustic compositions.',
  'Artificial intelligence enables machines to recognize intricate visual patterns, translate languages, and generate music.',
];

export const TypingTestGame: React.FC<TypingTestProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [duration, setDuration] = useState<30 | 60>(30);
  const [targetText, setTargetText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initGame = useCallback((dur = duration) => {
    const text = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setTargetText(text);
    setUserInput('');
    setTimeLeft(dur);
    setIsStarted(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setMistakes(0);
    setIsGameOverModalOpen(false);
  }, [duration]);

  useEffect(() => {
    initGame(duration);
  }, [initGame, duration]);

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isFinished && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isStarted && !isFinished) {
      finishTest();
    }
    return () => clearInterval(interval);
  }, [isStarted, isFinished, timeLeft]);

  const finishTest = useCallback(() => {
    setIsFinished(true);
    setIsGameOverModalOpen(true);
    const finalWpm = calculateWpm();
    onGameOver(finalWpm, finalWpm >= 50);
  }, [onGameOver]);

  const calculateWpm = () => {
    const timeElapsed = duration - timeLeft;
    if (timeElapsed === 0) return 0;
    const wordsTyped = userInput.trim().split(/\s+/).length;
    return Math.round((wordsTyped / timeElapsed) * 60);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isStarted) {
      setIsStarted(true);
    }

    sound.playTap();
    setUserInput(val);

    // Calculate mistakes & accuracy
    let errCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== targetText[i]) {
        errCount++;
      }
    }
    setMistakes(errCount);
    const acc = val.length > 0 ? Math.max(0, Math.round(((val.length - errCount) / val.length) * 100)) : 100;
    setAccuracy(acc);

    // Update real-time WPM
    const currentWpm = calculateWpm();
    setWpm(currentWpm);

    // If typed full text
    if (val.length >= targetText.length) {
      finishTest();
    }
  };

  return (
    <GameContainer
      game={game}
      score={wpm}
      highScore={highScore}
      onBack={onBack}
      onRestart={() => initGame(duration)}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {[30, 60].map((dur) => (
            <button
              key={dur}
              onClick={() => {
                setDuration(dur as 30 | 60);
                initGame(dur as 30 | 60);
              }}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                duration === dur ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {dur}s Test
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-xl select-none">
        {/* Status Metrics Bar */}
        <div className="grid grid-cols-4 gap-2 w-full p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">WPM</span>
            <span className="text-xl font-mono font-black text-cyan-300">{wpm}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</span>
            <span className="text-xl font-mono font-black text-emerald-300">{accuracy}%</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Time</span>
            <span className="text-xl font-mono font-black text-slate-950">{timeLeft}s</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Mistakes</span>
            <span className="text-xl font-mono font-black text-rose-400">{mistakes}</span>
          </div>
        </div>

        {/* Text Display Canvas */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="w-full p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl font-mono text-lg sm:text-xl leading-relaxed cursor-text shadow-2xl tracking-wide min-h-[140px]"
        >
          {targetText.split('').map((char, idx) => {
            const typedChar = userInput[idx];
            let charClass = 'text-slate-500';
            if (typedChar !== undefined) {
              charClass = typedChar === char ? 'text-emerald-400 font-bold' : 'text-rose-400 bg-rose-950/50 underline';
            }
            const isCursor = idx === userInput.length;

            return (
              <span key={idx} className={`relative ${charClass} ${isCursor ? 'border-b-2 border-cyan-400 animate-pulse' : ''}`}>
                {char}
              </span>
            );
          })}
        </div>

        {/* Hidden Input field */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          disabled={isFinished}
          placeholder="Click here, then start typing — your text will appear above."
          className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner text-center"
          autoFocus
        />
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={wpm >= 50}
        score={wpm}
        highScore={highScore}
        title={wpm >= 60 ? 'Keyboard Master!' : 'Typing Run Finished!'}
        message={`You maintained ${wpm} WPM with an accuracy of ${accuracy}%.`}
        customStats={[
          { label: 'Speed', value: `${wpm} WPM` },
          { label: 'Accuracy', value: `${accuracy}%` },
          { label: 'Mistakes', value: mistakes },
        ]}
        onPlayAgain={() => initGame(duration)}
        onHome={onBack}
      />
    </GameContainer>
  );
};
