import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import {
  ANIMS,
  ART_SCALE,
  BODY_LEFT,
  CELL_H,
  CELL_W,
  DEFAULT_CAT_ID,
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
  type CatAnim,
} from '../domain/catSheet';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { SheetCrop } from './SheetCrop';

/*
 * 동굴을 돌아다니는 고양이.
 *
 * 돌아다니기 · 바위에서 곡괭이질 · 노트북으로 코딩/영상 · 낮잠을 번갈아 한다.
 * resting이면 (나중에: 먹이 잔디가 없으면) 아무것도 안 하고 누워 쉰다.
 * 이동은 네이티브 드라이버 애니메이션이고, 프레임 교체는 이 컴포넌트 안에서만 일어난다.
 * 기기에서 "동작 줄이기"를 켜 두면 제자리에 가만히 앉아 있다.
 */

// require는 정적이어야 해서 색마다 적어 둔다 (scripts/build-pet-assets.mjs가 만든 파일)
const SHEETS: Record<string, ImageSourcePropType> = {
  orange: require('../../../assets/pets/cat_orange.png'),
  white: require('../../../assets/pets/cat_white.png'),
  cream: require('../../../assets/pets/cat_cream.png'),
  gray: require('../../../assets/pets/cat_gray.png'),
  blue: require('../../../assets/pets/cat_blue.png'),
  mint: require('../../../assets/pets/cat_mint.png'),
  pink: require('../../../assets/pets/cat_pink.png'),
  rainbow: require('../../../assets/pets/cat_rainbow.png'),
};
const PROPS_SHEET: ImageSourcePropType = require('../../../assets/pets/props.png');

const S = ART_SCALE;
const WALK_SPEED = 30; // dp/초
/** 고양이 몸 폭(도트). 왼쪽을 볼 때 뒤집으면 몸이 칸 안에서 옆으로 밀려서 이만큼 되돌린다 */
const BODY_W = 20;
const FLIP_SHIFT = (CELL_W - 2 * BODY_LEFT - BODY_W) * S;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

interface Props {
  /** 바위 왼쪽 끝 x (dp). 고양이는 이 왼쪽에서만 움직인다 */
  rockLeft: number;
  catId?: string;
  resting?: boolean;
}

export function CatPet({ rockLeft, catId = DEFAULT_CAT_ID, resting = false }: Props) {
  const sheet = SHEETS[catId] ?? SHEETS[DEFAULT_CAT_ID];
  const reduceMotion = useReduceMotion();

  const [x] = useState(() => new Animated.Value(0));
  const posRef = useRef(0);
  // 동작과 프레임 순번을 함께 둬서, 동작이 바뀌면 항상 첫 프레임부터 그린다
  const [motion, setMotion] = useState<{ anim: CatAnim; tick: number }>({ anim: 'idle', tick: 0 });
  const setAnim = (next: CatAnim) => setMotion({ anim: next, tick: 0 });
  const [facingLeft, setFacingLeft] = useState(false);

  // 동작 줄이기·쉬는 중이면 스케줄과 상관없이 고정 동작
  const walkable = rockLeft - PICKAXE_RIGHT * S > 0;
  const anim: CatAnim = reduceMotion || !walkable ? 'idle' : resting ? 'rest' : motion.anim;
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
    if (reduceMotion || walkMax <= 0 || resting) return;

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
      const activity = pickActivity(Math.random());
      if (activity === 'wander') {
        walkTo(nextWalkTarget(posRef.current, walkMax, Math.random()), idleThenNext);
      } else if (activity === 'mine') {
        // 곡괭이 끝이 바위에 닿는 자리까지 가서 오른쪽을 보고 캔다
        walkTo(walkMax + 2 * S, () => {
          setFacingLeft(false);
          setAnim('mine');
          later(idleThenNext, rand(4000, 8000));
        });
      } else if (activity === 'nap') {
        setAnim('rest');
        later(idleThenNext, rand(4000, 7000));
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
  }, [rockLeft, resting, reduceMotion, x]);

  const origin = frameOrigin(anim, tick);
  const striking = anim === 'mine' && tick % 2 === 1;

  return (
    <Animated.View style={[styles.cat, { transform: [{ translateX: x }] }]}>
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

      {striking && (
        <SheetCrop
          source={PROPS_SHEET}
          sheetW={PROPS_W}
          sheetH={PROPS_H}
          {...PROPS.sparkle}
          style={[styles.abs, { left: (PICKAXE_RIGHT - 3) * S, top: (CELL_H - 12) * S }]}
        />
      )}
      {anim === 'rest' && (
        <SheetCrop
          source={PROPS_SHEET}
          sheetW={PROPS_W}
          sheetH={PROPS_H}
          {...PROPS.z}
          style={[styles.abs, { left: 22 * S, top: (tick % 2 === 0 ? 1 : 0) * S }]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cat: { position: 'absolute', left: 0, top: 0, width: CELL_W * S, height: CELL_H * S },
  fill: { width: CELL_W * S, height: CELL_H * S },
  abs: { position: 'absolute' },
});
