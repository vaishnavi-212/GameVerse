import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '../../types';
import { GameContainer } from '../common/GameContainer';
import { GameOverModal } from '../common/GameOverModal';
import { sound } from '../../utils/audio';
import { Crosshair, Zap, Target, Sparkles, CircleDotDashed } from 'lucide-react';

interface BubbleShooterProps {
  game: GameItem;
  highScore: number;
  onGameOver: (score: number, isWin: boolean) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const ROWS = 10;
const COLS = 9;
const BOARD_W = 720;
const BOARD_H = 760;
const BUBBLE_RADIUS = 28;
const SHOOTER_Y = 690;

interface Cell { r: number; c: number; }

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const BubbleShooterGame: React.FC<BubbleShooterProps> = ({
  game, highScore, onGameOver, onBack, soundEnabled, onToggleSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [currentBubbleColor, setCurrentBubbleColor] = useState(COLORS[0]);
  const [nextBubbleColor, setNextBubbleColor] = useState(COLORS[1]);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [shots, setShots] = useState(0);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const shootingRef = useRef(false);

  const cellW = BOARD_W / COLS;
  const cellH = 58;
  const shooterX = BOARD_W / 2;

  const centerOf = useCallback((r: number, c: number) => ({
    x: c * cellW + cellW / 2,
    y: r * cellH + cellH / 2 + 24,
  }), []);

  const initGame = useCallback(() => {
    const initialGrid = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, () => (r < 5 ? randomColor() : null))
    );
    setGrid(initialGrid);
    setScore(0);
    setShots(0);
    setCurrentBubbleColor(randomColor());
    setNextBubbleColor(randomColor());
    setAimAngle(-Math.PI / 2);
    setIsGameOverModalOpen(false);
    setIsWon(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const getAngleFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return -Math.PI / 2;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    // Canvas coordinates are derived from the *rendered* rectangle, so desktop
    // scaling and mobile scaling both aim at the exact same logical point.
    const angle = Math.atan2(y - SHOOTER_Y, x - shooterX);
    return Math.max(-Math.PI + 0.04, Math.min(-0.04, angle));
  };

  const neighbors = (r: number, c: number): Cell[] => [
    { r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 },
  ].filter(({ r: nr, c: nc }) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);

  const findPlacement = (board: (string | null)[][], angle: number): Cell | null => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const valid = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === null;
    const occupied: Cell[] = [];
    board.forEach((row, r) => row.forEach((color, c) => { if (color) occupied.push({ r, c }); }));

    // Find the first physical collision on the same ray the player aimed along.
    // We calculate the ray/circle intersection instead of snapping to a random
    // cell after the click, which was the source of the "I clicked there but it
    // went somewhere else" bug.
    let collisionPoint: { x: number; y: number } | null = null;
    let hit: Cell | null = null;
    let firstT = Number.POSITIVE_INFINITY;

    for (const cell of occupied) {
      const p = centerOf(cell.r, cell.c);
      const ox = shooterX - p.x;
      const oy = SHOOTER_Y - p.y;
      const b = 2 * (ox * dx + oy * dy);
      const c = ox * ox + oy * oy - (BUBBLE_RADIUS * 2) ** 2;
      const disc = b * b - 4 * c;
      if (disc < 0) continue;
      const root = Math.sqrt(disc);
      const t1 = (-b - root) / 2;
      const t2 = (-b + root) / 2;
      const t = t1 > 0 ? t1 : (t2 > 0 ? t2 : Number.POSITIVE_INFINITY);
      if (t < firstT) {
        firstT = t;
        hit = cell;
        collisionPoint = { x: shooterX + dx * t, y: SHOOTER_Y + dy * t };
      }
    }

    // Ceiling can be the first thing hit. Compare it with bubble collisions.
    if (dy < -0.0001) {
      const ceilingY = centerOf(0, 0).y;
      const ceilingT = (ceilingY - SHOOTER_Y) / dy;
      if (ceilingT > 0 && ceilingT < firstT) {
        const x = shooterX + dx * ceilingT;
        const top = Array.from({ length: COLS }, (_, c) => ({ r: 0, c })).filter(({ c }) => valid(0, c));
        if (top.length) {
          return top.reduce((best, candidate) => Math.abs(centerOf(0, candidate.c).x - x) < Math.abs(centerOf(0, best.c).x - x) ? candidate : best);
        }
      }
    }

    if (hit && collisionPoint) {
      const candidates = neighbors(hit.r, hit.c).filter(({ r, c }) => valid(r, c));
      if (candidates.length) {
        // Attach to the empty neighbour physically closest to the point where the
        // shot actually touched the cluster. This keeps the result visually local.
        return candidates.reduce((best, candidate) => {
          const cp = centerOf(candidate.r, candidate.c);
          const bp = centerOf(best.r, best.c);
          const cd = Math.hypot(cp.x - collisionPoint!.x, cp.y - collisionPoint!.y);
          const bd = Math.hypot(bp.x - collisionPoint!.x, bp.y - collisionPoint!.y);
          return cd < bd ? candidate : best;
        });
      }
    }

    // No collision: choose the top row exactly under the aimed ray.
    const topCandidates = Array.from({ length: COLS }, (_, c) => ({ r: 0, c })).filter(({ r, c }) => valid(r, c));
    if (topCandidates.length && dy < 0) {
      const ceilingY = centerOf(0, 0).y;
      const targetX = shooterX + dx * ((ceilingY - SHOOTER_Y) / dy);
      return topCandidates.reduce((best, candidate) => Math.abs(centerOf(candidate.r, candidate.c).x - targetX) < Math.abs(centerOf(best.r, best.c).x - targetX) ? candidate : best);
    }

    return null;
  };

  const collectCluster = (board: (string | null)[][], start: Cell, color: string) => {
    const cluster: Cell[] = [];
    const seen = new Set<string>();
    const stack = [start];
    while (stack.length) {
      const cell = stack.pop()!;
      const key = `${cell.r}:${cell.c}`;
      if (seen.has(key) || board[cell.r]?.[cell.c] !== color) continue;
      seen.add(key);
      cluster.push(cell);
      neighbors(cell.r, cell.c).forEach(n => stack.push(n));
    }
    return cluster;
  };

  const dropFloating = (board: (string | null)[][]) => {
    const connected = new Set<string>();
    const stack: Cell[] = [];
    for (let c = 0; c < COLS; c++) if (board[0][c]) stack.push({ r: 0, c });
    while (stack.length) {
      const cell = stack.pop()!;
      const key = `${cell.r}:${cell.c}`;
      if (connected.has(key) || !board[cell.r]?.[cell.c]) continue;
      connected.add(key);
      neighbors(cell.r, cell.c).forEach(n => stack.push(n));
    }
    let dropped = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (board[r][c] && !connected.has(`${r}:${c}`)) { board[r][c] = null; dropped++; }
    }
    return dropped;
  };

  const shootAtAngle = (angle: number) => {
    if (!grid.length || isGameOverModalOpen || shootingRef.current) return;
    shootingRef.current = true;
    const nextGrid = grid.map(row => [...row]);
    const placement = findPlacement(nextGrid, angle);
    if (!placement) {
      sound.playGameOver();
      setIsWon(false);
      setIsGameOverModalOpen(true);
      onGameOver(score, false);
      shootingRef.current = false;
      return;
    }

    sound.playPop();
    nextGrid[placement.r][placement.c] = currentBubbleColor;
    const cluster = collectCluster(nextGrid, placement, currentBubbleColor);
    let gained = 0;

    if (cluster.length >= 3) {
      cluster.forEach(({ r, c }) => { nextGrid[r][c] = null; });
      const dropped = dropFloating(nextGrid);
      gained = cluster.length * 50 + dropped * 75;
      sound.playWin();
    } else {
      sound.playHit();
    }

    const newScore = score + gained;
    const newShots = shots + 1;
    setGrid(nextGrid);
    setScore(newScore);
    setShots(newShots);
    setCurrentBubbleColor(nextBubbleColor);
    setNextBubbleColor(randomColor());

    const remaining = nextGrid.flat().filter(Boolean).length;
    if (remaining === 0) {
      const finalScore = newScore + 500;
      setScore(finalScore);
      setIsWon(true);
      setIsGameOverModalOpen(true);
      onGameOver(finalScore, true);
      shootingRef.current = false;
      return;
    }

    // If bubbles reach the danger row, end only after the current shot has resolved.
    if (nextGrid[ROWS - 1].some(Boolean) || newShots >= 40) {
      setIsWon(false);
      setIsGameOverModalOpen(true);
      onGameOver(newScore, false);
    }
    shootingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Premium arcade backdrop
    const bg = ctx.createLinearGradient(0, 0, BOARD_W, BOARD_H);
    bg.addColorStop(0, '#16233d'); bg.addColorStop(1, '#0a1225');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = 'rgba(255,255,255,.045)';
    for (let x = 18; x < BOARD_W; x += 60) ctx.fillRect(x, 0, 1, BOARD_H);

    grid.forEach((row, r) => row.forEach((color, c) => {
      if (!color) return;
      const { x, y } = centerOf(r, c);
      const gradient = ctx.createRadialGradient(x - 8, y - 10, 3, x, y, BUBBLE_RADIUS);
      gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.16, color); gradient.addColorStop(1, color);
      ctx.beginPath(); ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke();
    }));

    // Danger line
    ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(248,113,113,.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(18, 610); ctx.lineTo(BOARD_W - 18, 610); ctx.stroke(); ctx.setLineDash([]);

    // Aim guide
    const ax = shooterX + Math.cos(aimAngle) * 190;
    const ay = SHOOTER_Y + Math.sin(aimAngle) * 190;
    ctx.beginPath(); ctx.moveTo(shooterX, SHOOTER_Y); ctx.lineTo(ax, ay);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 8]); ctx.stroke(); ctx.setLineDash([]);

    // Shooter base
    ctx.beginPath(); ctx.arc(shooterX, SHOOTER_Y, BUBBLE_RADIUS + 9, 0, Math.PI * 2);
    ctx.fillStyle = '#111827'; ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(shooterX, SHOOTER_Y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = currentBubbleColor; ctx.shadowColor = currentBubbleColor; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;

    // Next bubble dock
    ctx.beginPath(); ctx.arc(110, SHOOTER_Y, BUBBLE_RADIUS - 5, 0, Math.PI * 2);
    ctx.fillStyle = nextBubbleColor; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke();
  }, [grid, aimAngle, currentBubbleColor, nextBubbleColor, centerOf]);

  return (
    <GameContainer game={game} score={score} highScore={highScore} onBack={onBack} onRestart={initGame} soundEnabled={soundEnabled} onToggleSound={onToggleSound}>
      <div className="w-full max-w-[1320px] grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 xl:gap-8 items-stretch select-none px-2 sm:px-5">
        <section className="rounded-[32px] border-[3px] border-slate-950 bg-slate-950 p-2 sm:p-3 shadow-[12px_14px_0_rgba(15,23,42,.35)] min-h-[min(72vh,820px)] flex items-center">
          <div className="relative rounded-[24px] overflow-hidden w-full">
            <canvas
              ref={canvasRef} width={BOARD_W} height={BOARD_H}
              onPointerMove={(e) => setAimAngle(getAngleFromEvent(e))}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); }}
              onPointerUp={(e) => { const angle = getAngleFromEvent(e); setAimAngle(angle); shootAtAngle(angle); }}
              className="w-full h-auto aspect-[18/19] touch-none cursor-crosshair"
              aria-label="Bubble shooter board. Aim with pointer and release to shoot."
            />
            <div className="absolute top-3 left-3 rounded-full bg-slate-950/85 border border-white/15 px-3 py-1.5 text-[11px] font-black tracking-wide text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-300" /> AIM • RELEASE TO SHOOT
            </div>
            <div className="absolute bottom-3 right-3 rounded-full bg-rose-500/90 px-3 py-1.5 text-[10px] font-black text-white">DANGER LINE</div>
          </div>
        </section>

        <aside className="grid grid-cols-2 xl:grid-cols-1 gap-4 content-start">
          <div className="col-span-2 xl:col-span-1 rounded-3xl border-2 border-slate-800 bg-white p-6 shadow-[6px_7px_0_rgba(15,23,42,.2)]">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Bubble Score</span><Sparkles className="w-5 h-5 text-fuchsia-600" /></div>
            <div className="mt-2 text-6xl font-black tracking-tight text-slate-950">{score}</div>
            <div className="mt-2 text-xs font-bold text-slate-600">Best: {highScore}</div>
          </div>
          <div className="rounded-3xl border-2 border-slate-800 bg-cyan-50 p-5 shadow-[5px_6px_0_rgba(15,23,42,.16)]">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Loaded</div>
            <div className="mt-2 flex items-center gap-3"><span className="w-11 h-11 rounded-full border-2 border-slate-900 shadow-inner" style={{ background: currentBubbleColor }} /><span className="text-sm font-black text-slate-900">Shoot this</span></div>
          </div>
          <div className="rounded-3xl border-2 border-slate-800 bg-violet-50 p-5 shadow-[5px_6px_0_rgba(15,23,42,.16)]">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Next</div>
            <div className="mt-2 flex items-center gap-3"><span className="w-11 h-11 rounded-full border-2 border-slate-900" style={{ background: nextBubbleColor }} /><span className="text-sm font-black text-slate-900">Plan ahead</span></div>
          </div>
          <div className="col-span-2 xl:col-span-1 rounded-3xl border-2 border-slate-800 bg-amber-100 p-5 shadow-[5px_6px_0_rgba(15,23,42,.16)]">
            <div className="flex items-center gap-2 text-slate-950"><Zap className="w-5 h-5" /><span className="font-black">How scoring works</span></div>
            <p className="mt-2 text-xs leading-5 font-bold text-slate-700">Match <b className="text-slate-950">3 or more</b> of the same colour. Detached bubbles fall for bonus points.</p>
          </div>
          <div className="col-span-2 xl:col-span-1 rounded-3xl border-2 border-slate-800 bg-rose-50 p-5 shadow-[5px_6px_0_rgba(15,23,42,.16)]">
            <div className="flex items-center gap-2 text-slate-950"><CircleDotDashed className="w-5 h-5" /><span className="font-black">Shots: {shots}/40</span></div>
            <p className="mt-1 text-xs font-bold text-slate-700">Aim carefully — bubbles stick where your shot actually lands.</p>
          </div>
        </aside>
      </div>

      <GameOverModal isOpen={isGameOverModalOpen} isWin={isWon} score={score} highScore={highScore}
        title={isWon ? 'Bubble Galaxy Cleared!' : 'Bubble Run Over'}
        message={isWon ? 'You cleared every bubble and collected the clear-board bonus!' : 'The board reached the danger limit. Try a smarter colour chain!'}
        customStats={[{ label: 'Shots', value: shots }, { label: 'Goal', value: isWon ? 'CLEARED' : '40 max' }]}
        onPlayAgain={initGame} onHome={onBack} />
    </GameContainer>
  );
};
