import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Bot, Users, Crown } from 'lucide-react';

interface CheckersGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type PieceColor = 'red' | 'white';
interface Piece {
  color: PieceColor;
  isKing: boolean;
}
type Board = (Piece | null)[][];

const INITIAL_BOARD = (): Board => {
  const b: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Red at top (rows 0, 1, 2)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        b[r][c] = { color: 'red', isKing: false };
      }
    }
  }

  // White at bottom (rows 5, 6, 7)
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        b[r][c] = { color: 'white', isKing: false };
      }
    }
  }

  return b;
};

interface Move {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  jumpedR?: number;
  jumpedC?: number;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [turn, setTurn] = useState<PieceColor>('white');
  const [selectedPiece, setSelectedPiece] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [capturedRed, setCapturedRed] = useState<number>(0);
  const [capturedWhite, setCapturedWhite] = useState<number>(0);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD());
    setTurn('white');
    setSelectedPiece(null);
    setValidMoves([]);
    setCapturedRed(0);
    setCapturedWhite(0);
    setWinner(null);
    setIsGameOverModalOpen(false);
  }, []);

  const getPieceMoves = useCallback((r: number, c: number, currentBoard: Board): Move[] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const moves: Move[] = [];
    const color = piece.color;
    const oppColor = color === 'white' ? 'red' : 'white';

    const forwardDirs = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : color === 'white'
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];

    // 1. Regular slides
    for (const [dr, dc] of forwardDirs) {
      const tr = r + dr;
      const tc = c + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && !currentBoard[tr][tc]) {
        moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
      }
    }

    // 2. Jump captures
    const allDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const jumpDirs = piece.isKing ? allDirs : forwardDirs;
    for (const [dr, dc] of jumpDirs) {
      const midR = r + dr;
      const midC = c + dc;
      const jumpR = r + dr * 2;
      const jumpC = c + dc * 2;

      if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8) {
        const midPiece = currentBoard[midR][midC];
        const destPiece = currentBoard[jumpR][jumpC];
        if (midPiece && midPiece.color === oppColor && !destPiece) {
          moves.push({
            fromR: r,
            fromC: c,
            toR: jumpR,
            toC: jumpC,
            jumpedR: midR,
            jumpedC: midC,
          });
        }
      }
    }

    return moves;
  }, []);

  const checkWinner = useCallback((currentBoard: Board, nextTurn: PieceColor) => {
    let whitePieces = 0;
    let redPieces = 0;
    let hasValidMoves = false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = currentBoard[r][c];
        if (p) {
          if (p.color === 'white') whitePieces++;
          if (p.color === 'red') redPieces++;
          if (p.color === nextTurn) {
            const moves = getPieceMoves(r, c, currentBoard);
            if (moves.length > 0) hasValidMoves = true;
          }
        }
      }
    }

    if (whitePieces === 0 || (nextTurn === 'white' && !hasValidMoves)) return 'red';
    if (redPieces === 0 || (nextTurn === 'red' && !hasValidMoves)) return 'white';
    return null;
  }, [getPieceMoves]);

  const executeMove = useCallback(
    (move: Move, currentBoard: Board) => {
      const nextBoard = currentBoard.map((row) => [...row]);
      const piece = { ...nextBoard[move.fromR][move.fromC]! };

      // King promotion
      if (piece.color === 'white' && move.toR === 0) piece.isKing = true;
      if (piece.color === 'red' && move.toR === 7) piece.isKing = true;

      nextBoard[move.toR][move.toC] = piece;
      nextBoard[move.fromR][move.fromC] = null;

      sound.playMove();

      if (move.jumpedR !== undefined && move.jumpedC !== undefined) {
        sound.playHit();
        const captured = nextBoard[move.jumpedR][move.jumpedC];
        if (captured?.color === 'red') setCapturedRed((c) => c + 1);
        if (captured?.color === 'white') setCapturedWhite((c) => c + 1);
        nextBoard[move.jumpedR][move.jumpedC] = null;
      }

      return nextBoard;
    },
    []
  );

  const makeAiMove = useCallback(
    (currentBoard: Board) => {
      const allRedMoves: Move[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c]?.color === 'red') {
            allRedMoves.push(...getPieceMoves(r, c, currentBoard));
          }
        }
      }

      if (allRedMoves.length === 0) {
        setWinner('white');
        setIsGameOverModalOpen(true);
        onGameOver(150, true);
        return;
      }

      // Prioritize jumps
      const jumpMoves = allRedMoves.filter((m) => m.jumpedR !== undefined);
      const chosen = jumpMoves.length > 0
        ? jumpMoves[Math.floor(Math.random() * jumpMoves.length)]
        : allRedMoves[Math.floor(Math.random() * allRedMoves.length)];

      const nextBoard = executeMove(chosen, currentBoard);
      setBoard(nextBoard);
      setTurn('white');

      const endWinner = checkWinner(nextBoard, 'white');
      if (endWinner) {
        setWinner(endWinner);
        setIsGameOverModalOpen(true);
        onGameOver(endWinner === 'white' ? 150 : 40, endWinner === 'white');
      }
    },
    [checkWinner, executeMove, getPieceMoves, onGameOver]
  );

  const handleCellClick = (r: number, c: number) => {
    if (winner || (turn === 'red' && vsAI)) return;

    if (selectedPiece) {
      const targetMove = validMoves.find((m) => m.toR === r && m.toC === c);
      if (targetMove) {
        const nextBoard = executeMove(targetMove, board);
        setBoard(nextBoard);
        setSelectedPiece(null);
        setValidMoves([]);

        const endWinner = checkWinner(nextBoard, 'red');
        if (endWinner) {
          setWinner(endWinner);
          setIsGameOverModalOpen(true);
          onGameOver(endWinner === 'white' ? 150 : 40, endWinner === 'white');
        } else {
          setTurn('red');
          if (vsAI) {
            setTimeout(() => makeAiMove(nextBoard), 400);
          }
        }
        return;
      }
    }

    const clickedPiece = board[r][c];
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedPiece({ r, c });
      setValidMoves(getPieceMoves(r, c, board));
      sound.playTap();
    } else {
      setSelectedPiece(null);
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
          className="px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/40 flex items-center gap-1 text-xs cursor-pointer"
        >
          {vsAI ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
          <span>{vsAI ? 'vs AI' : '2 Players'}</span>
        </button>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-lg select-none">
        {/* Score & Turn Bar */}
        <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                turn === 'white' ? 'bg-amber-400 shadow-md shadow-amber-400/50' : 'bg-rose-500 shadow-md shadow-rose-500/50'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold text-white">
              {turn === 'white' ? 'White Turn' : vsAI ? 'Red AI Thinking...' : 'Red Turn'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-amber-400">Captured Red: {capturedRed}</span>
            <span className="text-rose-400">Captured White: {capturedWhite}</span>
          </div>
        </div>

        {/* Board */}
        <div
          className="grid grid-cols-8 border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl bg-slate-800"
          style={{ width: 'min(92vw, 380px)', height: 'min(92vw, 380px)' }}
        >
          {board.flatMap((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPiece?.r === r && selectedPiece?.c === c;
              const isValidTarget = validMoves.some((m) => m.toR === r && m.toC === c);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isDark}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/70 ring-2 ring-amber-400'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700/80'
                      : 'bg-amber-100/90 cursor-default'
                  }`}
                >
                  {isValidTarget && (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80 animate-pulse z-10" />
                  )}

                  {piece && (
                    <div
                      className={`w-4/5 h-4/5 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform ${
                        piece.color === 'white'
                          ? 'bg-gradient-to-tr from-amber-300 to-yellow-100 border-amber-400 text-slate-950'
                          : 'bg-gradient-to-tr from-rose-700 to-red-500 border-rose-400 text-white'
                      } ${isSelected ? 'scale-110 ring-2 ring-white' : ''}`}
                    >
                      {piece.isKing && <Crown className="w-4 h-4" />}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={winner === 'white'}
        title={winner === 'white' ? 'White Victorious!' : 'Red Victorious!'}
        message="All opponent checkers eliminated or blocked. Magnificent play!"
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
