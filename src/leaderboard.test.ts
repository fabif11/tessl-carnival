import { describe, expect, it } from 'vitest';
import type { CarnivalGame } from './carnival';
import { leaderboardRows } from './leaderboard';

const game = (id: string, name: string, extra: Partial<CarnivalGame> = {}): CarnivalGame => ({
  id,
  name,
  description: '',
  start: () => () => {},
  ...extra,
});

const games = new Map([
  ['water-cannon', game('water-cannon', 'Water Cannon')],
  ['ring-toss', game('ring-toss', 'Ring Toss', { prizes: [{ name: 'Lollipop', minScore: 5 }] })],
]);

describe('leaderboardRows', () => {
  it("shows each score's player, game and prize", () => {
    const rows = leaderboardRows(
      [
        { gameId: 'water-cannon', score: 210, at: 1, player: 'Ada' },
        { gameId: 'ring-toss', score: 6, at: 2, player: 'Grace' },
      ],
      (id) => games.get(id),
    );
    expect(rows).toEqual([
      { player: 'Ada', game: 'Water Cannon', score: 210, prize: 'Goldfish' },
      { player: 'Grace', game: 'Ring Toss', score: 6, prize: 'Lollipop' },
    ]);
  });

  it('still shows a score without a name or a prize', () => {
    const rows = leaderboardRows([{ gameId: 'water-cannon', score: 40, at: 1 }], (id) =>
      games.get(id),
    );
    expect(rows).toEqual([
      { player: 'Anonymous', game: 'Water Cannon', score: 40, prize: undefined },
    ]);
  });
});
