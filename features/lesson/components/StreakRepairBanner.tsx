import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { repairStreak } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { PixelDiamond } from '../../pet/components/PixelDiamond';
import { STREAK_REPAIR_PRISMS } from '../../shop/domain/shopItems';

/*
 * 하루 빠진 날 홈 위에 뜨는 "스트릭 지킬래요?" 배너. (daon-content/재화_경제.md)
 * 프리즘은 자동으로 쓰지 않는다 — 사용자가 직접 눌러야 쓴다.
 * 지키지 않고 레슨을 풀면 스트릭은 1부터 다시 시작한다.
 */
export function StreakRepairBanner({
  streak,
  prisms,
  colors,
  onRepaired,
  onDismiss,
}: {
  streak: number;
  prisms: number;
  colors: ThemeColors;
  onRepaired: () => Promise<void> | void;
  onDismiss: () => void;
}) {
  const styles = createStyles(colors);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enough = prisms >= STREAK_REPAIR_PRISMS;

  const repair = async () => {
    setBusy(true);
    setError(null);
    try {
      await repairStreak();
      await onRepaired();
    } catch (e) {
      setError(e instanceof Error ? e.message : '스트릭을 지키지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.title}>어제 공부를 못 했어요 · 🔥 {streak}일 스트릭이 끊기기 직전</Text>
      <Text style={styles.sub}>
        {enough
          ? `프리즘 ${STREAK_REPAIR_PRISMS}개로 지키면 오늘 풀 때 이어져요. 안 지키고 풀면 1일부터 다시 시작해요.`
          : `지키려면 프리즘 ${STREAK_REPAIR_PRISMS}개가 필요해요 (지금 ${prisms}개) · 고양이가 출석마다 캐요`}
      </Text>
      {error && <Text style={[styles.sub, { color: colors.error }]}>{error}</Text>}

      <View style={styles.buttons}>
        {enough && (
          <Pressable
            style={[styles.button, busy && styles.disabled]}
            onPress={repair}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`프리즘 ${STREAK_REPAIR_PRISMS}개로 ${streak}일 스트릭 지키기`}
          >
            {busy ? (
              <ActivityIndicator color={getReadableTextColor(colors.accent)} />
            ) : (
              <View style={styles.buttonInner}>
                <PixelDiamond pixel={1.5} />
                <Text style={styles.buttonText}>{STREAK_REPAIR_PRISMS}개로 지키기</Text>
              </View>
            )}
          </Pressable>
        )}
        <Pressable
          style={styles.ghost}
          onPress={onDismiss}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="지키지 않기"
        >
          <Text style={styles.ghostText}>괜찮아요</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    banner: {
      margin: spacing.md,
      marginBottom: 0,
      padding: spacing.md,
      gap: 4,
      borderWidth: 2,
      borderColor: colors.streak,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    title: { fontSize: 14, fontWeight: '800', color: colors.text },
    sub: { fontSize: 12, color: colors.textMuted },
    buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minWidth: 120,
      alignItems: 'center',
    },
    buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    buttonText: {
      fontSize: 13,
      fontWeight: '800',
      color: getReadableTextColor(colors.accent),
      fontFamily: fonts.mono,
    },
    disabled: { opacity: 0.5 },
    ghost: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: 'center' },
    ghostText: { fontSize: 13, color: colors.textMuted },
  });
