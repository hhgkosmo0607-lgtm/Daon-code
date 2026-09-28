import type { Sprite } from './pets';

/*
 * 펫이 사는 풍경 (상단바 둘째 줄 배경). 펫과 같은 '#'/'.' 도트 데이터다.
 * 색은 테마 색에서 가져와서, 테마를 바꾸면 풍경 색도 같이 바뀐다.
 */

// prettier-ignore
export const CLOUD: Sprite = [
  '....###.....',
  '..#######...',
  '.##########.',
  '############',
];

// prettier-ignore
export const SUN: Sprite = [
  '.###.',
  '#####',
  '#####',
  '#####',
  '.###.',
];

/** 꽃송이 (꽃대는 FLOWER_STEM, 따로 초록색으로 칠한다) */
export const FLOWER_HEAD: Sprite = ['.#.', '#.#', '.#.'];
export const FLOWER_STEM: Sprite = ['#', '#'];

/** 풀 무늬 한 칸 단위 — 땅 위 한 줄을 이 무늬로 반복해서 채운다 */
const GRASS_TILE = '#..#.##..#..#.#.';

/** 땅(맨 아래) 높이 — 풀 1줄 + 흙 2줄 (도트 줄 수) */
export const GROUND_ROWS = 3;

/**
 * 길 너비에 맞는 땅 그림을 만든다: 맨 위 풀 무늬 한 줄 + 꽉 찬 흙 두 줄.
 * 풀과 흙은 색이 달라서 따로 돌려준다.
 */
export function groundSprites(cols: number): { grass: Sprite; soil: Sprite } {
  const n = Math.max(0, Math.floor(cols));
  const grass = GRASS_TILE.repeat(Math.ceil(n / GRASS_TILE.length)).slice(0, n);
  const soilRow = '#'.repeat(n);
  return { grass: [grass], soil: [soilRow, soilRow] };
}

/** 꽃을 심을 위치 (길 너비 대비 비율) — 펫 뒤로 지나가도록 고정 배치 */
export const FLOWER_POSITIONS = [0.12, 0.37, 0.63, 0.88];
