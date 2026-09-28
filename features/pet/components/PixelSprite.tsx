import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { spriteToRuns, type Sprite } from '../domain/pets';

/**
 * '#'/'.' 도트 그림 한 장을 단색으로 그린다.
 * 가로로 이어진 칸은 네모 하나로 합쳐서(spriteToRuns) View 개수를 줄인다.
 */
export function PixelSprite({
  sprite,
  color,
  pixelSize,
  style,
}: {
  sprite: Sprite;
  color: string;
  pixelSize: number;
  style?: StyleProp<ViewStyle>;
}) {
  const runs = useMemo(() => spriteToRuns(sprite), [sprite]);
  const width = (sprite[0]?.length ?? 0) * pixelSize;
  const height = sprite.length * pixelSize;

  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      {runs.map((run) => (
        <View
          key={`${run.x}-${run.y}`}
          style={{
            position: 'absolute',
            left: run.x * pixelSize,
            top: run.y * pixelSize,
            width: run.width * pixelSize,
            height: pixelSize,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}
