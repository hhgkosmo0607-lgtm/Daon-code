import { CRYSTAL_PALETTE } from '../domain/minerals';
import { PixelArt } from './PixelArt';

/*
 * 프리즘 아이콘 — 동굴 바위의 크리스탈과 같은 색의 도트 다이아몬드.
 * 테마와 상관없이 같은 색이다.
 *
 * L 밝은 면 · M 가운데 · D 어두운 면 · W 반짝임 · . 빈칸
 */
// prettier-ignore
const DIAMOND = [
  '..LLLLL..',
  '.LWLLMDD.',
  'LLLLMMDDD',
  '.LLLMMDD.',
  '..LLMDD..',
  '...LMD...',
  '....M....',
];

/** @param pixel 도트 한 칸 크기 (dp). 2면 18×14 */
export function PixelDiamond({ pixel = 2 }: { pixel?: number }) {
  return <PixelArt sprite={DIAMOND} palette={CRYSTAL_PALETTE} pixel={pixel} label="프리즘" />;
}
