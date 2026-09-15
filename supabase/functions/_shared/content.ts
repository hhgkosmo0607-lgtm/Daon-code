import lessonsData from '../../../content/lessons.json' with { type: 'json' };
import questions1_1 from '../../../content/questions/1-1.json' with { type: 'json' };
import questions1_2 from '../../../content/questions/1-2.json' with { type: 'json' };
import questions1_3 from '../../../content/questions/1-3.json' with { type: 'json' };
import questions1_4 from '../../../content/questions/1-4.json' with { type: 'json' };
import questions1_5 from '../../../content/questions/1-5.json' with { type: 'json' };
import questions2_1 from '../../../content/questions/2-1.json' with { type: 'json' };
import questions2_2 from '../../../content/questions/2-2.json' with { type: 'json' };
import questions2_3 from '../../../content/questions/2-3.json' with { type: 'json' };
import questions2_4 from '../../../content/questions/2-4.json' with { type: 'json' };
import questions2_5 from '../../../content/questions/2-5.json' with { type: 'json' };
import questions2_6 from '../../../content/questions/2-6.json' with { type: 'json' };
import questions3_1 from '../../../content/questions/3-1.json' with { type: 'json' };
import questions3_2 from '../../../content/questions/3-2.json' with { type: 'json' };
import questions3_3 from '../../../content/questions/3-3.json' with { type: 'json' };
import questions3_4 from '../../../content/questions/3-4.json' with { type: 'json' };
import questions3_5 from '../../../content/questions/3-5.json' with { type: 'json' };
import questions4_1 from '../../../content/questions/4-1.json' with { type: 'json' };
import questions4_2 from '../../../content/questions/4-2.json' with { type: 'json' };
import questions4_3 from '../../../content/questions/4-3.json' with { type: 'json' };
import questions4_4 from '../../../content/questions/4-4.json' with { type: 'json' };
import questions4_5 from '../../../content/questions/4-5.json' with { type: 'json' };
import questions4_6 from '../../../content/questions/4-6.json' with { type: 'json' };
import questions5_1 from '../../../content/questions/5-1.json' with { type: 'json' };
import questions5_2 from '../../../content/questions/5-2.json' with { type: 'json' };
import questions5_3 from '../../../content/questions/5-3.json' with { type: 'json' };
import questions5_4 from '../../../content/questions/5-4.json' with { type: 'json' };
import questions5_5 from '../../../content/questions/5-5.json' with { type: 'json' };
import questions6_1 from '../../../content/questions/6-1.json' with { type: 'json' };
import questions6_2 from '../../../content/questions/6-2.json' with { type: 'json' };
import questions6_3 from '../../../content/questions/6-3.json' with { type: 'json' };
import questions6_4 from '../../../content/questions/6-4.json' with { type: 'json' };
import questions6_5 from '../../../content/questions/6-5.json' with { type: 'json' };
import questions7_1 from '../../../content/questions/7-1.json' with { type: 'json' };
import questions7_2 from '../../../content/questions/7-2.json' with { type: 'json' };
import questions7_3 from '../../../content/questions/7-3.json' with { type: 'json' };
import questions7_4 from '../../../content/questions/7-4.json' with { type: 'json' };
import questions8_1 from '../../../content/questions/8-1.json' with { type: 'json' };
import questions8_2 from '../../../content/questions/8-2.json' with { type: 'json' };
import questions8_3 from '../../../content/questions/8-3.json' with { type: 'json' };
import questions8_4 from '../../../content/questions/8-4.json' with { type: 'json' };
import questions9_1 from '../../../content/questions/9-1.json' with { type: 'json' };
import questions9_2 from '../../../content/questions/9-2.json' with { type: 'json' };
import questions9_3 from '../../../content/questions/9-3.json' with { type: 'json' };
import questions9_4 from '../../../content/questions/9-4.json' with { type: 'json' };
import questions10_1 from '../../../content/questions/10-1.json' with { type: 'json' };
import questions10_2 from '../../../content/questions/10-2.json' with { type: 'json' };
import questions10_3 from '../../../content/questions/10-3.json' with { type: 'json' };
import questions10_4 from '../../../content/questions/10-4.json' with { type: 'json' };
import questions10_5 from '../../../content/questions/10-5.json' with { type: 'json' };
import questions11_1 from '../../../content/questions/11-1.json' with { type: 'json' };
import questions11_2 from '../../../content/questions/11-2.json' with { type: 'json' };
import questions11_3 from '../../../content/questions/11-3.json' with { type: 'json' };
import questions11_4 from '../../../content/questions/11-4.json' with { type: 'json' };
import questions12_1 from '../../../content/questions/12-1.json' with { type: 'json' };
import questions12_2 from '../../../content/questions/12-2.json' with { type: 'json' };
import questions12_3 from '../../../content/questions/12-3.json' with { type: 'json' };
import questions12_4 from '../../../content/questions/12-4.json' with { type: 'json' };
import questions12_5 from '../../../content/questions/12-5.json' with { type: 'json' };

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
  const lessons = getLessons();
  const idx = lessons.findIndex((l) => l.id === startLessonId);
  if (idx === -1) return [];
  return lessons.slice(0, idx + 1);
}
