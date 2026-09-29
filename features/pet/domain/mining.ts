/*
 * 고양이 채굴 규칙 — 출석하면 잔디(먹이), 먹이를 주면 채굴 게이지가 차고
 * 게이지가 가득 차면 스트릭 프리즈 1개. (daon-content/Daon-code_아이디어.md 2-A)
 *
 * shopItems.ts처럼 앱(버튼 활성화·표시)과 서버(submit-answer, feed-pet)가 같은 파일을 쓴다.
 * 수치는 임시값이다 — 써 보면서 여기서만 고치면 된다.
 */

/** 그날 첫 제출(출석) 때 받는 잔디 수 */
export const GRASS_PER_ATTENDANCE = 1;

/** 잔디 1개를 먹이면 차는 채굴 게이지 */
export const MINE_PER_GRASS = 1;

/** 게이지가 이만큼 차면 프리즈 1개 */
export const MINE_PER_FREEZE = 5;

/** 잔디 1개를 먹이면 고양이가 일하는(채굴 모션) 시간 */
export const WORK_HOURS_PER_GRASS = 24;

/** 이번 제출로 받을 잔디 — 오늘 아직 공부한 적이 없을 때만 */
export function grassForSubmission(lastStudyDate: string | null, today: string): number {
  return lastStudyDate === today ? 0 : GRASS_PER_ATTENDANCE;
}

export type FeedBlockReason = 'no_grass' | 'freeze_full';

/** 먹이를 줄 수 있는지. 못 주면 이유를, 줄 수 있으면 null */
export function feedBlock(
  grass: number,
  freezeCount: number,
  freezeMax: number
): FeedBlockReason | null {
  if (grass < 1) return 'no_grass';
  // 프리즈가 가득 차면 캐도 받을 곳이 없어서 먹이를 아낀다 (정책 미정 — 아이디어 문서 2-A)
  if (freezeCount >= freezeMax) return 'freeze_full';
  return null;
}

/** 지금 고양이가 일하는 중인지 (먹이 효과가 남아 있는지) */
export function isWorking(workingUntil: string | null, now: Date = new Date()): boolean {
  return workingUntil !== null && new Date(workingUntil).getTime() > now.getTime();
}
