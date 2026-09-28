import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { fonts } from '../../../shared/theme/theme';
import { DEFAULT_PET_ID, PETS, PET_SPEED, isMultiline, nextPetTarget } from '../domain/pets';

/*
 * 상단바 한 줄을 좌우로 돌아다니는 글자 펫.
 *
 * 걷기 → 잠깐 쉬기(가끔 깜빡임) → 다른 곳으로 걷기를 반복한다.
 * 이동은 네이티브 드라이버 애니메이션이라 JS가 바빠도 끊기지 않고,
 * 이 컴포넌트 안에서만 상태가 바뀌어 홈 화면 전체가 다시 그려지지 않는다.
 * 기기에서 "동작 줄이기"를 켜 두면 움직이지 않고 제자리에 앉아 있다.
 */

const STEP_MS = 220; // 걸을 때 통통 튀는 간격
const REST_MIN_MS = 1200;
const REST_MAX_MS = 4000;
const BLINK_MS = 180;
/** 여러 줄 픽셀 펫은 3줄이라, 상단바 글자 크기의 이 비율로 줄여서 높이를 맞춘다 */
const MULTILINE_SCALE = 0.7;

interface Props {
  color: string;
  fontSize: number;
  petId?: string;
}

export function TerminalPet({ color, fontSize, petId = DEFAULT_PET_ID }: Props) {
  const pet = PETS[petId] ?? PETS[DEFAULT_PET_ID];

  // 애니메이션 값은 한 번만 만들고 계속 쓴다 (렌더 중에 ref를 읽지 않도록 useState 초기화 함수로)
  const [x] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));
  const posRef = useRef(0);

  const [laneWidth, setLaneWidth] = useState(0);
  const [petWidth, setPetWidth] = useState(0);
  const [facingLeft, setFacingLeft] = useState(false);
  const [blinking, setBlinking] = useState(false);
  /** 걷는 동안 늘어나는 걸음 수 — 걷기 프레임(다리 모양)을 번갈아 고른다 */
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const maxX = laneWidth - petWidth;
    if (reduceMotion || maxX <= 0) return;

    let cancelled = false;
    let stepTimer: ReturnType<typeof setInterval> | null = null;
    const stopStepping = () => {
      if (stepTimer) clearInterval(stepTimer);
      stepTimer = null;
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const hopLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hop, { toValue: -2, duration: STEP_MS / 2, useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: STEP_MS / 2, useNativeDriver: true }),
      ])
    );

    const rest = () => {
      if (cancelled) return;
      const restMs = REST_MIN_MS + Math.random() * (REST_MAX_MS - REST_MIN_MS);
      // 쉬는 동안 한 번 깜빡인다
      later(() => setBlinking(true), restMs / 2);
      later(() => setBlinking(false), restMs / 2 + BLINK_MS);
      later(walk, restMs);
    };

    const walk = () => {
      if (cancelled) return;
      const from = posRef.current;
      const to = nextPetTarget(from, maxX, Math.random());
      setFacingLeft(to < from);
      hopLoop.start();
      stepTimer = setInterval(() => setStep((n) => n + 1), STEP_MS);
      Animated.timing(x, {
        toValue: to,
        duration: (Math.abs(to - from) / PET_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        stopStepping();
        hopLoop.stop();
        hop.setValue(0);
        if (!finished || cancelled) return;
        posRef.current = to;
        rest();
      });
    };

    // 길 너비가 바뀌면(회전 등) 길 밖으로 나가지 않게 안쪽으로 당긴다
    if (posRef.current > maxX) {
      posRef.current = maxX;
      x.setValue(maxX);
    }
    rest();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      stopStepping();
      // 멈춘 자리를 기억해야 다음 걷기가 순간이동 없이 이어진다
      x.stopAnimation((value) => {
        posRef.current = value;
      });
      hopLoop.stop();
    };
  }, [laneWidth, petWidth, reduceMotion, x, hop]);

  const frames = facingLeft ? pet.left : pet.right;
  const face = blinking ? pet.blink : frames[step % frames.length];

  // 여러 줄 픽셀 펫은 줄 간격을 글자 크기와 같게 붙여야 블록(█▄)이 끊기지 않고 이어진다
  const multiline = isMultiline(pet);
  const petFontSize = multiline ? Math.round(fontSize * MULTILINE_SCALE) : fontSize;
  const lineHeight = multiline ? petFontSize : fontSize * 1.4;

  return (
    <View
      style={styles.lane}
      onLayout={(e: LayoutChangeEvent) => setLaneWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`${pet.label} 펫`}
    >
      <Animated.Text
        style={[
          styles.pet,
          {
            color,
            fontSize: petFontSize,
            lineHeight,
            transform: [{ translateX: x }, { translateY: hop }],
          },
        ]}
        // 방향·깜빡임에 따라 글자 폭이 조금씩 달라서, 가장 넓은 폭을 기준으로 길 끝을 정한다
        // (폭이 줄 때마다 다시 계산하면 걷던 도중에 멈춰버린다)
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          setPetWidth((prev) => (w > prev ? w : prev));
        }}
      >
        {face}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: { width: '100%', overflow: 'hidden' },
  pet: { fontFamily: fonts.mono, alignSelf: 'flex-start' },
});
