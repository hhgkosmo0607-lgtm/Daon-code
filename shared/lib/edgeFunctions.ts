import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from './supabase';

/*
 * submitAnswer Edge Function을 호출하는 곳.
 *
 * 채점·XP·스트릭 계산은 여기서 하지 않는다 — 전부 서버가 계산한 값을
 * 그대로 받아서 화면에 보여준다. (기획서 2번 아키텍처 원칙)
 */
/**
 * Edge Function 호출 공통 처리.
 *
 * 함수가 4xx/5xx로 답하면 supabase-js는 data 없이 FunctionsHttpError만 준다.
 * 그러면 서버가 보낸 한국어 메시지({ error })가 사라지고 영어 기본 문구가 뜨므로,
 * 응답 본문을 직접 꺼내서 그 메시지로 에러를 만든다.
 */
async function invokeFunction<T>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, body ? { body } : undefined);

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);

  return data as T;
}

export interface SubmitAnswerResult {
  correctCount: number;
  totalCount: number;
  alreadyCompleted: boolean;
  xp: {
    lessonXp: number;
    perfectBonus: number;
    dailyGoalBonus: number;
    total: number;
  };
  /** 이번 제출로 받은 코인 */
  coins: number;
  streak: {
    streak: number;
  };
  profile: {
    totalXp: number;
    level: number;
    streak: number;
    maxStreak: number;
    coins: number;
  };
  unlockedNextLessonId: string | null;
}

export async function submitAnswer(
  lessonId: string,
  answers: Record<string, number | number[]>
): Promise<SubmitAnswerResult> {
  return invokeFunction<SubmitAnswerResult>('submit-answer', { lessonId, answers });
}

export interface CompletePlacementResult {
  correctCount: number;
  totalCount: number;
  startLessonId: string;
}

/** 배치고사 결과 확정 + 건너뛴 레슨 열어주기. 로그인 성공 직후에만 호출한다. */
export async function completePlacement(
  answers: Record<string, number | number[]>
): Promise<CompletePlacementResult> {
  return invokeFunction<CompletePlacementResult>('complete-placement', { answers });
}

export interface PurchaseCatResult {
  coins: number;
  prisms: number;
  ownedCats: string[];
}

/** 상점에서 고양이 1마리 구매 (코인 고양이는 코인, 프리즘 고양이는 프리즘). 잔액 부족이면 한국어 메시지로 에러가 난다. */
export async function purchaseCat(catId: string): Promise<PurchaseCatResult> {
  return invokeFunction<PurchaseCatResult>('purchase', { item: 'cat', catId });
}

export interface ExchangeResult {
  coins: number;
  prisms: number;
}

/** 프리즘 n개를 코인으로 바꾼다 (EXCHANGE_BUNDLES 중 하나). 프리즘이 모자라면 한국어 메시지로 에러가 난다. */
export async function exchangePrisms(prisms: number): Promise<ExchangeResult> {
  return invokeFunction<ExchangeResult>('purchase', { item: 'coins', prisms });
}

export interface CheckInResult {
  /** 이번 출석으로 찬 게이지 (오늘 이미 받았으면 0) */
  gain: number;
  /** 이번 출석으로 나온 프리즘 */
  minted: number;
  /** 일한 고양이 수 */
  cats: number;
  mineProgress: number;
  prisms: number;
}

/** 하루 한 번 출석 — 오늘 처음이면 고양이들이 캔 만큼 게이지가 차고 프리즘이 나온다. 여러 번 불러도 하루 한 번만. */
export async function checkIn(): Promise<CheckInResult> {
  return invokeFunction<CheckInResult>('check-in', {});
}

export interface RepairStreakResult {
  prisms: number;
  streak: number;
}

/** 하루 빠진 스트릭을 프리즘으로 지킨다. 사용자가 직접 눌렀을 때만 부른다. */
export async function repairStreak(): Promise<RepairStreakResult> {
  return invokeFunction<RepairStreakResult>('repair-streak', {});
}
