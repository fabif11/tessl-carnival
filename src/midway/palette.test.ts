import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../carnival';
import { signs } from './palette';

describe('sign boards', () => {
  it.each(Object.entries(signs))('%s sign text meets WCAG AA on its board', (_, sign) => {
    expect(contrastRatio(sign.text, sign.board)).toBeGreaterThanOrEqual(4.5);
  });
});
