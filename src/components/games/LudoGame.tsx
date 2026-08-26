import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Bot, Users, Dices, Crown } from 'lucide-react';

interface LudoGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

interface Token {
  id: number;
  color: LudoColor;
  step: number; // -1 = in yard, 0..51 = main track, 52..56 = home run, 57 = home finished
}

const PLAYER_COLORS: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

const COLOR_CLASSES: Record<LudoColor, { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-rose-600', text: 'text-rose-400', border: 'border-rose-500' },
  green: { bg: 'bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500' },
  yellow: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-400' },
  blue: { bg: 'bg-sky-600', text: 'text-sky-400', border: 'border-sky-500' },
};

export const LudoGame: React.FC<LudoGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [activeTurn, setActiveTurn] = useState<LudoColor>('red');
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [tokens, setTokens] = useState<Token[]>(() => {
    const arr: Token[] = [];
    let id = 0;
    PLAYER_COLORS.forEach((color) => {
      for (let i = 0; i < 4; i++) {
        arr.push({ id: id++, color, step: -1 });
      }
    });
    return arr;
  });
  const [winner, setWinner] = useState<LudoColor | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [vsBots, setVsBots] = useState<boolean>(true);

  const activeColors = playerCount === 2 ? ['red', 'yellow'] : PLAYER_COLORS;

  const resetGame = useCallback(() => {
    const arr: Token[] = [];
    let id = 0;
    PLAYER_COLORS.forEach((color) => {
      for (let i = 0; i < 4; i++) {
        arr.push({ id: id++, color, step: -1 });
      }
    });
    setTokens(arr);
    setActiveTurn('red');
    setDiceValue(1);
    setIsRolling(false);
    setHasRolled(false);
    setWinner(null);
    setIsGameOverModalOpen(false);
  }, []);

  const nextTurn = useCallback(() => {
    setHasRolled(false);
    const currIdx = activeColors.indexOf(activeTurn);
    const nextIdx = (currIdx + 1) % activeColors.length;
    const nextColor = activeColors[nextIdx] as LudoColor;
    setActiveTurn(nextColor);
  }, [activeColors, activeTurn]);

  const rollDice = useCallback(() => {
    if (isRolling || hasRolled || winner) return;

    sound.playDice();
    setIsRolling(true);

    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 6) {
        clearInterval(rollInterval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        setHasRolled(true);

        // Check if player has any valid moves
        const playerTokens = tokens.filter((t) => t.color === activeTurn);
        const canMoveAny = playerTokens.some((t) => {
          if (t.step === -1 && finalVal === 6) return true;
          if (t.step >= 0 && t.step + finalVal <= 57) return true;
          return false;
        });

        if (!canMoveAny) {
          setTimeout(() => nextTurn(), 800);
        } else if (vsBots && activeTurn !== 'red') {
          // Bot chooses a move automatically
          setTimeout(() => {
            const valid = playerTokens.find((t) => (t.step === -1 && finalVal === 6) || (t.step >= 0 && t.step + finalVal <= 57));
            if (valid) {
              moveToken(valid.id, finalVal);
            } else {
              nextTurn();
            }
          }, 600);
        }
      }
    }, 70);
  }, [activeTurn, hasRolled, isRolling, nextTurn, tokens, vsBots, winner]);

  // Bot auto-roll on its turn
  useEffect(() => {
    if (vsBots && activeTurn !== 'red' && !hasRolled && !isRolling && !winner) {
      const botTimer = setTimeout(() => {
        rollDice();
      }, 700);
      return () => clearTimeout(botTimer);
    }
  }, [activeTurn, hasRolled, isRolling, rollDice, vsBots, winner]);

  const moveToken = (tokenId: number, rolledVal: number = diceValue) => {
    if (!hasRolled || isRolling) return;

    const token = tokens.find((t) => t.id === tokenId);
    if (!token || token.color !== activeTurn) return;

    if (token.step === -1 && rolledVal !== 6) return;
    if (token.step >= 0 && token.step + rolledVal > 57) return;

    sound.playMove();

    const nextTokens = tokens.map((t) => {
      if (t.id === tokenId) {
        const nextStep = t.step === -1 ? 0 : t.step + rolledVal;
        return { ...t, step: nextStep };
      }
      return t;
    });

    // Check knockout of opponent token (unless in safe zone: steps 0, 8, 13, 21, 26, 34, 39, 47)
    const moved = nextTokens.find((t) => t.id === tokenId)!;
    if (moved.step >= 0 && moved.step <= 51) {
      const movedGlobalPos = (moved.step + COLOR_OFFSETS[moved.color]) % 52;
      const isSafe = [0, 8, 13, 21, 26, 34, 39, 47].includes(movedGlobalPos);

      if (!isSafe) {
        nextTokens.forEach((t) => {
          if (t.color !== moved.color && t.step >= 0 && t.step <= 51) {
            const oppGlobal = (t.step + COLOR_OFFSETS[t.color]) % 52;
            if (oppGlobal === movedGlobalPos) {
              sound.playHit();
              t.step = -1; // Send back to yard
            }
          }
        });
      }
    }

    setTokens(nextTokens);

    // Check if player won (all 4 tokens step 57)
    const playerFinished = nextTokens.filter((t) => t.color === activeTurn && t.step === 57).length;
    if (playerFinished === 4) {
      setWinner(activeTurn);
      setIsGameOverModalOpen(true);
      onGameOver(activeTurn === 'red' ? 300 : 50, activeTurn === 'red');
      return;
    }

    // Rolling a 6 gives bonus turn
    if (rolledVal === 6) {
      setHasRolled(false);
    } else {
      nextTurn();
    }
  };

  const trackPositions = [
    [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
    [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
    [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
    [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]
  ] as const;

  const homeLanes: Record<LudoColor, [number, number][]> = {
    red: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    green: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    blue: [[13,7],[12,7],[11,7],[10,7],[9,7]],
  };

  const cellTokenMap = new Map<string, Token[]>();
  tokens.forEach((t) => {
    if (t.step < 0 || t.step === 57) return;
    const key = t.step <= 51
      ? `${trackPositions[(t.step + COLOR_OFFSETS[t.color]) % 52][0]}-${trackPositions[(t.step + COLOR_OFFSETS[t.color]) % 52][1]}`
      : `${homeLanes[t.color][t.step - 52][0]}-${homeLanes[t.color][t.step - 52][1]}`;
    cellTokenMap.set(key, [...(cellTokenMap.get(key) || []), t]);
  });

  const getCellClass = (r: number, c: number) => {
    const isRedYard = r <= 5 && c <= 5;
    const isGreenYard = r <= 5 && c >= 9;
    const isYellowYard = r >= 9 && c >= 9;
    const isBlueYard = r >= 9 && c <= 5;
    const track = trackPositions.some(([tr, tc]) => tr === r && tc === c);
    const redLane = homeLanes.red.some(([tr, tc]) => tr === r && tc === c);
    const greenLane = homeLanes.green.some(([tr, tc]) => tr === r && tc === c);
    const yellowLane = homeLanes.yellow.some(([tr, tc]) => tr === r && tc === c);
    const blueLane = homeLanes.blue.some(([tr, tc]) => tr === r && tc === c);
    if (redLane) return 'bg-red-400';
    if (greenLane) return 'bg-emerald-400';
    if (yellowLane) return 'bg-yellow-300';
    if (blueLane) return 'bg-sky-400';
    if (track) return 'bg-white';
    if (isRedYard) return 'bg-red-100';
    if (isGreenYard) return 'bg-emerald-100';
    if (isYellowYard) return 'bg-yellow-100';
    if (isBlueYard) return 'bg-sky-100';
    return 'bg-white';
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
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border-2 border-slate-800 text-xs shadow-sm">
          <button
            onClick={() => { setPlayerCount(playerCount === 2 ? 4 : 2); resetGame(); }}
            className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-black border border-rose-700 cursor-pointer hover:brightness-110"
          >
            {playerCount} Players
          </button>
          <button
            onClick={() => { setVsBots(!vsBots); resetGame(); }}
            className="px-3 py-1.5 rounded-lg bg-amber-300 text-slate-950 font-black border border-amber-600 cursor-pointer flex items-center gap-1 hover:brightness-105"
          >
            {vsBots ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>{vsBots ? 'VS BOT' : 'LOCAL'}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-5xl select-none px-2">
        <div className="flex items-center justify-between w-full max-w-3xl px-4 py-3 bg-white border-2 border-slate-800 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${COLOR_CLASSES[activeTurn].bg} ring-2 ring-slate-900`} />
            <span className="text-sm font-black text-slate-950 uppercase tracking-wide">
              {activeTurn} TURN {vsBots && activeTurn !== 'red' ? '(BOT)' : ''}
            </span>
          </div>
          <button
            onClick={rollDice}
            disabled={isRolling || hasRolled || (vsBots && activeTurn !== 'red')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-900 font-black text-sm transition-all cursor-pointer ${
              !hasRolled && (!vsBots || activeTurn === 'red')
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg animate-pulse'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'ROLLING…' : `ROLL: ${diceValue}`}</span>
          </button>
        </div>

        <div className="relative p-2 sm:p-3 rounded-[2rem] bg-slate-900 border-4 border-slate-950 shadow-2xl">
          <div
            className="grid relative overflow-hidden rounded-[1.5rem] border-2 border-white/70"
            style={{ width: 'min(82vw, 660px)', aspectRatio: '1 / 1', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gridTemplateRows: 'repeat(15, minmax(0, 1fr))' }}
          >
            {Array.from({ length: 225 }, (_, i) => {
              const r = Math.floor(i / 15); const c = i % 15;
              const key = `${r}-${c}`; const here = cellTokenMap.get(key) || [];
              const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
              const startColor: LudoColor | null = key === '6-1' ? 'red' : key === '1-8' ? 'green' : key === '8-13' ? 'yellow' : key === '13-6' ? 'blue' : null;
              return (
                <div key={key} className={`relative min-w-0 min-h-0 border-[1px] border-slate-300/70 flex items-center justify-center ${isCenter ? 'bg-white' : getCellClass(r,c)}`}>
                  {startColor && <span className={`absolute inset-[12%] rounded-full ${COLOR_CLASSES[startColor].bg} ring-2 ring-slate-900/40`} />}
                  {here.map((t, idx) => {
                    const canMove = hasRolled && t.color === activeTurn && ((t.step === -1 && diceValue === 6) || (t.step >= 0 && t.step + diceValue <= 57));
                    return <button key={t.id} onClick={() => moveToken(t.id)} disabled={!canMove || (vsBots && activeTurn !== 'red')} className={`absolute w-[58%] aspect-square rounded-full border-2 border-white shadow-md ${COLOR_CLASSES[t.color].bg} ${idx ? 'translate-x-[22%] translate-y-[22%]' : ''} ${canMove ? 'animate-bounce ring-2 ring-slate-900 cursor-pointer' : ''}`} />;
                  })}
                </div>
              );
            })}

            {/* Corner home pads */}
            {([
              ['red','top-0 left-0'], ['green','top-0 right-0'], ['blue','bottom-0 left-0'], ['yellow','bottom-0 right-0']
            ] as [LudoColor,string][]).map(([color,pos]) => (
              <div key={color} className={`absolute ${pos} w-[40%] h-[40%] m-[1.2%] rounded-[22%] ${COLOR_CLASSES[color].bg} border-[5px] border-white/80 shadow-inner flex items-center justify-center`}>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 p-3 sm:p-5 bg-white/80 rounded-[18%] shadow-inner">
                  {tokens.filter(t => t.color === color && t.step === -1).map((t) => {
                    const canMove = hasRolled && activeTurn === color && diceValue === 6;
                    return <button key={t.id} onClick={() => moveToken(t.id)} disabled={!canMove || (vsBots && activeTurn !== 'red')} className={`w-7 h-7 sm:w-11 sm:h-11 rounded-full ${COLOR_CLASSES[color].bg} border-4 border-white shadow-lg ${canMove ? 'animate-bounce ring-2 ring-slate-950 cursor-pointer' : ''}`} />;
                  })}
                </div>
              </div>
            ))}

            {/* Classic four-colour home triangle */}
            <div className="absolute left-1/2 top-1/2 w-[20%] aspect-square -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white border-4 border-slate-900 shadow-xl z-20 overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 -rotate-45 scale-[1.45]">
                <div className="bg-red-500"/><div className="bg-emerald-500"/><div className="bg-sky-500"/><div className="bg-yellow-400"/>
              </div>
              <Crown className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-lg -rotate-45" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-3xl">
          {activeColors.map(color => <div key={color} className={`rounded-xl border-2 ${COLOR_CLASSES[color].border} bg-white px-3 py-2 flex items-center justify-between shadow-sm`}><span className={`font-black uppercase text-xs ${COLOR_CLASSES[color].text}`}>{color}</span><span className="text-slate-900 font-bold text-xs">{tokens.filter(t=>t.color===color && t.step===57).length}/4 HOME</span></div>)}
        </div>
      </div>
      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={winner === 'red'}
        title={winner === 'red' ? 'Victory Royale!' : `${winner?.toUpperCase()} Won!`}
        message="All 4 tokens reached home successfully!"
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
