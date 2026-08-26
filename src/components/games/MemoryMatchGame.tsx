import React, { useState, useEffect, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Timer, Footprints, Star } from 'lucide-react';

interface MemoryMatchGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const THEMES = {
  emojis: ['🚀', '🍕', '🎮', '🌟', '🦄', '🎸', '⚽', '💎', '🔥', '🏆', '🎯', '🥑'],
  animals: ['🐶', '🐱', '🐼', '🦁', '🐸', '🐵', '🦊', '🐨', '🐯', '🐰', '🐻', '🐙'],
  space: ['🛸', '🪐', '🌌', '⭐', '👾', '☄️', '🌙', '🛰️', '🌞', '🌍', '👽', '🔭'],
};

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEMES>('emojis');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);

  const pairCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;

  const initGame = useCallback(() => {
    const symbols = THEMES[selectedTheme].slice(0, pairCount);
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, idx) => ({
        id: idx,
        symbol,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setTime(0);
    setIsTimerRunning(false);
    setIsGameOverModalOpen(false);
  }, [pairCount, selectedTheme]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !isGameOverModalOpen) {
      interval = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isGameOverModalOpen]);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) {
      return;
    }

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    sound.playTap();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.symbol === secondCard.symbol) {
        sound.playCorrect();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c))
          );
          setFlippedIndices([]);

          // Check if all matched
          const remaining = newCards.filter((c, i) => i !== firstIdx && i !== secondIdx && !c.isMatched);
          if (remaining.length === 0) {
            setIsTimerRunning(false);
            const calculatedScore = Math.max(10, Math.floor(1000 - moves * 15 - time * 5));
            setFinalScore(calculatedScore);
            setIsGameOverModalOpen(true);
            onGameOver(calculatedScore, true);
          }
        }, 300);
      } else {
        sound.playError();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c))
          );
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <GameContainer
      game={game}
      score={moves}
      highScore={highScore}
      onBack={onBack}
      onRestart={initGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {(['easy', 'medium', 'hard'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setDifficulty(lvl);
              }}
              className={`px-2 py-0.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                difficulty === lvl ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-lg select-none">
        {/* Status Bar */}
        <div className="grid grid-cols-3 gap-3 w-full p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Footprints className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-slate-300 font-semibold">{moves} Moves</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300 font-mono font-semibold">{formatTime(time)}</span>
          </div>
          <div className="flex items-center justify-center gap-1 p-1.5 rounded-xl bg-slate-950/40">
            {(['emojis', 'animals', 'space'] as const).map((th) => (
              <button
                key={th}
                onClick={() => setSelectedTheme(th)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold capitalize ${
                  selectedTheme === th ? 'bg-pink-600 text-white' : 'text-slate-400'
                }`}
              >
                {th[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="memory-board-shell">
          <div
            className={`memory-card-grid memory-${difficulty}`}
            aria-label="Memory card board"
          >
            {cards.map((card, idx) => {
              const revealed = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`memory-card ${revealed ? 'is-revealed' : ''} ${card.isMatched ? 'is-matched' : ''}`}
                  aria-label={revealed ? `Card ${idx + 1}: ${card.symbol}` : `Reveal card ${idx + 1}`}
                >
                  <span className="memory-card-inner">
                    <span className="memory-card-face memory-card-back" aria-hidden={revealed}>
                      <span className="memory-back-glow" />
                      <span className="memory-back-orb orb-one" />
                      <span className="memory-back-orb orb-two" />
                      <span className="memory-back-icon">✦</span>
                      <span className="memory-back-label">MEMORY</span>
                    </span>
                    <span className="memory-card-face memory-card-front" aria-hidden={!revealed}>
                      <span className="memory-card-spark spark-a">✦</span>
                      <span className="memory-card-spark spark-b">✦</span>
                      <span className="memory-symbol">{card.symbol}</span>
                      <span className="memory-card-shine" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={true}
        score={finalScore}
        highScore={highScore}
        title="Grid Cleared!"
        message={`You matched all pairs in ${moves} moves and ${formatTime(time)}!`}
        customStats={[
          { label: 'Total Moves', value: moves },
          { label: 'Time Elapsed', value: formatTime(time) },
        ]}
        onPlayAgain={initGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
