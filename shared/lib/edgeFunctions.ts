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

export interface PurchasePetResult {
  coins: number;
  prisms: number;
  ownedPets: string[];
  teamPets: string[];
}

/** 상점에서 펫 1마리 구매 (코인 펫은 코인, 프리즘 펫은 프리즘). 팀에 자리가 있으면 팀에도 들어간다. */
export async function purchasePet(petId: string): Promise<PurchasePetResult> {
  return invokeFunction<PurchasePetResult>('purchase', { item: 'pet', petId });
}

/** 팀(화면에 나오고 채굴하는 펫, 최대 8마리)을 정한다 */
export async function setTeam(team: string[]): Promise<{ teamPets: string[] }> {
  return invokeFunction<{ teamPets: string[] }>('set-team', { team });
}

export interface ExchangeResult {
  coins: number;
  prisms: number;
}

/** 프리즘 n개를 코인으로 바꾼다 (EXCHANGE_BUNDLES 중 하나). 프리즘이 모자라면 한국어 메시지로 에러가 난다. */
export async function exchangePrisms(prisms: number): Promise<ExchangeResult> {
  return invokeFunction<ExchangeResult>('purchase', { item: 'coins', prisms });
}

export interface CollectMiningResult {
  /** 이번에 받은 채굴 시간 (최대 24) */
  hours: number;
  /** 이번에 쌓인 게이지 */
  gained: number;
  /** 새로 나온 프리즘 */
  minted: number;
  /** 일한 팀 펫 수 */
  team: number;
  minePoints: number;
  prisms: number;
  collectedAt: string;
}

/** 팀 펫이 지난번 뒤로 캔 만큼(최대 24시간치) 받는다. 자주 불러도 흐른 시간만큼만 준다. */
export async function collectMining(): Promise<CollectMiningResult> {
  return invokeFunction<CollectMiningResult>('collect-mining', {});
}

export interface RepairStreakResult {
  prisms: number;
  streak: number;
}

/** 하루 빠진 스트릭을 프리즘으로 지킨다. 사용자가 직접 눌렀을 때만 부른다. */
export async function repairStreak(): Promise<RepairStreakResult> {
  return invokeFunction<RepairStreakResult>('repair-streak', {});
}

export type AdminAction =
  | { action: 'grant'; coins?: number; prisms?: number }
  | { action: 'rewind_mining' }
  | { action: 'miss_day' }
  | { action: 'reset_pets' };

/** 운영자 테스트 도구. 운영자 계정이 아니면 에러가 난다. */
export async function adminTool(request: AdminAction): Promise<{ ok: true }> {
  return invokeFunction<{ ok: true }>('admin-tools', request);
}
