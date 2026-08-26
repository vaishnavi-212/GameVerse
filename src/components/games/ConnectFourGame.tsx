import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Bot, Users, ArrowDown } from 'lucide-react';

interface ConnectFourGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type Player = 1 | 2; // 1 = Yellow / Player 1, 2 = Red / AI / Player 2
type Board = (Player | 0)[][]; // 6 rows x 7 cols

const ROWS = 6;
const COLS = 7;

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [board, setBoard] = useState<Board>(() =>
    Array(ROWS)
      .fill(0)
      .map(() => Array(COLS).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [winningCells, setWinningCells] = useState<{ r: number; c: number }[] | null>(null);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [winExplanation, setWinExplanation] = useState<string>('');

  const resetGame = useCallback(() => {
    setBoard(
      Array(ROWS)
        .fill(0)
        .map(() => Array(COLS).fill(0))
    );
    setCurrentPlayer(1);
    setWinningCells(null);
    setWinner(null);
    setIsGameOverModalOpen(false);
    setWinExplanation('');
  }, []);

  const checkWin = useCallback((grid: Board) => {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p && p === grid[r][c + 1] && p === grid[r][c + 2] && p === grid[r][c + 3]) {
          return {
            winner: p,
            line: 'horizontal' as const,
            cells: [
              { r, c },
              { r, c: c + 1 },
              { r, c: c + 2 },
              { r, c: c + 3 },
            ],
          };
        }
      }
    }

    // Check vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const p = grid[r][c];
        if (p && p === grid[r + 1][c] && p === grid[r + 2][c] && p === grid[r + 3][c]) {
          return {
            winner: p,
            line: 'vertical' as const,
            cells: [
              { r, c },
              { r: r + 1, c },
              { r: r + 2, c },
              { r: r + 3, c },
            ],
          };
        }
      }
    }

    // Check diagonal (\)
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p && p === grid[r + 1][c + 1] && p === grid[r + 2][c + 2] && p === grid[r + 3][c + 3]) {
          return {
            winner: p,
            line: 'diagonal down-right' as const,
            cells: [
              { r, c },
              { r: r + 1, c: c + 1 },
              { r: r + 2, c: c + 2 },
              { r: r + 3, c: c + 3 },
            ],
          };
        }
      }
    }

    // Check diagonal (/)
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p && p === grid[r - 1][c + 1] && p === grid[r - 2][c + 2] && p === grid[r - 3][c + 3]) {
          return {
            winner: p,
            line: 'diagonal up-right' as const,
            cells: [
              { r, c },
              { r: r - 1, c: c + 1 },
              { r: r - 2, c: c + 2 },
              { r: r - 3, c: c + 3 },
            ],
          };
        }
      }
    }

    // Check draw
    if (grid[0].every((cell) => cell !== 0)) {
      return { winner: 'DRAW' as const, cells: [] };
    }

    return null;
  }, []);

  const explainWin = useCallback((result: { winner: Player | 'DRAW'; cells: { r: number; c: number }[]; line?: string }) => {
    if (result.winner === 'DRAW') return 'The board is full and neither side connected four.';
    const owner = result.winner === 2 && vsAI ? 'The computer' : result.winner === 1 ? 'You' : 'Player 2';
    const positions = result.cells.map(({ r, c }) => `R${ROWS - r}C${c + 1}`).join(' → ');
    return `${owner} connected four in a ${result.line || 'winning'} line. Winning path: ${positions}.`;
  }, [vsAI]);

  const dropDisc = useCallback(
    (col: number, player: Player, currentBoard: Board) => {
      // Find lowest empty row
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (currentBoard[r][col] === 0) {
          targetRow = r;
          break;
        }
      }
      if (targetRow === -1) return null;

      const nextBoard = currentBoard.map((row) => [...row]);
      nextBoard[targetRow][col] = player;
      return { board: nextBoard, row: targetRow };
    },
    []
  );

  const makeAiMove = useCallback(
    (currentBoard: Board) => {
      const validCols: number[] = [];
      for (let c = 0; c < COLS; c++) {
        if (currentBoard[0][c] === 0) validCols.push(c);
      }
      if (validCols.length === 0) return;

      // 1. Check if AI can win
      for (const c of validCols) {
        const sim = dropDisc(c, 2, currentBoard);
        if (sim && checkWin(sim.board)?.winner === 2) {
          executeAiCol(c, currentBoard);
          return;
        }
      }

      // 2. Check if player 1 could win and block
      for (const c of validCols) {
        const sim = dropDisc(c, 1, currentBoard);
        if (sim && checkWin(sim.board)?.winner === 1) {
          executeAiCol(c, currentBoard);
          return;
        }
      }

      // 3. Prefer center column (col 3)
      if (validCols.includes(3)) {
        executeAiCol(3, currentBoard);
        return;
      }

      // Random fallback
      const chosen = validCols[Math.floor(Math.random() * validCols.length)];
      executeAiCol(chosen, currentBoard);
    },
    [checkWin, dropDisc]
  );

  const executeAiCol = (col: number, currentBoard: Board) => {
    const res = dropDisc(col, 2, currentBoard);
    if (!res) return;
    sound.playPop();
    setBoard(res.board);

    const winResult = checkWin(res.board);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      setWinExplanation(explainWin(winResult));
      setIsGameOverModalOpen(true);
      onGameOver(winResult.winner === 1 ? 100 : 30, winResult.winner === 1);
    } else {
      setCurrentPlayer(1);
    }
  };

  const handleColumnClick = (col: number) => {
    if (winner || (currentPlayer === 2 && vsAI)) return;

    const res = dropDisc(col, currentPlayer, board);
    if (!res) return;

    sound.playPop();
    setBoard(res.board);

    const winResult = checkWin(res.board);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      setWinExplanation(explainWin(winResult));
      setIsGameOverModalOpen(true);
      onGameOver(winResult.winner === 1 ? 100 : 30, winResult.winner === 1);
    } else {
      const nextPlayer = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      if (vsAI && nextPlayer === 2) {
        setTimeout(() => makeAiMove(res.board), 400);
      }
    }
  };

  return (
    <GameContainer
      game={game}
      highScore={highScore}
      onBack={onBack}
      onRestart={resetGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <button
          onClick={() => {
            setVsAI(!vsAI);
            resetGame();
          }}
          className="px-2.5 py-1 rounded-lg bg-cyan-600/30 text-cyan-300 font-semibold border border-cyan-500/40 flex items-center gap-1 text-xs cursor-pointer"
        >
          {vsAI ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
          <span>{vsAI ? 'vs AI' : '2 Players'}</span>
        </button>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-lg select-none">
        {/* Turn indicator */}
        <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                currentPlayer === 1 ? 'bg-amber-400 shadow-md shadow-amber-400/50' : 'bg-rose-500 shadow-md shadow-rose-500/50'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold text-white">
              {currentPlayer === 1 ? 'Player 1 Turn (Yellow)' : vsAI ? 'Computer Thinking (Red)' : 'Player 2 Turn (Red)'}
            </span>
          </div>
          <span className="text-xs text-slate-400">Connect 4 to Win</span>
        </div>

        {winner && winner !== 'DRAW' && winningCells && (
          <div className={`w-full rounded-2xl border px-4 py-3 text-center shadow-lg ${winner === 2 && vsAI ? 'bg-rose-950/80 border-rose-400/60' : 'bg-emerald-950/80 border-emerald-400/60'}`}>
            <div className="text-sm sm:text-base font-black text-white tracking-wide">
              {winner === 2 && vsAI ? 'COMPUTER FOUND CONNECT 4' : 'CONNECT 4 FOUND'}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-white/85 leading-relaxed">{winExplanation}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/55">The glowing discs on the board are the exact winning four</p>
          </div>
        )}

        {/* Board */}
        <div className="p-3 sm:p-4 rounded-3xl bg-blue-900 border-4 border-blue-700 shadow-2xl neon-glow-indigo">
          {/* Top Drop Indicators */}
          <div className="grid grid-cols-7 gap-2 mb-2 px-1">
            {Array.from({ length: COLS }).map((_, c) => (
              <button
                key={c}
                onClick={() => handleColumnClick(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                className="h-7 rounded-lg bg-blue-800/40 hover:bg-blue-600/60 flex items-center justify-center text-cyan-300 transition-colors cursor-pointer"
              >
                <ArrowDown className={`w-4 h-4 transition-transform ${hoverCol === c ? 'translate-y-0.5' : ''}`} />
              </button>
            ))}
          </div>

          {/* Grid Slots */}
          <div className="grid grid-cols-7 gap-2">
            {board.flatMap((row, r) =>
              row.map((val, c) => {
                const isWinning = winningCells?.some((cell) => cell.r === r && cell.c === c);
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleColumnClick(c)}
                    onMouseEnter={() => setHoverCol(c)}
                    onMouseLeave={() => setHoverCol(null)}
                    disabled={!!winner}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center p-1 bg-blue-950 border border-blue-800/80 shadow-inner ${winner ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`w-full h-full rounded-full transition-all duration-300 ${
                        val === 1
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-md shadow-amber-400/40 scale-95'
                          : val === 2
                          ? 'bg-gradient-to-tr from-rose-600 to-red-400 shadow-md shadow-rose-500/40 scale-95'
                          : hoverCol === c
                          ? 'bg-blue-900/40 border border-dashed border-blue-400/30'
                          : 'bg-slate-950/80'
                      } ${isWinning ? 'ring-4 ring-white ring-offset-2 ring-offset-blue-950 scale-110 animate-pulse shadow-[0_0_28px_rgba(255,255,255,0.95)]' : ''}`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={winner === 1}
        title={winner === 'DRAW' ? 'Board Full - Draw!' : winner === 1 ? 'Player 1 Wins!' : vsAI ? 'Computer Wins!' : 'Player 2 Wins!'}
        message={winner === 'DRAW' ? 'All columns are filled.' : winExplanation || `Connected 4 in a row! Great tactical play.`}
        transparentBackdrop
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
