import { type StyleProp, type ViewStyle } from 'react-native';

import { BODY_LEFT, CELL_H, SHEET_H, SHEET_W, frameOrigin } from '../domain/catSheet';
import { CAT_SHEETS } from './catAssets';
import { SheetCrop } from './SheetCrop';

/** 몸 폭(도트) — 칸에서 몸 부분만 잘라서 보여준다 */
const BODY_W = 20;

/** 상점·보유 목록에 쓰는 고양이 정지 그림 (서 있는 첫 프레임, 몸만) */
export function CatPortrait({ catId, style }: { catId: string; style?: StyleProp<ViewStyle> }) {
  const origin = frameOrigin('idle', 0);
  return (
    <SheetCrop
      source={CAT_SHEETS[catId]}
      sheetW={SHEET_W}
      sheetH={SHEET_H}
      x={origin.x + BODY_LEFT}
      y={origin.y}
      w={BODY_W}
      h={CELL_H}
      style={style}
    />
  );
}
