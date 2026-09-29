import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exchangePrisms, purchaseCat } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { CatPortrait } from '../../pet/components/CatPortrait';
import { PixelDiamond } from '../../pet/components/PixelDiamond';
import { CAT_COLORS, ownedCoinCatCount, type CatColor } from '../../pet/domain/catSheet';
import {
  COINS_PER_PRISM,
  EXCHANGE_BUNDLES,
  catPrice,
  catPurchaseBlock,
  exchangeBlock,
} from '../domain/shopItems';

/*
 * 상점 — 코인 고양이는 코인으로, 프리즘 고양이(무지개)는 프리즘으로 산다. 프리즘은 코인으로 바꿀 수 있다.
 * 프리즘 충전(현금 결제)은 스토어 출시 때 붙인다. (daon-content/재화_경제.md)
 *
 * 버튼 활성화는 화면에서 미리 판단하지만(shopItems.ts), 실제 차감은
 * 서버(purchase Edge Function)가 DB 잔액으로 다시 확인한다.
 */
export function ShopScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, error: loadError, reload } = useUserProgress();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const wallet = { coins: profile?.coins ?? 0, prisms: profile?.prisms ?? 0 };
  const owned = profile?.owned_cats ?? ['orange'];
  const coinCats = ownedCoinCatCount(owned);
  const forSale = CAT_COLORS.filter((cat) => !owned.includes(cat.id));

  const buyCat = async (cat: CatColor) => {
    setBusy(true);
    setMessage(null);
    try {
      await purchaseCat(cat.id);
      await reload();
      setMessage({ text: `${cat.label} 고양이가 광산에 왔어요!`, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '구매하지 못했어요', ok: false });
    } finally {
      setBusy(false);
    }
  };

  const exchange = async (amount: number) => {
    setBusy(true);
    setMessage(null);
    try {
      await exchangePrisms(amount);
      await reload();
      setMessage({
        text: `프리즘 ${amount}개를 ${amount * COINS_PER_PRISM}코인으로 바꿨어요`,
        ok: true,
      });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '바꾸지 못했어요', ok: false });
    } finally {
      setBusy(false);
    }
  };

  const renderCat = (cat: CatColor) => {
    const price = catPrice(cat.currency, coinCats);
    const block = profile ? catPurchaseBlock(wallet, owned, cat, coinCats) : 'not_enough_coins';
    const prism = cat.currency === 'prism';
    return (
      <View key={cat.id} style={[styles.item, prism && { borderColor: colors.xp }]}>
        <View style={[styles.itemIcon, styles.catBox]}>
          <CatPortrait catId={cat.id} />
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemName}>{cat.label} 고양이</Text>
          <Text style={[styles.itemDesc, prism && { color: colors.xp }]}>
            출석 채굴량 +{cat.power}
            {prism ? ' ★ 보통 고양이 3마리 몫' : ''}
          </Text>
        </View>
        <Pressable
          style={[styles.buyButton, (block || busy) && styles.buyButtonDisabled]}
          onPress={() => buyCat(cat)}
          disabled={!!block || busy}
          accessibilityRole="button"
          accessibilityLabel={`${cat.label} 고양이 ${prism ? '프리즘' : '코인'} ${price}개에 구매`}
          accessibilityState={{ disabled: !!block || busy }}
        >
          {busy ? (
            <ActivityIndicator color={getReadableTextColor(colors.accent)} />
          ) : prism ? (
            <View style={styles.priceRow}>
              <PixelDiamond pixel={1.5} />
              <Text style={styles.buyButtonText}>{price}</Text>
            </View>
          ) : (
            <Text style={styles.buyButtonText}>{price}c</Text>
          )}
        </Pressable>
      </View>
    );
  };

  const coinForSale = forSale.filter((c) => c.currency === 'coin');
  const prismForSale = forSale.filter((c) => c.currency === 'prism');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>상점</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loadError && !profile ? (
          <Text style={styles.balance}>잔액을 불러오지 못했어요</Text>
        ) : (
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{wallet.coins}c</Text>
            <PixelDiamond pixel={2} />
            <Text style={[styles.balance, { color: colors.text }]}>{wallet.prisms}</Text>
          </View>
        )}
        {message && (
          <Text style={[styles.hint, { color: message.ok ? colors.success : colors.error }]}>
            {message.text}
          </Text>
        )}

        <Text style={styles.section}>코인 고양이 · 많을수록 많이 캐요 · 살수록 비싸져요</Text>
        {coinForSale.map(renderCat)}
        {coinForSale.length === 0 && <Text style={styles.hint}>코인 고양이를 전부 모았어요!</Text>}

        <Text style={styles.section}>프리즘 고양이</Text>
        {prismForSale.map(renderCat)}
        {prismForSale.length === 0 && <Text style={styles.hint}>프리즘 고양이를 모았어요!</Text>}

        <Text style={styles.section}>프리즘 → 코인</Text>
        <View style={styles.item}>
          <View style={styles.itemIcon}>
            <PixelDiamond pixel={3} />
          </View>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>코인으로 바꾸기</Text>
            <Text style={styles.itemDesc}>
              프리즘 1개 = {COINS_PER_PRISM}코인 · 코인 고양이를 빨리 모을 때
            </Text>
          </View>
          <View style={styles.exchangeButtons}>
            {EXCHANGE_BUNDLES.map((amount) => {
              const blocked = !profile || !!exchangeBlock(wallet.prisms, amount);
              return (
                <Pressable
                  key={amount}
                  style={[styles.buyButton, (blocked || busy) && styles.buyButtonDisabled]}
                  onPress={() => exchange(amount)}
                  disabled={blocked || busy}
                  accessibilityRole="button"
                  accessibilityLabel={`프리즘 ${amount}개를 ${amount * COINS_PER_PRISM}코인으로 바꾸기`}
                  accessibilityState={{ disabled: blocked || busy }}
                >
                  <Text style={styles.buyButtonText}>{amount * COINS_PER_PRISM}c</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.section}>프리즘 충전</Text>
        <View style={[styles.item, styles.itemDisabled]}>
          <View style={styles.itemIcon}>
            <PixelDiamond pixel={3} />
          </View>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>프리즘 묶음</Text>
            <Text style={styles.itemDesc}>
              스토어 출시 때 열려요 · 지금은 고양이가 출석마다 캐요
            </Text>
          </View>
        </View>

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
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    balance: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: fonts.mono,
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
    itemDisabled: { opacity: 0.5 },
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
    exchangeButtons: { gap: spacing.xs },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    buyButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: getReadableTextColor(colors.accent),
      fontFamily: fonts.mono,
    },
    hint: { fontSize: 12, color: colors.textMuted },
    soon: { fontSize: 12, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
  });
