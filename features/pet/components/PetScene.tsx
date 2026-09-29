import { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ART_SCALE, BG_H, BG_W, GROUND_Y, PROPS, PROPS_H, PROPS_W } from '../domain/catSheet';
import { CatPet } from './CatPet';
import { SheetCrop } from './SheetCrop';

/*
 * 홈 상단바 둘째 줄 — 고양이가 일하는 광산 동굴.
 * 배경 타일(64×32 도트)을 가로로 이어 붙이고, 오른쪽 끝에 크리스탈 바위를 둔다.
 * 고양이는 바위 왼쪽에서 돌아다니다가 가끔 바위를 캔다.
 */

const BG = require('../../../assets/pets/background_tile.png');
const PROPS_SHEET = require('../../../assets/pets/props.png');

const S = ART_SCALE;
const ROCK_MARGIN_RIGHT = 6 * S;

export function PetScene({ catId, resting }: { catId?: string; resting?: boolean }) {
  const [width, setWidth] = useState(0);
  const tileW = BG_W * S;
  const tiles = Math.ceil(width / tileW);
  const rockLeft = width - PROPS.rock.w * S - ROCK_MARGIN_RIGHT;

  return (
    <View
      style={styles.scene}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel="광산에서 일하는 고양이"
    >
      {Array.from({ length: tiles }, (_, i) => (
        <Image
          key={i}
          source={BG}
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
          <CatPet rockLeft={rockLeft} catId={catId} resting={resting} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { width: '100%', height: BG_H * S, overflow: 'hidden', backgroundColor: '#1d1a24' },
  tile: { position: 'absolute', top: 0, height: BG_H * S },
  abs: { position: 'absolute' },
});
