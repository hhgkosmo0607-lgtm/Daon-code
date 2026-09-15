import { supabase } from './supabase';

/*
 * submitAnswer Edge Function을 호출하는 곳.
 *
 * 채점·XP·스트릭 계산은 여기서 하지 않는다 — 전부 서버가 계산한 값을
 * 그대로 받아서 화면에 보여준다. (기획서 2번 아키텍처 원칙)
 */
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
  };
  unlockedNextLessonId: string | null;
}

export async function submitAnswer(
  lessonId: string,
  answers: Record<string, number | number[]>
): Promise<SubmitAnswerResult> {
  const { data, error } = await supabase.functions.invoke('submit-answer', {
    body: { lessonId, answers },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as SubmitAnswerResult;
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
  const { data, error } = await supabase.functions.invoke('complete-placement', {
    body: { answers },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as CompletePlacementResult;
}
