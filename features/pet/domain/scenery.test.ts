import { describe, expect, it } from 'vitest';
import { GROUND_ROWS, groundSprites } from './scenery';

describe('groundSprites', () => {
  it('요청한 폭만큼 풀과 흙을 만든다', () => {
    const { grass, soil } = groundSprites(37);
    expect(grass[0]).toHaveLength(37);
    expect(soil.every((row) => row === '#'.repeat(37))).toBe(true);
    expect(grass.length + soil.length).toBe(GROUND_ROWS);
  });

  it('폭이 0이면 빈 줄', () => {
    expect(groundSprites(0).grass[0]).toBe('');
  });
});
