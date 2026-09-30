import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exchangePrisms, purchasePet } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { PetPortrait } from '../../pet/components/PetPortrait';
import { PixelDiamond } from '../../pet/components/PixelDiamond';
import { TEAM_MAX } from '../../pet/domain/mining';
import { DEFAULT_PET_ID, PETS, SPECIES_LABEL, type PetDef } from '../../pet/domain/petCatalog';
import {
  COINS_PER_PRISM,
  EXCHANGE_BUNDLES,
  exchangeBlock,
  petPrice,
  petPurchaseBlock,
} from '../domain/shopItems';

/*
 * 상점 — 펫을 2열로 보여준다. 프리즘 펫이 먼저, 코인 펫은 가격 등급별로 묶는다.
 * 산 펫도 사라지지 않고 '구매 완료'로 남는다. 프리즘은 코인으로 바꿀 수 있고,
 * 프리즘 충전(현금 결제)은 스토어 출시 때 붙인다. (daon-content/재화_경제.md)
 *
 * 버튼 활성화는 화면에서 미리 판단하지만(shopItems.ts), 실제 차감은
 * 서버(purchase Edge Function)가 DB 잔액으로 다시 확인한다.
 */

interface Section {
  title: string;
  pets: PetDef[];
}

/** 프리즘 펫 한 묶음 + 코인 펫은 가격이 같은 종끼리 한 묶음 (싼 것부터) */
function buildSections(): Section[] {
  const shop = PETS.filter((p) => p.id !== DEFAULT_PET_ID);
  const prism = shop.filter((p) => p.currency === 'prism');
  const byPrice = new Map<number, PetDef[]>();
  for (const pet of shop.filter((p) => p.currency === 'coin')) {
    const price = petPrice(pet);
    byPrice.set(price, [...(byPrice.get(price) ?? []), pet]);
  }
  const coinSections = [...byPrice.entries()]
    .sort(([a], [b]) => a - b)
    .map(([price, pets]) => {
      const species = [...new Set(pets.map((p) => SPECIES_LABEL[p.species] ?? p.species))];
      return { title: `${price}코인 · ${species.join(' · ')}`, pets };
    });
  return [{ title: '프리즘 펫 · 채굴력 3', pets: prism }, ...coinSections];
}

const SECTIONS = buildSections();

export function ShopScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, error: loadError, reload } = useUserProgress();

  /** 지금 처리 중인 상품 (펫 id 또는 'exchange') */
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const wallet = { coins: profile?.coins ?? 0, prisms: profile?.prisms ?? 0 };
  const owned = profile?.owned_pets ?? [DEFAULT_PET_ID];
  const teamFull = (profile?.team_pets.length ?? 1) >= TEAM_MAX;

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      await reload();
      setMessage({ text: success, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '실패했어요', ok: false });
    } finally {
      setBusy(null);
    }
  };

  const buyPet = (pet: PetDef) =>
    run(
      pet.id,
      () => purchasePet(pet.id),
      teamFull
        ? `새 펫: ${pet.label} · 팀이 꽉 차서 '내 펫'에서 팀에 넣을 수 있어요`
        : `새 펫: ${pet.label} · 팀에 들어와서 광산에서 같이 일해요`
    );

  const renderPet = (pet: PetDef) => {
    const price = petPrice(pet);
    const prism = pet.currency === 'prism';
    const bought = owned.includes(pet.id);
    const block = profile ? petPurchaseBlock(wallet, owned, pet) : 'not_enough_coins';
    return (
      <View key={pet.id} style={[styles.card, prism && { borderColor: colors.xp }]}>
        <View style={styles.portraitBox}>
          <PetPortrait petId={pet.id} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {pet.label}
        </Text>
        {bought ? (
          <View style={styles.boughtBadge} accessibilityLabel={`${pet.label} 구매 완료`}>
            <Text style={styles.boughtText}>구매 완료</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.buyButton, (block || busy) && styles.buyButtonDisabled]}
            onPress={() => buyPet(pet)}
            disabled={!!block || !!busy}
            accessibilityRole="button"
            accessibilityLabel={`${pet.label} ${prism ? '프리즘' : '코인'} ${price}개에 구매`}
            accessibilityState={{ disabled: !!block || !!busy }}
          >
            {busy === pet.id ? (
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
        )}
      </View>
    );
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
        {loadError && !profile ? (
          <Text style={styles.balance}>잔액을 불러오지 못했어요</Text>
        ) : (
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{wallet.coins}c</Text>
            <PixelDiamond pixel={2} />
            <Text style={[styles.balance, { color: colors.text }]}>{wallet.prisms}</Text>
            <Text style={styles.hint}>
              {'  '}펫 {owned.length}/{PETS.length}
            </Text>
          </View>
        )}
        {message && (
          <Text style={[styles.hint, { color: message.ok ? colors.success : colors.error }]}>
            {message.text}
          </Text>
        )}

        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.section}>{section.title}</Text>
            <View style={styles.grid}>{section.pets.map(renderPet)}</View>
          </View>
        ))}

        <Text style={styles.section}>프리즘 → 코인</Text>
        <View style={styles.item}>
          <View style={styles.itemIcon}>
            <PixelDiamond pixel={3} />
          </View>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>코인으로 바꾸기</Text>
            <Text style={styles.itemDesc}>프리즘 1개 = {COINS_PER_PRISM}코인</Text>
          </View>
          <View style={styles.exchangeButtons}>
            {EXCHANGE_BUNDLES.map((amount) => {
              const blocked = !profile || !!exchangeBlock(wallet.prisms, amount);
              return (
                <Pressable
                  key={amount}
                  style={[styles.buyButton, (blocked || busy) && styles.buyButtonDisabled]}
                  onPress={() =>
                    run(
                      'exchange',
                      () => exchangePrisms(amount),
                      `프리즘 ${amount}개를 ${amount * COINS_PER_PRISM}코인으로 바꿨어요`
                    )
                  }
                  disabled={blocked || !!busy}
                  accessibilityRole="button"
                  accessibilityLabel={`프리즘 ${amount}개를 ${amount * COINS_PER_PRISM}코인으로 바꾸기`}
                  accessibilityState={{ disabled: blocked || !!busy }}
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
            <Text style={styles.itemDesc}>스토어 출시 때 열려요 · 지금은 펫이 출석마다 캐요</Text>
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
    balance: { fontSize: 15, fontWeight: '700', color: colors.accent, fontFamily: fonts.mono },
    section: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    // 2열 격자 — 카드 두 개가 한 줄을 반씩 나눠 쓴다
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    card: {
      width: '48%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 4,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.sm,
    },
    portraitBox: {
      backgroundColor: '#2a2533',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    name: { fontSize: 13, fontWeight: '700', color: colors.text },
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
    itemText: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
    itemDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    buyButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minWidth: 72,
      alignItems: 'center',
    },
    buyButtonDisabled: { opacity: 0.4 },
    boughtBadge: {
      borderWidth: 1,
      borderColor: colors.success,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      minWidth: 72,
      alignItems: 'center',
    },
    boughtText: { fontSize: 12, fontWeight: '700', color: colors.success },
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
