export type CarnivalStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Storage that lasts for this page load only. */
export function memoryStorage(): CarnivalStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
  };
}

export function browserStorage(): CarnivalStorage {
  try {
    return window.localStorage;
  } catch {
    // Private windows and test runs: keep data for this page load only.
    return memoryStorage();
  }
}
