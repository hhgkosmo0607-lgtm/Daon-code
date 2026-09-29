/*
 * 상점·재화 가격 규칙. 수치와 정한 이유는 daon-content/재화_경제.md.
 *
 * scoring.ts처럼 앱 화면(구매 버튼 활성화)과 서버(purchase, repair-streak Edge Function)가
 * 같은 파일을 쓴다. 최종 판단은 서버가 DB 잔액으로 다시 한다.
 * Deno(서버)도 이 파일을 불러오므로 다른 파일을 import하지 않는다.
 */

export type Currency = 'coin' | 'prism';

/*
 * 코인 고양이 — 처음 고양이(치즈)는 무료, 그다음부터 80코인에서 한 마리마다 40씩 오른다.
 *   80 · 120 · 160 · 200 · 240 · 280 (6마리 전부 1,080 ≈ 레슨만으로 한 달 남짓)
 */
export const CAT_BASE_PRICE = 80;
export const CAT_PRICE_STEP = 40;

/** 프리즘 고양이(무지개) 가격 — 코인 고양이를 다 모으고 채굴하면 2주쯤 걸린다 */
export const PRISM_CAT_PRICE = 10;

/** 하루 빠진 스트릭을 지키는 데 드는 프리즘 */
export const STREAK_REPAIR_PRISMS = 1;

/**
 * 고양이 가격.
 * @param ownedCoinCats 지금 가진 코인 고양이 수 (치즈 포함) — 코인 고양이 가격에만 쓴다
 */
export function catPrice(currency: Currency, ownedCoinCats: number): number {
  if (currency === 'prism') return PRISM_CAT_PRICE;
  return CAT_BASE_PRICE + CAT_PRICE_STEP * Math.max(0, ownedCoinCats - 1);
}

export interface Wallet {
  coins: number;
  prisms: number;
}

export type CatPurchaseBlockReason =
  'unknown_cat' | 'already_owned' | 'not_enough_coins' | 'not_enough_prisms';

/** 고양이를 살 수 있는지. 살 수 없으면 이유를, 살 수 있으면 null */
export function catPurchaseBlock(
  wallet: Wallet,
  ownedCats: string[],
  cat: { id: string; currency: Currency } | undefined,
  ownedCoinCats: number
): CatPurchaseBlockReason | null {
  if (!cat) return 'unknown_cat';
  if (ownedCats.includes(cat.id)) return 'already_owned';
  const price = catPrice(cat.currency, ownedCoinCats);
  if (cat.currency === 'prism') return wallet.prisms < price ? 'not_enough_prisms' : null;
  return wallet.coins < price ? 'not_enough_coins' : null;
}
