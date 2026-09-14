import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../../shared/theme/theme';
import { calculateXp } from '../domain/scoring';
import type { Lesson } from '../domain/types';

/*
 * 레슨 완료 화면.
 *
 * 여기 표시되는 XP는 "예상치"다. 실제 지급은 서버(submitAnswer Edge Function)가
 * 다시 계산해서 확정한다. (기획서 아키텍처 원칙: 클라이언트 계산은 신뢰하지 않음)
 * Phase 4에서 이 화면이 서버 응답값을 받아 표시하도록 교체할 예정.
 */
interface Props {
  lesson: Lesson;
  correctCount: number;
  total: number;
}

export function LessonResultScreen({ lesson, correctCount, total }: Props) {
  const router = useRouter();

  // TODO(Phase 4): 아래 값들은 서버 응답으로 대체한다.
  const xp = calculateXp({
    correctCount,
    totalCount: total,
    alreadyCompleted: false,
    isAnonymous: false,
    reachesDailyGoalFirstTime: false,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>레슨 완료!</Text>
        <Text style={styles.subtitle}>{lesson.title}</Text>

        <View style={styles.stats}>
          <Stat label="획득 XP" value={`+${xp.total}`} />
          <Stat label="정답" value={`${correctCount}/${total}`} />
        </View>
      </View>

      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>계속하기</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
