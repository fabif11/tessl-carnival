import { playerName } from './player';
import { browserStorage, memoryStorage, type CarnivalStorage } from './storage';

export interface ScoreEntry {
  gameId: string;
  score: number;
  /** When the score was recorded, in milliseconds since the epoch. */
  at: number;
  /** The player's name. Scores recorded before players had names have none. */
  player?: string;
}

const STORAGE_KEY = 'tessl-carnival:scores';
const MAX_ENTRIES_PER_GAME = 50;

const byRank = (a: ScoreEntry, b: ScoreEntry) => b.score - a.score || a.at - b.at;

export function createScoreBoard(
  storage: CarnivalStorage,
  now: () => number = Date.now,
  player: () => string | undefined = () => undefined,
) {
  let store = storage;

  function load(): ScoreEntry[] {
    try {
      const parsed: unknown = JSON.parse(store.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? (parsed as ScoreEntry[]) : [];
    } catch {
      return [];
    }
  }

  function top(gameId: string, count: number): ScoreEntry[] {
    return load()
      .filter((entry) => entry.gameId === gameId)
      .sort(byRank)
      .slice(0, count);
  }

  /** The top scores across every game, highest first. */
  function leaders(count: number): ScoreEntry[] {
    return load().sort(byRank).slice(0, count);
  }

  function record(gameId: string, score: number): ScoreEntry {
    if (!Number.isFinite(score) || score < 0) {
      throw new Error(`Score must be a non-negative number, got ${score}`);
    }
    const name = player();
    const entry: ScoreEntry = { gameId, score: Math.round(score), at: now() };
    if (name !== undefined) entry.player = name;
    const others = load().filter((e) => e.gameId !== gameId);
    const kept = [...top(gameId, MAX_ENTRIES_PER_GAME - 1), entry];
    const value = JSON.stringify([...others, ...kept]);
    try {
      store.setItem(STORAGE_KEY, value);
    } catch {
      // Storage can refuse a write, for example when it's full or blocked. A
      // round must still end normally, so keep scores for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, value);
    }
    return entry;
  }

  function best(gameId: string): number | undefined {
    return top(gameId, 1)[0]?.score;
  }

  return { record, best, top, leaders };
}

const board = createScoreBoard(browserStorage(), Date.now, playerName);

/** Every game reports its final score through here. */
export const recordScore = board.record;
export const bestScore = board.best;
export const topScores = board.top;
export const leaderScores = board.leaders;
