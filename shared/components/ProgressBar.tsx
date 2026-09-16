import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/theme';
import type { ThemeColors } from '../theme/themes';

/** 레슨 진행률 바 (현재 문제 / 전체 문제) */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ratio = total === 0 ? 0 : Math.min(current / total, 1);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      flex: 1,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    // 진행바는 accent 역할(진행중 표시)로 통일한다
    fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.full },
  });
