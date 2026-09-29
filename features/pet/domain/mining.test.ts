import { describe, expect, it } from 'vitest';
import { GRASS_PER_ATTENDANCE, feedBlock, grassForSubmission, isWorking } from './mining';

describe('grassForSubmission', () => {
  it('오늘 첫 제출이면 잔디를 준다', () => {
    expect(grassForSubmission('2026-09-28', '2026-09-29')).toBe(GRASS_PER_ATTENDANCE);
    expect(grassForSubmission(null, '2026-09-29')).toBe(GRASS_PER_ATTENDANCE);
  });

  it('오늘 이미 공부했으면 0', () => {
    expect(grassForSubmission('2026-09-29', '2026-09-29')).toBe(0);
  });
});

describe('feedBlock', () => {
  it('잔디가 있고 프리즈가 덜 찼으면 줄 수 있다', () => {
    expect(feedBlock(1, 0, 2)).toBeNull();
  });

  it('잔디가 없으면 no_grass', () => {
    expect(feedBlock(0, 0, 2)).toBe('no_grass');
  });

  it('프리즈가 가득이면 freeze_full', () => {
    expect(feedBlock(3, 2, 2)).toBe('freeze_full');
  });
});

describe('isWorking', () => {
  const now = new Date('2026-09-29T12:00:00Z');

  it('먹이 효과가 남아 있으면 일하는 중', () => {
    expect(isWorking('2026-09-29T13:00:00Z', now)).toBe(true);
  });

  it('끝났거나 먹은 적이 없으면 쉬는 중', () => {
    expect(isWorking('2026-09-29T11:00:00Z', now)).toBe(false);
    expect(isWorking(null, now)).toBe(false);
  });
});
