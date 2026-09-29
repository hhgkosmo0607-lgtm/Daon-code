/*
 * 광산에 놓는 광물. 색은 props.png의 바위·크리스탈 색을 그대로 쓴다.
 *
 * 큰 바위(ROCK)는 props.png 그림, 작은 크리스탈 무더기(CLUSTER)는 여기서 도트로 그린다.
 * 고양이는 이 광물들 중 하나를 골라 캐러 간다 (PetScene이 자리를 정한다).
 */

/** 크리스탈·바위 색 (props.png에서 뽑음) */
export const CRYSTAL_PALETTE: Record<string, string> = {
  L: '#7ff0ff', // 크리스탈 밝은 면
  M: '#3ecbe0', // 크리스탈 가운데
  D: '#2a9fb5', // 크리스탈 어두운 면
  W: '#ffffff', // 반짝임
  h: '#857d8e', // 바위 밝은 면
  r: '#6c6574', // 바위
  d: '#534c5b', // 바위 그림자
};

/** 작은 크리스탈 무더기 16×11 — 바닥 바위에 크리스탈 기둥 세 개 */
// prettier-ignore
export const CLUSTER = [
  '......W.........',
  '.....LMD........',
  '.....LMD....L...',
  '..L..LMD...LMD..',
  '.LMD.LMD...LMD..',
  '.LMD.LMD...LMD..',
  '.LMDhLMDhhhLMDh.',
  'hhhhhrrrrrrrrrrh',
  'hrrrrrrrrrrrrrrr',
  'rrrrrrrrrddddrrd',
  '.dddddddddddddd.',
];
