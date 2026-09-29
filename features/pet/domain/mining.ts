/*
 * 고양이 채굴 규칙 — 하루 한 번 출석(그날 처음 앱을 열 때)하면 고양이들이 캔 만큼
 * 채굴 게이지가 차고, 게이지가 가득 차면 프리즘 1개. 레슨을 안 풀어도 준다.
 * 수치와 정한 이유는 daon-content/재화_경제.md.
 *
 * 앱(표시)과 서버(check-in Edge Function)가 같은 파일을 쓴다.
 * Deno(서버)도 이 파일을 불러오므로 다른 파일을 import하지 않는다.
 *
 *   출석 1번 = 게이지 (MINE_BASE + 고양이 수 × MINE_PER_CAT), 게이지 MINE_PER_PRISM = 프리즘 1개
 *     1마리 → 2 (5일에 1개) · 4마리 → 5 (2일에 1개) · 8마리 → 9 (거의 매일 1개)
 *   프리즘은 보유 한도가 없다.
 */
export const MINE_BASE = 1;
export const MINE_PER_CAT = 1;
export const MINE_PER_PRISM = 10;

/** 출석 1번에 차는 게이지 — 고양이가 많을수록 많이 캔다 */
export function minePerCheckIn(catCount: number): number {
  return MINE_BASE + Math.max(1, catCount) * MINE_PER_CAT;
}

export interface MiningResult {
  /** 이번에 찬 게이지 */
  gain: number;
  /** 새로 나온 프리즘 */
  minted: number;
  /** 남은 게이지 */
  gauge: number;
}

/** 지금 게이지에 출석 1번을 더하면 (DB 함수 check_in과 같은 계산) */
export function applyCheckIn(gauge: number, catCount: number): MiningResult {
  const gain = minePerCheckIn(catCount);
  const total = gauge + gain;
  return {
    gain,
    minted: Math.floor(total / MINE_PER_PRISM),
    gauge: total % MINE_PER_PRISM,
  };
}
