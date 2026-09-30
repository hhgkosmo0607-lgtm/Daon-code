import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Profile } from '../../lesson/data/userRepository';
import { POINTS_PER_PRISM, TEAM_MAX, hoursToNextPrism, pointsPerHour } from '../domain/mining';
import { miningPower } from '../domain/petCatalog';
import { PixelDiamond } from './PixelDiamond';

/*
 * 광산(상단바 둘째 줄)을 누르면 펼쳐지는 패널 — 카드 세 칸.
 *   가진 프리즘 · 다음 프리즘(게이지 %, 남은 시간) · 팀(시간당 채굴, 펫 관리)
 * 팀 펫(최대 8마리)은 시간마다 알아서 캐고, 앱을 켜면 쌓인 만큼 받는다. (daon-content/재화_경제.md)
 */

/** 이번 실행에서 마지막으로 받은 채굴 */
export interface LastCollect {
  hours: number;
  gained: number;
  minted: number;
}

/** 남은 시간을 "약 16시간" / "약 40분" / "곧"으로 */
function formatHours(hours: number): string {
  if (hours < 1 / 60) return '곧';
  if (hours < 1) return `약 ${Math.round(hours * 60)}분`;
  if (hours < 48) return `약 ${Math.round(hours)}시간`;
  return `약 ${Math.round(hours / 24)}일`;
}

export function PetPanel({
  profile,
  colors,
  lastCollect,
}: {
  profile: Profile;
  colors: ThemeColors;
  lastCollect: LastCollect | null;
}) {
  const styles = createStyles(colors);
  const router = useRouter();

  const power = miningPower(profile.team_pets);
  const points = Number(profile.mine_points);
  const percent = Math.floor((points / POINTS_PER_PRISM) * 100);
  const perHour = pointsPerHour(power);

  return (
    <View style={styles.panel}>
      <View style={styles.card}>
        <View style={styles.big}>
          <PixelDiamond pixel={1.5} />
          <Text style={styles.bigText}>{profile.prisms}</Text>
        </View>
        <Text style={styles.cap}>가진 프리즘</Text>
        {lastCollect && lastCollect.minted > 0 ? (
          <Text style={[styles.foot, { color: colors.success }]}>+{lastCollect.minted} 방금</Text>
        ) : (
          <Text style={styles.foot}> </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.bigText}>{percent}%</Text>
        <Text style={styles.cap}>다음 프리즘</Text>
        <Text style={styles.foot}>{formatHours(hoursToNextPrism(points, power))}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.bigText}>
          {profile.team_pets.length}/{TEAM_MAX}
        </Text>
        <Text style={styles.cap}>팀 · 시간당 +{perHour.toFixed(1)}%</Text>
        <Pressable
          style={styles.manage}
          onPress={() => router.push('/pets')}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="펫 관리"
        >
          <Text style={styles.manageText}>펫 관리</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    card: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: spacing.sm,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
    },
    big: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bigText: { fontSize: 16, fontWeight: '800', color: colors.text, fontFamily: fonts.mono },
    cap: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
    foot: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono },
    manage: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    manageText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  });
