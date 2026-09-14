import lessonsData from '../../../content/lessons.json' with { type: 'json' };
import questions1_2 from '../../../content/questions/1-2.json' with { type: 'json' };

import type { Lesson, Question } from '../../../features/lesson/domain/types.ts';

/*
 * submitAnswer가 채점 기준으로 쓰는 "정답 원본"을 읽어오는 곳.
 *
 * features/lesson/data/contentRepository.ts와 같은 구조를 그대로 따른다.
 * 다만 Deno는 JSON import에 `with { type: "json" }` 어사션이 필요하고
 * Metro(RN 번들러)는 이 문법을 지원하지 않아서, 로더 파일만 런타임별로 나눴다.
 * 데이터 원본(content/*.json)은 하나이고 이중 관리하지 않는다.
 *
 * 새 레슨의 JSON을 추가하면 여기와 contentRepository.ts 양쪽에
 * import를 한 줄씩 추가해야 한다. (Phase 7 빌드 스크립트로 자동화 예정)
 */
const QUESTION_BANK: Record<string, unknown> = {
  '1-2': questions1_2,
};

function getLessons(): Lesson[] {
  return (lessonsData.lessons as Lesson[])
    .slice()
    .sort((a, b) => (a.stage !== b.stage ? a.stage - b.stage : a.orderNo - b.orderNo));
}

export function getLesson(lessonId: string): Lesson | undefined {
  return getLessons().find((l) => l.id === lessonId);
}

export function getQuestions(lessonId: string): Question[] {
  const raw = QUESTION_BANK[lessonId];
  return raw ? (raw as Question[]) : [];
}

/** 이 레슨을 완료하면 잠금 해제할 다음 레슨 (전체 순서 기준) */
export function getNextLesson(lessonId: string): Lesson | undefined {
  const lessons = getLessons();
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1 || idx === lessons.length - 1) return undefined;
  return lessons[idx + 1];
}
