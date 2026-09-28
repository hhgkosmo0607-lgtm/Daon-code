/*
 * 상점 규칙 (daon-content/Daon-code_아이디어.md 1번 — 듀오링고식 보상 구조).
 *
 * scoring.ts처럼 앱 화면(구매 버튼 활성화)과 서버(purchase Edge Function)가
 * 같은 파일을 쓴다. 최종 판단은 서버가 DB 잔액으로 다시 한다.
 */

/** 스트릭 프리즈 1개 가격 (코인) */
export const FREEZE_PRICE = 50;

/** 프리즈 최대 보유 개수 (기획서 7번) */
export const FREEZE_MAX = 2;

export type PurchaseBlockReason = 'not_enough_coins' | 'max_reached';

/** 프리즈를 살 수 있는지. 살 수 없으면 이유를, 살 수 있으면 null을 돌려준다 */
export function freezePurchaseBlock(coins: number, freezeCount: number): PurchaseBlockReason | null {
  if (freezeCount >= FREEZE_MAX) return 'max_reached';
  if (coins < FREEZE_PRICE) return 'not_enough_coins';
  return null;
}
