import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ART_SCALE } from '../domain/petSheet';
import { DRILL, drillFrameOrigin } from '../domain/drill';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { DRILL_SHEET } from './petAssets';
import { SheetCrop } from './SheetCrop';

/**
 * 출석 드릴 연출을 한 번 재생하고 onDone을 부른다.
 * "동작 줄이기"면 재생하지 않고 바로 끝낸다.
 */
export function DrillEffect({ left, onDone }: { left: number; onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const [frame, setFrame] = useState(0);
  // 부모가 다시 그려져 onDone이 바뀌어도 재생을 다시 시작하지 않게 ref로 들고 있는다
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (reduceMotion) {
      done.current();
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (i >= DRILL.frames) {
        clearInterval(timer);
        done.current();
        return;
      }
      setFrame(i);
    }, DRILL.frameMs);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  if (reduceMotion) return null;
  const origin = drillFrameOrigin(frame);
  return (
    <SheetCrop
      source={DRILL_SHEET}
      sheetW={DRILL.sheetW}
      sheetH={DRILL.sheetH}
      x={origin.x}
      y={origin.y}
      w={DRILL.frameW}
      h={DRILL.frameH}
      style={[styles.abs, { left, top: 0 }]}
    />
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});

/** 장면 폭 가운데에 드릴이 오게 하는 left (dp) */
export function drillLeftFor(sceneWidth: number): number {
  const w = DRILL.frameW * ART_SCALE;
  return Math.round((sceneWidth - w) / 2 / ART_SCALE) * ART_SCALE;
}
