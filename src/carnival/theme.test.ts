import { describe, expect, it } from 'vitest';
import { contrastRatio, theme } from './theme';

const { colors } = theme;

/** WCAG AA asks for 4.5:1 between normal-sized text and its background. */
const AA = 4.5;

describe('contrastRatio', () => {
  it('runs from 1 for the same colour to 21 for black on white', () => {
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
  });
});

describe('theme text', () => {
  const pairs = [
    ['text', 'background'],
    ['text', 'surface'],
    ['muted', 'background'],
    ['muted', 'surface'],
    ['accent', 'background'],
    ['accent', 'surface'],
    ['background', 'accent'],
  ] as const;

  it.each(pairs)('%s on %s meets WCAG AA', (text, background) => {
    expect(contrastRatio(colors[text], colors[background])).toBeGreaterThanOrEqual(AA);
  });

  it('keeps text at least 12px', () => {
    expect(Math.min(theme.font.small, theme.font.body, theme.font.title)).toBeGreaterThanOrEqual(
      12,
    );
  });
});
