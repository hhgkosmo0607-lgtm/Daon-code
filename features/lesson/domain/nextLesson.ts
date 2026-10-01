import type { LessonStatus } from './types';

/**
 * 홈에서 "다음"으로 표시할 레슨.
 *
 * 레슨은 전부 열려 있어서 진도 행(progress)이 없는 레슨도 풀 수 있다. 그래도 진도 행이 생기는
 * 시점은 정해져 있다 — 레슨을 끝내면 다음 레슨 행이, 배치고사를 보면 시작 레슨까지의 행이
 * completed=false로 생긴다. 그래서 "행이 있는 마지막 레슨"이 지금 이어서 할 지점이다.
 * 거기서부터 아직 안 끝낸 첫 레슨을 고르고, 뒤로 다 끝냈으면 앞쪽에서 안 끝낸 레슨을 고른다.
 *
 * @param lessonIds 트랙 안 레슨 id, 커리큘럼 순서대로
 * @param statusMap 진도 행이 있는 레슨만 들어 있는 상태 맵 (toStatusMap)
 * @returns 전부 끝냈으면 null
 */
export function pickNextLesson(
  lessonIds: string[],
  statusMap: Record<string, LessonStatus>
): string | null {
  let lastWithRow = -1;
  lessonIds.forEach((id, i) => {
    if (statusMap[id] !== undefined) lastWithRow = i;
  });

  const notDone = (id: string) => statusMap[id] !== 'completed';
  const start = Math.max(0, lastWithRow);
  return lessonIds.slice(start).find(notDone) ?? lessonIds.slice(0, start).find(notDone) ?? null;
}
