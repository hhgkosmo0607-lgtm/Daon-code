import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { catPrice } from '../../shop/domain/shopItems';
import { CatPortrait } from '../components/CatPortrait';
import { CAT_COLORS, ownedCoinCatCount } from '../domain/catSheet';

/*
 * 내 고양이 — 8색 중 가진 고양이와 아직 없는 고양이를 보여준다.
 * 가진 고양이는 전부 홈 광산에서 함께 일한다. 없는 고양이를 누르면 상점으로 간다.
 */
export function CatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useUserProgress();
  const owned = profile?.owned_cats ?? ['orange'];
  const coinCats = ownedCoinCatCount(owned);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          내 고양이 {owned.length}/{CAT_COLORS.length}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {CAT_COLORS.map((cat) => {
          const has = owned.includes(cat.id);
          const price = catPrice(cat.currency, coinCats);
          const priceLabel = cat.currency === 'prism' ? `프리즘 ${price}` : `${price}c`;
          return (
            <Pressable
              key={cat.id}
              style={[styles.card, has && styles.cardOwned]}
              onPress={has ? undefined : () => router.push('/shop')}
              disabled={has}
              accessibilityRole={has ? undefined : 'button'}
              accessibilityLabel={
                has ? `${cat.label} 고양이, 보유 중` : `${cat.label} 고양이, 상점에서 ${priceLabel}`
              }
            >
              <View style={styles.portraitBox}>
                <CatPortrait catId={cat.id} style={!has && styles.locked} />
              </View>
              <Text style={styles.name}>{cat.label}</Text>
              <Text style={[styles.sub, has && { color: colors.success }]}>
                {has ? '광산에서 일해요' : `${priceLabel} · 상점`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.footer}>
        가진 고양이는 모두 광산에서 함께 일해요 · 많을수록 많이 캐요
      </Text>
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
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: spacing.md,
      gap: spacing.sm,
    },
    card: {
      width: '23%',
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    cardOwned: { borderColor: colors.accent },
    portraitBox: {
      backgroundColor: '#2a2533',
      borderRadius: radius.sm,
      padding: 4,
      marginBottom: 4,
    },
    locked: { opacity: 0.2 },
    name: { fontSize: 13, fontWeight: '700', color: colors.text },
    sub: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.mono, marginTop: 2 },
    footer: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      padding: spacing.md,
    },
  });
