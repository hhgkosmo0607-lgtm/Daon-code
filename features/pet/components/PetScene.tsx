import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  ART_SCALE,
  BG_H,
  BG_W,
  GROUND_Y,
  PICKAXE_RIGHT,
  PROPS,
  PROPS_H,
  PROPS_W,
  RAIL_Y,
  type Place,
} from '../domain/petSheet';
import { DEFAULT_PET_ID } from '../domain/petCatalog';
import { PetSprite } from './PetSprite';
import { DrillEffect, drillLeftFor } from './DrillEffect';
import { BACKGROUND_TILE, PROPS_SHEET, ROOM_BACKGROUND_TILE } from './petAssets';
import { SheetCrop } from './SheetCrop';

/*
 * 홈 상단바 둘째 줄 — 펫이 사는 두 곳. 옆으로 밀면 광산 ↔ 방으로 넘어간다.
 *
 *   광산: 배경 타일(128×32 도트) + 왼쪽 보라 크리스탈 · 가운데 큰 바위(반전) · 오른쪽 큰 바위 ·
 *         맨 오른쪽 레일 위 광차. 펫은 광물 하나를 골라 캔다.
 *   방:   나무 방 배경. 펫은 밥 먹고 놀고 방석에서 잔다.
 *
 * 가진 펫(최대 8마리)이 지금 보고 있는 곳에만 나온다 — 안 보이는 곳은 애니메이션을 돌리지 않는다.
 */

const S = ART_SCALE;
const CART_MARGIN_RIGHT = 2 * S;
const ROCK_GAP = 4 * S;
/** 광물 자리 (화면 폭 비율) */
const CRYSTAL_AT = 0.22;
const MID_ROCK_AT = 0.5;
const PLACES: { place: Place; label: string }[] = [
  { place: 'mine', label: '광산' },
  { place: 'room', label: '방' },
];

/** 도트 칸에 맞춘 x */
const snap = (v: number) => Math.round(v / S) * S;

export function PetScene({
  petIds = [DEFAULT_PET_ID],
  onPress,
  expanded,
  drillKey = 0,
  onDrillDone,
}: {
  /** 팀 펫 id 목록 (최대 8) — 이 펫들이 나온다 */
  petIds?: string[];
  /** 누르면 채굴 패널 열기/닫기 */
  onPress?: () => void;
  expanded?: boolean;
  /** 올리면 광산으로 넘어가서 출석 드릴 연출을 한 번 재생한다 (0이면 안 함) */
  drillKey?: number;
  onDrillDone?: () => void;
}) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // 끝까지 재생한 드릴 번호 — drillKey가 이것보다 크면 재생 중이다
  const [drilledKey, setDrilledKey] = useState(0);
  const drilling = drillKey > drilledKey && width > 0;
  // 재생하는 동안은 광산을 보여준다
  const shownPage = drilling ? 0 : page;

  useEffect(() => {
    if (drillKey > 0) scrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [drillKey]);

  const finishDrill = () => {
    setDrilledKey(drillKey);
    setPage(0);
    onDrillDone?.();
  };

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

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const pets = (place: Place, rightLimit: number) =>
    petIds.map((id, i) => (
      <PetSprite
        key={id}
        petId={id}
        place={place}
        rockLeft={rightLimit}
        mineSpots={place === 'mine' ? mineSpots : undefined}
        // 처음엔 걸을 수 있는 폭에 고르게 나눠 세운다
        startX={((rightLimit - PICKAXE_RIGHT * S) * i) / Math.max(1, petIds.length)}
      />
    ));

  const pageProps = (place: Place, label: string) => ({
    style: [styles.page, { width }],
    onPress,
    disabled: !onPress,
    accessibilityRole: 'button' as const,
    accessibilityLabel: `${label} · 펫 ${petIds.length}마리 · 옆으로 밀면 ${place === 'mine' ? '방' : '광산'}`,
    accessibilityHint: '눌러서 채굴 현황 보기',
    accessibilityState: { expanded },
  });

  return (
    <View
      style={styles.scene}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
        >
          {/* 광산 */}
          <Pressable {...pageProps('mine', '광산')}>
            <Tiles source={BACKGROUND_TILE} width={width} />
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
            {shownPage === 0 && pets('mine', rockLeft)}
            {drilling && (
              <DrillEffect key={drillKey} left={drillLeftFor(width)} onDone={finishDrill} />
            )}
          </Pressable>

          {/* 방 */}
          <Pressable {...pageProps('room', '방')}>
            <Tiles source={ROOM_BACKGROUND_TILE} width={width} />
            {shownPage === 1 && pets('room', width - 4 * S)}
          </Pressable>
        </ScrollView>
      )}

      {/* 지금 어느 곳인지 — 점 두 개 */}
      <View style={styles.dots} pointerEvents="none">
        {PLACES.map((p, i) => (
          <View key={p.place} style={[styles.dot, i === shownPage && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

/** 배경 타일을 가로로 이어 붙인다 */
function Tiles({ source, width }: { source: ImageSourcePropType; width: number }) {
  const tileW = BG_W * S;
  return Array.from({ length: Math.ceil(width / tileW) }, (_, i) => (
    <Image
      key={i}
      source={source}
      fadeDuration={0}
      style={[styles.tile, { left: i * tileW, width: tileW }]}
    />
  ));
}

const styles = StyleSheet.create({
  scene: { width: '100%', height: BG_H * S, overflow: 'hidden', backgroundColor: '#1d1a24' },
  page: { height: BG_H * S, overflow: 'hidden' },
  tile: { position: 'absolute', top: 0, height: BG_H * S },
  abs: { position: 'absolute' },
  dots: {
    position: 'absolute',
    top: 3,
    right: 4,
    flexDirection: 'row',
    gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: 'rgba(255,255,255,0.85)' },
});
