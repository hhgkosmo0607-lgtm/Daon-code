import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '../../../shared/components/BottomSheet';
import { useToast } from '../../../shared/components/Toast';
import { exchangePrisms, purchasePet } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { PetPortrait } from '../../pet/components/PetPortrait';
import { PixelCoin } from '../../pet/components/PixelCoin';
import { PixelDiamond } from '../../pet/components/PixelDiamond';
import { POINTS_PER_PRISM, PER_POWER_PER_HOUR, TEAM_MAX } from '../../pet/domain/mining';
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
 * 카드를 누르면 아래에서 확인 시트가 올라오고, "구매하기"를 눌러야 산다 (실수로 사는 것 방지).
 * 결과는 토스트로 알린다. 프리즘은 코인으로 바꿀 수 있고, 프리즘 충전(현금 결제)은
 * 스토어 출시 때 붙인다. (daon-content/재화_경제.md)
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
    .map(([, pets]) => ({
      title: [...new Set(pets.map((p) => SPECIES_LABEL[p.species] ?? p.species))].join(' · '),
      pets,
    }));
  return [{ title: '프리즘 펫 · 3배로 캐요', pets: prism }, ...coinSections];
}

const SECTIONS = buildSections();

/** 이 펫이 팀에 있으면 하루에 더 캐는 프리즘 */
const perDayOf = (pet: PetDef) => (pet.power * PER_POWER_PER_HOUR * 24) / POINTS_PER_PRISM;

function Price({ pet, styles }: { pet: PetDef; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.priceRow}>
      {pet.currency === 'prism' ? <PixelDiamond pixel={1.5} /> : <PixelCoin pixel={1.5} />}
      <Text style={styles.priceText}>{petPrice(pet)}</Text>
    </View>
  );
}

export function ShopScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, reload } = useUserProgress();
  const toast = useToast();

  const [selected, setSelected] = useState<PetDef | null>(null);
  const [busy, setBusy] = useState(false);

  const wallet = { coins: profile?.coins ?? 0, prisms: profile?.prisms ?? 0 };
  const owned = profile?.owned_pets ?? [DEFAULT_PET_ID];
  const teamFull = (profile?.team_pets.length ?? 1) >= TEAM_MAX;

  const buy = async (pet: PetDef) => {
    setBusy(true);
    try {
      await purchasePet(pet.id);
      await reload();
      setSelected(null);
      toast.show(
        teamFull ? `${pet.label} · 데려왔어요 (팀은 꽉 차 있어요)` : `${pet.label} · 팀에 들어왔어요`
      );
    } catch (e) {
      toast.show(e instanceof Error ? e.message : '구매하지 못했어요', 'error');
    } finally {
      setBusy(false);
    }
  };

  const exchange = async (amount: number) => {
    setBusy(true);
    try {
      await exchangePrisms(amount);
      await reload();
      toast.show(`프리즘 ${amount}개 → 코인 ${amount * COINS_PER_PRISM}개`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : '바꾸지 못했어요', 'error');
    } finally {
      setBusy(false);
    }
  };

  const renderCard = (pet: PetDef) => {
    const bought = owned.includes(pet.id);
    const priceLabel = `${pet.currency === 'prism' ? '프리즘' : '코인'} ${petPrice(pet)}개`;
    return (
      <Pressable
        key={pet.id}
        style={({ pressed }) => [
          styles.card,
          pet.currency === 'prism' && styles.cardPrism,
          bought && styles.cardOwned,
          pressed && styles.pressed,
        ]}
        onPress={() => setSelected(pet)}
        accessibilityRole="button"
        accessibilityLabel={`${pet.label}, ${bought ? '보유 중' : priceLabel}`}
      >
        <View style={styles.portraitBox}>
          <PetPortrait petId={pet.id} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {pet.label}
        </Text>
        {bought ? <Text style={styles.ownedTag}>보유</Text> : <Price pet={pet} styles={styles} />}
      </Pressable>
    );
  };

  // 확인 시트 내용
  const sheet = (() => {
    if (!selected) return null;
    const bought = owned.includes(selected.id);
    const block = profile ? petPurchaseBlock(wallet, owned, selected) : 'not_enough_coins';
    const price = petPrice(selected);
    const lack = selected.currency === 'prism' ? price - wallet.prisms : price - wallet.coins;
    return (
      <>
        <View style={styles.sheetHead}>
          <View style={styles.sheetPortrait}>
            <PetPortrait petId={selected.id} pixel={3} />
          </View>
          <View style={styles.sheetInfo}>
            <Text style={styles.sheetName}>{selected.label}</Text>
            <Text style={styles.sheetDesc}>
              팀에 넣으면 하루 프리즘 약 {perDayOf(selected).toFixed(1)}개를 더 캐요
              {selected.power > 1 ? ' · 일반 펫의 3배' : ''}
            </Text>
            <Price pet={selected} styles={styles} />
          </View>
        </View>
        {bought ? (
          <Text style={styles.sheetNote}>이미 가진 펫이에요</Text>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.primary,
              (block || busy) && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={() => buy(selected)}
            disabled={!!block || busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!block || busy }}
          >
            {busy ? (
              <ActivityIndicator color={getReadableTextColor(colors.accent)} />
            ) : (
              <Text style={styles.primaryText}>
                {block === 'not_enough_coins'
                  ? `코인 ${lack}개 더 필요해요`
                  : block === 'not_enough_prisms'
                    ? `프리즘 ${lack}개 더 필요해요`
                    : '구매하기'}
              </Text>
            )}
          </Pressable>
        )}
        <Pressable
          style={styles.secondary}
          onPress={() => setSelected(null)}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>닫기</Text>
        </Pressable>
      </>
    );
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>상점</Text>
        <View
          style={styles.wallet}
          accessibilityLabel={`코인 ${wallet.coins}개, 프리즘 ${wallet.prisms}개`}
        >
          <PixelCoin pixel={1.5} />
          <Text style={styles.walletText}>{wallet.coins}</Text>
          <PixelDiamond pixel={1.5} />
          <Text style={styles.walletText}>{wallet.prisms}</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>{section.pets.map(renderCard)}</View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프리즘 → 코인</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>프리즘 1개 = 코인 {COINS_PER_PRISM}개</Text>
            {EXCHANGE_BUNDLES.map((amount) => {
              const blocked = !profile || !!exchangeBlock(wallet.prisms, amount) || busy;
              return (
                <Pressable
                  key={amount}
                  style={({ pressed }) => [
                    styles.chip,
                    blocked && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => exchange(amount)}
                  disabled={blocked}
                  accessibilityRole="button"
                  accessibilityLabel={`프리즘 ${amount}개를 코인 ${amount * COINS_PER_PRISM}개로`}
                >
                  <PixelDiamond pixel={1} />
                  <Text style={styles.chipText}>{amount}</Text>
                  <Text style={styles.chipArrow}>→</Text>
                  <PixelCoin pixel={1} />
                  <Text style={styles.chipText}>{amount * COINS_PER_PRISM}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프리즘 충전</Text>
          <Text style={styles.soon}>스토어 출시 때 열려요 · 지금은 팀 펫이 시간마다 캐요</Text>
        </View>
      </ScrollView>

      <BottomSheet visible={!!selected} onClose={() => !busy && setSelected(null)}>
        {sheet}
      </BottomSheet>
      {toast.element}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    wallet: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
    walletText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      fontFamily: fonts.mono,
      marginRight: spacing.xs,
    },
    close: { fontSize: 20, color: colors.textMuted },
    body: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
    // 2열 격자
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    card: {
      width: '48%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    cardPrism: { borderColor: colors.xp },
    cardOwned: { opacity: 0.55 },
    pressed: { opacity: 0.7 },
    portraitBox: {
      backgroundColor: '#2a2533',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    name: { fontSize: 13, fontWeight: '700', color: colors.text },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceText: { fontSize: 14, fontWeight: '800', color: colors.text, fontFamily: fonts.mono },
    ownedTag: { fontSize: 12, fontWeight: '700', color: colors.success },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    rowText: { flex: 1, minWidth: 140, fontSize: 13, color: colors.text },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    chipText: { fontSize: 13, fontWeight: '800', color: colors.text, fontFamily: fonts.mono },
    chipArrow: { fontSize: 12, color: colors.textMuted },
    soon: { fontSize: 13, color: colors.textMuted },
    disabled: { opacity: 0.4 },

    sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    sheetPortrait: { backgroundColor: '#2a2533', padding: spacing.sm },
    sheetInfo: { flex: 1, gap: 6 },
    sheetName: { fontSize: 18, fontWeight: '800', color: colors.text },
    sheetDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    sheetNote: {
      fontSize: 14,
      color: colors.success,
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    primary: { backgroundColor: colors.accent, paddingVertical: spacing.md, alignItems: 'center' },
    primaryText: { fontSize: 16, fontWeight: '800', color: getReadableTextColor(colors.accent) },
    secondary: { alignItems: 'center', paddingVertical: spacing.sm },
    secondaryText: { fontSize: 14, color: colors.textMuted },
  });
