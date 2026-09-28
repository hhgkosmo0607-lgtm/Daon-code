import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { DEFAULT_PET_ID, PETS, PET_SPEED, nextPetTarget, spriteToRuns, type Sprite } from '../domain/pets';

/*
 * 상단바 한 줄을 좌우로 돌아다니는 도트 펫 (다마고치 방식).
 *
 * 걷기 → 잠깐 쉬기(가끔 깜빡임) → 다른 곳으로 걷기를 반복한다.
 * 이동은 네이티브 드라이버 애니메이션이라 JS가 바빠도 끊기지 않고,
 * 이 컴포넌트 안에서만 상태가 바뀌어 홈 화면 전체가 다시 그려지지 않는다.
 * 기기에서 "동작 줄이기"를 켜 두면 움직이지 않고 제자리에 서 있다.
 */

const STEP_MS = 260; // 걸을 때 발을 바꾸는 간격 (다마고치처럼 뚝뚝 끊기는 느낌)
const REST_MIN_MS = 1200;
const REST_MAX_MS = 4000;
const BLINK_MS = 180;

interface Props {
  color: string;
  /** 도트 한 칸의 크기 (px) */
  pixelSize?: number;
  petId?: string;
}

export function TerminalPet({ color, pixelSize = 2, petId = DEFAULT_PET_ID }: Props) {
  const pet = PETS[petId] ?? PETS[DEFAULT_PET_ID];
  const petWidth = pet.idle[0].length * pixelSize;
  const petHeight = pet.idle.length * pixelSize;

  // 애니메이션 값은 한 번만 만들고 계속 쓴다 (렌더 중에 ref를 읽지 않도록 useState 초기화 함수로)
  const [x] = useState(() => new Animated.Value(0));
  const posRef = useRef(0);

  const [laneWidth, setLaneWidth] = useState(0);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [blinking, setBlinking] = useState(false);
  /** 걷는 동안 늘어나는 걸음 수 — 걷기 그림(발 모양)을 번갈아 고른다 */
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
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    const rest = () => {
      if (cancelled) return;
      setWalking(false);
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
      setWalking(true);
      stepTimer = setInterval(() => setStep((n) => n + 1), STEP_MS);
      Animated.timing(x, {
        toValue: to,
        duration: (Math.abs(to - from) / PET_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        stopStepping();
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
    };
  }, [laneWidth, petWidth, reduceMotion, x]);

  let sprite: Sprite;
  if (walking) {
    const frames = facingLeft ? pet.left : pet.right;
    sprite = frames[step % frames.length];
  } else {
    sprite = blinking ? pet.blink : pet.idle;
  }
  const runs = useMemo(() => spriteToRuns(sprite), [sprite]);

  return (
    <View
      style={[styles.lane, { height: petHeight }]}
      onLayout={(e: LayoutChangeEvent) => setLaneWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`${pet.label} 펫`}
    >
      <Animated.View style={{ width: petWidth, height: petHeight, transform: [{ translateX: x }] }}>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: { width: '100%', overflow: 'hidden' },
});
