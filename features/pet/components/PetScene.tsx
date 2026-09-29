import { useMemo, useState } from 'react';
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
  RAIL_Y,
} from '../domain/catSheet';
import { CatPet } from './CatPet';
import { BACKGROUND_TILE, PROPS_SHEET } from './catAssets';
import { SheetCrop } from './SheetCrop';

/*
 * 홈 상단바 둘째 줄 — 고양이가 일하는 광산 동굴.
 * 배경 타일(128×32 도트)을 가로로 이어 붙이고, 광물 세 개와 광차를 둔다:
 *   왼쪽 보라 크리스탈 · 가운데 큰 바위(좌우 반전) · 오른쪽 큰 바위 · 맨 오른쪽 레일 위 광차
 * 가진 고양이(최대 8마리)가 전부 오른쪽 바위 왼쪽에서 돌아다니다가, 광물 하나를 골라 캔다.
 */

const S = ART_SCALE;
const CART_MARGIN_RIGHT = 2 * S;
const ROCK_GAP = 4 * S;
/** 광물 자리 (화면 폭 비율) */
const CRYSTAL_AT = 0.22;
const MID_ROCK_AT = 0.5;

/** 도트 칸에 맞춘 x */
const snap = (v: number) => Math.round(v / S) * S;

export function PetScene({
  catIds = [DEFAULT_CAT_ID],
  onPress,
  expanded,
}: {
  /** 가진 고양이 색 id 목록 — 전부 광산에 나온다 */
  catIds?: string[];
  /** 누르면 채굴 패널 열기/닫기 */
  onPress?: () => void;
  expanded?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const tileW = BG_W * S;
  const tiles = Math.ceil(width / tileW);
  const cartLeft = snap(width - PROPS.cart.w * S - CART_MARGIN_RIGHT);
  const rockLeft = cartLeft - PROPS.rock.w * S - ROCK_GAP;
  const crystalLeft = snap(width * CRYSTAL_AT);
  const midRockLeft = snap(width * MID_ROCK_AT);
  // 곡괭이 끝(PICKAXE_RIGHT)이 광물 왼쪽 끝에 살짝 닿는 자리 — 광물마다 하나
  const mineSpots = useMemo(
    () =>
      [crystalLeft, midRockLeft, rockLeft]
        .map((left) => left - PICKAXE_RIGHT * S + 2 * S)
        .filter((x) => x >= 0),
    [crystalLeft, midRockLeft, rockLeft]
  );

  return (
    <Pressable
      style={styles.scene}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`고양이 ${catIds.length}마리가 광산에서 일하는 중`}
      accessibilityHint="눌러서 채굴 현황 보기"
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
            {...PROPS.crystal}
            style={[styles.abs, { left: crystalLeft, top: (GROUND_Y - PROPS.crystal.h) * S }]}
          />
          <SheetCrop
            source={PROPS_SHEET}
            sheetW={PROPS_W}
            sheetH={PROPS_H}
            {...PROPS.rock}
            style={[
              styles.abs,
              {
                left: midRockLeft,
                top: (GROUND_Y - PROPS.rock.h) * S,
                transform: [{ scaleX: -1 }],
              },
            ]}
          />
          <SheetCrop
            source={PROPS_SHEET}
            sheetW={PROPS_W}
            sheetH={PROPS_H}
            {...PROPS.rock}
            style={[styles.abs, { left: rockLeft, top: (GROUND_Y - PROPS.rock.h) * S }]}
          />
          <SheetCrop
            source={PROPS_SHEET}
            sheetW={PROPS_W}
            sheetH={PROPS_H}
            {...PROPS.cart}
            style={[styles.abs, { left: cartLeft, top: (RAIL_Y - PROPS.cart.h) * S }]}
          />
          {catIds.map((id, i) => (
            <CatPet
              key={id}
              catId={id}
              rockLeft={rockLeft}
              mineSpots={mineSpots}
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
