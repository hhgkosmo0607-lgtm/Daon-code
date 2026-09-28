import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import type { ThemeColors } from '../../../shared/theme/themes';
import { DEFAULT_PET_ID, PETS } from '../domain/pets';
import {
  CLOUD,
  FLOWER_HEAD,
  FLOWER_POSITIONS,
  FLOWER_STEM,
  GROUND_ROWS,
  SUN,
  groundSprites,
} from '../domain/scenery';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { PixelSprite } from './PixelSprite';
import { TerminalPet } from './TerminalPet';

/*
 * 홈 상단바 둘째 줄 — 펫이 사는 작은 도트 풍경.
 *
 *   ☀ 해(오른쪽 위)   ☁ 구름 두 개가 천천히 흘러감
 *   🌼 꽃 네 송이      🐣 펫이 풀밭 위를 걸어다님
 *   ▓▓▓ 풀 + 흙
 *
 * 색은 전부 테마 색이라 테마를 바꾸면 풍경도 같이 바뀐다.
 */

const PX = 2; // 도트 한 칸 크기
const SKY_ROWS = 4; // 펫 머리 위 여유 (구름·해가 걸리는 공간)
const CLOUD_SPEEDS_MS = [48000, 70000]; // 구름이 화면을 한 번 가로지르는 시간

export function PetScene({ colors }: { colors: ThemeColors }) {
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const cols = Math.ceil(width / PX);

  const petRows = PETS[DEFAULT_PET_ID].idle.length;
  const height = (SKY_ROWS + petRows + GROUND_ROWS) * PX;
  const ground = useMemo(() => groundSprites(cols), [cols]);

  return (
    <View
      style={[styles.scene, { height, backgroundColor: colors.background }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <PixelSprite
        sprite={SUN}
        color={colors.streak}
        pixelSize={PX}
        style={[styles.abs, { right: 10, top: PX * 2 }]}
      />

      {width > 0 &&
        CLOUD_SPEEDS_MS.map((duration, i) => (
          <DriftingCloud
            key={duration}
            sceneWidth={width}
            duration={duration}
            startRatio={i === 0 ? 0.2 : 0.65}
            top={PX * (i === 0 ? 1 : 5)}
            color={colors.textMuted}
            still={reduceMotion}
          />
        ))}

      {width > 0 &&
        FLOWER_POSITIONS.map((ratio, i) => {
          const left = Math.round((ratio * width) / PX) * PX;
          const bottom = GROUND_ROWS * PX;
          return (
            <View key={ratio} style={[styles.abs, { left, bottom }]} pointerEvents="none">
              <PixelSprite
                sprite={FLOWER_HEAD}
                color={i % 2 === 0 ? colors.accent : colors.error}
                pixelSize={PX}
              />
              <PixelSprite
                sprite={FLOWER_STEM}
                color={colors.success}
                pixelSize={PX}
                style={{ marginLeft: PX }}
              />
            </View>
          );
        })}

      {/* 땅: 풀 무늬 한 줄 + 흙 두 줄 */}
      <View style={[styles.abs, { left: 0, bottom: 0 }]} pointerEvents="none">
        <PixelSprite sprite={ground.grass} color={colors.success} pixelSize={PX} />
        <PixelSprite
          sprite={ground.soil}
          color={colors.accent}
          pixelSize={PX}
          style={{ opacity: 0.45 }}
        />
      </View>

      {/* 펫은 풀 위에 선다 (발이 풀 줄에 살짝 걸치게) */}
      <View style={[styles.abs, { left: 0, right: 0, bottom: (GROUND_ROWS - 1) * PX }]}>
        <TerminalPet color={colors.text} fillColor={colors.background} pixelSize={PX} />
      </View>
    </View>
  );
}

function DriftingCloud({
  sceneWidth,
  duration,
  startRatio,
  top,
  color,
  still,
}: {
  sceneWidth: number;
  duration: number;
  startRatio: number;
  top: number;
  color: string;
  still: boolean;
}) {
  const cloudWidth = CLOUD[0].length * PX;
  const startX = startRatio * sceneWidth;
  const [x] = useState(() => new Animated.Value(startX));

  useEffect(() => {
    if (still) {
      x.setValue(startX);
      return;
    }
    // 처음엔 지금 자리에서 오른쪽 끝까지, 그다음부터는 왼쪽 밖에서 오른쪽 밖까지 반복
    const span = sceneWidth + cloudWidth;
    const first = Animated.timing(x, {
      toValue: sceneWidth,
      duration: ((sceneWidth - startX) / span) * duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: -cloudWidth, duration: 0, useNativeDriver: true }),
        Animated.timing(x, {
          toValue: sceneWidth,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.sequence([first, loop]).start();
    return () => x.stopAnimation();
  }, [sceneWidth, cloudWidth, startX, duration, still, x]);

  return (
    <Animated.View
      style={[styles.abs, { top, left: 0, opacity: 0.55, transform: [{ translateX: x }] }]}
    >
      <PixelSprite sprite={CLOUD} color={color} pixelSize={PX} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: { width: '100%', overflow: 'hidden' },
  abs: { position: 'absolute' },
});
