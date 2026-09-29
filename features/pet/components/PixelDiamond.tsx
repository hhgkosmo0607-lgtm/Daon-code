import { View } from 'react-native';

/*
 * 스트릭 프리즘 아이콘 — 동굴 바위의 크리스탈과 같은 색의 도트 다이아몬드.
 * 글자(❄) 대신 쓴다. 테마와 상관없이 같은 색이다.
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

// props.png의 크리스탈 색
const COLORS: Record<string, string> = {
  L: '#7ff0ff',
  M: '#3ecbe0',
  D: '#2a9fb5',
  W: '#ffffff',
};

/** 가로로 이어진 같은 색 칸을 네모 하나로 합친다 */
const RUNS = DIAMOND.flatMap((row, y) => {
  const runs: { x: number; y: number; w: number; color: string }[] = [];
  for (let x = 0; x < row.length;) {
    const c = row[x];
    let end = x;
    while (end < row.length && row[end] === c) end++;
    if (c !== '.') runs.push({ x, y, w: end - x, color: COLORS[c] });
    x = end;
  }
  return runs;
});

/** @param pixel 도트 한 칸 크기 (dp). 2면 18×14 */
export function PixelDiamond({ pixel = 2 }: { pixel?: number }) {
  return (
    <View
      accessibilityLabel="프리즘"
      style={{ width: DIAMOND[0].length * pixel, height: DIAMOND.length * pixel }}
    >
      {RUNS.map((r) => (
        <View
          key={`${r.x}-${r.y}`}
          style={{
            position: 'absolute',
            left: r.x * pixel,
            top: r.y * pixel,
            width: r.w * pixel,
            height: pixel,
            backgroundColor: r.color,
          }}
        />
      ))}
    </View>
  );
}
