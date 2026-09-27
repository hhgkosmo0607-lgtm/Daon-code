import lessonsData from '../../../content/lessons.json';
import tracksData from '../../../content/tracks.json';

import { QUESTION_BANK } from './questionBank.generated';
import type { Lesson, Question, Stage, Track } from '../domain/types';

/*
 * 레슨·문제 콘텐츠를 읽어오는 곳.
 *
 * 콘텐츠 원본은 Supabase가 아니라 이 로컬 JSON이다. (기획서 10번)
 * 앱에 번들되므로 오프라인에서도 동작하고, 새 문제를 추가하면
 * EAS Update로 스토어 심사 없이 반영한다.
 *
 * 화면(screens)은 이 파일을 직접 부르지 않고 hooks를 거친다.
 */

// QUESTION_BANK(레슨 id → 문제 JSON)는 content/questions/*.json 목록으로 자동 생성된다.
// 레슨 JSON을 추가·삭제하면 `npm run gen:content`를 실행할 것.

/** 기본 트랙 — 온보딩/배치고사 등 트랙을 아직 명시하지 않은 기존 화면이 쓰는 값 */
export const DEFAULT_TRACK_ID = 'ai-coding';

export function getTracks(): Track[] {
  return tracksData as Track[];
}

export function getStages(trackId: string = DEFAULT_TRACK_ID): Stage[] {
  return (lessonsData.stages as Stage[]).filter((s) => s.trackId === trackId);
}

export function getLessons(trackId: string = DEFAULT_TRACK_ID): Lesson[] {
  return (lessonsData.lessons as Lesson[])
    .filter((l) => l.trackId === trackId)
    .sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.orderNo - b.orderNo;
    });
}

/** 어느 트랙인지 몰라도 id만으로 찾는다 (lessonId는 트랙과 무관하게 전역에서 유일하다) */
export function getLesson(lessonId: string): Lesson | undefined {
  return (lessonsData.lessons as Lesson[]).find((l) => l.id === lessonId);
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

/**
 * 문제 id 하나로 문제를 찾는다 (오답노트용 — 어느 레슨 문제인지 모르는 상태에서 조회).
 * id 형식이 "{lessonId}-q{n}" 이라는 점을 이용한다 (getPlacementQuestions와 동일한 방식).
 */
export function getQuestionById(questionId: string): Question | undefined {
  const lessonId = questionId.split('-q')[0];
  return getQuestions(lessonId).find((q) => q.id === questionId);
}

/**
 * 배치고사 5문제. (기획서 6번 — 변수/객체접근/map()/props/state 순, 난이도 오름차순)
 * 새 문제를 따로 만들지 않고, 각 개념을 대표하는 레슨의 Q1을 그대로 재사용한다.
 * (콘텐츠를 이중으로 관리하지 않기 위해 — 제작플랜 4번)
 */
const PLACEMENT_QUESTION_IDS = ['2-2-q1', '2-4-q1', '2-5-q1', '2-6-q1', '3-3-q1'];

export function getPlacementQuestions(): Question[] {
  return PLACEMENT_QUESTION_IDS.map((id) => {
    const lessonId = id.split('-q')[0];
    return getQuestions(lessonId).find((q) => q.id === id);
  }).filter((q): q is Question => q !== undefined);
}

/**
 * startLessonId까지(포함) 순서상 앞서는 모든 레슨.
 * 배치고사 통과로 건너뛴 레슨들을 "잠김"이 아니게 열어둘 때 쓴다. (기획서 10번 progress 규칙)
 */
export function getLessonsUpTo(startLessonId: string): Lesson[] {
  const lessons = getLessons();
  const idx = lessons.findIndex((l) => l.id === startLessonId);
  if (idx === -1) return [];
  return lessons.slice(0, idx + 1);
}
