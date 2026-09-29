/*
 * 광물 색 — props.png의 바위·크리스탈 색을 그대로 뽑았다.
 * 광산의 광물은 props.png 그림을 쓰고(PetScene), 이 색은 프리즘 아이콘 같은 도트 그림에 쓴다.
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
