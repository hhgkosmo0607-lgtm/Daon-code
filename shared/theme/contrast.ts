/*
 * 버튼처럼 "색이 있는 배경 위에 글자"를 놓아야 하는 곳에서 쓴다.
 *
 * 테마 10종마다 accent/success/error의 밝기가 크게 달라서(예: Dracula의
 * accent #FFB86C는 밝은 파스텔이라 흰 글자를 얹으면 거의 안 보이고, Alucard의
 * accent #A34D14는 어두워서 흰 글자가 잘 보인다), 버튼 글자색을 항상 흰색으로
 * 고정하면 다크 테마 대부분에서 가시성이 나빠진다. 배경색의 밝기를 보고
 * 흰색/검정 중 대비가 더 좋은 쪽을 골라 쓴다 (WCAG 상대 휘도 기준).
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const L1 = relativeLuminance(rgb1);
  const L2 = relativeLuminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** bgHex 위에 얹을 글자색으로 흰색/검정 중 대비가 더 좋은 쪽을 반환한다. */
export function getReadableTextColor(bgHex: string): string {
  const L = relativeLuminance(hexToRgb(bgHex));
  const contrastWithWhite = 1.05 / (L + 0.05);
  const contrastWithBlack = (L + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? '#FFFFFF' : '#15151A';
}

/*
 * fgHex가 bgHex 위에서 target 대비를 못 채우면, 더 잘 보이는 방향(검정 또는
 * 흰색 쪽)으로 fgHex의 색조를 유지한 채 밝기만 서서히 옮겨서 target을 만족시킨다.
 * 코드 블록처럼 "테마 색을 그대로 쓰고 싶은데, 배경이 테마마다 밝기가 달라서
 * 그대로 쓰면 어떤 테마에서는 거의 안 보이는" 경우에 쓴다.
 */
export function ensureContrast(fgHex: string, bgHex: string, target = 4.5): string {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (contrastRatio(fg, bg) >= target) return fgHex;

  const bgIsLight = relativeLuminance(bg) > 0.5;
  const endpoint: [number, number, number] = bgIsLight ? [0, 0, 0] : [255, 255, 255];
  if (contrastRatio(endpoint, bg) < target) return rgbToHex(endpoint);

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    const candidate = lerp(fg, endpoint, mid);
    if (contrastRatio(candidate, bg) >= target) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return rgbToHex(lerp(fg, endpoint, hi));
}
