import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { feedPet } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Profile } from '../../lesson/data/userRepository';
import { FREEZE_MAX } from '../../shop/domain/shopItems';
import { MINE_PER_FREEZE, feedBlock, isWorking } from '../domain/mining';

/*
 * 광산(상단바 둘째 줄)을 누르면 펼쳐지는 먹이 패널.
 * 잔디·채굴 게이지·프리즈를 보여주고, 먹이 주기는 서버(feed-pet)가 처리한다.
 */

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const working = isWorking(profile.pet_working_until);
  const block = feedBlock(profile.grass, profile.freeze_count, FREEZE_MAX);
  const gauge = Math.min(profile.mine_progress, MINE_PER_FREEZE);

  const feed = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await feedPet();
      await onFed();
      setMessage({
        text:
          result.minted > 0
            ? `프리즈 ${result.minted}개를 캤어요!`
            : `냠냠 · 채굴 ${result.mineProgress}/${MINE_PER_FREEZE}`,
        ok: true,
      });
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
          <Text style={styles.line}>
            잔디 {profile.grass} · 채굴 {'▓'.repeat(gauge)}
            {'░'.repeat(MINE_PER_FREEZE - gauge)} {gauge}/{MINE_PER_FREEZE} · 프리즈{' '}
            {profile.freeze_count}/{FREEZE_MAX}
          </Text>
          <Text style={styles.sub}>
            {working
              ? `일하는 중 · ${hoursLeft(profile.pet_working_until!)}시간 남음`
              : '배고파서 쉬는 중 · 잔디를 주면 캐기 시작해요'}
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

      {block === 'no_grass' && !message && (
        <Text style={styles.sub}>잔디는 레슨을 풀면 하루 한 번 받아요</Text>
      )}
      {block === 'freeze_full' && !message && (
        <Text style={styles.sub}>프리즈가 가득 찼어요 · 쓰고 나면 다시 캘 수 있어요</Text>
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
