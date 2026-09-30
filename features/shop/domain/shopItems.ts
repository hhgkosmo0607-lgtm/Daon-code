/*
 * 상점·재화 가격 규칙. 수치와 정한 이유는 daon-content/재화_경제.md.
 *
 * scoring.ts처럼 앱 화면(구매 버튼 활성화)과 서버(purchase, repair-streak Edge Function)가
 * 같은 파일을 쓴다. 최종 판단은 서버가 DB 잔액으로 다시 한다.
 * Deno(서버)도 이 파일을 불러오므로 다른 파일을 import하지 않는다.
 */

export type Currency = 'coin' | 'prism';

/*
 * 코인 펫 — 종별 등급 가격 (한 종 7색은 같은 값). 처음 펫(치즈 고양이)은 무료.
 * 레슨 2개/일(약 26코인)이면 팀 8마리가 11일, 91마리 전부는 약 8달 (재화_경제.md 시뮬레이션)
 */
export const COIN_PET_PRICE: Record<string, number> = {
  cat: 40,
  dog: 40,
  bunny: 40,
  hamster: 60,
  penguin: 60,
  frog: 60,
  hedgehog: 60,
  fox: 80,
  mole: 80,
  mushroom: 80,
  ghost: 100,
  slime: 100,
  robot: 100,
};
/** 표에 없는 종 (새로 추가됐는데 가격을 안 정한 경우) */
export const COIN_PET_DEFAULT_PRICE = 100;

/*
 * 프리즘 펫 — 특별한 색은 30, 전설 종(드래곤·골렘·미믹)은 50.
 * 레슨 2개/일이면 첫 프리즘 펫이 약 39일째, 그 뒤 4주쯤마다 하나 (팀 채굴 포함)
 */
export const PRISM_PET_PRICE = 30;
export const LEGENDARY_SPECIES = ['dragon', 'golem', 'mimic'];
export const LEGENDARY_PET_PRICE = 50;

/*
 * 프리즘 → 코인 교환 (한 방향만. 코인으로 프리즘은 못 산다 — 되돌려 사서 불리는 게 불가능하다).
 * 스트릭 지키기 1번(프리즘 1) ≈ 레슨 하루치 코인.
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

/** 가격을 매기는 데 필요한 펫 정보 (petCatalog.ts의 PetDef) */
export interface PricedPet {
  id: string;
  species: string;
  currency: Currency;
}

/** 펫 가격 (단위는 pet.currency) */
export function petPrice(pet: PricedPet): number {
  if (pet.currency === 'prism') {
    return LEGENDARY_SPECIES.includes(pet.species) ? LEGENDARY_PET_PRICE : PRISM_PET_PRICE;
  }
  return COIN_PET_PRICE[pet.species] ?? COIN_PET_DEFAULT_PRICE;
}

export interface Wallet {
  coins: number;
  prisms: number;
}

export type PetPurchaseBlockReason =
  'unknown_pet' | 'already_owned' | 'not_enough_coins' | 'not_enough_prisms';

/** 펫을 살 수 있는지. 살 수 없으면 이유를, 살 수 있으면 null */
export function petPurchaseBlock(
  wallet: Wallet,
  ownedPets: string[],
  pet: PricedPet | undefined
): PetPurchaseBlockReason | null {
  if (!pet) return 'unknown_pet';
  if (ownedPets.includes(pet.id)) return 'already_owned';
  const price = petPrice(pet);
  if (pet.currency === 'prism') return wallet.prisms < price ? 'not_enough_prisms' : null;
  return wallet.coins < price ? 'not_enough_coins' : null;
}

/*
 * 프리즘 충전(현금) 상품 — 지금은 목록·가격만 보여주고, 결제는 스토어 출시 때 붙인다.
 * 기준: 10개 = 1,000원. 큰 묶음일수록 보너스 (프리즘 펫 30개 ≈ 3천 원, 전설 50개 ≈ 4~5천 원).
 * 결제를 붙일 때 id를 스토어(구글 플레이) 인앱 상품 id로 그대로 쓴다.
 */
export interface PrismPack {
  id: string;
  prisms: number;
  /** 원 */
  priceKrw: number;
}

export const PRISM_PACKS: PrismPack[] = [
  { id: 'prism_10', prisms: 10, priceKrw: 1000 },
  { id: 'prism_60', prisms: 60, priceKrw: 5000 },
  { id: 'prism_130', prisms: 130, priceKrw: 10000 },
  { id: 'prism_350', prisms: 350, priceKrw: 25000 },
];

/** 기준(10개 = 1,000원)보다 몇 % 더 주는지 — 0이면 보너스 없음 */
export function packBonusPercent(pack: PrismPack): number {
  const base = PRISM_PACKS[0].prisms / PRISM_PACKS[0].priceKrw;
  return Math.round((pack.prisms / (pack.priceKrw * base) - 1) * 100);
}
