/*
 * 스트릭 계산.
 *
 * 타임존을 Asia/Seoul로 고정하는 게 핵심이다.
 * 서버(UTC) 기준으로 날짜를 판단하면, 한국 시간 밤 11시에 푼 학습이
 * 다른 날짜로 기록되어 스트릭이 잘못 계산된다. (기획서 7번)
 */

const TIMEZONE = 'Asia/Seoul';

/** 주어진 시각을 한국 날짜(YYYY-MM-DD 문자열)로 변환 */
export function toKstDateString(date: Date = new Date()): string {
  // en-CA 로케일은 YYYY-MM-DD 형식을 반환한다
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** 두 날짜 문자열(YYYY-MM-DD)의 차이를 일 단위로 */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export interface StreakInput {
  currentStreak: number;
  /** 마지막으로 학습한 한국 기준 날짜 (YYYY-MM-DD), 없으면 null */
  lastStudyDate: string | null;
  /** 보유한 스트릭 프리즈 개수 */
  freezeCount: number;
  /** 이번 학습이 일어난 한국 기준 날짜 */
  today: string;
}

export interface StreakResult {
  streak: number;
  freezeCount: number;
  /** 프리즈를 사용해서 끊길 뻔한 스트릭을 방어했는지 */
  freezeUsed: boolean;
}

/**
 * 학습 완료 시 스트릭을 갱신한다.
 * - 같은 날 다시 학습 → 변화 없음
 * - 어제 학습했으면 → +1
 * - 하루 건너뛴 경우(2일 차이) → 프리즈가 있으면 소모해서 유지, 없으면 1로 리셋
 * - 그보다 오래 쉬었으면 → 1로 리셋
 */
export function updateStreak(input: StreakInput): StreakResult {
  const { currentStreak, lastStudyDate, freezeCount, today } = input;

  if (!lastStudyDate) {
    return { streak: 1, freezeCount, freezeUsed: false };
  }

  const gap = daysBetween(lastStudyDate, today);

  if (gap <= 0) {
    // 같은 날 재학습 — 스트릭 변화 없음
    return { streak: currentStreak, freezeCount, freezeUsed: false };
  }

  if (gap === 1) {
    return { streak: currentStreak + 1, freezeCount, freezeUsed: false };
  }

  if (gap === 2 && freezeCount > 0) {
    // 하루 빠졌지만 프리즈로 방어
    return { streak: currentStreak + 1, freezeCount: freezeCount - 1, freezeUsed: true };
  }

  return { streak: 1, freezeCount, freezeUsed: false };
}
