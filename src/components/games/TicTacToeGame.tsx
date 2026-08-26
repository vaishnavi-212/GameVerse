import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Bot, User, Users } from 'lucide-react';

interface TicTacToeGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type Player = 'X' | 'O' | null;
type GridSize = 3 | 4 | 5;

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [gridSize, setGridSize] = useState<GridSize>(3);
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'master'>('medium');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [scores, setScores] = useState<{ X: number; O: number; draws: number }>({ X: 0, O: 0, draws: 0 });
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const checkWinner = useCallback((currentBoard: Player[], size: number) => {
    const lines: number[][] = [];
    const winLength = size === 3 ? 3 : 4; // In 4x4 or 5x5, connect 4 to win

    // Horizontal check
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - winLength; c++) {
        const line: number[] = [];
        for (let k = 0; k < winLength; k++) {
          line.push(r * size + (c + k));
        }
        lines.push(line);
      }
    }

    // Vertical check
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - winLength; r++) {
        const line: number[] = [];
        for (let k = 0; k < winLength; k++) {
          line.push((r + k) * size + c);
        }
        lines.push(line);
      }
    }

    // Diagonals (\)
    for (let r = 0; r <= size - winLength; r++) {
      for (let c = 0; c <= size - winLength; c++) {
        const line: number[] = [];
        for (let k = 0; k < winLength; k++) {
          line.push((r + k) * size + (c + k));
        }
        lines.push(line);
      }
    }

    // Diagonals (/)
    for (let r = 0; r <= size - winLength; r++) {
      for (let c = winLength - 1; c < size; c++) {
        const line: number[] = [];
        for (let k = 0; k < winLength; k++) {
          line.push((r + k) * size + (c - k));
        }
        lines.push(line);
      }
    }

    for (const line of lines) {
      const first = currentBoard[line[0]];
      if (first && line.every((idx) => currentBoard[idx] === first)) {
        return { winner: first, line };
      }
    }

    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'DRAW' as const, line: null };
    }

    return null;
  }, []);

  const resetGame = useCallback(
    (newSize: GridSize = gridSize) => {
      setGridSize(newSize);
      setBoard(Array(newSize * newSize).fill(null));
      setIsXNext(true);
      setWinningLine(null);
      setWinner(null);
      setIsGameOverModalOpen(false);
    },
    [gridSize]
  );

  // Minimax / Smart AI move
  const makeAiMove = useCallback(
    (currentBoard: Player[]) => {
      const availableIndices = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (availableIndices.length === 0) return;

      let chosenIndex: number = availableIndices[0];

      if (aiDifficulty === 'easy') {
        chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      } else {
        // Check if AI can win in 1 move
        let winningMove: number | null = null;
        for (const idx of availableIndices) {
          const testBoard = [...currentBoard];
          testBoard[idx] = 'O';
          if (checkWinner(testBoard, gridSize)?.winner === 'O') {
            winningMove = idx;
            break;
          }
        }

        // Check if Player is about to win and block
        let blockingMove: number | null = null;
        for (const idx of availableIndices) {
          const testBoard = [...currentBoard];
          testBoard[idx] = 'X';
          if (checkWinner(testBoard, gridSize)?.winner === 'X') {
            blockingMove = idx;
            break;
          }
        }

        if (winningMove !== null) {
          chosenIndex = winningMove;
        } else if (blockingMove !== null) {
          chosenIndex = blockingMove;
        } else if (aiDifficulty === 'master' && currentBoard[Math.floor((gridSize * gridSize) / 2)] === null) {
          // Center preference
          chosenIndex = Math.floor((gridSize * gridSize) / 2);
        } else {
          chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }
      }

      const nextBoard = [...currentBoard];
      nextBoard[chosenIndex] = 'O';
      sound.playPop();
      setBoard(nextBoard);
      setIsXNext(true);

      const result = checkWinner(nextBoard, gridSize);
      if (result) {
        handleGameEnd(result.winner, result.line);
      }
    },
    [aiDifficulty, checkWinner, gridSize]
  );

  const handleGameEnd = (endWinner: Player | 'DRAW', line: number[] | null) => {
    setWinner(endWinner);
    setWinningLine(line);
    setIsGameOverModalOpen(true);

    if (endWinner === 'X') {
      setScores((s) => ({ ...s, X: s.X + 1 }));
      onGameOver(100, true);
    } else if (endWinner === 'O') {
      setScores((s) => ({ ...s, O: s.O + 1 }));
      onGameOver(20, false);
    } else {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      onGameOver(40, false);
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || (!isXNext && vsAI)) return;

    sound.playMove();
    const nextBoard = [...board];
    const currentPlayer = isXNext ? 'X' : 'O';
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    const result = checkWinner(nextBoard, gridSize);
    if (result) {
      handleGameEnd(result.winner, result.line);
    } else {
      setIsXNext(!isXNext);
      if (vsAI && isXNext) {
        setTimeout(() => makeAiMove(nextBoard), 300);
      }
    }
  };

  return (
    <GameContainer
      game={game}
      highScore={highScore}
      onBack={onBack}
      onRestart={() => resetGame(gridSize)}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => {
              setVsAI(!vsAI);
              resetGame(gridSize);
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40 flex items-center gap-1 cursor-pointer"
          >
            {vsAI ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>{vsAI ? 'vs AI' : 'Pass & Play'}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-md">
        {/* Controls: Grid size and difficulty */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {([3, 4, 5] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => resetGame(sz)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  gridSize === sz ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sz}x{sz}
              </button>
            ))}
          </div>

          {vsAI && (
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {(['easy', 'medium', 'master'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAiDifficulty(lvl)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    aiDifficulty === lvl ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Score scoreboard bar */}
        <div className="grid grid-cols-3 gap-2 w-full p-2 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className={`p-2 rounded-xl transition-all ${isXNext ? 'bg-indigo-600/20 border border-indigo-500/50' : 'bg-slate-950/40'}`}>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Player X</span>
            <span className="text-xl font-black text-indigo-300 font-mono">{scores.X}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Draws</span>
            <span className="text-xl font-black text-slate-300 font-mono">{scores.draws}</span>
          </div>
          <div className={`p-2 rounded-xl transition-all ${!isXNext ? 'bg-rose-600/20 border border-rose-500/50' : 'bg-slate-950/40'}`}>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              {vsAI ? 'Bot (O)' : 'Player O'}
            </span>
            <span className="text-xl font-black text-rose-300 font-mono">{scores.O}</span>
          </div>
        </div>

        {/* Board Grid */}
        <div
          className="grid gap-2 p-3 bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl neon-glow-indigo"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: 'min(90vw, 360px)',
            height: 'min(90vw, 360px)',
          }}
        >
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || winner !== null}
                className={`flex items-center justify-center rounded-2xl border transition-all duration-200 text-3xl sm:text-4xl font-black font-heading select-none cursor-pointer ${
                  isWinningCell
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/40 scale-95'
                    : cell === 'X'
                    ? 'bg-slate-800/90 text-indigo-400 border-indigo-500/30 shadow-inner'
                    : cell === 'O'
                    ? 'bg-slate-800/90 text-rose-400 border-rose-500/30 shadow-inner'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 active:scale-95'
                }`}
              >
                {cell}
              </button>
            );
          })}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={winner === 'X'}
        title={winner === 'DRAW' ? 'Stalemate!' : winner === 'X' ? 'Player X Wins!' : vsAI ? 'Computer Wins!' : 'Player O Wins!'}
        message={winner === 'DRAW' ? 'Well matched game. No moves left!' : `Congratulations to ${winner === 'X' ? 'Player X' : winner === 'O' ? (vsAI ? 'the Bot' : 'Player O') : ''}!`}
        customStats={[
          { label: 'Grid Size', value: `${gridSize}x${gridSize}` },
          { label: 'Mode', value: vsAI ? `vs AI (${aiDifficulty})` : '2 Players' },
        ]}
        onPlayAgain={() => resetGame(gridSize)}
        onHome={onBack}
      />
    </GameContainer>
  );
};
