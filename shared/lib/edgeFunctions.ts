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
    freezeCount: number;
    freezeUsed: boolean;
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
