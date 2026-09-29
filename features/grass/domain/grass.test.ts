import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildGrass,
  grassLevel,
  grassStartDate,
  studiedDays,
  weekdayIndex,
} from './grass';

describe('날짜 도우미', () => {
  it('addDays는 월·연 경계를 넘는다', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('weekdayIndex는 월요일 0, 일요일 6', () => {
    expect(weekdayIndex('2026-09-28')).toBe(0); // 월
    expect(weekdayIndex('2026-10-04')).toBe(6); // 일
  });

  it('시작일은 N주 전 월요일', () => {
    // 2026-09-30(수) 기준 3주 → 이번 주 월(09-28)에서 2주 전 월요일
    expect(grassStartDate('2026-09-30', 3)).toBe('2026-09-14');
  });
});

describe('grassLevel', () => {
  it('하루 목표(20) 기준으로 단계를 나눈다', () => {
    expect(grassLevel(0, 20)).toBe(0);
    expect(grassLevel(5, 20)).toBe(1);
    expect(grassLevel(10, 20)).toBe(2);
    expect(grassLevel(20, 20)).toBe(3);
    expect(grassLevel(40, 20)).toBe(4);
  });

  it('목표가 0이면 1로 보고 계산한다 (나누기 오류 없음)', () => {
    expect(grassLevel(1, 0)).toBe(3);
  });
});

describe('buildGrass', () => {
  const today = '2026-09-30'; // 수요일

  it('주 × 7일 격자를 만들고 마지막 열이 이번 주다', () => {
    const cols = buildGrass([], today, 4, 20);
    expect(cols).toHaveLength(4);
    expect(cols.every((c) => c.length === 7)).toBe(true);
    expect(cols[3][0].date).toBe('2026-09-28');
    expect(cols[3][2].date).toBe(today);
  });

  it('오늘 이후 칸은 future', () => {
    const last = buildGrass([], today, 1, 20)[0];
    expect(last.map((c) => c.future)).toEqual([false, false, false, true, true, true, true]);
  });

  it('XP가 있는 날에 단계와 학습일 수가 반영된다', () => {
    const cols = buildGrass(
      [
        { date: '2026-09-29', xp: 25 },
        { date: '2026-09-21', xp: 5 },
        { date: '2020-01-01', xp: 99 }, // 범위 밖은 무시
      ],
      today,
      2,
      20
    );
    expect(cols[1][1]).toMatchObject({ date: '2026-09-29', xp: 25, level: 3 });
    expect(cols[0][0]).toMatchObject({ date: '2026-09-21', level: 1 });
    expect(studiedDays(cols)).toBe(2);
  });
});
