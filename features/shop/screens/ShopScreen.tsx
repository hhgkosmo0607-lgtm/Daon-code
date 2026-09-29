import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { purchaseCat, purchaseFreeze } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { CatPortrait } from '../../pet/components/CatPortrait';
import { PixelDiamond } from '../../pet/components/PixelDiamond';
import { CAT_COLORS } from '../../pet/domain/catSheet';
import {
  CAT_PRICE,
  FREEZE_MAX,
  FREEZE_PRICE,
  catPurchaseBlock,
  freezePurchaseBlock,
} from '../domain/shopItems';

/*
 * 상점 — 코인으로 스트릭 프리즈와 고양이를 산다. (daon-content/Daon-code_아이디어.md 1번)
 *
 * 버튼 활성화 여부는 화면에서 미리 판단하지만(shopItems.ts), 실제 차감은
 * 서버(purchase Edge Function)가 DB 잔액으로 다시 확인한다.
 * 테마는 다음 단계에서 이 화면에 상품으로 추가한다.
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

  const owned = profile?.owned_cats ?? ['orange'];
  const buyCat = async (catId: string, label: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await purchaseCat(catId);
      await reload();
      setMessage({ text: `${label} 고양이가 광산에 왔어요!`, ok: true });
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

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.balance}>
          {loadError && !profile ? '코인을 불러오지 못했어요' : `보유 코인 ${coins}c`}
        </Text>

        <View style={styles.item}>
          <View style={styles.itemIcon}>
            <PixelDiamond pixel={3} />
          </View>
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
          <Text style={styles.hint}>
            코인 {FREEZE_PRICE - coins}개 더 모으면 살 수 있어요 · 레슨을 풀면 쌓여요
          </Text>
        )}
        {message && (
          <Text style={[styles.hint, { color: message.ok ? colors.success : colors.error }]}>
            {message.text}
          </Text>
        )}

        <Text style={styles.section}>
          고양이 {owned.length}/{CAT_COLORS.length} · 가진 고양이는 모두 광산에서 일해요
        </Text>
        {CAT_COLORS.filter((cat) => !owned.includes(cat.id)).map((cat) => {
          const catBlock = profile
            ? catPurchaseBlock(
                coins,
                owned,
                cat.id,
                CAT_COLORS.map((c) => c.id)
              )
            : 'not_enough_coins';
          return (
            <View key={cat.id} style={styles.item}>
              <View style={[styles.itemIcon, styles.catBox]}>
                <CatPortrait catId={cat.id} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{cat.label} 고양이</Text>
                <Text style={styles.itemDesc}>광산에서 함께 일해요</Text>
              </View>
              <Pressable
                style={[styles.buyButton, (catBlock || busy) && styles.buyButtonDisabled]}
                onPress={() => buyCat(cat.id, cat.label)}
                disabled={!!catBlock || busy}
                accessibilityRole="button"
                accessibilityLabel={`${cat.label} 고양이 ${CAT_PRICE}코인에 구매`}
                accessibilityState={{ disabled: !!catBlock || busy }}
              >
                <Text style={styles.buyButtonText}>{CAT_PRICE}c</Text>
              </Pressable>
            </View>
          );
        })}
        {owned.length >= CAT_COLORS.length && (
          <Text style={styles.hint}>고양이를 전부 모았어요!</Text>
        )}

        <Text style={styles.soon}>테마는 곧 추가돼요</Text>
      </ScrollView>
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
    balance: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: fonts.mono,
      marginBottom: spacing.sm,
    },
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
    itemIcon: { width: 48, alignItems: 'center', justifyContent: 'center' },
    catBox: { backgroundColor: '#2a2533', borderRadius: radius.sm, paddingVertical: 2 },
    section: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.lg },
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
    buyButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: getReadableTextColor(colors.accent),
      fontFamily: fonts.mono,
    },
    hint: { fontSize: 12, color: colors.textMuted },
    soon: { fontSize: 12, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
  });
