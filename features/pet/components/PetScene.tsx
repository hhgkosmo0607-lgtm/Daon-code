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
} from '../domain/catSheet';
import { CLUSTER, CRYSTAL_PALETTE } from '../domain/minerals';
import { CatPet } from './CatPet';
import { PixelArt } from './PixelArt';
import { BACKGROUND_TILE, PROPS_SHEET } from './catAssets';
import { SheetCrop } from './SheetCrop';

/*
 * 홈 상단바 둘째 줄 — 고양이가 일하는 광산 동굴.
 * 배경 타일(64×32 도트)을 가로로 이어 붙이고, 광물 세 개를 둔다:
 *   왼쪽 작은 크리스탈 무더기 · 가운데 큰 바위(좌우 반전) · 오른쪽 끝 큰 바위
 * 가진 고양이(최대 8마리)가 전부 오른쪽 바위 왼쪽에서 돌아다니다가, 광물 하나를 골라 캔다.
 */

const S = ART_SCALE;
const ROCK_MARGIN_RIGHT = 6 * S;
/** 광물 자리 (화면 폭 비율) */
const CLUSTER_AT = 0.22;
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
  const rockLeft = width - PROPS.rock.w * S - ROCK_MARGIN_RIGHT;
  const clusterLeft = snap(width * CLUSTER_AT);
  const midRockLeft = snap(width * MID_ROCK_AT);
  // 곡괭이 끝(PICKAXE_RIGHT)이 광물 왼쪽 끝에 살짝 닿는 자리 — 광물마다 하나
  const mineSpots = useMemo(
    () =>
      [clusterLeft + S, midRockLeft, rockLeft]
        .map((left) => left - PICKAXE_RIGHT * S + 2 * S)
        .filter((x) => x >= 0),
    [clusterLeft, midRockLeft, rockLeft]
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
          <PixelArt
            sprite={CLUSTER}
            palette={CRYSTAL_PALETTE}
            pixel={S}
            style={[styles.abs, { left: clusterLeft, top: (GROUND_Y - CLUSTER.length) * S }]}
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
