import { View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * 여러 색 도트 그림을 그린다. 한 줄은 문자열, 글자마다 palette의 색 (없는 글자·'.'는 빈칸).
 * 가로로 이어진 같은 색 칸은 네모 하나로 합쳐서 View 개수를 줄인다.
 */
export function PixelArt({
  sprite,
  palette,
  pixel,
  style,
  label,
}: {
  sprite: string[];
  palette: Record<string, string>;
  /** 도트 한 칸 크기 (dp) */
  pixel: number;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const runs: { x: number; y: number; w: number; color: string }[] = [];
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const c = row[x];
      let end = x;
      while (end < row.length && row[end] === c) end++;
      if (palette[c]) runs.push({ x, y, w: end - x, color: palette[c] });
      x = end;
    }
  });

  return (
    <View
      pointerEvents="none"
      accessibilityLabel={label}
      style={[{ width: (sprite[0]?.length ?? 0) * pixel, height: sprite.length * pixel }, style]}
    >
      {runs.map((r) => (
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
