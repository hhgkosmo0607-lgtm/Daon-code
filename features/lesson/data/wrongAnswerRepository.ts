import { supabase } from '../../../shared/lib/supabase';

/*
 * 오답노트(wrong_answers) 읽기/삭제.
 *
 * 이 테이블은 progress/daily_xp/profiles와 달리 RLS가 본인 쓰기까지 허용한다
 * (0001_init.sql "upsert own wrong" 정책 — 게임 밸런스와 무관해서). 그래서
 * 채점을 Edge Function으로 보낼 필요 없이, 복습에서 맞히면 클라이언트가 바로
 * 그 문제를 오답노트에서 지운다. wrong_count 누적 자체는 submit-answer가
 * 실제 레슨 제출 때만 하므로 여기서는 건드리지 않는다.
 */

export interface WrongAnswerRow {
  question_id: string;
  wrong_count: number;
  last_wrong: string;
}

export async function fetchWrongAnswers(userId: string): Promise<WrongAnswerRow[]> {
  const { data, error } = await supabase
    .from('wrong_answers')
    .select('question_id, wrong_count, last_wrong')
    .eq('user_id', userId)
    .order('last_wrong', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchWrongAnswerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('wrong_answers')
    .select('question_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count ?? 0;
}

/** 복습에서 맞혔을 때 그 문제를 오답노트에서 뺀다 */
export async function removeWrongAnswer(userId: string, questionId: string): Promise<void> {
  const { error } = await supabase
    .from('wrong_answers')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);

  if (error) throw error;
}
