/*
 * 고양이 채굴 규칙 — 출석(앱을 열면 하루 한 번)하면 잔디(먹이), 먹이를 주면 채굴 게이지가 차고
 * 게이지가 가득 차면 스트릭 프리즈 1개. (daon-content/Daon-code_아이디어.md 2-A)
 *
 * shopItems.ts처럼 앱(버튼 활성화·표시)과 서버(check-in, feed-pet)가 같은 파일을 쓴다.
 * 수치를 바꾸려면 여기서만 고치면 된다.
 */

/** 하루 한 번 출석(그날 처음 앱을 열었을 때) 받는 잔디 수 — 레슨을 안 풀어도 준다 */
export const GRASS_PER_ATTENDANCE = 1;

/** 잔디 1개를 먹이면 고양이가 일하는(채굴 모션) 시간 */
export const WORK_HOURS_PER_GRASS = 24;

/*
 * 수치 설계 (코인은 레슨으로 하루 약 30개):
 *   먹이 1개 = 게이지 (MINE_BASE + 고양이 수 × MINE_PER_CAT), 게이지 MINE_PER_FREEZE = 프리즈 1개
 *     1마리 → 2 (5일에 1개) · 4마리 → 5 (2일에 1개) · 8마리 → 9 (거의 매일 1개)
 *   프리즈가 가득(FREEZE_MAX)이면 넘친 프리즈는 FREEZE_OVERFLOW_COINS 코인으로 바뀐다.
 *     8마리여도 하루 약 22코인 — 레슨보다 적어서 공부가 주 수입원으로 남는다.
 *     상점 가격(50)의 절반이라 사고팔기로 코인을 불릴 수 없다.
 */
export const MINE_BASE = 1;
export const MINE_PER_CAT = 1;
export const MINE_PER_FREEZE = 10;
export const FREEZE_OVERFLOW_COINS = 25;

/** 잔디 1개를 먹일 때 차는 게이지 — 고양이가 많을수록 많이 캔다 */
export function minePerGrass(catCount: number): number {
  return MINE_BASE + Math.max(1, catCount) * MINE_PER_CAT;
}

/** 이번 출석으로 받을 잔디 — 오늘 아직 출석 잔디를 안 받았을 때만 */
export function grassForCheckIn(lastCheckInDate: string | null, today: string): number {
  return lastCheckInDate === today ? 0 : GRASS_PER_ATTENDANCE;
}

export type FeedBlockReason = 'no_grass';

/** 먹이를 줄 수 있는지. 못 주면 이유를, 줄 수 있으면 null (프리즈가 가득이어도 줄 수 있다 — 넘치면 코인) */
export function feedBlock(grass: number): FeedBlockReason | null {
  return grass < 1 ? 'no_grass' : null;
}

/** 지금 고양이가 일하는 중인지 (먹이 효과가 남아 있는지) */
export function isWorking(workingUntil: string | null, now: Date = new Date()): boolean {
  return workingUntil !== null && new Date(workingUntil).getTime() > now.getTime();
}
