import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getQuestionById } from '../data/contentRepository';
import { fetchWrongAnswers, removeWrongAnswer } from '../data/wrongAnswerRepository';
import { isCorrect } from '../domain/scoring';
import type { Question } from '../domain/types';

export type Answer = number | number[] | null;

/*
 * 오답노트 복습 세션 상태.
 *
 * 기본(seedQuestions 없음)은 특정 lessonId에 묶이지 않고 여러 레슨에 흩어진
 * 오답을 DB에서 전부 모아온다 (전체 오답노트 화면용).
 *
 * seedQuestions를 넘기면 DB 조회 없이 그 목록을 큐로 바로 쓴다 — 방금 레슨을
 * 끝낸 직후 "틀린 문제 바로 다시 풀기"처럼, 어차피 방금 메모리에 있던 문제를
 * 다시 서버에서 조회할 필요가 없는 경우용 (듀오링고식 즉시 복습 흐름).
 *
 * 어느 경로든 레슨 완주가 아니라 복습이므로 XP·스트릭·progress는 전혀
 * 건드리지 않는다 — submit-answer Edge Function을 타지 않고, 맞힌 문제만
 * 그 자리에서 wrong_answers에서 지운다(그대로 두면 계속 남아있음).
 */
export function useWrongAnswers(seedQuestions?: Question[]) {
  const { user } = useAuth();
  const isSeeded = seedQuestions !== undefined;
  const [queue, setQueue] = useState<Question[]>(seedQuestions ?? []);
  const [loading, setLoading] = useState(!isSeeded);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [checked, setChecked] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);

  const load = useCallback(async () => {
    if (isSeeded) {
      setQueue(seedQuestions ?? []);
      setIndex(0);
      setAnswer(null);
      setChecked(false);
      setClearedCount(0);
      setLoading(false);
      return;
    }
    if (!user) {
      setQueue([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchWrongAnswers(user.id);
      // 콘텐츠가 개편되어 문제가 사라진 id는 조용히 건너뛴다.
      const questions = rows
        .map((row) => getQuestionById(row.question_id))
        .filter((q): q is Question => q !== undefined);
      setQueue(questions);
      setIndex(0);
      setAnswer(null);
      setChecked(false);
      setClearedCount(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오답노트를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [user, isSeeded, seedQuestions]);

  useEffect(() => {
    // 이펙트 본문에서 동기적으로 setState하지 않도록 마이크로태스크 뒤로 넘긴다.
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const current = queue[index];
  const total = queue.length;
  const isLast = index >= total - 1;
  const finished = total > 0 && index >= total;

  const lastCorrect = checked && current && answer !== null ? isCorrect(current, answer) : false;

  const check = useCallback(() => {
    if (!current || answer === null) return;
    setChecked(true);

    if (isCorrect(current, answer) && user) {
      setClearedCount((n) => n + 1);
      // 화면 흐름을 막지 않게 지우기는 그냥 흘려보낸다. 실패해도 다음에
      // 오답노트를 다시 열었을 때 여전히 남아있을 뿐 — 데이터가 깨지지 않는다.
      removeWrongAnswer(user.id, current.id).catch(() => {});
    }
  }, [current, answer, user]);

  const next = useCallback(() => {
    setChecked(false);
    setAnswer(null);
    setIndex((i) => i + 1);
  }, []);

  const canCheck = answer !== null && !checked;

  return {
    loading,
    error,
    current,
    index,
    total,
    answer,
    setAnswer,
    checked,
    lastCorrect,
    clearedCount,
    isLast,
    finished,
    canCheck,
    check,
    next,
    reload: load,
  };
}
