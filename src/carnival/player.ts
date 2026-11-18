import { browserStorage, memoryStorage, type CarnivalStorage } from './storage';

const STORAGE_KEY = 'tessl-carnival:player';
export const MAX_NAME_LENGTH = 20;

/** Trims and shortens a name, or gives undefined when nothing is left. */
export function cleanName(name: string): string | undefined {
  const cleaned = name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH).trim();
  return cleaned === '' ? undefined : cleaned;
}

export function createPlayer(storage: CarnivalStorage) {
  let store = storage;

  function name(): string | undefined {
    try {
      return cleanName(store.getItem(STORAGE_KEY) ?? '');
    } catch {
      return undefined;
    }
  }

  /** Remembers the player's name. An empty name makes them anonymous again. */
  function setName(next: string): string | undefined {
    const cleaned = cleanName(next);
    try {
      store.setItem(STORAGE_KEY, cleaned ?? '');
    } catch {
      // Storage can refuse a write: remember the name for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, cleaned ?? '');
    }
    return cleaned;
  }

  return { name, setName };
}

const player = createPlayer(browserStorage());

export const playerName = player.name;
export const setPlayerName = player.setName;
