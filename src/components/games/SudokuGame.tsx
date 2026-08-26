import React, { useState, useEffect, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Pencil, Eraser, Lightbulb, AlertTriangle } from 'lucide-react';

interface SudokuGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// Preset verified Sudoku boards (0 represents empty)
const PUZZLES = {
  easy: {
    initial: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  medium: {
    initial: [
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0],
    ],
    solution: [
      [5, 8, 1, 6, 7, 2, 4, 3, 9],
      [7, 9, 2, 8, 4, 3, 6, 5, 1],
      [3, 6, 4, 5, 9, 1, 7, 8, 2],
      [4, 3, 8, 9, 5, 7, 2, 1, 6],
      [2, 5, 6, 1, 8, 4, 9, 7, 3],
      [1, 7, 9, 3, 2, 6, 8, 4, 5],
      [8, 4, 5, 2, 1, 9, 3, 6, 7],
      [9, 1, 3, 7, 6, 8, 5, 2, 4],
      [6, 2, 7, 4, 3, 5, 1, 9, 8],
    ],
  },
  hard: {
    initial: [
      [0, 0, 0, 0, 0, 0, 0, 1, 2],
      [0, 0, 0, 0, 3, 5, 0, 0, 0],
      [0, 0, 0, 6, 0, 0, 0, 7, 0],
      [7, 0, 0, 0, 0, 0, 3, 0, 0],
      [0, 0, 0, 4, 0, 0, 8, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 2, 0, 0, 0, 0],
      [0, 8, 0, 0, 0, 0, 0, 4, 0],
      [0, 5, 0, 0, 0, 0, 6, 0, 0],
    ],
    solution: [
      [6, 7, 3, 8, 9, 4, 5, 1, 2],
      [9, 1, 2, 7, 3, 5, 4, 8, 6],
      [8, 4, 5, 6, 1, 2, 9, 7, 3],
      [7, 9, 8, 2, 6, 1, 3, 5, 4],
      [5, 2, 6, 4, 7, 3, 8, 9, 1],
      [1, 3, 4, 5, 8, 9, 2, 6, 7],
      [4, 6, 9, 1, 2, 8, 7, 3, 5],
      [2, 8, 7, 3, 5, 6, 1, 4, 9],
      [3, 5, 1, 9, 4, 7, 6, 2, 8],
    ],
  },
};

export const SudokuGame: React.FC<SudokuGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [board, setBoard] = useState<number[][]>([]);
  const [initialFixed, setInitialFixed] = useState<boolean[][]>([]);
  const [notes, setNotes] = useState<number[][][]>(() =>
    Array(9)
      .fill(0)
      .map(() =>
        Array(9)
          .fill(0)
          .map(() => [])
      )
  );
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const initGame = useCallback((lvl = difficulty) => {
    const puzzle = PUZZLES[lvl];
    const initial = puzzle.initial.map((row) => [...row]);
    const fixed = puzzle.initial.map((row) => row.map((val) => val !== 0));

    setBoard(initial);
    setInitialFixed(fixed);
    setNotes(
      Array(9)
        .fill(0)
        .map(() =>
          Array(9)
            .fill(0)
            .map(() => [])
        )
    );
    setSelectedCell(null);
    setMistakes(0);
    setIsGameOverModalOpen(false);
  }, [difficulty]);

  useEffect(() => {
    initGame(difficulty);
  }, [initGame, difficulty]);

  const handleCellClick = (r: number, c: number) => {
    sound.playTap();
    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (initialFixed[r][c]) return;

    if (isNotesMode) {
      sound.playPop();
      setNotes((prev) => {
        const next = prev.map((row) => row.map((cell) => [...cell]));
        const cellNotes = next[r][c];
        if (cellNotes.includes(num)) {
          next[r][c] = cellNotes.filter((n) => n !== num);
        } else {
          next[r][c] = [...cellNotes, num].sort();
        }
        return next;
      });
      return;
    }

    const sol = PUZZLES[difficulty].solution;
    if (sol[r][c] === num) {
      sound.playCorrect();
      const nextBoard = board.map((row) => [...row]);
      nextBoard[r][c] = num;
      setBoard(nextBoard);

      // Check if board complete
      const isComplete = nextBoard.every((row, rowIdx) =>
        row.every((val, colIdx) => val === sol[rowIdx][colIdx])
      );

      if (isComplete) {
        sound.playWin();
        setIsGameOverModalOpen(true);
        onGameOver(300 - mistakes * 50, true);
      }
    } else {
      sound.playError();
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= 3) {
        sound.playGameOver();
        setIsGameOverModalOpen(true);
        onGameOver(30, false);
      }
    }
  };

  const eraseCell = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (initialFixed[r][c]) return;

    sound.playTap();
    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = 0;
    setBoard(nextBoard);
  };

  const provideHint = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (initialFixed[r][c] || board[r][c] !== 0) return;

    sound.playWin();
    const sol = PUZZLES[difficulty].solution;
    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = sol[r][c];
    setBoard(nextBoard);
  };

  return (
    <GameContainer
      game={game}
      highScore={highScore}
      onBack={onBack}
      onRestart={() => initGame(difficulty)}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {(['easy', 'medium', 'hard'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setDifficulty(lvl);
                initGame(lvl);
              }}
              className={`px-2 py-0.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                difficulty === lvl ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-md select-none">
        {/* Status */}
        <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          <div className="flex items-center gap-1 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Mistakes: {mistakes}/3</span>
          </div>
          <span className="text-slate-400 capitalize">Difficulty: {difficulty}</span>
        </div>

        {/* 9x9 Sudoku Board */}
        <div
          className="grid grid-cols-9 border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl bg-slate-900"
          style={{ width: 'min(92vw, 380px)', height: 'min(92vw, 380px)' }}
        >
          {board.flatMap((row, r) =>
            row.map((val, c) => {
              const isFixed = initialFixed[r]?.[c];
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isSameRowCol = selectedCell && (selectedCell.r === r || selectedCell.c === c);
              const cellNotes = notes[r]?.[c] || [];

              // 3x3 block borders
              const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-600' : 'border-r border-r-slate-800/60';
              const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-600' : 'border-b border-b-slate-800/60';

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center font-bold text-base sm:text-lg transition-colors cursor-pointer ${borderRight} ${borderBottom} ${
                    isSelected
                      ? 'bg-sky-600/60 ring-2 ring-sky-400 text-white'
                      : isSameRowCol
                      ? 'bg-slate-800/60 text-slate-200'
                      : 'bg-slate-900/90 text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {val !== 0 ? (
                    <span className={isFixed ? 'text-white font-black' : 'text-sky-300'}>{val}</span>
                  ) : cellNotes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5 text-[8px] text-slate-400 font-mono leading-none">
                      {cellNotes.map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Action Tool Buttons */}
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            onClick={() => setIsNotesMode(!isNotesMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isNotesMode
                ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" /> Notes {isNotesMode ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={eraseCell}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" /> Erase
          </button>

          <button
            onClick={provideHint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" /> Hint
          </button>
        </div>

        {/* 1-9 Number Pad */}
        <div className="grid grid-cols-9 gap-1 sm:gap-1.5 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="h-11 sm:h-12 rounded-xl bg-slate-800 hover:bg-sky-600 hover:text-white border border-slate-700 font-black text-lg sm:text-xl font-mono text-slate-100 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={mistakes < 3}
        title={mistakes < 3 ? 'Sudoku Solved!' : 'Too Many Mistakes!'}
        message={mistakes < 3 ? 'Brilliant deductive logic! Board fully completed.' : 'You reached 3 mistakes.'}
        onPlayAgain={() => initGame(difficulty)}
        onHome={onBack}
      />
    </GameContainer>
  );
};
