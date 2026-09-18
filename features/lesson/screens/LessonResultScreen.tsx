import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SubmitAnswerResult } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Lesson } from '../domain/types';

/*
 * 레슨 완료 화면.
 *
 * 여기 표시되는 XP·스트릭은 submitAnswer Edge Function이 서버에서 확정한 값이다.
 * (기획서 아키텍처 원칙: 클라이언트 계산은 신뢰하지 않음)
 */
interface Props {
  lesson: Lesson;
  result: SubmitAnswerResult;
  /** 이번 레슨에서 틀린 문제 수. 0이면 "바로 다시 풀기" 버튼을 안 보여준다 */
  wrongCount: number;
  onRetryWrong: () => void;
}

export function LessonResultScreen({ lesson, result, wrongCount, onRetryWrong }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>레슨 완료!</Text>
        <Text style={styles.subtitle}>{lesson.title}</Text>

        <View style={styles.stats}>
          <Stat label="획득 XP" value={`+${result.xp.total}`} />
          <Stat label="정답" value={`${result.correctCount}/${result.totalCount}`} />
          <Stat label="스트릭" value={`🔥 ${result.streak.streak}`} />
        </View>

        {result.alreadyCompleted && (
          <Text style={styles.note}>이미 완료한 레슨이라 XP는 지급되지 않았어요</Text>
        )}
      </View>

      {wrongCount > 0 ? (
        <>
          <Pressable style={styles.button} onPress={onRetryWrong}>
            <Text style={styles.buttonText}>틀린 문제 {wrongCount}개 바로 풀기</Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={() => router.replace('/')}>
            <Text style={styles.skipButtonText}>건너뛰고 계속하기</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>계속하기</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    emoji: { fontSize: 56 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
    stats: { flexDirection: 'row', gap: spacing.md },
    stat: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      minWidth: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.accent },
    statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    note: { fontSize: 13, color: colors.textMuted, marginTop: spacing.lg },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    buttonText: { color: getReadableTextColor(colors.accent), fontSize: 16, fontWeight: '700' },
    skipButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    skipButtonText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  });
