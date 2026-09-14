import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/theme';

/** 레슨 진행률 바 (현재 문제 / 전체 문제) */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.min(current / total, 1);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.full },
});
