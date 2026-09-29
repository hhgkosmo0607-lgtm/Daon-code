import { describe, expect, it } from 'vitest';
import {
  ANIMS,
  CELL_H,
  CELL_W,
  SHEET_H,
  SHEET_W,
  frameOrigin,
  nextWalkTarget,
  pickActivity,
} from './catSheet';

describe('frameOrigin', () => {
  it('줄 번호와 프레임 순번으로 칸 위치를 계산하고, 프레임 수를 넘으면 처음으로 돈다', () => {
    expect(frameOrigin('walk', 0)).toEqual({ x: 0, y: CELL_H });
    expect(frameOrigin('code', 3)).toEqual({ x: 3 * CELL_W, y: 5 * CELL_H });
    expect(frameOrigin('mine', 2)).toEqual(frameOrigin('mine', 0));
  });

  it('모든 동작이 시트 안에 들어간다', () => {
    for (const { row, frames } of Object.values(ANIMS)) {
      expect(frames * CELL_W).toBeLessThanOrEqual(SHEET_W);
      expect((row + 1) * CELL_H).toBeLessThanOrEqual(SHEET_H);
    }
  });
});

describe('pickActivity', () => {
  it('난수 구간별로 할 일을 고른다', () => {
    expect(pickActivity(0)).toBe('wander');
    expect(pickActivity(0.5)).toBe('mine');
    expect(pickActivity(0.8)).toBe('code');
    expect(pickActivity(0.9)).toBe('video');
    expect(pickActivity(0.99)).toBe('nap');
  });
});

describe('nextWalkTarget', () => {
  it('길이 없으면 0', () => {
    expect(nextWalkTarget(0, 0, 0.5)).toBe(0);
  });

  it('충분히 먼 곳이면 난수 위치 그대로', () => {
    expect(nextWalkTarget(0, 300, 0.5)).toBe(150);
  });

  it('너무 가까우면 최소 거리만큼 이동', () => {
    expect(nextWalkTarget(150, 300, 0.5)).toBe(190);
  });

  it('오른쪽 끝 근처에서 가까운 곳이 뽑히면 왼쪽으로 간다', () => {
    expect(nextWalkTarget(300, 300, 0.99)).toBe(260);
  });
});
