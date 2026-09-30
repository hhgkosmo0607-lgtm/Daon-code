import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/theme';

/*
 * 화면 아래에 잠깐 떴다 사라지는 알림 (토스트).
 * 모달 화면은 루트 위에 따로 뜨기 때문에, 화면마다 useToast()로 자기 토스트를 그린다.
 *
 *   const toast = useToast();
 *   toast.show('구매했어요');            // 성공
 *   toast.show('코인이 부족해요', 'error');
 *   return (<>{...화면}{toast.element}</>);
 */

type Tone = 'ok' | 'error';

const SHOW_MS = 2200;

export function useToast(): { show: (message: string, tone?: Tone) => void; element: ReactNode } {
  const [toast, setToast] = useState<{ message: string; tone: Tone; key: number } | null>(null);
  const show = useCallback((message: string, tone: Tone = 'ok') => {
    setToast({ message, tone, key: Date.now() });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);
  const element = toast ? (
    <ToastView
      key={toast.key}
      message={toast.message}
      tone={toast.tone}
      onHide={() => setToast(null)}
    />
  ) : null;
  return { show, element };
}

function ToastView({ message, tone, onHide }: { message: string; tone: Tone; onHide: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const hide = useRef(onHide);
  useEffect(() => {
    hide.current = onHide;
  }, [onHide]);

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(SHOW_MS),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && hide.current());
    return () => anim.stop();
  }, [opacity]);

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + spacing.lg }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            opacity,
            backgroundColor: colors.text,
            borderColor: tone === 'error' ? colors.error : 'transparent',
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.background }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
