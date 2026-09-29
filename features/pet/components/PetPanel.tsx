import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { feedPet } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Profile } from '../../lesson/data/userRepository';
import { FREEZE_MAX } from '../../shop/domain/shopItems';
import { CAT_COLORS } from '../domain/catSheet';
import { MINE_PER_FREEZE, feedBlock, isWorking, minePerGrass } from '../domain/mining';
import { PixelDiamond } from './PixelDiamond';

/*
 * 광산(상단바 둘째 줄)을 누르면 펼쳐지는 먹이 패널.
 * 잔디·채굴 게이지·프리즘을 보여주고, 먹이 주기는 서버(feed-pet)가 처리한다.
 */

/** 채굴 게이지를 5칸 ▓░ 바로 */
function gaugeBar(gauge: number): string {
  const cells = Math.floor((gauge * 5) / MINE_PER_FREEZE);
  return '▓'.repeat(cells) + '░'.repeat(5 - cells);
}

function hoursLeft(until: string): number {
  return Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 3_600_000));
}

export function PetPanel({
  profile,
  colors,
  onFed,
}: {
  profile: Profile;
  colors: ThemeColors;
  onFed: () => Promise<void> | void;
}) {
  const styles = createStyles(colors);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const working = isWorking(profile.pet_working_until);
  const block = feedBlock(profile.grass);
  const catCount = profile.owned_cats.length;
  const gauge = Math.min(profile.mine_progress, MINE_PER_FREEZE);

  const feed = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await feedPet();
      await onFed();
      const parts = [`고양이 ${catCount}마리가 게이지 +${result.gain}`];
      if (result.minted > 0) parts.push(`프리즘 ${result.minted}개를 캤어요!`);
      if (result.overflowCoins > 0) parts.push(`프리즘이 가득이라 +${result.overflowCoins}코인`);
      setMessage({ text: parts.join(' · '), ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '먹이를 주지 못했어요', ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={styles.lineRow}>
            <Text style={styles.line}>
              잔디 {profile.grass} · 채굴 {gaugeBar(gauge)} {gauge}/{MINE_PER_FREEZE} ·{' '}
            </Text>
            <PixelDiamond pixel={1.5} />
            <Text style={styles.line}>
              {' '}
              {profile.freeze_count}/{FREEZE_MAX}
            </Text>
          </View>
          <Text style={styles.sub}>
            {working
              ? `일하는 중 · ${hoursLeft(profile.pet_working_until!)}시간 남음`
              : '배고파서 쉬는 중 · 잔디를 주면 캐기 시작해요'}
            {` · 먹이 1개 = 게이지 +${minePerGrass(catCount)}`}
          </Text>
        </View>
        <Pressable
          style={[styles.button, (block || busy) && styles.buttonDisabled]}
          onPress={feed}
          disabled={!!block || busy}
          accessibilityRole="button"
          accessibilityLabel="고양이에게 잔디 먹이기"
          accessibilityState={{ disabled: !!block || busy }}
        >
          {busy ? (
            <ActivityIndicator color={getReadableTextColor(colors.accent)} />
          ) : (
            <Text style={styles.buttonText}>먹이</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/cats')}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="내 고양이 보기"
      >
        <Text style={[styles.sub, { color: colors.accent }]}>
          내 고양이 {profile.owned_cats.length}/{CAT_COLORS.length} ›
        </Text>
      </Pressable>
      {block === 'no_grass' && !message && (
        <Text style={styles.sub}>잔디는 매일 앱에 들어오면 하루 한 번 받아요</Text>
      )}
      {message && (
        <Text style={[styles.sub, { color: message.ok ? colors.success : colors.error }]}>
          {message.text}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 4,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    info: { flex: 1 },
    lineRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    line: { fontSize: 12, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
    sub: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono, marginTop: 2 },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minWidth: 56,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { fontSize: 13, fontWeight: '800', color: getReadableTextColor(colors.accent) },
  });
