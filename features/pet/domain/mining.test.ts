import { describe, expect, it } from 'vitest';
import { MINE_PER_PRISM, applyCheckIn, minePerCheckIn } from './mining';

describe('minePerCheckIn', () => {
  it('고양이가 많을수록 많이 캔다', () => {
    expect(minePerCheckIn(1)).toBe(2);
    expect(minePerCheckIn(4)).toBe(5);
    expect(minePerCheckIn(8)).toBe(9);
  });

  it('고양이 수를 못 읽어도 최소 1마리로 본다', () => {
    expect(minePerCheckIn(0)).toBe(2);
  });

  it('매일 출석하면 1마리는 5일, 8마리는 이틀 안에 프리즘 1개', () => {
    expect(Math.ceil(MINE_PER_PRISM / minePerCheckIn(1))).toBe(5);
    expect(Math.ceil(MINE_PER_PRISM / minePerCheckIn(8))).toBeLessThanOrEqual(2);
  });
});

describe('applyCheckIn', () => {
  it('게이지가 10을 넘으면 프리즘이 나오고 나머지는 남는다', () => {
    expect(applyCheckIn(8, 3)).toEqual({ gain: 4, minted: 1, gauge: 2 });
  });

  it('덜 찼으면 게이지만 오른다', () => {
    expect(applyCheckIn(0, 1)).toEqual({ gain: 2, minted: 0, gauge: 2 });
  });
});
