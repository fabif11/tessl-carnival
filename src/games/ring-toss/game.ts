import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const RINGS_PER_ROUND = 10;
/** Seconds a ring spends in the air. */
export const FLIGHT_TIME = 0.6;
export const THROWER = { x: WIDTH / 2, y: HEIGHT - 40 } as const;
/** How far, in pixels, the thrower's hand sways to either side. */
export const SWAY_AMPLITUDE = 40;
/** Radians per second of the sway. */
export const SWAY_SPEED = 2.5;
/** Back row first: further back means smaller necks and more points. */
export const ROWS = [
  { y: 130, neckRadius: 10, points: 30 },
  { y: 200, neckRadius: 12, points: 20 },
  { y: 270, neckRadius: 14, points: 10 },
] as const;
const BOTTLES_PER_ROW = 5;
const RING_RADIUS = 16;

export interface Bottle {
  x: number;
  y: number;
  neckRadius: number;
  points: number;
}

export interface Ring {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** Seconds since the throw. */
  age: number;
}

export interface LandedRing {
  x: number;
  y: number;
  /** The bottle it landed on, or null for a miss. */
  bottle: Bottle | null;
}

export interface RingTossState {
  bottles: Bottle[];
  rings: Ring[];
  landed: LandedRing[];
  ringsLeft: number;
  score: number;
  /** Seconds since the round started; drives the sway. */
  time: number;
  phase: 'playing' | 'over';
}

export function createState(): RingTossState {
  const spacing = WIDTH / BOTTLES_PER_ROW;
  const bottles = ROWS.flatMap((row) =>
    Array.from({ length: BOTTLES_PER_ROW }, (_, i) => ({
      x: spacing * i + spacing / 2,
      y: row.y,
      neckRadius: row.neckRadius,
      points: row.points,
    })),
  );
  return {
    bottles,
    rings: [],
    landed: [],
    ringsLeft: RINGS_PER_ROUND,
    score: 0,
    time: 0,
    phase: 'playing',
  };
}

/** The sideways offset of the thrower's hand at `time` seconds. */
export function sway(time: number): number {
  return SWAY_AMPLITUDE * Math.sin(time * SWAY_SPEED);
}

/** A ring lands on a bottle when its centre is within the bottle's neck. */
export function isRinged(x: number, y: number, bottle: Bottle): boolean {
  return Math.hypot(x - bottle.x, y - bottle.y) <= bottle.neckRadius;
}

/** The bottle a ring landing at (x, y) goes over, if any. */
export function bottleAt(bottles: readonly Bottle[], x: number, y: number): Bottle | null {
  return bottles.find((b) => isRinged(x, y, b)) ?? null;
}

/**
 * Throws one ring at the aim point, pushed sideways by the current sway.
 * Returns false if nothing was thrown.
 */
export function toss(state: RingTossState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.ringsLeft === 0) return false;
  state.rings.push({
    fromX: THROWER.x,
    fromY: THROWER.y,
    toX: aimX + sway(state.time),
    toY: Math.min(aimY, THROWER.y - 1),
    age: 0,
  });
  state.ringsLeft -= 1;
  return true;
}

/** Where a ring in the air is now, with a small arc. */
export function ringPosition(ring: Ring): { x: number; y: number } {
  const t = Math.min(ring.age / FLIGHT_TIME, 1);
  return {
    x: ring.fromX + (ring.toX - ring.fromX) * t,
    y: ring.fromY + (ring.toY - ring.fromY) * t - Math.sin(t * Math.PI) * 60,
  };
}

/** Advances the game by `dt` seconds. */
export function step(state: RingTossState, dt: number): void {
  state.time += dt;

  const flying: Ring[] = [];
  for (const ring of state.rings) {
    ring.age += dt;
    if (ring.age < FLIGHT_TIME) {
      flying.push(ring);
      continue;
    }
    const bottle = bottleAt(state.bottles, ring.toX, ring.toY);
    if (bottle) state.score += bottle.points;
    state.landed.push({ x: ring.toX, y: ring.toY, bottle });
  }
  state.rings = flying;

  if (state.ringsLeft === 0 && state.rings.length === 0) state.phase = 'over';
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y, RING_RADIUS, RING_RADIUS * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, state: RingTossState, aim: { x: number; y: number }) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const row of ROWS) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(0, row.y + row.neckRadius * 3, WIDTH, 6);
  }

  // Missed rings lie on the floor under the bottles.
  for (const ring of state.landed) {
    if (!ring.bottle) drawRing(ctx, ring.x, ring.y, colors.muted);
  }

  for (const bottle of state.bottles) {
    const body = bottle.neckRadius * 1.8;
    ctx.fillStyle = colors.water;
    ctx.fillRect(bottle.x - body, bottle.y, body * 2, bottle.neckRadius * 3);
    ctx.fillRect(
      bottle.x - bottle.neckRadius * 0.5,
      bottle.y - bottle.neckRadius * 2,
      bottle.neckRadius,
      bottle.neckRadius * 2,
    );
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.arc(bottle.x, bottle.y - bottle.neckRadius * 2, bottle.neckRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('small', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText(String(bottle.points), bottle.x, bottle.y + bottle.neckRadius * 2);
  }

  for (const ring of state.landed) {
    if (ring.bottle) drawRing(ctx, ring.bottle.x, ring.bottle.y, colors.accent);
  }

  for (const ring of state.rings) {
    const { x, y } = ringPosition(ring);
    drawRing(ctx, x, y, colors.accent);
  }

  // The thrower's hand, swaying, with the ring it will throw next.
  const handX = THROWER.x + sway(state.time);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(handX, THROWER.y);
  ctx.lineTo(aim.x + sway(state.time), Math.min(aim.y, THROWER.y - 1));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.arc(handX, THROWER.y, 20, 0, Math.PI * 2);
  ctx.fill();
  if (state.ringsLeft > 0) drawRing(ctx, handX, THROWER.y, colors.accent);

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Rings ${state.ringsLeft}/${RINGS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of rings! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const ringToss: CarnivalGame = {
  id: 'ring-toss',
  name: 'Ring Toss',
  description: 'Land rings on the bottle necks. Bottles further back score more.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    const aim = { x: WIDTH / 2, y: ROWS[1].y };

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => Object.assign(aim, toCanvas(event));
    const onDown = (event: PointerEvent) => {
      Object.assign(aim, toCanvas(event));
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        toss(state, aim.x, aim.y);
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(ringToss.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, aim);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default ringToss;
