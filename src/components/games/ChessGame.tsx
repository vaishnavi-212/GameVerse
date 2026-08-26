import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Bot, Users, ShieldAlert } from 'lucide-react';

interface ChessGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';
interface Piece {
  type: PieceType;
  color: PieceColor;
}
type Board = (Piece | null)[][];

const INITIAL_BOARD: Board = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' },
  ],
  Array(8)
    .fill(null)
    .map(() => ({ type: 'p', color: 'b' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8)
    .fill(null)
    .map(() => ({ type: 'p', color: 'w' })),
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' },
  ],
];

const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export const ChessGame: React.FC<ChessGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [board, setBoard] = useState<Board>(() => INITIAL_BOARD.map((row) => [...row]));
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number }[]>([]);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [capturedWhite, setCapturedWhite] = useState<Piece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<Piece[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD.map((row) => [...row]));
    setTurn('w');
    setSelectedSquare(null);
    setValidMoves([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setMoveHistory([]);
    setWinner(null);
    setIsGameOverModalOpen(false);
  }, []);

  // Compute standard legal moves
  const getMoves = useCallback((r: number, c: number, currentBoard: Board): { r: number; c: number }[] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const moves: { r: number; c: number }[] = [];
    const color = piece.color;
    const oppColor = color === 'w' ? 'b' : 'w';

    const addMoveIfValid = (targetR: number, targetC: number) => {
      if (targetR < 0 || targetR >= 8 || targetC < 0 || targetC >= 8) return false;
      const targetPiece = currentBoard[targetR][targetC];
      if (!targetPiece) {
        moves.push({ r: targetR, c: targetC });
        return true;
      }
      if (targetPiece.color === oppColor) {
        moves.push({ r: targetR, c: targetC });
      }
      return false; // Path blocked
    };

    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // 1 step forward
      if (r + dir >= 0 && r + dir < 8 && !currentBoard[r + dir][c]) {
        moves.push({ r: r + dir, c });
        // 2 steps forward from start
        if (r === startRow && !currentBoard[r + 2 * dir][c]) {
          moves.push({ r: r + 2 * dir, c });
        }
      }
      // Diagonal captures
      [-1, 1].forEach((dc) => {
        const tr = r + dir;
        const tc = c + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const target = currentBoard[tr][tc];
          if (target && target.color === oppColor) {
            moves.push({ r: tr, c: tc });
          }
        }
      });
    }

    if (piece.type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        addMoveIfValid(r + dr, c + dc);
      }
    }

    if (piece.type === 'r' || piece.type === 'q') {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        while (addMoveIfValid(r + dr * step, c + dc * step)) {
          step++;
        }
      }
    }

    if (piece.type === 'b' || piece.type === 'q') {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        while (addMoveIfValid(r + dr * step, c + dc * step)) {
          step++;
        }
      }
    }

    if (piece.type === 'k') {
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of dirs) {
        addMoveIfValid(r + dr, c + dc);
      }
    }

    return moves;
  }, []);

  const makeMove = useCallback(
    (fromR: number, fromC: number, toR: number, toC: number, currentBoard: Board) => {
      const movingPiece = currentBoard[fromR][fromC];
      if (!movingPiece) return null;

      const targetPiece = currentBoard[toR][toC];
      const nextBoard = currentBoard.map((row) => [...row]);

      // Handle pawn promotion
      let pieceToPlace = movingPiece;
      if (movingPiece.type === 'p' && (toR === 0 || toR === 7)) {
        pieceToPlace = { type: 'q', color: movingPiece.color };
      }

      nextBoard[toR][toC] = pieceToPlace;
      nextBoard[fromR][fromC] = null;

      sound.playMove();

      if (targetPiece) {
        sound.playHit();
        if (targetPiece.color === 'w') {
          setCapturedWhite((prev) => [...prev, targetPiece]);
        } else {
          setCapturedBlack((prev) => [...prev, targetPiece]);
        }

        if (targetPiece.type === 'k') {
          // King captured - Game over
          setWinner(movingPiece.color);
          setIsGameOverModalOpen(true);
          onGameOver(movingPiece.color === 'w' ? 200 : 50, movingPiece.color === 'w');
        }
      }

      const notation = `${movingPiece.type.toUpperCase()}${String.fromCharCode(97 + fromC)}${8 - fromR}→${String.fromCharCode(97 + toC)}${8 - toR}`;
      setMoveHistory((prev) => [notation, ...prev.slice(0, 15)]);

      return nextBoard;
    },
    [onGameOver]
  );

  const makeAiMove = useCallback(
    (currentBoard: Board) => {
      const allBlackMoves: { from: { r: number; c: number }; to: { r: number; c: number }; captureScore: number }[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = currentBoard[r][c];
          if (p && p.color === 'b') {
            const moves = getMoves(r, c, currentBoard);
            for (const to of moves) {
              const target = currentBoard[to.r][to.c];
              let captureScore = 0;
              if (target) {
                if (target.type === 'k') captureScore = 1000;
                else if (target.type === 'q') captureScore = 9;
                else if (target.type === 'r') captureScore = 5;
                else if (target.type === 'b' || target.type === 'n') captureScore = 3;
                else captureScore = 1;
              }
              allBlackMoves.push({ from: { r, c }, to, captureScore });
            }
          }
        }
      }

      if (allBlackMoves.length === 0) return;

      // Sort by capture score
      allBlackMoves.sort((a, b) => b.captureScore - a.captureScore);
      const chosen = allBlackMoves[0].captureScore > 0
        ? allBlackMoves[0]
        : allBlackMoves[Math.floor(Math.random() * allBlackMoves.length)];

      const nextBoard = makeMove(chosen.from.r, chosen.from.c, chosen.to.r, chosen.to.c, currentBoard);
      if (nextBoard) {
        setBoard(nextBoard);
        setTurn('w');
      }
    },
    [getMoves, makeMove]
  );

  const handleSquareClick = (r: number, c: number) => {
    if (winner || (turn === 'b' && vsAI)) return;

    if (selectedSquare) {
      // Check if clicking a valid move
      const isValid = validMoves.some((m) => m.r === r && m.c === c);
      if (isValid) {
        const nextBoard = makeMove(selectedSquare.r, selectedSquare.c, r, c, board);
        if (nextBoard) {
          setBoard(nextBoard);
          setSelectedSquare(null);
          setValidMoves([]);
          const nextTurn = turn === 'w' ? 'b' : 'w';
          setTurn(nextTurn);

          if (vsAI && nextTurn === 'b' && !winner) {
            setTimeout(() => makeAiMove(nextBoard), 450);
          }
        }
        return;
      }
    }

    const clickedPiece = board[r][c];
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedSquare({ r, c });
      setValidMoves(getMoves(r, c, board));
      sound.playTap();
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
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
          className="px-2.5 py-1 rounded-lg bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40 flex items-center gap-1 text-xs cursor-pointer"
        >
          {vsAI ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
          <span>{vsAI ? 'vs Bot' : '2 Players'}</span>
        </button>
      }
    >
      <div className="flex flex-col lg:flex-row items-center gap-6 w-full max-w-4xl justify-center select-none">
        {/* Main Chess Board */}
        <div className="flex flex-col items-center gap-3">
          {/* Black captured pieces */}
          <div className="flex items-center justify-between w-full px-2 py-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
            <span className="font-bold text-slate-400">Black Army</span>
            <div className="flex items-center gap-1 min-h-[22px]">
              {capturedBlack.map((p, i) => (
                <span key={i} className="text-lg leading-none text-slate-300">
                  {PIECE_SYMBOLS.b[p.type]}
                </span>
              ))}
            </div>
          </div>

          <div
            className="grid grid-cols-8 border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl bg-slate-800"
            style={{
              width: 'min(92vw, 400px)',
              height: 'min(92vw, 400px)',
            }}
          >
            {board.flatMap((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                const isValidTarget = validMoves.some((m) => m.r === r && m.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/70 ring-2 ring-amber-400'
                        : isDark
                        ? 'bg-slate-700 hover:bg-slate-600/80'
                        : 'bg-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {/* Legal target dot */}
                    {isValidTarget && (
                      <div
                        className={`absolute z-10 rounded-full ${
                          piece
                            ? 'w-full h-full border-4 border-emerald-400/80 animate-pulse'
                            : 'w-3.5 h-3.5 bg-emerald-500 shadow-md shadow-emerald-500/80'
                        }`}
                      />
                    )}

                    {piece && (
                      <span
                        className={`text-2xl sm:text-3xl font-black drop-shadow-sm transition-transform ${
                          piece.color === 'w'
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                            : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                        } ${isSelected ? 'scale-110' : ''}`}
                      >
                        {PIECE_SYMBOLS[piece.color][piece.type]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* White captured pieces */}
          <div className="flex items-center justify-between w-full px-2 py-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
            <span className="font-bold text-slate-400">White Army</span>
            <div className="flex items-center gap-1 min-h-[22px]">
              {capturedWhite.map((p, i) => (
                <span key={i} className="text-lg leading-none text-white">
                  {PIECE_SYMBOLS.w[p.type]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Info & Move History Panel */}
        <div className="w-full lg:w-64 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Current Turn</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${turn === 'w' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {turn === 'w' ? 'White (You)' : vsAI ? 'Black (AI Bot)' : 'Black'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">Move Ledger</span>
            <div className="h-36 overflow-y-auto space-y-1 pr-1 text-xs font-mono">
              {moveHistory.length === 0 ? (
                <span className="text-slate-500 italic">No moves recorded yet.</span>
              ) : (
                moveHistory.map((m, idx) => (
                  <div key={idx} className="p-1 rounded bg-slate-950/50 border border-slate-800/80 text-slate-300">
                    {idx + 1}. {m}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={winner === 'w'}
        title={winner === 'w' ? 'White Victory!' : 'Black Victory!'}
        message={`The enemy King was captured. Brilliant tactical checkmate!`}
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
