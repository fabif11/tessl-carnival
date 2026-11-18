import { describe, expect, it } from 'vitest';
import {
  FLIGHT_TIME,
  RINGS_PER_ROUND,
  ROWS,
  SWAY_AMPLITUDE,
  SWAY_SPEED,
  THROWER,
  bottleAt,
  createState,
  isRinged,
  step,
  sway,
  toss,
  type Bottle,
} from './game';

const bottle: Bottle = { x: 400, y: 200, neckRadius: 12, points: 20 };

describe('ring toss', () => {
  it('starts with 10 rings and no score', () => {
    const state = createState();
    expect(RINGS_PER_ROUND).toBe(10);
    expect(state.ringsLeft).toBe(10);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('sets out a grid of bottles, three rows deep', () => {
    const state = createState();
    expect(new Set(state.bottles.map((b) => b.y)).size).toBe(3);
    expect(state.bottles).toHaveLength(15);
  });

  it('scores bottles further back higher', () => {
    const [back, middle, front] = ROWS;
    expect(back.y).toBeLessThan(middle.y);
    expect(middle.y).toBeLessThan(front.y);
    expect(back.points).toBeGreaterThan(middle.points);
    expect(middle.points).toBeGreaterThan(front.points);
  });

  it('uses one ring per toss', () => {
    const state = createState();
    expect(toss(state, 400, 200)).toBe(true);
    expect(state.ringsLeft).toBe(RINGS_PER_ROUND - 1);
    expect(state.rings).toHaveLength(1);
  });

  it('cannot toss once the rings run out', () => {
    const state = createState();
    state.ringsLeft = 0;
    expect(toss(state, 400, 200)).toBe(false);
    expect(state.rings).toHaveLength(0);
  });

  it('never lands a ring behind the thrower', () => {
    const state = createState();
    toss(state, 400, THROWER.y + 100);
    expect(state.rings[0].toY).toBeLessThan(THROWER.y);
  });

  it('pushes the ring sideways by the sway at the moment of the throw', () => {
    const state = createState();
    state.time = Math.PI / 2 / SWAY_SPEED;
    toss(state, 400, 200);
    expect(sway(state.time)).toBeCloseTo(SWAY_AMPLITUDE);
    expect(state.rings[0].toX).toBeCloseTo(400 + SWAY_AMPLITUDE);
  });

  it('detects a ring on the neck and a miss beside it', () => {
    expect(isRinged(405, 205, bottle)).toBe(true);
    expect(isRinged(400 + 13, 200, bottle)).toBe(false);
  });

  it('finds the bottle a ring lands on, or none', () => {
    const state = createState();
    const target = state.bottles[0];
    expect(bottleAt(state.bottles, target.x, target.y)).toBe(target);
    expect(bottleAt(state.bottles, -100, -100)).toBeNull();
  });

  it('scores a ring that lands on a bottle neck', () => {
    const state = createState();
    state.bottles = [{ ...bottle }];
    state.rings = [{ fromX: 400, fromY: 460, toX: 402, toY: 198, age: 0 }];
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(bottle.points);
    expect(state.rings).toHaveLength(0);
    expect(state.landed[0].bottle).toBe(state.bottles[0]);
  });

  it('does not score a ring that misses', () => {
    const state = createState();
    state.bottles = [{ ...bottle }];
    state.rings = [{ fromX: 400, fromY: 460, toX: 450, toY: 200, age: 0 }];
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(0);
    expect(state.landed[0].bottle).toBeNull();
  });

  it('does not score a ring still in the air', () => {
    const state = createState();
    state.bottles = [{ ...bottle }];
    state.rings = [{ fromX: 400, fromY: 460, toX: 400, toY: 200, age: 0 }];
    step(state, FLIGHT_TIME / 2);
    expect(state.score).toBe(0);
    expect(state.rings).toHaveLength(1);
  });

  it('keeps playing while the last ring is in the air', () => {
    const state = createState();
    state.ringsLeft = 0;
    state.rings = [{ fromX: 400, fromY: 460, toX: 400, toY: 200, age: 0 }];
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
  });

  it('ends the round when all 10 rings have landed', () => {
    const state = createState();
    for (let i = 0; i < RINGS_PER_ROUND; i++) toss(state, 400, 200);
    expect(toss(state, 400, 200)).toBe(false);
    step(state, FLIGHT_TIME);
    expect(state.landed).toHaveLength(RINGS_PER_ROUND);
    expect(state.phase).toBe('over');
  });
});
