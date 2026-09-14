import { describe, expect, it } from 'vitest';
import { daysBetween, toKstDateString, updateStreak } from './streak';

describe('toKstDateString', () => {
  it('UTC 기준 자정 근처 시각도 한국 날짜로 변환한다', () => {
    // 2024-01-01 15:30 UTC = 2024-01-02 00:30 KST (다음 날로 넘어가야 한다)
    const utcLateNight = new Date('2024-01-01T15:30:00Z');
    expect(toKstDateString(utcLateNight)).toBe('2024-01-02');
  });
});

describe('daysBetween', () => {
  it('같은 날은 0', () => {
    expect(daysBetween('2024-01-01', '2024-01-01')).toBe(0);
  });

  it('하루 차이는 1', () => {
    expect(daysBetween('2024-01-01', '2024-01-02')).toBe(1);
  });
});

describe('updateStreak', () => {
  it('첫 학습 — 스트릭 1로 시작', () => {
    const result = updateStreak({
      currentStreak: 0,
      lastStudyDate: null,
      freezeCount: 0,
      today: '2024-01-01',
    });
    expect(result).toEqual({ streak: 1, freezeCount: 0, freezeUsed: false });
  });

  it('같은 날 재학습 — 스트릭 유지, 변화 없음', () => {
    const result = updateStreak({
      currentStreak: 5,
      lastStudyDate: '2024-01-01',
      freezeCount: 1,
      today: '2024-01-01',
    });
    expect(result).toEqual({ streak: 5, freezeCount: 1, freezeUsed: false });
  });

  it('어제 학습 — 스트릭 +1', () => {
    const result = updateStreak({
      currentStreak: 5,
      lastStudyDate: '2024-01-01',
      freezeCount: 1,
      today: '2024-01-02',
    });
    expect(result).toEqual({ streak: 6, freezeCount: 1, freezeUsed: false });
  });

  it('하루 빠짐 + 프리즈 보유 — 프리즈를 소모해 스트릭 방어', () => {
    const result = updateStreak({
      currentStreak: 5,
      lastStudyDate: '2024-01-01',
      freezeCount: 2,
      today: '2024-01-03',
    });
    expect(result).toEqual({ streak: 6, freezeCount: 1, freezeUsed: true });
  });

  it('하루 빠짐 + 프리즈 없음 — 스트릭 1로 리셋', () => {
    const result = updateStreak({
      currentStreak: 5,
      lastStudyDate: '2024-01-01',
      freezeCount: 0,
      today: '2024-01-03',
    });
    expect(result).toEqual({ streak: 1, freezeCount: 0, freezeUsed: false });
  });

  it('이틀 넘게 빠짐 — 프리즈가 있어도 리셋 (프리즈는 하루 결석만 방어)', () => {
    const result = updateStreak({
      currentStreak: 5,
      lastStudyDate: '2024-01-01',
      freezeCount: 3,
      today: '2024-01-05',
    });
    expect(result).toEqual({ streak: 1, freezeCount: 3, freezeUsed: false });
  });
});
