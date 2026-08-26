import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Undo2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Game2048Props {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type Board = number[][];

export const Game2048: React.FC<Game2048Props> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [history, setHistory] = useState<{ board: Board; score: number } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const spawnRandomTile = useCallback((grid: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return grid;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = grid.map((row) => [...row]);
    newGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const resetGame = useCallback(() => {
    let newGrid: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    newGrid = spawnRandomTile(newGrid);
    newGrid = spawnRandomTile(newGrid);
    setBoard(newGrid);
    setScore(0);
    setHistory(null);
    setIsWon(false);
    setIsGameOverModalOpen(false);
  }, [spawnRandomTile]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const checkGameOver = (grid: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) return false;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      }
    }
    return true;
  };

  const slideRowLeft = (row: number[]) => {
    const nonZero = row.filter((val) => val !== 0);
    const newRow: number[] = [];
    let addedScore = 0;
    let i = 0;

    while (i < nonZero.length) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        newRow.push(mergedVal);
        addedScore += mergedVal;
        i += 2;
      } else {
        newRow.push(nonZero[i]);
        i++;
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }

    return { row: newRow, score: addedScore };
  };

  const move = useCallback(
    (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
      if (isGameOverModalOpen) return;

      let newGrid = board.map((row) => [...row]);
      let totalAddedScore = 0;
      let changed = false;

      if (direction === 'LEFT') {
        for (let r = 0; r < 4; r++) {
          const { row, score: add } = slideRowLeft(newGrid[r]);
          totalAddedScore += add;
          if (row.some((val, idx) => val !== newGrid[r][idx])) changed = true;
          newGrid[r] = row;
        }
      } else if (direction === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
          const reversed = [...newGrid[r]].reverse();
          const { row, score: add } = slideRowLeft(reversed);
          const finalRow = row.reverse();
          totalAddedScore += add;
          if (finalRow.some((val, idx) => val !== newGrid[r][idx])) changed = true;
          newGrid[r] = finalRow;
        }
      } else if (direction === 'UP') {
        for (let c = 0; c < 4; c++) {
          const column = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
          const { row, score: add } = slideRowLeft(column);
          totalAddedScore += add;
          for (let r = 0; r < 4; r++) {
            if (newGrid[r][c] !== row[r]) changed = true;
            newGrid[r][c] = row[r];
          }
        }
      } else if (direction === 'DOWN') {
        for (let c = 0; c < 4; c++) {
          const column = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
          const { row, score: add } = slideRowLeft(column);
          const finalCol = row.reverse();
          totalAddedScore += add;
          for (let r = 0; r < 4; r++) {
            if (newGrid[r][c] !== finalCol[r]) changed = true;
            newGrid[r][c] = finalCol[r];
          }
        }
      }

      if (changed) {
        sound.playPop();
        setHistory({ board: board.map((r) => [...r]), score });

        const spawned = spawnRandomTile(newGrid);
        const nextScore = score + totalAddedScore;
        setBoard(spawned);
        setScore(nextScore);

        // Check if reached 2048
        if (!isWon && spawned.some((row) => row.some((val) => val === 2048))) {
          setIsWon(true);
          sound.playWin();
        }

        // Check game over
        if (checkGameOver(spawned)) {
          setIsGameOverModalOpen(true);
          onGameOver(nextScore, isWon || nextScore > 2000);
        }
      }
    },
    [board, isGameOverModalOpen, score, spawnRandomTile, isWon, onGameOver]
  );

  const undo = () => {
    if (history) {
      sound.playMove();
      setBoard(history.board);
      setScore(history.score);
      setHistory(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.key === 'a') move('LEFT');
      if (e.code === 'ArrowRight' || e.key === 'd') move('RIGHT');
      if (e.code === 'ArrowUp' || e.key === 'w') move('UP');
      if (e.code === 'ArrowDown' || e.key === 's') move('DOWN');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Swipe / drag handling: works on touch screens, trackpads and a mouse drag on the board.
  const beginSwipe = (x: number, y: number) => {
    swipeStartRef.current = { x, y };
  };

  const endSwipe = (x: number, y: number) => {
    if (!swipeStartRef.current) return;
    const dx = x - swipeStartRef.current.x;
    const dy = y - swipeStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Ignore accidental taps/clicks. A deliberate swipe moves the whole board exactly once.
    if (Math.max(absDx, absDy) >= 24) {
      if (absDx > absDy) move(dx > 0 ? 'RIGHT' : 'LEFT');
      else move(dy > 0 ? 'DOWN' : 'UP');
    }
    swipeStartRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => beginSwipe(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => endSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    beginSwipe(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const handlePointerUp = (e: React.PointerEvent) => endSwipe(e.clientX, e.clientY);
  const handlePointerCancel = () => { swipeStartRef.current = null; };

  const getTileStyles = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-slate-800 text-slate-100 border-slate-700';
      case 4:
        return 'bg-amber-900/60 text-amber-200 border-amber-800/80';
      case 8:
        return 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30';
      case 16:
        return 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/40';
      case 32:
        return 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/40';
      case 64:
        return 'bg-red-600 text-white font-black shadow-lg shadow-red-600/50';
      case 128:
        return 'bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/60';
      case 256:
        return 'bg-yellow-400 text-slate-950 font-black shadow-xl shadow-yellow-400/70 scale-[1.02]';
      case 512:
        return 'bg-emerald-500 text-white font-black shadow-xl shadow-emerald-500/80 scale-[1.03]';
      case 1024:
        return 'bg-cyan-400 text-slate-950 font-black shadow-2xl shadow-cyan-400/90 scale-[1.04]';
      case 2048:
        return 'bg-gradient-to-r from-amber-400 to-rose-500 text-white font-black shadow-2xl animate-pulse';
      default:
        return val > 2048
          ? 'bg-purple-600 text-white font-black shadow-2xl'
          : 'bg-slate-900/40 border border-slate-800/50';
    }
  };

  return (
    <GameContainer
      game={game}
      score={score}
      highScore={highScore}
      onBack={onBack}
      onRestart={resetGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <button
          onClick={undo}
          disabled={!history}
          className={`flex items-center gap-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            history
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-sm'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" /> Undo
        </button>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full select-none">
        {/* Board */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="relative p-3 rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-2xl neon-glow-amber touch-none"
          aria-label="2048 board. Swipe, drag or use the arrow buttons to move tiles."
          style={{ width: 'min(90vw, 380px)', height: 'min(90vw, 380px)' }}
        >
          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
            {board.flatMap((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`flex items-center justify-center rounded-xl border text-xl sm:text-2xl transition-all duration-100 ${getTileStyles(
                    val
                  )}`}
                >
                  {val > 0 ? (
                    <span className={val >= 1024 ? 'text-lg sm:text-xl font-mono' : 'font-mono'}>{val}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Direction controls — intentionally visible on laptops and desktops too. */}
        <div className="gv-direction-pad" aria-label="2048 direction controls">
          <button type="button" onClick={() => move('UP')} className="gv-direction-button" aria-label="Move up"><ArrowUp className="w-5 h-5" /></button>
          <div className="gv-direction-pad-row">
            <button type="button" onClick={() => move('LEFT')} className="gv-direction-button" aria-label="Move left"><ArrowLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => move('DOWN')} className="gv-direction-button" aria-label="Move down"><ArrowDown className="w-5 h-5" /></button>
            <button type="button" onClick={() => move('RIGHT')} className="gv-direction-button" aria-label="Move right"><ArrowRight className="w-5 h-5" /></button>
          </div>
          <div className="gv-direction-hint">Swipe or drag the board • or use <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd></div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={isWon || score >= 2048}
        score={score}
        highScore={highScore}
        title={isWon ? '2048 Master!' : 'No More Moves!'}
        message={isWon ? 'Congratulations! You unlocked the legendary 2048 tile!' : 'The board is full. Try another run!'}
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
