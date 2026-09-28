import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** 기기의 "동작 줄이기" 설정. 켜져 있으면 펫·구름이 움직이지 않는다. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  return reduceMotion;
}
