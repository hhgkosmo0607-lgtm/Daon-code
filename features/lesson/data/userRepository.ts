import { supabase } from '../../../shared/lib/supabase';
import type { LessonStatus } from '../domain/types';

/*
 * 유저별 동적 데이터(진도, XP, 스트릭)를 Supabase에서 읽어온다.
 *
 * 읽기만 여기서 하고, 쓰기는 하지 않는다.
 * XP·스트릭·진도 기록은 전부 submitAnswer Edge Function이 서버에서 처리한다.
 * (RLS로 클라이언트 직접 쓰기가 막혀 있어서 시도해도 거부된다)
 */

export interface Profile {
  id: string;
  nickname: string | null;
  total_xp: number;
  level: number;
  streak: number;
  max_streak: number;
  last_study_date: string | null;
  freeze_count: number;
  daily_goal: number;
}

export interface ProgressRow {
  lesson_id: string;
  completed: boolean;
  best_score: number | null;
  attempts: number;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchProgress(userId: string): Promise<ProgressRow[]> {
  const { data, error } = await supabase
    .from('progress')
    .select('lesson_id, completed, best_score, attempts')
    .eq('user_id', userId);

  if (error) throw error;
  return data ?? [];
}

/**
 * 진도 목록을 화면이 쓰기 좋은 상태 맵으로 변환한다.
 *
 * 판정 규칙 (기획서 10번):
 *   행 없음          → locked
 *   completed=false  → open   (진행중 또는 배치고사로 건너뜀)
 *   completed=true   → completed
 */
export function toStatusMap(rows: ProgressRow[]): Record<string, LessonStatus> {
  const map: Record<string, LessonStatus> = {};
  for (const row of rows) {
    map[row.lesson_id] = row.completed ? 'completed' : 'open';
  }
  return map;
}

/** 게스트가 지금까지 받은 총 XP — 로그인 전환 시 환급 보너스 계산에 쓴다 */
export async function fetchGuestEarnedXp(userId: string): Promise<number> {
  const profile = await fetchProfile(userId);
  return profile?.total_xp ?? 0;
}
