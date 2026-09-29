import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CheckInResult } from '../../../shared/lib/edgeFunctions';
import { fonts, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Profile } from '../../lesson/data/userRepository';
import { CAT_COLORS, miningPower } from '../domain/catSheet';
import { MINE_PER_PRISM, minePerCheckIn } from '../domain/mining';
import { PixelDiamond } from './PixelDiamond';

/*
 * 광산(상단바 둘째 줄)을 누르면 펼쳐지는 패널 — 채굴 게이지, 프리즘, 오늘 출석 보상.
 * 고양이는 따로 돌볼 필요 없이 매일 출석하면 알아서 캔다. (daon-content/재화_경제.md)
 */

/** 채굴 게이지를 5칸 ▓░ 바로 */
function gaugeBar(gauge: number): string {
  const cells = Math.floor((gauge * 5) / MINE_PER_PRISM);
  return '▓'.repeat(cells) + '░'.repeat(5 - cells);
}

/** 오늘 출석 보상 한 줄 (받은 게 없으면 null) */
export function checkInMessage(result: CheckInResult): string | null {
  if (result.gain <= 0) return null;
  const minted = result.minted > 0 ? ` · 프리즘 +${result.minted}` : '';
  return `출석 보상 · 고양이 ${result.cats}마리가 게이지 +${result.gain}${minted}`;
}

export function PetPanel({
  profile,
  colors,
  todayReward,
}: {
  profile: Profile;
  colors: ThemeColors;
  /** 오늘 출석으로 받은 보상 문구 (이번 실행에서 받았을 때만) */
  todayReward: string | null;
}) {
  const styles = createStyles(colors);
  const router = useRouter();
  const catCount = profile.owned_cats.length;
  const power = miningPower(profile.owned_cats);
  const gauge = profile.mine_progress;

  return (
    <View style={styles.panel}>
      <View style={styles.lineRow}>
        <Text style={styles.line}>
          채굴 {gaugeBar(gauge)} {gauge}/{MINE_PER_PRISM} ·{' '}
        </Text>
        <PixelDiamond pixel={1.5} />
        <Text style={styles.line}> {profile.prisms}</Text>
      </View>
      <Text style={styles.sub}>
        매일 출석하면 고양이 {catCount}마리가 게이지 +{minePerCheckIn(power)} · 가득 차면 프리즘 1개
      </Text>
      {todayReward && <Text style={[styles.sub, { color: colors.success }]}>{todayReward}</Text>}
      <Pressable
        onPress={() => router.push('/cats')}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="내 고양이 보기"
      >
        <Text style={[styles.sub, { color: colors.accent }]}>
          내 고양이 {catCount}/{CAT_COLORS.length} · 많을수록 많이 캐요 ›
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lineRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    line: { fontSize: 12, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
    sub: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono, marginTop: 2 },
  });
