import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Dices, TrendingUp, TrendingDown, Bot, Users } from 'lucide-react';

interface SnakesLaddersProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const SNAKES: Record<number, number> = {
  98: 28,
  95: 56,
  92: 51,
  83: 19,
  73: 1,
  69: 33,
  64: 36,
  59: 17,
  52: 11,
  48: 9,
};

const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const PLAYER_THEMES = [
  { name: 'You (Blue)', bg: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-400' },
  { name: 'Bot 1 (Red)', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-400' },
  { name: 'Bot 2 (Green)', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-400' },
  { name: 'Bot 3 (Yellow)', bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400' },
];

export const SnakesAndLaddersGame: React.FC<SnakesLaddersProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [positions, setPositions] = useState<number[]>([1, 1, 1, 1]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [dice, setDice] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [eventLog, setEventLog] = useState<string>('Game started! Roll the dice.');
  const [winner, setWinner] = useState<number | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const resetGame = useCallback(() => {
    setPositions([1, 1, 1, 1]);
    setCurrentTurn(0);
    setDice(1);
    setIsRolling(false);
    setEventLog('Game reset. Roll the dice!');
    setWinner(null);
    setIsGameOverModalOpen(false);
  }, []);

  const rollDice = useCallback(() => {
    if (isRolling || winner !== null) return;

    sound.playDice();
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 6) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDice(finalRoll);
        setIsRolling(false);

        // Move player
        setPositions((prev) => {
          const nextPos = [...prev];
          let target = nextPos[currentTurn] + finalRoll;

          if (target > 100) {
            target = 100 - (target - 100); // Bounce back from 100
          }

          let logMsg = `${PLAYER_THEMES[currentTurn].name} rolled a ${finalRoll} and advanced to ${target}.`;

          // Check Snake or Ladder
          if (LADDERS[target]) {
            sound.playWin();
            const boosted = LADDERS[target];
            logMsg = `🎉 ${PLAYER_THEMES[currentTurn].name} climbed a LADDER from ${target} up to ${boosted}!`;
            target = boosted;
          } else if (SNAKES[target]) {
            sound.playError();
            const drop = SNAKES[target];
            logMsg = `🐍 ${PLAYER_THEMES[currentTurn].name} was bitten by a SNAKE at ${target} and slid down to ${drop}!`;
            target = drop;
          } else {
            sound.playMove();
          }

          nextPos[currentTurn] = target;
          setEventLog(logMsg);

          if (target === 100) {
            setWinner(currentTurn);
            setIsGameOverModalOpen(true);
            onGameOver(currentTurn === 0 ? 300 : 50, currentTurn === 0);
          }

          return nextPos;
        });

        // Pass turn if not a 6 and not won
        if (finalRoll !== 6) {
          setCurrentTurn((prev) => (prev + 1) % playerCount);
        } else {
          setEventLog((l) => `${l} (Rolled a 6! Extra turn!)`);
        }
      }
    }, 70);
  }, [currentTurn, isRolling, onGameOver, playerCount, winner]);

  // AI bot auto roll
  useEffect(() => {
    if (currentTurn !== 0 && !isRolling && winner === null) {
      const timer = setTimeout(() => {
        rollDice();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, isRolling, rollDice, winner]);

  // Helper to convert 1..100 tile to row and col for boustrophedon zigzag board
  const getTileCoords = (tileNumber: number) => {
    const rowFromBottom = Math.floor((tileNumber - 1) / 10);
    const r = 9 - rowFromBottom;
    let c = (tileNumber - 1) % 10;
    if (rowFromBottom % 2 === 1) {
      c = 9 - c; // Reverse alternate rows
    }
    return { r, c };
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
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {[2, 3, 4].map((cnt) => (
            <button
              key={cnt}
              onClick={() => {
                setPlayerCount(cnt);
                resetGame();
              }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                playerCount === cnt ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cnt} Players
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row items-center gap-5 w-full max-w-4xl justify-center select-none">
        {/* 100-cell Board */}
        <div
          className="grid grid-cols-10 grid-rows-10 border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl bg-slate-900"
          style={{ width: 'min(92vw, 400px)', height: 'min(92vw, 400px)' }}
        >
          {Array.from({ length: 100 }).map((_, index) => {
            const r = Math.floor(index / 10);
            const rowFromBottom = 9 - r;
            let c = index % 10;
            if (rowFromBottom % 2 === 1) {
              c = 9 - c;
            }
            const tileNumber = rowFromBottom * 10 + c + 1;

            const hasSnake = SNAKES[tileNumber];
            const hasLadder = LADDERS[tileNumber];
            const isDark = (r + c) % 2 === 1;

            return (
              <div
                key={tileNumber}
                className={`relative flex flex-col items-center justify-between p-0.5 border border-slate-800/40 text-[9px] font-mono ${
                  tileNumber === 100
                    ? 'bg-amber-500/30 text-amber-300 font-bold'
                    : hasLadder
                    ? 'bg-emerald-950/60 text-emerald-300'
                    : hasSnake
                    ? 'bg-rose-950/60 text-rose-300'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-400'
                    : 'bg-slate-900 text-slate-500'
                }`}
              >
                {/* Tile Number */}
                <span className="leading-none">{tileNumber}</span>

                {/* Snake or Ladder Icon */}
                {hasLadder && (
                  <span className="text-[10px] leading-none text-emerald-400 flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 inline" />
                    {hasLadder}
                  </span>
                )}
                {hasSnake && (
                  <span className="text-[10px] leading-none text-rose-400 flex items-center">
                    <TrendingDown className="w-2.5 h-2.5 inline" />
                    {hasSnake}
                  </span>
                )}

                {/* Player Tokens on this tile */}
                <div className="flex gap-0.5">
                  {positions.slice(0, playerCount).map((pos, pIdx) => {
                    if (pos === tileNumber) {
                      return (
                        <div
                          key={pIdx}
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${PLAYER_THEMES[pIdx].bg} ring-1 ring-white shadow-sm`}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Panel & Event Feed */}
        <div className="w-full lg:w-72 p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
          {/* Turn status & roll button */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Current Turn</span>
              <span className={`text-sm font-black ${PLAYER_THEMES[currentTurn].text}`}>
                {PLAYER_THEMES[currentTurn].name}
              </span>
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || currentTurn !== 0 || winner !== null}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm border shadow-lg transition-all cursor-pointer ${
                currentTurn === 0 && !isRolling
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-500/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
              <span>Roll: {dice}</span>
            </button>
          </div>

          {/* Standings */}
          <div className="space-y-1.5 border-t border-b border-slate-800 py-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Race Standings</span>
            {positions.slice(0, playerCount).map((pos, pIdx) => (
              <div key={pIdx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${PLAYER_THEMES[pIdx].bg}`} />
                  <span className="font-semibold text-slate-300">{PLAYER_THEMES[pIdx].name}</span>
                </div>
                <span className="font-mono font-black text-white">Tile {pos}/100</span>
              </div>
            ))}
          </div>

          {/* Event Log */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[50px] flex items-center">
            {eventLog}
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={winner === 0}
        title={winner === 0 ? 'You Won the Race!' : `${PLAYER_THEMES[winner || 0].name} Won!`}
        message="Reached tile 100 first. Epic race finish!"
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
