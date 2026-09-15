/*
 * 온보딩에서 수집하는 답변들의 타입.
 * (기획서 6번 온보딩 흐름 참고)
 */
export type Purpose =
  | 'understand-code'
  | 'fix-errors'
  | 'better-prompts'
  | 'finish-projects';

export type SelfLevel =
  | 'never-seen-code'
  | 'vibe-coded-no-code-knowledge'
  | 'reads-a-bit'
  | 'reads-and-edits';

/** 배치고사로 이어지는 두 단계만 대상. 나머지는 1단계부터 시작한다. */
export function takesPlacementTest(level: SelfLevel): boolean {
  return level === 'reads-a-bit' || level === 'reads-and-edits';
}

export type DailyGoalPreset = 'light' | 'normal' | 'hard';

/** 하루 목표 프리셋 → XP (기획서 7번 게임화 수치) */
export const DAILY_GOAL_XP: Record<DailyGoalPreset, number> = {
  light: 10,
  normal: 20,
  hard: 30,
};

export interface OnboardingAnswers {
  purposes: Purpose[];
  selfLevel: SelfLevel | null;
  dailyGoalPreset: DailyGoalPreset;
  notifyTime: string; // "HH:MM"
}
