import { describe, expect, it } from 'vitest';
import { cleanName, createPlayer, MAX_NAME_LENGTH } from './player';
import { memoryStorage } from './storage';

describe('player name', () => {
  it('is anonymous until the player picks a name', () => {
    expect(createPlayer(memoryStorage()).name()).toBeUndefined();
  });

  it('is remembered in storage', () => {
    const storage = memoryStorage();
    createPlayer(storage).setName('Ada');
    expect(createPlayer(storage).name()).toBe('Ada');
  });

  it('trims, squashes spaces and shortens a name', () => {
    expect(cleanName('  Ada   Lovelace ')).toBe('Ada Lovelace');
    expect(cleanName('x'.repeat(50))).toHaveLength(MAX_NAME_LENGTH);
  });

  it('goes back to anonymous for an empty name', () => {
    const player = createPlayer(memoryStorage());
    player.setName('Ada');
    expect(player.setName('   ')).toBeUndefined();
    expect(player.name()).toBeUndefined();
  });

  it('keeps the name for this page load when storage refuses a write', () => {
    const player = createPlayer({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(player.setName('Ada')).toBe('Ada');
    expect(player.name()).toBe('Ada');
  });
});
