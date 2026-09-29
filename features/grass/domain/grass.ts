import { daysBetween } from '../../lesson/domain/streak';

/*
 * 학습 잔디 (GitHub contribution graph). (daon-content/Daon-code_아이디어.md 3-1)
 *
 * 세로 7칸(월~일) × 가로 N주. 맨 오른쪽 열이 이번 주이고, 오늘 이후 칸은 비워 둔다.
 * 칸 색의 진하기는 하루 목표 XP(profiles.daily_goal) 기준으로 정한다.
 */

export type GrassLevel = 0 | 1 | 2 | 3 | 4;

export interface GrassCell {
  /** 한국 날짜 YYYY-MM-DD */
  date: string;
  xp: number;
  level: GrassLevel;
  /** 오늘 이후 — 그리지 않는다 */
  future: boolean;
}

export interface DailyXpRow {
  date: string;
  xp: number;
}

/** YYYY-MM-DD에 n일을 더한다 */
export function addDays(date: string, n: number): string {
  const t = new Date(`${date}T00:00:00Z`).getTime() + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** 월요일 0 ~ 일요일 6 */
export function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * 하루 XP → 칸 진하기.
 *   0            → 0 (빈 칸)
 *   목표 절반 미만 → 1
 *   목표 미만     → 2
 *   목표 달성     → 3
 *   목표 2배 이상 → 4
 */
export function grassLevel(xp: number, dailyGoal: number): GrassLevel {
  if (xp <= 0) return 0;
  const goal = Math.max(1, dailyGoal);
  if (xp >= goal * 2) return 4;
  if (xp >= goal) return 3;
  if (xp * 2 >= goal) return 2;
  return 1;
}

/** 잔디 첫 칸(가장 오래된 주의 월요일) 날짜 — DB 조회 시작일로도 쓴다 */
export function grassStartDate(today: string, weeks: number): string {
  return addDays(today, -weekdayIndex(today) - (weeks - 1) * 7);
}

/** 주 단위 열 배열을 만든다. columns[주][요일] */
export function buildGrass(
  rows: DailyXpRow[],
  today: string,
  weeks: number,
  dailyGoal: number
): GrassCell[][] {
  const xpByDate = new Map(rows.map((r) => [r.date, r.xp]));
  const start = grassStartDate(today, weeks);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      const xp = xpByDate.get(date) ?? 0;
      return { date, xp, level: grassLevel(xp, dailyGoal), future: daysBetween(today, date) > 0 };
    })
  );
}

/** 잔디 기간 동안 학습한 날 수 */
export function studiedDays(columns: GrassCell[][]): number {
  return columns.flat().filter((c) => c.xp > 0).length;
}
