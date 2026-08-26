import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Target, Wind, Crosshair, Sparkles } from 'lucide-react';

interface ArcheryProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface Shot {
  x: number;
  y: number;
  points: number;
  label: string;
}

export const ArcheryTargetGame: React.FC<ArcheryProps> = ({
  game,
  highScore,
  onGameOver,
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [arrowsLeft, setArrowsLeft] = useState<number>(5);
  const [score, setScore] = useState<number>(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [wind, setWind] = useState<number>(0);
  const [targetOffset, setTargetOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 150, y: 150 });
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [lastShotFeedback, setLastShotFeedback] = useState<string>('');

  const initGame = useCallback(() => {
    setArrowsLeft(5);
    setScore(0);
    setShots([]);
    setWind(Math.floor(Math.random() * 7) - 3); // -3 to +3
    setTargetOffset({ x: 0, y: 0 });
    setIsAiming(false);
    setIsGameOverModalOpen(false);
    setLastShotFeedback('');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Target gentle drift animation
  useEffect(() => {
    let frameId: number;
    let angle = 0;
    const animate = () => {
      angle += 0.03;
      setTargetOffset({
        x: Math.sin(angle) * 15,
        y: Math.cos(angle * 1.5) * 10,
      });
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setAimPos({ x, y });
  };

  const releaseArrow = () => {
    if (arrowsLeft <= 0 || isGameOverModalOpen) return;

    sound.playHit();

    // Target center coordinates (assuming 300x300 arena)
    const centerX = 150 + targetOffset.x;
    const centerY = 150 + targetOffset.y;

    // Apply wind drift
    const finalX = aimPos.x + wind * 8;
    const finalY = aimPos.y;

    const dx = finalX - centerX;
    const dy = finalY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let points = 0;
    let label = 'Miss';

    if (distance <= 15) {
      points = 50;
      label = '🎯 BULLSEYE!';
      sound.playWin();
    } else if (distance <= 35) {
      points = 30;
      label = 'Gold (30 pts)';
      sound.playCorrect();
    } else if (distance <= 65) {
      points = 20;
      label = 'Red (20 pts)';
      sound.playPop();
    } else if (distance <= 95) {
      points = 10;
      label = 'Blue (10 pts)';
      sound.playMove();
    } else if (distance <= 125) {
      points = 5;
      label = 'White (5 pts)';
      sound.playMove();
    } else {
      points = 0;
      label = 'Missed Target';
      sound.playError();
    }

    const nextScore = score + points;
    const nextArrows = arrowsLeft - 1;
    setScore(nextScore);
    setArrowsLeft(nextArrows);
    setLastShotFeedback(`${label} (+${points})`);

    const newShot: Shot = { x: finalX, y: finalY, points, label };
    const nextShots = [...shots, newShot];
    setShots(nextShots);

    // Randomize wind for next shot
    setWind(Math.floor(Math.random() * 9) - 4);

    if (nextArrows === 0) {
      setTimeout(() => {
        setIsGameOverModalOpen(true);
        onGameOver(nextScore, nextScore >= 120);
      }, 700);
    }
  };

  return (
    <GameContainer
      game={game}
      score={score}
      highScore={highScore}
      onBack={onBack}
      onRestart={initGame}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-md select-none">
        {/* Status Tracker */}
        <div className="grid grid-cols-3 gap-2 w-full p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-xs font-bold text-slate-300">🏹 {arrowsLeft} Arrows</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300">
              Wind: {wind > 0 ? `+${wind}` : wind}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950/40">
            <span className="text-xs font-mono font-black text-amber-300">{score} pts</span>
          </div>
        </div>

        {/* Archery Arena */}
        <div
          onPointerMove={handlePointerMove}
          onClick={releaseArrow}
          className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] bg-slate-950 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl cursor-crosshair flex items-center justify-center neon-glow-amber"
        >
          {/* Target Rings */}
          <div
            className="absolute rounded-full flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${targetOffset.x}px, ${targetOffset.y}px)`,
              width: 250,
              height: 250,
            }}
          >
            {/* White Ring */}
            <div className="w-[250px] h-[250px] rounded-full bg-slate-200 border-4 border-slate-400 flex items-center justify-center shadow-lg">
              {/* Black/Blue Ring */}
              <div className="w-[190px] h-[190px] rounded-full bg-sky-500 border-4 border-sky-600 flex items-center justify-center">
                {/* Red Ring */}
                <div className="w-[130px] h-[130px] rounded-full bg-rose-600 border-4 border-rose-700 flex items-center justify-center">
                  {/* Gold Ring */}
                  <div className="w-[70px] h-[70px] rounded-full bg-amber-400 border-4 border-amber-500 flex items-center justify-center">
                    {/* Bullseye */}
                    <div className="w-[30px] h-[30px] rounded-full bg-amber-200 ring-2 ring-amber-600 flex items-center justify-center">
                      <span className="text-[9px] font-black text-amber-950">+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past Shots Pins */}
          {shots.map((s, idx) => (
            <div
              key={idx}
              className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-bold text-white z-10"
              style={{ left: s.x, top: s.y }}
            >
              •
            </div>
          ))}

          {/* Aim Reticle Cursor */}
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: aimPos.x, top: aimPos.y }}
          >
            <Crosshair className="w-8 h-8 text-amber-400 opacity-90 animate-pulse" />
          </div>
        </div>

        {/* Feedback alert */}
        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-bold text-xs text-amber-300">
          {lastShotFeedback || 'Aim with your cursor and click to loose an arrow!'}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOverModalOpen}
        isWin={score >= 120}
        score={score}
        highScore={highScore}
        title={score >= 150 ? 'Master Bowman!' : 'Quiver Empty!'}
        message={`You scored a total of ${score}/250 points!`}
        customStats={[
          { label: 'Arrows Fired', value: '5/5' },
          { label: 'Average per Shot', value: `${Math.round(score / 5)} pts` },
        ]}
        onPlayAgain={initGame}
        onHome={onBack}
      />
    </GameContainer>
  );
};
