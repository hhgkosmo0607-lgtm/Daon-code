import { describe, expect, it } from 'vitest';
import {
  MAX_HOURS,
  POINTS_PER_PRISM,
  collectMining,
  hoursToNextPrism,
  minedHours,
  pendingPrisms,
  pointsPerHour,
} from './mining';

const at = (h: number) => new Date(Date.UTC(2026, 8, 30, 0, 0, 0) + h * 3_600_000);

describe('pointsPerHour', () => {
  it('팀 채굴력이 클수록 시간당 많이 캔다', () => {
    expect(pointsPerHour(1)).toBeCloseTo(0.8);
    expect(pointsPerHour(8)).toBeCloseTo(3.6);
    expect(pointsPerHour(24)).toBeCloseTo(10);
  });

  it('채굴력을 못 읽어도 최소 1로 본다', () => {
    expect(pointsPerHour(0)).toBeCloseTo(0.8);
  });

  it('하루치가 예전 출석 방식과 비슷하다 (치즈만 약 5일, 코인 펫 8마리 1~2일에 프리즘 1개)', () => {
    expect(POINTS_PER_PRISM / (pointsPerHour(1) * 24)).toBeGreaterThan(4.5);
    expect(POINTS_PER_PRISM / (pointsPerHour(1) * 24)).toBeLessThan(5.5);
    expect(POINTS_PER_PRISM / (pointsPerHour(8) * 24)).toBeLessThan(1.5);
  });
});

describe('minedHours', () => {
  it('지난번에 받은 뒤로 흐른 시간, 최대 MAX_HOURS', () => {
    expect(minedHours(at(0), at(5))).toBe(5);
    expect(minedHours(at(0), at(100))).toBe(MAX_HOURS);
  });

  it('시계가 거꾸로면 0', () => {
    expect(minedHours(at(5), at(0))).toBe(0);
  });
});

describe('collectMining', () => {
  it('쌓인 게이지가 100을 넘으면 프리즘이 나오고 나머지는 남는다', () => {
    // 채굴력 24 → 시간당 10, 12시간 → 120
    const r = collectMining(30, at(0), 24, at(12));
    expect(r.hours).toBe(12);
    expect(r.gained).toBeCloseTo(120);
    expect(r.minted).toBe(1);
    expect(r.points).toBeCloseTo(50);
  });

  it('24시간이 넘게 안 들어와도 24시간치만 받는다', () => {
    const r = collectMining(0, at(0), 1, at(72));
    expect(r.hours).toBe(MAX_HOURS);
    expect(r.gained).toBeCloseTo(0.8 * MAX_HOURS);
  });
});

describe('hoursToNextPrism', () => {
  it('남은 게이지 ÷ 시간당 게이지', () => {
    expect(hoursToNextPrism(60, 24)).toBeCloseTo(4);
  });
});

describe('pendingPrisms', () => {
  it('남은 게이지 + 쌓인 시간을 프리즘 개수로 (소수)', () => {
    // 게이지 50 + 채굴력 24(시간당 10) × 8시간 = 130 → 1.3개
    expect(pendingPrisms(50, at(0), 24, at(8))).toBeCloseTo(1.3);
  });

  it('24시간이 넘어도 24시간치까지만', () => {
    expect(pendingPrisms(0, at(0), 1, at(99))).toBeCloseTo((0.8 * 24) / 100);
  });
});
