import lessonsData from '../../../content/lessons.json' with { type: 'json' };

import { QUESTION_BANK } from './questionBank.generated.ts';
import type { Lesson, Question } from '../../../features/lesson/domain/types.ts';

/*
 * submitAnswer가 채점 기준으로 쓰는 "정답 원본"을 읽어오는 곳.
 *
 * features/lesson/data/contentRepository.ts와 같은 구조를 그대로 따른다.
 * 다만 Deno는 JSON import에 `with { type: "json" }` 어사션이 필요하고
 * Metro(RN 번들러)는 이 문법을 지원하지 않아서, 로더 파일만 런타임별로 나눴다.
 * 데이터 원본(content/*.json)은 하나이고 이중 관리하지 않는다.
 *
 * QUESTION_BANK는 content/questions/*.json 목록으로 자동 생성된다.
 * 레슨 JSON을 추가·삭제하면 `npm run gen:content` 후 재배포할 것.
 */

/** 배치고사가 다루는 트랙. contentRepository.ts의 DEFAULT_TRACK_ID와 같아야 한다. */
const DEFAULT_TRACK_ID = 'ai-coding';

/** 한 트랙의 레슨을 학습 순서대로. 트랙마다 stage 번호가 1부터 다시 시작하므로 반드시 트랙으로 먼저 거른다. */
function getLessons(trackId: string): Lesson[] {
  return (lessonsData.lessons as Lesson[])
    .filter((l) => l.trackId === trackId)
    .sort((a, b) => (a.stage !== b.stage ? a.stage - b.stage : a.orderNo - b.orderNo));
}

export function getLesson(lessonId: string): Lesson | undefined {
  return (lessonsData.lessons as Lesson[]).find((l) => l.id === lessonId);
}

export function getQuestions(lessonId: string): Question[] {
  const raw = QUESTION_BANK[lessonId];
  return raw ? (raw as Question[]) : [];
}

/** 이 레슨을 완료하면 잠금 해제할 다음 레슨 (같은 트랙 안에서의 순서 기준) */
export function getNextLesson(lessonId: string): Lesson | undefined {
  const lesson = getLesson(lessonId);
  if (!lesson) return undefined;
  const lessons = getLessons(lesson.trackId);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1 || idx === lessons.length - 1) return undefined;
  return lessons[idx + 1];
}

/** 배치고사 5문제. features/lesson/data/contentRepository.ts의 동명 함수와 동일해야 한다. */
const PLACEMENT_QUESTION_IDS = ['2-2-q1', '2-4-q1', '2-5-q1', '2-6-q1', '3-3-q1'];

export function getPlacementQuestions(): Question[] {
  return PLACEMENT_QUESTION_IDS.map((id) => {
    const lessonId = id.split('-q')[0];
    return getQuestions(lessonId).find((q) => q.id === id);
  }).filter((q): q is Question => q !== undefined);
}

/** startLessonId까지(포함) 순서상 앞서는 모든 레슨. 배치고사 통과 시 건너뛴 레슨을 열어둘 때 쓴다. */
export function getLessonsUpTo(startLessonId: string): Lesson[] {
  const lessons = getLessons(DEFAULT_TRACK_ID);
  const idx = lessons.findIndex((l) => l.id === startLessonId);
  if (idx === -1) return [];
  return lessons.slice(0, idx + 1);
}
