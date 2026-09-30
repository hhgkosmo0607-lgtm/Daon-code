import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Profile } from '../../lesson/data/userRepository';
import { POINTS_PER_PRISM, TEAM_MAX, pointsPerHour } from '../domain/mining';
import { miningPower } from '../domain/petCatalog';
import { PixelDiamond } from './PixelDiamond';

/*
 * 광산(상단바 둘째 줄)을 누르면 펼쳐지는 패널 — 카드 세 칸.
 *   가진 프리즘 · 쌓인 프리즘(개수, 1개까지 남은 시간) · 팀(하루 채굴량, 펫 관리)
 * 팀 펫(최대 8마리)은 시간마다 알아서 캐고, 1개가 넘게 쌓이면 광산의 펫이 말풍선으로
 * "💎 N개 받기"를 띄운다. 프리즘은 %가 아니라 개수로 보여준다. (daon-content/재화_경제.md)
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
  pending,
}: {
  profile: Profile;
  colors: ThemeColors;
  lastCollect: LastCollect | null;
  /** 지금 쌓여 있는 프리즘 (소수) — mining.ts의 pendingPrisms */
  pending: number;
}) {
  const styles = createStyles(colors);
  const router = useRouter();

  const perHour = pointsPerHour(miningPower(profile.team_pets));
  const perDay = (perHour * 24) / POINTS_PER_PRISM;
  const ready = Math.floor(pending);
  // 다음 1개가 될 때까지 남은 시간 (소수 부분 기준)
  const hoursToNext = ((1 - (pending - ready)) * POINTS_PER_PRISM) / perHour;

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
        <View style={styles.big}>
          <PixelDiamond pixel={1.5} />
          <Text style={styles.bigText}>{pending.toFixed(1)}</Text>
        </View>
        <Text style={styles.cap}>쌓인 프리즘</Text>
        <Text style={[styles.foot, ready > 0 && { color: colors.success }]}>
          {ready > 0 ? `${ready}개 받을 수 있어요` : `1개까지 ${formatHours(hoursToNext)}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.bigText}>
          {profile.team_pets.length}/{TEAM_MAX}
        </Text>
        <Text style={styles.cap}>팀 · 하루 약 {perDay.toFixed(1)}개</Text>
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
