import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ANIMS,
  ART_SCALE,
  BODY_LEFT,
  CELL_H,
  CELL_W,
  LAPTOP_RIGHT,
  PICKAXE_RIGHT,
  PROPS,
  PROPS_H,
  PROPS_W,
  SHEET_H,
  SHEET_W,
  frameOrigin,
  nextWalkTarget,
  pickActivity,
  type PetAnim,
  type Place,
} from '../domain/petSheet';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { DEFAULT_PET_ID } from '../domain/petCatalog';
import { PET_SHEETS, PROPS_SHEET } from './petAssets';
import { PixelDiamond } from './PixelDiamond';
import { SheetCrop } from './SheetCrop';

/*
 * 광산·방을 돌아다니는 펫.
 *
 * 광산: 돌아다니기 · 광물 하나를 골라 곡괭이질 · 노트북으로 코딩/영상 · 낮잠
 * 방:   돌아다니기 · 밥 먹기 · 공놀이 · 방석에서 잠 · 노트북 (밥그릇·공·방석은 시트 칸에 그려져 있다)
 * 이동은 네이티브 드라이버 애니메이션이고, 프레임 교체는 이 컴포넌트 안에서만 일어난다.
 * 기기에서 "동작 줄이기"를 켜 두면 제자리에 가만히 앉아 있다.
 */

const S = ART_SCALE;
const WALK_SPEED = 30; // dp/초
/** 펫 몸 폭(도트). 왼쪽을 볼 때 뒤집으면 몸이 칸 안에서 옆으로 밀려서 이만큼 되돌린다 */
const BODY_W = 20;
const FLIP_SHIFT = (CELL_W - 2 * BODY_LEFT - BODY_W) * S;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

interface Props {
  /** 오른쪽 끝 x (dp) — 광산에선 오른쪽 바위 왼쪽 끝. 펫은 이 왼쪽에서만 움직인다 */
  rockLeft: number;
  /** 있는 곳 — 할 일이 달라진다 */
  place?: Place;
  petId?: string;
  /** 처음 서 있는 x (dp) — 여러 마리가 겹쳐서 시작하지 않게 */
  startX?: number;
  /** 곡괭이질할 때 서는 x 후보 (dp) — 광물마다 하나. 없으면 오른쪽 바위 앞 */
  mineSpots?: number[];
  /** 펫을 누르면 (펫 관리로) */
  onPress?: () => void;
  /** 머리 위 말풍선 — 받을 프리즘이 있을 때 이 펫이 알려 준다 */
  bubble?: { count: number; onPress: () => void };
}

export function PetSprite({
  rockLeft,
  place = 'mine',
  petId = DEFAULT_PET_ID,
  startX = 0,
  mineSpots,
  onPress,
  bubble,
}: Props) {
  const sheet = PET_SHEETS[petId] ?? PET_SHEETS[DEFAULT_PET_ID];
  const reduceMotion = useReduceMotion();

  const [x] = useState(() => new Animated.Value(startX));
  const posRef = useRef(startX);
  // 동작과 프레임 순번을 함께 둬서, 동작이 바뀌면 항상 첫 프레임부터 그린다
  const [motion, setMotion] = useState<{ anim: PetAnim; tick: number }>({ anim: 'idle', tick: 0 });
  const setAnim = (next: PetAnim) => setMotion({ anim: next, tick: 0 });
  const [facingLeft, setFacingLeft] = useState(false);

  // 동작 줄이기면 스케줄과 상관없이 고정 동작
  const walkable = rockLeft - PICKAXE_RIGHT * S > 0;
  const anim: PetAnim = reduceMotion || !walkable ? 'idle' : motion.anim;
  const tick = reduceMotion ? 0 : motion.tick;

  // 프레임 넘기기
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(
      () => setMotion((m) => ({ ...m, tick: m.tick + 1 })),
      ANIMS[anim].frameMs
    );
    return () => clearInterval(timer);
  }, [anim, reduceMotion]);

  // 할 일 고르기 → 걸어가기 → 하기 → 쉬기를 반복
  useEffect(() => {
    const walkMax = rockLeft - PICKAXE_RIGHT * S;
    if (reduceMotion || walkMax <= 0) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms));
    };

    const walkTo = (to: number, then: () => void) => {
      const from = posRef.current;
      if (Math.abs(to - from) < 1) return then();
      setFacingLeft(to < from);
      setAnim('walk');
      Animated.timing(x, {
        toValue: to,
        duration: (Math.abs(to - from) / WALK_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        posRef.current = to;
        then();
      });
    };

    const idleThenNext = () => {
      setAnim('idle');
      later(next, rand(1500, 4000));
    };

    const openLaptop = (show: 'code' | 'video') => {
      const laptopMax = rockLeft - LAPTOP_RIGHT * S;
      walkTo(Math.max(0, Math.random() * laptopMax), () => {
        setFacingLeft(false);
        setAnim('laptopOpen');
        later(() => {
          setAnim(show);
          later(idleThenNext, rand(4000, 7000));
        }, ANIMS.laptopOpen.frames * ANIMS.laptopOpen.frameMs);
      });
    };

    function next() {
      const activity = pickActivity(Math.random(), place);
      if (activity === 'wander') {
        walkTo(nextWalkTarget(posRef.current, walkMax, Math.random()), idleThenNext);
      } else if (activity === 'mine') {
        // 광물 하나를 골라, 곡괭이 끝이 닿는 자리까지 가서 오른쪽을 보고 캔다
        const spots = mineSpots?.length ? mineSpots : [walkMax + 2 * S];
        walkTo(spots[Math.floor(Math.random() * spots.length)], () => {
          setFacingLeft(false);
          setAnim('mine');
          later(idleThenNext, rand(4000, 8000));
        });
      } else if (activity === 'nap') {
        setAnim('rest');
        later(idleThenNext, rand(4000, 7000));
      } else if (activity === 'eat' || activity === 'play' || activity === 'sleep') {
        // 제자리에서 (밥그릇·공·방석이 오른쪽에 그려져 있어서 오른쪽을 본다)
        setFacingLeft(false);
        setAnim(activity);
        later(idleThenNext, activity === 'sleep' ? rand(6000, 10000) : rand(3000, 6000));
      } else {
        openLaptop(activity);
      }
    }

    // 길이 줄었으면(회전 등) 안쪽으로 당긴 뒤 시작
    if (posRef.current > walkMax) {
      posRef.current = walkMax;
      x.setValue(walkMax);
    }
    later(idleThenNext, 0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      x.stopAnimation((value) => {
        posRef.current = value;
      });
    };
  }, [rockLeft, place, mineSpots, reduceMotion, x]);

  const origin = frameOrigin(anim, tick);
  const striking = anim === 'mine' && tick % 2 === 1;

  return (
    <Animated.View style={[styles.cat, { transform: [{ translateX: x }] }]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel="펫 관리"
        style={styles.fill}
      >
        <View
          style={[
            styles.fill,
            facingLeft && { marginLeft: -FLIP_SHIFT, transform: [{ scaleX: -1 }] },
          ]}
        >
          <SheetCrop
            source={sheet}
            sheetW={SHEET_W}
            sheetH={SHEET_H}
            x={origin.x}
            y={origin.y}
            w={CELL_W}
            h={CELL_H}
          />
        </View>
      </Pressable>

      {striking && (
        <SheetCrop
          source={PROPS_SHEET}
          sheetW={PROPS_W}
          sheetH={PROPS_H}
          {...PROPS.sparkle}
          style={[styles.abs, { left: (PICKAXE_RIGHT - 3) * S, top: (CELL_H - 12) * S }]}
        />
      )}
      {(anim === 'rest' || anim === 'sleep') && (
        <SheetCrop
          source={PROPS_SHEET}
          sheetW={PROPS_W}
          sheetH={PROPS_H}
          {...PROPS.z}
          style={[styles.abs, { left: 22 * S, top: (tick % 2 === 0 ? 1 : 0) * S }]}
        />
      )}
      {bubble && bubble.count > 0 && (
        <Pressable
          style={styles.bubble}
          onPress={bubble.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`프리즘 ${bubble.count}개 받기`}
        >
          <PixelDiamond pixel={1} />
          <Text style={styles.bubbleText}>{bubble.count}개 받기</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cat: { position: 'absolute', left: 0, top: 0, width: CELL_W * S, height: CELL_H * S },
  fill: { width: CELL_W * S, height: CELL_H * S },
  abs: { position: 'absolute' },
  // 머리 오른쪽 위 흰 말풍선 (장면 위쪽 안에 들어가게)
  bubble: {
    position: 'absolute',
    left: 20 * S,
    top: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f8f8f2',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bubbleText: { fontSize: 10, fontWeight: '800', color: '#282A36' },
});
