import type { Question } from './types';

/*
 * 채점·XP 계산 규칙을 순수 함수로 모아둔 곳.
 *
 * 중요: 실제 XP 지급은 반드시 서버(submitAnswer Edge Function)에서 계산한다.
 * 여기 있는 함수는 두 가지 용도다.
 *   1) 문제 풀이 중 화면에 즉시 정오답 피드백을 주기 위한 클라이언트 계산
 *   2) Edge Function이 같은 규칙을 쓰도록 하는 "규칙의 기준점"
 * 클라이언트 계산 결과는 신뢰하지 않고, 서버가 다시 계산한 값이 최종이다.
 */

/** 한 문제의 정오답 판정 */
export function isCorrect(question: Question, submitted: number | number[]): boolean {
  if (Array.isArray(question.answer)) {
    if (!Array.isArray(submitted)) return false;
    if (submitted.length !== question.answer.length) return false;
    return question.answer.every((v, i) => submitted[i] === v);
  }
  return submitted === question.answer;
}

export const XP_PER_LESSON = 10;
export const XP_PERFECT_BONUS = 5;
export const XP_DAILY_GOAL_BONUS = 20;

/** 게스트(익명) 계정은 정상 XP의 80%만 지급한다 (기획서 6번) */
export const GUEST_XP_RATE = 0.8;

export interface XpInput {
  /** 맞힌 문제 수 */
  correctCount: number;
  /** 전체 문제 수 */
  totalCount: number;
  /** 이 레슨을 이미 완료한 적이 있는가 (재도전이면 XP 미지급) */
  alreadyCompleted: boolean;
  /** 익명(게스트) 계정인가 */
  isAnonymous: boolean;
  /** 이번 제출로 하루 목표를 처음 넘기는가 (그날 1회만 지급) */
  reachesDailyGoalFirstTime: boolean;
}

export interface XpResult {
  lessonXp: number;
  perfectBonus: number;
  dailyGoalBonus: number;
  total: number;
}

/**
 * 레슨 제출 1건에 대해 지급할 XP를 계산한다.
 * - 이미 완료한 레슨의 재도전은 0 XP (best_score만 갱신 대상)
 * - 게스트는 80% (반올림)
 * - 하루 목표 보너스는 그날 최초 1회만
 */
export function calculateXp(input: XpInput): XpResult {
  const zero: XpResult = { lessonXp: 0, perfectBonus: 0, dailyGoalBonus: 0, total: 0 };

  if (input.alreadyCompleted) {
    return zero;
  }

  const rate = input.isAnonymous ? GUEST_XP_RATE : 1;

  const lessonXp = Math.round(XP_PER_LESSON * rate);
  const perfectBonus =
    input.correctCount === input.totalCount ? Math.round(XP_PERFECT_BONUS * rate) : 0;
  const dailyGoalBonus = input.reachesDailyGoalFirstTime
    ? Math.round(XP_DAILY_GOAL_BONUS * rate)
    : 0;

  return {
    lessonXp,
    perfectBonus,
    dailyGoalBonus,
    total: lessonXp + perfectBonus + dailyGoalBonus,
  };
}

/**
 * 게스트로 깎인 XP를 정식 로그인 시 돌려줄 금액.
 * (기획서 6번: "게스트로 놓친 XP를 돌려받아요" 프레이밍)
 */
export function calculatePendingBonus(guestEarnedXp: number): number {
  const fullValue = Math.round(guestEarnedXp / GUEST_XP_RATE);
  return Math.max(0, fullValue - guestEarnedXp);
}

/** 누적 XP → 레벨 (100 XP마다 1레벨) */
export function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}
