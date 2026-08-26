import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Sparkles } from 'lucide-react';

interface SnakeGameProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;

export const SnakeGame: React.FC<SnakeGameProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [bonusFood, setBonusFood] = useState<Point | null>(null);
  const [bonusTimer, setBonusTimer] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>('UP');
  const [score, setScore] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(120); // ms per tick
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const directionRef = useRef<Direction>(direction);
  directionRef.current = direction;

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure not on snake
      if (!currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection('UP');
    directionRef.current = 'UP';
    setScore(0);
    setBonusFood(null);
    setBonusTimer(0);
    setIsPaused(false);
    setIsGameOverModalOpen(false);
    setFood(generateFood(initialSnake));

    const baseSpeed = difficulty === 'easy' ? 140 : difficulty === 'medium' ? 110 : 80;
    setSpeed(baseSpeed);
  }, [difficulty, generateFood]);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused || isGameOverModalOpen) return;

      const current = directionRef.current;
      if ((e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') && current !== 'DOWN') {
        setDirection('UP');
      } else if ((e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') && current !== 'UP') {
        setDirection('DOWN');
      } else if ((e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && current !== 'RIGHT') {
        setDirection('LEFT');
      } else if ((e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') && current !== 'LEFT') {
        setDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isGameOverModalOpen]);

  // Game Loop
  useEffect(() => {
    if (isPaused || isGameOverModalOpen) return;

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // Check Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOverModalOpen(true);
          onGameOver(score, score > 50);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setIsGameOverModalOpen(true);
          onGameOver(score, score > 50);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check if ate regular food
        if (head.x === food.x && head.y === food.y) {
          sound.playEat();
          setScore((s) => {
            const next = s + 10;
            if (next % 50 === 0 && !bonusFood) {
              setBonusFood(generateFood(newSnake));
              setBonusTimer(40); // 40 ticks
            }
            return next;
          });
          setFood(generateFood(newSnake));
          // Speed up slightly
          setSpeed((prev) => Math.max(50, prev - 2));
        } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
          sound.playWin();
          setScore((s) => s + 50);
          setBonusFood(null);
          setBonusTimer(0);
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });

      // Bonus food countdown
      setBonusTimer((t) => {
        if (t <= 1) {
          setBonusFood(null);
          return 0;
        }
        return t - 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [isPaused, isGameOverModalOpen, speed, food, bonusFood, generateFood, onGameOver, score]);

  const changeDirection = (newDir: Direction) => {
    const current = directionRef.current;
    if (newDir === 'UP' && current !== 'DOWN') setDirection('UP');
    if (newDir === 'DOWN' && current !== 'UP') setDirection('DOWN');
    if (newDir === 'LEFT' && current !== 'RIGHT') setDirection('LEFT');
    if (newDir === 'RIGHT' && current !== 'LEFT') setDirection('RIGHT');
    sound.playMove();
  };

  return (
    <GameContainer
      game={game}
      score={score}
      highScore={highScore}
      onBack={onBack}
      onRestart={resetGame}
      onPauseToggle={() => setIsPaused(!isPaused)}
      isPaused={isPaused}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      extraHeaderControls={
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                resetGame();
              }}
              className={`px-2 py-0.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                difficulty === d ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        {/* Game Canvas Board */}
        <div className="relative p-2 sm:p-3 rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden neon-glow-emerald">
          {/* Pause overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs">
              <Zap className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
              <span className="text-xl font-bold text-white font-heading">PAUSED</span>
              <span className="text-xs text-slate-400 mt-1">Press Space to continue</span>
            </div>
          )}

          {/* Bonus Food Indicator */}
          {bonusFood && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Bonus: {bonusTimer}
            </div>
          )}

          {/* Grid Viewport */}
          <div
            className="grid bg-slate-950 rounded-xl overflow-hidden shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: 'min(86vw, 420px)',
              height: 'min(86vw, 420px)',
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);

              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = !isHead && snake.some((seg) => seg.x === x && seg.y === y);
              const isFood = food.x === x && food.y === y;
              const isBonus = bonusFood && bonusFood.x === x && bonusFood.y === y;

              let cellStyle = 'bg-slate-900/30';
              if (isHead) {
                cellStyle = 'bg-emerald-400 rounded-sm shadow-md shadow-emerald-400/50 scale-105 z-10';
              } else if (isBody) {
                cellStyle = 'bg-emerald-600 rounded-xs opacity-90';
              } else if (isFood) {
                cellStyle = 'bg-rose-500 rounded-full scale-90 shadow-md shadow-rose-500/80 animate-pulse';
              } else if (isBonus) {
                cellStyle = 'bg-amber-400 rounded-full scale-110 shadow-lg shadow-amber-400/90 animate-bounce';
              }

              return <div key={index} className={`w-full h-full border-[0.5px] border-slate-800/20 transition-all ${cellStyle}`} />;
            })}
          </div>
        </div>

        {/* Direction pad stays visible on desktop too — useful when playing on a laptop without relying on the keyboard. */}
        <div className="gv-direction-pad" aria-label="Snake direction controls">
          <button type="button" onClick={() => changeDirection('UP')} className="gv-direction-button" aria-label="Turn up"><ArrowUp className="w-6 h-6" /></button>
          <div className="gv-direction-pad-row">
            <button type="button" onClick={() => changeDirection('LEFT')} className="gv-direction-button" aria-label="Turn left"><ArrowLeft className="w-6 h-6" /></button>
            <button type="button" onClick={() => changeDirection('DOWN')} className="gv-direction-button" aria-label="Turn down"><ArrowDown className="w-6 h-6" /></button>
            <button type="button" onClick={() => changeDirection('RIGHT')} className="gv-direction-button" aria-label="Turn right"><ArrowRight className="w-6 h-6" /></button>
          </div>
          <div className="gv-direction-hint">Use the buttons or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrow keys</div>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={score >= 100}
        score={score}
        highScore={highScore}
        title={score >= 100 ? 'Epic Run!' : 'Snake Crashed!'}
        message={`You grew a snake of length ${snake.length} and scored ${score} points.`}
        onPlayAgain={resetGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
