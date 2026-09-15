import { isCorrect } from '../../lesson/domain/scoring';
import type { Question } from '../../lesson/domain/types';

/*
 * 배치고사 채점. (기획서 6번)
 *
 * 총 정답 수가 아니라 "앞에서부터 연속으로 맞힌 개수"로 채점한다.
 * Q1을 틀리고 Q5를 찍어서 맞힌 사람이 실력 이상으로 배치되는 걸 막기 위해서다.
 */
export function scorePlacementTest(
  questions: Question[],
  answers: Record<string, number | number[]>
): number {
  let consecutive = 0;
  for (const q of questions) {
    const submitted = answers[q.id];
    if (submitted !== undefined && isCorrect(q, submitted)) {
      consecutive += 1;
    } else {
      break;
    }
  }
  return consecutive;
}

/**
 * 연속 정답 개수 → 시작 레슨. (기획서 6번 배치고사 표)
 *   0개   → 1단계부터
 *   1~2개 → 2단계 중반부터 (2-3: 컴포넌트·변수 정도는 안다고 보고 건너뜀)
 *   3~4개 → 3단계부터
 *   5개   → 4단계부터
 *
 * 건너뛴 레슨은 잠그지 않는다 — 이 함수는 "어디부터 시작"만 정하고,
 * 그 이전 레슨들을 열어두는 처리는 호출부(Edge Function)에서 한다.
 */
export function startLessonFromScore(consecutiveCorrect: number): string {
  if (consecutiveCorrect <= 0) return '1-1';
  if (consecutiveCorrect <= 2) return '2-3';
  if (consecutiveCorrect <= 4) return '3-1';
  return '4-1';
}
