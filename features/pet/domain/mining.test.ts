import { describe, expect, it } from 'vitest';
import { FREEZE_PRICE } from '../../shop/domain/shopItems';
import {
  FREEZE_OVERFLOW_COINS,
  GRASS_PER_ATTENDANCE,
  MINE_PER_FREEZE,
  feedBlock,
  grassForCheckIn,
  isWorking,
  minePerGrass,
} from './mining';

describe('grassForCheckIn', () => {
  it('오늘 첫 출석이면 잔디를 준다 (레슨과 무관)', () => {
    expect(grassForCheckIn('2026-09-28', '2026-09-29')).toBe(GRASS_PER_ATTENDANCE);
    expect(grassForCheckIn(null, '2026-09-29')).toBe(GRASS_PER_ATTENDANCE);
  });

  it('오늘 이미 받았으면 0', () => {
    expect(grassForCheckIn('2026-09-29', '2026-09-29')).toBe(0);
  });
});

describe('minePerGrass', () => {
  it('고양이가 많을수록 많이 캔다', () => {
    expect(minePerGrass(1)).toBe(2);
    expect(minePerGrass(4)).toBe(5);
    expect(minePerGrass(8)).toBe(9);
  });

  it('고양이 수를 못 읽어도 최소 1마리로 본다', () => {
    expect(minePerGrass(0)).toBe(2);
  });

  it('1마리는 5일, 8마리는 이틀 안에 프리즈 1개', () => {
    expect(Math.ceil(MINE_PER_FREEZE / minePerGrass(1))).toBe(5);
    expect(Math.ceil(MINE_PER_FREEZE / minePerGrass(8))).toBeLessThanOrEqual(2);
  });

  it('넘친 프리즈의 코인은 상점 가격보다 싸다 (사고팔기로 못 불림)', () => {
    expect(FREEZE_OVERFLOW_COINS).toBeLessThan(FREEZE_PRICE);
  });
});

describe('feedBlock', () => {
  it('잔디가 있으면 줄 수 있고, 없으면 no_grass', () => {
    expect(feedBlock(1)).toBeNull();
    expect(feedBlock(0)).toBe('no_grass');
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
