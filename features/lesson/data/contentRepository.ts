import lessonsData from '../../../content/lessons.json';
import questions1_1 from '../../../content/questions/1-1.json';
import questions1_2 from '../../../content/questions/1-2.json';
import questions1_3 from '../../../content/questions/1-3.json';
import questions1_4 from '../../../content/questions/1-4.json';
import questions1_5 from '../../../content/questions/1-5.json';
import questions2_1 from '../../../content/questions/2-1.json';
import questions2_2 from '../../../content/questions/2-2.json';
import questions2_3 from '../../../content/questions/2-3.json';
import questions2_4 from '../../../content/questions/2-4.json';
import questions2_5 from '../../../content/questions/2-5.json';
import questions2_6 from '../../../content/questions/2-6.json';
import questions3_1 from '../../../content/questions/3-1.json';
import questions3_2 from '../../../content/questions/3-2.json';
import questions3_3 from '../../../content/questions/3-3.json';
import questions3_4 from '../../../content/questions/3-4.json';
import questions3_5 from '../../../content/questions/3-5.json';
import questions4_1 from '../../../content/questions/4-1.json';
import questions4_2 from '../../../content/questions/4-2.json';
import questions4_3 from '../../../content/questions/4-3.json';
import questions4_4 from '../../../content/questions/4-4.json';
import questions4_5 from '../../../content/questions/4-5.json';
import questions4_6 from '../../../content/questions/4-6.json';
import questions5_1 from '../../../content/questions/5-1.json';
import questions5_2 from '../../../content/questions/5-2.json';
import questions5_3 from '../../../content/questions/5-3.json';
import questions5_4 from '../../../content/questions/5-4.json';
import questions5_5 from '../../../content/questions/5-5.json';
import questions6_1 from '../../../content/questions/6-1.json';
import questions6_2 from '../../../content/questions/6-2.json';
import questions6_3 from '../../../content/questions/6-3.json';
import questions6_4 from '../../../content/questions/6-4.json';
import questions6_5 from '../../../content/questions/6-5.json';
import questions7_1 from '../../../content/questions/7-1.json';
import questions7_2 from '../../../content/questions/7-2.json';
import questions7_3 from '../../../content/questions/7-3.json';
import questions7_4 from '../../../content/questions/7-4.json';
import questions8_1 from '../../../content/questions/8-1.json';
import questions8_2 from '../../../content/questions/8-2.json';
import questions8_3 from '../../../content/questions/8-3.json';
import questions8_4 from '../../../content/questions/8-4.json';
import questions9_1 from '../../../content/questions/9-1.json';
import questions9_2 from '../../../content/questions/9-2.json';
import questions9_3 from '../../../content/questions/9-3.json';
import questions9_4 from '../../../content/questions/9-4.json';
import questions10_1 from '../../../content/questions/10-1.json';
import questions10_2 from '../../../content/questions/10-2.json';
import questions10_3 from '../../../content/questions/10-3.json';
import questions10_4 from '../../../content/questions/10-4.json';
import questions10_5 from '../../../content/questions/10-5.json';
import questions11_1 from '../../../content/questions/11-1.json';
import questions11_2 from '../../../content/questions/11-2.json';
import questions11_3 from '../../../content/questions/11-3.json';
import questions11_4 from '../../../content/questions/11-4.json';
import questions12_1 from '../../../content/questions/12-1.json';
import questions12_2 from '../../../content/questions/12-2.json';
import questions12_3 from '../../../content/questions/12-3.json';
import questions12_4 from '../../../content/questions/12-4.json';
import questions12_5 from '../../../content/questions/12-5.json';

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
  '1-1': questions1_1,
  '1-2': questions1_2,
  '1-3': questions1_3,
  '1-4': questions1_4,
  '1-5': questions1_5,
  '2-1': questions2_1,
  '2-2': questions2_2,
  '2-3': questions2_3,
  '2-4': questions2_4,
  '2-5': questions2_5,
  '2-6': questions2_6,
  '3-1': questions3_1,
  '3-2': questions3_2,
  '3-3': questions3_3,
  '3-4': questions3_4,
  '3-5': questions3_5,
  '4-1': questions4_1,
  '4-2': questions4_2,
  '4-3': questions4_3,
  '4-4': questions4_4,
  '4-5': questions4_5,
  '4-6': questions4_6,
  '5-1': questions5_1,
  '5-2': questions5_2,
  '5-3': questions5_3,
  '5-4': questions5_4,
  '5-5': questions5_5,
  '6-1': questions6_1,
  '6-2': questions6_2,
  '6-3': questions6_3,
  '6-4': questions6_4,
  '6-5': questions6_5,
  '7-1': questions7_1,
  '7-2': questions7_2,
  '7-3': questions7_3,
  '7-4': questions7_4,
  '8-1': questions8_1,
  '8-2': questions8_2,
  '8-3': questions8_3,
  '8-4': questions8_4,
  '9-1': questions9_1,
  '9-2': questions9_2,
  '9-3': questions9_3,
  '9-4': questions9_4,
  '10-1': questions10_1,
  '10-2': questions10_2,
  '10-3': questions10_3,
  '10-4': questions10_4,
  '10-5': questions10_5,
  '11-1': questions11_1,
  '11-2': questions11_2,
  '11-3': questions11_3,
  '11-4': questions11_4,
  '12-1': questions12_1,
  '12-2': questions12_2,
  '12-3': questions12_3,
  '12-4': questions12_4,
  '12-5': questions12_5,
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
