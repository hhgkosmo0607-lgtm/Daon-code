import { useState } from 'react';
import { Image, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';

import {
  ART_SCALE,
  BG_H,
  BG_W,
  DEFAULT_CAT_ID,
  GROUND_Y,
  PICKAXE_RIGHT,
  PROPS,
  PROPS_H,
  PROPS_W,
} from '../domain/catSheet';
import { CatPet } from './CatPet';
import { BACKGROUND_TILE, PROPS_SHEET } from './catAssets';
import { SheetCrop } from './SheetCrop';

/*
 * 홈 상단바 둘째 줄 — 고양이가 일하는 광산 동굴.
 * 배경 타일(64×32 도트)을 가로로 이어 붙이고, 오른쪽 끝에 크리스탈 바위를 둔다.
 * 가진 고양이(최대 8마리)가 전부 바위 왼쪽에서 돌아다니다가 가끔 바위를 캔다.
 */

const S = ART_SCALE;
const ROCK_MARGIN_RIGHT = 6 * S;

export function PetScene({
  catIds = [DEFAULT_CAT_ID],
  resting,
  onPress,
  expanded,
}: {
  /** 가진 고양이 색 id 목록 — 전부 광산에 나온다 */
  catIds?: string[];
  /** 먹이가 없어서 쉬는 중 */
  resting?: boolean;
  /** 누르면 먹이 패널 열기/닫기 */
  onPress?: () => void;
  expanded?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const tileW = BG_W * S;
  const tiles = Math.ceil(width / tileW);
  const rockLeft = width - PROPS.rock.w * S - ROCK_MARGIN_RIGHT;

  return (
    <Pressable
      style={styles.scene}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`고양이 ${catIds.length}마리, ${resting ? '배고파서 쉬는 중' : '광산에서 일하는 중'}`}
      accessibilityHint="눌러서 먹이 주기"
      accessibilityState={{ expanded }}
    >
      {Array.from({ length: tiles }, (_, i) => (
        <Image
          key={i}
          source={BACKGROUND_TILE}
          fadeDuration={0}
          style={[styles.tile, { left: i * tileW, width: tileW }]}
        />
      ))}

      {width > 0 && (
        <>
          <SheetCrop
            source={PROPS_SHEET}
            sheetW={PROPS_W}
            sheetH={PROPS_H}
            {...PROPS.rock}
            style={[styles.abs, { left: rockLeft, top: (GROUND_Y - PROPS.rock.h) * S }]}
          />
          {catIds.map((id, i) => (
            <CatPet
              key={id}
              catId={id}
              rockLeft={rockLeft}
              resting={resting}
              // 처음엔 걸을 수 있는 폭에 고르게 나눠 세운다
              startX={((rockLeft - PICKAXE_RIGHT * S) * i) / Math.max(1, catIds.length)}
            />
          ))}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scene: { width: '100%', height: BG_H * S, overflow: 'hidden', backgroundColor: '#1d1a24' },
  tile: { position: 'absolute', top: 0, height: BG_H * S },
  abs: { position: 'absolute' },
});
