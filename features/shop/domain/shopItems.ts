/*
 * 상점 규칙 (daon-content/Daon-code_아이디어.md 1번 — 듀오링고식 보상 구조).
 *
 * scoring.ts처럼 앱 화면(구매 버튼 활성화)과 서버(purchase Edge Function)가
 * 같은 파일을 쓴다. 최종 판단은 서버가 DB 잔액으로 다시 한다.
 */

/*
 * 이름: 코드의 freeze(FREEZE_*, freeze_count) = 화면의 '프리즘' (스트릭을 지켜 주는 크리스탈).
 * 처음엔 '스트릭 프리즈'였다가 고양이가 캐는 다이아몬드 모양에 맞춰 화면 이름만 바꿨다.
 */

/** 스트릭 프리즘 1개 가격 (코인) */
export const FREEZE_PRICE = 50;

/** 프리즘 최대 보유 개수 (기획서 7번) */
export const FREEZE_MAX = 2;

export type PurchaseBlockReason = 'not_enough_coins' | 'max_reached';

/** 프리즘을 살 수 있는지. 살 수 없으면 이유를, 살 수 있으면 null을 돌려준다 */
export function freezePurchaseBlock(
  coins: number,
  freezeCount: number
): PurchaseBlockReason | null {
  if (freezeCount >= FREEZE_MAX) return 'max_reached';
  if (coins < FREEZE_PRICE) return 'not_enough_coins';
  return null;
}

/*
 * 고양이 가격 — 처음 고양이(치즈)는 무료, 그다음부터 80코인에서 한 마리마다 40씩 오른다.
 *   2번째 80 · 3번째 120 · … · 8번째 320 (전부 1,400 ≈ 레슨만으로 한 달 반)
 * 첫 구매는 사흘 치 코인으로 채굴량이 1.5배가 돼서 금방 본전을 뽑는다.
 */
export const CAT_BASE_PRICE = 80;
export const CAT_PRICE_STEP = 40;

/** 지금 가진 수가 ownedCount일 때 다음 고양이 가격 */
export function catPrice(ownedCount: number): number {
  return CAT_BASE_PRICE + CAT_PRICE_STEP * Math.max(0, ownedCount - 1);
}

export type CatPurchaseBlockReason = 'not_enough_coins' | 'already_owned' | 'unknown_cat';

/** 고양이를 살 수 있는지. 살 수 없으면 이유를, 살 수 있으면 null */
export function catPurchaseBlock(
  coins: number,
  ownedCats: string[],
  catId: string,
  validCatIds: string[]
): CatPurchaseBlockReason | null {
  if (!validCatIds.includes(catId)) return 'unknown_cat';
  if (ownedCats.includes(catId)) return 'already_owned';
  if (coins < catPrice(ownedCats.length)) return 'not_enough_coins';
  return null;
}
