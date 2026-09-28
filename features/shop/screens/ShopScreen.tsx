import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { purchaseFreeze } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { FREEZE_MAX, FREEZE_PRICE, freezePurchaseBlock } from '../domain/shopItems';

/*
 * 상점 — 코인으로 스트릭 프리즈를 산다. (daon-content/Daon-code_아이디어.md 1번)
 *
 * 버튼 활성화 여부는 화면에서 미리 판단하지만(shopItems.ts), 실제 차감은
 * 서버(purchase Edge Function)가 DB 잔액으로 다시 확인한다.
 * 테마·캐릭터는 다음 단계에서 이 화면에 상품으로 추가한다.
 */
export function ShopScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, error: loadError, reload } = useUserProgress();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const coins = profile?.coins ?? 0;
  const freezeCount = profile?.freeze_count ?? 0;
  const block = profile ? freezePurchaseBlock(coins, freezeCount) : 'not_enough_coins';

  const buy = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await purchaseFreeze();
      await reload();
      setMessage({ text: '프리즈를 샀어요. 하루 빠져도 스트릭이 지켜져요', ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '구매하지 못했어요', ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>상점</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.balance}>
          {loadError && !profile ? '코인을 불러오지 못했어요' : `보유 코인 ${coins}c`}
        </Text>

        <View style={styles.item}>
          <Text style={styles.itemIcon}>❄</Text>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>스트릭 프리즈</Text>
            <Text style={styles.itemDesc}>하루 빠져도 스트릭이 끊기지 않아요 (자동 사용)</Text>
            <Text style={styles.itemDesc}>
              보유 {freezeCount}/{FREEZE_MAX}
            </Text>
          </View>
          <Pressable
            style={[styles.buyButton, (block || busy) && styles.buyButtonDisabled]}
            onPress={buy}
            disabled={!!block || busy}
            accessibilityRole="button"
            accessibilityLabel={`스트릭 프리즈 ${FREEZE_PRICE}코인에 구매`}
            accessibilityState={{ disabled: !!block || busy }}
          >
            {busy ? (
              <ActivityIndicator color={getReadableTextColor(colors.accent)} />
            ) : (
              <Text style={styles.buyButtonText}>{FREEZE_PRICE}c</Text>
            )}
          </Pressable>
        </View>

        {block === 'max_reached' && <Text style={styles.hint}>이미 최대 개수를 가지고 있어요</Text>}
        {block === 'not_enough_coins' && profile && (
          <Text style={styles.hint}>코인 {FREEZE_PRICE - coins}개 더 모으면 살 수 있어요 · 레슨을 풀면 쌓여요</Text>
        )}
        {message && (
          <Text style={[styles.hint, { color: message.ok ? colors.success : colors.error }]}>{message.text}</Text>
        )}

        <Text style={styles.soon}>테마 · 캐릭터는 곧 추가돼요</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    close: { fontSize: 20, color: colors.textMuted },
    body: { padding: spacing.md, gap: spacing.sm },
    balance: { fontSize: 15, fontWeight: '700', color: colors.accent, fontFamily: fonts.mono, marginBottom: spacing.sm },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    itemIcon: { fontSize: 26, color: colors.xp },
    itemText: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
    itemDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    buyButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minWidth: 64,
      alignItems: 'center',
    },
    buyButtonDisabled: { opacity: 0.4 },
    buyButtonText: { fontSize: 14, fontWeight: '800', color: getReadableTextColor(colors.accent), fontFamily: fonts.mono },
    hint: { fontSize: 12, color: colors.textMuted },
    soon: { fontSize: 12, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
  });
