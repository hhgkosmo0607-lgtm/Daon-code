import {
  Image,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ART_SCALE } from '../domain/catSheet';

/**
 * 스프라이트 시트에서 한 칸만 잘라 보여준다 (도트 단위 좌표).
 * 시트 전체를 그리되 칸 크기의 창으로 가리고 위치만 옮기는 방식이다.
 */
export function SheetCrop({
  source,
  sheetW,
  sheetH,
  x,
  y,
  w,
  h,
  style,
}: {
  source: ImageSourcePropType;
  sheetW: number;
  sheetH: number;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: StyleProp<ViewStyle>;
}) {
  const s = ART_SCALE;
  return (
    <View pointerEvents="none" style={[{ width: w * s, height: h * s, overflow: 'hidden' }, style]}>
      <Image
        source={source}
        fadeDuration={0}
        style={{
          position: 'absolute',
          left: -x * s,
          top: -y * s,
          width: sheetW * s,
          height: sheetH * s,
        }}
      />
    </View>
  );
}
