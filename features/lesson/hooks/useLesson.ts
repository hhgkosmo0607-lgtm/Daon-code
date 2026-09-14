import { useCallback, useMemo, useState } from 'react';
import { getLesson, getQuestions } from '../data/contentRepository';
import { isCorrect } from '../domain/scoring';
import type { Question } from '../domain/types';

/*
 * 레슨 하나를 푸는 동안의 상태를 관리한다.
 *
 * 화면(screens)은 Supabase나 JSON 파일을 직접 모른다.
 * 이 훅만 호출하면 문제 목록·현재 문제·정오답 판정을 받을 수 있다.
 * (제작플랜 2번: Screens → Hooks 분리)
 */
export type Answer = number | number[] | null;

export function useLesson(lessonId: string) {
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);
  const questions = useMemo<Question[]>(() => getQuestions(lessonId), [lessonId]);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  /** 오답 문제 id — 레슨 종료 후 오답노트 저장에 쓴다 */
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const current = questions[index];
  const isLast = index >= questions.length - 1;
  const finished = index >= questions.length;

  const lastCorrect = useMemo(() => {
    if (!checked || !current || answer === null) return false;
    return isCorrect(current, answer);
  }, [checked, current, answer]);

  /** 확인 버튼 — 채점만 하고 화면에 피드백을 띄운다 */
  const check = useCallback(() => {
    if (!current || answer === null) return;

    const ok = isCorrect(current, answer);
    setChecked(true);

    if (ok) {
      setCorrectCount((n) => n + 1);
    } else {
      setWrongIds((ids) => [...ids, current.id]);
    }
  }, [current, answer]);

  /** 계속 버튼 — 다음 문제로 */
  const next = useCallback(() => {
    setChecked(false);
    setAnswer(null);
    setIndex((i) => i + 1);
  }, []);

  const canCheck = answer !== null && !checked;

  return {
    lesson,
    questions,
    current,
    index,
    total: questions.length,
    answer,
    setAnswer,
    checked,
    lastCorrect,
    correctCount,
    wrongIds,
    isLast,
    finished,
    canCheck,
    check,
    next,
  };
}
