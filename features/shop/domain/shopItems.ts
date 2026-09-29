/*
 * 상점·재화 가격 규칙. 수치와 정한 이유는 daon-content/재화_경제.md.
 *
 * scoring.ts처럼 앱 화면(구매 버튼 활성화)과 서버(purchase, repair-streak Edge Function)가
 * 같은 파일을 쓴다. 최종 판단은 서버가 DB 잔액으로 다시 한다.
 * Deno(서버)도 이 파일을 불러오므로 다른 파일을 import하지 않는다.
 */

export type Currency = 'coin' | 'prism';

/*
 * 코인 고양이 — 처음 고양이(치즈)는 무료, 그다음부터 40코인에서 한 마리마다 10씩 오른다.
 *   40 · 50 · 60 · 70 · 80 · 90 (6마리 전부 390) — 빨리 모이게:
 *   매일 레슨 2개면 2주, 1개면 7주 (재화_경제.md 시뮬레이션)
 */
export const CAT_BASE_PRICE = 40;
export const CAT_PRICE_STEP = 10;

/**
 * 프리즘 고양이(무지개) 가격 — 목표가 되게: 코인 고양이를 다 모은 뒤 두 달쯤 모아야 한다.
 * 고양이가 늘수록 채굴이 빨라지는 것까지 계산해서 매일 레슨 2개면 약 69일째.
 */
export const PRISM_CAT_PRICE = 50;

/*
 * 프리즘 → 코인 교환 (한 방향만. 코인으로 프리즘은 못 산다 — 되돌려 사서 불리는 게 불가능하다).
 * 프리즘 20개면 코인 고양이 전부(390), 스트릭 지키기 1번(프리즘 1) ≈ 레슨 하루치 코인.
 */
export const COINS_PER_PRISM = 20;
/** 상점에서 한 번에 바꿀 수 있는 묶음 */
export const EXCHANGE_BUNDLES = [1, 5];

/** 프리즘 n개를 코인으로 바꿀 수 있는지 */
export function exchangeBlock(
  prisms: number,
  amount: number
): 'not_enough_prisms' | 'invalid' | null {
  if (!EXCHANGE_BUNDLES.includes(amount)) return 'invalid';
  return prisms < amount ? 'not_enough_prisms' : null;
}

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
