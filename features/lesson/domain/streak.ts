/*
 * 스트릭 계산.
 *
 * 타임존을 Asia/Seoul로 고정하는 게 핵심이다.
 * 서버(UTC) 기준으로 날짜를 판단하면, 한국 시간 밤 11시에 푼 학습이
 * 다른 날짜로 기록되어 스트릭이 잘못 계산된다. (기획서 7번)
 */

/** 한국은 서머타임이 없어서 항상 UTC+9다 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 주어진 시각을 한국 날짜(YYYY-MM-DD 문자열)로 변환.
 * toLocaleDateString(timeZone)은 기기·JS 엔진(Hermes 등)마다 형식이 달라질 수 있어서
 * 쓰지 않고, UTC+9만큼 옮긴 뒤 ISO 문자열의 날짜 부분을 자른다.
 */
export function toKstDateString(date: Date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
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
  /** 이번 학습이 일어난 한국 기준 날짜 */
  today: string;
}

export interface StreakResult {
  streak: number;
}

/**
 * 학습 완료 시 스트릭을 갱신한다.
 * - 같은 날 다시 학습 → 변화 없음
 * - 어제 학습했으면 → +1
 * - 그보다 오래 쉬었으면 → 1로 리셋
 *
 * 하루 빠진 스트릭은 자동으로 지켜 주지 않는다. 사용자가 홈에서 프리즘을 써서
 * 직접 복구하면(repair-streak) 마지막 학습일이 어제로 바뀌어 여기서 +1로 이어진다.
 */
export function updateStreak(input: StreakInput): StreakResult {
  const { currentStreak, lastStudyDate, today } = input;
  if (!lastStudyDate) return { streak: 1 };

  const gap = daysBetween(lastStudyDate, today);
  if (gap <= 0) return { streak: currentStreak };
  return { streak: gap === 1 ? currentStreak + 1 : 1 };
}

/**
 * 지금 스트릭 상태.
 *   none       학습 기록 없음
 *   active     오늘이나 어제 학습 — 오늘 풀면 이어진다
 *   repairable 딱 하루 빠짐 — 프리즘을 쓰면 지킬 수 있다 (안 쓰고 레슨을 풀면 1부터)
 *   broken     이틀 이상 빠짐 — 끊겼다
 */
export type StreakStatus = 'none' | 'active' | 'repairable' | 'broken';

export function streakStatus(lastStudyDate: string | null, today: string): StreakStatus {
  if (!lastStudyDate) return 'none';
  const gap = daysBetween(lastStudyDate, today);
  if (gap <= 1) return 'active';
  return gap === 2 ? 'repairable' : 'broken';
}

export interface DisplayStreakInput {
  /** DB에 저장된 스트릭 (마지막 학습 시점 기준) */
  savedStreak: number;
  lastStudyDate: string | null;
  /** 오늘 한국 기준 날짜 */
  today: string;
}

/**
 * 화면에 보여줄 "지금" 스트릭.
 *
 * DB의 streak는 레슨을 제출할 때만 갱신되므로, 며칠 쉬면 끊긴 스트릭이
 * 그대로 남아있다. 아직 이어가거나 복구할 수 있으면 저장된 값을, 끊겼으면 0을 돌려준다.
 */
export function displayStreak(input: DisplayStreakInput): number {
  const status = streakStatus(input.lastStudyDate, input.today);
  return status === 'active' || status === 'repairable' ? input.savedStreak : 0;
}
