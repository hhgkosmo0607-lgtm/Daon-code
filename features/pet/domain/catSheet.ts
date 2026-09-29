/*
 * 고양이 스프라이트 시트 규칙. (원본: assets/prompt_cat_png, 변환: scripts/build-pet-assets.mjs)
 *
 * 시트 한 장 = 가로 4칸 × 세로 7줄, 한 칸 40×24 도트. 고양이는 오른쪽을 보고 있고
 * 발이 칸 맨 아래에 닿는다. 왼쪽으로 갈 때는 좌우로 뒤집어서 그린다.
 * 화면에는 도트 1칸을 ART_SCALE dp로 그린다 (빌드 스크립트와 같은 값이어야 한다).
 */

export const ART_SCALE = 2;

export const CELL_W = 40;
export const CELL_H = 24;
export const SHEET_W = 160;
export const SHEET_H = 168;

export type CatAnim = 'idle' | 'walk' | 'mine' | 'rest' | 'laptopOpen' | 'code' | 'video';

/** 동작별 시트 줄 번호, 프레임 수, 프레임 간격(ms) */
export const ANIMS: Record<CatAnim, { row: number; frames: number; frameMs: number }> = {
  idle: { row: 0, frames: 2, frameMs: 700 },
  walk: { row: 1, frames: 2, frameMs: 200 },
  mine: { row: 2, frames: 2, frameMs: 320 },
  rest: { row: 3, frames: 2, frameMs: 900 },
  laptopOpen: { row: 4, frames: 3, frameMs: 260 },
  code: { row: 5, frames: 4, frameMs: 220 },
  video: { row: 6, frames: 4, frameMs: 450 },
};

/** 칸 안에서 고양이 몸이 차지하는 가로 범위 (도트). 곡괭이 끝은 26, 노트북 끝은 35 */
export const BODY_LEFT = 5;
export const PICKAXE_RIGHT = 27;
export const LAPTOP_RIGHT = 36;

/** 시트에서 한 프레임의 위치 (도트 단위, 왼쪽 위 기준) */
export function frameOrigin(anim: CatAnim, tick: number): { x: number; y: number } {
  const { row, frames } = ANIMS[anim];
  return { x: (tick % frames) * CELL_W, y: row * CELL_H };
}

/** 고양이를 사는 재화 — 코인 고양이는 레슨 코인으로, 프리즘 고양이는 프리즘으로 */
export type CatCurrency = 'coin' | 'prism';

export interface CatColor {
  id: string;
  label: string;
  currency: CatCurrency;
}

/** 치즈(orange)는 처음부터 가진다. 무지개만 프리즘 고양이 (재화_경제.md) */
export const CAT_COLORS: CatColor[] = [
  { id: 'orange', label: '치즈', currency: 'coin' },
  { id: 'white', label: '하양', currency: 'coin' },
  { id: 'cream', label: '크림', currency: 'coin' },
  { id: 'gray', label: '회색', currency: 'coin' },
  { id: 'blue', label: '파랑', currency: 'coin' },
  { id: 'mint', label: '민트', currency: 'coin' },
  { id: 'pink', label: '분홍', currency: 'coin' },
  { id: 'rainbow', label: '무지개', currency: 'prism' },
];

export function catById(id: string): CatColor | undefined {
  return CAT_COLORS.find((c) => c.id === id);
}

/** 가진 코인 고양이 수 — 다음 코인 고양이 가격을 정한다 */
export function ownedCoinCatCount(ownedCats: string[]): number {
  return ownedCats.filter((id) => catById(id)?.currency === 'coin').length;
}

export const DEFAULT_CAT_ID = 'orange';

/** props 시트(40×24) 안의 소품 위치 (도트) */
export const PROPS = {
  sparkle: { x: 0, y: 0, w: 9, h: 5 },
  z: { x: 9, y: 0, w: 6, h: 5 },
  rock: { x: 16, y: 6, w: 24, h: 18 },
} as const;

export const PROPS_W = 40;
export const PROPS_H = 24;

/** 배경 타일 64×32. 고양이·바위는 발이 GROUND_Y 줄에 닿게 선다 */
export const BG_W = 64;
export const BG_H = 32;
export const GROUND_Y = 24;

/** 쉬는 동안 할 일 */
export type Activity = 'wander' | 'mine' | 'code' | 'video' | 'nap';

/** 다음 할 일을 고른다 (random: 0~1, 테스트에서 고정하려고 주입받는다) */
export function pickActivity(random: number): Activity {
  if (random < 0.4) return 'wander';
  if (random < 0.7) return 'mine';
  if (random < 0.85) return 'code';
  if (random < 0.95) return 'video';
  return 'nap';
}

/**
 * 다음에 걸어갈 위치를 고른다. 너무 가까운 곳(한 걸음도 안 되는 거리)은 피해서
 * 제자리에서 떠는 것처럼 보이지 않게 한다.
 *
 * @param current 지금 x 위치
 * @param maxX 걸을 수 있는 가장 오른쪽 x
 * @param random 0~1 난수
 */
export function nextWalkTarget(current: number, maxX: number, random: number): number {
  if (maxX <= 0) return 0;
  const minStep = Math.min(maxX / 3, 40);
  const target = random * maxX;
  if (Math.abs(target - current) >= minStep) return target;
  // 너무 가까우면 반대쪽 끝 방향으로 최소 거리만큼 더 간다
  return current + minStep <= maxX ? current + minStep : Math.max(0, current - minStep);
}
