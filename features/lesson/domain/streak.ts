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

  if (!canContinue(gap, freezeCount)) {
    return { streak: 1, freezeCount, freezeUsed: false };
  }

  // 하루 빠졌으면(gap 2) 프리즈로 방어
  const freezeUsed = gap === 2;
  return {
    streak: currentStreak + 1,
    freezeCount: freezeUsed ? freezeCount - 1 : freezeCount,
    freezeUsed,
  };
}

/**
 * 마지막 학습 후 gap일이 지났을 때 스트릭을 이어갈 수 있는가.
 * 어제 학습했거나, 하루 빠졌지만 프리즈가 남아 있으면 이어진다.
 */
function canContinue(gap: number, freezeCount: number): boolean {
  return gap <= 1 || (gap === 2 && freezeCount > 0);
}

export interface DisplayStreakInput {
  /** DB에 저장된 스트릭 (마지막 학습 시점 기준) */
  savedStreak: number;
  lastStudyDate: string | null;
  freezeCount: number;
  /** 오늘 한국 기준 날짜 */
  today: string;
}

/**
 * 화면에 보여줄 "지금" 스트릭.
 *
 * DB의 streak는 레슨을 제출할 때만 갱신되므로, 며칠 쉬면 끊긴 스트릭이
 * 그대로 남아있다. 오늘 학습하면 이어갈 수 있는 상태인지를 updateStreak와
 * 같은 규칙(canContinue)으로 판단해서, 이미 끊겼으면 0을 돌려준다.
 */
export function displayStreak(input: DisplayStreakInput): number {
  const { savedStreak, lastStudyDate, freezeCount, today } = input;
  if (!lastStudyDate) return 0;
  return canContinue(daysBetween(lastStudyDate, today), freezeCount) ? savedStreak : 0;
}
