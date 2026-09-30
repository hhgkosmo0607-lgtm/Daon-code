import { PixelArt } from './PixelArt';

/*
 * 코인 아이콘 — 프리즘(PixelDiamond)과 같은 도트 방식의 금화. 숫자 왼쪽에 붙인다.
 * 테마와 상관없이 같은 색이다.
 *
 * O 테두리 · Y 금 · W 반짝임 · D 그림자 · . 빈칸
 */
// prettier-ignore
const COIN = [
  '..OOOOO..',
  '.OYYYYYO.',
  'OYWYYYYDO',
  'OYWYDYYDO',
  'OYYYDYYDO',
  'OYYYDYYDO',
  'OYYYYYDDO',
  '.ODDDDDO.',
  '..OOOOO..',
];

const PALETTE: Record<string, string> = {
  O: '#a8620f',
  Y: '#ffc83d',
  W: '#fff2a8',
  D: '#e0a020',
};

/** @param pixel 도트 한 칸 크기 (dp). 1.5면 13.5×13.5 */
export function PixelCoin({ pixel = 2 }: { pixel?: number }) {
  return <PixelArt sprite={COIN} palette={PALETTE} pixel={pixel} label="코인" />;
}
