import lessonsData from '../../../content/lessons.json';
import questions1_2 from '../../../content/questions/1-2.json';

import type { Lesson, Question, Stage } from '../domain/types';

/*
 * 레슨·문제 콘텐츠를 읽어오는 곳.
 *
 * 콘텐츠 원본은 Supabase가 아니라 이 로컬 JSON이다. (기획서 10번)
 * 앱에 번들되므로 오프라인에서도 동작하고, 새 문제를 추가하면
 * EAS Update로 스토어 심사 없이 반영한다.
 *
 * 화면(screens)은 이 파일을 직접 부르지 않고 hooks를 거친다.
 */

// import한 JSON을 문제 id 기준으로 모아둔다.
// 레슨이 늘어나면 여기에 한 줄씩 추가한다 (스크립트로 자동 생성 예정).
const QUESTION_BANK: Record<string, unknown> = {
  '1-2': questions1_2,
};

export function getStages(): Stage[] {
  return lessonsData.stages as Stage[];
}

export function getLessons(): Lesson[] {
  return (lessonsData.lessons as Lesson[]).slice().sort((a, b) => {
    if (a.stage !== b.stage) return a.stage - b.stage;
    return a.orderNo - b.orderNo;
  });
}

export function getLesson(lessonId: string): Lesson | undefined {
  return getLessons().find((l) => l.id === lessonId);
}

export function getQuestions(lessonId: string): Question[] {
  const raw = QUESTION_BANK[lessonId];
  if (!raw) return [];
  return raw as Question[];
}

/** 콘텐츠가 준비된(문제가 실제로 있는) 레슨인지 */
export function hasContent(lessonId: string): boolean {
  return getQuestions(lessonId).length > 0;
}
