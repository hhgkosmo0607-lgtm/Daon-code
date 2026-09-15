import { isCorrect } from '../../../features/lesson/domain/scoring.ts';
import type { Question } from '../../../features/lesson/domain/types.ts';

/*
 * features/onboarding/domain/placementScoring.ts와 규칙이 완전히 같아야 한다.
 *
 * 그 파일을 직접 import하지 못하는 이유: Deno는 상대 경로 import에 확장자가
 * 필수인데, placementScoring.ts 내부에서 `from '../../lesson/domain/scoring'`처럼
 * 확장자 없이 import하고 있어서(Metro 관례) Deno가 그 경로를 못 찾는다.
 * scoring.ts/types.ts처럼 내부 import가 없는 파일만 Deno에서 그대로 재사용 가능하다.
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

export function startLessonFromScore(consecutiveCorrect: number): string {
  if (consecutiveCorrect <= 0) return '1-1';
  if (consecutiveCorrect <= 2) return '2-3';
  if (consecutiveCorrect <= 4) return '3-1';
  return '4-1';
}
