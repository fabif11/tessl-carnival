import { CARNIVAL_PRIZES, prizeFor, type CarnivalGame, type ScoreEntry } from './carnival';

export const ANONYMOUS = 'Anonymous';

export interface LeaderboardRow {
  player: string;
  game: string;
  score: number;
  /** The prize the score won, or undefined if it won none. */
  prize: string | undefined;
}

/**
 * The midway's leaderboard rows for the top scores across every game. A score
 * from before players had names shows as anonymous.
 */
export function leaderboardRows(
  entries: readonly ScoreEntry[],
  gameFor: (gameId: string) => CarnivalGame | undefined,
): LeaderboardRow[] {
  return entries.map((entry) => {
    const game = gameFor(entry.gameId);
    return {
      player: entry.player ?? ANONYMOUS,
      game: game?.name ?? entry.gameId,
      score: entry.score,
      prize: prizeFor(entry.score, game?.prizes ?? CARNIVAL_PRIZES)?.name,
    };
  });
}
