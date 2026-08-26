import React, { useState, useEffect, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Delete, CornerDownLeft, Sparkles } from 'lucide-react';

interface WordGuessGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const WORD_LIST = [
  'REACT', 'GAMES', 'LIGHT', 'BRAIN', 'CHESS', 'SNAKE', 'OCEAN', 'SMART',
  'QUEST', 'POWER', 'PLANT', 'MAGIC', 'WATER', 'SPACE', 'EARTH', 'SOLAR',
  'MUSIC', 'DANCE', 'HEART', 'DREAM', 'CLOUD', 'STORM', 'TRAIN', 'PIXEL',
  'LOGIC', 'FROST', 'FLAME', 'SWORD', 'TIGER', 'EAGLE', 'ZEBRA', 'APPLE',
  'BERRY', 'MANGO', 'LEMON', 'BREAD', 'PIZZA', 'CANDY', 'SUGAR', 'HONEY',
  'RIVER', 'BEACH', 'TOWER', 'HOUSE', 'CHAIR', 'TABLE', 'CLOCK', 'PHONE',
  'ROBOT', 'LASER', 'ALIEN', 'GHOST', 'NINJA', 'KNIGHT', 'CROWN', 'STAGE'
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

export const WordGuessGame: React.FC<WordGuessGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [targetWord, setTargetWord] = useState<string>('REACT');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<number | null>(null);

  const initGame = useCallback(() => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setIsWon(false);
    setIsGameOverModalOpen(false);
    setShakeRow(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== 5) {
      sound.playError();
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 500);
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      sound.playWin();
      setIsWon(true);
      setIsGameOverModalOpen(true);
      const score = (7 - nextGuesses.length) * 150;
      onGameOver(score, true);
    } else if (nextGuesses.length >= 6) {
      sound.playGameOver();
      setIsGameOverModalOpen(true);
      onGameOver(20, false);
    } else {
      sound.playMove();
    }
  }, [currentGuess, guesses, targetWord, onGameOver]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isGameOverModalOpen || isWon) return;

      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE' || key === 'DELETE') {
        sound.playTap();
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        sound.playTap();
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, isGameOverModalOpen, isWon, submitGuess]
  );

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k === 'ENTER') handleKeyPress('ENTER');
      else if (k === 'BACKSPACE') handleKeyPress('BACKSPACE');
      else if (/^[A-Z]$/.test(k)) handleKeyPress(k);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getLetterStatus = (letter: string, index: number, word: string) => {
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const getKeyColor = (key: string) => {
    let status = 'default';
    for (const g of guesses) {
      for (let i = 0; i < 5; i++) {
        if (g[i] === key) {
          if (targetWord[i] === key) return 'bg-emerald-600 text-white';
          if (targetWord.includes(key)) status = 'present';
          else if (status === 'default') status = 'absent';
        }
      }
    }
    if (status === 'present') return 'bg-amber-500 text-white';
    if (status === 'absent') return 'bg-slate-800 text-slate-500 border-slate-800';
    return 'bg-slate-700 hover:bg-slate-600 text-white';
  };

  return (
    <GameContainer
      game={game}
      highScore={highScore}
      onBack={onBack}
      onRestart={initGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-md select-none">
        {/* Word Grid */}
        <div className="grid grid-rows-6 gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          {Array.from({ length: 6 }).map((_, rowIdx) => {
            const isCurrentRow = rowIdx === guesses.length;
            const guess = guesses[rowIdx] || (isCurrentRow ? currentGuess : '');
            const isShaking = shakeRow === rowIdx;

            return (
              <div
                key={rowIdx}
                className={`grid grid-cols-5 gap-1.5 ${isShaking ? 'animate-shake' : ''}`}
              >
                {Array.from({ length: 5 }).map((_, colIdx) => {
                  const letter = guess[colIdx] || '';
                  const isSubmitted = rowIdx < guesses.length;
                  let bgClass = 'bg-slate-950/60 border-slate-800 text-white';

                  if (isSubmitted) {
                    const status = getLetterStatus(letter, colIdx, guess);
                    if (status === 'correct') {
                      bgClass = 'bg-emerald-600 border-emerald-500 text-white shadow-sm';
                    } else if (status === 'present') {
                      bgClass = 'bg-amber-500 border-amber-400 text-white shadow-sm';
                    } else {
                      bgClass = 'bg-slate-800 border-slate-700 text-slate-400';
                    }
                  } else if (letter) {
                    bgClass = 'bg-slate-800 border-slate-600 text-white scale-105';
                  }

                  return (
                    <div
                      key={colIdx}
                      className={`w-11 h-11 sm:w-12 sm:h-12 border-2 rounded-xl flex items-center justify-center font-black text-xl font-mono transition-all duration-200 ${bgClass}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* On-screen keyboard */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center w-full">
              {row.map((k) => {
                const isAction = k === 'ENTER' || k === 'BACKSPACE';
                return (
                  <button
                    key={k}
                    onClick={() => handleKeyPress(k)}
                    className={`h-11 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                      isAction ? 'px-2.5 sm:px-3 bg-slate-700 text-white font-mono text-xs' : 'flex-1 max-w-[34px]'
                    } ${getKeyColor(k)}`}
                  >
                    {k === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : k === 'ENTER' ? <CornerDownLeft className="w-4 h-4" /> : k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={isWon}
        title={isWon ? 'Word Deciphered!' : 'Game Over!'}
        message={isWon ? `Superb vocabulary skill! You solved it in ${guesses.length} tries.` : `The mystery word was: ${targetWord}`}
        customStats={[
          { label: 'Mystery Word', value: targetWord },
          { label: 'Attempts', value: `${guesses.length}/6` },
        ]}
        onPlayAgain={initGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
