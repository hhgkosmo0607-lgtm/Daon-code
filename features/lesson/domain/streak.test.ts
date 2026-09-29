import { describe, expect, it } from 'vitest';
import { daysBetween, displayStreak, streakStatus, toKstDateString, updateStreak } from './streak';

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
    expect(updateStreak({ currentStreak: 0, lastStudyDate: null, today: '2024-01-10' })).toEqual({
      streak: 1,
    });
  });

  it('같은 날 재학습 — 변화 없음', () => {
    expect(
      updateStreak({ currentStreak: 5, lastStudyDate: '2024-01-10', today: '2024-01-10' })
    ).toEqual({ streak: 5 });
  });

  it('어제 학습 — 스트릭 +1', () => {
    expect(
      updateStreak({ currentStreak: 5, lastStudyDate: '2024-01-09', today: '2024-01-10' })
    ).toEqual({ streak: 6 });
  });

  it('하루 빠짐 — 자동으로 지켜 주지 않고 1로 리셋 (복구는 사용자가 프리즘으로 직접)', () => {
    expect(
      updateStreak({ currentStreak: 5, lastStudyDate: '2024-01-08', today: '2024-01-10' })
    ).toEqual({ streak: 1 });
  });
});

describe('streakStatus', () => {
  const today = '2024-01-10';

  it('기록 없음 · 이어짐 · 복구 가능 · 끊김을 구분한다', () => {
    expect(streakStatus(null, today)).toBe('none');
    expect(streakStatus('2024-01-10', today)).toBe('active');
    expect(streakStatus('2024-01-09', today)).toBe('active');
    expect(streakStatus('2024-01-08', today)).toBe('repairable');
    expect(streakStatus('2024-01-07', today)).toBe('broken');
  });
});

describe('displayStreak', () => {
  const today = '2024-01-10';

  it('학습 기록이 없으면 0', () => {
    expect(displayStreak({ savedStreak: 3, lastStudyDate: null, today })).toBe(0);
  });

  it('이어지거나 복구할 수 있으면 저장된 스트릭', () => {
    expect(displayStreak({ savedStreak: 3, lastStudyDate: '2024-01-09', today })).toBe(3);
    expect(displayStreak({ savedStreak: 3, lastStudyDate: '2024-01-08', today })).toBe(3);
  });

  it('끊겼으면 0', () => {
    expect(displayStreak({ savedStreak: 3, lastStudyDate: '2024-01-07', today })).toBe(0);
  });
});
